import { describe, expect, it } from "vitest";
import { SlidingWindowLimiter } from "../src/access/ratelimit.js";

describe("SlidingWindowLimiter", () => {
  it("allows up to the per-minute cap then blocks", () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowLimiter(() => now);
    const rule = { perMinute: 3, perDay: 100 };

    for (let i = 0; i < 3; i++) expect(limiter.check("a", rule).allowed).toBe(true);
    const blocked = limiter.check("a", rule);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("frees capacity once the minute window slides", () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowLimiter(() => now);
    const rule = { perMinute: 2, perDay: 100 };

    expect(limiter.check("b", rule).allowed).toBe(true);
    expect(limiter.check("b", rule).allowed).toBe(true);
    expect(limiter.check("b", rule).allowed).toBe(false);

    now += 61_000; // advance past the minute window
    expect(limiter.check("b", rule).allowed).toBe(true);
  });

  it("tracks identities independently", () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowLimiter(() => now);
    const rule = { perMinute: 1, perDay: 100 };
    expect(limiter.check("x", rule).allowed).toBe(true);
    expect(limiter.check("y", rule).allowed).toBe(true);
    expect(limiter.check("x", rule).allowed).toBe(false);
  });

  it("enforces the daily cap", () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowLimiter(() => now);
    const rule = { perMinute: 1000, perDay: 2 };
    expect(limiter.check("d", rule).allowed).toBe(true);
    now += 1000;
    expect(limiter.check("d", rule).allowed).toBe(true);
    now += 1000;
    expect(limiter.check("d", rule).allowed).toBe(false);
  });
});
