
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SubscriptionPlan } from "./types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertOwner(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Acesso restrito à área administrativa.");
}

export const getPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) throw error;
    return (data as any) as SubscriptionPlan[];
  });

export const getPlansPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { page: number; page_size: number }) =>
    z.object({
      page: z.number().int().min(1),
      page_size: z.number().int().min(1).max(100),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { count, error: countError } = await context.supabase
      .from("subscription_plans")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / data.page_size));
    const page = Math.min(Math.max(data.page, 1), totalPages);
    const from = (page - 1) * data.page_size;
    const to = from + data.page_size - 1;

    const { data: rows, error } = await context.supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      items: (rows as any) as SubscriptionPlan[],
      total,
      page,
      page_size: data.page_size,
    };
  });

export const savePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => 
    z.object({
      id: z.string().optional(),
      name: z.string().trim().min(1, "O nome do plano é obrigatório.").max(80, "O nome do plano deve ter no máximo 80 caracteres."),
      price: z.number().finite().min(0),
      duration_value: z.number().finite().positive(),
      duration_unit: z.enum(["days", "hours", "minutes"]),
      max_connections: z.number().int().positive(),
      is_active: z.boolean().optional().default(true),
    }).parse(input)
  )
  .handler(async ({ data: input, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { id, ...data } = input;

    // We keep duration_days for DB compatibility if needed, but the UI uses value/unit
    let duration_days = data.duration_value;
    if (data.duration_unit === 'hours') {
      duration_days = Math.ceil(data.duration_value / 24);
    } else if (data.duration_unit === 'minutes') {
      duration_days = Math.ceil(data.duration_value / (24 * 60));
    }

    const dbData = {
      ...data,
      duration_days
    };
    let savedPlanId = id ?? null;

    if (id) {
      // RLS currently grants plan writes only to owner. Authorization is
      // already enforced by assertOwner for owner/admin, so use the server
      // client here to keep admin users from getting a silent no-op update.
      const { data: updated, error } = await supabaseAdmin
        .from("subscription_plans")
        .update(dbData)
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
      if (!updated?.id) throw new Error("Plano não encontrado ou não foi atualizado.");
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("subscription_plans")
        .insert(dbData)
        .select("id")
        .single();
      if (error) throw error;
      savedPlanId = created?.id ?? null;
    }

    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId,
      action: id ? "plan_update" : "plan_create",
      entity_type: "subscription_plan",
      entity_id: savedPlanId,
      source: "plans.functions",
      details: {
        name: data.name,
        price: data.price,
        duration_value: data.duration_value,
        duration_unit: data.duration_unit,
        max_connections: data.max_connections,
        is_active: data.is_active ?? true,
      },
    });
    if (auditError) throw auditError;
    return { success: true };
  });

export const setPlanStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) =>
    z.object({
      id: z.string().uuid(),
      is_active: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data: input, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { data: updated, error } = await supabaseAdmin
      .from("subscription_plans")
      .update({ is_active: input.is_active, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select("id, is_active")
      .single();
    if (error) throw error;
    if (!updated?.id) throw new Error("Plano não encontrado ou não foi atualizado.");

    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId,
      action: input.is_active ? "plan_activate" : "plan_deactivate",
      entity_type: "subscription_plan",
      entity_id: input.id,
      source: "plans.functions",
      details: { is_active: input.is_active },
    });
    if (auditError) throw auditError;
    return { success: true, is_active: updated.is_active };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({ id: z.string().uuid(), permanent: z.boolean().default(true) }).parse(input))
  .handler(async ({ data: input, context }) => {
    await assertOwner(context.supabase, context.userId);
    if (!input.permanent) {
      const { data: updated, error } = await supabaseAdmin
        .from("subscription_plans")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .select("id")
        .single();
      if (error) throw error;
      if (!updated?.id) throw new Error("Plano não encontrado ou não foi desativado.");
    } else {
      const dependencies = [
        { table: "profiles", label: "usuário(s)" },
        { table: "payments", label: "pagamento(s)" },
      ];
      const usedBy: string[] = [];
      for (const dependency of dependencies) {
        const { count, error } = await supabaseAdmin
          .from(dependency.table)
          .select("id", { count: "exact", head: true })
          .eq("plan_id", input.id);
        if (error) throw new Error("Não foi possível validar dependências em " + dependency.table + ".");
        if ((count ?? 0) > 0) usedBy.push(count + " " + dependency.label);
      }
      if (usedBy.length) {
        throw new Error("Não é possível excluir permanentemente: este plano possui " + usedBy.join(", ") + " vinculados. Desative-o para preservar o histórico.");
      }
      const { data: deleted, error } = await supabaseAdmin
        .from("subscription_plans")
        .delete()
        .eq("id", input.id)
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível excluir permanentemente este plano: " + error.message);
      if (!deleted?.id) throw new Error("Plano não encontrado ou já foi excluído.");
    }
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId,
      action: input.permanent ? "plan_delete" : "plan_deactivate",
      entity_type: "subscription_plan",
      entity_id: input.id,
      source: "plans.functions",
      details: { is_active: input.permanent ? null : false, permanent: input.permanent },
    });
    if (auditError) throw auditError;
    return { success: true };
  });
