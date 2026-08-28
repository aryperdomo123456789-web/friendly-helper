export type PlaybackTelemetryEventName =
  | "startup_requested"
  | "manifest_loaded"
  | "first_frame"
  | "playing"
  | "buffer_start"
  | "buffer_end"
  | "fatal_error"
  | "recover_attempt"
  | "recover_success"
  | "format_fallback"
  | "quality_sample"
  | "quality_change"
  | "ended"
  | "destroyed"
  | "qoe_summary";

export type PlaybackTelemetryEvent = {
  name: PlaybackTelemetryEventName;
  at_ms: number;
  duration_ms?: number;
  buffer_seconds?: number;
  latency_ms?: number;
  bitrate?: number;
  level?: number;
  dropped_frames?: number;
  decoded_frames?: number;
  fatal?: boolean;
  error_code?: string;
  recovery_attempt?: number;
  rebuffer_count?: number;
  rebuffer_duration_ms?: number;
  playback_duration_ms?: number;
  stall_rate_per_min?: number;
  reason?: string;
};

export type PlaybackTelemetryBatch = {
  session_id: string;
  server_id: string;
  kind: "live" | "movie" | "series";
  engine: "native" | "hls.js";
  events: PlaybackTelemetryEvent[];
};

export type PlaybackTelemetrySummary = {
  first_frame_ms: number | null;
  startup_success: boolean;
  rebuffer_count: number;
  rebuffer_duration_ms: number;
  playback_duration_ms: number;
  stall_rate_per_min: number;
  event_count: number;
};

const MAX_EVENT_BATCH = 20;
const MAX_QUEUE_SIZE = 60;
const MAX_REASON_LENGTH = 80;

export function sanitizePlaybackErrorCode(value: unknown): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/gi, "url")
    .replace(/(token|password|senha|username|usuario)\s*[=:]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return normalized || "unknown";
}

export function sanitizePlaybackReason(value: unknown): string | undefined {
  const normalized = String(value ?? "")
    .trim()
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/(token|password|senha|username|usuario)\s*[=:]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, MAX_REASON_LENGTH);
  return normalized || undefined;
}

function clampNonNegative(value: number | undefined, maximum: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(maximum, Math.max(0, Math.round(value)));
}

