import { describe, expect, it } from "vitest";
import { ask, deepSearchGuides, relatedGuides, searchReferences } from "../src/modules/knowledge/search.js";

describe("deepSearchGuides", () => {
  it("finds a guide by BODY content (not just title/summary)", () => {
    // 'healthFactor' only appears in body step text — deep search must find the lending/liquidation guides.
    const hits = deepSearchGuides("healthFactor liquidation");
    expect(hits.length).toBeGreaterThan(0);
    const top3 = hits.slice(0, 3).map((h) => h.topic);
    expect(top3).toEqual(expect.arrayContaining([expect.stringMatching(/defi_lending|liquidation_bots/)]));
  });

  it("finds a guide by a command name buried in steps", () => {
    // 'depositForBurn' is only in cctp_native_usdc's step commands.
    const hits = deepSearchGuides("depositForBurn");
    expect(hits.map((h) => h.topic)).toContain("cctp_native_usdc");
  });

  it("returns FULL guides (steps included), so one call answers", () => {
    const [top] = deepSearchGuides("sign typed data eip712");
    expect(top).toBeDefined();
    expect(Array.isArray(top!.steps)).toBe(true);
    expect(top!.steps.length).toBeGreaterThan(0);
  });

  it("ranks by relevance (score descending) and respects the limit", () => {
    const hits = deepSearchGuides("solana token", 3);
    expect(hits.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < hits.length; i++) expect(hits[i - 1]!.score).toBeGreaterThanOrEqual(hits[i]!.score);
  });

  it("returns nothing for an empty query", () => {
    expect(deepSearchGuides("")).toEqual([]);
    expect(deepSearchGuides("   ")).toEqual([]);
  });
});

describe("searchReferences", () => {
  it("surfaces endpoints for a data question", () => {
    const hits = searchReferences("token price api");
    expect(hits.some((h) => h.kind === "endpoints")).toBe(true);
  });

  it("surfaces the error playbook for an error string", () => {
    const hits = searchReferences("nonce too low");
    expect(hits.some((h) => h.kind === "errors")).toBe(true);
  });
});

describe("ask (one-shot)", () => {
  it("returns guides AND references together", () => {
    const r = ask("how do I bridge native usdc across chains");
    expect(r.guides.length).toBeGreaterThan(0);
    expect(r.guides[0]!.topic).toBe("cctp_native_usdc");
    // reference hits are best-effort; guides are the primary answer
    expect(Array.isArray(r.references)).toBe(true);
  });

  it("gives a helpful hint when nothing matches", () => {
    const r = ask("qqzzxx wwvvkk jjhhgg zzptrq");
    expect(r.guides.length).toBe(0);
    expect(r.hint).toBeTruthy();
  });
});

describe("synonym expansion (ask tuning)", () => {
  it("maps 'fees' to gas guides", () => {
    const hits = deepSearchGuides("how to reduce fees");
    expect(hits.some((h) => h.topic === "gas_optimization" || h.topic === "eth_jsonrpc_cheatsheet")).toBe(true);
  });
  it("maps 'scam token' to rugpull/security guides", () => {
    const hits = deepSearchGuides("check for scam token");
    expect(hits.some((h) => h.topic === "rugpull_forensics" || h.topic === "token_discovery")).toBe(true);
  });
});

describe("relatedGuides", () => {
  it("derives related topics from body cross-references", () => {
    const rel = relatedGuides("liquidation_bots");
    expect(rel.length).toBeGreaterThan(0);
    // liquidation_bots references defi_lending + flash-loan/simulate concepts in its steps
    expect(rel).toContain("defi_lending");
  });
  it("never returns the guide itself and only valid ids", () => {
    const rel = relatedGuides("cctp_native_usdc");
    expect(rel).not.toContain("cctp_native_usdc");
  });
});
