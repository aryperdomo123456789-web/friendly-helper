import { readStreamToken, looksLikePlaylist, rewritePlaylist } from "@/lib/stream-proxy.server";
import { validateStreamTokenSession } from "@/lib/stream-token-session.server";
import { isMainModule, startFetchService } from "@/lib/node-fetch-server.server";
import { CircuitBreaker } from "@/lib/media-adapters/circuit-breaker";
import { isMediaMTXInternalUrl, MediaMTXAdapter } from "@/lib/media-adapters/mediamtx.server";
import type { PlaybackInput } from "@/lib/media-adapters/types";

type PlayerServiceEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const SECURITY_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate, private",
  pragma: "no-cache",
  expires: "0",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
  "x-served-by": "stream-mago-bot-player",
};

const mediamtxAdapter = new MediaMTXAdapter();
const mediamtxBreaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 30_000 });

function mediamtxCanaryEnabled(serverId: string): boolean {
  if (process.env["MEDIAMTX_CANARY_ENABLED"] !== "true") return false;
  const configured = (process.env["MEDIAMTX_CANARY_SERVER_IDS"] || process.env["MEDIAMTX_CANARY_SERVER_ID"] || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.length > 0 && configured.includes(serverId.toLowerCase());
}

function streamIdFromUrl(target: string): string {
  try {
    const pathname = new URL(target).pathname.replace(/\/$/, "");
    return pathname.split("/").pop() || "stream";
  } catch {
    return "stream";
  }
}

async function probeMediaKind(
  target: string,
  signal: AbortSignal,
): Promise<"hls" | "mpegts" | "unavailable" | "unknown"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(target, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
        Range: "bytes=0-1023",
        Accept: "*/*",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    void response.body?.cancel().catch(() => undefined);
    if (!response.ok && response.status !== 206) return "unavailable";
    if (/video\/mp2t/i.test(contentType)) return "mpegts";
    if (/mpegurl|application\/vnd\.apple/i.test(contentType)) return "hls";
    return "unknown";
  } catch {
    return "unknown";
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

const playerService = {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return jsonResponse({ ok: true, service: "player" });
    }

    if (url.pathname !== "/api/public/stream") {
      return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
    }

    try {
      const token = await readStreamToken(url.searchParams.get("s"));
      if (!token) return textResponse("Token inválido ou expirado.", 403);

      const requestIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        null;
      if (token.clientIp && requestIp && token.clientIp !== requestIp) {
        return textResponse("Token não pertence a este contexto de rede.", 403);
      }
      if (
        !token.sessionKey ||
        !token.subject ||
        !(await validateStreamTokenSession({
          sessionKey: token.sessionKey,
          subject: token.subject,
          serverId: token.serverId,
        }))
      ) {
        return textResponse("Sessão de playback inválida ou expirada.", 403);
      }

      console.info("player_stream_request", {
        server_id: token.serverId,
        subject: token.subject ?? null,
        playlist: url.searchParams.get("hls") === "1" || token.url.includes(".m3u8"),
      });

      let target = token.url;
      let mediaPlane: "gateway" | "mediamtx" = "gateway";
      const requestSignal = request.signal;
      const canaryEnabled = mediamtxCanaryEnabled(token.serverId);
      const mediaKind = !canaryEnabled
        ? (isMediaMTXInternalUrl(token.url) ? "hls" : "unknown")
        : (isMediaMTXInternalUrl(token.url)
          ? "hls"
          : await probeMediaKind(token.url, requestSignal));
      if (canaryEnabled && mediaKind === "mpegts" && mediamtxBreaker.canAttempt()) {
        const input: PlaybackInput = {
          serverId: token.serverId,
          streamId: streamIdFromUrl(token.url),
          sessionId: token.sessionKey,
          protocol: "hls",
          sourceUrl: token.url,
        };
        try {
          const endpoint = await mediamtxAdapter.start(input);
          target = endpoint.url;
          mediaPlane = "mediamtx";
          mediamtxBreaker.recordSuccess();
          console.info("player_media_plane_selected", {
            server_id: token.serverId,
            adapter: mediaPlane,
            detected_format: mediaKind,
          });
          const release = () => void mediamtxAdapter.releaseMediaSession(input.sessionId);
          if (requestSignal.aborted) release();
          else requestSignal.addEventListener("abort", release, { once: true });
        } catch (error) {
          mediamtxBreaker.recordFailure();
          console.warn("player_media_plane_fallback", {
            server_id: token.serverId,
            adapter: "gateway",
            reason: error instanceof Error ? error.message.slice(0, 120) : "adapter_error",
          });
        }
      }
      const range = request.headers.get("range");
      const expectsHls = mediaPlane === "mediamtx" || url.searchParams.get("hls") === "1" || target.includes(".m3u8");

      const attemptFetch = async (): Promise<Response | null> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60_000);
        const abortForwarded = () => controller.abort();
        let headersReceived = false;
        if (requestSignal.aborted) {
          controller.abort();
        } else {
          requestSignal.addEventListener("abort", abortForwarded, { once: true });
        }
          try {
            const response = await fetch(target, {
              redirect: "follow",
              signal: controller.signal,
              headers: {
                "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
                "Accept-Encoding": "identity",
                "Icy-MetaData": "1",
                Accept: "*/*",
                ...(range ? { Range: range } : {}),
              },
            });
            headersReceived = true;
            return response;
        } catch {
          return null;
        } finally {
          clearTimeout(timer);
          // Keep the abort bridge attached until the upstream body ends or the
          // client closes the response. Removing it here leaks live streams.
          if (!headersReceived) {
            requestSignal.removeEventListener("abort", abortForwarded);
          }
        }
      };

      let upstream: Response | null = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        upstream = await attemptFetch();

        if (upstream && (upstream.status === 301 || upstream.status === 302)) {
            const location = upstream.headers.get("location");
            if (location) {
              const redirectRes = await fetch(location, {
                signal: requestSignal,
                headers: {
                  "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
                Accept: "*/*",
              },
            });
            if (redirectRes.ok || redirectRes.status === 206) {
              upstream = redirectRes;
              break;
            }
          }
        }

        if (upstream && (upstream.ok || upstream.status === 206 || upstream.status === 404)) break;
        await upstream?.body?.cancel().catch(() => undefined);
      }

      if (!upstream) {
        return expectsHls ? unavailableHlsResponse() : unavailableMediaResponse();
      }

      const contentType = upstream.headers.get("content-type") ?? "";
      const baseUrl = upstream.url || target;

      if (!upstream.ok && upstream.status !== 206) {
        if (expectsHls) {
          await upstream.body?.cancel().catch(() => undefined);
          return unavailableStreamResponse(502);
        }
        await upstream.body?.cancel().catch(() => undefined);
        return unavailableStreamResponse(502);
      }

      // The provider may return MPEG-TS after a redirect even when the
      // requested URL ends in .m3u8. The response Content-Type is authoritative.
      const isMpegTs = /video\/mp2t/i.test(contentType);
      const isPlaylist = !isMpegTs && /mpegurl|application\/vnd\.apple/i.test(contentType);
      if (isPlaylist) {
        const body = await upstream.text();
        if (looksLikePlaylist(contentType, body)) {
          const ttlSeconds = Math.max(60, token.expiresAt - Math.floor(Date.now() / 1000));
          const rewritten = await rewritePlaylist(body, baseUrl, {
            serverId: token.serverId,
            ttlSeconds,
            sessionKey: token.sessionKey,
            clientIp: token.clientIp ?? null,
            ...(token.subject ? { subject: token.subject } : {}),
          });
          const headers = new Headers(SECURITY_HEADERS);
          headers.set("content-type", "application/vnd.apple.mpegurl");
          headers.set("x-stream-format", "hls");
          return new Response(rewritten, { status: 200, headers });
        }
        return unavailableStreamResponse(502);
      }

      const headers = new Headers(SECURITY_HEADERS);
      headers.set("content-type", isMpegTs ? "video/mp2t" : contentType || "application/octet-stream");
      if (isMpegTs) {
        headers.set("x-stream-format", "mpegts");
        headers.set("cache-control", "no-cache, no-store, must-revalidate, private");
        headers.set("x-accel-buffering", "no");
        headers.set("connection", "keep-alive");
      }
      for (const key of ["content-length", "content-range", "accept-ranges"]) {
        const value = upstream.headers.get(key);
        if (value) headers.set(key, value);
      }

      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return unavailableStreamResponse(502);
      }
      console.error("Player service failed", error);
      return unavailableStreamResponse(502);
    }
  },
} satisfies PlayerServiceEntry;

if (isMainModule(import.meta.url)) {
  void startFetchService((request) => playerService.fetch(request), { serviceName: "player" });
}

export default playerService;

function textResponse(message: string, status = 200): Response {
  return new Response(message, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function unavailableStreamResponse(status: 502 | 503): Response {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-stream-status", "unavailable");
  return new Response(JSON.stringify({ error: "stream_unavailable" }), {
    status,
    headers,
  });
}
