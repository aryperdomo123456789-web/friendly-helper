import assert from "node:assert/strict";
import { access, rm } from "node:fs/promises";
import test from "node:test";
import {
  fetchRemotePlaylistStreaming,
  parsePlaylistCatalog,
  STREAMING_PLAYLIST_DEFAULTS,
} from "../src/lib/iptv-playlist.server.ts";

const playlist = `#EXTM3U
#EXTINF:-1 tvg-name="News" group-title="Live",News
https://example.test/live/user/pass/1.ts
#EXTINF:-1 tvg-name="Film" group-title="Movies",Film
https://example.test/movie/user/pass/2.mp4
#EXTINF:-1 tvg-name="Episode" group-title="Series",Episode
https://example.test/series/user/pass/3.mp4
`;

test("parser mantém o contrato do catálogo sem depender de leitura streaming", () => {
  const catalog = parsePlaylistCatalog(playlist);
  assert.equal(catalog.live.streams.length, 1);
  assert.equal(catalog.movie.streams.length, 1);
  assert.equal(catalog.series.streams.length, 1);
  assert.equal(catalog.live.categories[0]?.category_name, "Live");
});

test("fetchRemotePlaylistStreaming processa chunks, grava spool e não retorna playlist_text", async () => {
  const originalFetch = globalThis.fetch;
  const encoder = new TextEncoder();
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    const chunks = [encoder.encode(playlist.slice(0, 72)), encoder.encode(playlist.slice(72))];
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
    });
    return new Response(body, { status: 200 });
  };

  try {
    const snapshot = await fetchRemotePlaylistStreaming(
      { dns: "https://example.test", username: "user", password: "pass" },
      { timeoutMs: 2_000, maxAttempts: 1 },
    );
    assert.equal(snapshot.item_count, 3);
    assert.equal(snapshot.catalog?.live.streams[0]?.name, "News");
    assert.equal("playlist_text" in snapshot, false);
    assert.ok(snapshot.playlist_file_path);
    await access(snapshot.playlist_file_path);
    await rm(snapshot.playlist_file_path.replace(/\/[^/]+$/, ""), { recursive: true, force: true });
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("defaults do streaming ficam limitados e explícitos", () => {
  assert.equal(STREAMING_PLAYLIST_DEFAULTS.timeoutMs, 60_000);
  assert.equal(STREAMING_PLAYLIST_DEFAULTS.maxAttempts, 3);
  assert.ok(STREAMING_PLAYLIST_DEFAULTS.maxBytes <= 128 * 1024 * 1024);
});
