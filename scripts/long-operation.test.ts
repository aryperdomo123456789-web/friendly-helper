import assert from "node:assert/strict";
import test from "node:test";
import {
  createLongOperationMetadata,
  getLongOperationProgress,
  type LongOperationStage,
} from "../src/lib/long-operation.ts";

test("mapeia etapas conhecidas para progresso monotônico", () => {
  const stages: LongOperationStage[] = [
    "queued",
    "acquiring_lock",
    "fetching_m3u",
    "parsing_catalog",
    "fetching_catalog",
    "persisting_cache",
    "completed",
  ];
  const progress = stages.map(getLongOperationProgress);
  assert.deepEqual(progress, [0, 10, 25, 40, 55, 85, 100]);
});

test("não inventa percentual para falha", () => {
  assert.equal(getLongOperationProgress("failed"), null);
});

test("cria metadata sanitizada e elapsed não negativo", () => {
  const metadata = createLongOperationMetadata(
    "refresh-ref",
    "running",
    "fetching_catalog",
    10_000,
    12_500,
  );
  assert.deepEqual(metadata, {
    operation_ref: "refresh-ref",
    operation_state: "running",
    operation_stage: "fetching_catalog",
    progress_percent: 55,
    elapsed_ms: 2_500,
  });

  assert.equal(
    createLongOperationMetadata("refresh-ref", "failed", "failed", 10_000, 9_000).elapsed_ms,
    0,
  );
});

test("reconhece somente estados finais como done", async () => {
  const { isTerminalLongOperationState } = await import("../src/lib/long-operation.ts");
  assert.equal(isTerminalLongOperationState("running"), false);
  assert.equal(isTerminalLongOperationState("cancel_requested"), false);
  assert.equal(isTerminalLongOperationState("succeeded"), true);
  assert.equal(isTerminalLongOperationState("failed"), true);
  assert.equal(isTerminalLongOperationState("cancelled"), true);
});

test("aplica backoff limitado para polling", async () => {
  const { getLongOperationPollDelay } = await import("../src/lib/long-operation.ts");
  assert.deepEqual(
    [0, 1, 2, 3, 20].map(getLongOperationPollDelay),
    [1000, 1500, 2250, 3375, 15000],
  );
});
