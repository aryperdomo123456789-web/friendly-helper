import { performance } from "node:perf_hooks";
import {
  buildEpgGridRows,
  filterEpgGridRows,
  getEpgTimeline,
  getTimelineVirtualWindow,
  getVirtualWindow,
} from "../src/lib/epg-client.ts";
import { createAutoHealingController } from "../src/lib/player-auto-healing.ts";

const BASE_MS = 1_700_000_000_000;
const CHANNEL_COUNT = 48;
const PROGRAMS_PER_CHANNEL = 240;
const SEARCH_ITERATIONS = 1_000;
const PLAYBACK_SESSIONS = 256;
const TICKS_PER_SESSION = 30;

function makeProgram(channelIndex, programIndex) {
  const startMs = BASE_MS + programIndex * 30 * 60 * 1000;
  return {
    title: `Programa ${channelIndex}-${programIndex}`,
    description: "synthetic-load",
    start: new Date(startMs).toISOString(),
    end: new Date(startMs + 30 * 60 * 1000).toISOString(),
    start_timestamp: String(Math.floor(startMs / 1000)),
    stop_timestamp: String(Math.floor((startMs + 30 * 60 * 1000) / 1000)),
  };
}

const channels = Array.from({ length: CHANNEL_COUNT }, (_, channelIndex) => ({
  id: `channel-${channelIndex}`,
  name: `Canal ${channelIndex}`,
  programs: Array.from({ length: PROGRAMS_PER_CHANNEL }, (_, programIndex) =>
    makeProgram(channelIndex, programIndex),
  ),
}));

const startedAt = performance.now();
const rows = buildEpgGridRows(channels, BASE_MS + 60 * 60 * 1000);
const indexedMs = performance.now() - startedAt;
const timeline = getEpgTimeline(BASE_MS + 60 * 60 * 1000);
let matchedRows = 0;
let virtualRows = 0;
let virtualTimeline = 0;
const searchStartedAt = performance.now();
for (let index = 0; index < SEARCH_ITERATIONS; index += 1) {
  const filtered = filterEpgGridRows(rows, index % 2 === 0 ? "programa 1" : "canal 47");
  matchedRows += filtered.length;
  const rowWindow = getVirtualWindow(rows.length, (index * 37) % 2_000, 280, 112, 2);
  virtualRows += rowWindow.end - rowWindow.start;
  const timelineWindow = getTimelineVirtualWindow(
    timeline,
    (index * 13) % 1_000,
    640,
    1_440,
    240,
  );
  virtualTimeline += timelineWindow.widthPx;
}
const searchMs = performance.now() - searchStartedAt;

const recoveryStartedAt = performance.now();
let recoveryActions = 0;
let upstreamSwitches = 0;
for (let session = 0; session < PLAYBACK_SESSIONS; session += 1) {
  const controller = createAutoHealingController({
    maxRecoveryAttempts: 3,
    upstreamCount: 2,
    switchAfterFailures: 3,
  });
  for (let tick = 0; tick < TICKS_PER_SESSION; tick += 1) {
    const failed = tick === 5 || (session % 11 === 0 && tick === 6) || (session % 17 === 0 && tick === 7);
    const decision = failed
      ? controller.observeFailure({ reason: "synthetic_network", status: 502 })
      : controller.observeHealthy();
    if (decision.action === "recover") recoveryActions += 1;
    if (decision.action === "switch_upstream") {
      upstreamSwitches += 1;
      controller.markUpstreamSwitch();
    }
  }
}
const recoveryMs = performance.now() - recoveryStartedAt;

const result = {
  dataset: "synthetic-deterministic",
  epg_events: CHANNEL_COUNT * PROGRAMS_PER_CHANNEL,
  epg_channels: CHANNEL_COUNT,
  indexed_ms: Number(indexedMs.toFixed(2)),
  search_iterations: SEARCH_ITERATIONS,
  search_ms: Number(searchMs.toFixed(2)),
  average_search_ms: Number((searchMs / SEARCH_ITERATIONS).toFixed(4)),
  average_virtual_rows: Number((virtualRows / SEARCH_ITERATIONS).toFixed(2)),
  average_virtual_timeline_px: Number((virtualTimeline / SEARCH_ITERATIONS).toFixed(2)),
  matched_rows_accumulator: matchedRows,
  playback_sessions: PLAYBACK_SESSIONS,
  playback_ticks: PLAYBACK_SESSIONS * TICKS_PER_SESSION,
  recovery_actions: recoveryActions,
  upstream_switches: upstreamSwitches,
  recovery_ms: Number(recoveryMs.toFixed(2)),
};

console.log(JSON.stringify(result, null, 2));
