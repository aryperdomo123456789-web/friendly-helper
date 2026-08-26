import assert from "node:assert/strict";
import test from "node:test";

import { createWorkerScheduler } from "../src/lib/worker-scheduler.ts";

test("não inicia um segundo tick enquanto o primeiro está em andamento", async () => {
  const scheduled: Array<() => void> = [];
  let resolveTick: (() => void) | undefined;
  let runs = 0;

  const scheduler = createWorkerScheduler({
    intervalMs: 100,
    runTick: async () => {
      runs += 1;
      await new Promise<void>((resolve) => {
        resolveTick = resolve;
      });
    },
    setTimer: (callback) => {
      scheduled.push(callback);
      return callback;
    },
    clearTimer: () => {},
  });

  const startPromise = scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(runs, 1);

  scheduled[0]?.();
  await Promise.resolve();
  assert.equal(runs, 1);

  resolveTick?.();
  await startPromise;
  assert.equal(runs, 1);
  assert.equal(scheduled.length, 1);

  await scheduler.stop();
});

test("agenda o próximo tick somente depois da conclusão do tick atual", async () => {
  const scheduled: Array<() => void> = [];
  let runs = 0;

  const scheduler = createWorkerScheduler({
    intervalMs: 100,
    runTick: async () => {
      runs += 1;
    },
    setTimer: (callback) => {
      scheduled.push(callback);
      return callback;
    },
    clearTimer: () => {},
  });

  await scheduler.start();
  assert.equal(runs, 1);
  assert.equal(scheduled.length, 1);

  scheduled[0]?.();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(runs, 2);
  assert.equal(scheduled.length, 2);

  await scheduler.stop();
});

test("stop aguarda o tick ativo e cancela o timer pendente", async () => {
  const scheduled: Array<() => void> = [];
  let resolveTick: (() => void) | undefined;
  let clearCalls = 0;

  const scheduler = createWorkerScheduler({
    intervalMs: 100,
    runTick: async () => {
      await new Promise<void>((resolve) => {
        resolveTick = resolve;
      });
    },
    setTimer: (callback) => {
      scheduled.push(callback);
      return callback;
    },
    clearTimer: () => {
      clearCalls += 1;
    },
  });

  const startPromise = scheduler.start();
  await Promise.resolve();
  await Promise.resolve();

  const stopPromise = scheduler.stop();
  assert.equal(scheduler.isStopped(), true);
  resolveTick?.();
  await Promise.all([startPromise, stopPromise]);

  assert.equal(clearCalls, 0);
  assert.equal(scheduler.isRunning(), false);
});
