
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SubscriptionPlan } from "./types";

export const getPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });

    if (error) throw error;
    return (data as any) as SubscriptionPlan[];
  });

export const savePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => 
    z.object({
      id: z.string().optional(),
      name: z.string(),
      price: z.number(),
      duration_value: z.number(),
      duration_unit: z.enum(["days", "hours", "minutes"]),
      max_connections: z.number(),
    }).parse(input)
  )
  .handler(async ({ data: input, context }) => {
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

    if (id) {
      const { error } = await context.supabase
        .from("subscription_plans")
        .update(dbData)
        .eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("subscription_plans")
        .insert(dbData);
      if (error) throw error;
    }

    return { success: true };
  });

export const deletePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data: input, context }) => {
    const { error } = await context.supabase
      .from("subscription_plans")
      .delete()
      .eq("id", input.id);

    if (error) throw error;
    return { success: true };
  });