import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertOwner(supabase: any, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]);
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Acesso restrito à área administrativa.");
}

const paymentStatus = z.enum(["all", "pending", "processing", "approved", "rejected", "cancelled", "refunded", "chargeback", "expired", "error", "simulated"]);
const deletablePaymentStatus = ["pending", "rejected", "cancelled", "expired", "error", "simulated"] as const;

export const listAdminPaymentsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({
    page: z.number().int().min(1),
    page_size: z.number().int().min(1).max(100),
    status: paymentStatus.default("all"),
    search: z.string().trim().max(120).default(""),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    let query = supabaseAdmin.from("payments").select("id,user_id,plan_id,provider,provider_payment_id,provider_preference_id,external_reference,status,amount,currency,webhook_received_at,approved_at,last_error,created_at,updated_at", { count: "exact" });
    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.search) {
      const escaped = data.search.replace(/[,()]/g, "");
      query = query.or("provider_payment_id.ilike.%" + escaped + "%,provider_preference_id.ilike.%" + escaped + "%,external_reference.ilike.%" + escaped + "%");
    }
    const from = (data.page - 1) * data.page_size;
    const { data: rows, count, error } = await query.order("created_at", { ascending: false }).range(from, from + data.page_size - 1);
    if (error) throw error;
    const items = (rows ?? []) as any[];
    const userIds = [...new Set(items.map((item) => item.user_id).filter(Boolean))];
    const planIds = [...new Set(items.map((item) => item.plan_id).filter(Boolean))];
    const [{ data: profiles }, { data: plans }] = await Promise.all([
      userIds.length ? supabaseAdmin.from("profiles").select("id,username,display_name").in("id", userIds) : Promise.resolve({ data: [] }),
      planIds.length ? supabaseAdmin.from("subscription_plans").select("id,name").in("id", planIds) : Promise.resolve({ data: [] }),
    ]);
    const profileById = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
    const planById = new Map((plans ?? []).map((plan: any) => [plan.id, plan]));
    return { items: items.map((item) => ({ ...item, profile: profileById.get(item.user_id) ?? null, plan: planById.get(item.plan_id) ?? null })), total: count ?? 0, page: data.page, page_size: data.page_size };
  });

export const cleanupAdminPaymentOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({
    before: z.string().datetime(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { data: deleted, error } = await supabaseAdmin.from("payments").delete().eq("status", "pending").lt("created_at", data.before).select("id,status");
    if (error) throw error;
    const count = deleted?.length ?? 0;
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId,
      action: "payment_orders_cleanup",
      entity_type: "payments",
      details: { before: data.before, status: "pending", deleted_count: count },
      source: "admin-payments.functions",
    });
    if (auditError) throw auditError;
    return { success: true, count };
  });

export const deleteSelectedAdminPaymentOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({
    selectedPaymentIds: z.array(z.string().uuid()).min(1).max(100),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);

    const { data: candidates, error: candidateError } = await supabaseAdmin
      .from("payments")
      .select("id,user_id,status,approved_at")
      .in("id", data.selectedPaymentIds);
    if (candidateError) throw candidateError;

    const candidateRows = (candidates ?? []) as Array<{ id: string; user_id: string; status: string; approved_at: string | null }>;
    const userIds = [...new Set(candidateRows.map((payment) => payment.user_id).filter(Boolean))];
    const { data: accessRows, error: accessError } = userIds.length
      ? await supabaseAdmin.from("user_server_access").select("user_id").in("user_id", userIds)
      : { data: [], error: null };
    if (accessError) throw accessError;

    const usersWithAccess = new Set((accessRows ?? []).map((row: { user_id: string }) => row.user_id));
    const eligibleIds = candidateRows
      .filter((payment) => deletablePaymentStatus.includes(payment.status as (typeof deletablePaymentStatus)[number]))
      .filter((payment) => !payment.approved_at)
      .filter((payment) => payment.status === "pending" || !usersWithAccess.has(payment.user_id))
      .map((payment) => payment.id);

    if (!eligibleIds.length) {
      return { success: true, deletedCount: 0, skippedCount: data.selectedPaymentIds.length };
    }

    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from("payments")
      .delete()
      .in("id", eligibleIds)
      .in("status", [...deletablePaymentStatus])
      .is("approved_at", null)
      .select("id,status");
    if (deleteError) throw deleteError;

    const deletedCount = deleted?.length ?? 0;
    const { error: auditError } = await supabaseAdmin.from("audit_logs").insert({
      actor_user_id: context.userId,
      action: "selected_payment_orders_cleanup",
      entity_type: "payments",
      details: {
        requested_count: data.selectedPaymentIds.length,
        deleted_count: deletedCount,
        skipped_count: data.selectedPaymentIds.length - deletedCount,
        allowed_statuses: deletablePaymentStatus,
        pending_access_override: true,
      },
      source: "admin-payments.functions",
    });
    if (auditError) throw auditError;

    return {
      success: true,
      deletedCount,
      skippedCount: data.selectedPaymentIds.length - deletedCount,
    };
  });
