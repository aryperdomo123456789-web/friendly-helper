import assert from "node:assert/strict";
import test from "node:test";
import { resolveUserStatus } from "../src/lib/user-status.ts";

const now = Date.parse("2026-09-28T21:00:00.000Z");

test("marca como expirado mesmo quando is_active permanece true", () => {
  assert.equal(
    resolveUserStatus({ is_active: true, expires_at: "2026-08-27T23:59:59.000Z" }, now),
    "expired",
  );
});

test("mantém ativo quando está no prazo", () => {
  assert.equal(
    resolveUserStatus({ is_active: true, expires_at: "2026-09-29T00:00:00.000Z" }, now),
    "active",
  );
});

test("mantém bloqueado quando não está ativo e não expirou", () => {
  assert.equal(
    resolveUserStatus({ is_active: false, expires_at: "2026-09-29T00:00:00.000Z" }, now),
    "blocked",
  );
});

test("considera o instante exato do vencimento ainda válido", () => {
  assert.equal(
    resolveUserStatus({ is_active: true, expires_at: "2026-09-28T21:00:00.000Z" }, now),
    "active",
  );
});
