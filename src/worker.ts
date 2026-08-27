import { executeServerCatalogRefresh } from "@/lib/iptv-cache.server";
import {
  claimNextRefreshOperation,
  createRefreshOperation,
  isRefreshOperationCancellationRequested,
  pruneRefreshOperations,
  updateRefreshOperation,
} from "@/lib/long-running-operations.server";
import { getLongOperationProgress } from "@/lib/long-operation";
import {
  createObservationId,
  getWorkerEnv,
  getWorkerObservabilitySnapshot,
  hashObservationId,
  observeMemoryThresholds,
  recordRefreshCycleCompleted,
  recordRefreshCycleFailed,
  recordRefreshCycleStarted,
  recordTaskCompleted,
  recordTaskFailed,
  recordTaskStarted,
  recordTickCompleted,
  recordTickStarted,
  setObservabilityService,
  workerLog,
} from "@/lib/worker-observability.server";
import { createWorkerScheduler } from "@/lib/worker-scheduler";

type WorkerTask = {
  name: string;
  run: () => Promise<void>;
};

const WORKER_INTERVAL_MS = parseDuration(getWorkerEnv("WORKER_INTERVAL_MS") ?? "900000");
const HEARTBEAT_INTERVAL_MS = parseDuration(
  getWorkerEnv("WORKER_HEARTBEAT_INTERVAL_MS") ?? "60000",
  60_000,
);
const ENABLE_CACHE_REFRESH = parseBoolean(getWorkerEnv("WORKER_REFRESH_CATALOG") ?? "1");
const ENABLE_PRUNE = parseBoolean(getWorkerEnv("WORKER_PRUNE_LOGS") ?? "1");
const OPERATION_POLL_INTERVAL_MS = parseDuration(
  getWorkerEnv("WORKER_OPERATION_POLL_INTERVAL_MS") ?? "10000",
  10_000,
);
const OPERATION_WORKER_REF = hashObservationId(createObservationId());
const MEMORY_WARN_MB = parsePositiveNumber(getWorkerEnv("WORKER_MEMORY_WARN_MB") ?? "384", 384);
const MEMORY_CRITICAL_MB = Math.max(
  MEMORY_WARN_MB + 1,
  parsePositiveNumber(getWorkerEnv("WORKER_MEMORY_CRITICAL_MB") ?? "460", 460),
);

const tasks: WorkerTask[] = [];

if (ENABLE_CACHE_REFRESH) {
  tasks.push({
    name: "refresh-server-catalog",
    run: refreshActiveServerCatalogs,
  });
}

if (ENABLE_PRUNE) {
  tasks.push({
    name: "prune-maintenance",
    run: pruneLongRunningOperations,
  });
}