export function createPlaybackSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `playback-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createPlaybackTelemetry(options: {
  sessionId: string;
  serverId: string;
  kind: "live" | "movie" | "series";
  engine: "native" | "hls.js";
  send: (batch: PlaybackTelemetryBatch) => Promise<void>;
  now?: () => number;
  flushIntervalMs?: number;
}) {
  const now = options.now ?? (() => Date.now());
  const startedAt = now();
  let queue: PlaybackTelemetryEvent[] = [];
  let firstFrameMs: number | null = null;
  let bufferStartedAt: number | null = null;
  let rebufferCount = 0;
  let rebufferDurationMs = 0;
  let sending = false;
  let destroyed = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const relativeNow = () => Math.max(0, Math.round(now() - startedAt));

  const record = (
    name: PlaybackTelemetryEventName,
    details: Omit<PlaybackTelemetryEvent, "name" | "at_ms"> = {},
  ) => {
    if (destroyed) return;
    const event: PlaybackTelemetryEvent = { name, at_ms: relativeNow() };
    if (details.duration_ms !== undefined) {
      const durationMs = clampNonNegative(details.duration_ms, 86_400_000);
      if (durationMs !== undefined) event.duration_ms = durationMs;
    }
    if (details.buffer_seconds !== undefined) {
      const bufferSeconds = clampNonNegative(details.buffer_seconds * 1000, 86_400_000);
      if (bufferSeconds !== undefined) event.buffer_seconds = bufferSeconds / 1000;
    }
    if (details.latency_ms !== undefined) {
      const latencyMs = clampNonNegative(details.latency_ms, 86_400_000);
      if (latencyMs !== undefined) event.latency_ms = latencyMs;
    }
    if (details.bitrate !== undefined) {
      const bitrate = clampNonNegative(details.bitrate, 1_000_000_000);
      if (bitrate !== undefined) event.bitrate = bitrate;
    }
    if (details.level !== undefined) {
      const level = clampNonNegative(details.level, 10_000);
      if (level !== undefined) event.level = level;
    }
    if (details.dropped_frames !== undefined) {
      const droppedFrames = clampNonNegative(details.dropped_frames, 1_000_000_000);
      if (droppedFrames !== undefined) event.dropped_frames = droppedFrames;
    }
    if (details.decoded_frames !== undefined) {
      const decodedFrames = clampNonNegative(details.decoded_frames, 1_000_000_000);
      if (decodedFrames !== undefined) event.decoded_frames = decodedFrames;
    }
    if (details.fatal !== undefined) event.fatal = details.fatal;
    if (details.recovery_attempt !== undefined) event.recovery_attempt = details.recovery_attempt;
    if (details.rebuffer_count !== undefined) {
      const rebufferCount = clampNonNegative(details.rebuffer_count, 1_000_000);
      if (rebufferCount !== undefined) event.rebuffer_count = rebufferCount;
    }
    if (details.rebuffer_duration_ms !== undefined) {
      const rebufferDurationMs = clampNonNegative(details.rebuffer_duration_ms, 86_400_000);
      if (rebufferDurationMs !== undefined) event.rebuffer_duration_ms = rebufferDurationMs;
    }
    if (details.playback_duration_ms !== undefined) {
      const playbackDurationMs = clampNonNegative(details.playback_duration_ms, 86_400_000);
      if (playbackDurationMs !== undefined) event.playback_duration_ms = playbackDurationMs;
    }
    if (details.stall_rate_per_min !== undefined && Number.isFinite(details.stall_rate_per_min)) {
      event.stall_rate_per_min = Math.min(10_000, Math.max(0, details.stall_rate_per_min));
    }
    if (details.error_code !== undefined) {
      event.error_code = sanitizePlaybackErrorCode(details.error_code);
    }
    if (details.reason !== undefined) {
      const reason = sanitizePlaybackReason(details.reason);
      if (reason) event.reason = reason;
    }

    queue.push(event);
    if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE);
    if (queue.length >= MAX_EVENT_BATCH) void flush();
  };

  const markFirstFrame = (details: Omit<PlaybackTelemetryEvent, "name" | "at_ms"> = {}) => {
    if (firstFrameMs !== null) return;
    firstFrameMs = relativeNow();
    record("first_frame", { ...details, duration_ms: firstFrameMs });
  };

  const markBufferStart = (details: Omit<PlaybackTelemetryEvent, "name" | "at_ms"> = {}) => {
    if (bufferStartedAt !== null) return;
    bufferStartedAt = now();
    rebufferCount += 1;
    record("buffer_start", details);
  };

  const markBufferEnd = (details: Omit<PlaybackTelemetryEvent, "name" | "at_ms"> = {}) => {
    if (bufferStartedAt === null) return;
    const duration = Math.max(0, Math.round(now() - bufferStartedAt));
    rebufferDurationMs += duration;
    bufferStartedAt = null;
    record("buffer_end", { ...details, duration_ms: duration });
  };

  const flush = async () => {
    if (sending || queue.length === 0 || destroyed) return;
    sending = true;
    const events = queue.splice(0, MAX_EVENT_BATCH);
    try {
      await options.send({
        session_id: options.sessionId,
        server_id: options.serverId,
        kind: options.kind,
        engine: options.engine,
        events,
      });
    } catch {
      queue = [...events, ...queue].slice(-MAX_QUEUE_SIZE);
    } finally {
      sending = false;
    }
  };

  if (typeof window !== "undefined") {
    timer = setInterval(() => void flush(), options.flushIntervalMs ?? 10_000);
  }

  const getSummary = (): PlaybackTelemetrySummary => {
    const playbackDurationMs = relativeNow();
    const minutes = Math.max(1 / 60, playbackDurationMs / 60_000);
    return {
      first_frame_ms: firstFrameMs,
      startup_success: firstFrameMs !== null,
      rebuffer_count: rebufferCount,
      rebuffer_duration_ms: rebufferDurationMs,
      playback_duration_ms: playbackDurationMs,
      stall_rate_per_min: rebufferCount / minutes,
      event_count: queue.length,
    };
  };

  return {
    record,
    markFirstFrame,
    markBufferStart,
    markBufferEnd,
    flush,
    summary: getSummary,
    async destroy(reason?: string) {
      if (destroyed) return;
      const reasonDetails = reason ? { reason } : {};
      if (bufferStartedAt !== null) markBufferEnd(reasonDetails);
      const qoe = {
        ...getSummary(),
        ...reasonDetails,
      };
      record("qoe_summary", qoe);
      record("destroyed", reasonDetails);
      destroyed = true;
      if (timer) clearInterval(timer);
      const events = queue.splice(0, MAX_EVENT_BATCH);
      if (events.length > 0) {
        try {
          await options.send({
            session_id: options.sessionId,
            server_id: options.serverId,
            kind: options.kind,
            engine: options.engine,
            events,
          });
        } catch {
          // Telemetria nunca pode bloquear a troca ou o encerramento do player.
        }
      }
    },
  };
}

export const PLAYER_TELEMETRY_MAX_BATCH = MAX_EVENT_BATCH;
export const PLAYER_TELEMETRY_MAX_QUEUE = MAX_QUEUE_SIZE;
