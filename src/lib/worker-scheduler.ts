export type WorkerSchedulerOptions = {
  intervalMs: number;
  runTick: () => Promise<void>;
  setTimer?: (callback: () => void, delayMs: number) => unknown;
  clearTimer?: (handle: unknown) => void;
  onError?: (error: unknown) => void;
};

export function createWorkerScheduler({
  intervalMs,
  runTick,
  setTimer = (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimer = (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  onError = () => {},
}: WorkerSchedulerOptions) {
  let timerHandle: unknown = null;
  let tickInFlight: Promise<void> | null = null;
  let stopped = false;

  const runSingleTick = () => {
    if (tickInFlight) return tickInFlight;

    const currentTick = Promise.resolve().then(runTick);
    tickInFlight = currentTick;

    void currentTick
      .finally(() => {
        if (tickInFlight === currentTick) tickInFlight = null;
      })
      .catch(() => {
        // The caller that started the tick receives the original rejection.
      });

    return currentTick;
  };

  const scheduleNext = () => {
    if (stopped) return;

    timerHandle = setTimer(() => {
      timerHandle = null;
      void runSingleTick()
        .catch((error) => onError(error))
        .finally(scheduleNext);
    }, intervalMs);
  };

  const start = async () => {
    await runSingleTick();
    scheduleNext();
  };

  const stop = async () => {
    if (stopped) return;
    stopped = true;

    if (timerHandle !== null) {
      clearTimer(timerHandle);
      timerHandle = null;
    }

    const activeTick = tickInFlight;
    if (!activeTick) return;

    try {
      await activeTick;
    } catch {
      // Shutdown must still complete when a task has already failed.
    }
  };

  return {
    start,
    tick: runSingleTick,
    stop,
    isRunning: () => tickInFlight !== null,
    isStopped: () => stopped,
  };
}
