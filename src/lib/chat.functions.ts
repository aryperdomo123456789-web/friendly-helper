import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getStatusAfterOwnerMessage,
  getStatusAfterUserMessage,
  normalizeSupportMessage,
  SUPPORT_MAX_MESSAGE_LENGTH,
  SUPPORT_MIN_MESSAGE_INTERVAL_MS,
  SUPPORT_DAILY_MESSAGE_LIMIT,
} from "@/lib/chat-policy";

const SUPPORT_IDLE_CLOSE_PROMPT_MS = 24 * 60 * 60 * 1000;

function supportMessageSchema() {
  return z.object({
    content: z.string().trim().min(1).max(SUPPORT_MAX_MESSAGE_LENGTH),
    clientMessageId: z.string().trim().min(8).max(128).optional(),
  });
}

async function findIdempotentMessage(supabaseAdmin: any, userId: string, clientMessageId?: string) {
  if (!clientMessageId) return null;
  const { data, error } = await supabaseAdmin
    .from("support_messages" as any)
    .select("*")
    .eq("client_message_id", clientMessageId)
    .eq("sender_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: string } | null)?.code === "23505";
}

async function enforceMessageRateLimit(supabaseAdmin: any, userId: string) {
  const now = Date.now();
  const recentSince = new Date(now - SUPPORT_MIN_MESSAGE_INTERVAL_MS).toISOString();
  const { count: recentCount, error: recentError } = await supabaseAdmin
    .from("support_messages" as any)
    .select("id", { count: "exact", head: true })
    .eq("sender_id", userId)
    .gte("created_at", recentSince);
  if (recentError) throw recentError;
  if ((recentCount ?? 0) > 0) {
    throw new Error("Aguarde alguns segundos antes de enviar outra mensagem.");
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: dailyCount, error: dailyError } = await supabaseAdmin
    .from("support_messages" as any)
    .select("id", { count: "exact", head: true })
    .eq("sender_id", userId)
    .gte("created_at", dayStart.toISOString());
  if (dailyError) throw dailyError;
  if ((dailyCount ?? 0) >= SUPPORT_DAILY_MESSAGE_LIMIT) {
    throw new Error("O limite diário de mensagens foi atingido. Tente novamente mais tarde.");
  }
}

function deriveSupportProtocol(thread: any): string {
  if (thread?.protocol && String(thread.protocol).trim()) {
    return String(thread.protocol).trim();
  }
  const suffix = String(thread?.id ?? "")
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
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
    .select("*")
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
  if (!thread || !["open", "pending_customer", "pending_support"].includes(String(thread.status)))
    return thread;

  const lastOwnerAt = thread.last_owner_message_at
    ? new Date(thread.last_owner_message_at).getTime()
    : 0;
  const lastUserAt = thread.last_user_message_at
    ? new Date(thread.last_user_message_at).getTime()
    : 0;
  if (!lastOwnerAt) return thread;
  if (lastUserAt > lastOwnerAt) return thread;

  const closurePromptAt = thread.closure_prompt_at
    ? new Date(thread.closure_prompt_at).getTime()
    : 0;
  if (closurePromptAt >= lastOwnerAt) return thread;

  const now = Date.now();
  if (now - lastOwnerAt < SUPPORT_IDLE_CLOSE_PROMPT_MS) return thread;

  const prompt = "O atendimento ficou sem resposta do cliente. Deseja encerrar este atendimento?";
  const { error: insertError } = await supabaseAdmin.from("support_messages" as any).insert([
    {
      thread_id: thread.id,
      sender_id: null,
      content: prompt,
      message_type: "closure_prompt",
      metadata: {
        action: "close_ticket",
        idle_minutes: Math.round((now - lastOwnerAt) / 60000),
      },
    },
  ]);

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
    .insert([
      {
        user_id: userId,
        status: "open",
        unread_count_owner: 0,
        unread_count_user: 0,
        last_message_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      const existing = await resolveActiveUserThread(supabaseAdmin, userId);
      if (existing) return ensureProtocolForThread(supabaseAdmin, existing);
    }
    throw error;
  }
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
      waiting_since: null,
      satisfaction_requested_at: now,
      closure_prompt_at: now,
      last_message: "Atendimento encerrado.",
      last_message_at: now,
    })
    .eq("id", thread.id);

  if (updateError) throw updateError;

  const { error: closedMessageError } = await supabaseAdmin.from("support_messages" as any).insert([
    {
      thread_id: thread.id,
      sender_id: null,
      content: `Atendimento encerrado por ${closedByRole === "owner" ? "equipe de suporte" : "cliente"}.`,
      message_type: "thread_closed",
      metadata: {
        closed_by_role: closedByRole,
      },
    },
  ]);

  if (closedMessageError) throw closedMessageError;

  const satisfactionPrompt = "Avalie seu atendimento de 1 a 5 para concluirmos este suporte.";
  const { error: satisfactionPromptError } = await supabaseAdmin
    .from("support_messages" as any)
    .insert([
      {
        thread_id: thread.id,
        sender_id: null,
        content: satisfactionPrompt,
        message_type: "satisfaction_prompt",
        metadata: {
          min_score: 1,
          max_score: 5,
        },
      },
    ]);

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
      .in(
        "id",
        threads.map((t) => t.user_id),
      );

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return threads.map((t) => ({
      ...t,
      protocol: deriveSupportProtocol(t),
      profile: map.get(t.user_id) ?? null,
    }));
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

export const updateSupportThreadOperations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      threadId: string;
      priority?: string;
      category?: string;
      status?: string;
      assignedToUserId?: string | null;
    }) =>
      z
        .object({
          threadId: z.string().uuid(),
          priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
          category: z
            .enum(["general", "access", "billing", "playback", "catalog", "technical", "other"])
            .optional(),
          status: z.enum(["open", "pending_support", "pending_customer", "closed"]).optional(),
          assignedToUserId: z.string().uuid().nullable().optional(),
        })
        .refine(
          (value) =>
            Object.keys(value).some(
              (key) => key !== "threadId" && value[key as keyof typeof value] !== undefined,
            ),
          {
            message: "Nenhuma alteração operacional foi informada.",
          },
        )
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    const update: Record<string, unknown> = {};
    if (data["priority"] !== undefined) update["priority"] = data["priority"];
    if (data["category"] !== undefined) update["category"] = data["category"];
    if (data["assignedToUserId"] !== undefined)
      update["assigned_to_user_id"] = data["assignedToUserId"];
    if (data["status"] !== undefined) {
      update["status"] = data["status"];
      update["waiting_since"] =
        data["status"] === "pending_customer" ? new Date().toISOString() : null;
    }

    if (data["assignedToUserId"]) {
      const { data: assignee, error: assigneeError } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .eq("user_id", data["assignedToUserId"])
        .in("role", ["owner", "admin"])
        .maybeSingle();
      if (assigneeError) throw assigneeError;
      if (!assignee) throw new Error("O responsável precisa ser owner ou admin.");
    }

    const { data: updated, error } = (await supabaseAdmin
      .from("support_threads" as any)
      .update(update)
      .eq("id", thread.id)
      .select("*")
      .single()) as any;
    if (error) throw error;
    return { ...updated, protocol: deriveSupportProtocol(updated) };
  });

