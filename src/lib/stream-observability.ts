const TEXT_ENCODER = new TextEncoder();

export type StreamUpstreamOutcome = {
  service: "main" | "player";
  serverRef?: string | null;
  outcome:
    | "upstream_response"
    | "fetch_exhausted"
    | "http_error"
    | "playlist_rewritten"
    | "playlist_invalid"
    | "media_forwarded"
    | "handler_error";
  status?: number | null;
  contentType?: string | null;
  attempts: number;
  elapsedMs: number;
  expectsHls: boolean;
  reason?: string;
};

export async function hashStreamReference(value?: string | null): Promise<string> {
  if (!value) return "unknown";
  const digest = await crypto.subtle.digest("SHA-256", TEXT_ENCODER.encode(value));
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

export function sanitizeContentType(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.split(";", 1)[0]?.trim().toLowerCase();
  return normalized ? normalized.slice(0, 80) : undefined;
}

export function logStreamUpstream(outcome: StreamUpstreamOutcome): void {
  console.info(
    JSON.stringify({
      event: "stream_upstream",
      service: outcome.service,
      server_ref: outcome.serverRef ?? "unknown",
      outcome: outcome.outcome,
      status: outcome.status ?? null,
      content_type: outcome.contentType ?? null,
      attempts: outcome.attempts,
      elapsed_ms: Math.max(0, Math.min(86_400_000, Math.round(outcome.elapsedMs))),
      expects_hls: outcome.expectsHls,
      ...(outcome.reason ? { reason: outcome.reason.slice(0, 80) } : {}),
      recorded_at: new Date().toISOString(),
    }),
  );
}
