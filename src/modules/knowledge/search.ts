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
