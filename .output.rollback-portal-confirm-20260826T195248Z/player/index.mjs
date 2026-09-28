// src/lib/stream-proxy.server.ts
var TEXT = new TextEncoder;
var DEFAULT_TTL_SECONDS = 6 * 60 * 60;
function b64urlFromBytes(bytes) {
  let binary = "";
  for (const byte of bytes)
    binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytesFromB64url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i += 1)
    out[i] = binary.charCodeAt(i);
  return out;
}
var keyPromise = null;
async function aesKey() {
  if (!keyPromise) {
    keyPromise = (async () => {
      const secret = process.env["STREAM_PROXY_SECRET"];
      if (!secret || secret.length < 16) {
        throw new Error("STREAM_PROXY_SECRET ausente ou fraco no ambiente do servidor.");
      }
      const material = await crypto.subtle.digest("SHA-256", TEXT.encode(secret));
      return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt"
      ]);
    })();
  }
  return keyPromise;
}
async function signStreamUrl(target, options = {}) {
  const payload = {
    u: target,
    e: Math.floor(Date.now() / 1000) + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS),
    ...options.subject ? { s: options.subject } : {}
  };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), TEXT.encode(JSON.stringify(payload))));
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return `/api/public/stream?s=${b64urlFromBytes(packed)}`;
}
async function readStreamToken(token) {
  if (!token || token.length > 4096)
    return null;
  try {
    const packed = bytesFromB64url(token);
    if (packed.length < 29)
      return null;
    const iv = packed.slice(0, 12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await aesKey(), packed.slice(12));
    const payload = JSON.parse(new TextDecoder().decode(plain));
    if (typeof payload.u !== "string" || typeof payload.e !== "number")
      return null;
    if (payload.e * 1000 < Date.now())
      return null;
    const parsed = new URL(payload.u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    return {
      url: payload.u,
      expiresAt: payload.e,
      ...payload.s ? { subject: payload.s } : {}
    };
  } catch {
    return null;
  }
}
var PLAYLIST_HINTS = ["#EXTM3U", "#EXT-X-"];
function looksLikePlaylist(contentType, body) {
  if (/mpegurl/i.test(contentType))
    return true;
  return PLAYLIST_HINTS.some((hint) => body.slice(0, 400).includes(hint));
}
async function rewritePlaylist(body, baseUrl, options = {}) {
  const lines = body.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/URI="([^"]+)"/i);
      if (match?.[1]) {
        const absolute2 = new URL(match[1], baseUrl).toString();
        out.push(trimmed.replace(match[1], await signStreamUrl(absolute2, options)));
        continue;
      }
      out.push(line);
      continue;
    }
    const absolute = new URL(trimmed, baseUrl).toString();
    out.push(await signStreamUrl(absolute, options));
  }
  return out.join(`
`);
}

// src/lib/node-fetch-server.server.ts
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
function isMainModule(importMetaUrl) {
  const entryPath = process.argv[1];
  if (!entryPath)
    return false;
  return fileURLToPath(importMetaUrl) === entryPath;
}
async function startFetchService(handler, options) {
  const host = process.env["HOST"] ?? options.host ?? "127.0.0.1";
  const port = Number(process.env["PORT"] ?? options.port ?? 3000);
  const serviceName = options.serviceName;
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`[${serviceName}] PORT invalido: ${process.env["PORT"] ?? "undefined"}`);
  }
  const server = createServer(async (req, res) => {
    const requestAbort = new AbortController;
    const abortRequest = () => requestAbort.abort();
    req.once("aborted", abortRequest);
    res.once("close", abortRequest);
    try {
      const request = await toFetchRequest(req, requestAbort.signal);
      const response = await handler(request);
      await sendFetchResponse(res, response);
    } catch (error) {
      console.error(`[${serviceName}] request failed`, error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain; charset=utf-8");
      }
      res.end("Internal Server Error");
    } finally {
      req.off("aborted", abortRequest);
      res.off("close", abortRequest);
    }
  });
  server.on("error", (error) => {
    console.error(`[${serviceName}] server error`, error);
    process.exit(1);
  });
  server.listen(port, host, () => {
    console.log(`[${serviceName}] listening on http://${host}:${port}`);
  });
  await once(server, "listening");
}
async function toFetchRequest(req, signal) {
  const hostHeader = req.headers.host ?? "127.0.0.1";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto === "https" ? "https" : "http";
  const url = new URL(req.url ?? "/", `${protocol}://${hostHeader}`);
  const headers = new Headers;
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "undefined")
      continue;
    if (Array.isArray(value)) {
      for (const item of value)
        headers.append(key, item);
      continue;
    }
    headers.set(key, value);
  }
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("connection");
  headers.delete("keep-alive");
  headers.delete("proxy-authenticate");
  headers.delete("proxy-authorization");
  headers.delete("te");
  headers.delete("trailer");
  headers.delete("transfer-encoding");
  headers.delete("upgrade");
  const method = req.method ?? "GET";
  const init = {
    method,
    headers,
    ...signal ? { signal } : {}
  };
  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }
  return new Request(url, init);
}
async function sendFetchResponse(res, response) {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  const readable = Readable.fromWeb(response.body);
  readable.on("error", (error) => {
    console.error("[fetch-service] response stream error", error);
    res.destroy(error);
  });
  readable.pipe(res);
}

