import type { OperatorConfig } from "../config.js";
import { SlidingWindowLimiter, type RateLimitRule } from "./ratelimit.js";

/**
 * Access tiers (product decision 2026-07-14 — the Normies NFT-holder tier was removed):
 *   free   → discovery only (list_topics / catalog), no payment
 *   paid   → $0.01 per request via x402 (pay-per-call + 300/min safety cap)
 * The `holder` limit is retained only as the open-mode fallback when gating is off
 * (local stdio use), not as a real access tier.
 */
export type Tier = "free" | "holder" | "paid";

export const TIER_LIMITS: Record<Tier, RateLimitRule> = {
  free: { perMinute: 20, perDay: 500 },
  holder: { perMinute: 120, perDay: 20_000 },
  paid: { perMinute: 300, perDay: 1_000_000 },
};

export interface AccessRequest {
  /** Stable identity for rate-limiting: wallet address, or hashed agent id. */
  identity: string;
  /** Proof that an x402 payment settled for this request (paid tier). */
  paymentSettled?: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  tier: Tier;
  reason?: string;
  retryAfterSec?: number;
}

/**
 * Resolves a caller's tier and enforces the rate limit. When gating is disabled
 * (default for local stdio use) every request is allowed under the holder limit.
 */
export class AccessGate {
  private readonly limiter = new SlidingWindowLimiter();

  constructor(private readonly op: OperatorConfig) {}

  async evaluate(req: AccessRequest): Promise<AccessDecision> {
    if (!this.op.access.gatingEnabled) {
      const rl = this.limiter.check(req.identity, TIER_LIMITS.holder);
      return rl.allowed
        ? { allowed: true, tier: "holder" }
        : { allowed: false, tier: "holder", reason: "rate limit", retryAfterSec: rl.retryAfterSec };
    }

    const tier: Tier = req.paymentSettled ? "paid" : "free";

    const rl = this.limiter.check(req.identity, TIER_LIMITS[tier]);
    if (!rl.allowed) {
      return { allowed: false, tier, reason: "rate limit", retryAfterSec: rl.retryAfterSec };
    }
    return { allowed: true, tier };
  }
}
