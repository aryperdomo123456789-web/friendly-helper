import assert from "node:assert/strict";
import test from "node:test";
import {
  hashStreamReference,
  logStreamUpstream,
  sanitizeContentType,
} from "../src/lib/stream-observability.ts";
import { readStreamToken, signStreamUrl } from "../src/lib/stream-proxy.server.ts";

process.env["STREAM_PROXY_SECRET"] = "test-only-stream-proxy-secret";

test("hashes a server reference without exposing the original value", async () => {
  const reference = await hashStreamReference("server-id-for-test");
  assert.match(reference, /^[0-9a-f]{16}$/);
  assert.notEqual(reference, "server-id-for-test");
  assert.equal(reference, await hashStreamReference("server-id-for-test"));
});

test("normalizes content type before structured logging", () => {
  assert.equal(
    sanitizeContentType("Application/VND.APPLE.MPEGURL; charset=utf-8"),
    "application/vnd.apple.mpegurl",
  );
  assert.equal(sanitizeContentType(null), undefined);
});

test("logs only sanitized upstream outcome fields", () => {
  const originalInfo = console.info;
  let line = "";
  console.info = (value?: unknown) => {
    line = String(value);
  };
  try {
    logStreamUpstream({
      service: "player",
      serverRef: "0123456789abcdef",
      outcome: "http_error",
      status: 502,
      contentType: "text/html",
      attempts: 2,
      elapsedMs: 123.4,
      expectsHls: true,
      reason: "upstream_non_success",
    });
  } finally {
    console.info = originalInfo;
  }

  const event = JSON.parse(line) as Record<string, unknown>;
  assert.equal(event.event, "stream_upstream");
  assert.equal(event.server_ref, "0123456789abcdef");
  assert.equal(event.status, 502);
  assert.equal(event.elapsed_ms, 123);
  assert.equal(event.expects_hls, true);
  assert.equal("url" in event, false);
  assert.equal("token" in event, false);
});

test("round-trips the internal server reference inside the encrypted token", async () => {
  const signed = await signStreamUrl("https://example.test/live/stream.m3u8", {
    reference: "server-id-for-test",
    subject: "user-id-for-test",
  });
  const token = new URL(`https://app.test${signed}`).searchParams.get("s");
  const decoded = await readStreamToken(token);
  assert.equal(decoded?.reference, "server-id-for-test");
  assert.equal(decoded?.subject, "user-id-for-test");
});
