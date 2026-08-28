import assert from "node:assert/strict";
import test from "node:test";
import {
  createPlaybackTelemetry,
  sanitizePlaybackErrorCode,
  sanitizePlaybackReason,
} from "../src/lib/player-telemetry.ts";

test("agrega primeiro frame e buffering sem duplicar eventos de estado", async () => {
  let now = 1_000;
  const sent: Array<{ events: Array<{ name: string; duration_ms?: number }> }> = [];
  const telemetry = createPlaybackTelemetry({
    sessionId: "session-lab-001",
    serverId: "00000000-0000-4000-8000-000000000001",
    kind: "live",
    engine: "hls.js",
    now: () => now,
    send: async (batch) => {
      sent.push(batch);
    },
  });

  telemetry.record("startup_requested");
  now = 1_250;
  telemetry.markFirstFrame();
  telemetry.markFirstFrame();
  now = 2_000;
  telemetry.markBufferStart();
  telemetry.markBufferStart();
  now = 2_600;
  telemetry.markBufferEnd();

  const summary = telemetry.summary();
  assert.equal(summary.first_frame_ms, 250);
  assert.equal(summary.startup_success, true);
  assert.equal(summary.rebuffer_count, 1);
  assert.equal(summary.rebuffer_duration_ms, 600);
  assert.equal(summary.playback_duration_ms, 1_600);
  assert.equal(summary.stall_rate_per_min, 37.5);
  assert.equal(summary.event_count, 4);

  await telemetry.flush();
  assert.equal(sent.length, 1);
  assert.deepEqual(
    sent[0]?.events.map((event) => event.name),
    ["startup_requested", "first_frame", "buffer_start", "buffer_end"],
  );
  assert.equal(sent[0]?.events[1]?.duration_ms, 250);

  await telemetry.destroy("test_complete");
  assert.equal(sent.length, 2);
  assert.equal(sent[1]?.events[0]?.name, "qoe_summary");
  assert.equal(sent[1]?.events[0]?.rebuffer_count, 1);
  assert.equal(sent[1]?.events[0]?.stall_rate_per_min, 37.5);
  assert.equal(sent[1]?.events[1]?.name, "destroyed");
});

test("sanitiza códigos e motivos de erro de playback", () => {
  assert.equal(
    sanitizePlaybackErrorCode("NETWORK_ERROR: https://panel.test/player?password=secret"),
    "network_error_url",
  );
  assert.equal(
    sanitizePlaybackReason("Falha em https://panel.test/a.m3u8 token=abc123 senha=xyz"),
    "Falha em [url] token=[redacted] senha=[redacted]",
  );
});

test("não bloqueia o fechamento quando o endpoint de telemetria falha", async () => {
  let calls = 0;
  const telemetry = createPlaybackTelemetry({
    sessionId: "session-lab-002",
    serverId: "00000000-0000-4000-8000-000000000002",
    kind: "movie",
    engine: "native",
    send: async () => {
      calls += 1;
      throw new Error("telemetry unavailable");
    },
  });

  telemetry.record("startup_requested");
  await telemetry.destroy("network_test");
  assert.equal(calls, 1);
});
