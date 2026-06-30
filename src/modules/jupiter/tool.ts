import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { buildJupiterSwap, getJupiterQuote } from "./swap.js";

export function registerJupiterTool(server: McpServer, _ctx: ToolContext): void {
  server.registerTool(
    "solana_swap",
    {
      title: "Solana Swap (Jupiter)",
      description:
        "Quote and build same-chain Solana swaps via the Jupiter aggregator (e.g. SOL->USDC, or buy a graduated " +
        "pump.fun token). Tokens accept a mint address or the aliases 'SOL'/'USDC'. build_swap returns a " +
        "serialized, unsigned transaction the agent signs itself. Actions: quote, build_swap.",
      inputSchema: {
        action: z.enum(["quote", "build_swap"]),
        inputToken: z.string().describe("Input mint or 'SOL'/'USDC'."),
        outputToken: z.string().describe("Output mint or 'SOL'/'USDC'."),
        amount: z.string().describe("Input amount in smallest units (lamports for SOL)."),
        slippageBps: z.number().default(50).describe("Max slippage in basis points."),
        userPublicKey: z.string().optional().describe("Signer pubkey (required for build_swap)."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "jupiter", startedAt, chain: "solana" };
      try {
        if (input.action === "quote") {
          const q = await getJupiterQuote(input.inputToken, input.outputToken, input.amount, input.slippageBps);
          return toToolResult(ok(q, meta));
        }
        if (!input.userPublicKey) return toToolResult(invalidInput("`userPublicKey` is required for build_swap", meta));
        const build = await buildJupiterSwap(
          input.inputToken,
          input.outputToken,
          input.amount,
          input.slippageBps,
          input.userPublicKey,
        );
        return toToolResult(ok(build, meta));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
