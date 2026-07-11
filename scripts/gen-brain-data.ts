/**
 * Regenerates public/brain-data.json — the dataset behind /brain (the interactive
 * mind map). Single source of truth are the knowledge modules; run this after
 * every guide/reference sweep so the map stays in sync with the live tool.
 *
 *   npx tsx scripts/gen-brain-data.ts
 */
import { writeFileSync } from "node:fs";
import { GUIDES, GUIDE_TOPICS } from "../src/modules/knowledge/guides.js";
import {
  GUIDE_SECTIONS,
  ENDPOINTS,
  ADDRESSES,
  COMMON_ERRORS,
  RPC_GOTCHAS,
  ABIS,
  INTERFACE_IDS,
} from "../src/modules/knowledge/references.js";
import { TOOL_CATALOG } from "../src/modules/catalog/tool.js";
import { CHAINS } from "../src/registry/chains.js";

// Compact per-guide record: enough for the map + detail panel without shipping
// the full gated bodies (steps/commands stay exclusive to the tool itself).
const guides: Record<
  string,
  { t: string; s: string; sc: string[]; n: number; w: number; p: number }
> = {};
for (const topic of GUIDE_TOPICS) {
  const g = GUIDES[topic]!;
  guides[topic] = {
    t: g.title,
    s: g.summary,
    sc: g.scope,
    n: g.steps.length,
    w: g.warnings?.length ?? 0,
    p: g.prerequisites.length,
  };
}

const sections = Object.entries(GUIDE_SECTIONS).map(([name, topics]) => ({
  name,
  // self-healing like list_topics: never reference a topic that no longer exists
  topics: topics.filter((t) => t in guides),
}));

const totalSteps = GUIDE_TOPICS.reduce((acc, t) => acc + GUIDES[t]!.steps.length, 0);

const data = {
  generated: new Date().toISOString().slice(0, 10),
  stats: {
    guides: GUIDE_TOPICS.length,
    sections: sections.length,
    steps: totalSteps,
    endpoints: ENDPOINTS.length,
    keyless: ENDPOINTS.filter((e) => e.auth === "none").length,
    addressGroups: ADDRESSES.length,
    errors: COMMON_ERRORS.length,
    gotchas: RPC_GOTCHAS.length,
    abis: ABIS.length,
    interfaceIds: Object.keys(INTERFACE_IDS).length,
    tools: TOOL_CATALOG.length,
    chains: Object.keys(CHAINS).length,
  },
  sections,
  guides,
  endpoints: ENDPOINTS.map((e) => ({
    name: e.name,
    baseUrl: e.baseUrl,
    auth: e.auth,
    what: e.what,
    limits: e.limits ?? null,
  })),
  addresses: ADDRESSES.map((a) => ({ name: a.name, addresses: a.addresses, note: a.note ?? null })),
  errors: COMMON_ERRORS,
  gotchas: RPC_GOTCHAS,
  abis: ABIS.map((a) => ({
    name: a.name,
    interfaceId: a.interfaceId ?? null,
    functions: a.functions,
    events: a.events ?? [],
  })),
  tools: TOOL_CATALOG.map((t) => ({ name: t.name, purpose: t.purpose, kinds: [...t.kinds] })),
  chains: Object.values(CHAINS).map((c) => ({
    key: c.key,
    name: c.name,
    kind: c.kind,
    chainId: c.chainId,
    nativeSymbol: c.nativeSymbol,
    explorer: c.explorerUrl,
  })),
};

const json = JSON.stringify(data);
writeFileSync("public/brain-data.json", json);
console.log(
  `public/brain-data.json written (${(json.length / 1024).toFixed(1)} KB) — ` +
    `${data.stats.guides} guides, ${data.stats.sections} sections, ${data.stats.endpoints} endpoints`
);
