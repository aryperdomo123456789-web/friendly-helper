export type MediaProtocol = "hls" | "mpegts" | "webrtc";

export type MediaAdapterKind = "gateway" | "mediamtx";

export type PlaybackInput = {
  serverId: string;
  streamId: string;
  sessionId: string;
  protocol: MediaProtocol;
  sourceUrl: string;
};

export type PlaybackEndpoint = {
  adapter: MediaAdapterKind;
  protocol: MediaProtocol;
  url: string;
  expiresAt: string;
};

export type MediaAdapter = {
  readonly kind: MediaAdapterKind;
  start(input: PlaybackInput): Promise<PlaybackEndpoint>;
  stop(sessionId: string): Promise<void>;
};
