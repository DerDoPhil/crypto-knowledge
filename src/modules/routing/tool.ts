import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { ErrorCode } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { getRoute as getLifiRoute } from "./lifi.js";
import { getRoute as getDebridgeRoute } from "./debridge.js";
import type { RouteParams, RouteQuote } from "./types.js";

type Aggregator = "lifi" | "debridge";

export function registerRoutingTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "route",
    {
      title: "Cross-Chain Routing Optimizer",
      description:
        "Find the best cross-chain route between any supported chains/tokens (e.g. CRO -> SOL). Queries multiple " +
        "aggregators (LiFi + deBridge) in parallel, compares output/fees, and returns the best route plus " +
        "alternatives, each with a ready-to-sign transaction. Action 'quote'.",
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
        aggregators: z.array(z.enum(["lifi", "debridge"])).optional().describe("Restrict to these aggregators."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "route", startedAt, chain: input.fromChain };
      if (!getChain(input.fromChain)) return toToolResult(invalidInput(`unknown fromChain '${input.fromChain}'`, meta));
      if (!getChain(input.toChain)) return toToolResult(invalidInput(`unknown toChain '${input.toChain}'`, meta));

      const params: RouteParams = {
        fromChain: input.fromChain,
        toChain: input.toChain,
        fromToken: input.fromToken,
        toToken: input.toToken,
        amount: input.amount,
        fromAddress: input.fromAddress,
        ...(input.toAddress ? { toAddress: input.toAddress } : {}),
        slippageBps: input.slippageBps,
      };

      const wanted: Aggregator[] = input.aggregators ?? ["lifi", "debridge"];
      const tasks: Array<Promise<RouteQuote>> = [];
      if (wanted.includes("lifi")) tasks.push(getLifiRoute(params, ctx.op));
      if (wanted.includes("debridge")) tasks.push(getDebridgeRoute(params));

      const settled = await Promise.allSettled(tasks);
      const routes = settled.filter((s): s is PromiseFulfilledResult<RouteQuote> => s.status === "fulfilled").map((s) => s.value);
      const failures = settled.filter((s): s is PromiseRejectedResult => s.status === "rejected").map((s) => String(s.reason?.message ?? s.reason));

      if (routes.length === 0) {
        return toToolResult(
          fail({ code: ErrorCode.INSUFFICIENT_LIQUIDITY, message: `no route found. ${failures.join("; ")}` }, meta),
        );
      }

      // Best = highest estimated output (same destination token → compare raw bigint).
      routes.sort((a, b) => (BigInt(b.estimatedOut.raw) > BigInt(a.estimatedOut.raw) ? 1 : -1));
      const [best, ...alternatives] = routes;

      const warnings: string[] = [];
      if (best!.transaction === null) warnings.push("Best route returned no ready transaction yet (provide recipient/authority).");
      if (failures.length > 0) warnings.push(`Some aggregators failed: ${failures.join("; ")}`);

      return toToolResult(ok({ best, alternatives }, meta, warnings));
    },
  );
}
