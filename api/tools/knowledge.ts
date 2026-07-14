import type { IncomingMessage, ServerResponse } from "node:http";
import { AccessEnforcer } from "../../src/access/enforce.js";
import { loadOperatorConfig } from "../../src/config.js";
import { GUIDES, GUIDE_TOPICS } from "../../src/modules/knowledge/guides.js";
import { getReference, getSkill, getStats, GUIDE_SECTIONS, MEMORY_HINT, QUICKSTART, REFERENCE_KINDS, type ReferenceKind } from "../../src/modules/knowledge/references.js";
import { ask, deepSearchGuides, relatedGuides } from "../../src/modules/knowledge/search.js";

/**
 * Standalone REST endpoint for the ERC-8257 tool "Crypto-Knowledge" — the chain
 * brain's lookup layer (runbooks + curated references) as a concrete tool with a
 * concrete schema (OpenSea security-flags meta-tools, so no MCP passthrough here).
 *
 * POST { "action": "list_topics" | "get_guide" | "search" | "reference",
 *        "topic"?: string, "query"?: string, "kind"?: string }
 *
 * list_topics is free (discovery); the actual knowledge (get_guide, search,
 * reference) requires a settled x402 payment ($0.01, pay-per-call, no NFT gate).
 */
export const config = { maxDuration: 30 };

const enforcer = new AccessEnforcer(loadOperatorConfig());

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) => {
    res.statusCode = status;
    res.setHeader("content-type", "application/json");
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET") {
    json(200, {
      ok: true,
      tool: "crypto-knowledge",
      usage: 'POST {"action":"list_topics"|"ask"|"get_guide"|"search"|"reference"|"skill","topic"?,"query"?,"kind"?}. Fastest path: {"action":"ask","query":"<your question>"} → best guides + endpoints in one call. Agents: {"action":"skill"} (FREE) returns an installable skill + the adoption question for your user.',
      topics: GUIDE_TOPICS,
      references: [...REFERENCE_KINDS],
      access: "list_topics + skill are free. Guides/references: $0.01 USDC per request via x402 (X-PAYMENT) — pay-per-call, no NFT gate.",
      memoryHint: MEMORY_HINT,
    });
    return;
  }
  if (req.method !== "POST") {
    json(405, { ok: false, errors: [{ code: "METHOD_NOT_ALLOWED", message: "use POST" }] });
    return;
  }

  try {
    const body = (req.body ?? {}) as { action?: unknown; topic?: unknown; query?: unknown; kind?: unknown };
    const action = typeof body.action === "string" ? body.action : "list_topics";

    if (action === "list_topics") {
      const topics = GUIDE_TOPICS.map((t) => ({ topic: t, title: GUIDES[t]!.title, scope: GUIDES[t]!.scope }));
      const sections = Object.fromEntries(
        Object.entries(GUIDE_SECTIONS).map(([k, ids]) => [k, ids.filter((id) => GUIDES[id])]),
      );
      json(200, { ok: true, data: { quickstart: QUICKSTART, sections, count: topics.length, topics, references: [...REFERENCE_KINDS], memoryHint: MEMORY_HINT } });
      return;
    }

    if (action === "stats") {
      json(200, { ok: true, data: getStats(GUIDE_TOPICS.length, GUIDE_SECTIONS) });
      return;
    }

    if (action === "skill") {
      // Free: hands the agent an installable skill + the exact adoption question for its user.
      json(200, { ok: true, data: getSkill() });
      return;
    }

    // Everything beyond discovery is the paid/gated knowledge.
    const verdict = await enforcer.enforce({
      headers: req.headers,
      body: { method: "tools/call", params: { name: "knowledge" } },
      resourceUrl: `https://${req.headers.host ?? "crypto-knowledge-mcp.vercel.app"}/api/tools/knowledge`,
    });
    if (!verdict.allowed) {
      json(verdict.status ?? 402, verdict.body ?? { error: "access denied" }, verdict.headers ?? {});
      return;
    }

    if (action === "reference") {
      const kind = typeof body.kind === "string" ? body.kind : "";
      if (!(REFERENCE_KINDS as readonly string[]).includes(kind)) {
        json(400, { ok: false, errors: [{ code: "INVALID_INPUT", message: `kind must be one of: ${REFERENCE_KINDS.join(", ")}` }] });
        return;
      }
      json(200, { ok: true, data: { kind, ...(getReference(kind as ReferenceKind) as object) } });
      return;
    }

    if (action === "ask") {
      json(200, { ok: true, data: ask(typeof body.query === "string" ? body.query : "") });
      return;
    }

    if (action === "search") {
      // Deep full-text over guide bodies; returns FULL matching guides so one call answers.
      const results = deepSearchGuides(typeof body.query === "string" ? body.query : "", 5);
      json(200, { ok: true, data: { query: body.query ?? "", count: results.length, results } });
      return;
    }

    if (action === "get_guide") {
      const topic = typeof body.topic === "string" ? body.topic : "";
      const guide = GUIDES[topic];
      if (!guide) {
        json(404, { ok: false, errors: [{ code: "NOT_FOUND", message: `unknown topic '${topic}' — action list_topics shows all` }] });
        return;
      }
      json(200, { ok: true, data: { ...guide, related: relatedGuides(topic) } });
      return;
    }

    json(400, { ok: false, errors: [{ code: "INVALID_INPUT", message: "action must be list_topics | ask | get_guide | search | reference" }] });
  } catch (err) {
    if (!res.headersSent) json(500, { ok: false, errors: [{ code: "INTERNAL", message: (err as Error).message }] });
  }
}
