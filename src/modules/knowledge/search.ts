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

/** Light synonym/alias expansion so common phrasings hit the right guide bodies. */
const SYNONYMS: Record<string, string[]> = {
  gas: ["fee", "fees", "eip1559", "gas_optimization"],
  fee: ["gas", "gas_optimization"],
  fees: ["gas", "gas_optimization"],
  swap: ["dex", "trade", "exchange", "aggregator"],
  bridge: ["crosschain", "cross-chain", "cctp"],
  liquidation: ["healthfactor", "liquidate", "underwater"],
  price: ["oracle", "quote"],
  bot: ["automation", "trading"],
  nft: ["metadata", "collectible"],
  rug: ["scam", "honeypot", "rugpull"],
  stake: ["staking", "validator", "steth", "jitosol"],
  perp: ["perpetual", "funding", "leverage"],
  wallet: ["key", "keypair", "signer"],
  approve: ["allowance", "approval", "permit"],
  vault: ["erc4626", "yield"],
  register: ["erc8257", "opensea", "listing"],
};

/** Ubiquitous words that would match nearly every guide body and flatten ranking. */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "how", "get", "use", "can", "you", "your", "are", "any",
  "from", "into", "out", "via", "per", "not", "but", "does", "what", "when", "which",
  "this", "that", "then", "than", "them", "they", "have", "has", "was", "will", "would",
  "should", "could", "about", "over", "under", "onto", "off", "all", "one", "two",
  "to", "of", "in", "on", "is", "it", "or", "an", "as", "at", "by", "be", "do", "my", "we", "up",
  "reduce", "make", "need", "want", "help", "check", "find", "using", "avoid", "best",
]);

