import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, ok } from "../../core/envelope.js";
import { ErrorCode } from "../../core/errors.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { GUIDES, GUIDE_TOPICS } from "./guides.js";
import { getReference, REFERENCE_KINDS, type ReferenceKind } from "./references.js";

export function registerKnowledgeTool(server: McpServer, _ctx: ToolContext): void {
  server.registerTool(
    "knowledge",
    {
      title: "Web3 Knowledge Base (runbooks + curated references)",
      description:
        "The chain brain's lookup layer: instant, curated Web3 expertise so agents don't burn reasoning/search " +
        "credits re-deriving it (or hallucinating an address). Runbooks with REAL commands — wallets, deploys " +
        "(EVM & Solana), vanity addresses, explorer verification, EIP-712 signing, ERC-20 allowance/permit flows, " +
        "event-log fetching, tx debugging, x402 machine payments, Multicall batching, SIWE auth, ERC-8257/OpenSea " +
        "tool registration. Plus reference tables: canonical contract addresses (Multicall3, Permit2, USDC/WETH " +
        "per chain, Solana programs), keyless/free API endpoints (prices, routing, security, ABIs) with limits, a " +
        "common-error playbook (pattern → cause → fix) and JSON-RPC gotchas. Actions: list_topics, get_guide, " +
        "search, reference.",
      inputSchema: {
        action: z.enum(["list_topics", "get_guide", "search", "reference"]).default("list_topics"),
        topic: z.string().optional().describe("Guide topic id (get_guide), e.g. 'create_wallet', 'debug_failed_tx'."),
        query: z.string().optional().describe("Free-text query (search) matched against titles/summaries."),
        kind: z
          .enum(REFERENCE_KINDS)
          .optional()
          .describe("Reference table (action 'reference'): addresses | endpoints | errors | rpc_gotchas."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "knowledge", startedAt };

      if (input.action === "list_topics") {
        const topics = GUIDE_TOPICS.map((t) => ({ topic: t, title: GUIDES[t]!.title, scope: GUIDES[t]!.scope }));
        return toToolResult(ok({ count: topics.length, topics, references: [...REFERENCE_KINDS] }, meta));
      }

      if (input.action === "reference") {
        if (!input.kind) {
          return toToolResult(
            fail({ code: ErrorCode.INVALID_INPUT, message: `'kind' required: ${REFERENCE_KINDS.join(" | ")}` }, meta),
          );
        }
        return toToolResult(ok({ kind: input.kind, ...(getReference(input.kind as ReferenceKind) as object) }, meta));
      }

      if (input.action === "search") {
        const q = (input.query ?? "").toLowerCase();
        const hits = Object.values(GUIDES)
          .filter((g) => `${g.topic} ${g.title} ${g.summary}`.toLowerCase().includes(q))
          .map((g) => ({ topic: g.topic, title: g.title, summary: g.summary }));
        return toToolResult(ok({ query: input.query ?? "", count: hits.length, results: hits }, meta));
      }

      // get_guide
      const guide = input.topic ? GUIDES[input.topic] : undefined;
      if (!guide) {
        return toToolResult(
          fail({ code: ErrorCode.NOT_FOUND, message: `unknown topic '${input.topic}'. Try action 'list_topics'.` }, meta),
        );
      }
      return toToolResult(ok(guide, meta));
    },
  );
}
