import { r as createServerFn } from "./server-Dalk2S9v.mjs";
import { t as createServerRpc } from "./createServerRpc-CuTkNpPn.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-B-AXHxEL.mjs";
import { a as numberType, n as booleanType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { c as normalizeSupportMessage, i as getStatusAfterUserMessage, n as SUPPORT_MIN_MESSAGE_INTERVAL_MS, r as getStatusAfterOwnerMessage, t as SUPPORT_MAX_MESSAGE_LENGTH } from "./chat-policy-DsA529M1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat.functions-BIUs6h6_.js
var SUPPORT_IDLE_CLOSE_PROMPT_MS = 864e5;
function supportMessageSchema() {
	return objectType({
		content: stringType().trim().min(1).max(SUPPORT_MAX_MESSAGE_LENGTH),
		clientMessageId: stringType().trim().min(8).max(128).optional()
	});
}
async function findIdempotentMessage(supabaseAdmin, userId, clientMessageId) {
	if (!clientMessageId) return null;
	const { data, error } = await supabaseAdmin.from("support_messages").select("*").eq("client_message_id", clientMessageId).eq("sender_id", userId).maybeSingle();
	if (error) throw error;
	return data ?? null;
}
function isUniqueViolation(error) {
	return error?.code === "23505";
}
async function enforceMessageRateLimit(supabaseAdmin, userId) {
	const recentSince = new Date(Date.now() - SUPPORT_MIN_MESSAGE_INTERVAL_MS).toISOString();
	const { count: recentCount, error: recentError } = await supabaseAdmin.from("support_messages").select("id", {
		count: "exact",
		head: true
	}).eq("sender_id", userId).gte("created_at", recentSince);
	if (recentError) throw recentError;
	if ((recentCount ?? 0) > 0) throw new Error("Aguarde alguns segundos antes de enviar outra mensagem.");
	const dayStart = /* @__PURE__ */ new Date();
	dayStart.setUTCHours(0, 0, 0, 0);
	const { count: dailyCount, error: dailyError } = await supabaseAdmin.from("support_messages").select("id", {
		count: "exact",
		head: true
	}).eq("sender_id", userId).gte("created_at", dayStart.toISOString());
	if (dailyError) throw dailyError;
	if ((dailyCount ?? 0) >= 100) throw new Error("O limite diário de mensagens foi atingido. Tente novamente mais tarde.");
}
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
	const { data: thread, error } = await supabase.from("support_threads").select("*").eq("id", threadId).maybeSingle();
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
	if (!thread || ![
		"open",
		"pending_customer",
		"pending_support"
	].includes(String(thread.status))) return thread;
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
	if (error) {
		if (isUniqueViolation(error)) {
			const existing = await resolveActiveUserThread(supabaseAdmin, userId);
			if (existing) return ensureProtocolForThread(supabaseAdmin, existing);
		}
		throw error;
	}
	return ensureProtocolForThread(supabaseAdmin, createdThread);
}
async function closeSupportThreadInternal(supabaseAdmin, thread, contextUserId, closedByRole) {
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		status: "closed",
		closed_at: now,
		closed_by_user_id: contextUserId,
		closed_by_role: closedByRole,
		waiting_since: null,
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
var updateSupportThreadOperations_createServerFn_handler = createServerRpc({
	id: "4215550493e49f0ffff7f8d2241ffadca9d1b7f974fd6b4ab74d943095c8ca46",
	name: "updateSupportThreadOperations",
	filename: "src/lib/chat.functions.ts"
}, (opts) => updateSupportThreadOperations.__executeServer(opts));
var updateSupportThreadOperations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	priority: enumType([
		"low",
		"normal",
		"high",
		"urgent"
	]).optional(),
	category: enumType([
		"general",
		"access",
		"billing",
		"playback",
		"catalog",
		"technical",
		"other"
	]).optional(),
	status: enumType([
		"open",
		"pending_support",
		"pending_customer",
		"closed"
	]).optional(),
	assignedToUserId: stringType().uuid().nullable().optional()
}).refine((value) => Object.keys(value).some((key) => key !== "threadId" && value[key] !== void 0), { message: "Nenhuma alteração operacional foi informada." }).parse(data)).handler(updateSupportThreadOperations_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	const update = {};
	if (data["priority"] !== void 0) update["priority"] = data["priority"];
	if (data["category"] !== void 0) update["category"] = data["category"];
	if (data["assignedToUserId"] !== void 0) update["assigned_to_user_id"] = data["assignedToUserId"];
	if (data["status"] !== void 0) {
		update["status"] = data["status"];
		update["waiting_since"] = data["status"] === "pending_customer" ? (/* @__PURE__ */ new Date()).toISOString() : null;
	}
	if (data["assignedToUserId"]) {
		const { data: assignee, error: assigneeError } = await supabaseAdmin.from("user_roles").select("user_id, role").eq("user_id", data["assignedToUserId"]).in("role", ["owner", "admin"]).maybeSingle();
		if (assigneeError) throw assigneeError;
		if (!assignee) throw new Error("O responsável precisa ser owner ou admin.");
	}
	const { data: updated, error } = await supabaseAdmin.from("support_threads").update(update).eq("id", thread.id).select("*").single();
	if (error) throw error;
	return {
		...updated,
		protocol: deriveSupportProtocol(updated)
	};
});
var listSupportThreadsPage_createServerFn_handler = createServerRpc({
	id: "cb7e37e21557ca5564b71596de67c5c4ffb152eff32bd00570d57eabc7720736",
	name: "listSupportThreadsPage",
	filename: "src/lib/chat.functions.ts"
}, (opts) => listSupportThreadsPage.__executeServer(opts));
var listSupportThreadsPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100),
	status: enumType([
		"open",
		"pending_support",
		"pending_customer",
		"closed"
	]).optional(),
	priority: enumType([
		"low",
		"normal",
		"high",
		"urgent"
	]).optional(),
	search: stringType().trim().max(80).optional()
}).parse(data)).handler(listSupportThreadsPage_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	let countQuery = supabaseAdmin.from("support_threads").select("id", {
		count: "exact",
		head: true
	});
	let rowsQuery = supabaseAdmin.from("support_threads").select("*").order("last_message_at", { ascending: false });
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
	const update = (await canAccessThread(context.supabase, context.userId, data.threadId)).user_id !== context.userId ? { unread_count_owner: 0 } : { unread_count_user: 0 };
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
	const closedByRole = thread.user_id === context.userId ? "client" : "owner";
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
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	if (thread.user_id !== context.userId) throw new Error("Apenas o cliente pode responder ao convite de encerramento.");
	if (!data.keepOpen) {
		await closeSupportThreadInternal(supabaseAdmin, thread, context.userId, "client");
		return { success: true };
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		closure_prompt_at: now,
		status: "pending_support",
		waiting_since: now
	}).eq("id", data.threadId);
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
	const active = rows.filter((row) => row.status !== "closed");
	const rated = rows.filter((row) => Number(row.satisfaction_score) >= 1 && Number(row.satisfaction_score) <= 5);
	const average = rated.length === 0 ? 0 : rated.reduce((acc, row) => acc + Number(row.satisfaction_score), 0) / rated.length;
	return {
		total_threads: rows.length,
		open_threads: active.length,
		pending_support_threads: rows.filter((row) => row.status === "pending_support").length,
		pending_customer_threads: rows.filter((row) => row.status === "pending_customer").length,
		closed_threads: rows.filter((row) => row.status === "closed").length,
		satisfaction_average: Number(average.toFixed(2)),
		satisfaction_count: rated.length,
		distribution
	};
});
var sendSupportAttachment_createServerFn_handler = createServerRpc({
	id: "da734b4b36d3df4bdb5a4067345c82322aa9b6bd01e452920eb9471711f8f39f",
	name: "sendSupportAttachment",
	filename: "src/lib/chat.functions.ts"
}, (opts) => sendSupportAttachment.__executeServer(opts));
var sendSupportAttachment = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	path: stringType().regex(/^chat\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/i),
	fileType: enumType(["image", "audio"]),
	clientMessageId: stringType().trim().min(8).max(128).optional()
}).refine((value) => value.path.toLowerCase().startsWith(`chat/${value.threadId.toLowerCase()}/`), {
	message: "O anexo não pertence a esta conversa.",
	path: ["path"]
}).parse(data)).handler(sendSupportAttachment_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	if (thread.status === "closed") throw new Error("Este atendimento está encerrado.");
	const existing = await findIdempotentMessage(supabaseAdmin, context.userId, data.clientMessageId);
	if (existing) return existing;
	await enforceMessageRateLimit(supabaseAdmin, context.userId);
	const { data: signed, error: signError } = await supabaseAdmin.storage.from("chat-files-v2").createSignedUrl(data.path, 31536e3);
	if (signError) throw signError;
	const isOwnerSender = thread.user_id !== context.userId;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { data: message, error } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: thread.id,
		sender_id: context.userId,
		content: `Enviou uma ${data.fileType === "image" ? "imagem" : "áudio"}`,
		file_url: signed.signedUrl,
		file_type: data.fileType,
		message_type: isOwnerSender ? "support_reply" : "user_message",
		client_message_id: data.clientMessageId ?? null
	}]).select().single();
	if (error) throw error;
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		last_message: message.content,
		last_message_at: now,
		...isOwnerSender ? {
			last_owner_message_at: now,
			first_response_at: thread.first_response_at ?? now,
			unread_count_user: (thread.unread_count_user || 0) + 1
		} : {
			last_user_message_at: now,
			unread_count_owner: (thread.unread_count_owner || 0) + 1
		},
		status: isOwnerSender ? getStatusAfterOwnerMessage(thread.status) : getStatusAfterUserMessage(thread.status),
		waiting_since: now,
		closure_prompt_at: null
	}).eq("id", thread.id);
	if (updateError) throw updateError;
	return message;
});
var sendSupportOwnerMessage_createServerFn_handler = createServerRpc({
	id: "f04b5539617aded5e072b571fb1616867b714f0fd08709517ff72588934c57ab",
	name: "sendSupportOwnerMessage",
	filename: "src/lib/chat.functions.ts"
}, (opts) => sendSupportOwnerMessage.__executeServer(opts));
var sendSupportOwnerMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	...supportMessageSchema().shape
}).parse(data)).handler(sendSupportOwnerMessage_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const thread = await canAccessThread(context.supabase, context.userId, data.threadId);
	if (thread.status === "closed") throw new Error("Este atendimento está encerrado.");
	const existing = await findIdempotentMessage(supabaseAdmin, context.userId, data.clientMessageId);
	if (existing) return existing;
	await enforceMessageRateLimit(supabaseAdmin, context.userId);
	const { data: configData, error: configError } = await supabaseAdmin.from("app_config").select("config").maybeSingle();
	if (configError) throw configError;
	const content = `${(configData?.config || {}).support_attendant_name || "Suporte"}: ${data.content.trim()}`;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const { data: message, error } = await supabaseAdmin.from("support_messages").insert([{
		thread_id: thread.id,
		sender_id: context.userId,
		content,
		message_type: "support_reply",
		client_message_id: data.clientMessageId ?? null
	}]).select().single();
	if (error) throw error;
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		last_message: normalizeSupportMessage(data.content),
		last_message_at: now,
		last_owner_message_at: now,
		first_response_at: thread.first_response_at ?? now,
		unread_count_user: (thread.unread_count_user || 0) + 1,
		status: getStatusAfterOwnerMessage(thread.status),
		waiting_since: now
	}).eq("id", thread.id);
	if (updateError) throw updateError;
	return message;
});
var sendSupportAutoReply_createServerFn_handler = createServerRpc({
	id: "b0d7e2b9fdcb7ea2db8fd4d09497b43e5ffbc0e45a3eacb35bd9ae94012d7297",
	name: "sendSupportAutoReply",
	filename: "src/lib/chat.functions.ts"
}, (opts) => sendSupportAutoReply.__executeServer(opts));
var sendSupportAutoReply = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	content: stringType().trim().min(1).max(SUPPORT_MAX_MESSAGE_LENGTH)
}).parse(data)).handler(sendSupportAutoReply_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
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
var sendSupportMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => supportMessageSchema().parse(data)).handler(sendSupportMessage_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const userId = context.userId;
	const existingMessage = await findIdempotentMessage(supabaseAdmin, userId, data.clientMessageId);
	if (existingMessage) return {
		thread: { id: existingMessage.thread_id },
		userMessage: existingMessage,
		autoReply: null,
		idempotent: true
	};
	await enforceMessageRateLimit(supabaseAdmin, userId);
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
		content: normalizeSupportMessage(data.content),
		message_type: "user_message",
		client_message_id: data.clientMessageId ?? null,
		metadata: { cycle: "open" }
	}]).select().single();
	if (userMessageError) {
		if (isUniqueViolation(userMessageError) && data.clientMessageId) {
			const duplicate = await findIdempotentMessage(supabaseAdmin, userId, data.clientMessageId);
			if (duplicate) return {
				thread: { id: duplicate.thread_id },
				userMessage: duplicate,
				autoReply: null,
				idempotent: true
			};
		}
		throw userMessageError;
	}
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
	const nowIso = now.toISOString();
	const { error: updateError } = await supabaseAdmin.from("support_threads").update({
		last_message: autoReply?.content ?? data.content.trim(),
		last_message_at: nowIso,
		last_user_message_at: nowIso,
		status: getStatusAfterUserMessage(thread.status),
		waiting_since: nowIso,
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
export { closeSupportThread_createServerFn_handler, getOrCreateThread_createServerFn_handler, getSupportStats_createServerFn_handler, listMySupportThreads_createServerFn_handler, listSupportMessagesPage_createServerFn_handler, listSupportThreadsPage_createServerFn_handler, listSupportThreads_createServerFn_handler, markThreadRead_createServerFn_handler, respondToClosurePrompt_createServerFn_handler, sendSupportAttachment_createServerFn_handler, sendSupportAutoReply_createServerFn_handler, sendSupportMessage_createServerFn_handler, sendSupportOwnerMessage_createServerFn_handler, submitSupportSatisfaction_createServerFn_handler, updateSupportThreadOperations_createServerFn_handler };
