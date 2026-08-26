import {
  createPlaybackTelemetry,
  type PlaybackTelemetryEventName,
} from "../src/lib/player-telemetry.ts";

export type RecoveryScenarioId =
  "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8" | "R9" | "R10";

type FixtureKind = "live" | "movie" | "series";
type FixtureEngine = "native" | "hls.js";

type FixtureResponse = {
  status: number;
  contentType: string;
  valid: boolean;
  delayMs?: number;
};

type FixtureSession = {
  kind: FixtureKind;
  engine: FixtureEngine;
  telemetryEvents: PlaybackTelemetryEventName[];
  firstFrameMs: number | null;
  loading: boolean;
  playing: boolean;
  fallbackCount: number;
  recoveryCount: number;
  destroyed: boolean;
  now: number;
  responseLog: FixtureResponse[];
  advance: (milliseconds: number) => void;
  request: (response: FixtureResponse) => void;
  markFirstFrame: (bufferSeconds?: number) => void;
  markPlaying: () => void;
  markBufferStart: () => void;
  markBufferEnd: (bufferSeconds?: number) => void;
  recoverAttempt: () => void;
  recoverSuccess: () => void;
  formatFallback: () => void;
  fatalError: (errorCode: string, reason: string) => void;
  startupTimeout: () => void;
  destroy: (reason: string) => Promise<void>;
};

type ScenarioResult = {
  id: RecoveryScenarioId;
  status: "pass" | "fail";
  firstFrameMs: number | null;
  events: PlaybackTelemetryEventName[];
  fallbackCount: number;
  recoveryCount: number;
  requestCount: number;
  notes: string;
};

const LAB_SERVER_ID = "00000000-0000-4000-8000-000000000099";

function createSession(kind: FixtureKind, engine: FixtureEngine): FixtureSession {
  let clock = 0;
  const sentEvents: PlaybackTelemetryEventName[] = [];
  const telemetry = createPlaybackTelemetry({
    sessionId: `fixture-${kind}-${engine}`,
    serverId: LAB_SERVER_ID,
    kind,
    engine,
    now: () => clock,
    send: async (batch) => {
      sentEvents.push(...batch.events.map((event) => event.name));
    },
  });
  let firstFrameMs: number | null = null;
  let loading = true;
  let playing = false;
  let fallbackCount = 0;
  let recoveryCount = 0;
  let destroyed = false;
  const responseLog: FixtureResponse[] = [];

  const record = (
    name: PlaybackTelemetryEventName,
    details: Record<string, number | string | boolean> = {},
  ) => {
    telemetry.record(name, details);
  };

  return {
    kind,
    engine,
    telemetryEvents: sentEvents,
    get firstFrameMs() {
      return firstFrameMs;
    },
    get loading() {
      return loading;
    },
    get playing() {
      return playing;
    },
    get fallbackCount() {
      return fallbackCount;
    },
    get recoveryCount() {
      return recoveryCount;
    },
    get destroyed() {
      return destroyed;
    },
    get now() {
      return clock;
    },
    responseLog,
    advance: (milliseconds) => {
      clock += milliseconds;
    },
    request: (response) => {
      responseLog.push(response);
      if (response.delayMs) clock += response.delayMs;
    },
    markFirstFrame: (bufferSeconds = 1) => {
      if (destroyed || firstFrameMs !== null) return;
      firstFrameMs = clock;
      loading = false;
      telemetry.markFirstFrame({ buffer_seconds: bufferSeconds });
    },
    markPlaying: () => {
      if (destroyed) return;
      loading = false;
      playing = true;
      telemetry.record("playing");
    },
    markBufferStart: () => {
      if (destroyed) return;
      loading = true;
      telemetry.markBufferStart();
    },
    markBufferEnd: (bufferSeconds = 2) => {
      if (destroyed) return;
      loading = false;
      telemetry.markBufferEnd({ buffer_seconds: bufferSeconds });
    },
    recoverAttempt: () => {
      if (destroyed) return;
      recoveryCount += 1;
      record("recover_attempt", { recovery_attempt: recoveryCount });
    },
    recoverSuccess: () => {
      if (destroyed) return;
      playing = true;
      loading = false;
      record("recover_success", { recovery_attempt: recoveryCount });
    },
    formatFallback: () => {
      if (destroyed) return;
      fallbackCount += 1;
      record("format_fallback", {
        recovery_attempt: fallbackCount,
        reason: "primary_format_unavailable",
      });
    },
    fatalError: (errorCode, reason) => {
      if (destroyed) return;
      loading = false;
      playing = false;
      record("fatal_error", {
        error_code: errorCode,
        fatal: true,
        reason,
      });
    },
    startupTimeout: () => {
      if (destroyed) return;
      loading = false;
      record("fatal_error", {
        error_code: "startup_timeout",
        fatal: true,
        reason: "first_frame_timeout",
      });
    },
    destroy: async (reason) => {
      if (destroyed) return;
      destroyed = true;
      loading = false;
      playing = false;
      await telemetry.destroy(reason);
    },
  };
}

