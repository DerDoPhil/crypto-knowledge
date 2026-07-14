import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperatorConfig } from "../src/config.js";
import { AccessEnforcer, isGatedCall } from "../src/access/enforce.js";

// Facilitator HTTP is mocked — everything else is real. The Normies NFT-holder
// tier was removed (2026-07-14): access is x402 pay-per-call for everyone.
vi.mock("../src/core/http.js", () => ({ fetchJson: vi.fn() }));
import { fetchJson } from "../src/core/http.js";

const TREASURY = "0xbC5CbC5434D3846BC445723e82B51b3932795e6d";

function opConfig(gatingEnabled = true): OperatorConfig {
  return {
    access: {
      gatingEnabled,
      holderNftContract: "0x9Eb6E2025B64f340691e424b7fe7022fFDE12438",
      holderNftChain: "ethereum",
      treasuryAddress: TREASURY,
    },
    x402: {
      facilitatorUrl: "https://facilitator.example",
      network: "base",
      asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      priceAtomic: "100000",
      assetName: "USD Coin",
      assetVersion: "2",
    },
  };
}

const gatedCall = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "security", arguments: {} } };
const catalogCall = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "catalog", arguments: {} } };
const toolsList = { jsonrpc: "2.0", id: 1, method: "tools/list" };
const RESOURCE = "https://crypto-knowledge-eight.vercel.app/mcp";

beforeEach(() => {
  vi.mocked(fetchJson).mockReset();
});

describe("isGatedCall", () => {
  it("gates tools/call but not discovery methods or the catalog tool", () => {
    expect(isGatedCall(gatedCall)).toBe(true);
    expect(isGatedCall(catalogCall)).toBe(false);
    expect(isGatedCall(toolsList)).toBe(false);
    expect(isGatedCall({ method: "initialize" })).toBe(false);
    expect(isGatedCall(undefined)).toBe(false);
    expect(isGatedCall([toolsList, gatedCall])).toBe(true);
  });
});

describe("AccessEnforcer", () => {
  it("is a no-op when gating is disabled", async () => {
    const e = new AccessEnforcer(opConfig(false));
    const verdict = await e.enforce({ headers: {}, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(true);
  });

  it("answers 402 with payment requirements when no payment is given (no NFT-holder path)", async () => {
    const e = new AccessEnforcer(opConfig());
    const verdict = await e.enforce({ headers: {}, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
    const body = verdict.body as { accepts: Array<{ payTo: string; maxAmountRequired: string }>; holderAccess?: unknown };
    expect(body.accepts[0]!.payTo).toBe(TREASURY);
    expect(body.accepts[0]!.maxAmountRequired).toBe("100000");
    // The Normies holder path was removed — no holderAccess block anymore.
    expect(body.holderAccess).toBeUndefined();
  });

  it("leaves discovery (tools/list, catalog) open even with gating on", async () => {
    const e = new AccessEnforcer(opConfig());
    expect((await e.enforce({ headers: {}, body: toolsList, resourceUrl: RESOURCE })).allowed).toBe(true);
    expect((await e.enforce({ headers: {}, body: catalogCall, resourceUrl: RESOURCE })).allowed).toBe(true);
  });

  it("serves the request when an x402 payment verifies AND settles", async () => {
    const e = new AccessEnforcer(opConfig());
    vi.mocked(fetchJson)
      .mockResolvedValueOnce({ isValid: true }) // /verify
      .mockResolvedValueOnce({ success: true, transaction: "0xsettled" }); // /settle
    const payment = Buffer.from(JSON.stringify({ sig: "0xabc" })).toString("base64");
    const verdict = await e.enforce({ headers: { "x-payment": payment }, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(true);
    expect(vi.mocked(fetchJson).mock.calls[0]![0]).toContain("/verify");
    expect(vi.mocked(fetchJson).mock.calls[1]![0]).toContain("/settle");
  });

  it("answers 402 when settlement fails after a valid verify", async () => {
    const e = new AccessEnforcer(opConfig());
    vi.mocked(fetchJson)
      .mockResolvedValueOnce({ isValid: true })
      .mockResolvedValueOnce({ success: false, errorReason: "insufficient funds" });
    const payment = Buffer.from(JSON.stringify({ sig: "0xabc" })).toString("base64");
    const verdict = await e.enforce({ headers: { "x-payment": payment }, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
    expect((verdict.body as { error: string }).error).toContain("settlement failed");
  });

  it("answers 402 when the payment does not verify", async () => {
    const e = new AccessEnforcer(opConfig());
    vi.mocked(fetchJson).mockResolvedValueOnce({ isValid: false, invalidReason: "bad signature" });
    const payment = Buffer.from(JSON.stringify({ sig: "0xabc" })).toString("base64");
    const verdict = await e.enforce({ headers: { "x-payment": payment }, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
    expect(vi.mocked(fetchJson)).toHaveBeenCalledTimes(1);
  });
});
