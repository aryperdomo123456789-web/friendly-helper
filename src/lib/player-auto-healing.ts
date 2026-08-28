export type AutoHealingState = "healthy" | "degraded" | "recovering" | "switching" | "failed";

export type AutoHealingAction = "none" | "recover" | "switch_upstream" | "fail";

export type AutoHealingDecision = {
  state: AutoHealingState;
  action: AutoHealingAction;
  failureStreak: number;
  recoveryCount: number;
  reason: string;
};

type FailureInput = {
  reason: string;
  status?: number;
};

export function createAutoHealingController(options: {
  maxRecoveryAttempts: number;
  upstreamCount: number;
  switchAfterFailures?: number;
}) {
  const maxRecoveryAttempts = Math.max(0, Math.floor(options.maxRecoveryAttempts));
  const upstreamCount = Math.max(1, Math.floor(options.upstreamCount));
  const switchAfterFailures = Math.max(2, Math.floor(options.switchAfterFailures ?? 3));
  let state: AutoHealingState = "healthy";
  let failureStreak = 0;
  let recoveryCount = 0;
  let upstreamIndex = 0;

  const decision = (action: AutoHealingAction, reason: string): AutoHealingDecision => ({
    state,
    action,
    failureStreak,
    recoveryCount,
    reason,
  });

  return {
    observeFailure(input: FailureInput): AutoHealingDecision {
      failureStreak += 1;
      state = "degraded";
      const statusReason = input.status ? `:${input.status}` : "";
      if (failureStreak >= switchAfterFailures && upstreamIndex < upstreamCount - 1) {
        state = "switching";
        return decision("switch_upstream", `${input.reason}${statusReason}:repeated`);
      }
      if (recoveryCount < maxRecoveryAttempts) {
        state = "recovering";
        recoveryCount += 1;
        return decision("recover", `${input.reason}${statusReason}`);
      }
      state = "failed";
      return decision("fail", `${input.reason}${statusReason}:recovery_exhausted`);
    },

    observeHealthy(): AutoHealingDecision {
      const recovered = state === "recovering" || state === "degraded" || state === "switching";
      state = "healthy";
      failureStreak = 0;
      recoveryCount = 0;
      return decision("none", recovered ? "healthy_after_recovery" : "healthy");
    },

    markUpstreamSwitch(): AutoHealingDecision {
      upstreamIndex = Math.min(upstreamCount - 1, upstreamIndex + 1);
      state = "recovering";
      failureStreak = 0;
      recoveryCount = 0;
      return decision("none", `upstream_switched:${upstreamIndex}`);
    },

    reset(): void {
      state = "healthy";
      failureStreak = 0;
      recoveryCount = 0;
      upstreamIndex = 0;
    },

    snapshot(): {
      state: AutoHealingState;
      failureStreak: number;
      recoveryCount: number;
      upstreamIndex: number;
    } {
      return { state, failureStreak, recoveryCount, upstreamIndex };
    },
  };
}
