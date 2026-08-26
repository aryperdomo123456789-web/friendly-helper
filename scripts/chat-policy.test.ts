import assert from "node:assert/strict";
import test from "node:test";
import {
  getStatusAfterOwnerMessage,
  getStatusAfterUserMessage,
  getSupportStatusMeta,
  isAttachmentWithinLimit,
  isValidAttachmentType,
  normalizeSupportMessage,
  SUPPORT_DAILY_MESSAGE_LIMIT,
  SUPPORT_MAX_MESSAGE_LENGTH,
  SUPPORT_MIN_MESSAGE_INTERVAL_MS,
} from "../src/lib/chat-policy.ts";

test("normaliza a mensagem e expõe limites operacionais explícitos", () => {
  assert.equal(normalizeSupportMessage("  problema no player  "), "problema no player");
  assert.equal(SUPPORT_MAX_MESSAGE_LENGTH, 4000);
  assert.equal(SUPPORT_MIN_MESSAGE_INTERVAL_MS, 1500);
  assert.equal(SUPPORT_DAILY_MESSAGE_LIMIT, 100);
});

test("transiciona mensagens para a fila correta", () => {
  assert.equal(getStatusAfterUserMessage("open"), "pending_support");
  assert.equal(getStatusAfterOwnerMessage("pending_support"), "pending_customer");
  assert.throws(() => getStatusAfterUserMessage("closed"), /encerrado/);
  assert.throws(() => getStatusAfterOwnerMessage("closed"), /encerrado/);
});

test("expõe rótulos operacionais honestos para a UI", () => {
  assert.deepEqual(getSupportStatusMeta("pending_support"), {
    label: "Aguardando suporte",
    description: "A equipe precisa responder",
  });
  assert.equal(getSupportStatusMeta("unknown").label, "Aberto");
});

test("valida tipos e tamanho de anexos", () => {
  assert.equal(isValidAttachmentType("image/png"), true);
  assert.equal(isValidAttachmentType("audio/mpeg"), true);
  assert.equal(isValidAttachmentType("application/pdf"), false);
  assert.equal(isAttachmentWithinLimit(10 * 1024 * 1024), true);
  assert.equal(isAttachmentWithinLimit(10 * 1024 * 1024 + 1), false);
});
