import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { buildCallerConfig, providerInputShape, toToolResult, type ToolContext } from "../shared.js";
import { getBondingCurve } from "./curve.js";
import { getTokenMetadata } from "./metadata.js";

export function registerPumpfunTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "pumpfun",
    {
      title: "Pump.fun & Memecoin Lifecycle Engine",
      description:
        "Standardized read access to pump.fun tokens, direct on-chain (no volatile 3rd-party API). Actions: " +
        "get_curve (live bonding-curve reserves, price, graduation progress, market cap) and get_metadata " +
        "(name/symbol + resolved IPFS image & socials).",
      inputSchema: {
        action: z.enum(["get_curve", "get_metadata"]),
        mint: z.string().describe("The token mint address."),
        ...providerInputShape,
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "pumpfun", startedAt, chain: "solana" };
      if (!input.mint) return toToolResult(invalidInput("`mint` is required", meta));

      try {
        const caller = buildCallerConfig(input);
        if (input.action === "get_curve") {
          return toToolResult(ok(await getBondingCurve(input.mint, caller, ctx.op), meta));
        }
        return toToolResult(ok(await getTokenMetadata(input.mint, caller, ctx.op), meta));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
