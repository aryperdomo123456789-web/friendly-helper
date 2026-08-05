// Signed stream proxy helpers. The IPTV servers only speak plain HTTP, while the
// app is served over HTTPS, so the browser blocks the media as mixed content.
// We proxy the playlist/segments through our own origin and sign every URL so the
// endpoint can never be abused as an open proxy.

function b64urlEncode(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
}

function secret(): string {
  return process.env["STREAM_PROXY_SECRET"] ?? "webplayer-dev-stream-secret";
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return b64urlEncode(String.fromCharCode(...new Uint8Array(mac))).slice(0, 43);
}

export async function signStreamUrl(target: string): Promise<string> {
  const payload = b64urlEncode(target);
  const token = await sign(payload);
  return `/api/public/stream?u=${payload}&t=${token}`;
}

export async function readSignedStreamUrl(
  payload: string | null,
  token: string | null,
): Promise<string | null> {
  if (!payload || !token) return null;
  const expected = await sign(payload);
  if (expected !== token) return null;
  try {
    const url = b64urlDecode(payload);
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

const PLAYLIST_HINTS = ["#EXTM3U", "#EXT-X-"];

export function looksLikePlaylist(contentType: string, body: string): boolean {
  if (/mpegurl/i.test(contentType)) return true;
  return PLAYLIST_HINTS.some((hint) => body.slice(0, 400).includes(hint));
}

export async function rewritePlaylist(body: string, baseUrl: string): Promise<string> {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }
    if (trimmed.startsWith("#")) {
      // Rewrite URI="..." attributes (keys, media playlists, i-frames).
      const match = trimmed.match(/URI="([^"]+)"/i);
      if (match?.[1]) {
        const absolute = new URL(match[1], baseUrl).toString();
        out.push(trimmed.replace(match[1], await signStreamUrl(absolute)));
        continue;
      }
      out.push(line);
      continue;
    }
    const absolute = new URL(trimmed, baseUrl).toString();
    out.push(await signStreamUrl(absolute));
  }
  return out.join("\n");
}
