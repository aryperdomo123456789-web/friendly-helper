import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUPPORT_IDLE_CLOSE_PROMPT_MS = 24 * 60 * 60 * 1000;

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
  if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}

async function canAccessThread(supabase: any, userId: string, threadId: string) {
  const { data: thread, error } = await supabase
    .from("support_threads")
    .select("id, user_id")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!thread) throw new Error("Conversa não encontrada.");

  if (thread.user_id === userId) return thread;
  await assertOwner(supabase, userId);
  return thread;
}

async function resolveLatestUserThread(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function resolveActiveUserThread(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("support_threads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "open")
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? null;
}

async function ensureProtocolForThread(supabaseAdmin: any, thread: any) {
  const protocol = deriveSupportProtocol(thread);
  if (thread?.protocol && String(thread.protocol).trim()) {
    return { ...thread, protocol };
  }

  const { data, error } = await supabaseAdmin
    .from("support_threads" as any)
    .update({ protocol })
    .eq("id", thread.id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return { ...(data ?? thread), protocol };
}

async function maybeInsertClosePrompt(supabaseAdmin: any, thread: any) {
  if (!thread || thread.status !== "open") return thread;

  const lastOwnerAt = thread.last_owner_message_at ? new Date(thread.last_owner_message_at).getTime() : 0;
  const lastUserAt = thread.last_user_message_at ? new Date(thread.last_user_message_at).getTime() : 0;
  if (!lastOwnerAt) return thread;
  if (lastUserAt > lastOwnerAt) return thread;

  const closurePromptAt = thread.closure_prompt_at ? new Date(thread.closure_prompt_at).getTime() : 0;
  if (closurePromptAt >= lastOwnerAt) return thread;

  const now = Date.now();
  if (now - lastOwnerAt < SUPPORT_IDLE_CLOSE_PROMPT_MS) return thread;

  const prompt = "O atendimento ficou sem resposta do cliente. Deseja encerrar este atendimento?";
  const { error: insertError } = await supabaseAdmin
    .from("support_messages" as any)
    .insert([{
      thread_id: thread.id,
      sender_id: null,
      content: prompt,
      message_type: "closure_prompt",
      metadata: {
        action: "close_ticket",
        idle_minutes: Math.round((now - lastOwnerAt) / 60000),
      },
    }]);

  if (insertError) throw insertError;

  const { error: updateError } = await supabaseAdmin
    .from("support_threads" as any)
    .update({
      closure_prompt_at: new Date().toISOString(),
      last_message: prompt,
      last_message_at: new Date().toISOString(),
      unread_count_user: (thread.unread_count_user || 0) + 1,
    })
    .eq("id", thread.id);

  if (updateError) throw updateError;

  return {
    ...thread,
    closure_prompt_at: new Date().toISOString(),
    last_message: prompt,
  };
}

async function createSupportThread(supabaseAdmin: any, userId: string) {
  const { data: createdThread, error } = await supabaseAdmin
    .from("support_threads" as any)
    .insert([{
      user_id: userId,
      status: "open",
      unread_count_owner: 0,
      unread_count_user: 0,
      last_message_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return ensureProtocolForThread(supabaseAdmin, createdThread);
}

async function closeSupportThreadInternal(
  supabaseAdmin: any,
  thread: any,
  contextUserId: string,
  closedByRole: "owner" | "client",
) {
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from("support_threads" as any)
    .update({
      status: "closed",
      closed_at: now,
      closed_by_user_id: contextUserId,
      closed_by_role: closedByRole,
      satisfaction_requested_at: now,
      closure_prompt_at: now,
      last_message: "Atendimento encerrado.",
      last_message_at: now,
    })
    .eq("id", thread.id);

  if (updateError) throw updateError;

  const { error: closedMessageError } = await supabaseAdmin
    .from("support_messages" as any)
    .insert([{
      thread_id: thread.id,
      sender_id: null,
      content: `Atendimento encerrado por ${closedByRole === "owner" ? "equipe de suporte" : "cliente"}.`,
      message_type: "thread_closed",
      metadata: {
        closed_by_role: closedByRole,
      },
    }]);

  if (closedMessageError) throw closedMessageError;

  const satisfactionPrompt = "Avalie seu atendimento de 1 a 5 para concluirmos este suporte.";
  const { error: satisfactionPromptError } = await supabaseAdmin
    .from("support_messages" as any)
    .insert([{
      thread_id: thread.id,
      sender_id: null,
      content: satisfactionPrompt,
      message_type: "satisfaction_prompt",
      metadata: {
        min_score: 1,
        max_score: 5,
      },
    }]);

  if (satisfactionPromptError) throw satisfactionPromptError;
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

export const listMySupportThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("support_threads" as any)
      .select("*")
      .eq("user_id", context.userId)
      .order("last_message_at", { ascending: false });

    if (error) throw error;
    const threads = (data ?? []) as any[];
    return threads.map((thread) => ({ ...thread, protocol: deriveSupportProtocol(thread) }));
  });

export const listSupportThreadsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { page: number; page_size: number }) =>
    z.object({
      page: z.number().int().min(1),
      page_size: z.number().int().min(1).max(100),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("support_threads")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / data.page_size));
    const page = Math.min(Math.max(data.page, 1), totalPages);
    const from = (page - 1) * data.page_size;
    const to = from + data.page_size - 1;

    const { data: threads, error } = await (supabaseAdmin
      .from("support_threads" as any)
      .select("*")
      .order("last_message_at", { ascending: false }) as any)
      .range(from, to);

    if (error) throw error;

    const rows = (threads ?? []) as any[];
    if (rows.length === 0) {
      return { items: [], total, page, page_size: data.page_size };
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name")
      .in("id", rows.map((t) => t.user_id));

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return {
      items: rows.map((t) => ({ ...t, protocol: deriveSupportProtocol(t), profile: map.get(t.user_id) ?? null })),
      total,
      page,
      page_size: data.page_size,
    };
  });

export const getOrCreateThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data: { userId }, context }) => {
    if (context.userId !== userId) {
      await assertOwner(context.supabase, context.userId);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await resolveActiveUserThread(supabaseAdmin, userId);
    if (existing) return ensureProtocolForThread(supabaseAdmin, existing);

    const latest = await resolveLatestUserThread(supabaseAdmin, userId);
    if (latest && latest.status !== "open") {
      return createSupportThread(supabaseAdmin, userId);
    }

    return createSupportThread(supabaseAdmin, userId);
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

    if (!update) throw new Error("Você não pode marcar esta conversa como lida.");

    const { error } = await (supabaseAdmin
      .from("support_threads" as any)
      .update(update)
      .eq("id", data.threadId) as any);

    if (error) throw error;
    return { success: true };
  });

export const listSupportMessagesPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; page: number; page_size: number }) =>
    z.object({
      threadId: z.string().uuid(),
      page: z.number().int().min(1),
      page_size: z.number().int().min(1).max(100),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    if (thread?.status === "open") {
      await maybeInsertClosePrompt(supabaseAdmin, thread);
    }

    const pageSize = data.page_size;
    const { count, error: countError } = await supabaseAdmin
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", data.threadId);

    if (countError) throw countError;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(data.page, 1), totalPages);
    const start = Math.max(total - page * pageSize, 0);
    const end = total === 0 ? -1 : Math.min(total - 1, start + pageSize - 1);

    if (end < start) {
      return {
        items: [] as any[],
        total,
        page,
        page_size: pageSize,
      };
    }

    const { data: items, error } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true })
      .range(start, end);

    if (error) throw error;

    return {
      items: items ?? [],
      total,
      page,
      page_size: pageSize,
    };
  });

