import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { invalidInput, ok } from "../../core/envelope.js";
import { getChain } from "../../registry/chains.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { getMevAdvice } from "./protect.js";

export function registerMevTool(server: McpServer, _ctx: ToolContext): void {
  server.registerTool(
    "mev_protection",
    {
      title: "MEV / Front-Running Protection",
      description:
        "Tell the agent how to broadcast a transaction safely: which private RPC to use (Flashbots Protect, MEV " +
        "Blocker) to avoid sandwich attacks, and the per-chain sandwich risk. The agent still signs and broadcasts " +
        "itself — this only returns guidance and endpoints. Action 'advise'.",
      inputSchema: {
        action: z.literal("advise").default("advise"),
        chain: z.string().describe("Chain key to get MEV-protection guidance for."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "mev_protection", startedAt, chain: input.chain };
      if (!getChain(input.chain)) return toToolResult(invalidInput(`unknown chain '${input.chain}'`, meta));
      return toToolResult(ok(getMevAdvice(input.chain), meta));
    },
  );
}
