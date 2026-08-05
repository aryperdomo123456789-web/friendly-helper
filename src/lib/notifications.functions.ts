import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin
      .from('notifications' as any)
      .select('*')
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false }) as any);

    if (error) throw error;
    return (data || []) as any[];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: id }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('id', id) as any);

    if (error) throw error;
    return { success: true };
  });

export const sendMassNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { title: string, content: string }) => z.object({
    title: z.string(),
    content: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (!profiles || profiles.length === 0) return { count: 0 };

    const notifications = profiles.map(p => ({
      user_id: p.id,
      title: data.title,
      content: data.content,
      type: 'mass'
    }));

    const { error } = await (supabaseAdmin
      .from('notifications' as any)
      .insert(notifications) as any);

    if (error) throw error;
    return { count: profiles.length };
  });
