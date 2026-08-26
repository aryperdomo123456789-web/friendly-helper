// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

export const MAGO_RUNTIME_ERROR_EVENT = "mago:runtime-error";
export const MAGO_RUNTIME_CLEAR_EVENT = "mago:runtime-error-clear";

export type CapturedRuntimeErrorDetail = {
  id: string;
  at: number;
  origin: "server" | "worker" | "client" | "unknown";
  mechanism: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary" | "console_error";
  severity: "error" | "warning" | "info";
  summary: string;
  message: string;
};

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
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

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function normalizeRuntimeErrorText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (/^<!doctype html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return "Resposta HTML inesperada";
  }
  if (trimmed.startsWith("<")) {
    return "Resposta inesperada";
  }
  return value;
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

function inferOrigin(
  error: unknown,
  summary: string,
  mechanism: CapturedRuntimeErrorDetail["mechanism"],
): CapturedRuntimeErrorDetail["origin"] {
  const normalized = `${summary}\n${error instanceof Error ? error.stack || "" : ""}`.toLowerCase();

  if (
    normalized.includes("download-worker") ||
    normalized.includes("worker/") ||
    normalized.includes("[download-worker]")
  ) {
    return "worker";
  }

  if (
    normalized.includes("src/server.ts") ||
    normalized.includes("server.ts") ||
    normalized.includes("src/routes/api/")
  ) {
    return "server";
  }

  if (
    mechanism === "react_error_boundary" ||
    normalized.includes("src/components/") ||
    normalized.includes("src/routes/")
  ) {
    return "client";
  }

  return "unknown";
}

function createCapturedErrorDetail(
  error: unknown,
  mechanism: CapturedRuntimeErrorDetail["mechanism"],
): CapturedRuntimeErrorDetail {
  const summary = normalizeRuntimeErrorText(describeError(error));
  const rawMessage = error instanceof Error ? error.message || summary : typeof error === "string" ? error : summary;
  const message = normalizeRuntimeErrorText(rawMessage);
  const id =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    at: Date.now(),
    origin: inferOrigin(error, summary, mechanism),
    mechanism,
    severity: "error",
    summary,
    message,
  };
}

function emitCapturedError(error: unknown, mechanism: CapturedRuntimeErrorDetail["mechanism"]) {
  if (typeof globalThis.dispatchEvent !== "function" || typeof globalThis.CustomEvent !== "function") {
    return;
  }

  try {
    globalThis.dispatchEvent(
      new CustomEvent<CapturedRuntimeErrorDetail>(MAGO_RUNTIME_ERROR_EVENT, {
        detail: createCapturedErrorDetail(error, mechanism),
      }),
    );
  } catch {
    // Best effort only: runtime monitoring must never interfere with the app flow.
  }
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    emitCapturedError(arg, "console_error");
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => {
    const error = (event as ErrorEvent).error ?? event;
    record(error);
    emitCapturedError(error, "onerror");
  });
  globalThis.addEventListener("unhandledrejection", (event) => {
    const error = (event as PromiseRejectionEvent).reason;
    record(error);
    emitCapturedError(error, "unhandledrejection");
  });
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