export const listSupportThreadsPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      page: number;
      page_size: number;
      status?: string;
      priority?: string;
      search?: string;
    }) =>
      z
        .object({
          page: z.number().int().min(1),
          page_size: z.number().int().min(1).max(100),
          status: z.enum(["open", "pending_support", "pending_customer", "closed"]).optional(),
          priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
          search: z.string().trim().max(80).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let countQuery = supabaseAdmin
      .from("support_threads")
      .select("id", { count: "exact", head: true }) as any;
    let rowsQuery = supabaseAdmin
      .from("support_threads" as any)
      .select("*")
      .order("last_message_at", { ascending: false }) as any;

    if (data["status"]) {
      countQuery = countQuery.eq("status", data["status"]);
      rowsQuery = rowsQuery.eq("status", data["status"]);
    }
    if (data["priority"]) {
      countQuery = countQuery.eq("priority", data["priority"]);
      rowsQuery = rowsQuery.eq("priority", data["priority"]);
    }
    if (data["search"]) {
      countQuery = countQuery.ilike("protocol", `%${data["search"]}%`);
      rowsQuery = rowsQuery.ilike("protocol", `%${data["search"]}%`);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / data.page_size));
    const page = Math.min(Math.max(data.page, 1), totalPages);
    const from = (page - 1) * data.page_size;
    const to = from + data.page_size - 1;

    const { data: threads, error } = await rowsQuery.range(from, to);

    if (error) throw error;

    const rows = (threads ?? []) as any[];
    if (rows.length === 0) {
      return { items: [], total, page, page_size: data.page_size };
    }

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name")
      .in(
        "id",
        rows.map((t) => t.user_id),
      );

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return {
      items: rows.map((t) => ({
        ...t,
        protocol: deriveSupportProtocol(t),
        profile: map.get(t.user_id) ?? null,
      })),
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
    z
      .object({
        threadId: z.string().uuid(),
        isOwner: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    const isOwnerViewer = thread.user_id !== context.userId;
    const update = isOwnerViewer ? { unread_count_owner: 0 } : { unread_count_user: 0 };

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
    z
      .object({
        threadId: z.string().uuid(),
        page: z.number().int().min(1),
        page_size: z.number().int().min(1).max(100),
      })
      .parse(data),
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
    z
      .object({
        threadId: z.string().uuid(),
        closedByRole: z.enum(["owner", "client"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    const closedByRole = thread.user_id === context.userId ? "client" : "owner";
    await closeSupportThreadInternal(supabaseAdmin, thread, context.userId, closedByRole);

    return { success: true };
  });

export const respondToClosurePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; keepOpen: boolean }) =>
    z
      .object({
        threadId: z.string().uuid(),
        keepOpen: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    if (thread.user_id !== context.userId) {
      throw new Error("Apenas o cliente pode responder ao convite de encerramento.");
    }

    if (!data.keepOpen) {
      await closeSupportThreadInternal(supabaseAdmin, thread, context.userId, "client");
      return { success: true };
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("support_threads" as any)
      .update({
        closure_prompt_at: now,
        status: "pending_support",
        waiting_since: now,
      })
      .eq("id", data.threadId);

    if (updateError) throw updateError;

    const { error: noteError } = await supabaseAdmin.from("support_messages" as any).insert([
      {
        thread_id: data.threadId,
        sender_id: null,
        content: "Cliente optou por manter o atendimento aberto.",
        message_type: "closure_response",
        metadata: {
          keep_open: true,
        },
      },
    ]);

    if (noteError) throw noteError;

    return { success: true };
  });

export const submitSupportSatisfaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; score: number; note?: string | null }) =>
    z
      .object({
        threadId: z.string().uuid(),
        score: z.number().int().min(1).max(5),
        note: z.string().max(1000).nullable().optional(),
      })
      .parse(data),
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

    const { error: noteError } = await supabaseAdmin.from("support_messages" as any).insert([
      {
        thread_id: data.threadId,
        sender_id: context.userId,
        content: `Avaliação registrada: ${data.score}/5`,
        message_type: "satisfaction_response",
        metadata: {
          score: data.score,
          note: data.note ?? null,
        },
      },
    ]);

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
    const active = rows.filter((row) => row.status !== "closed");
    const rated = rows.filter(
      (row) => Number(row.satisfaction_score) >= 1 && Number(row.satisfaction_score) <= 5,
    );
    const average =
      rated.length === 0
        ? 0
        : rated.reduce((acc, row) => acc + Number(row.satisfaction_score), 0) / rated.length;

    return {
      total_threads: rows.length,
      open_threads: active.length,
      pending_support_threads: rows.filter((row) => row.status === "pending_support").length,
      pending_customer_threads: rows.filter((row) => row.status === "pending_customer").length,
      closed_threads: rows.filter((row) => row.status === "closed").length,
      satisfaction_average: Number(average.toFixed(2)),
      satisfaction_count: rated.length,
      distribution,
    };
  });

export const sendSupportAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      threadId: string;
      path: string;
      fileType: "image" | "audio";
      clientMessageId?: string;
    }) =>
      z
        .object({
          threadId: z.string().uuid(),
          path: z.string().regex(/^chat\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/i),
          fileType: z.enum(["image", "audio"]),
          clientMessageId: z.string().trim().min(8).max(128).optional(),
        })
        .refine(
          (value) => value.path.toLowerCase().startsWith(`chat/${value.threadId.toLowerCase()}/`),
          {
            message: "O anexo não pertence a esta conversa.",
            path: ["path"],
          },
        )
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    if (thread.status === "closed") throw new Error("Este atendimento está encerrado.");
    const existing = await findIdempotentMessage(
      supabaseAdmin,
      context.userId,
      data.clientMessageId,
    );
    if (existing) return existing;
    await enforceMessageRateLimit(supabaseAdmin, context.userId);

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("chat-files-v2")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);
    if (signError) throw signError;

    const isOwnerSender = thread.user_id !== context.userId;
    const now = new Date().toISOString();
    const { data: message, error } = (await supabaseAdmin
      .from("support_messages" as any)
      .insert([
        {
          thread_id: thread.id,
          sender_id: context.userId,
          content: `Enviou uma ${data.fileType === "image" ? "imagem" : "áudio"}`,
          file_url: signed.signedUrl,
          file_type: data.fileType,
          message_type: isOwnerSender ? "support_reply" : "user_message",
          client_message_id: data.clientMessageId ?? null,
        },
      ])
      .select()
      .single()) as any;
    if (error) throw error;

    const { error: updateError } = await supabaseAdmin
      .from("support_threads" as any)
      .update({
        last_message: message.content,
        last_message_at: now,
        ...(isOwnerSender
          ? {
              last_owner_message_at: now,
              first_response_at: thread.first_response_at ?? now,
              unread_count_user: (thread.unread_count_user || 0) + 1,
            }
          : {
              last_user_message_at: now,
              unread_count_owner: (thread.unread_count_owner || 0) + 1,
            }),
        status: isOwnerSender
          ? getStatusAfterOwnerMessage(thread.status)
          : getStatusAfterUserMessage(thread.status),
        waiting_since: now,
        closure_prompt_at: null,
      })
      .eq("id", thread.id);
    if (updateError) throw updateError;
    return message;
  });

