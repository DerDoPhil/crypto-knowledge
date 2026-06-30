import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { fetchJson } from "../../core/http.js";
import type { SecurityReport, Verdict } from "./score.js";

interface AuthorityField {
  status?: string;
  authority?: Array<{ address?: string }>;
}

export interface GoPlusSolanaToken {
  metadata?: { name?: string; symbol?: string };
  mintable?: AuthorityField;
  freezable?: AuthorityField;
  closable?: AuthorityField;
  non_transferable?: string;
  transfer_fee?: Record<string, unknown>;
  transfer_fee_upgradable?: AuthorityField;
  balance_mutable_authority?: AuthorityField;
  holder_count?: string;
  total_supply?: string;
  holders?: Array<{ percent?: string; account?: string }>;
  lp_holders?: Array<{ percent?: string; is_locked?: number }>;
  trusted_token?: number;
}

interface GoPlusSolResponse {
  code: number;
  message: string;
  result?: Record<string, GoPlusSolanaToken>;
}

export async function fetchGoPlusSolana(mint: string): Promise<GoPlusSolanaToken> {
  const url = `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${mint}`;
  const res = await fetchJson<GoPlusSolResponse>(url);
  if (res.code !== 1 || !res.result) {
    throw new CryptoKnowledgeError(ErrorCode.UPSTREAM_ERROR, `GoPlus Solana: ${res.message || "no result"}`);
  }
  // Solana addresses are case-sensitive base58, so match exactly or take the first.
  const token = res.result[mint] ?? Object.values(res.result)[0];
  if (!token) throw new CryptoKnowledgeError(ErrorCode.NOT_FOUND, `GoPlus has no data for ${mint}`);
  return token;
}

function active(field: AuthorityField | undefined): boolean | null {
  if (!field || field.status === undefined) return null;
  return field.status === "1";
}

/** Score a Solana SPL token. Freeze authority and mint authority are the key risks. */
export function scoreSolanaToken(g: GoPlusSolanaToken): SecurityReport {
  const redFlags: string[] = [];
  let score = 0;

  const canMint = active(g.mintable);
  const canFreeze = active(g.freezable);
  const nonTransferable = g.non_transferable === "1";
  const balanceMutable = active(g.balance_mutable_authority);

  if (nonTransferable) {
    score += 60;
    redFlags.push("token is non-transferable (cannot be sold)");
  }
  if (canFreeze === true) {
    score += 25;
    redFlags.push("freeze authority active (your tokens can be frozen)");
  }
  if (canMint === true) {
    score += 15;
    redFlags.push("mint authority active (supply can be inflated)");
  }
  if (balanceMutable === true) {
    score += 15;
    redFlags.push("balance is mutable by authority");
  }
  if (g.transfer_fee && Object.keys(g.transfer_fee).length > 0) {
    score += 8;
    redFlags.push("token has a transfer fee");
  }

  // Liquidity lock %
  let lockedPct: number | null = null;
  if (g.lp_holders && g.lp_holders.length > 0) {
    lockedPct = g.lp_holders.filter((h) => h.is_locked === 1).reduce((a, h) => a + Number(h.percent ?? 0) * 100, 0);
    if (lockedPct < 50) {
      score += 12;
      redFlags.push(`only ${lockedPct.toFixed(1)}% of liquidity locked`);
    }
  }

  const topHolderPct = g.holders?.[0]?.percent ? Number(g.holders[0].percent) * 100 : null;
  if (topHolderPct !== null && topHolderPct >= 30) {
    score += 8;
    redFlags.push(`top holder owns ${topHolderPct.toFixed(1)}%`);
  }

  score = Math.min(100, score);

  const known = [canMint, canFreeze].filter((v) => v !== null).length;
  let verdict: Verdict;
  if (known === 0) verdict = "insufficient_data";
  else if (score >= 50) verdict = "high_risk";
  else if (score >= 20) verdict = "caution";
  else verdict = "safe";

  return {
    riskScore: score,
    verdict,
    checks: {
      honeypot: { isHoneypot: nonTransferable ? true : null, buyTaxPct: null, sellTaxPct: null, canSellAll: nonTransferable ? false : null },
      liquidity: { lockedPct, lpHolderCount: g.lp_holders?.length ?? 0 },
      ownership: {
        renounced: canMint === false && canFreeze === false ? true : false,
        canMint,
        canBlacklist: canFreeze, // freeze ≈ targeted blacklist on Solana
        canPause: null,
        hiddenOwner: null,
        canTakeBackOwnership: null,
      },
      holders: { holderCount: g.holder_count ? Number(g.holder_count) : null, creatorPct: null, topHolderPct },
      contract: { openSource: null, isProxy: null },
    },
    redFlags,
  };
}