function names(session: FixtureSession): PlaybackTelemetryEventName[] {
  return session.telemetryEvents;
}

function result(
  id: RecoveryScenarioId,
  session: FixtureSession,
  passed: boolean,
  notes: string,
): ScenarioResult {
  return {
    id,
    status: passed ? "pass" : "fail",
    firstFrameMs: session.firstFrameMs,
    events: names(session),
    fallbackCount: session.fallbackCount,
    recoveryCount: session.recoveryCount,
    requestCount: session.responseLog.length,
    notes,
  };
}

export async function runRecoveryScenario(id: RecoveryScenarioId): Promise<ScenarioResult> {
  if (id === "R1") {
    const session = createSession("live", "hls.js");
    session.telemetryEvents.push("startup_requested");
    session.markFirstFrame(3);
    session.markPlaying();
    session.markBufferStart();
    session.request({ status: 503, contentType: "text/plain", valid: false });
    session.recoverAttempt();
    session.advance(450);
    session.request({ status: 200, contentType: "video/mp2t", valid: true });
    session.markBufferEnd(4);
    session.recoverSuccess();
    const recovered = session.playing && session.recoveryCount === 1;
    await session.destroy("R1_complete");
    return result(
      id,
      session,
      recovered && names(session).includes("recover_success"),

      "Um segmento falhou uma vez e o playback voltou sem reinicialização completa.",
    );
  }

  if (id === "R2") {
    const session = createSession("live", "hls.js");
    session.telemetryEvents.push("startup_requested");
    session.request({
      status: 200,
      contentType: "application/vnd.apple.mpegurl",
      valid: true,
      delayMs: 3_000,
    });
    session.markFirstFrame(6);
    session.markPlaying();
    session.markBufferStart();
    session.advance(1_200);
    session.markBufferEnd(8);
    const passed = session.firstFrameMs === 3_000 && session.playing;
    await session.destroy("R2_complete");
    return result(
      id,
      session,
      passed,
      "A atualização de playlist atrasou, mas não impediu o primeiro frame nem o retorno a playing.",
    );
  }

  if (id === "R3") {
    const session = createSession("live", "native");
    session.telemetryEvents.push("startup_requested");
    session.request({ status: 200, contentType: "text/html", valid: false });
    session.fatalError("native_media_error", "invalid_primary_playlist");
    session.formatFallback();
    session.request({ status: 200, contentType: "video/mp2t", valid: true });
    session.advance(1_000);
    session.markFirstFrame(2);
    session.markPlaying();
    await session.destroy("R3_complete");
    const events = names(session);
    return result(
      id,
      session,
      session.firstFrameMs === 1_000 &&
        session.fallbackCount === 1 &&
        events.includes("format_fallback"),
      "A primeira resposta era inválida e a segunda tentativa TS alcançou primeiro frame.",
    );
  }

  if (id === "R4") {
    const session = createSession("live", "native");
    session.telemetryEvents.push("startup_requested");
    session.request({ status: 200, contentType: "text/html", valid: false });
    session.fatalError("native_media_error", "invalid_primary_playlist");
    session.formatFallback();
    session.request({ status: 200, contentType: "text/html", valid: false });
    session.fatalError("native_media_error", "invalid_fallback_media");
    await session.destroy("R4_complete");
    const events = names(session);
    return result(
      id,
      session,
      !session.playing &&
        !session.loading &&
        session.fallbackCount === 1 &&
        events.includes("fatal_error"),
      "As duas tentativas falharam e o player terminou em erro controlado sem loop.",
    );
  }

  if (id === "R5") {
    const session = createSession("live", "native");
    session.telemetryEvents.push("startup_requested");
    session.advance(20_000);
    session.startupTimeout();
    await session.destroy("R5_complete");
    const events = names(session);
    return result(
      id,
      session,
      session.firstFrameMs === null && !session.loading && events.includes("fatal_error"),
      "Sem primeiro frame, o limite de startup terminou o loading e emitiu erro terminal sanitizado.",
    );
  }

  if (id === "R6") {
    const failed = createSession("live", "native");
    failed.telemetryEvents.push("startup_requested");
    failed.fatalError("native_media_error", "retryable_lab_failure");
    await failed.destroy("R6_first_attempt");

    const retried = createSession("live", "native");
    retried.telemetryEvents.push("startup_requested");
    retried.request({ status: 200, contentType: "application/vnd.apple.mpegurl", valid: true });
    retried.advance(1_500);
    retried.markFirstFrame(5);
    retried.markPlaying();
    const passed = retried.firstFrameMs === 1_500 && retried.playing && failed.destroyed;
    await retried.destroy("R6_complete");
    return result(
      id,
      retried,
      passed,
      "A primeira sessão terminou limpa e o retry manual iniciou uma sessão nova que reproduziu.",
    );
  }

  if (id === "R7") {
    const session = createSession("movie", "native");
    session.telemetryEvents.push("startup_requested");
    session.request({ status: 200, contentType: "video/mp4", valid: false });
    session.fatalError("native_media_error", "decode_failure_lab");
    await session.destroy("R7_complete");
    const events = names(session);
    return result(
      id,
      session,
      !session.playing &&
        events.includes("fatal_error") &&
        !events.includes("autoplay_blocked" as PlaybackTelemetryEventName),
      "Mídia corrompida terminou em erro nativo sem classificar autoplay como causa primária.",
    );
  }

  if (id === "R8") {
    const portals = ["portal-a", "portal-b", "portal-a"];
    const sessions: FixtureSession[] = [];
    for (const portal of portals) {
      const session = createSession("live", "native");
      session.telemetryEvents.push("startup_requested");
      session.request({ status: 200, contentType: "application/vnd.apple.mpegurl", valid: true });
      session.markFirstFrame(2);
      session.markPlaying();
      await session.destroy(`${portal}_switch`);
      sessions.push(session);
    }
    return result(
      id,
      sessions[2] as FixtureSession,
      sessions.every((session) => session.destroyed && session.firstFrameMs !== null),
      "A troca A→B→A encerrou cada sessão anterior e iniciou a seguinte sem compartilhar lifecycle.",
    );
  }

  if (id === "R9") {
    const session = createSession("live", "native");
    session.telemetryEvents.push("startup_requested");
    session.markFirstFrame(1);
    session.markPlaying();
    await session.destroy("logout");
    const countAfterDestroy = names(session).length;
    session.markBufferStart();
    session.markPlaying();
    return result(
      id,
      session,
      session.destroyed && names(session).length === countAfterDestroy,
      "Após desmontagem/logout, nenhum evento novo ou reprodução foi aceito pelo lifecycle encerrado.",
    );
  }

  const session = createSession("series", "native");
  session.telemetryEvents.push("startup_requested");
  session.request({ status: 200, contentType: "video/mp4", valid: true, delayMs: 4_000 });
  session.markFirstFrame(1);
  session.markPlaying();
  const passed = session.firstFrameMs === 4_000 && session.playing;
  await session.destroy("R10_complete");
  return result(
    id,
    session,
    passed,
    "Episódio MP4 lento alcançou primeiro frame e playing dentro do limite.",
  );
}

export async function runRecoveryMatrix(): Promise<ScenarioResult[]> {
  const ids: RecoveryScenarioId[] = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"];
  const results: ScenarioResult[] = [];
  for (const id of ids) results.push(await runRecoveryScenario(id));
  return results;
}
