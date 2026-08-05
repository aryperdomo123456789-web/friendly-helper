
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const listSupportThreads = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await (supabaseAdmin
      .from('support_threads' as any)
      .select('*, profile:user_id(username, display_name)')
      .order('last_message_at', { ascending: false }) as any);

    if (error) throw error;
    return data;
  });

export const getOrCreateThread = createServerFn({ method: "POST" })
  .validator((data: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { userId } }) => {
    // Try to find existing
    const { data: existing } = await (supabaseAdmin
      .from('support_threads' as any)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as any);

    if (existing) return existing;

    // Create new
    const { data, error } = await (supabaseAdmin
      .from('support_threads' as any)
      .insert([{ user_id: userId }])
      .select()
      .single() as any);

    if (error) throw error;
    return data;
  });

export const markThreadRead = createServerFn({ method: "POST" })
  .validator((data: { threadId: string, isOwner: boolean }) => z.object({
    threadId: z.string().uuid(),
    isOwner: z.boolean()
  }).parse(data))
  .handler(async ({ data }) => {
    const update = data.isOwner ? { unread_count_owner: 0 } : { unread_count_user: 0 };
    const { error } = await (supabaseAdmin
      .from('support_threads' as any)
      .update(update)
      .eq('id', data.threadId) as any);
    
    if (error) throw error;
    return { success: true };
  });
