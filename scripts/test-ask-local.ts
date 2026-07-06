/** Quick local retrieval check for newly added guides. */
import { ask } from "../src/modules/knowledge/search.js";

const queries = [
  "robinhood tokenized stocks chain",
  "how do I get testnet sol autonomously faucet",
  "sepolia faucet without captcha",
  "balancer batch swap quote",
  "jito tip how much",
];

for (const q of queries) {
  const r = ask(q) as { guides?: { topic: string }[]; references?: { entry?: { name?: string } }[] };
  console.log(`Q: ${q}`);
  console.log(`   guides: ${(r.guides ?? []).map((g) => g.topic).slice(0, 3).join(", ")}`);
  console.log(`   references: ${(r.references ?? []).map((e) => e.entry?.name ?? JSON.stringify(e).slice(0, 40)).slice(0, 2).join(" | ")}`);
}
