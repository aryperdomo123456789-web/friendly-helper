import assert from "node:assert/strict";
import test from "node:test";
import {
  CircuitBreaker,
  runWithAdapterFallback,
} from "../src/lib/media-adapters/circuit-breaker.ts";

test("opens after the configured failure threshold", () => {
  const breaker = new CircuitBreaker({
    failureThreshold: 2,
    cooldownMs: 60_000,
  });

  breaker.recordFailure();
  assert.equal(breaker.state, "closed");
  breaker.recordFailure();
  assert.equal(breaker.state, "open");
  assert.equal(breaker.canAttempt(), false);
});

test("falls back from gateway to MediaMTX and resets the healthy candidate", async () => {
  const gateway = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1_000 });
  const mediamtx = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1_000 });

  const result = await runWithAdapterFallback([
    {
      name: "gateway",
      breaker: gateway,
      run: async () => {
        throw new Error("gateway unavailable");
      },
    },
    {
      name: "mediamtx",
      breaker: mediamtx,
      run: async () => "lab-ok",
    },
  ]);

  assert.deepEqual(result, { adapter: "mediamtx", value: "lab-ok" });
  assert.equal(mediamtx.state, "closed");
  assert.equal(gateway.failureCount, 1);
});

test("does not call an open candidate", async () => {
  const gateway = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 60_000 });
  gateway.recordFailure();
  let calls = 0;

  const result = await runWithAdapterFallback([
    {
      name: "gateway",
      breaker: gateway,
      run: async () => {
        calls += 1;
        return "must-not-run";
      },
    },
    {
      name: "mediamtx",
      breaker: new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1_000 }),
      run: async () => "fallback-ok",
    },
  ]);

  assert.equal(calls, 0);
  assert.deepEqual(result, { adapter: "mediamtx", value: "fallback-ok" });
});
