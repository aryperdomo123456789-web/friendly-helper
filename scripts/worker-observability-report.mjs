#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const rootArg = process.argv.find((arg) => arg.startsWith("--root="));
const rootDir = resolve(
  rootArg ? rootArg.slice("--root=".length) : process.env.WORKER_REPORT_ROOT || process.cwd(),
);
const pm2Name = process.env.WORKER_REPORT_PM2_NAME || "stream-mago-bot-worker";
const memoryWarnMb = positiveNumber(process.env.WORKER_MEMORY_WARN_MB, 384);
const memoryCriticalMb = Math.max(
  memoryWarnMb + 1,
  positiveNumber(process.env.WORKER_MEMORY_CRITICAL_MB, 460),
);
const restartAlertThreshold = positiveNumber(process.env.WORKER_RESTART_ALERT_THRESHOLD, 5);
const lockStaleSeconds = positiveNumber(process.env.WORKER_LOCK_STALE_SECONDS, 900);
const heartbeatStaleSeconds = positiveNumber(process.env.WORKER_HEARTBEAT_STALE_SECONDS, 180);
const errorAlertThreshold = positiveNumber(process.env.WORKER_ERROR_ALERT_THRESHOLD, 5);
const now = Date.now();
const CONTROL_FAILURE_EVENTS = new Set([
  "worker_task_failed",
  "worker_fatal_startup_error",
  "worker_scheduler_error",
  "refresh_lock_timeout",
  "refresh_cycle_failed",
]);

const alerts = [];
const pm2 = readPm2State();
const locks = readLocks();
const logs = readLogs();

if (pm2.error) {
  alerts.push({ severity: "critical", code: "pm2_unavailable", message: pm2.error });
} else if (!pm2.process) {
  alerts.push({
    severity: "critical",
    code: "worker_missing",
    message: `Processo ${pm2Name} não encontrado.`,
  });
} else {
  if (pm2.process.status !== "online" || !pm2.process.pid) {
    alerts.push({
      severity: "critical",
      code: "worker_not_online",
      message: "Worker não está online no PM2.",
    });
  }
  const memoryMb = pm2.process.memory_mb;
  if (memoryMb !== null && memoryMb >= memoryCriticalMb) {
    alerts.push({
      severity: "critical",
      code: "worker_memory_critical",
      message: `Memória do worker acima do limite crítico (${memoryMb} MiB).`,
    });
  } else if (memoryMb !== null && memoryMb >= memoryWarnMb) {
    alerts.push({
      severity: "warning",
      code: "worker_memory_warning",
      message: `Memória do worker acima do limite de atenção (${memoryMb} MiB).`,
    });
  }
  if (pm2.process.restarts >= restartAlertThreshold) {
    alerts.push({
      severity: "critical",
      code: "worker_restarts_high",
      message: `Reinícios PM2 acima do limite (${pm2.process.restarts}).`,
    });
  }
}

for (const lock of locks) {
  if (lock.age_seconds >= lockStaleSeconds) {
    alerts.push({
      severity: "critical",
      code: "stale_lock",
      message: `Lock ${lock.path_ref} está stale há ${lock.age_seconds}s.`,
    });
  } else if (!lock.owner_alive) {
    alerts.push({
      severity: "warning",
      code: "orphan_lock",
      message: `Lock ${lock.path_ref} pertence a um PID encerrado.`,
    });
  }
}

if (logs.error_events_recent >= errorAlertThreshold) {
  alerts.push({
    severity: "critical",
    code: "worker_error_burst",
    message: `${logs.error_events_recent} eventos de erro no intervalo monitorado.`,
  });
}

if (logs.last_heartbeat_at) {
  const heartbeatAge = Math.max(0, Math.floor((now - Date.parse(logs.last_heartbeat_at)) / 1000));
  if (heartbeatAge >= heartbeatStaleSeconds && pm2.process?.status === "online") {
    alerts.push({
      severity: "critical",
      code: "heartbeat_stale",
      message: `Último heartbeat há ${heartbeatAge}s.`,
    });
  }
} else if (pm2.process?.status === "online") {
  alerts.push({
    severity: "warning",
    code: "heartbeat_missing",
    message: "Nenhum heartbeat estruturado encontrado nos logs.",
  });
}

const report = {
  generated_at: new Date(now).toISOString(),
  status: alerts.length === 0 ? "healthy" : "alert",
  thresholds: {
    memory_warn_mb: memoryWarnMb,
    memory_critical_mb: memoryCriticalMb,
    restart_alert_threshold: restartAlertThreshold,
    lock_stale_seconds: lockStaleSeconds,
    heartbeat_stale_seconds: heartbeatStaleSeconds,
    error_alert_threshold: errorAlertThreshold,
  },
  pm2,
  locks: {
    count: locks.length,
    orphaned_count: locks.filter((lock) => !lock.owner_alive).length,
    stale_count: locks.filter((lock) => lock.age_seconds >= lockStaleSeconds).length,
    items: locks,
  },
  logs,
  alerts,
};

