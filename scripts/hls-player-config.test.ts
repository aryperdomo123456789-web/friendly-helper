import assert from "node:assert/strict";
import test from "node:test";
import { createHlsPlayerConfig } from "../src/lib/hls-player-config.ts";

test("uses low latency and bounded live buffer for live HLS", () => {
  const config = createHlsPlayerConfig("live");
  assert.equal(config.lowLatencyMode, true);
  assert.equal(config.maxBufferLength, 20);
  assert.equal(config.maxMaxBufferLength, 60);
  assert.equal(config.backBufferLength, 30);
  assert.equal(config.fragLoadPolicy?.default.errorRetry?.maxNumRetry, 5);
});

test("uses stability-first VOD buffer and bounded retries", () => {
  const config = createHlsPlayerConfig("movie");
  assert.equal(config.lowLatencyMode, false);
  assert.equal(config.maxBufferLength, 45);
  assert.equal(config.maxMaxBufferLength, 180);
  assert.equal(config.backBufferLength, 90);
  assert.equal(config.playlistLoadPolicy?.default.errorRetry?.maxNumRetry, 3);
});
