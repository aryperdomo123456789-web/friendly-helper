import assert from "node:assert/strict";
import test from "node:test";
import { createAutoHealingController } from "../src/lib/player-auto-healing.ts";

test("switches upstream after repeated failures and then recovers", () => {
  const controller = createAutoHealingController({
    maxRecoveryAttempts: 2,
    upstreamCount: 2,
    switchAfterFailures: 3,
  });

  assert.equal(controller.observeFailure({ reason: "network", status: 502 }).action, "recover");
  assert.equal(controller.observeFailure({ reason: "network", status: 502 }).action, "recover");
  assert.equal(
    controller.observeFailure({ reason: "network", status: 502 }).action,
    "switch_upstream",
  );
  assert.equal(controller.markUpstreamSwitch().state, "recovering");
  assert.equal(controller.observeHealthy().state, "healthy");
  assert.deepEqual(controller.snapshot(), {
    state: "healthy",
    failureStreak: 0,
    recoveryCount: 0,
    upstreamIndex: 1,
  });
});

test("fails closed after bounded recovery attempts without another upstream", () => {
  const controller = createAutoHealingController({
    maxRecoveryAttempts: 2,
    upstreamCount: 1,
    switchAfterFailures: 3,
  });

  assert.equal(controller.observeFailure({ reason: "media" }).action, "recover");
  assert.equal(controller.observeFailure({ reason: "media" }).action, "recover");
  assert.equal(controller.observeFailure({ reason: "media" }).action, "fail");
  assert.equal(controller.snapshot().state, "failed");
});
