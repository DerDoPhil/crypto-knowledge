import { describe, expect, it } from "vitest";
import { getMevAdvice } from "../src/modules/mev/protect.js";
import { scoreSolanaToken } from "../src/modules/security/goplus-solana.js";

describe("getMevAdvice", () => {
  it("recommends Flashbots / MEV Blocker on Ethereum (high risk)", () => {
    const a = getMevAdvice("ethereum");
    expect(a.sandwichRisk).toBe("high");
    expect(a.protectedRpcs.map((r) => r.url)).toContain("https://rpc.flashbots.net");
    expect(a.protectedRpcs.map((r) => r.url)).toContain("https://rpc.mevblocker.io");
  });

  it("marks L2s with a sequencer as low sandwich risk", () => {
    expect(getMevAdvice("base").sandwichRisk).toBe("low");
    expect(getMevAdvice("arbitrum").sandwichRisk).toBe("low");
  });

  it("gives Solana-specific guidance (no private RPC)", () => {
    const a = getMevAdvice("solana");
    expect(a.sandwichRisk).toBe("n/a");
    expect(a.recommendation).toMatch(/Jito|priorityFee/i);
  });
});

describe("scoreSolanaToken", () => {
  it("flags a freezable + mintable token", () => {
    const r = scoreSolanaToken({ mintable: { status: "1" }, freezable: { status: "1" } });
    expect(r.checks.ownership.canMint).toBe(true);
    expect(r.checks.ownership.canBlacklist).toBe(true); // freeze ≈ blacklist
    expect(r.redFlags).toEqual(expect.arrayContaining(["freeze authority active (your tokens can be frozen)"]));
    expect(r.riskScore).toBeGreaterThanOrEqual(20);
  });

  it("treats a renounced (no mint/freeze) token as safe", () => {
    const r = scoreSolanaToken({ mintable: { status: "0" }, freezable: { status: "0" } });
    expect(r.checks.ownership.renounced).toBe(true);
    expect(r.verdict).toBe("safe");
  });

  it("flags a non-transferable token as a honeypot-equivalent", () => {
    const r = scoreSolanaToken({ non_transferable: "1", mintable: { status: "0" }, freezable: { status: "0" } });
    expect(r.checks.honeypot.isHoneypot).toBe(true);
    expect(r.verdict).toBe("high_risk");
  });
});
