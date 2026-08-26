import assert from "node:assert/strict";
import test from "node:test";

import {
  getServerSelectionStorageKey,
  isPlayerQuery,
  isServerScopedQuery,
  resolveServerSelection,
} from "../src/lib/player-isolation.ts";

test("escopa a seleção de servidor por usuário", () => {
  const firstUserKey = getServerSelectionStorageKey("user-a");
  const secondUserKey = getServerSelectionStorageKey("user-b");

  assert.equal(firstUserKey, "wp_server_id:user-a");
  assert.equal(secondUserKey, "wp_server_id:user-b");
  assert.notEqual(firstUserKey, secondUserKey);
  assert.equal(getServerSelectionStorageKey("  "), null);
});

test("aceita somente servidor autorizado e usa o primeiro disponível como fallback", () => {
  const servers = [{ id: "server-a" }, { id: "server-b" }];

  assert.equal(resolveServerSelection(servers, "server-b"), "server-b");
  assert.equal(resolveServerSelection(servers, "server-not-authorized"), "server-a");
  assert.equal(resolveServerSelection([], "server-a"), null);
});

test("identifica query keys escopadas sem cruzar servidores", () => {
  assert.equal(isServerScopedQuery(["categories", "live", "server-a"], "server-a"), true);
  assert.equal(isServerScopedQuery(["streams", "movie", "server-a"], "server-a"), true);
  assert.equal(isServerScopedQuery(["series-info", "series-1", "server-a"], "server-a"), true);
  assert.equal(isServerScopedQuery(["playback-url", "stream-1", "server-a"], "server-a"), true);
  assert.equal(isServerScopedQuery(["categories", "live", "server-b"], "server-a"), false);
  assert.equal(isServerScopedQuery(["player-session", "server-a"], "server-a"), false);
  assert.equal(isPlayerQuery(["player-session", "user-a"]), true);
  assert.equal(isPlayerQuery(["categories", "live", "server-a"]), true);
});
