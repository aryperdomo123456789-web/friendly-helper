import assert from "node:assert/strict";
import test from "node:test";
import { classifyM3UItem, normalizeM3UCategoryName } from "../src/lib/m3u-classifier.server.ts";
import { parsePlaylistCatalog } from "../src/lib/iptv-playlist.server.ts";

test("classifies provider routes, extensions, taxonomy and episodes", () => {
  assert.equal(classifyM3UItem({ url: "https://provider.test/live/u/p/1.ts", groupTitle: "Esportes" }), "live");
  assert.equal(classifyM3UItem({ url: "https://provider.test/movie/u/p/1.mp4", groupTitle: "Filmes" }), "movie");
  assert.equal(classifyM3UItem({ url: "https://provider.test/catalog/1.mkv", groupTitle: "Lançamentos" }), "movie");
  assert.equal(classifyM3UItem({ url: "https://provider.test/catalog/1.ts", groupTitle: "Novelas" }), "series");
  assert.equal(classifyM3UItem({ url: "https://provider.test/catalog/1.ts", displayName: "Minha Série S02E03" }), "series");
});

test("normalizes noisy provider categories", () => {
  assert.equal(normalizeM3UCategoryName("|BR| ESPORTES FHD"), "Esportes");
  assert.equal(normalizeM3UCategoryName("[BR] 4K FILMES"), "Filmes");
  assert.equal(normalizeM3UCategoryName("CANAL - 📺 NOVELAS"), "Novelas");
  assert.equal(normalizeM3UCategoryName("   "), "Geral");
});

test("never leaks VOD or series entries into live snapshot", () => {
  const catalog = parsePlaylistCatalog(`#EXTM3U
#EXTINF:-1 group-title="Esportes",Canal ao vivo
https://provider.test/live/u/p/1.ts
#EXTINF:-1 group-title="[BR] FILMES FHD",Filme
https://provider.test/catalog/2.mp4
#EXTINF:-1 group-title="Novelas",Minha Novela S01E01
https://provider.test/catalog/3.ts
`);

  assert.equal(catalog.live.streams.length, 1);
  assert.equal(catalog.movie.streams.length, 1);
  assert.equal(catalog.series.streams.length, 1);
  assert.equal(catalog.live.categories[0]?.category_name, "Esportes");
  assert.equal(catalog.movie.categories[0]?.category_name, "Filmes");
  assert.equal(catalog.series.categories[0]?.category_name, "Novelas");
});
