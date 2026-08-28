import assert from "node:assert/strict";
import test from "node:test";
import { buildEpgIndex, getVirtualWindow, normalizeEpgPrograms } from "../src/lib/epg-client.ts";

test("indexes a heavy EPG snapshot deterministically", () => {
  const programs = Array.from({ length: 10_000 }, (_, index) => {
    const start = 1_700_000_000 + index * 1_800;
    return {
      title: `Programa ${index}`,
      description: index % 2 === 0 ? "Descrição de teste" : "",
      start: new Date(start * 1000).toISOString(),
      end: new Date((start + 1_800) * 1000).toISOString(),
      start_timestamp: String(start),
      stop_timestamp: String(start + 1_800),
    };
  });

  const startedAt = performance.now();
  const normalized = normalizeEpgPrograms(programs);
  const index = buildEpgIndex(programs, 1_700_000_000 * 1000 + 5 * 1_800 * 1000);
  const elapsedMs = performance.now() - startedAt;

  assert.equal(normalized.length, 10_000);
  assert.equal(index.programs.length, 10_000);
  assert.equal(index.currentIndex, 5);
  assert.ok(elapsedMs < 5_000, `EPG indexing took ${elapsedMs.toFixed(1)}ms`);
});

test("returns only the visible EPG window plus overscan", () => {
  const window = getVirtualWindow(10_000, 7_600, 200, 76, 4);
  assert.deepEqual(window, {
    start: 96,
    end: 107,
    offsetTop: 7_296,
    totalHeight: 760_000,
  });
});
