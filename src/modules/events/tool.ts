import { isAddress } from "viem";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { buildCallerConfig, providerInputShape, toToolResult, type ToolContext } from "../shared.js";
import { recentLargeTransfers } from "./transfers.js";

export function registerEventsTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "whale_watch",
    {
      title: "On-Chain Whale & Large-Transfer Watch",
      description:
        "Scan recent ERC-20 Transfer logs for an EVM token and return the largest transfers (whale moves) above a " +
        "threshold, sorted by size. Stateless point-in-time query — the agent decides how to react. Action " +
        "'large_transfers'.",
      inputSchema: {
        action: z.literal("large_transfers").default("large_transfers"),
        chain: z.string().describe("EVM chain key."),
        token: z.string().describe("ERC-20 token address to watch."),
        minAmount: z.number().describe("Minimum transfer size in human units (e.g. 100000 for 100k tokens)."),
        blockLookback: z.number().default(500).describe("How many recent blocks to scan (max 5000)."),
        limit: z.number().default(20).describe("Max number of transfers to return."),
        ...providerInputShape,
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "whale_watch", startedAt, chain: input.chain };
      const chain = getChain(input.chain);
      if (!chain) return toToolResult(invalidInput(`unknown chain '${input.chain}'`, meta));
      if (chain.kind !== "evm") return toToolResult(invalidInput("whale watch supports EVM chains only", meta));
      if (!isAddress(input.token)) return toToolResult(invalidInput("`token` must be a valid address", meta));

      try {
        const caller = buildCallerConfig(input);
        const res = await recentLargeTransfers(
          input.chain,
          input.token,
          input.minAmount,
          input.blockLookback,
          input.limit,
          caller,
          ctx.op,
        );
        return toToolResult(ok(res, meta, res.warnings));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