export const sendSupportOwnerMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; content: string; clientMessageId?: string }) =>
    z
      .object({
        threadId: z.string().uuid(),
        ...supportMessageSchema().shape,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
    if (thread.status === "closed") throw new Error("Este atendimento está encerrado.");
    const existing = await findIdempotentMessage(
      supabaseAdmin,
      context.userId,
      data.clientMessageId,
    );
    if (existing) return existing;
    await enforceMessageRateLimit(supabaseAdmin, context.userId);

    const { data: configData, error: configError } = await supabaseAdmin
      .from("app_config")
      .select("config")
      .maybeSingle();
    if (configError) throw configError;
    const config = (configData?.config as any) || {};
    const attendantName = config.support_attendant_name || "Suporte";
    const content = `${attendantName}: ${data.content.trim()}`;
    const now = new Date().toISOString();
    const { data: message, error } = await supabaseAdmin
      .from("support_messages" as any)
      .insert([
        {
          thread_id: thread.id,
          sender_id: context.userId,
          content,
          message_type: "support_reply",
          client_message_id: data.clientMessageId ?? null,
        },
      ])
      .select()
      .single();
    if (error) throw error;

    const { error: updateError } = await supabaseAdmin
      .from("support_threads" as any)
      .update({
        last_message: normalizeSupportMessage(data.content),
        last_message_at: now,
        last_owner_message_at: now,
        first_response_at: thread.first_response_at ?? now,
        unread_count_user: (thread.unread_count_user || 0) + 1,
        status: getStatusAfterOwnerMessage(thread.status),
        waiting_since: now,
      })
      .eq("id", thread.id);
    if (updateError) throw updateError;
    return message;
  });

