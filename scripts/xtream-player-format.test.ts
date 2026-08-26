import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStreamExtension } from "../src/lib/stream-format.ts";

test("preserves a catalog-declared TS extension for live playback", () => {
  assert.equal(normalizeStreamExtension("live", "ts"), "ts");
});

test("preserves HLS for live playback when the catalog declares m3u8", () => {
  assert.equal(normalizeStreamExtension("live", "m3u8"), "m3u8");
});

test("uses a conservative extension for unknown or unsafe values", () => {
  assert.equal(normalizeStreamExtension("live", "php?x=1"), "m3u8");
  assert.equal(normalizeStreamExtension("movie", "ts"), "mp4");
  assert.equal(normalizeStreamExtension("movie", ".MKV"), "mkv");
});
