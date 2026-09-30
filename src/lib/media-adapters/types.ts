export type MediaProtocol = "hls" | "mpegts" | "webrtc";

export type MediaAdapterKind = "gateway" | "mediamtx";

export type PlaybackInput = {
  serverId: string;
  streamId: string;
  sessionId: string;
  protocol: MediaProtocol;
};

export type ProbeResult = {
  available: boolean;
  protocol: MediaProtocol | null;
  latencyMs: number | null;
  reason?: "ok" | "timeout" | "unavailable" | "invalid_payload";
};

export type PlaybackEndpoint = {
  adapter: MediaAdapterKind;
  protocol: MediaProtocol;
  url: string;
  expiresAt: string;
};

export type HealthResult = {
  available: boolean;
  checkedAt: string;
  latencyMs: number | null;
};

export interface MediaAdapter {
  readonly kind: MediaAdapterKind;
  probe(input: PlaybackInput): Promise<ProbeResult>;
  start(input: PlaybackInput): Promise<PlaybackEndpoint>;
  health(input: PlaybackInput): Promise<HealthResult>;
  stop(sessionId: string): Promise<void>;
}
