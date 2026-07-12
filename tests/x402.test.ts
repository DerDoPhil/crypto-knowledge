import { describe, expect, it } from "vitest";
import { build402Body, parsePaymentHeader, type X402Config } from "../src/access/x402.js";

const cfg: X402Config = {
  facilitatorUrl: "https://facilitator.example",
  network: "base",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  payTo: "0xTreasury0000000000000000000000000000beef",
  priceAtomic: "100000", // $0.10 in 6-decimal USDC
};

describe("x402", () => {
  it("builds a valid 402 body with one exact-scheme requirement", () => {
    const body = build402Body("/mcp", cfg);
    expect(body.x402Version).toBe(1);
    expect(body.accepts).toHaveLength(1);
    const r = body.accepts[0]!;
    expect(r.scheme).toBe("exact");
    expect(r.network).toBe("base");
    expect(r.maxAmountRequired).toBe("100000");
    expect(r.payTo).toBe(cfg.payTo);
    expect(r.asset).toBe(cfg.asset);
  });

  it("includes the asset's EIP-712 domain in `extra` (facilitator needs it to verify)", () => {
    // Without extra.name/version the xpay facilitator rejects with "missing_eip712_domain".
    const r = build402Body("/mcp", cfg).accepts[0]!;
    expect(r.extra).toEqual({ name: "USD Coin", version: "2" });
  });

  it("honours a custom asset domain from config", () => {
    const r = build402Body("/mcp", { ...cfg, assetName: "Custom", assetVersion: "1" }).accepts[0]!;
    expect(r.extra).toEqual({ name: "Custom", version: "1" });
  });

  it("decodes a base64 X-PAYMENT header", () => {
    const payload = { signature: "0xabc", amount: "100000" };
    const header = Buffer.from(JSON.stringify(payload)).toString("base64");
    expect(parsePaymentHeader(header)).toEqual(payload);
  });

  it("returns null for a missing or malformed header", () => {
    expect(parsePaymentHeader(undefined)).toBeNull();
    expect(parsePaymentHeader("!!!not-base64-json")).toBeNull();
  });
});
