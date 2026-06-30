import { describe, expect, it } from "vitest";
import { CHAINS, getChain, getChainByEvmId, isEvmChain } from "../src/registry/chains.js";

describe("chain registry", () => {
  it("includes Cronos as a first-class EVM entry (chainId 25)", () => {
    const cronos = getChain("cronos");
    expect(cronos).toBeDefined();
    expect(cronos!.chainId).toBe(25);
    expect(cronos!.kind).toBe("evm");
    expect(cronos!.nativeSymbol).toBe("CRO");
    expect(cronos!.etherscanV2ChainId).toBe(25);
  });

  it("resolves chains by EVM id", () => {
    expect(getChainByEvmId(8453)!.key).toBe("base");
    expect(getChainByEvmId(1)!.key).toBe("ethereum");
  });

  it("classifies solana as non-EVM", () => {
    expect(isEvmChain("solana")).toBe(false);
    expect(getChain("solana")!.kind).toBe("solana");
  });

  it("is case-insensitive on keys", () => {
    expect(getChain("ETHEREUM")!.key).toBe("ethereum");
  });

  it("every entry has a public RPC", () => {
    for (const c of Object.values(CHAINS)) {
      expect(c.publicRpc).toMatch(/^https?:\/\//);
    }
  });
});
