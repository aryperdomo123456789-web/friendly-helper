import assert from "node:assert/strict";
import test from "node:test";
import { getPlaybackExtensions, normalizeStreamExtension } from "../src/lib/stream-format.ts";

test("preserves a catalog-declared TS extension for live playback", () => {
  assert.equal(normalizeStreamExtension("live", "ts"), "ts");
  assert.deepEqual(getPlaybackExtensions("live", "ts"), ["ts"]);
});

test("preserves HLS for live playback when the catalog declares m3u8", () => {
  assert.equal(normalizeStreamExtension("live", "m3u8"), "m3u8");
  assert.deepEqual(getPlaybackExtensions("live", "m3u8"), ["m3u8"]);
});

test("tries HLS once and TS once when live has no declared extension", () => {
  assert.deepEqual(getPlaybackExtensions("live"), ["m3u8", "ts"]);
  assert.deepEqual(getPlaybackExtensions("live", null), ["m3u8", "ts"]);
});

test("uses a conservative extension for unknown or unsafe values", () => {
  assert.equal(normalizeStreamExtension("live", "php?x=1"), "m3u8");
  assert.deepEqual(getPlaybackExtensions("live", "php?x=1"), ["m3u8", "ts"]);
  assert.equal(normalizeStreamExtension("movie", "ts"), "mp4");
  assert.equal(normalizeStreamExtension("movie", ".MKV"), "mkv");
  assert.deepEqual(getPlaybackExtensions("movie", "ts"), ["mp4"]);
});
