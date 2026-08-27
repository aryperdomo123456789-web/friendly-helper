import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAdminAuditDetails } from "../src/lib/admin-audit.ts";

test("sanitiza detalhes administrativos e remove campos sensíveis", () => {
  const result = sanitizeAdminAuditDetails({
    max_connections: 20,
    is_active: true,
    password_changed: true,
    request_id: "não deveria ser enviado neste helper",
    planId: "00000000-0000-0000-0000-000000000001",
    provider_preference_id: "provider-ref",
    user_ref: "user-ref",
    stream_url: "https://upstream.invalid/playlist.m3u8",
    credentials: "segredo",
    long_note: "x".repeat(300),
  });

  assert.deepEqual(result, {
    max_connections: 20,
    is_active: true,
    password_changed: true,
    long_note: "x".repeat(160),
  });
  assert.equal("stream_url" in result, false);
  assert.equal("credentials" in result, false);
  assert.equal("request_id" in result, false);
  assert.equal("planId" in result, false);
  assert.equal("provider_preference_id" in result, false);
  assert.equal("user_ref" in result, false);
});

test("aceita detalhes vazios sem gerar valor inesperado", () => {
  assert.deepEqual(sanitizeAdminAuditDetails(undefined), {});
  assert.deepEqual(sanitizeAdminAuditDetails(null), {});
});
