import { execFileSync } from "node:child_process";

const SERVICES = [
  { name: "main", url: "http://127.0.0.1:6873/" },
  { name: "player", url: "http://127.0.0.1:6874/healthz" },
  { name: "payments", url: "http://127.0.0.1:6875/healthz" },
];

const timeoutMs = Number(process.argv[2] ?? 60_000);
const intervalMs = Number(process.argv[3] ?? 2_000);

if (
  !Number.isFinite(timeoutMs) ||
  timeoutMs < 1 ||
  !Number.isFinite(intervalMs) ||
  intervalMs < 1
) {
  console.error("Uso: node scripts/check-release-readiness.mjs [timeout_ms] [interval_ms]");
  process.exit(2);
}

function parsePm2Json(raw) {
  const jsonStart = raw.indexOf("[");
  if (jsonStart < 0) throw new Error("PM2 não retornou JSON.");
  return JSON.parse(raw.slice(jsonStart));
}

function readPm2State() {
  const raw = execFileSync("pm2", ["jlist"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const expected = new Set([
    "stream-mago-bot",
    "stream-mago-bot-player",
    "stream-mago-bot-payments",
    "stream-mago-bot-worker",
  ]);
  const processes = parsePm2Json(raw)
    .filter((process) => expected.has(process.name))
    .map((process) => ({
      name: process.name,
      status: process.pm2_env?.status ?? "unknown",
      pid: process.pid ?? null,
      restarts: process.pm2_env?.restart_time ?? null,
      memory: process.monit?.memory ?? null,
    }));

  return {
    ok:
      processes.length === expected.size &&
      processes.every((process) => process.status === "online" && process.pid),
    processes,
  };
}

async function checkHttpService(service) {
  try {
    const response = await fetch(service.url, {
      signal: AbortSignal.timeout(5_000),
      headers:
        service.name === "main"
          ? { accept: "text/html,application/xhtml+xml" }
          : { accept: "application/json,text/plain" },
    });
    return {
      name: service.name,
      url: service.url,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
    };
  } catch (error) {
    return {
      name: service.name,
      url: service.url,
      status: null,
      ok: false,
      error: error instanceof Error ? error.name : "request_failed",
    };
  }
}

async function checkReadiness() {
  const http = await Promise.all(SERVICES.map(checkHttpService));
  let pm2;
  try {
    pm2 = readPm2State();
  } catch (error) {
    pm2 = {
      ok: false,
      processes: [],
      error: error instanceof Error ? error.message : "pm2_failed",
    };
  }
  return { ok: pm2.ok && http.every((check) => check.ok), pm2, http };
}

const deadline = Date.now() + timeoutMs;
let lastState;
while (Date.now() <= deadline) {
  lastState = await checkReadiness();
  if (lastState.ok) {
    console.log(JSON.stringify({ ready: true, ...lastState }));
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

console.error(JSON.stringify({ ready: false, timeoutMs, ...lastState }));
process.exit(1);
