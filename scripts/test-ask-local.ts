/** Quick local retrieval check for newly added guides. */
import { ask } from "../src/modules/knowledge/search.js";

const queries = [
  "where can I park idle stablecoins for the best on-chain yield",
  "sUSDS savings rate vs sDAI DSR",
  "convert DAI to USDS",
  "euler v2 borrow flow enable controller",
  "fluid smart collateral debt lending",
  "gearbox leverage credit account",
  "give an NFT its own wallet token bound account",
  "borrow ETH against my NFT blur blend",
  "protect my solana swap from sandwich attacks jito",
  "what happens when a pump.fun token graduates to pumpswap",
  "aave GHO stablecoin savings yield sGHO",
  "compound v3 comet borrow usdc against eth collateral",
  "trade on base aerodrome usdc",
  "arbitrum timeboost express lane ordering for bots",
  "should my bot retry after a transaction timeout",
  "how much edge do I need to cover gas and slippage",
  "trade on polygon quickswap POL gas",
  "avalanche liquidity book bins trader joe",
  "apechain APE gas nft trading",
  "launch my own NFT collection deploy ERC721 royalties",
  "get my collection listed on opensea studio edit page",
  "list an NFT for sale programmatically opensea sdk",
  "nft marketplaces on robinhood chain dinos",
  "trade on optimism velodrome superchain",
  "hyperevm precompiles order book from smart contract",
  "track KOL influencer wallets copy trading safely",
  "submit a jito bundle sendBundle tip amount solana",
  "which mcp servers exist for crypto data and execution",
  "is it safe to connect my agent to a random mcp server",
  "pay for an api with bitcoin lightning L402 micropayment",
  "cow protocol eip712 order signing domain",
  "which entrypoint version should my bundler target v0.8 v0.9",
  "how do crypto narratives rotate and when does hype collapse",
  "erc-8004 agent identity reputation registry",
  "escrow a job between two agents erc-8183 evaluator",
  "give my agent a wallet with spending limits mpc policies",
  "wrapped cryptopunks seaport punk attributes on chain",
];

for (const q of queries) {
  const r = ask(q) as { guides?: { topic: string }[]; references?: { entry?: { name?: string } }[] };
  console.log(`Q: ${q}`);
  console.log(`   guides: ${(r.guides ?? []).map((g) => g.topic).slice(0, 3).join(", ")}`);
  console.log(`   references: ${(r.references ?? []).map((e) => e.entry?.name ?? JSON.stringify(e).slice(0, 40)).slice(0, 2).join(" | ")}`);
}
