export type CircuitState = "closed" | "open" | "half_open";

export type CircuitBreakerOptions = {
  failureThreshold: number;
  cooldownMs: number;
};

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private readonly options: CircuitBreakerOptions;

  public constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  public get state(): CircuitState {
    if (this.openedAt === 0) return "closed";
    if (Date.now() - this.openedAt >= this.options.cooldownMs) return "half_open";
    return "open";
  }

  public canAttempt(): boolean {
    return this.state !== "open";
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.openedAt = 0;
  }

  public recordFailure(now = Date.now()): void {
    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.openedAt = now;
    }
  }

  public get failureCount(): number {
    return this.failures;
  }
}

export type AdapterCandidate<T> = {
  name: string;
  breaker: CircuitBreaker;
  run: () => Promise<T>;
};

export async function runWithAdapterFallback<T>(
  candidates: readonly AdapterCandidate<T>[],
): Promise<{ adapter: string; value: T }> {
  let lastError: unknown = new Error("no adapter available");

  for (const candidate of candidates) {
    if (!candidate.breaker.canAttempt()) continue;

    try {
      const value = await candidate.run();
      candidate.breaker.recordSuccess();
      return { adapter: candidate.name, value };
    } catch (error) {
      candidate.breaker.recordFailure();
      lastError = error;
    }
  }

  throw lastError;
}
