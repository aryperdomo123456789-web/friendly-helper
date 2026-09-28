//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
var TTL_MS = 5e3;
var MAGO_RUNTIME_ERROR_EVENT = "mago:runtime-error";
var MAGO_RUNTIME_CLEAR_EVENT = "mago:runtime-error-clear";
function record(error) {
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
var CAUSE_DEPTH_LIMIT = 5;
var DESCRIPTION_LENGTH_LIMIT = 8e3;
function describeError(error) {
	const parts = [];
	let current = error;
	for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
		if (!(current instanceof Error)) {
			parts.push(typeof current === "string" ? current : safeStringify(current));
			break;
		}
		const label = depth === 0 ? "" : "caused by: ";
		const status = describeStatus(current);
		parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
		current = current.cause;
	}
	return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}
function describeStatus(error) {
	const { status, statusCode } = error;
	const value = status ?? statusCode;
	return typeof value === "number" ? ` (status ${value})` : "";
}
function safeStringify(value) {
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}
function normalizeRuntimeErrorText(value) {
	const trimmed = value.trim();
	if (!trimmed) return value;
	if (/^<!doctype html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) return "Resposta HTML inesperada";
	if (trimmed.startsWith("<")) return "Resposta inesperada";
	return value;
}
function isErrorLike(value) {
	return value instanceof Error;
}
function inferOrigin(error, summary, mechanism) {
	const normalized = `${summary}\n${error instanceof Error ? error.stack || "" : ""}`.toLowerCase();
	if (normalized.includes("download-worker") || normalized.includes("worker/") || normalized.includes("[download-worker]")) return "worker";
	if (normalized.includes("src/server.ts") || normalized.includes("server.ts") || normalized.includes("src/routes/api/")) return "server";
	if (mechanism === "react_error_boundary" || normalized.includes("src/components/") || normalized.includes("src/routes/")) return "client";
	return "unknown";
}
function createCapturedErrorDetail(error, mechanism) {
	const summary = normalizeRuntimeErrorText(describeError(error));
	const message = normalizeRuntimeErrorText(error instanceof Error ? error.message || summary : typeof error === "string" ? error : summary);
	return {
		id: typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
		at: Date.now(),
		origin: inferOrigin(error, summary, mechanism),
		mechanism,
		severity: "error",
		summary,
		message
	};
}
function emitCapturedError(error, mechanism) {
	if (typeof globalThis.dispatchEvent !== "function" || typeof globalThis.CustomEvent !== "function") return;
	try {
		globalThis.dispatchEvent(new CustomEvent(MAGO_RUNTIME_ERROR_EVENT, { detail: createCapturedErrorDetail(error, mechanism) }));
	} catch {}
}
var originalConsoleError = console.error.bind(console);
console.error = (...args) => {
	originalConsoleError(...args.map((arg) => {
		if (!isErrorLike(arg)) return arg;
		record(arg);
		emitCapturedError(arg, "console_error");
		return describeError(arg);
	}));
};
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => {
		const error = event.error ?? event;
		record(error);
		emitCapturedError(error, "onerror");
	});
	globalThis.addEventListener("unhandledrejection", (event) => {
		const error = event.reason;
		record(error);
		emitCapturedError(error, "unhandledrejection");
	});
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-Bzgeml2A.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!isH3SwallowedErrorBody(body)) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: htmlNoStoreHeaders()
	});
}
function isH3SwallowedErrorBody(body) {
	try {
		const payload = JSON.parse(body);
		return payload.unhandled === true && payload.message === "HTTPError";
	} catch {
		return false;
	}
}
var server_default = { async fetch(request, env, ctx) {
	try {
		return await applyHtmlNoStore(await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx)));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: htmlNoStoreHeaders()
		});
	}
} };
async function applyHtmlNoStore(response) {
	if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
	const headers = new Headers(response.headers);
	headers.set("cache-control", "no-store, no-cache, must-revalidate, private");
	headers.set("pragma", "no-cache");
	headers.set("expires", "0");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
function htmlNoStoreHeaders() {
	return {
		"content-type": "text/html; charset=utf-8",
		"cache-control": "no-store, no-cache, must-revalidate, private",
		pragma: "no-cache",
		expires: "0"
	};
}
//#endregion
export { server_default as default, MAGO_RUNTIME_CLEAR_EVENT as n, MAGO_RUNTIME_ERROR_EVENT as r, renderErrorPage as t };
