/**
 * Pure profitability math — no network, fully deterministic (well covered by tests).
 * All USD inputs are plain numbers; gas/slippage are costs subtracted from gross.
 */
export interface ProfitInput {
  grossRevenueUsd: number;
  inputCostUsd?: number; // cost of the capital deployed (optional)
  gasCostUsd: number;
  slippageCostUsd: number;
}

export interface ProfitResult {
  grossUsd: number;
  totalCostUsd: number;
  netUsd: number;
  profitable: boolean;
  marginPct: number;
  recommendation: "PROCEED" | "PROCEED_THIN_MARGIN" | "REJECT_UNPROFITABLE";
}

export function computeProfit(input: ProfitInput): ProfitResult {
  const inputCost = input.inputCostUsd ?? 0;
  const totalCost = inputCost + input.gasCostUsd + input.slippageCostUsd;
  const netUsd = round(input.grossRevenueUsd - totalCost);
  const profitable = netUsd > 0;
  const denom = input.grossRevenueUsd === 0 ? 1 : input.grossRevenueUsd;
  const marginPct = round((netUsd / denom) * 100);

  let recommendation: ProfitResult["recommendation"];
  if (!profitable) recommendation = "REJECT_UNPROFITABLE";
  else if (marginPct < 1) recommendation = "PROCEED_THIN_MARGIN";
  else recommendation = "PROCEED";

  return {
    grossUsd: round(input.grossRevenueUsd),
    totalCostUsd: round(totalCost),
    netUsd,
    profitable,
    marginPct,
    recommendation,
  };
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
