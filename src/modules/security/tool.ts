import { isAddress } from "viem";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { fetchGoPlus } from "./goplus.js";
import { scoreToken } from "./score.js";

export function registerSecurityTool(server: McpServer, _ctx: ToolContext): void {
  server.registerTool(
    "security",
    {
      title: "Security & Anti-Rug Scanner",
      description:
        "Screen an EVM token before buying. Checks honeypot status, buy/sell taxes, liquidity locks, mint/blacklist/" +
        "pause powers, ownership and holder concentration (via GoPlus) and returns a 0-100 risk score with red flags.",
      inputSchema: {
        action: z.literal("scan_token").default("scan_token"),
        chain: z.string().describe("EVM chain key, e.g. 'ethereum', 'base'."),
        address: z.string().describe("Token contract address."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "goplus", startedAt, chain: input.chain };
      const chain = getChain(input.chain);
      if (!chain) return toToolResult(invalidInput(`unknown chain '${input.chain}'`, meta));
      if (chain.kind !== "evm") return toToolResult(invalidInput("security scan supports EVM chains only", meta));
      if (!isAddress(input.address)) return toToolResult(invalidInput("`address` must be a valid token address", meta));

      try {
        const raw = await fetchGoPlus(input.chain, input.address);
        const report = scoreToken(raw);
        const warnings = report.verdict === "insufficient_data" ? ["GoPlus returned little data — token may be brand new"] : [];
        return toToolResult(ok({ token: input.address, ...report, dataSources: ["goplus"] }, meta, warnings));
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
