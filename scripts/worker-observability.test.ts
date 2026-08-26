import assert from "node:assert/strict";
import test from "node:test";

import {
  getWorkerObservabilitySnapshot,
  hashObservationId,
  observeMemoryThresholds,
  recordLockContended,
  recordTaskFailed,
  recordTaskStarted,
  recordTickCompleted,
  recordTickStarted,
  workerLog,
} from "../src/lib/worker-observability.server.ts";

test("emite log JSON e redige campos sensíveis aninhados", () => {
  const entries: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => entries.push(String(args[0]));

  try {
    workerLog("info", "test_observability", {
      password: "nao-deve-aparecer",
      nested: { token: "nao-deve-aparecer", visible: "ok" },
      url: "https://example.test/path?username=user&password=secret",
    });
  } finally {
    console.log = originalLog;
  }

  assert.equal(entries.length, 1);
  const parsed = JSON.parse(entries[0] ?? "{}") as Record<string, unknown>;
  assert.equal(parsed.event, "test_observability");
  assert.equal(parsed.password, "<redacted>");
  assert.deepEqual(parsed.nested, { token: "<redacted>", visible: "ok" });
  assert.equal(parsed.url, "https://example.test/path?username=<redacted>&password=<redacted>");
});

test("gera uma referência determinística sem expor o identificador original", () => {
  const first = hashObservationId("server-laboratorio");
  const second = hashObservationId("server-laboratorio");

  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{16}$/);
  assert.notEqual(first, "server-laboratorio");
});

test("acumula métricas de atividade e mantém limiar de memória configurável", () => {
  const before = getWorkerObservabilitySnapshot();
  const tickId = `test-tick-${Date.now()}`;

  recordTickStarted(tickId);
  recordTaskStarted("test-task");
  recordTaskFailed();
  recordLockContended();
  const memory = observeMemoryThresholds(1_000_000, 2_000_000);
  const after = getWorkerObservabilitySnapshot();

  assert.equal(after.activity.tick_in_flight, true);
  assert.ok(after.counters.ticks_started >= before.counters.ticks_started + 1);
  assert.ok(after.counters.tasks_started >= before.counters.tasks_started + 1);
  assert.ok(after.counters.tasks_failed >= before.counters.tasks_failed + 1);
  assert.ok(after.counters.locks_contended >= before.counters.locks_contended + 1);
  assert.equal(memory.alert_level, "none");
  recordTickCompleted();
});
