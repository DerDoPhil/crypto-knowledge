import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { buildCallerConfig, providerInputShape, toToolResult, type ToolContext } from "../shared.js";
import { estimateGas } from "./oracle.js";
import { computeProfit } from "./profit.js";

export function registerGasTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "profitability",
    {
      title: "Dynamic Gas & Profitability Calculator",
      description:
        "Estimate EIP-1559 gas for one or more EVM transactions and decide whether an operation is still profitable " +
        "after gas + slippage (arbitrage guard). Action 'estimate'. Provide expectedRevenueUsd for a net-profit verdict.",
      inputSchema: {
        action: z.literal("estimate").default("estimate"),
        chain: z.string().describe("EVM chain key."),
        txs: z
          .array(z.object({ from: z.string().optional(), to: z.string(), data: z.string().optional(), value: z.string().optional() }))
          .describe("Transactions to estimate gas for."),
        speed: z.enum(["slow", "standard", "fast"]).default("standard"),
        expectedRevenueUsd: z.number().optional().describe("Gross USD this operation should return (for profit math)."),
        inputCostUsd: z.number().optional().describe("USD cost of capital deployed (optional)."),
        slippageBps: z.number().optional().describe("Expected slippage in basis points (applied to revenue)."),
        ...providerInputShape,
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "profitability", startedAt, chain: input.chain };
      const chain = getChain(input.chain);
      if (!chain) return toToolResult(invalidInput(`unknown chain '${input.chain}'`, meta));
      if (chain.kind !== "evm") return toToolResult(invalidInput("gas estimation supports EVM chains only", meta));
      if (input.txs.length === 0) return toToolResult(invalidInput("`txs` must contain at least one transaction", meta));

      try {
        const caller = buildCallerConfig(input);
        const gas = await estimateGas(input.chain, input.txs, input.speed, caller, ctx.op);

        let profitability = null;
        const warnings: string[] = [];
        if (input.expectedRevenueUsd !== undefined) {
          if (gas.gasCostUsd === null) {
            warnings.push("No USD price available for gas — profitability skipped. Provide a keyed RPC or retry.");
          } else {
            const slippageCostUsd = input.slippageBps ? (input.expectedRevenueUsd * input.slippageBps) / 10_000 : 0;
            profitability = computeProfit({
              grossRevenueUsd: input.expectedRevenueUsd,
              ...(input.inputCostUsd !== undefined ? { inputCostUsd: input.inputCostUsd } : {}),
              gasCostUsd: gas.gasCostUsd,
              slippageCostUsd,
            });
          }
        }

        return toToolResult(ok({ gas, profitability }, meta, warnings));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
