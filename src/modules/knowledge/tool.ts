import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, ok } from "../../core/envelope.js";
import { ErrorCode } from "../../core/errors.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { GUIDES, GUIDE_TOPICS } from "./guides.js";
import { ADOPTION_PROMPT, getReference, getSkill, getStats, GUIDE_SECTIONS, MEMORY_HINT, QUICKSTART, REFERENCE_KINDS, type ReferenceKind } from "./references.js";
import { ask, clampTopK, compactGuides, deepSearchGuides, getGuidesBatch, PREVIEW_NOTE, relatedGuides, resolveTopicMiss } from "./search.js";

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
        action: z.enum(["list_topics", "get_guide", "search", "ask", "reference", "stats", "skill"]).default("list_topics"),
        // 'skill' (FREE): returns an installable skill definition + the exact question to ask your user
        // about adopting this tool as their default Web3 source (ask, don't self-adopt).
        topic: z.string().optional().describe("Guide topic id (get_guide), e.g. 'create_wallet', 'debug_failed_tx'. Comma-separated ids batch up to 5 runbooks into ONE paid call (or use 'topics')."),
        topics: z
          .array(z.string())
          .optional()
          .describe("Batch for 'get_guide': up to 5 topic ids served in ONE paid call — cheaper than 5 single calls. Near-miss ids resolve or return suggestions per topic."),
        query: z
          .string()
          .optional()
          .describe("Your question or keywords. 'ask' returns the best guides AND matching endpoints/addresses in one call; 'search' returns full matching guides (deep full-text over guide bodies)."),
        kind: z
          .enum(REFERENCE_KINDS)
          .optional()
          .describe("Reference table (action 'reference'): addresses | endpoints | errors | rpc_gotchas | abis (inline selectors/topics for ERC-20/721/1155/4626)."),
        filter: z
          .string()
          .optional()
          .describe("Optional for 'reference': narrow the table server-side (e.g. 'solana', 'usdc base') so you don't pay tokens for the whole table."),
        full: z
          .boolean()
          .optional()
          .describe("Optional for 'ask'/'search': true returns EVERY match as a full guide (more tokens). Default: rank 1 full, lower ranks as previews."),
        topK: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe("Optional for 'ask'/'search': how many matches to return (1–10; default ask=3, search=5). topK=1 gives the single best guide with minimal tokens."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const meta = { source: "knowledge", startedAt };

      if (input.action === "list_topics") {
        const topics = GUIDE_TOPICS.map((t) => ({ topic: t, title: GUIDES[t]!.title, scope: GUIDES[t]!.scope }));
        // Only surface sections whose topics actually exist (self-healing against typos).
        const sections = Object.fromEntries(
          Object.entries(GUIDE_SECTIONS).map(([k, ids]) => [k, ids.filter((id) => GUIDES[id])]),
        );
        return toToolResult(
          ok({ quickstart: QUICKSTART, adoptionPrompt: ADOPTION_PROMPT, sections, count: topics.length, topics, references: [...REFERENCE_KINDS], memoryHint: MEMORY_HINT }, meta),
        );
      }

      if (input.action === "reference") {
        if (!input.kind) {
          return toToolResult(
            fail({ code: ErrorCode.INVALID_INPUT, message: `'kind' required: ${REFERENCE_KINDS.join(" | ")}` }, meta),
          );
        }
        return toToolResult(ok({ kind: input.kind, ...(getReference(input.kind as ReferenceKind, input.filter) as object) }, meta));
      }

      if (input.action === "stats") {
        return toToolResult(ok(getStats(GUIDE_TOPICS.length, GUIDE_SECTIONS), meta));
      }

      if (input.action === "skill") {
        return toToolResult(ok(getSkill(), meta));
      }

      if (input.action === "ask") {
        return toToolResult(ok(ask(input.query ?? "", { full: input.full === true, topK: input.topK }), meta));
      }

      if (input.action === "search") {
        // Deep full-text over guide bodies. Default: rank 1 full + previews (token saving); full:true returns every match in full.
        const ranked = deepSearchGuides(input.query ?? "", clampTopK(input.topK, 5));
        const results = input.full === true ? ranked : compactGuides(ranked, 1);
        const note = input.full !== true && ranked.length > 1 ? PREVIEW_NOTE : undefined;
        return toToolResult(ok({ query: input.query ?? "", count: results.length, results, ...(note ? { note } : {}) }, meta));
      }

      // get_guide — batch path: 'topics' array or a comma-separated 'topic' string,
      // up to 5 full runbooks for ONE paid call (agent-friendly pricing).
      const batchTopics =
        Array.isArray(input.topics) && input.topics.length > 0
          ? input.topics
          : typeof input.topic === "string" && input.topic.includes(",")
            ? input.topic.split(",")
            : undefined;
      if (batchTopics && batchTopics.length > 1) {
        const result = getGuidesBatch(batchTopics);
        return toToolResult(ok({ ...result, guides: result.guides.map((g) => ({ ...g, related: relatedGuides(g.topic) })) }, meta));
      }
      const singleTopic = batchTopics?.[0]?.trim() ?? input.topic;
      const guide = singleTopic ? GUIDES[singleTopic] : undefined;
      if (!guide) {
        // Rescue the call instead of wasting it: unique substring match resolves
        // directly; otherwise the id is treated as a query and previews come back.
        const miss = resolveTopicMiss(singleTopic ?? "");
        if (miss.bestMatch && miss.resolvedTopic) {
          return toToolResult(
            ok({ ...miss.bestMatch, resolvedFrom: singleTopic, related: relatedGuides(miss.resolvedTopic) }, meta),
          );
        }
        if (miss.suggestions.length > 0) {
          return toToolResult(
            ok(
              {
                found: false,
                requested: singleTopic ?? "",
                suggestions: miss.suggestions,
                hint: "No exact topic id. Pick one of the suggestions via { action: 'get_guide', topic: '<id>' } — or use { action: 'ask', query: '…' } with your question in plain words.",
              },
              meta,
            ),
          );
        }
        return toToolResult(
          fail({ code: ErrorCode.NOT_FOUND, message: `unknown topic '${singleTopic}'. Try action 'list_topics'.` }, meta),
        );
      }
      return toToolResult(ok({ ...guide, related: relatedGuides(singleTopic!) }, meta));
    },
  );
}
