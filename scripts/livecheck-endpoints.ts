/**
 * Freshness guard: pings every ENDPOINTS entry in references.ts and reports which
 * are still reachable. The tool's core promise is "live-verified" — this catches
 * endpoint rot (host moved, now needs a key, deprecated). CI-able: exits non-zero
 * if any KEYLESS endpoint that should be reachable returns a hard failure.
 *
 * Run: npx tsx scripts/livecheck-endpoints.ts
 *
 * Heuristic per entry: derive a probe URL from baseUrl (+ a safe path from the
 * example when present). We only assert on `auth: "none"` endpoints — free-key
 * ones are EXPECTED to 401/403 without a key, which is itself a healthy signal.
 */
import { ENDPOINTS } from "../src/modules/knowledge/references.js";

interface Probe { name: string; url: string; auth: string; status: number | string; ok: boolean; note: string }

// Endpoints that don't answer a bare GET meaningfully — probe a known-good path.
const PROBE_OVERRIDES: Record<string, { url: string; method?: string; body?: unknown; headers?: Record<string, string> }> = {
  "DefiLlama prices": { url: "https://coins.llama.fi/prices/current/coingecko:ethereum" },
  "DefiLlama yields": { url: "https://yields.llama.fi/pools" },
  "DefiLlama stablecoins": { url: "https://stablecoins.llama.fi/stablecoins?limit=1" },
  "Chainlist chain registry": { url: "https://chainid.network/chains.json" },
  "GoPlus token security": { url: "https://api.gopluslabs.io/api/v1/supported_chains" },
  "4byte.directory": { url: "https://www.4byte.directory/api/v1/signatures/?hex_signature=0xa9059cbb" },
  "Snapshot (DAO governance, off-chain votes)": { url: "https://hub.snapshot.org/graphql", method: "POST", body: { query: "{spaces(first:1){id}}" }, headers: { "content-type": "application/json" } },
  "Hyperliquid (perps, funding rates)": { url: "https://api.hyperliquid.xyz/info", method: "POST", body: { type: "meta" }, headers: { "content-type": "application/json" } },
  "Morpho API (lending markets/positions)": { url: "https://blue-api.morpho.org/graphql", method: "POST", body: { query: "{__typename}" }, headers: { "content-type": "application/json" } },
  "DexScreener (DEX pairs, all chains)": { url: "https://api.dexscreener.com/latest/dex/search?q=SOL" },
  "GeckoTerminal (on-chain DEX prices)": { url: "https://api.geckoterminal.com/api/v2/networks/eth", headers: { accept: "application/json" } },
  "KyberSwap Aggregator (keyless DEX routing)": { url: "https://aggregator-api.kyberswap.com/ethereum/api/v1/routes?tokenIn=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&tokenOut=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&amountIn=1000000000000000000" },
  "Across (fast intent bridge)": { url: "https://app.across.to/api/suggested-fees?inputToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&outputToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&originChainId=1&destinationChainId=8453&amount=1000000000" },
  "DIA Oracle (keyless asset prices)": { url: "https://api.diadata.org/v1/assetQuotation/Ethereum/0x0000000000000000000000000000000000000000" },
  "RedStone (keyless prices, pull-oracle)": { url: "https://api.redstone.finance/prices?symbol=ETH&provider=redstone&limit=1" },
  "Pyth Hermes (cross-chain price oracle, keyless)": { url: "https://hermes.pyth.network/v2/price_feeds?query=eth" },
  "Circle Iris API (CCTP attestations)": { url: "https://iris-api.circle.com/v1/attestations/0x0000000000000000000000000000000000000000000000000000000000000000" },
  "GMX (on-chain perps, Arbitrum/Avalanche)": { url: "https://arbitrum-api.gmxinfra.io/prices/tickers" },
  "Curve API (pools, APYs)": { url: "https://api.curve.finance/api/getPools/ethereum/main" },
  "mempool.space (Bitcoin)": { url: "https://mempool.space/api/v1/fees/recommended" },
  "Blockstream Esplora (Bitcoin)": { url: "https://blockstream.info/api/blocks/tip/height" },
  "Ordiscan (Bitcoin Ordinals / Runes / BRC-20)": { url: "https://api.ordiscan.com/v1/address/bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4/inscriptions" },
  "Jupiter Token API (Solana token resolution)": { url: "https://lite-api.jup.ag/tokens/v2/search?query=SOL" },
  "Jupiter Price API (Solana)": { url: "https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112" },
  "Blockscout (keyless explorer API, many chains)": { url: "https://eth.blockscout.com/api/v2/stats" },
  "The Graph (subgraph queries)": { url: "https://gateway.thegraph.com/api" },
  "LayerZero Scan (cross-chain messages)": { url: "https://scan.layerzero-api.com/v1/messages/latest?limit=1" },
  "Wormholescan (cross-chain VAAs)": { url: "https://api.wormholescan.io/api/v1/vaas?limit=1" },
  "Magic Eden (Solana NFT floor/stats)": { url: "https://api-mainnet.magiceden.dev/v2/collections/mad_lads/stats" },
  "Polymarket (prediction markets)": { url: "https://gamma-api.polymarket.com/markets?limit=1" },
  "Safe Transaction Service (multisig API)": { url: "https://safe-transaction-mainnet.safe.global/api/v1/about" },
  "x402 Router (multi-chain facilitator aggregator)": { url: "https://x402.wgw.lol/supported" },
  "OpenSea MCP server": { url: "https://mcp.opensea.io/mcp" },
  "Ethereum Beacon API (consensus layer)": { url: "https://ethereum-beacon-api.publicnode.com/eth/v1/beacon/states/head/finality_checkpoints" },
};

