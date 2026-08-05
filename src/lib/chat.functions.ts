
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listSupportThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin
      .from('support_threads' as any)
      .select('*')
      .order('last_message_at', { ascending: false }) as any);

    if (error) throw error;

    const threads = (data ?? []) as any[];
    if (threads.length === 0) return threads;

    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name')
      .in('id', threads.map((t) => t.user_id));

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return threads.map((t) => ({ ...t, profile: map.get(t.user_id) ?? null }));
  });

export const getOrCreateThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { userId } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Try to find existing
    const { data: existing } = await (supabaseAdmin
      .from('support_threads' as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as any);

    if (existing) return existing;

    // Generate protocol: SUPPORT-YYYYMMDD-XXXX
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    const protocol = `SUP-${date}-${random}`;

    // Create new
    const { data, error } = await (supabaseAdmin
      .from('support_threads' as any)
      .insert([{ user_id: userId, protocol }])
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  });

export const markThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string, isOwner: boolean }) => z.object({
    threadId: z.string().uuid(),
    isOwner: z.boolean()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update = data.isOwner ? { unread_count_owner: 0 } : { unread_count_user: 0 };
    const { error } = await (supabaseAdmin
      .from('support_threads' as any)
      .update(update)
      .eq('id', data.threadId) as any);
    
    if (error) throw error;
    return { success: true };
  });
