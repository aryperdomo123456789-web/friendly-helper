import { createHash, randomUUID } from "node:crypto";

type LogLevel = "debug" | "info" | "warn" | "error";
type MemoryAlertLevel = "none" | "warning" | "critical";

type WorkerCounters = {
  ticks_started: number;
  ticks_completed: number;
  tasks_started: number;
  tasks_completed: number;
  tasks_failed: number;
  refresh_cycles_started: number;
  refresh_cycles_completed: number;
  refresh_cycles_failed: number;
  refresh_servers_started: number;
  refresh_servers_completed: number;
  refresh_servers_failed: number;
  refresh_fallbacks: number;
  refresh_coalesced: number;
  locks_acquired: number;
  locks_contended: number;
  locks_stale_removed: number;
  locks_timed_out: number;
  memory_alerts: number;
};

const counters: WorkerCounters = {
  ticks_started: 0,
  ticks_completed: 0,
  tasks_started: 0,
  tasks_completed: 0,
  tasks_failed: 0,
  refresh_cycles_started: 0,
  refresh_cycles_completed: 0,
  refresh_cycles_failed: 0,
  refresh_servers_started: 0,
  refresh_servers_completed: 0,
  refresh_servers_failed: 0,
  refresh_fallbacks: 0,
  refresh_coalesced: 0,
  locks_acquired: 0,
  locks_contended: 0,
  locks_stale_removed: 0,
  locks_timed_out: 0,
  memory_alerts: 0,
};

type RuntimeProcess = {
  env?: Record<string, string | undefined>;
};

export function getWorkerEnv(name: string): string | undefined {
  const runtimeProcess = (globalThis as typeof globalThis & { process?: RuntimeProcess }).process;
  return runtimeProcess?.env?.[name];
}

let serviceName = getWorkerEnv("SERVICE_NAME")?.trim() || "app";
let activeTickId: string | null = null;
let activeTaskName: string | null = null;
let lastTickStartedAt: string | null = null;
let lastTickCompletedAt: string | null = null;
let lastTaskFailureAt: string | null = null;
let lastRefreshCompletedAt: string | null = null;
let memoryAlertLevel: MemoryAlertLevel = "none";

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|credential|password|passwd|playlist_text|secret|token)/i;
const MAX_STRING_LENGTH = 2_000;
const MAX_ERROR_LENGTH = 4_000;

function redactString(value: string, maxLength = MAX_STRING_LENGTH) {
  return value
    .replace(/([?&](?:username|password|token|secret|key|authorization)=)[^&\s]+/gi, "$1<redacted>")
    .slice(0, maxLength);
}

function sanitizeValue(key: string, value: unknown, depth = 0): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) return "<redacted>";
  if (depth > 3) return "<truncated>";
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message || value.name, MAX_ERROR_LENGTH),
      stack: value.stack ? redactString(value.stack, MAX_ERROR_LENGTH) : undefined,
      cause: value.cause ? sanitizeValue("cause", value.cause, depth + 1) : undefined,
    };
  }
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (typeof value === "undefined") return undefined;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeValue(key, item, depth + 1));
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      const sanitized = sanitizeValue(childKey, childValue, depth + 1);
      if (sanitized !== undefined) result[childKey] = sanitized;
    }
    return result;
  }
  return String(value);
}

function sanitizeFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields)
      .map(([key, value]) => [key, sanitizeValue(key, value)] as const)
      .filter(([, value]) => value !== undefined),
  );
}

function increment(counter: keyof WorkerCounters) {
  counters[counter] += 1;
}

function nowIso() {
  return new Date().toISOString();
}

export function setObservabilityService(name: string) {
  const normalized = name.trim();
  if (normalized) serviceName = normalized;
}

export function createObservationId() {
  return randomUUID();
}

