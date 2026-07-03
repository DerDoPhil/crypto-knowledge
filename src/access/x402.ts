/**
 * x402 payment building blocks ($0.10 per request for non-holders).
 *
 * Implements the HTTP 402 "Payment Required" handshake used by SwarmSkill's
 * keyless xpay facilitator: the server answers an unpaid request with payment
 * requirements; the client retries with an `X-PAYMENT` header; the server
 * verifies it via the facilitator before serving. This module is the tested,
 * self-contained core — wiring it into the HTTP path is a single integration
 * point (see docs/GO-LIVE.md §5) gated on the operator's treasury + facilitator.
 */
import { fetchJson } from "../core/http.js";

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  /** Atomic units of `asset` (e.g. "100000" = $0.10 in 6-decimals USDC). */
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

export interface X402Config {
  facilitatorUrl: string;
  network: string;
  asset: string;
  payTo: string;
  priceAtomic: string;
}

/** Build the JSON body returned with an HTTP 402 response. */
export function build402Body(resource: string, cfg: X402Config): { x402Version: number; accepts: PaymentRequirements[] } {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: cfg.network,
        maxAmountRequired: cfg.priceAtomic,
        resource,
        description: "Crypto-Knowledge per-request access ($0.10). Hold the gating NFT for free access.",
        mimeType: "application/json",
        payTo: cfg.payTo,
        maxTimeoutSeconds: 120,
        asset: cfg.asset,
      },
    ],
  };
}

/** Decode the base64-encoded X-PAYMENT header into its JSON payload. */
export function parsePaymentHeader(header: string | undefined | null): unknown | null {
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verify a payment payload against the facilitator's /verify endpoint. Returns
 * { valid } so the caller can set `paymentSettled` on the access request.
 */
export async function verifyPayment(
  cfg: X402Config,
  paymentPayload: unknown,
  requirements: PaymentRequirements,
): Promise<VerifyResult> {
  try {
    const res = await fetchJson<{ isValid?: boolean; invalidReason?: string }>(`${cfg.facilitatorUrl}/verify`, {
      method: "POST",
      body: { x402Version: 1, paymentPayload, paymentRequirements: requirements },
      maxAttempts: 2,
    });
    return { valid: Boolean(res.isValid), ...(res.invalidReason ? { reason: res.invalidReason } : {}) };
  } catch (err) {
    return { valid: false, reason: (err as Error).message };
  }
}

export interface SettleResult {
  success: boolean;
  txHash?: string;
  reason?: string;
}

/**
 * Settle a verified payment via the facilitator's /settle endpoint — this is what
 * actually moves the USDC to `payTo`. Verify alone never charges the payer.
 */
export async function settlePayment(
  cfg: X402Config,
  paymentPayload: unknown,
  requirements: PaymentRequirements,
): Promise<SettleResult> {
  try {
    const res = await fetchJson<{ success?: boolean; transaction?: string; txHash?: string; errorReason?: string }>(
      `${cfg.facilitatorUrl}/settle`,
      {
        method: "POST",
        body: { x402Version: 1, paymentPayload, paymentRequirements: requirements },
        maxAttempts: 2,
      },
    );
    const txHash = res.transaction ?? res.txHash;
    return { success: Boolean(res.success), ...(txHash ? { txHash } : {}), ...(res.errorReason ? { reason: res.errorReason } : {}) };
  } catch (err) {
    return { success: false, reason: (err as Error).message };
  }
}
