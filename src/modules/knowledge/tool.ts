import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, ok } from "../../core/envelope.js";
import { ErrorCode } from "../../core/errors.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { GUIDES, GUIDE_TOPICS } from "./guides.js";

export function registerKnowledgeTool(server: McpServer, _ctx: ToolContext): void {
  server.registerTool(
    "knowledge",
    {
      title: "Web3 Knowledge Base (ready-to-run runbooks)",
      description:
        "Instant, curated step-by-step Web3 how-tos with REAL commands — create a wallet, deploy a contract (EVM & " +
        "Solana), grind a vanity address per chain, deploy an ERC-20, verify on the explorer, get testnet funds, " +
        "bridge. Retrieve baked-in expertise instead of spending reasoning/search credits re-deriving it. Actions: " +
        "list_topics, get_guide, search.",
      inputSchema: {
        action: z.enum(["list_topics", "get_guide", "search"]).default("list_topics"),
        topic: z.string().optional().describe("Guide topic id (get_guide), e.g. 'create_wallet', 'vanity_address'."),
        query: z.string().optional().describe("Free-text query (search) matched against titles/summaries."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "knowledge", startedAt };

      if (input.action === "list_topics") {
        const topics = GUIDE_TOPICS.map((t) => ({ topic: t, title: GUIDES[t]!.title, scope: GUIDES[t]!.scope }));
        return toToolResult(ok({ count: topics.length, topics }, meta));
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
