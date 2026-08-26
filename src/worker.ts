import { refreshServerCatalogCache } from "@/lib/iptv-cache.server";
import { createWorkerScheduler } from "@/lib/worker-scheduler";

type WorkerTask = {
  name: string;
  run: () => Promise<void>;
};

const WORKER_INTERVAL_MS = parseDuration(process.env["WORKER_INTERVAL_MS"] ?? "900000");
const ENABLE_CACHE_REFRESH = parseBoolean(process.env["WORKER_REFRESH_CATALOG"] ?? "1");
const ENABLE_PRUNE = parseBoolean(process.env["WORKER_PRUNE_LOGS"] ?? "0");

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
    run: async () => {
      console.log("[worker] prune-maintenance ainda e um placeholder controlado.");
    },
  });
}

async function main() {
  const scheduler = createWorkerScheduler({
    intervalMs: WORKER_INTERVAL_MS,
    runTick,
    onError: (error) => {
      console.error("[worker] erro inesperado no tick", error);
    },
  });

  console.log("[worker] iniciado", {
    intervalMs: WORKER_INTERVAL_MS,
    tasks: tasks.map((task) => task.name),
  });

  const shutdown = async (signal: string) => {
    console.log(`[worker] encerrando por ${signal}`);
    await scheduler.stop();
    process.exitCode = 0;
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await scheduler.start();
}

async function runTick() {
  for (const task of tasks) {
    const startedAt = Date.now();
    try {
      console.log(`[worker] task ${task.name} iniciada`);
      await task.run();
      console.log(`[worker] task ${task.name} concluida em ${Date.now() - startedAt}ms`);
    } catch (error) {
      console.error(`[worker] task ${task.name} falhou`, error);
    }
  }
}

async function refreshActiveServerCatalogs() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: servers, error } = await supabaseAdmin
    .from("iptv_servers")
    .select("id")
    .eq("is_active", true);

  if (error) throw error;
  const activeServers = servers ?? [];
  if (activeServers.length === 0) {
    console.log("[worker] nenhum servidor ativo para refresh");
    return;
  }

  for (const server of activeServers) {
    await refreshServerCatalogCache(server.id);
  }
}

function parseBoolean(value: string): boolean {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseDuration(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 30_000) return 900_000;
  return Math.floor(parsed);
}

void main().catch((error) => {
  console.error("[worker] falha fatal na inicialização", error);
  process.exitCode = 1;
});