async function probe(name: string, baseUrl: string, auth: string): Promise<Probe> {
  const o = PROBE_OVERRIDES[name];
  const url = o?.url ?? baseUrl;
  const method = o?.method ?? "GET";
  try {
    const res = await fetch(url, {
      method,
      headers: o?.headers,
      body: o?.body ? JSON.stringify(o.body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    // For keyless: 2xx (or a structured 4xx like 400/404/402 meaning "reached, bad params") = healthy.
    // 401/403 on a keyless endpoint = it now needs auth (rot). free-key: 401/403 is EXPECTED.
    const reached = res.status < 500;
    const authWall = res.status === 401 || res.status === 403;
    let ok: boolean; let note = String(res.status);
    if (auth === "none") { ok = reached && !authWall; if (authWall) note += " (now needs a key? — ROT)"; }
    else { ok = reached; if (authWall) note += " (expected for free-key)"; }
    return { name, url, auth, status: res.status, ok, note };
  } catch (e: unknown) {
    return { name, url, auth, status: "ERR", ok: false, note: (e as Error).name ?? String(e) };
  }
}

async function main() {
  console.log(`Livecheck: ${ENDPOINTS.length} endpoints\n`);
  const results: Probe[] = [];
  // Small concurrency to be polite.
  for (let i = 0; i < ENDPOINTS.length; i += 5) {
    const batch = ENDPOINTS.slice(i, i + 5);
    results.push(...await Promise.all(batch.map((e) => probe(e.name, e.baseUrl, e.auth))));
  }
  let dead = 0;
  for (const r of results.sort((a, b) => Number(a.ok) - Number(b.ok))) {
    const mark = r.ok ? "✅" : "❌";
    if (!r.ok) dead++;
    console.log(`${mark} [${r.auth}] ${r.name} — ${r.note}`);
  }
  console.log(`\n${results.length - dead}/${results.length} healthy, ${dead} need attention.`);
  process.exit(dead > 0 ? 1 : 0);
}

main().catch((e) => { console.error("livecheck failed:", e); process.exit(2); });
