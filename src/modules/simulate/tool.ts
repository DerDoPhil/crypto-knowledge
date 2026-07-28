import { isAddress } from "viem";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { buildCallerConfig, providerInputShape, toToolResult, type ToolContext } from "../shared.js";
import { simulateTx } from "./simulate.js";

export function registerSimulateTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "simulate",
    {
      title: "Transaction Dry-Run / Simulation",
      description:
        "Pre-flight an EVM transaction via eth_call before signing: returns whether it would revert and the decoded " +
        "revert reason (Error(string) / Panic / custom selector), so the agent never burns gas on a doomed tx. " +
        "Action 'tx'.",
      inputSchema: {
        action: z.literal("tx").default("tx"),
        chain: z.string().describe("EVM chain key."),
        tx: z
          .object({ from: z.string().optional(), to: z.string(), data: z.string().optional(), value: z.string().optional() })
          .describe("The transaction to simulate."),
        ...providerInputShape,
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "simulate", startedAt, chain: input.chain };
      const chain = getChain(input.chain);
      if (!chain) return toToolResult(invalidInput(`unknown chain '${input.chain}'`, meta));
      if (chain.kind !== "evm") return toToolResult(invalidInput("simulation supports EVM chains only", meta));
      if (!isAddress(input.tx.to)) return toToolResult(invalidInput("`tx.to` must be a valid address", meta));

      try {
        const caller = buildCallerConfig(input);
        const res = await simulateTx(input.chain, input.tx, caller, ctx.op);
        const warnings = res.willRevert ? [`Transaction would REVERT: ${res.revertReason ?? "unknown reason"}`] : [];
        return toToolResult(ok(res, meta, warnings));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
