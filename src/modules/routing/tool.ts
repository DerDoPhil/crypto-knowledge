import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { getRoute } from "./lifi.js";

export function registerRoutingTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "route",
    {
      title: "Cross-Chain Routing Optimizer",
      description:
        "Find the best cross-chain route between any supported chains/tokens (e.g. CRO -> SOL) via the LiFi " +
        "aggregator. Returns the estimated output, time, fees and a ready-to-sign transactionRequest. Action 'quote'.",
      inputSchema: {
        action: z.literal("quote").default("quote"),
        fromChain: z.string().describe("Source chain key, e.g. 'cronos'."),
        toChain: z.string().describe("Destination chain key, e.g. 'solana'."),
        fromToken: z.string().describe("Source token address or 'native'."),
        toToken: z.string().describe("Destination token address or 'native'."),
        amount: z.string().describe("Amount in smallest units of fromToken."),
        fromAddress: z.string().describe("Sender address on the source chain."),
        toAddress: z.string().optional().describe("Recipient on the destination chain (defaults to fromAddress)."),
        slippageBps: z.number().default(50).describe("Max slippage in basis points."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "lifi", startedAt, chain: input.fromChain };
      if (!getChain(input.fromChain)) return toToolResult(invalidInput(`unknown fromChain '${input.fromChain}'`, meta));
      if (!getChain(input.toChain)) return toToolResult(invalidInput(`unknown toChain '${input.toChain}'`, meta));

      try {
        const route = await getRoute(
          {
            fromChain: input.fromChain,
            toChain: input.toChain,
            fromToken: input.fromToken,
            toToken: input.toToken,
            amount: input.amount,
            fromAddress: input.fromAddress,
            ...(input.toAddress ? { toAddress: input.toAddress } : {}),
            slippageBps: input.slippageBps,
          },
          ctx.op,
        );
        const warnings = route.transaction === null ? ["No ready transaction returned for this route"] : [];
        return toToolResult(ok({ best: route }, meta, warnings));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