export const sendSupportAutoReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { threadId: string; content: string }) =>
    z
      .object({
        threadId: z.string().uuid(),
        content: z.string().trim().min(1).max(SUPPORT_MAX_MESSAGE_LENGTH),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const thread = await canAccessThread(context.supabase, context.userId, data.threadId);

    const { data: message, error } = await (supabaseAdmin
      .from("support_messages" as any)
      .insert([
        {
          thread_id: data.threadId,
          sender_id: null,
          content: data.content,
          message_type: "system_notification",
        },
      ])
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
  .validator((data: { content: string; clientMessageId?: string }) =>
    supportMessageSchema().parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const existingMessage = await findIdempotentMessage(
      supabaseAdmin,
      userId,
      data.clientMessageId,
    );
    if (existingMessage) {
      return {
        thread: { id: existingMessage.thread_id },
        userMessage: existingMessage,
        autoReply: null,
        idempotent: true,
      };
    }
    await enforceMessageRateLimit(supabaseAdmin, userId);

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
      .insert([
        {
          thread_id: thread.id,
          sender_id: userId,
          content: normalizeSupportMessage(data.content),
          message_type: "user_message",
          client_message_id: data.clientMessageId ?? null,
          metadata: {
            cycle: "open",
          },
        },
      ])
      .select()
      .single() as any);

    if (userMessageError) {
      if (isUniqueViolation(userMessageError) && data.clientMessageId) {
        const duplicate = await findIdempotentMessage(supabaseAdmin, userId, data.clientMessageId);
        if (duplicate) {
          return {
            thread: { id: duplicate.thread_id },
            userMessage: duplicate,
            autoReply: null,
            idempotent: true,
          };
        }
      }
      throw userMessageError;
    }

    let autoReply: any = null;

    if (shouldAutoReply) {
      const { data: configData, error: configError } = await supabaseAdmin
        .from("app_config")
        .select("config")
        .maybeSingle();
      if (configError) throw configError;

      const config = (configData?.config as any) || {};
      const autoReplyMsg =
        config.support_auto_reply ||
        "Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar.";

      const { data: autoReplyData, error: autoReplyError } = await (supabaseAdmin
        .from("support_messages" as any)
        .insert([
          {
            thread_id: thread.id,
            sender_id: null,
            content: autoReplyMsg,
            message_type: "system_notification",
          },
        ])
        .select()
        .single() as any);

      if (autoReplyError) throw autoReplyError;
      autoReply = autoReplyData;
    }

    const nowIso = now.toISOString();
    const { error: updateError } = await (supabaseAdmin
      .from("support_threads" as any)
      .update({
        last_message: autoReply?.content ?? data.content.trim(),
        last_message_at: nowIso,
        last_user_message_at: nowIso,
        status: getStatusAfterUserMessage(thread.status),
        waiting_since: nowIso,
        closure_prompt_at: null,
        unread_count_owner: (thread.unread_count_owner || 0) + 1,
        unread_count_user: shouldAutoReply
          ? (thread.unread_count_user || 0) + 1
          : thread.unread_count_user || 0,
      })
      .eq("id", thread.id) as any);

    if (updateError) throw updateError;
    return {
      thread: { ...thread, protocol: deriveSupportProtocol(thread) },
      userMessage,
      autoReply,
    };
  });
