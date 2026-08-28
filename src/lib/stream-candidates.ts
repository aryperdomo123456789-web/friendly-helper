import { normalizeStreamExtension, type PlaybackKind } from "./stream-format.ts";

export type StreamCandidateCredentials = {
  dns: string;
  username: string;
  password: string;
  dnsPool?: string[];
};

function normalizeDns(dns: string): string {
  const base = dns.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(base) ? base : `http://${base}`;
}

function buildCandidateUrl(
  creds: StreamCandidateCredentials,
  dns: string,
  kind: PlaybackKind,
  streamId: string | number,
  extension: string,
): string {
  const safeExtension = normalizeStreamExtension(kind, extension);
  return `${normalizeDns(dns)}/${kind}/${encodeURIComponent(creds.username)}/${encodeURIComponent(
    creds.password,
  )}/${streamId}.${safeExtension}`;
}

export function buildStreamUrlCandidates(
  creds: StreamCandidateCredentials,
  kind: PlaybackKind,
  streamId: string | number,
  extensions: string[],
  maxCandidates = 5,
): string[] {
  const dnsCandidates = Array.from(
    new Set([creds.dns, ...(creds.dnsPool ?? [])].filter(Boolean).map(normalizeDns)),
  );
  const safeExtensions = Array.from(new Set(extensions)).slice(0, 3);
  const candidates: string[] = [];
  const primaryExtension = safeExtensions[0] ?? "m3u8";
  const safeMax = Math.max(1, Math.floor(maxCandidates));

  for (const dns of dnsCandidates) {
    if (candidates.length >= safeMax) break;
    candidates.push(buildCandidateUrl(creds, dns, kind, streamId, primaryExtension));
  }
  for (const extension of safeExtensions.slice(1)) {
    if (candidates.length >= safeMax) break;
    candidates.push(buildCandidateUrl(creds, creds.dns, kind, streamId, extension));
  }
  return Array.from(new Set(candidates)).slice(0, safeMax);
}
