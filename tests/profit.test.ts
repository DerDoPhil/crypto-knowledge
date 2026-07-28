import { describe, expect, it } from "vitest";
import { computeProfit } from "../src/modules/gas/profit.js";

describe("computeProfit", () => {
  it("flags a clearly profitable trade", () => {
    const r = computeProfit({ grossRevenueUsd: 1000, inputCostUsd: 900, gasCostUsd: 5, slippageCostUsd: 2 });
    expect(r.netUsd).toBeCloseTo(93, 5);
    expect(r.profitable).toBe(true);
    expect(r.recommendation).toBe("PROCEED");
  });

  it("rejects a trade where gas + slippage eat the gross", () => {
    const r = computeProfit({ grossRevenueUsd: 10, inputCostUsd: 0, gasCostUsd: 8, slippageCostUsd: 5 });
    expect(r.netUsd).toBeCloseTo(-3, 5);
    expect(r.profitable).toBe(false);
    expect(r.recommendation).toBe("REJECT_UNPROFITABLE");
  });

  it("marks a thin-margin trade", () => {
    const r = computeProfit({ grossRevenueUsd: 1000, inputCostUsd: 990, gasCostUsd: 4, slippageCostUsd: 1 });
    expect(r.profitable).toBe(true);
    expect(r.marginPct).toBeLessThan(1);
    expect(r.recommendation).toBe("PROCEED_THIN_MARGIN");
  });
});
