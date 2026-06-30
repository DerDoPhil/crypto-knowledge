/**
 * In-memory sliding-window rate limiter. Stateless across processes (good enough
 * for a single-instance MVP; swap for Redis when horizontally scaled). Used to
 * protect the operator's provider quotas and as a DoS safety cap.
 */
export interface RateLimitRule {
  perMinute: number;
  perDay: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingMinute: number;
  remainingDay: number;
  retryAfterSec?: number;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * 60_000;

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  check(identity: string, rule: RateLimitRule): RateLimitResult {
    const t = this.now();
    const arr = (this.hits.get(identity) ?? []).filter((ts) => t - ts < DAY);

    const inMinute = arr.filter((ts) => t - ts < MINUTE).length;
    const inDay = arr.length;

    if (inMinute >= rule.perMinute) {
      const oldestInWindow = arr.filter((ts) => t - ts < MINUTE)[0] ?? t;
      return {
        allowed: false,
        remainingMinute: 0,
        remainingDay: Math.max(0, rule.perDay - inDay),
        retryAfterSec: Math.max(1, Math.ceil((MINUTE - (t - oldestInWindow)) / 1000)),
      };
    }
    if (inDay >= rule.perDay) {
      return { allowed: false, remainingMinute: rule.perMinute - inMinute, remainingDay: 0, retryAfterSec: 3600 };
    }

    arr.push(t);
    this.hits.set(identity, arr);
    return {
      allowed: true,
      remainingMinute: rule.perMinute - inMinute - 1,
      remainingDay: rule.perDay - inDay - 1,
    };
  }
}
