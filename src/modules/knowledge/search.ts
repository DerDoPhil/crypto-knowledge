/**
 * Retrieval layer for the knowledge tool. Deep full-text search over guide BODIES
 * (not just titles) and the reference tables, so an agent's real question resolves
 * to the actual content in ONE gated call instead of a title-match + a second fetch.
 */
import { GUIDES, type Guide } from "./guides.js";
import { ADDRESSES, COMMON_ERRORS, ENDPOINTS, RPC_GOTCHAS } from "./references.js";

/** All searchable text of a guide, weighted: title/topic/summary count more than body. */
function guideHaystack(g: Guide): { strong: string; weak: string } {
  const strong = `${g.topic} ${g.title} ${g.summary}`.toLowerCase();
  const weak = [
    ...(g.prerequisites ?? []),
    ...g.steps.flatMap((s) => [s.title, s.command ?? "", s.note ?? ""]),
    ...(g.warnings ?? []),
    ...(g.references ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return { strong, weak };
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9_.]+/)
    .filter((t) => t.length >= 2);
}

export interface RankedGuide extends Guide {
  score: number;
}

/**
 * Score every guide against the query (term hits: strong fields ×3, body ×1) and
 * return the best matches as FULL guides, ranked. Empty query → no results.
 */
export function deepSearchGuides(query: string, limit = 5): RankedGuide[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const scored: RankedGuide[] = [];
  for (const g of Object.values(GUIDES)) {
    const { strong, weak } = guideHaystack(g);
    let score = 0;
    for (const t of terms) {
      if (strong.includes(t)) score += 3;
      if (weak.includes(t)) score += 1;
    }
    // Small bonus when the whole phrase appears verbatim.
    if (query.trim().length >= 3 && (strong.includes(query.toLowerCase()) || weak.includes(query.toLowerCase()))) score += 2;
    if (score > 0) scored.push({ ...g, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface ReferenceHit {
  kind: "addresses" | "endpoints" | "errors" | "rpc_gotchas";
  entry: unknown;
  score: number;
}

/** Search the reference tables so questions like "token price api" surface endpoints too. */
export function searchReferences(query: string, limit = 6): ReferenceHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const hits: ReferenceHit[] = [];
  const scan = (kind: ReferenceHit["kind"], entries: unknown[], text: (e: never) => string) => {
    for (const e of entries) {
      const hay = text(e as never).toLowerCase();
      let score = 0;
      for (const t of terms) if (hay.includes(t)) score += 1;
      if (score > 0) hits.push({ kind, entry: e, score });
    }
  };
  scan("endpoints", ENDPOINTS, (e: { name: string; what: string; example?: string }) => `${e.name} ${e.what} ${e.example ?? ""}`);
  scan("addresses", ADDRESSES, (e: { name: string; note?: string }) => `${e.name} ${e.note ?? ""}`);
  scan("errors", COMMON_ERRORS, (e: { pattern: string; cause: string; fix: string }) => `${e.pattern} ${e.cause} ${e.fix}`);
  scan("rpc_gotchas", RPC_GOTCHAS, (e: { topic: string; detail: string }) => `${e.topic} ${e.detail}`);
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * One-shot answer: best guides + relevant reference entries for a natural-language
 * question. Collapses the common discover→fetch round-trip into a single call.
 */
export function ask(query: string): {
  query: string;
  guides: RankedGuide[];
  references: ReferenceHit[];
  hint?: string;
} {
  const guides = deepSearchGuides(query, 3);
  const references = searchReferences(query, 6);
  const out: { query: string; guides: RankedGuide[]; references: ReferenceHit[]; hint?: string } = { query, guides, references };
  if (guides.length === 0 && references.length === 0) {
    out.hint = "No direct match. Try action 'list_topics' to browse categories, or rephrase with concrete terms (chain, protocol, error text).";
  }
  return out;
}
