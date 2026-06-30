import { encodeFunctionData, parseAbi } from "viem";
import type { OperatorConfig } from "../config.js";
import { ethCall } from "../core/rpc.js";
import { getChain } from "../registry/chains.js";
import { SlidingWindowLimiter, type RateLimitRule } from "./ratelimit.js";

/**
 * Access tiers (product decision 2026-06-30):
 *   free   → no requirement (20/min · 500/day), open or own_key provider modes
 *   holder → owns the gating NFT (120/min · 20k/day), all provider modes
 *   paid   → $0.10 per request via x402 (pay-per-call + 300/min safety cap)
 */
export type Tier = "free" | "holder" | "paid";

export const TIER_LIMITS: Record<Tier, RateLimitRule> = {
  free: { perMinute: 20, perDay: 500 },
  holder: { perMinute: 120, perDay: 20_000 },
  paid: { perMinute: 300, perDay: 1_000_000 },
};

const ERC721_ABI = parseAbi(["function balanceOf(address owner) view returns (uint256)"]);

/**
 * On-chain ERC-721 ownership check (reused pattern from SwarmSkill's NFT gating).
 * Returns true when `wallet` holds >= 1 of the configured gating collection.
 */
export async function isNftHolder(wallet: string, op: OperatorConfig): Promise<boolean> {
  const contract = op.access.holderNftContract;
  if (!contract) return false;
  const chain = getChain(op.access.holderNftChain);
  if (!chain || chain.kind !== "evm") return false;

  const data = encodeFunctionData({ abi: ERC721_ABI, functionName: "balanceOf", args: [wallet as `0x${string}`] });
  const raw = await ethCall(chain.publicRpc, contract, data);
  return BigInt(raw === "0x" ? "0x0" : raw) > 0n;
}

export interface AccessRequest {
  /** Stable identity for rate-limiting: wallet address, or hashed agent id. */
  identity: string;
  /** Optional wallet to verify NFT-holder status against. */
  wallet?: string;
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

    let tier: Tier = "free";
    if (req.paymentSettled) tier = "paid";
    else if (req.wallet && (await this.isHolderSafe(req.wallet))) tier = "holder";

    const rl = this.limiter.check(req.identity, TIER_LIMITS[tier]);
    if (!rl.allowed) {
      return { allowed: false, tier, reason: "rate limit", retryAfterSec: rl.retryAfterSec };
    }
    return { allowed: true, tier };
  }

  private async isHolderSafe(wallet: string): Promise<boolean> {
    try {
      return await isNftHolder(wallet, this.op);
    } catch {
      return false; // never fail-open on errors, but never crash the request either
    }
  }
}
