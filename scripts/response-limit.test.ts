import assert from "node:assert/strict";
import test from "node:test";

import { readResponseTextWithLimit } from "../src/lib/response-limit.server.ts";

test("accepts a response within the byte limit", async () => {
  const response = new Response("catalog", {
    headers: { "content-length": "7" },
  });

  await assert.doesNotReject(() => readResponseTextWithLimit(response, 16, "Teste"));
  assert.equal(await readResponseTextWithLimit(new Response("catalog"), 16, "Teste"), "catalog");
});

test("rejects a response using its declared content length", async () => {
  const response = new Response("catalog", {
    headers: { "content-length": "128" },
  });

  await assert.rejects(
    () => readResponseTextWithLimit(response, 16, "Resposta de teste"),
    /Resposta de teste excede o limite de 0 MiB/,
  );
});

test("rejects and cancels a streamed response after the limit", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("12345678"));
      controller.enqueue(new TextEncoder().encode("90"));
    },
    cancel() {
      cancelled = true;
    },
  });

  await assert.rejects(
    () => readResponseTextWithLimit(new Response(body), 8, "Stream de teste"),
    /Stream de teste excede o limite de 0 MiB/,
  );
  assert.equal(cancelled, true);
});
