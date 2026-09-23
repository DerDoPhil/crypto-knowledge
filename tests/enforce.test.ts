import { beforeEach, describe, expect, it, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import type { OperatorConfig } from "../src/config.js";
import { AccessEnforcer, isGatedCall } from "../src/access/enforce.js";
import { holderAccessMessage } from "../src/access/holder.js";

// Facilitator + RPC HTTP is mocked — everything else is real. The holder tier
// (restored 2026-09-24, Auditors instead of the old, removed 2026-07-14 Normies
// gate) is a day-bound wallet signature (real, local EIP-191 recovery — not
// mocked) plus an on-chain balanceOf read (mocked via fetchJson, same as x402).
vi.mock("../src/core/http.js", () => ({ fetchJson: vi.fn() }));
import { fetchJson } from "../src/core/http.js";

const HOLDER_ACCOUNT = privateKeyToAccount("0x53fe3ca9a453ed48b0b5da6d4704eacf4a8de7d172d9cedcc0aa0b6736713f6c");
const NON_HOLDER_ACCOUNT = privateKeyToAccount("0xafbe9a8a525184e8d071c6a907c7cb03eb50405f11a0aaa8b92e2d3e79b58a89");
/** Distinct wallet per call so the 5-min holder cache in holder.ts never bleeds between tests. */
async function proofHeaders(account: typeof HOLDER_ACCOUNT): Promise<Record<string, string>> {
  const signature = await account.signMessage({ message: holderAccessMessage(account.address) });
  return { "x-wallet": account.address, "x-wallet-signature": signature };
}
/** eth_call result for balanceOf(address) — 32-byte big-endian uint256. */
function balanceOfResult(n: number): { result: string } {
  return { result: `0x${n.toString(16).padStart(64, "0")}` };
}

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
const knowledgeCall = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "knowledge", arguments: { action: "ask", query: "x" } } };
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

  it("gates the knowledge tool again (2026-09-24: free only for verified Auditors holders, not for everyone)", () => {
    expect(isGatedCall(knowledgeCall)).toBe(true);
    for (const name of ["knowledge", "portfolio", "security", "route", "abi", "whale_watch", "solana_swap", "pumpfun", "mev_protection", "profitability"]) {
      expect(isGatedCall({ method: "tools/call", params: { name } })).toBe(true);
    }
    // A missing/non-string name must never slip through as "free".
    expect(isGatedCall({ method: "tools/call", params: {} })).toBe(true);
    expect(isGatedCall({ method: "tools/call", params: { name: ["knowledge"] } })).toBe(true);
  });
});

describe("AccessEnforcer", () => {
  it("is a no-op when gating is disabled", async () => {
    const e = new AccessEnforcer(opConfig(false));
    const verdict = await e.enforce({ headers: {}, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(true);
  });

  it("answers 402 with payment requirements AND the free-holder instructions when no payment/wallet is given", async () => {
    const e = new AccessEnforcer(opConfig());
    const verdict = await e.enforce({ headers: {}, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
    const body = verdict.body as { accepts: Array<{ payTo: string; maxAmountRequired: string }>; holderAccess?: { collection: string } };
    expect(body.accepts[0]!.payTo).toBe(TREASURY);
    expect(body.accepts[0]!.maxAmountRequired).toBe("100000");
    expect(body.holderAccess?.collection).toBe("0x9Eb6E2025B64f340691e424b7fe7022fFDE12438");
  });

  it("leaves discovery (tools/list, catalog) open even with gating on", async () => {
    const e = new AccessEnforcer(opConfig());
    expect((await e.enforce({ headers: {}, body: toolsList, resourceUrl: RESOURCE })).allowed).toBe(true);
    expect((await e.enforce({ headers: {}, body: catalogCall, resourceUrl: RESOURCE })).allowed).toBe(true);
  });

  it("gates the knowledge tool like every other tool for a caller with no wallet proof", async () => {
    const e = new AccessEnforcer(opConfig());
    const verdict = await e.enforce({ headers: {}, body: knowledgeCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
  });

  it("serves any gated tool for free when the wallet's signature is valid AND it holds >=1 Auditors NFT", async () => {
    const e = new AccessEnforcer(opConfig());
    vi.mocked(fetchJson).mockResolvedValueOnce(balanceOfResult(1)); // eth_call balanceOf → 1
    const headers = await proofHeaders(HOLDER_ACCOUNT);
    const verdict = await e.enforce({ headers, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(true);
    expect(vi.mocked(fetchJson)).toHaveBeenCalledTimes(1); // one eth_call, no x402 facilitator round-trip
  });

  it("falls back to x402 when the wallet's balanceOf is zero, even with a valid signature", async () => {
    const e = new AccessEnforcer(opConfig());
    vi.mocked(fetchJson).mockResolvedValueOnce(balanceOfResult(0));
    const headers = await proofHeaders(NON_HOLDER_ACCOUNT);
    const verdict = await e.enforce({ headers, body: gatedCall, resourceUrl: RESOURCE });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
  });

  it("rejects a forged wallet header without a matching signature — no on-chain call is even made", async () => {
    const e = new AccessEnforcer(opConfig());
    const verdict = await e.enforce({
      headers: { "x-wallet": HOLDER_ACCOUNT.address, "x-wallet-signature": `0x${"00".repeat(65)}` },
      body: gatedCall,
      resourceUrl: RESOURCE,
    });
    expect(verdict.allowed).toBe(false);
    expect(verdict.status).toBe(402);
    expect(vi.mocked(fetchJson)).not.toHaveBeenCalled(); // signature check is local, fails before any RPC read
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