function tokenize(query: string): string[] {
  const base = query
    .toLowerCase()
    .split(/[^a-z0-9_.]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
  const expanded = new Set(base);
  for (const t of base) for (const syn of SYNONYMS[t] ?? []) expanded.add(syn);
  return [...expanded];
}

export interface RankedGuide extends Guide {
  score: number;
}

/**
 * Compact search hit: enough to decide relevance (title + summary + score)
 * without paying the tokens for the full step list. Fetch the winner with
 * get_guide — or pass full:true to skip previews entirely.
 */
export interface GuidePreview {
  topic: string;
  title: string;
  summary: string;
  scope: string[];
  score: number;
  preview: true;
}

export function toPreview(g: RankedGuide): GuidePreview {
  return { topic: g.topic, title: g.title, summary: g.summary, scope: g.scope, score: g.score, preview: true };
}

/**
 * Token-saving default shape for ask/search results: rank 1 stays a FULL guide
 * (one call still answers), lower ranks become previews the agent can expand
 * with get_guide only when needed.
 */
export function compactGuides(ranked: RankedGuide[], fullCount = 1): (RankedGuide | GuidePreview)[] {
  return ranked.map((g, i) => (i < fullCount ? g : toPreview(g)));
}

/** Note appended to compacted results so agents know how to expand a preview. */
export const PREVIEW_NOTE =
  "Rank 1 is the full guide; lower ranks are previews (topic/title/summary/score). Expand one with { action: 'get_guide', topic: '<id>' }, or repeat this call with full: true to get every match in full.";

/**
 * Rescue path for get_guide with an unknown topic id, so a paid call is never
 * wasted: a UNIQUE substring match on topic ids resolves directly to that guide
 * (e.g. 'uniswap_v3' → uniswap_v3_swap_coding); otherwise the id is treated as
 * a search query and the best guides come back as previews.
 */
export function resolveTopicMiss(requested: string): {
  resolvedTopic?: string;
  bestMatch?: Guide;
  suggestions: GuidePreview[];
} {
  const norm = requested.toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  const ids = Object.keys(GUIDES);
  const substring = norm.length >= 3 ? ids.filter((id) => id.includes(norm) || norm.includes(id)) : [];
  const ranked = deepSearchGuides(norm.replace(/_/g, " "), 5);
  // Substring candidates first (most likely what was meant), then search hits.
  const seen = new Set<string>();
  const suggestions: GuidePreview[] = [];
  for (const id of substring) {
    if (!seen.has(id)) {
      seen.add(id);
      suggestions.push(toPreview({ ...GUIDES[id]!, score: 0 }));
    }
  }
  for (const g of ranked) {
    if (!seen.has(g.topic) && suggestions.length < 5) {
      seen.add(g.topic);
      suggestions.push(toPreview(g));
    }
  }
  if (substring.length === 1) {
    const id = substring[0]!;
    return { resolvedTopic: id, bestMatch: GUIDES[id]!, suggestions };
  }
  return { suggestions };
}

/**
 * Related guides, derived at runtime: other guide topic-ids that THIS guide already
 * mentions in its body text (guides cross-reference each other in prose, e.g.
 * "(defi_lending)" / "see solana_pay"). No per-guide maintenance needed.
 */
export function relatedGuides(topic: string, limit = 6): string[] {
  const g = GUIDES[topic];
  if (!g) return [];
  const hay = [
    g.summary,
    ...g.steps.flatMap((s) => [s.title, s.note ?? "", s.command ?? ""]),
    ...(g.warnings ?? []),
  ].join(" ").toLowerCase();
  const related: string[] = [];
  for (const id of Object.keys(GUIDES)) {
    if (id === topic) continue;
    // Word-boundary match so 'defi_lending' doesn't match inside another id.
    if (new RegExp(`\\b${id}\\b`).test(hay)) related.push(id);
    if (related.length >= limit) break;
  }
  return related;
}

/**
 * Score every guide against the query (term hits: strong fields ×3, body ×1) and
 * return the best matches as FULL guides, ranked. Empty query → no results.
 */
/** Count non-overlapping occurrences of a term in a haystack (frequency signal). */
function countOccurrences(hay: string, term: string): number {
  if (!term) return 0;
  let n = 0;
  let i = hay.indexOf(term);
  while (i !== -1) {
    n++;
    i = hay.indexOf(term, i + term.length);
  }
  return n;
}

export function deepSearchGuides(query: string, limit = 5): RankedGuide[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const q = query.toLowerCase();
  const scored: RankedGuide[] = [];
  for (const g of Object.values(GUIDES)) {
    const { strong, weak } = guideHaystack(g);
    let score = 0;
    let matchedTerms = 0;
    for (const t of terms) {
      const inStrong = strong.includes(t);
      // Title/topic/summary hit dominates; body hits add with diminishing frequency weight.
      const strongScore = inStrong ? 5 : 0;
      const weakHits = countOccurrences(weak, t);
      const weakScore = weakHits > 0 ? 1 + Math.min(2, Math.log2(weakHits + 1)) : 0; // 1..3, saturating
      if (inStrong || weakHits > 0) matchedTerms++;
      score += strongScore + weakScore;
    }
    // Reward guides that match MORE of the distinct query terms (coverage), not just one term many times.
    if (matchedTerms > 1) score += matchedTerms;
    // Verbatim phrase bonus.
    if (q.length >= 4 && (strong.includes(q) || weak.includes(q))) score += 3;
    if (score > 0) scored.push({ ...g, score: Math.round(score * 100) / 100 });
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
 * Default keeps rank 1 as a FULL guide and compacts ranks 2–3 to previews
 * (token saving); pass { full: true } for the old all-full behavior.
 */
export function ask(
  query: string,
  opts: { full?: boolean } = {},
): {
  query: string;
  guides: (RankedGuide | GuidePreview)[];
  references: ReferenceHit[];
  note?: string;
  hint?: string;
} {
  const ranked = deepSearchGuides(query, 3);
  const guides = opts.full ? ranked : compactGuides(ranked, 1);
  const references = searchReferences(query, 6);
  const out: { query: string; guides: (RankedGuide | GuidePreview)[]; references: ReferenceHit[]; note?: string; hint?: string } = { query, guides, references };
  if (!opts.full && ranked.length > 1) out.note = PREVIEW_NOTE;
  if (guides.length === 0 && references.length === 0) {
    out.hint = "No direct match. Try action 'list_topics' to browse categories, or rephrase with concrete terms (chain, protocol, error text).";
  }
  return out;
}