console.log(JSON.stringify(report));
if (alerts.length > 0 && !args.has("--no-fail")) process.exitCode = 1;

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPm2State() {
  try {
    const raw = execFileSync("pm2", ["jlist"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const jsonStart = raw.indexOf("[");
    if (jsonStart < 0) return { process: null, error: "PM2 não retornou JSON." };
    const process = JSON.parse(raw.slice(jsonStart)).find((item) => item.name === pm2Name);
    if (!process) return { process: null };
    return {
      process: {
        name: process.name,
        status: process.pm2_env?.status ?? "unknown",
        pid: process.pid ?? null,
        restarts: process.pm2_env?.restart_time ?? 0,
        uptime_seconds: process.pm2_env?.pm_uptime
          ? Math.max(0, Math.floor((Date.now() - process.pm2_env.pm_uptime) / 1000))
          : null,
        memory_mb: process.monit?.memory
          ? Number((process.monit.memory / 1024 / 1024).toFixed(1))
          : null,
        cpu_percent: process.monit?.cpu ?? null,
      },
    };
  } catch (error) {
    return {
      process: null,
      error: error instanceof Error ? error.message : "Falha ao consultar PM2.",
    };
  }
}

function readLocks() {
  const lockDir = resolve(process.env.WORKER_LOCK_ROOT || join(rootDir, "storage", "locks"));
  if (!existsSync(lockDir)) return [];

  return readdirSync(lockDir)
    .filter((name) => name.endsWith(".lock"))
    .map((name) => {
      const path = join(lockDir, name);
      let payload = {};
      try {
        payload = JSON.parse(readFileSync(path, "utf8"));
      } catch {
        payload = {};
      }
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) payload = {};
      let ageSeconds;
      try {
        ageSeconds = Math.max(0, Math.floor((now - statSync(path).mtimeMs) / 1000));
      } catch {
        return null;
      }
      const ownerPid = Number.isInteger(payload.pid) ? payload.pid : null;
      return {
        path_ref: createHash("sha256").update(name).digest("hex").slice(0, 12),
        age_seconds: ageSeconds,
        owner_pid: ownerPid,
        owner_alive: ownerPid ? existsSync(`/proc/${ownerPid}`) : false,
        started_at: typeof payload.started_at === "string" ? payload.started_at : null,
      };
    })
    .filter(Boolean);
}

function readLogs() {
  const files = [
    resolve(process.env.WORKER_LOG_OUT || join(rootDir, "logs", "worker.out.log")),
    resolve(process.env.WORKER_LOG_ERR || join(rootDir, "logs", "worker.err.log")),
  ];
  const windowStart = now - positiveNumber(process.env.WORKER_LOG_WINDOW_SECONDS, 3600) * 1000;
  const result = {
    files: files.map((file) => ({
      path: file,
      exists: existsSync(file),
      lines: existsSync(file) ? readFileSync(file, "utf8").split(/\r?\n/).length - 1 : 0,
    })),
    error_events_recent: 0,
    warning_events_recent: 0,
    task_started_recent: 0,
    task_completed_recent: 0,
    task_failed_recent: 0,
    refresh_fallback_recent: 0,
    refresh_lock_timeout_recent: 0,
    heartbeat_recent: 0,
    last_heartbeat_at: null,
  };

  for (const file of files) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const timestamp = extractTimestamp(line);
      if (!timestamp || Date.parse(timestamp) < windowStart) continue;
      const event = parseStructuredEvent(line);
      const eventName = event?.event ?? "";
      const level = event?.level ?? "";
      const legacyFailure = /\[worker\].*(falhou|falha fatal)/i.test(line);
      const legacyWarning = /\[worker\].*(warning|warn|indisponível|fallback)/i.test(line);
      const controlFailure = CONTROL_FAILURE_EVENTS.has(eventName);

      if (controlFailure || legacyFailure || /Outro refresh já está em andamento/i.test(line))
        result.error_events_recent += 1;
      if (level === "warn" || legacyWarning) result.warning_events_recent += 1;
      if (eventName === "worker_task_started" || /task .* iniciada/i.test(line))
        result.task_started_recent += 1;
      if (eventName === "worker_task_completed" || /task .* conclu[ií]da/i.test(line))
        result.task_completed_recent += 1;
      if (eventName === "worker_task_failed" || /task .* falhou/i.test(line))
        result.task_failed_recent += 1;
      if (
        eventName === "refresh_m3u_failed_fallback" ||
        eventName === "refresh_m3u_empty_fallback" ||
        /mantendo fallback Xtream/i.test(line)
      )
        result.refresh_fallback_recent += 1;
      if (eventName === "refresh_lock_timeout" || /Outro refresh já está em andamento/i.test(line))
        result.refresh_lock_timeout_recent += 1;
      if (eventName === "worker_heartbeat" || /worker_heartbeat/i.test(line)) {
        result.heartbeat_recent += 1;
        if (
          !result.last_heartbeat_at ||
          Date.parse(timestamp) > Date.parse(result.last_heartbeat_at)
        ) {
          result.last_heartbeat_at = timestamp;
        }
      }
    }
  }

  return result;
}

function parseStructuredEvent(line) {
  const jsonStart = line.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    return JSON.parse(line.slice(jsonStart));
  } catch {
    return null;
  }
}

function extractTimestamp(line) {
  const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/);
  return match?.[1] ?? null;
}