// src/server-player.ts
var SECURITY_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate, private",
  pragma: "no-cache",
  expires: "0",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
  "x-served-by": "stream-mago-bot-player"
};
var playerService = {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/healthz") {
      return jsonResponse({ ok: true, service: "player" });
    }
    if (url.pathname !== "/api/public/stream") {
      return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
    }
    try {
      const token = await readStreamToken(url.searchParams.get("s"));
      if (!token)
        return textResponse("Token inválido ou expirado.", 403);
      const target = token.url;
      const range = request.headers.get("range");
      const expectsHls = url.searchParams.get("hls") === "1" || target.includes(".m3u8");
      const requestSignal = request.signal;
      const attemptFetch = async () => {
        const controller = new AbortController;
        const timer = setTimeout(() => controller.abort(), 60000);
        const abortForwarded = () => controller.abort();
        if (requestSignal.aborted) {
          controller.abort();
        } else {
          requestSignal.addEventListener("abort", abortForwarded, { once: true });
        }
        try {
          return await fetch(target, {
            redirect: "follow",
            signal: controller.signal,
            headers: {
              "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
              "Accept-Encoding": "identity",
              "Icy-MetaData": "1",
              Accept: "*/*",
              ...range ? { Range: range } : {}
            }
          });
        } catch {
          return null;
        } finally {
          clearTimeout(timer);
          requestSignal.removeEventListener("abort", abortForwarded);
        }
      };
      let upstream = null;
      for (let attempt = 0;attempt < 4; attempt += 1) {
        if (attempt > 0)
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        upstream = await attemptFetch();
        if (upstream && (upstream.status === 301 || upstream.status === 302)) {
          const location = upstream.headers.get("location");
          if (location) {
            const redirectRes = await fetch(location, {
              signal: requestSignal,
              headers: {
                "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
                Accept: "*/*"
              }
            });
            if (redirectRes.ok || redirectRes.status === 206) {
              upstream = redirectRes;
              break;
            }
          }
        }
        if (upstream && (upstream.ok || upstream.status === 206 || upstream.status === 404))
          break;
        await upstream?.body?.cancel().catch(() => {
          return;
        });
      }
      if (!upstream) {
        return expectsHls ? unavailableHlsResponse() : unavailableMediaResponse();
      }
      const contentType = upstream.headers.get("content-type") ?? "";
      const baseUrl = upstream.url || target;
      if (!upstream.ok && upstream.status !== 206) {
        if (expectsHls) {
          await upstream.body?.cancel().catch(() => {
            return;
          });
          return unavailableHlsResponse();
        }
        await upstream.body?.cancel().catch(() => {
          return;
        });
        return unavailableMediaResponse();
      }
      if (/mpegurl|application\/vnd\.apple|text\/plain|text\/html/i.test(contentType) || target.includes(".m3u8")) {
        const body = await upstream.text();
        if (looksLikePlaylist(contentType, body)) {
          const ttlSeconds = Math.max(60, token.expiresAt - Math.floor(Date.now() / 1000));
          const rewritten = await rewritePlaylist(body, baseUrl, {
            ttlSeconds,
            ...token.subject ? { subject: token.subject } : {}
          });
          const headers2 = new Headers(SECURITY_HEADERS);
          headers2.set("content-type", "application/vnd.apple.mpegurl");
          return new Response(rewritten, { status: 200, headers: headers2 });
        }
        return unavailableHlsResponse();
      }
      const headers = new Headers(SECURITY_HEADERS);
      headers.set("content-type", contentType || "video/mp2t");
      for (const key of ["content-length", "content-range", "accept-ranges"]) {
        const value = upstream.headers.get(key);
        if (value)
          headers.set(key, value);
      }
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
      console.error("Player service failed", error);
      return unavailableMediaResponse();
    }
  }
};
if (isMainModule(import.meta.url)) {
  startFetchService((request) => playerService.fetch(request), { serviceName: "player" });
}
var server_player_default = playerService;
function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
function unavailableHlsResponse() {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("content-type", "application/vnd.apple.mpegurl");
  headers.set("x-stream-status", "unavailable");
  const playlist = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:1",
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXT-X-ENDLIST",
    ""
  ].join(`
`);
  return new Response(playlist, { status: 200, headers });
}
function unavailableMediaResponse() {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("x-stream-status", "unavailable");
  return new Response(null, { status: 204, headers });
}
export {
  server_player_default as default
};
