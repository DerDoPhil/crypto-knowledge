/**
 * HTTP access enforcement for the hosted MCP endpoint (the GO-LIVE §5 adapter).
 *
 * Product rule (Philipp, 2026-07-02): every `tools/call` except `catalog` requires
 * either proof of holding the gating NFT (free tier) or a settled x402 payment of
 * $0.02 USDC on Base. Discovery stays open: initialize, tools/list, ping and the
 * `catalog` tool are never gated, so agents (and registry health probes) can always
 * find out what the tool offers and how to pay.
 *
 * Holder proof (stateless, no session):
 *   X-Wallet:           0x… (the holder address)
 *   X-Wallet-Signature: personal_sign of "crypto-knowledge-auth <wallet-lowercase> <YYYY-MM-DD>"
 *                       (UTC date; today or yesterday accepted)
 *
 * Payment:
 *   X-Payment: base64 x402 payment payload → verified AND settled via the keyless
 *   xpay facilitator before the request is served.
 */
import { verifyMessage } from "viem";
import type { OperatorConfig } from "../config.js";
import { AccessGate } from "./gate.js";
import { build402Body, parsePaymentHeader, settlePayment, verifyPayment, type PaymentRequirements, type X402Config } from "./x402.js";

export type HeaderMap = Record<string, string | string[] | undefined>;

export interface EnforceResult {
  allowed: boolean;
  /** HTTP status to answer with when not allowed (402 payment / 401 bad proof / 429 rate limit). */
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

function header(headers: HeaderMap, name: string): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

/** UTC dates accepted in the holder-auth message (today + yesterday, keeps proofs replayable for max ~48h). */
function acceptedAuthDates(now = new Date()): string[] {
  const d1 = now.toISOString().slice(0, 10);
  const d0 = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
  return [d1, d0];
}

export function holderAuthMessage(wallet: string, date: string): string {
  return `crypto-knowledge-auth ${wallet.toLowerCase()} ${date}`;
}

async function verifyHolderSignature(wallet: string, signature: string): Promise<boolean> {
  for (const date of acceptedAuthDates()) {
    try {
      const ok = await verifyMessage({
        address: wallet as `0x${string}`,
        message: holderAuthMessage(wallet, date),
        signature: signature as `0x${string}`,
      });
      if (ok) return true;
    } catch {
      // malformed signature/address → fall through to false
    }
  }
  return false;
}

/** True when the JSON-RPC body (single or batch) contains a gated tools/call. */
export function isGatedCall(body: unknown): boolean {
  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const { method, params } = item as { method?: unknown; params?: { name?: unknown } };
    if (method !== "tools/call") continue;
    if (params?.name === "catalog") continue; // discovery stays free
    return true;
  }
  return false;
}

function x402Requirements(resource: string, cfg: X402Config): PaymentRequirements {
  return build402Body(resource, cfg).accepts[0]!;
}

export interface EnforceInput {
  headers: HeaderMap;
  body: unknown;
  /** Absolute resource URL used inside the 402 payment requirements. */
  resourceUrl: string;
}

export class AccessEnforcer {
  private readonly gate: AccessGate;
  private readonly x402: X402Config;

  constructor(private readonly op: OperatorConfig) {
    this.gate = new AccessGate(op);
    this.x402 = {
      facilitatorUrl: op.x402.facilitatorUrl,
      network: op.x402.network,
      asset: op.x402.asset,
      payTo: op.access.treasuryAddress ?? "",
      priceAtomic: op.x402.priceAtomic,
      assetName: op.x402.assetName,
      assetVersion: op.x402.assetVersion,
    };
  }

  async enforce(input: EnforceInput): Promise<EnforceResult> {
    // Gating off (local stdio / no env) or misconfigured without a treasury → open.
    if (!this.op.access.gatingEnabled || !this.x402.payTo) return { allowed: true };
    if (!isGatedCall(input.body)) return { allowed: true };

    const wallet = header(input.headers, "x-wallet");
    const signature = header(input.headers, "x-wallet-signature");
    const payment = parsePaymentHeader(header(input.headers, "x-payment"));
    const identity = wallet?.toLowerCase() ?? header(input.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";

    // 1) Holder path: valid signature + on-chain NFT balance → free.
    if (wallet && signature) {
      if (!(await verifyHolderSignature(wallet, signature))) {
        return {
          allowed: false,
          status: 401,
          body: {
            error: "invalid holder signature",
            expectedMessage: holderAuthMessage(wallet, acceptedAuthDates()[0]!),
            hint: "personal_sign the expected message with the X-Wallet address (UTC date), send as X-Wallet-Signature",
          },
        };
      }
      const decision = await this.gate.evaluate({ identity, wallet });
      if (decision.tier === "holder") {
        return decision.allowed
          ? { allowed: true }
          : { allowed: false, status: 429, body: { error: "rate limit", retryAfterSec: decision.retryAfterSec }, headers: { "retry-after": String(decision.retryAfterSec ?? 60) } };
      }
      // signature fine but no NFT → fall through to payment
    }

    // 2) Paid path: verify AND settle the x402 payment, then serve.
    const requirements = x402Requirements(input.resourceUrl, this.x402);
    if (payment) {
      const verdict = await verifyPayment(this.x402, payment, requirements);
      if (verdict.valid) {
        const settled = await settlePayment(this.x402, payment, requirements);
        if (settled.success) {
          const decision = await this.gate.evaluate({ identity, paymentSettled: true });
          return decision.allowed
            ? { allowed: true }
            : { allowed: false, status: 429, body: { error: "rate limit", retryAfterSec: decision.retryAfterSec }, headers: { "retry-after": String(decision.retryAfterSec ?? 60) } };
        }
        return { allowed: false, status: 402, body: { ...build402Body(input.resourceUrl, this.x402), error: `settlement failed: ${settled.reason ?? "unknown"}` } };
      }
      return { allowed: false, status: 402, body: { ...build402Body(input.resourceUrl, this.x402), error: `payment invalid: ${verdict.reason ?? "unknown"}` } };
    }

    // 3) No proof at all → 402 with instructions for both paths.
    return {
      allowed: false,
      status: 402,
      body: {
        ...build402Body(input.resourceUrl, this.x402),
        holderAccess: {
          description: "Free for Normies NFT holders (Ethereum).",
          headers: { "X-Wallet": "0x<holder address>", "X-Wallet-Signature": "personal_sign of the message below" },
          message: `crypto-knowledge-auth <wallet-lowercase> <YYYY-MM-DD (UTC)>`,
          collection: "https://opensea.io/collection/normies",
        },
      },
    };
  }
}
