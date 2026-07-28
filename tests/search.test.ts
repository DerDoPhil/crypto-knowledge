import { describe, expect, it } from "vitest";
import { ask, clampTopK, compactGuides, deepSearchGuides, getGuidesBatch, MAX_BATCH_TOPICS, relatedGuides, resolveTopicMiss, searchReferences } from "../src/modules/knowledge/search.js";
import { getReference } from "../src/modules/knowledge/references.js";

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

  it("keeps rank 1 FULL and compacts lower ranks to previews (token saving)", () => {
    const r = ask("how do I bridge native usdc across chains");
    const top = r.guides[0]! as { steps?: unknown[] };
    expect(Array.isArray(top.steps)).toBe(true); // rank 1 answers in one call
    for (const g of r.guides.slice(1)) {
      const p = g as { preview?: boolean; steps?: unknown[]; summary?: string };
      expect(p.preview).toBe(true);
      expect(p.steps).toBeUndefined();
      expect(p.summary).toBeTruthy();
    }
    if (r.guides.length > 1) expect(r.note).toBeTruthy();
  });

  it("full: true returns every match as a full guide (old behavior)", () => {
    const r = ask("how do I bridge native usdc across chains", { full: true });
    for (const g of r.guides) expect(Array.isArray((g as { steps?: unknown[] }).steps)).toBe(true);
    expect(r.note).toBeUndefined();
  });
});

describe("compactGuides", () => {
  it("keeps the first N full and previews the rest", () => {
    const ranked = deepSearchGuides("solana token", 4);
    const out = compactGuides(ranked, 1);
    expect(out.length).toBe(ranked.length);
    expect(Array.isArray((out[0] as { steps?: unknown[] }).steps)).toBe(true);
    for (const g of out.slice(1)) expect((g as { preview?: boolean }).preview).toBe(true);
  });
});

describe("resolveTopicMiss (get_guide rescue)", () => {
  it("resolves a unique substring near-miss directly to the guide", () => {
    const r = resolveTopicMiss("uniswap_v3");
    expect(r.resolvedTopic).toBe("uniswap_v3_swap_coding");
    expect(r.bestMatch?.topic).toBe("uniswap_v3_swap_coding");
  });

  it("returns suggestions (not a bestMatch) when the miss is ambiguous", () => {
    const r = resolveTopicMiss("solana");
    expect(r.bestMatch).toBeUndefined();
    expect(r.suggestions.length).toBeGreaterThan(1);
    for (const s of r.suggestions) expect(s.preview).toBe(true);
  });

  it("falls back to search-based suggestions for a keyword-ish miss", () => {
    const r = resolveTopicMiss("bridging_usdc");
    expect(r.suggestions.some((s) => s.topic === "cctp_native_usdc" || s.topic === "bridge_funds")).toBe(true);
  });
});

describe("getGuidesBatch (agent-friendly batch get_guide)", () => {
  it("serves multiple full guides in one call", () => {
    const r = getGuidesBatch(["create_wallet", "debug_failed_tx", "cctp_native_usdc"]);
    expect(r.batch).toBe(true);
    expect(r.count).toBe(3);
    expect(r.guides.map((g) => g.topic)).toEqual(["create_wallet", "debug_failed_tx", "cctp_native_usdc"]);
    for (const g of r.guides) expect(g.steps.length).toBeGreaterThan(0);
  });

  it("rescues near-miss ids per topic and reports real misses with suggestions", () => {
    const r = getGuidesBatch(["uniswap_v3", "zzqqxx_nothing"]);
    expect(r.guides.some((g) => g.topic === "uniswap_v3_swap_coding" && g.resolvedFrom === "uniswap_v3")).toBe(true);
    expect(r.notFound?.length).toBe(1);
    expect(r.notFound![0]!.requested).toBe("zzqqxx_nothing");
  });

  it("truncates overlong lists instead of failing (paid call never wasted)", () => {
    const many = ["create_wallet", "debug_failed_tx", "cctp_native_usdc", "eip712_signing", "solana_pay", "ens_resolution", "safe_multisig"];
    const r = getGuidesBatch(many);
    expect(r.count).toBe(MAX_BATCH_TOPICS);
    expect(r.note).toBeTruthy();
  });

  it("dedupes repeated topics", () => {
    const r = getGuidesBatch(["create_wallet", "create_wallet"]);
    expect(r.count).toBe(1);
  });
});

describe("topK (ask/search result count)", () => {
  it("clamps to 1..10 with a fallback", () => {
    expect(clampTopK(undefined, 3)).toBe(3);
    expect(clampTopK(0, 3)).toBe(1);
    expect(clampTopK(99, 3)).toBe(10);
    expect(clampTopK(2.9, 3)).toBe(2);
  });

  it("ask honors topK=1 (single best guide, minimal tokens)", () => {
    const r = ask("how do I bridge native usdc across chains", { topK: 1 });
    expect(r.guides.length).toBe(1);
    expect(r.guides[0]!.topic).toBe("cctp_native_usdc");
    expect(Array.isArray((r.guides[0] as { steps?: unknown[] }).steps)).toBe(true);
  });

  it("ask honors a larger topK", () => {
    const r = ask("solana token", { topK: 5 });
    expect(r.guides.length).toBeGreaterThan(3);
    expect(r.guides.length).toBeLessThanOrEqual(5);
  });
});

describe("getReference filter", () => {
  it("narrows endpoints server-side and reports totalCount", () => {
    const all = getReference("endpoints") as { count: number };
    const filtered = getReference("endpoints", "solana") as { count: number; totalCount: number; entries: unknown[] };
    expect(filtered.totalCount).toBe(all.count);
    expect(filtered.count).toBeGreaterThan(0);
    expect(filtered.count).toBeLessThan(all.count);
    expect(filtered.entries.length).toBe(filtered.count);
  });

  it("hints instead of failing when the filter matches nothing", () => {
    const r = getReference("errors", "zzqqxx_no_such_thing") as { count: number; hint?: string };
    expect(r.count).toBe(0);
    expect(r.hint).toBeTruthy();
  });

  it("without filter returns the plain table shape (unchanged)", () => {
    const r = getReference("abis") as { count: number; entries: unknown[]; totalCount?: number };
    expect(r.count).toBeGreaterThan(0);
    expect(r.totalCount).toBeUndefined();
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
