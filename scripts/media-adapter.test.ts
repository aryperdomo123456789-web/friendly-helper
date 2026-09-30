import assert from "node:assert/strict";
import test from "node:test";
import { MediaMTXAdapter } from "../src/lib/media-adapters/mediamtx.server.ts";

test("MediaMTXAdapter creates a hashed path and deletes the session path", async () => {
  const calls: Array<{ url: string; method: string; body?: string }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input, init = {}) => {
    calls.push({
      url: String(input),
      method: init.method ?? "GET",
      ...(typeof init.body === "string" ? { body: init.body } : {}),
    });
    return new Response(null, { status: 200 });
  }) as typeof fetch;

  try {
    const adapter = new MediaMTXAdapter();
    const endpoint = await adapter.start({
      serverId: "7f1cc55f-e847-43a3-88dc-9a466afe5aee",
      streamId: "2965597",
      sessionId: "session-test",
      protocol: "hls",
      sourceUrl: "http://origin.invalid/live/test/2965597.ts",
    });

    assert.equal(endpoint.adapter, "mediamtx");
    assert.match(endpoint.url, /^http:\/\/127\.0\.0\.1:6876\/canary-[^/]+\/index\.m3u8$/);
    assert.equal(calls[0]?.method, "POST");
    assert.match(calls[0]?.url ?? "", /\/v3\/config\/paths\/add\//);
    assert.doesNotMatch(endpoint.url, /origin\.invalid|2965597/);
    assert.match(calls[0]?.body ?? "", /source/);

    await adapter.stop("session-test");
    assert.equal(calls[1]?.method, "DELETE");
    assert.match(calls[1]?.url ?? "", /\/v3\/config\/paths\/delete\//);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
