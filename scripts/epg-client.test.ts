import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEpgGridRows,
  buildEpgIndex,
  filterEpgGridRows,
  getEpgEventPosition,
  getEpgProgramsInTimeline,
  getEpgTimeline,
  getTimelineVirtualWindow,
  getVirtualWindow,
  normalizeEpgPrograms,
} from "../src/lib/epg-client.ts";

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

test("builds and filters a multi-channel EPG matrix", () => {
  const rows = buildEpgGridRows(
    [
      {
        id: "channel-a",
        name: "Canal A",
        programs: [
          {
            title: "Jornal da Noite",
            description: "",
            start: "2026-08-28T00:00:00.000Z",
            end: "2026-08-28T01:00:00.000Z",
            start_timestamp: "1787875200",
            stop_timestamp: "1787878800",
          },
        ],
      },
      { id: "channel-b", name: "Canal B", programs: [] },
    ],
    1_787_875_500_000,
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.index.programs.length, 1);
  assert.equal(filterEpgGridRows(rows, "jornal").length, 1);
  assert.equal(filterEpgGridRows(rows, "canal b").length, 1);
});

test("positions events inside a six-hour horizontal timeline", () => {
  const timeline = getEpgTimeline(1_700_000_000_000, 6 * 60 * 60 * 1000);
  const [program] = normalizeEpgPrograms([
    {
      title: "Programa",
      description: "",
      start: new Date(timeline.startMs + 60 * 60 * 1000).toISOString(),
      end: new Date(timeline.startMs + 90 * 60 * 1000).toISOString(),
      start_timestamp: "",
      stop_timestamp: "",
    },
  ]);
  assert.ok(program);
  const position = getEpgEventPosition(program, timeline);
  assert.ok(position);
  assert.ok(Math.abs(position.leftPct - 100 / 6) < 0.000001);
  assert.ok(Math.abs(position.widthPct - 100 / 12) < 0.000001);
  assert.equal(
    getEpgProgramsInTimeline(
      {
        programs: [program],
        firstStartMs: program.startMs,
        lastEndMs: program.endMs,
        currentIndex: 0,
      },
      timeline,
    ).length,
    1,
  );
});

test("virtualizes both vertical rows and horizontal timeline", () => {
  const timeline = getEpgTimeline(1_700_000_000_000, 6 * 60 * 60 * 1000);
  const window = getTimelineVirtualWindow(timeline, 480, 640, 1_440, 240);
  assert.equal(window.offsetPx, 240);
  assert.equal(window.widthPx, 1_120);
  assert.equal(window.totalWidth, 1_440);
  assert.equal(window.timeline.startMs, timeline.startMs + timeline.durationMs / 6);
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
