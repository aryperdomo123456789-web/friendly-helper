import assert from "node:assert/strict";
import test from "node:test";
import { normalizePlayerQualityOptions, qualityChangeDetails } from "../src/lib/player-quality.ts";

test("normaliza níveis HLS em opções de qualidade seguras", () => {
  const options = normalizePlayerQualityOptions([
    { height: 360, bitrate: 600_000 },
    { height: 720, bitrate: 2_000_000 },
    { height: "1080", bitrate: 0 },
    { width: 1920 },
  ]);

  assert.deepEqual(options, [
    { index: 0, label: "360p", height: 360, bitrate: 600_000 },
    { index: 1, label: "720p", height: 720, bitrate: 2_000_000 },
  ]);
});

test("gera evento manual, automático e rejeita nível desconhecido", () => {
  const options = normalizePlayerQualityOptions([{ height: 360, bitrate: 600_000 }]);

  assert.deepEqual(qualityChangeDetails(options, -1), { reason: "auto" });
  assert.deepEqual(qualityChangeDetails(options, 0), {
    level: 0,
    bitrate: 600_000,
    reason: "manual",
  });
  assert.deepEqual(qualityChangeDetails(options, 4), { reason: "invalid_quality_selection" });
});