export const closeSupportThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; closedByRole?: "owner" | "client" }) =>
    z.object({
      threadId: z.string().uuid(),
      closedByRole: z.enum(["owner", "client"]).optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    const closedByRole = data.closedByRole ?? (thread.user_id === context.userId ? "client" : "owner");
    await closeSupportThreadInternal(supabaseAdmin, thread, context.userId, closedByRole);

    return { success: true };
  });

export const respondToClosurePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; keepOpen: boolean }) =>
    z.object({
      threadId: z.string().uuid(),
      keepOpen: z.boolean(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await canAccessThread(context.supabase, context.userId, data.threadId);

    if (!data.keepOpen) {
      const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
      await closeSupportThreadInternal(supabaseAdmin, thread, context.userId, "client");
      return { success: true };
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("support_threads" as any)
      .update({
        closure_prompt_at: now,
      })
      .eq("id", data.threadId);

    if (updateError) throw updateError;

    const { error: noteError } = await supabaseAdmin
      .from("support_messages" as any)
      .insert([{
        thread_id: data.threadId,
        sender_id: null,
        content: "Cliente optou por manter o atendimento aberto.",
        message_type: "closure_response",
        metadata: {
          keep_open: true,
        },
      }]);

    if (noteError) throw noteError;

    return { success: true };
  });

export const submitSupportSatisfaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; score: number; note?: string | null }) =>
    z.object({
      threadId: z.string().uuid(),
      score: z.number().int().min(1).max(5),
      note: z.string().max(1000).nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    if (thread.user_id !== context.userId) {
      throw new Error("Apenas o cliente do atendimento pode avaliar a experiência.");
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("support_threads" as any)
      .update({
        satisfaction_score: data.score,
        satisfaction_note: data.note ?? null,
        satisfaction_submitted_at: now,
      })
      .eq("id", data.threadId);

    if (updateError) throw updateError;

    const { error: noteError } = await supabaseAdmin
      .from("support_messages" as any)
      .insert([{
        thread_id: data.threadId,
        sender_id: context.userId,
        content: `Avaliação registrada: ${data.score}/5`,
        message_type: "satisfaction_response",
        metadata: {
          score: data.score,
          note: data.note ?? null,
        },
      }]);

    if (noteError) throw noteError;
    return { success: true };
  });

export const getSupportStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("support_threads")
      .select("id, status, satisfaction_score, created_at, closed_at, last_message_at");

    if (error) throw error;

    const rows = (data ?? []) as any[];
    const distribution = [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: rows.filter((row) => Number(row.satisfaction_score) === score).length,
    }));
    const rated = rows.filter((row) => Number(row.satisfaction_score) >= 1 && Number(row.satisfaction_score) <= 5);
    const average =
      rated.length === 0
        ? 0
        : rated.reduce((acc, row) => acc + Number(row.satisfaction_score), 0) / rated.length;

    return {
      total_threads: rows.length,
      open_threads: rows.filter((row) => row.status === "open").length,
      closed_threads: rows.filter((row) => row.status === "closed").length,
      satisfaction_average: Number(average.toFixed(2)),
      satisfaction_count: rated.length,
      distribution,
    };
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
        message_type: "system_notification",
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

    let thread = await resolveActiveUserThread(supabaseAdmin, userId);
    if (!thread) {
      thread = await createSupportThread(supabaseAdmin, userId);
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
        message_type: "user_message",
        metadata: {
          cycle: "open",
        },
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
          message_type: "system_notification",
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
        last_user_message_at: new Date().toISOString(),
        status: "open",
        closure_prompt_at: null,
        unread_count_owner: (thread.unread_count_owner || 0) + 1,
        unread_count_user: shouldAutoReply ? (thread.unread_count_user || 0) + 1 : (thread.unread_count_user || 0),
      })
      .eq("id", thread.id) as any);

    if (updateError) throw updateError;
    return { thread: { ...thread, protocol: deriveSupportProtocol(thread) }, userMessage, autoReply };
  });
