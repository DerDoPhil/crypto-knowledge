import { isAddress, maxUint256 } from "viem";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { buildCallerConfig, providerInputShape, toToolResult, type ToolContext } from "../shared.js";
import { getBalances } from "./balances.js";
import { valuateBalances } from "./prices.js";
import { buildApprove, checkAllowance } from "./allowance.js";

export function registerPortfolioTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "portfolio",
    {
      title: "Portfolio & Allowance Manager",
      description:
        "Know what a wallet holds before swapping, and manage ERC-20 approvals. Actions: get_balances (native + " +
        "ERC-20 + SPL across chains), check_allowance, build_approve, build_revoke. Approval actions return " +
        "unsigned transactions — the agent signs them itself.",
      inputSchema: {
        action: z.enum(["get_balances", "check_allowance", "build_approve", "build_revoke"]),
        address: z.string().optional().describe("Wallet address (get_balances)."),
        chains: z.array(z.string()).optional().describe("Chains to query (get_balances), e.g. ['ethereum','solana']."),
        tokensByChain: z.record(z.string(), z.array(z.string())).optional().describe("Optional ERC-20 lists per chain."),
        chain: z.string().optional().describe("Chain key (allowance/approve actions)."),
        owner: z.string().optional().describe("Token owner (check_allowance)."),
        token: z.string().optional().describe("ERC-20 token address."),
        spender: z.string().optional().describe("Spender to approve / check."),
        requiredAmount: z.string().optional().describe("Smallest-unit amount the agent needs (check_allowance)."),
        amount: z.string().optional().describe("Approval amount in smallest units (build_approve, exact mode)."),
        unlimited: z.boolean().optional().describe("If true, build_approve uses an unlimited allowance."),
        ...providerInputShape,
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const caller = buildCallerConfig(input);

      try {
        switch (input.action) {
          case "get_balances": {
            const meta = { source: "portfolio", startedAt };
            if (!input.address) return toToolResult(invalidInput("`address` is required", meta));
            const chains = input.chains ?? ["ethereum"];
            const res = await getBalances(chains, input.address, input.tokensByChain, caller, ctx.op);
            const totalUsd = await valuateBalances(res.balances); // best-effort, fills usd in place
            return toToolResult(ok({ address: input.address, totalUsd, balances: res.balances }, meta, res.warnings));
          }

          case "check_allowance": {
            const meta = { source: "portfolio", startedAt, chain: input.chain };
            if (!input.chain || !input.owner || !input.token || !input.spender) {
              return toToolResult(invalidInput("`chain`, `owner`, `token`, `spender` are required", meta));
            }
            if (!isAddress(input.token) || !isAddress(input.owner) || !isAddress(input.spender)) {
              return toToolResult(invalidInput("owner/token/spender must be valid addresses", meta));
            }
            const required = input.requiredAmount ? BigInt(input.requiredAmount) : undefined;
            const res = await checkAllowance(input.chain, input.owner, input.token, input.spender, required, caller, ctx.op);
            return toToolResult(ok(res, meta));
          }

          case "build_approve":
          case "build_revoke": {
            const meta = { source: "portfolio", startedAt, chain: input.chain };
            if (!input.chain || !input.token || !input.spender) {
              return toToolResult(invalidInput("`chain`, `token`, `spender` are required", meta));
            }
            const chain = getChain(input.chain);
            if (!chain || chain.chainId === null) return toToolResult(invalidInput("EVM chain required", meta));
            if (!isAddress(input.token) || !isAddress(input.spender)) {
              return toToolResult(invalidInput("token/spender must be valid addresses", meta));
            }
            if (input.action === "build_revoke") {
              return toToolResult(ok(buildApprove(input.chain, input.token, input.spender, 0n, "revoke"), meta));
            }
            const mode = input.unlimited ? "unlimited" : "exact";
            const amount = input.unlimited ? maxUint256 : input.amount ? BigInt(input.amount) : undefined;
            if (amount === undefined) return toToolResult(invalidInput("`amount` or `unlimited:true` required", meta));
            return toToolResult(ok(buildApprove(input.chain, input.token, input.spender, amount, mode), meta));
          }
        }
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, { source: "portfolio", startedAt }));
      }
    },
  );
}
