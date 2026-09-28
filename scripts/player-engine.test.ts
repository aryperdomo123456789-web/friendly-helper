import assert from "node:assert/strict";
import test from "node:test";
import { selectPlayerEngine } from "../src/lib/player-engine.ts";

test("prioritizes hls.js when MSE is available outside Safari/iOS", () => {
  assert.equal(
    selectPlayerEngine({
      nativeHls: true,
      mediaSourceSupported: true,
      isAppleMobile: false,
      isSafari: false,
    }),
    "hls.js",
  );
});

test("keeps native HLS on Apple mobile", () => {
  assert.equal(
    selectPlayerEngine({
      nativeHls: true,
      mediaSourceSupported: true,
      isAppleMobile: true,
      isSafari: false,
    }),
    "native",
  );
});

test("keeps native HLS on Safari", () => {
  assert.equal(
    selectPlayerEngine({
      nativeHls: true,
      mediaSourceSupported: true,
      isAppleMobile: false,
      isSafari: true,
    }),
    "native",
  );
});

test("uses native fallback when MSE is unavailable", () => {
  assert.equal(
    selectPlayerEngine({
      nativeHls: true,
      mediaSourceSupported: false,
      isAppleMobile: false,
      isSafari: false,
    }),
    "native",
  );
});
