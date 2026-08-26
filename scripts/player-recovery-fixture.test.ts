import assert from "node:assert/strict";
import test from "node:test";
import { runRecoveryMatrix, type RecoveryScenarioId } from "./player-recovery-fixture.ts";

const REQUIRED_SCENARIOS: RecoveryScenarioId[] = [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
];

const FORBIDDEN_EVENT_NAMES = new Set([
  "autoplay_blocked",
  "url_exposed",
  "token_exposed",
  "playlist_exposed",
]);

test("fixture isolado aprova a matriz de recovery R1-R10", async () => {
  const results = await runRecoveryMatrix();

  assert.deepEqual(
    results.map((result) => result.id),
    REQUIRED_SCENARIOS,
  );
  assert.ok(results.every((result) => result.status === "pass"));
  assert.ok(
    results.every((result) => result.events.every((event) => !FORBIDDEN_EVENT_NAMES.has(event))),
  );
  assert.ok(results.every((result) => result.events.includes("destroyed")));

  const resultById = new Map(results.map((result) => [result.id, result]));
  assert.equal(resultById.get("R1")?.recoveryCount, 1);
  assert.equal(resultById.get("R3")?.fallbackCount, 1);
  assert.equal(resultById.get("R4")?.fallbackCount, 1);
  assert.equal(resultById.get("R5")?.firstFrameMs, null);
  assert.ok((resultById.get("R6")?.firstFrameMs ?? 0) > 0);
  assert.equal(resultById.get("R7")?.firstFrameMs, null);
  assert.ok((resultById.get("R10")?.firstFrameMs ?? 0) > 0);
});
