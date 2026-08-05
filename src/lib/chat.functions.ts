import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function deriveSupportProtocol(thread: any): string {
  if (thread?.protocol && String(thread.protocol).trim()) {
    return String(thread.protocol).trim();
  }
  const suffix = String(thread?.id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
  return suffix ? `SUP-${suffix}` : `SUP-00000000`;
}

async function assertOwner(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso restrito ao dono do sistema");
}

async function canAccessThread(supabase: any, userId: string, threadId: string) {
  const { data: thread, error } = await supabase
    .from("support_threads")
    .select("id, user_id")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!thread) throw new Error("Conversa não encontrada");

  if (thread.user_id === userId) return thread;
  await assertOwner(supabase, userId);
  return thread;
}

export const listSupportThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin
      .from("support_threads" as any)
      .select("*")
      .order("last_message_at", { ascending: false }) as any);

    if (error) throw error;

    const threads = (data ?? []) as any[];
    if (threads.length === 0) return threads;

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name")
      .in("id", threads.map((t) => t.user_id));

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return threads.map((t) => ({ ...t, protocol: deriveSupportProtocol(t), profile: map.get(t.user_id) ?? null }));
  });

export const getOrCreateThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { userId }, context }) => {
    if (context.userId !== userId) {
      await assertOwner(context.supabase, context.userId);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await (supabaseAdmin
      .from("support_threads" as any)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle() as any);

    if (existing) return existing;

    const { data, error } = await (supabaseAdmin
      .from("support_threads" as any)
      .insert([{ user_id: userId }])
      .select()
      .single() as any);

    if (error) throw error;
    return { ...data, protocol: deriveSupportProtocol(data) };
  });

export const markThreadRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; isOwner: boolean }) =>
    z.object({
      threadId: z.string().uuid(),
      isOwner: z.boolean(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    const update = data.isOwner
      ? { unread_count_owner: 0 }
      : thread.user_id === context.userId
        ? { unread_count_user: 0 }
        : null;

    if (!update) throw new Error("Você não pode marcar esta conversa como lida");

    const { error } = await (supabaseAdmin
      .from("support_threads" as any)
      .update(update)
      .eq("id", data.threadId) as any);

    if (error) throw error;
    return { success: true };
  });

export const sendSupportAutoReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; content: string }) =>
    z.object({
      threadId: z.string().uuid(),
      content: z.string().min(1),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);

    const { data: message, error } = await (supabaseAdmin
      .from("support_messages" as any)
      .insert([{
        thread_id: data.threadId,
        sender_id: null,
        content: data.content,
      }])
      .select()
      .single() as any);

    if (error) throw error;

    const { error: updateError } = await (supabaseAdmin
      .from("support_threads" as any)
      .update({
        last_message: data.content,
        last_message_at: new Date().toISOString(),
        unread_count_user: (thread.unread_count_user || 0) + 1,
      })
      .eq("id", data.threadId) as any);

    if (updateError) throw updateError;
    return message;
  });

export const sendSupportMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { content: string }) =>
    z.object({
      content: z.string().min(1),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    let thread: any = null;
    const { data: existingThread, error: threadError } = await (supabaseAdmin
      .from("support_threads" as any)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle() as any);

    if (threadError) throw threadError;
    thread = existingThread;

    if (!thread) {
      const { data: createdThread, error: createThreadError } = await (supabaseAdmin
        .from("support_threads" as any)
        .insert([{ user_id: userId }])
        .select()
        .single() as any);

      if (createThreadError) throw createThreadError;
      thread = createdThread;
    }

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const { data: sameDayMessages, error: sameDayError } = await (supabaseAdmin
      .from("support_messages" as any)
      .select("id")
      .eq("thread_id", thread.id)
      .eq("sender_id", context.userId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()) as any);

    if (sameDayError) throw sameDayError;

    const shouldAutoReply = (sameDayMessages ?? []).length === 0;

    const { data: userMessage, error: userMessageError } = await (supabaseAdmin
      .from("support_messages" as any)
      .insert([{
        thread_id: thread.id,
        sender_id: userId,
        content: data.content,
      }])
      .select()
      .single() as any);

    if (userMessageError) throw userMessageError;

    let autoReply: any = null;

    if (shouldAutoReply) {
      const { data: configData, error: configError } = await supabaseAdmin
        .from("app_config")
        .select("config")
        .maybeSingle();
      if (configError) throw configError;

      const config = (configData?.config as any) || {};
      const autoReplyMsg = config.support_auto_reply || "Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar.";

      const { data: autoReplyData, error: autoReplyError } = await (supabaseAdmin
        .from("support_messages" as any)
        .insert([{
          thread_id: thread.id,
          sender_id: null,
          content: autoReplyMsg,
        }])
        .select()
        .single() as any);

      if (autoReplyError) throw autoReplyError;
      autoReply = autoReplyData;
    }

    const { error: updateError } = await (supabaseAdmin
      .from("support_threads" as any)
      .update({
        last_message: autoReply?.content ?? data.content,
        last_message_at: new Date().toISOString(),
        unread_count_owner: (thread.unread_count_owner || 0) + 1,
        unread_count_user: shouldAutoReply ? (thread.unread_count_user || 0) + 1 : (thread.unread_count_user || 0),
      })
      .eq("id", thread.id) as any);

    if (updateError) throw updateError;
    return { thread: { ...thread, protocol: deriveSupportProtocol(thread) }, userMessage, autoReply };
  });
