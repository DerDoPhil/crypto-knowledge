import type { GoPlusToken } from "./goplus.js";

export type Verdict = "safe" | "caution" | "high_risk" | "insufficient_data";

export interface SecurityReport {
  riskScore: number; // 0 (safe) .. 100 (dangerous)
  verdict: Verdict;
  checks: {
    honeypot: { isHoneypot: boolean | null; buyTaxPct: number | null; sellTaxPct: number | null; canSellAll: boolean | null };
    liquidity: { lockedPct: number | null; lpHolderCount: number };
    ownership: { renounced: boolean | null; canMint: boolean | null; canBlacklist: boolean | null; canPause: boolean | null; hiddenOwner: boolean | null; canTakeBackOwnership: boolean | null };
    holders: { holderCount: number | null; creatorPct: number | null; topHolderPct: number | null };
    contract: { openSource: boolean | null; isProxy: boolean | null };
  };
  redFlags: string[];
}

function b(v: string | undefined): boolean | null {
  if (v === undefined) return null;
  return v === "1";
}
function num(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Deterministic risk scoring from GoPlus fields. Higher = more dangerous. */
export function scoreToken(g: GoPlusToken): SecurityReport {
  const redFlags: string[] = [];
  let score = 0;

  const isHoneypot = b(g.is_honeypot);
  const buyTax = num(g.buy_tax) !== null ? num(g.buy_tax)! * 100 : null;
  const sellTax = num(g.sell_tax) !== null ? num(g.sell_tax)! * 100 : null;
  const canSellAll = g.cannot_sell_all === undefined ? null : g.cannot_sell_all !== "1";

  if (isHoneypot === true) {
    score += 60;
    redFlags.push("honeypot detected");
  }
  if (canSellAll === false) {
    score += 25;
    redFlags.push("cannot sell entire balance");
  }
  if (sellTax !== null && sellTax >= 10) {
    score += 15;
    redFlags.push(`high sell tax ${sellTax.toFixed(1)}%`);
  }
  if (buyTax !== null && buyTax >= 10) {
    score += 8;
    redFlags.push(`high buy tax ${buyTax.toFixed(1)}%`);
  }

  const canMint = b(g.is_mintable);
  const canBlacklist = b(g.is_blacklisted);
  const canPause = b(g.transfer_pausable);
  const hiddenOwner = b(g.hidden_owner);
  const canTakeBack = b(g.can_take_back_ownership);
  const ownerAddr = g.owner_address ?? "";
  const renounced = ownerAddr === "" || /^0x0+$/.test(ownerAddr) ? true : false;

  if (canMint === true) {
    score += 10;
    redFlags.push("owner can mint");
  }
  if (canBlacklist === true) {
    score += 12;
    redFlags.push("owner can blacklist");
  }
  if (canPause === true) {
    score += 8;
    redFlags.push("transfers can be paused");
  }
  if (hiddenOwner === true) {
    score += 15;
    redFlags.push("hidden owner");
  }
  if (canTakeBack === true) {
    score += 12;
    redFlags.push("ownership can be reclaimed after renounce");
  }

  // Liquidity lock %: sum of locked LP holder percentages.
  let lockedPct: number | null = null;
  if (g.lp_holders && g.lp_holders.length > 0) {
    lockedPct = g.lp_holders
      .filter((h) => h.is_locked === 1)
      .reduce((acc, h) => acc + (num(h.percent) ?? 0) * 100, 0);
    if (lockedPct < 50) {
      score += 12;
      redFlags.push(`only ${lockedPct.toFixed(1)}% of liquidity locked`);
    }
  }

  const creatorPct = num(g.creator_percent) !== null ? num(g.creator_percent)! * 100 : null;
  if (creatorPct !== null && creatorPct >= 5) {
    score += 8;
    redFlags.push(`creator holds ${creatorPct.toFixed(1)}%`);
  }
  const topHolderPct =
    g.holders && g.holders[0] && num(g.holders[0].percent) !== null ? num(g.holders[0].percent)! * 100 : null;

  const openSource = b(g.is_open_source);
  if (openSource === false) {
    score += 10;
    redFlags.push("source code not verified");
  }

  score = Math.min(100, score);

  // Verdict — "insufficient_data" when GoPlus returned almost nothing.
  const knownFields = [isHoneypot, openSource, canMint].filter((v) => v !== null).length;
  let verdict: Verdict;
  if (knownFields === 0) verdict = "insufficient_data";
  else if (score >= 50) verdict = "high_risk";
  else if (score >= 20) verdict = "caution";
  else verdict = "safe";

  return {
    riskScore: score,
    verdict,
    checks: {
      honeypot: { isHoneypot, buyTaxPct: buyTax, sellTaxPct: sellTax, canSellAll },
      liquidity: { lockedPct, lpHolderCount: g.lp_holders?.length ?? 0 },
      ownership: { renounced, canMint, canBlacklist, canPause, hiddenOwner, canTakeBackOwnership: canTakeBack },
      holders: { holderCount: num(g.holder_count), creatorPct, topHolderPct },
      contract: { openSource, isProxy: b(g.is_proxy) },
    },
    redFlags,
  };
}