export function hashObservationId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function workerLog(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  const entry = {
    timestamp: nowIso(),
    level,
    service: serviceName,
    event,
    pid: process.pid,
    ...sanitizeFields(fields),
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.log(serialized);
}

export function recordTickStarted(tickId: string) {
  increment("ticks_started");
  activeTickId = tickId;
  lastTickStartedAt = nowIso();
}

export function recordTickCompleted() {
  increment("ticks_completed");
  activeTickId = null;
  activeTaskName = null;
  lastTickCompletedAt = nowIso();
}

export function recordTaskStarted(taskName: string) {
  increment("tasks_started");
  activeTaskName = taskName;
}

export function recordTaskCompleted() {
  increment("tasks_completed");
  activeTaskName = null;
}

export function recordTaskFailed() {
  increment("tasks_failed");
  activeTaskName = null;
  lastTaskFailureAt = nowIso();
}

export function recordRefreshCycleStarted() {
  increment("refresh_cycles_started");
}

export function recordRefreshCycleCompleted() {
  increment("refresh_cycles_completed");
  lastRefreshCompletedAt = nowIso();
}

export function recordRefreshCycleFailed() {
  increment("refresh_cycles_failed");
}

export function recordRefreshServerStarted() {
  increment("refresh_servers_started");
}

export function recordRefreshServerCompleted() {
  increment("refresh_servers_completed");
  lastRefreshCompletedAt = nowIso();
}

export function recordRefreshServerFailed() {
  increment("refresh_servers_failed");
}

export function recordRefreshFallback() {
  increment("refresh_fallbacks");
}

export function recordRefreshCoalesced() {
  increment("refresh_coalesced");
}

export function recordLockAcquired() {
  increment("locks_acquired");
}

export function recordLockContended() {
  increment("locks_contended");
}

export function recordLockStaleRemoved() {
  increment("locks_stale_removed");
}

export function recordLockTimedOut() {
  increment("locks_timed_out");
}

function getMemorySnapshot() {
  const memory = process.memoryUsage();
  return {
    rss_bytes: memory.rss,
    heap_total_bytes: memory.heapTotal,
    heap_used_bytes: memory.heapUsed,
    external_bytes: memory.external,
    array_buffers_bytes: memory.arrayBuffers,
  };
}

export function observeMemoryThresholds(warnMb: number, criticalMb: number) {
  const memory = getMemorySnapshot();
  const rssMb = memory.rss_bytes / 1024 / 1024;
  const nextLevel: MemoryAlertLevel =
    rssMb >= criticalMb ? "critical" : rssMb >= warnMb ? "warning" : "none";

  if (nextLevel !== memoryAlertLevel) {
    memoryAlertLevel = nextLevel;
    if (nextLevel !== "none") {
      increment("memory_alerts");
      workerLog(nextLevel === "critical" ? "error" : "warn", "worker_memory_alert", {
        alert_level: nextLevel,
        rss_mb: Number(rssMb.toFixed(1)),
        warn_mb: warnMb,
        critical_mb: criticalMb,
      });
    } else {
      workerLog("info", "worker_memory_recovered", {
        rss_mb: Number(rssMb.toFixed(1)),
        warn_mb: warnMb,
        critical_mb: criticalMb,
      });
    }
  }

  return { ...memory, rss_mb: Number(rssMb.toFixed(1)), alert_level: memoryAlertLevel };
}

export function getWorkerObservabilitySnapshot() {
  return {
    service: serviceName,
    pid: process.pid,
    uptime_seconds: Number(process.uptime().toFixed(1)),
    memory: getMemorySnapshot(),
    counters: { ...counters },
    activity: {
      tick_in_flight: activeTickId !== null,
      active_tick_id: activeTickId,
      active_task: activeTaskName,
      last_tick_started_at: lastTickStartedAt,
      last_tick_completed_at: lastTickCompletedAt,
      last_task_failure_at: lastTaskFailureAt,
      last_refresh_completed_at: lastRefreshCompletedAt,
      memory_alert_level: memoryAlertLevel,
    },
  };
}
