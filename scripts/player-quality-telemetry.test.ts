import assert from "node:assert/strict";
import test from "node:test";
import { createPlaybackTelemetry } from "../src/lib/player-telemetry.ts";

test("emite quality_sample com bitrate e contadores de frames sanitizados", async () => {
  const batches: Array<{ events: Array<Record<string, unknown>> }> = [];
  const telemetry = createPlaybackTelemetry({
    sessionId: "quality-session-123",
    serverId: "00000000-0000-4000-8000-000000000001",
    kind: "live",
    engine: "hls.js",
    send: async (batch) => {
      batches.push(batch as unknown as { events: Array<Record<string, unknown>> });
    },
    now: () => 1_000,
  });

  telemetry.record("quality_sample", {
    level: 2,
    bitrate: 1_500_000,
    dropped_frames: 3.8,
    decoded_frames: 120.2,
  });
  await telemetry.flush();
  await telemetry.destroy("test");

  const qualityEvent = batches
    .flatMap((batch) => batch.events)
    .find((event) => event.name === "quality_sample");
  assert.deepEqual(qualityEvent, {
    name: "quality_sample",
    at_ms: 0,
    bitrate: 1_500_000,
    level: 2,
    dropped_frames: 4,
    decoded_frames: 120,
  });
});
