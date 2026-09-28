import assert from "node:assert/strict";
import test from "node:test";
import { parsePlaylistCatalog } from "../src/lib/iptv-playlist.server.ts";
import { CATALOG_STREAM_LIMITS, normalizeSeriesTitle } from "../src/lib/catalog-limits.ts";

test("expõe tetos comerciais por tipo de catálogo", () => {
  assert.deepEqual(CATALOG_STREAM_LIMITS, {
    live: 10_000,
    movie: 50_000,
    series: 16_000,
  });
});

test("normaliza o título de série removendo o sufixo de episódio", () => {
  assert.equal(normalizeSeriesTitle("Malhação S02E13"), "malhação");
  assert.equal(normalizeSeriesTitle("The Bear - S01E08 - Finale"), "the bear");
});

test("deduplica episódios M3U em uma entrada de série", () => {
  const catalog = parsePlaylistCatalog(`#EXTM3U
#EXTINF:-1 tvg-name="Alpha S01E01" group-title="Series",Alpha S01E01
https://example.test/series/user/pass/1.mp4
#EXTINF:-1 tvg-name="Alpha S01E02" group-title="Series",Alpha S01E02
https://example.test/series/user/pass/2.mp4
#EXTINF:-1 tvg-name="Beta S01E01" group-title="Series",Beta S01E01
https://example.test/series/user/pass/3.mp4
`);

  assert.equal(catalog.series.streams.length, 2);
  assert.equal(catalog.series.streams[0]?.name, "Alpha S01E01");
  assert.match(catalog.series.streams[0]?.id ?? "", /^m3u-series-/);
});
