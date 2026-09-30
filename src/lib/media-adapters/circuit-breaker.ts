export type CircuitState = "closed" | "open" | "half_open";

type Options = {
  failureThreshold: number;
  cooldownMs: number;
};

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;

  public constructor(private readonly options: Options) {}

  public get state(): CircuitState {
    if (this.openedAt === 0) return "closed";
    return Date.now() - this.openedAt >= this.options.cooldownMs ? "half_open" : "open";
  }

  public canAttempt(): boolean {
    return this.state !== "open";
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.openedAt = 0;
  }

  public recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) this.openedAt = Date.now();
  }
}
