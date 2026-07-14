/**
 * HTTP access enforcement for the hosted MCP endpoint (the GO-LIVE §5 adapter).
 *
 * Product rule (Philipp, 2026-07-14): every `tools/call` except `catalog` requires
 * a settled x402 payment of $0.01 USDC on Base. There is NO NFT-holder free tier
 * anymore (the Normies gate was removed) — access is pay-per-call for everyone.
 * Discovery stays open: initialize, tools/list, ping and the `catalog` tool are
 * never gated, so agents (and registry health probes) can always find out what the
 * tool offers and how to pay.
 *
 * Payment:
 *   X-Payment: base64 x402 payment payload → verified AND settled via the keyless
 *   xpay facilitator before the request is served.
 */
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

    const payment = parsePaymentHeader(header(input.headers, "x-payment"));
    const identity = header(input.headers, "x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";

    // Paid path (the only path): verify AND settle the x402 payment, then serve.
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

    // No payment → 402 with payment instructions.
    return {
      allowed: false,
      status: 402,
      body: build402Body(input.resourceUrl, this.x402),
    };
  }
}