async function main() {
  setObservabilityService(getWorkerEnv("WORKER_SERVICE_NAME") ?? "stream-mago-bot-worker");

  const scheduler = createWorkerScheduler({
    intervalMs: WORKER_INTERVAL_MS,
    runTick,
    onError: (error) => {
      workerLog("error", "worker_scheduler_error", { error });
    },
  });
  const operationScheduler = createWorkerScheduler({
    intervalMs: OPERATION_POLL_INTERVAL_MS,
    runTick: processNextRefreshOperation,
    onError: (error) => {
      workerLog("error", "operation_scheduler_error", { error });
    },
  });

  const heartbeatTimer = setInterval(() => {
    const memory = observeMemoryThresholds(MEMORY_WARN_MB, MEMORY_CRITICAL_MB);
    workerLog("info", "worker_heartbeat", {
      interval_ms: WORKER_INTERVAL_MS,
      heartbeat_interval_ms: HEARTBEAT_INTERVAL_MS,
      configured_tasks: tasks.map((task) => task.name),
      operation_poll_interval_ms: OPERATION_POLL_INTERVAL_MS,
      memory,
      observability: getWorkerObservabilitySnapshot(),
    });
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref?.();

  workerLog("info", "worker_started", {
    interval_ms: WORKER_INTERVAL_MS,
    heartbeat_interval_ms: HEARTBEAT_INTERVAL_MS,
    memory_warn_mb: MEMORY_WARN_MB,
    memory_critical_mb: MEMORY_CRITICAL_MB,
    configured_tasks: tasks.map((task) => task.name),
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(heartbeatTimer);
    workerLog("info", "worker_shutdown_started", { signal });
    await Promise.all([scheduler.stop(), operationScheduler.stop()]);
    workerLog("info", "worker_shutdown_completed", {
      signal,
      observability: getWorkerObservabilitySnapshot(),
    });
    process.exitCode = 0;
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await Promise.all([operationScheduler.start(), scheduler.start()]);
}

async function runTick() {
  const tickId = createObservationId();
  const tickRef = hashObservationId(tickId);
  const startedAt = Date.now();
  let failedTasks = 0;
  recordTickStarted(tickId);
  workerLog("info", "worker_tick_started", {
    tick_ref: tickRef,
    task_count: tasks.length,
  });

  try {
    for (const task of tasks) {
      const taskStartedAt = Date.now();
      recordTaskStarted(task.name);
      workerLog("info", "worker_task_started", {
        tick_ref: tickRef,
        task: task.name,
      });

      try {
        await task.run();
        recordTaskCompleted();
        workerLog("info", "worker_task_completed", {
          tick_ref: tickRef,
          task: task.name,
          duration_ms: Date.now() - taskStartedAt,
        });
      } catch (error) {
        failedTasks += 1;
        recordTaskFailed();
        workerLog("error", "worker_task_failed", {
          tick_ref: tickRef,
          task: task.name,
          duration_ms: Date.now() - taskStartedAt,
          error,
        });
      }
    }
  } finally {
    recordTickCompleted();
    workerLog("info", "worker_tick_completed", {
      tick_ref: tickRef,
      duration_ms: Date.now() - startedAt,
      failed_tasks: failedTasks,
    });
  }
}

async function refreshActiveServerCatalogs() {
  const cycleId = createObservationId();
  const cycleRef = hashObservationId(cycleId);
  const startedAt = Date.now();
  recordRefreshCycleStarted();
  workerLog("info", "refresh_cycle_started", { cycle_ref: cycleRef });

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: servers, error } = await supabaseAdmin
      .from("iptv_servers")
      .select("id")
      .eq("is_active", true);

    if (error) throw error;
    const activeServers = servers ?? [];
    let enqueuedServers = 0;
    for (const server of activeServers) {
      const serverRef = hashObservationId(server.id);
      const created = await createRefreshOperation(server.id, null, { initialStatus: "pending" });
      if (!created.coalesced) enqueuedServers += 1;
      workerLog("info", "refresh_operation_enqueued", {
        cycle_ref: cycleRef,
        server_ref: serverRef,
        coalesced: created.coalesced,
      });
    }

    recordRefreshCycleCompleted();
    workerLog("info", "refresh_cycle_completed", {
      cycle_ref: cycleRef,
      duration_ms: Date.now() - startedAt,
      active_servers: activeServers.length,
      enqueued_servers: enqueuedServers,
    });
  } catch (error) {
    recordRefreshCycleFailed();
    workerLog("error", "refresh_cycle_failed", {
      cycle_ref: cycleRef,
      duration_ms: Date.now() - startedAt,
      error,
    });
    throw error;
  }
}

async function processNextRefreshOperation() {
  const operation = await claimNextRefreshOperation(OPERATION_WORKER_REF);
  if (!operation) return;

  const operationRef = operation.operation_ref;
  const operationLogRef = hashObservationId(operationRef);
  const clearLocalBeforeFetch = operation.request_payload["clear_local_before_fetch"] === true;
  if (operation.status === "cancelled") {
    workerLog("info", "refresh_operation_cancelled_before_start", {
      operation_ref: operationLogRef,
      server_ref: hashObservationId(operation.server_id),
    });
    return;
  }

  workerLog("info", "refresh_operation_claimed", {
    operation_ref: operationLogRef,
    server_ref: hashObservationId(operation.server_id),
    attempt_count: operation.attempt_count,
  });
  try {
    await executeServerCatalogRefresh(
      operation.server_id,
      operationRef,
      { clearLocalBeforeFetch },
      {
        isCancellationRequested: () => isRefreshOperationCancellationRequested(operationRef),
        onProgress: async (status, stage, details) => {
          const patch: Parameters<typeof updateRefreshOperation>[1] = {
            status,
            stage,
            progressPercent: getLongOperationProgress(stage),
          };
          if (status === "succeeded" && details) patch.result = details;
          if (status === "failed") {
            patch.error = { code: "REFRESH_FAILED", message: "Falha ao atualizar o catálogo." };
          }
          if (details) patch.details = details;
          patch.workerRef = OPERATION_WORKER_REF;
          return updateRefreshOperation(operationRef, patch);
        },
      },
    );
  } catch (error) {
    workerLog("error", "refresh_operation_execution_finished_with_error", {
      operation_ref: operationLogRef,
      server_ref: hashObservationId(operation.server_id),
      error,
    });
  }
}

async function pruneLongRunningOperations() {
  const deleted = await pruneRefreshOperations();
  workerLog("info", "long_running_operations_pruned", {
    deleted_operations: deleted,
    retention_days: 30,
  });
}

function parseBoolean(value: string): boolean {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePositiveNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDuration(value: string, fallback = 900_000): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 30_000) return fallback;
  return Math.floor(parsed);
}

void main().catch((error) => {
  workerLog("error", "worker_fatal_startup_error", { error });
  process.exitCode = 1;
});
