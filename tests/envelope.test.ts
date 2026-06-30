import { describe, expect, it } from "vitest";
import { ok, fail, invalidInput } from "../src/core/envelope.js";
import { ErrorCode } from "../src/core/errors.js";

describe("envelope", () => {
  it("ok() wraps data with success shape and meta", () => {
    const env = ok({ x: 1 }, { source: "test", startedAt: performance.now() }, ["heads up"]);
    expect(env.ok).toBe(true);
    expect(env.data).toEqual({ x: 1 });
    expect(env.warnings).toEqual(["heads up"]);
    expect(env.errors).toEqual([]);
    expect(env.meta.source).toBe("test");
    expect(env.meta.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("fail() carries a canonical error and null data", () => {
    const env = fail({ code: ErrorCode.RATE_LIMITED, message: "slow down", retryable: true, retryAfterSec: 5 }, {
      source: "test",
      startedAt: performance.now(),
    });
    expect(env.ok).toBe(false);
    expect(env.data).toBeNull();
    expect(env.errors[0]).toMatchObject({ code: "RATE_LIMITED", retryable: true, retryAfterSec: 5 });
  });

  it("invalidInput() produces an INVALID_INPUT envelope", () => {
    const env = invalidInput("bad", { source: "test", startedAt: performance.now() });
    expect(env.errors[0]!.code).toBe(ErrorCode.INVALID_INPUT);
  });
});
