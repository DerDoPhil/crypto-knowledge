/**
 * HTTP access enforcement for the hosted MCP endpoint (the GO-LIVE §5 adapter).
 *
 * Product rule (Philipp, 2026-07-14 → reverted 2026-09-24): every `tools/call`
 * requires a settled x402 payment of $0.01 USDC on Base — EXCEPT the tools in
 * FREE_TOOLS, and except a caller who proves Auditors NFT ownership (see
 * holder.ts): a day-bound wallet signature (`X-Wallet` + `X-Wallet-Signature`)
 * plus a positive on-chain Auditors balance grants the same free "holder" tier
 * the old Normies gate used to.
 * Product rule (Philipp, 2026-09-20 → reverted 2026-09-24): the `knowledge` tool
 * was free for everyone for two days; it is gated again like every other tool,
 * free only for verified Auditors holders.
 * Discovery stays open too: initialize, tools/list, ping and the `catalog` tool are
 * never gated, so agents (and registry health probes) can always find out what the
 * tool offers and how to pay for the tools that still cost something.
 *
 * Payment:
 *   X-Payment: base64 x402 payment payload → verified AND settled via the keyless
 *   xpay facilitator before the request is served.
 */
import type { OperatorConfig } from "../config.js";
import { AccessGate } from "./gate.js";
import { checkHolderAccess, holderAccessMessage } from "./holder.js";
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

/** The only tool that never requires payment or a holder proof: discovery. */
const FREE_TOOLS: ReadonlySet<string> = new Set(["catalog"]);

/** True when the JSON-RPC body (single or batch) contains a gated tools/call. */
export function isGatedCall(body: unknown): boolean {
  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const { method, params } = item as { method?: unknown; params?: { name?: unknown } };
    if (method !== "tools/call") continue;
    if (typeof params?.name === "string" && FREE_TOOLS.has(params.name)) continue;
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

    const payment = parsePaymentHeader(header(input.headers, "x-payment"));
    const wallet = header(input.headers, "x-wallet");
    const walletSignature = header(input.headers, "x-wallet-signature");
    const identity = wallet?.toLowerCase() ?? header(input.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";

    // Holder path: a verified Auditors NFT owner skips payment entirely.
    if (wallet && walletSignature) {
      const isHolder = await checkHolderAccess(wallet, walletSignature, this.op);
      if (isHolder) {
        const decision = await this.gate.evaluate({ identity, holderVerified: true });
        return decision.allowed
          ? { allowed: true }
          : { allowed: false, status: 429, body: { error: "rate limit", retryAfterSec: decision.retryAfterSec }, headers: { "retry-after": String(decision.retryAfterSec ?? 60) } };
      }
    }

    // Paid path: verify AND settle the x402 payment, then serve.
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

    // No payment → 402 with payment instructions, plus the free holder path.
    return {
      allowed: false,
      status: 402,
      body: { ...build402Body(input.resourceUrl, this.x402), holderAccess: this.holderAccessInfo() },
    };
  }

  /** Describes the free Auditors-holder path in the 402 body, when a gate contract is configured. */
  private holderAccessInfo(): unknown {
    const contract = this.op.access.holderNftContract;
    if (!contract) return undefined;
    return {
      description: "Free for Auditors NFT holders — sign today's message with your wallet and send it with the request.",
      collection: contract,
      chain: this.op.access.holderNftChain,
      headers: { "X-Wallet": "0x…your wallet", "X-Wallet-Signature": "personal_sign(message)" },
      message: holderAccessMessage("0x…your wallet"),
    };
  }
}
