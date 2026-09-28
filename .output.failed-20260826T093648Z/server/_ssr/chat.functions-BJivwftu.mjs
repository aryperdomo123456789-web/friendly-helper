import { r as createServerFn } from "./server-BgKDpkor.mjs";
import { t as createServerRpc } from "./createServerRpc-Dlofs9kT.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-CqeqY5mL.mjs";
import { a as numberType, n as booleanType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat.functions-BJivwftu.js
var SUPPORT_IDLE_CLOSE_PROMPT_MS = 864e5;
function deriveSupportProtocol(thread) {
	if (thread?.protocol && String(thread.protocol).trim()) return String(thread.protocol).trim();
	const suffix = String(thread?.id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
	return suffix ? `SUP-${suffix}` : `SUP-00000000`;
}
async function assertOwner(supabase, userId) {
	const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]);
	if (error) throw new Error(error.message);
	if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}
async function canAccessThread(supabase, userId, threadId) {
	const { data: thread, error } = await supabase.from("support_threads").select("id, user_id").eq("id", threadId).maybeSingle();
	if (error) throw new Error(error.message);
	if (!thread) throw new Error("Conversa não encontrada.");
	if (thread.user_id === userId) return thread;
	await assertOwner(supabase, userId);
	return thread;
}
async function resolveLatestUserThread(supabase, userId) {
	const { data, error } = await supabase.from("support_threads").select("*").eq("user_id", userId).order("last_message_at", { ascending: false }).limit(1).maybeSingle();
	if (error) throw new Error(error.message);
	return data ?? null;
}
async function resolveActiveUserThread(supabase, userId) {
	const { data, error } = await supabase.from("support_threads").select("*").eq("user_id", userId).eq("status", "open").order("last_message_at", { ascending: false }).limit(1).maybeSingle();
	if (error) throw new Error(error.message);
	return data ?? null;
}
async function ensureProtocolForThread(supabaseAdmin, thread) {
	const protocol = deriveSupportProtocol(thread);
	if (thread?.protocol && String(thread.protocol).trim()) return {
		...thread,
		protocol
	};
	const { data, error } = await supabaseAdmin.from("support_threads").update({ protocol }).eq("id", thread.id).select("*").maybeSingle();
	if (error) throw error;
	return {
		...data ?? thread,
		protocol
	};
}
async function maybeInsertClosePrompt(supabaseAdmin, thread) {
	if (!thread || thread.status !== "open") return thread;
	const lastOwnerAt = thread.last_owner_message_at ? new Date(thread.last_owner_message_at).getTime() : 0;
	const lastUserAt = thread.last_user_message_at ? new Date(thread.last_user_message_at).getTime() : 0;
	if (!lastOwnerAt) return thread;
	if (lastUserAt > lastOwnerAt) return thread;
	if ((thread.closure_prompt_at ? new Date(thread.closure_prompt_at).getTime() : 0) >= lastOwnerAt) return thread;
	const now = Date.now();
	if (now - lastOwnerAt < SUPPORT_IDLE_CLOSE_PROMPT_MS) return thread;
	const prompt = "O atendimento ficou sem resposta do cliente. Deseja encerrar este atendimento?";
	const { error: insertError } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: thread.id,
		sender_id: null,
		content: prompt,
		message_type: "closure_prompt",
		metadata: {
			action: "close_ticket",
			idle_minutes: Math.round((now - lastOwnerAt) / 6e4)
		}
	}]);
	if (insertError) throw insertError;
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		closure_prompt_at: (/* @__PURE__ */ new Date()).toISOString(),
		last_message: prompt,
		last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
		unread_count_user: (thread.unread_count_user || 0) + 1
	}).eq("id", thread.id);
	if (updateError) throw updateError;
	return {
		...thread,
		closure_prompt_at: (/* @__PURE__ */ new Date()).toISOString(),
		last_message: prompt
	};
}
async function createSupportThread(supabaseAdmin, userId) {
	const { data: createdThread, error } = await supabaseAdmin.from("support_threads").insert([{
		user_id: userId,
		status: "open",
		unread_count_owner: 0,
		unread_count_user: 0,
		last_message_at: (/* @__PURE__ */ new Date()).toISOString()
	}]).select().single();
	if (error) throw error;
	return ensureProtocolForThread(supabaseAdmin, createdThread);
}
async function closeSupportThreadInternal(supabaseAdmin, thread, contextUserId, closedByRole) {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		status: "closed",
		closed_at: now,
		closed_by_user_id: contextUserId,
		closed_by_role: closedByRole,
		satisfaction_requested_at: now,
		closure_prompt_at: now,
		last_message: "Atendimento encerrado.",
		last_message_at: now
	}).eq("id", thread.id);
	if (updateError) throw updateError;
	const { error: closedMessageError } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: thread.id,
		sender_id: null,
		content: `Atendimento encerrado por ${closedByRole === "owner" ? "equipe de suporte" : "cliente"}.`,
		message_type: "thread_closed",
		metadata: { closed_by_role: closedByRole }
	}]);
	if (closedMessageError) throw closedMessageError;
	const { error: satisfactionPromptError } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: thread.id,
		sender_id: null,
		content: "Avalie seu atendimento de 1 a 5 para concluirmos este suporte.",
		message_type: "satisfaction_prompt",
		metadata: {
			min_score: 1,
			max_score: 5
		}
	}]);
	if (satisfactionPromptError) throw satisfactionPromptError;
}
var listSupportThreads_createServerFn_handler = createServerRpc({
	id: "c22d15e56609f83f0041ff128a9b3bdd73f970690ec0fb08ed7ec77daeceebda",
	name: "listSupportThreads",
	filename: "src/lib/chat.functions.ts"
}, (opts) => listSupportThreads.__executeServer(opts));
var listSupportThreads = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listSupportThreads_createServerFn_handler, async ({ context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data, error } = await supabaseAdmin.from("support_threads").select("*").order("last_message_at", { ascending: false });
	if (error) throw error;
	const threads = data ?? [];
	if (threads.length === 0) return threads;
	const { data: profiles } = await supabaseAdmin.from("profiles").select("id, username, display_name").in("id", threads.map((t) => t.user_id));
	const map = new Map((profiles ?? []).map((p) => [p.id, p]));
	return threads.map((t) => ({
		...t,
		protocol: deriveSupportProtocol(t),
		profile: map.get(t.user_id) ?? null
	}));
});
var listMySupportThreads_createServerFn_handler = createServerRpc({
	id: "3fdbc83a6859908badbb9e1dd6d6294f2437dfa55921fd01fa02b9640aa2a643",
	name: "listMySupportThreads",
	filename: "src/lib/chat.functions.ts"
}, (opts) => listMySupportThreads.__executeServer(opts));
var listMySupportThreads = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listMySupportThreads_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data, error } = await supabaseAdmin.from("support_threads").select("*").eq("user_id", context.userId).order("last_message_at", { ascending: false });
	if (error) throw error;
	return (data ?? []).map((thread) => ({
		...thread,
		protocol: deriveSupportProtocol(thread)
	}));
});
var listSupportThreadsPage_createServerFn_handler = createServerRpc({
	id: "cb7e37e21557ca5564b71596de67c5c4ffb152eff32bd00570d57eabc7720736",
	name: "listSupportThreadsPage",
	filename: "src/lib/chat.functions.ts"
}, (opts) => listSupportThreadsPage.__executeServer(opts));
var listSupportThreadsPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(data)).handler(listSupportThreadsPage_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { count, error: countError } = await supabaseAdmin.from("support_threads").select("id", {
		count: "exact",
		head: true
	});
	if (countError) throw countError;
	const total = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / data.page_size));
	const page = Math.min(Math.max(data.page, 1), totalPages);
	const from = (page - 1) * data.page_size;
	const to = from + data.page_size - 1;
	const { data: threads, error } = await supabaseAdmin.from("support_threads").select("*").order("last_message_at", { ascending: false }).range(from, to);
	if (error) throw error;
	const rows = threads ?? [];
	if (rows.length === 0) return {
		items: [],
		total,
		page,
		page_size: data.page_size
	};
	const { data: profiles } = await supabaseAdmin.from("profiles").select("id, username, display_name").in("id", rows.map((t) => t.user_id));
	const map = new Map((profiles ?? []).map((p) => [p.id, p]));
	return {
		items: rows.map((t) => ({
			...t,
			protocol: deriveSupportProtocol(t),
			profile: map.get(t.user_id) ?? null
		})),
		total,
		page,
		page_size: data.page_size
	};
});
var getOrCreateThread_createServerFn_handler = createServerRpc({
	id: "97b35e74b107644a6e584316b1214fe8a1860c7362d04359f2358021651adc63",
	name: "getOrCreateThread",
	filename: "src/lib/chat.functions.ts"
}, (opts) => getOrCreateThread.__executeServer(opts));
var getOrCreateThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({ userId: stringType().uuid() }).parse(data)).handler(getOrCreateThread_createServerFn_handler, async ({ data: { userId }, context }) => {
	if (context.userId !== userId) await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const existing = await resolveActiveUserThread(supabaseAdmin, userId);
	if (existing) return ensureProtocolForThread(supabaseAdmin, existing);
	const latest = await resolveLatestUserThread(supabaseAdmin, userId);
	if (latest && latest.status !== "open") return createSupportThread(supabaseAdmin, userId);
	return createSupportThread(supabaseAdmin, userId);
});
var markThreadRead_createServerFn_handler = createServerRpc({
	id: "7404f455952cf380c26a31a984a2f239982e81c95f04f99d44793188f79e2dc6",
	name: "markThreadRead",
	filename: "src/lib/chat.functions.ts"
}, (opts) => markThreadRead.__executeServer(opts));
var markThreadRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	isOwner: booleanType()
}).parse(data)).handler(markThreadRead_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	const update = data.isOwner ? { unread_count_owner: 0 } : thread.user_id === context.userId ? { unread_count_user: 0 } : null;
	if (!update) throw new Error("Você não pode marcar esta conversa como lida.");
	const { error } = await supabaseAdmin.from("support_threads").update(update).eq("id", data.threadId);
	if (error) throw error;
	return { success: true };
});
var listSupportMessagesPage_createServerFn_handler = createServerRpc({
	id: "7ee1b9559aaef38ddffa250e44e97b9b949a517e8d3ee7b7af17e1fcd086560f",
	name: "listSupportMessagesPage",
	filename: "src/lib/chat.functions.ts"
}, (opts) => listSupportMessagesPage.__executeServer(opts));
var listSupportMessagesPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(data)).handler(listSupportMessagesPage_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	if (thread?.status === "open") await maybeInsertClosePrompt(supabaseAdmin, thread);
	const pageSize = data.page_size;
	const { count, error: countError } = await supabaseAdmin.from("support_messages").select("id", {
		count: "exact",
		head: true
	}).eq("thread_id", data.threadId);
	if (countError) throw countError;
	const total = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(Math.max(data.page, 1), totalPages);
	const start = Math.max(total - page * pageSize, 0);
	const end = total === 0 ? -1 : Math.min(total - 1, start + pageSize - 1);
	if (end < start) return {
		items: [],
		total,
		page,
		page_size: pageSize
	};
	const { data: items, error } = await supabaseAdmin.from("support_messages").select("*").eq("thread_id", data.threadId).order("created_at", { ascending: true }).range(start, end);
	if (error) throw error;
	return {
		items: items ?? [],
		total,
		page,
		page_size: pageSize
	};
});
var closeSupportThread_createServerFn_handler = createServerRpc({
	id: "c9b67a24aa33f2bd4625ed74bc90396e3eef12d5b2b7973997479fdf9a29b25b",
	name: "closeSupportThread",
	filename: "src/lib/chat.functions.ts"
}, (opts) => closeSupportThread.__executeServer(opts));
var closeSupportThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	closedByRole: enumType(["owner", "client"]).optional()
}).parse(data)).handler(closeSupportThread_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	const closedByRole = data.closedByRole ?? (thread.user_id === context.userId ? "client" : "owner");
	await closeSupportThreadInternal(supabaseAdmin, thread, context.userId, closedByRole);
	return { success: true };
});
var respondToClosurePrompt_createServerFn_handler = createServerRpc({
	id: "b3068437fd06fb6cb87be643ea47546fd193a495cf9047e95b4605428fdf3c64",
	name: "respondToClosurePrompt",
	filename: "src/lib/chat.functions.ts"
}, (opts) => respondToClosurePrompt.__executeServer(opts));
var respondToClosurePrompt = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	keepOpen: booleanType()
}).parse(data)).handler(respondToClosurePrompt_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	await canAccessThread(context.supabase, context.userId, data.threadId);
	if (!data.keepOpen) {
		await closeSupportThreadInternal(supabaseAdmin, await canAccessThread(context.supabase, context.userId, data.threadId), context.userId, "client");
		return { success: true };
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({ closure_prompt_at: now }).eq("id", data.threadId);
	if (updateError) throw updateError;
	const { error: noteError } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: data.threadId,
		sender_id: null,
		content: "Cliente optou por manter o atendimento aberto.",
		message_type: "closure_response",
		metadata: { keep_open: true }
	}]);
	if (noteError) throw noteError;
	return { success: true };
});
var submitSupportSatisfaction_createServerFn_handler = createServerRpc({
	id: "48fa8e077de41d67b283ac3a22136bb7dd9e62b0e2dd76b9c0c2f268860d07b6",
	name: "submitSupportSatisfaction",
	filename: "src/lib/chat.functions.ts"
}, (opts) => submitSupportSatisfaction.__executeServer(opts));
var submitSupportSatisfaction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	score: numberType().int().min(1).max(5),
	note: stringType().max(1e3).nullable().optional()
}).parse(data)).handler(submitSupportSatisfaction_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	if ((await canAccessThread(context.supabase, context.userId, data.threadId)).user_id !== context.userId) throw new Error("Apenas o cliente do atendimento pode avaliar a experiência.");
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		satisfaction_score: data.score,
		satisfaction_note: data.note ?? null,
		satisfaction_submitted_at: now
	}).eq("id", data.threadId);
	if (updateError) throw updateError;
	const { error: noteError } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: data.threadId,
		sender_id: context.userId,
		content: `Avaliação registrada: ${data.score}/5`,
		message_type: "satisfaction_response",
		metadata: {
			score: data.score,
			note: data.note ?? null
		}
	}]);
	if (noteError) throw noteError;
	return { success: true };
});
var getSupportStats_createServerFn_handler = createServerRpc({
	id: "8f9ec3654ae2ec5ece912cf1b3a15557b1095a0a46d6e4f2547446435eed3fa6",
	name: "getSupportStats",
	filename: "src/lib/chat.functions.ts"
}, (opts) => getSupportStats.__executeServer(opts));
var getSupportStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupportStats_createServerFn_handler, async ({ context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data, error } = await supabaseAdmin.from("support_threads").select("id, status, satisfaction_score, created_at, closed_at, last_message_at");
	if (error) throw error;
	const rows = data ?? [];
	const distribution = [
		1,
		2,
		3,
		4,
		5
	].map((score) => ({
		score,
		count: rows.filter((row) => Number(row.satisfaction_score) === score).length
	}));
	const rated = rows.filter((row) => Number(row.satisfaction_score) >= 1 && Number(row.satisfaction_score) <= 5);
	const average = rated.length === 0 ? 0 : rated.reduce((acc, row) => acc + Number(row.satisfaction_score), 0) / rated.length;
	return {
		total_threads: rows.length,
		open_threads: rows.filter((row) => row.status === "open").length,
		closed_threads: rows.filter((row) => row.status === "closed").length,
		satisfaction_average: Number(average.toFixed(2)),
		satisfaction_count: rated.length,
		distribution
	};
});
var sendSupportAutoReply_createServerFn_handler = createServerRpc({
	id: "b0d7e2b9fdcb7ea2db8fd4d09497b43e5ffbc0e45a3eacb35bd9ae94012d7297",
	name: "sendSupportAutoReply",
	filename: "src/lib/chat.functions.ts"
}, (opts) => sendSupportAutoReply.__executeServer(opts));
var sendSupportAutoReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	content: stringType().min(1)
}).parse(data)).handler(sendSupportAutoReply_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	const { data: message, error } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: data.threadId,
		sender_id: null,
		content: data.content,
		message_type: "system_notification"
	}]).select().single();
	if (error) throw error;
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		last_message: data.content,
		last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
		unread_count_user: (thread.unread_count_user || 0) + 1
	}).eq("id", data.threadId);
	if (updateError) throw updateError;
	return message;
});
var sendSupportMessage_createServerFn_handler = createServerRpc({
	id: "87dd3d6a88d43c8b10cd4262f79634b6906bddbc71b3b0c059866712d345612d",
	name: "sendSupportMessage",
	filename: "src/lib/chat.functions.ts"
}, (opts) => sendSupportMessage.__executeServer(opts));
var sendSupportMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({ content: stringType().min(1) }).parse(data)).handler(sendSupportMessage_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const userId = context.userId;
	let thread = await resolveActiveUserThread(supabaseAdmin, userId);
	if (!thread) thread = await createSupportThread(supabaseAdmin, userId);
	const now = /* @__PURE__ */ new Date();
	const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + 1);
	const { data: sameDayMessages, error: sameDayError } = await supabaseAdmin.from("support_messages").select("id").eq("thread_id", thread.id).eq("sender_id", context.userId).gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
	if (sameDayError) throw sameDayError;
	const shouldAutoReply = (sameDayMessages ?? []).length === 0;
	const { data: userMessage, error: userMessageError } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: thread.id,
		sender_id: userId,
		content: data.content,
		message_type: "user_message",
		metadata: { cycle: "open" }
	}]).select().single();
	if (userMessageError) throw userMessageError;
	let autoReply = null;
	if (shouldAutoReply) {
		const { data: configData, error: configError } = await supabaseAdmin.from("app_config").select("config").maybeSingle();
		if (configError) throw configError;
		const autoReplyMsg = (configData?.config || {}).support_auto_reply || "Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar.";
		const { data: autoReplyData, error: autoReplyError } = await supabaseAdmin.from("support_messages").insert([{
			thread_id: thread.id,
			sender_id: null,
			content: autoReplyMsg,
			message_type: "system_notification"
		}]).select().single();
		if (autoReplyError) throw autoReplyError;
		autoReply = autoReplyData;
	}
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		last_message: autoReply?.content ?? data.content,
		last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
		last_user_message_at: (/* @__PURE__ */ new Date()).toISOString(),
		status: "open",
		closure_prompt_at: null,
		unread_count_owner: (thread.unread_count_owner || 0) + 1,
		unread_count_user: shouldAutoReply ? (thread.unread_count_user || 0) + 1 : thread.unread_count_user || 0
	}).eq("id", thread.id);
	if (updateError) throw updateError;
	return {
		thread: {
			...thread,
			protocol: deriveSupportProtocol(thread)
		},
		userMessage,
		autoReply
	};
});
//#endregion
export { closeSupportThread_createServerFn_handler, getOrCreateThread_createServerFn_handler, getSupportStats_createServerFn_handler, listMySupportThreads_createServerFn_handler, listSupportMessagesPage_createServerFn_handler, listSupportThreadsPage_createServerFn_handler, listSupportThreads_createServerFn_handler, markThreadRead_createServerFn_handler, respondToClosurePrompt_createServerFn_handler, sendSupportAutoReply_createServerFn_handler, sendSupportMessage_createServerFn_handler, submitSupportSatisfaction_createServerFn_handler };
