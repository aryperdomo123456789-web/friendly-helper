// Encrypted stream proxy helpers.
//
// Two hard requirements:
// 1. The IPTV panels only speak plain HTTP while the app is HTTPS, so the media
//    must flow through our own origin (mixed content is blocked otherwise).
// 2. The panel DNS, username and password must NEVER be observable by the
//    client, by a network capture, by a browser extension or by an "apps net"
//    style sniffer. So the upstream URL is AES-256-GCM *encrypted* (not merely
//    signed/base64) with STREAM_PROXY_SECRET, which lives server-side only.
//
// The resulting URL looks like /api/public/stream?s=<opaque> and carries an
// expiry inside the ciphertext. Tampering fails the GCM auth tag; replay after
// expiry is rejected. Nothing about the upstream is recoverable client-side.

const TEXT = new TextEncoder();

export const DEFAULT_TTL_SECONDS = 6 * 60 * 60; // playlists/segments live at most 6h

type TokenPayload = {
  u: string; // upstream absolute URL
  e: number; // expiry (epoch seconds)
  s?: string; // subject (user id) — audit binding only
};

function b64urlFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

let keyPromise: Promise<CryptoKey> | null = null;

async function aesKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const secret = process.env["STREAM_PROXY_SECRET"];
      if (!secret || secret.length < 16) {
        throw new Error("STREAM_PROXY_SECRET ausente ou fraco no ambiente do servidor");
      }
      const material = await crypto.subtle.digest("SHA-256", TEXT.encode(secret));
      return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
      ]);
    })();
  }
  return keyPromise;
}

export async function signStreamUrl(
  target: string,
  options: { ttlSeconds?: number; subject?: string } = {},
): Promise<string> {
  const payload: TokenPayload = {
    u: target,
    e: Math.floor(Date.now() / 1000) + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS),
    ...(options.subject ? { s: options.subject } : {}),
  };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await aesKey(),
      TEXT.encode(JSON.stringify(payload)),
    ),
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return `/api/public/stream?s=${b64urlFromBytes(packed)}`;
}

export async function readStreamToken(
  token: string | null,
): Promise<{ url: string; expiresAt: number; subject?: string } | null> {
  if (!token || token.length > 4096) return null;
  try {
    const packed = bytesFromB64url(token);
    if (packed.length < 29) return null;
    const iv = packed.slice(0, 12);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      await aesKey(),
      packed.slice(12),
    );
    const payload = JSON.parse(new TextDecoder().decode(plain)) as TokenPayload;
    if (typeof payload.u !== "string" || typeof payload.e !== "number") return null;
    if (payload.e * 1000 < Date.now()) return null;
    const parsed = new URL(payload.u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return {
      url: payload.u,
      expiresAt: payload.e,
      ...(payload.s ? { subject: payload.s } : {}),
    };
  } catch {
    return null;
  }
}

const PLAYLIST_HINTS = ["#EXTM3U", "#EXT-X-"];

export function looksLikePlaylist(contentType: string, body: string): boolean {
  if (/mpegurl/i.test(contentType)) return true;
  return PLAYLIST_HINTS.some((hint) => body.slice(0, 400).includes(hint));
}

// Rewrites every URI inside a playlist so segments/keys keep flowing through the
// proxy with their own encrypted tokens. Absolutely no upstream URL is emitted.
export async function rewritePlaylist(
  body: string,
  baseUrl: string,
  options: { ttlSeconds?: number; subject?: string } = {},
): Promise<string> {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/URI="([^"]+)"/i);
      if (match?.[1]) {
        const absolute = new URL(match[1], baseUrl).toString();
        out.push(trimmed.replace(match[1], await signStreamUrl(absolute, options)));
        continue;
      }
      out.push(line);
      continue;
    }
    const absolute = new URL(trimmed, baseUrl).toString();
    out.push(await signStreamUrl(absolute, options));
  }
  return out.join("\n");
}
