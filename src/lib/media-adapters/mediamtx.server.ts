import { createHash } from "node:crypto";
import type { MediaAdapter, PlaybackEndpoint, PlaybackInput } from "./types";

const DEFAULT_API_URL = "http://127.0.0.1:9996";
const DEFAULT_HLS_URL = "http://127.0.0.1:6876";
const DEFAULT_CLOSE_AFTER = "10s";
const DEFAULT_START_TIMEOUT = "10s";
const DEFAULT_MAX_READERS = 1_000;

function safePathName(input: PlaybackInput): string {
  const digest = createHash("sha256")
    .update(`${input.serverId}:${input.streamId}`)
    .digest("hex")
    .slice(0, 24);
  return `canary-${input.serverId.slice(0, 8)}-${digest}`;
}

function apiUrl(): string {
  return (process.env["MEDIAMTX_API_URL"] || DEFAULT_API_URL).replace(/\/$/, "");
}

function hlsUrl(): string {
  return (process.env["MEDIAMTX_HLS_URL"] || DEFAULT_HLS_URL).replace(/\/$/, "");
}

export function isMediaMTXInternalUrl(target: string): boolean {
  try {
    return new URL(target).origin === new URL(hlsUrl()).origin;
  } catch {
    return false;
  }
}

function maxReaders(): number {
  const value = Number(process.env["MEDIAMTX_CANARY_MAX_READERS"] || DEFAULT_MAX_READERS);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_MAX_READERS;
}

export class MediaMTXAdapter implements MediaAdapter {
  public readonly kind = "mediamtx" as const;
  private readonly paths = new Map<string, string>();

  public async start(input: PlaybackInput): Promise<PlaybackEndpoint> {
    if (input.protocol !== "hls") throw new Error("MediaMTX canário exige protocolo HLS.");
    const name = safePathName(input);
    const body = {
      source: input.sourceUrl,
      sourceOnDemand: true,
      sourceOnDemandStartTimeout: process.env["MEDIAMTX_SOURCE_START_TIMEOUT"] || DEFAULT_START_TIMEOUT,
      sourceOnDemandCloseAfter: process.env["MEDIAMTX_SOURCE_CLOSE_AFTER"] || DEFAULT_CLOSE_AFTER,
      maxReaders: maxReaders(),
    };

    const add = await fetch(`${apiUrl()}/v3/config/paths/add/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3_000),
    });

    if (!add.ok && add.status !== 400) {
      throw new Error(`MediaMTX path add falhou (${add.status}).`);
    }

    if (add.status === 400) {
      const patch = await fetch(`${apiUrl()}/v3/config/paths/patch/${encodeURIComponent(name)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3_000),
      });
      if (!patch.ok) throw new Error(`MediaMTX path patch falhou (${patch.status}).`);
    }

    this.paths.set(input.sessionId, name);
    return {
      adapter: "mediamtx",
      protocol: "hls",
      url: `${hlsUrl()}/${encodeURIComponent(name)}/index.m3u8`,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  }

  public async stop(sessionId: string): Promise<void> {
    const name = this.paths.get(sessionId);
    if (!name) return;
    this.paths.delete(sessionId);
    const response = await fetch(`${apiUrl()}/v3/config/paths/delete/${encodeURIComponent(name)}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`MediaMTX path delete falhou (${response.status}).`);
    }
  }
}
