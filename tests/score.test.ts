import { describe, expect, it } from "vitest";
import { scoreToken } from "../src/modules/security/score.js";

describe("scoreToken", () => {
  it("flags a honeypot as high risk", () => {
    const r = scoreToken({ is_honeypot: "1", buy_tax: "0.05", sell_tax: "0.99", cannot_sell_all: "1", is_open_source: "1" });
    expect(r.verdict).toBe("high_risk");
    expect(r.riskScore).toBeGreaterThanOrEqual(50);
    expect(r.redFlags).toContain("honeypot detected");
    expect(r.checks.honeypot.isHoneypot).toBe(true);
  });

  it("treats a clean, renounced, locked token as safe", () => {
    const r = scoreToken({
      is_honeypot: "0",
      buy_tax: "0",
      sell_tax: "0",
      is_open_source: "1",
      is_mintable: "0",
      owner_address: "0x0000000000000000000000000000000000000000",
      lp_holders: [{ is_locked: 1, percent: "0.95" }],
    });
    expect(r.verdict).toBe("safe");
    expect(r.checks.ownership.renounced).toBe(true);
    expect(r.checks.liquidity.lockedPct).toBeCloseTo(95, 1);
  });

  it("returns insufficient_data when GoPlus gives nothing", () => {
    const r = scoreToken({});
    expect(r.verdict).toBe("insufficient_data");
  });

  it("accumulates risk for mint + blacklist + unlocked liquidity", () => {
    const r = scoreToken({
      is_honeypot: "0",
      is_open_source: "1",
      is_mintable: "1",
      is_blacklisted: "1",
      lp_holders: [{ is_locked: 0, percent: "1.0" }],
    });
    expect(r.redFlags).toEqual(expect.arrayContaining(["owner can mint", "owner can blacklist"]));
    expect(r.riskScore).toBeGreaterThan(20);
  });
});
