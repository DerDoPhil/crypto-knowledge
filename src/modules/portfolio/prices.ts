import { sharedCache, TTL } from "../../core/cache.js";
import { fetchJson } from "../../core/http.js";
import { getNativeUsd } from "../gas/oracle.js";
import type { ChainBalances } from "./balances.js";

/** CoinGecko asset-platform ids for the token_price endpoint. */
const PLATFORM: Record<string, string> = {
  ethereum: "ethereum",
  base: "base",
  arbitrum: "arbitrum-one",
  optimism: "optimistic-ethereum",
  polygon: "polygon-pos",
  bsc: "binance-smart-chain",
  avalanche: "avalanche",
  cronos: "cronos",
  solana: "solana",
};

async function tokenUsdPrices(chainKey: string, addresses: string[]): Promise<Record<string, number>> {
  const platform = PLATFORM[chainKey];
  if (!platform || addresses.length === 0) return {};
  const lower = addresses.map((a) => a.toLowerCase()).sort();
  const key = `tokprice:${platform}:${lower.join(",")}`;
  try {
    const { value } = await sharedCache.wrap(key, TTL.price, async () => {
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${lower.join(",")}&vs_currencies=usd`;
      return fetchJson<Record<string, { usd?: number }>>(url);
    });
    const out: Record<string, number> = {};
    for (const [addr, v] of Object.entries(value)) if (v.usd !== undefined) out[addr.toLowerCase()] = v.usd;
    return out;
  } catch {
    return {};
  }
}

/**
 * Fill USD values into a set of chain balances (mutates in place) and return the
 * portfolio total. Best-effort: prices that can't be fetched stay null.
 */
export async function valuateBalances(balances: ChainBalances[]): Promise<number | null> {
  let total = 0;
  let any = false;

  for (const cb of balances) {
    const nativeUsd = await getNativeUsd(cb.chain);
    if (nativeUsd !== null) {
      cb.native.usd = round(Number(cb.native.human) * nativeUsd);
      total += cb.native.usd;
      any = true;
    }

    const addrs = cb.tokens.map((t) => t.address).filter((a): a is string => a !== null);
    const prices = await tokenUsdPrices(cb.chain, addrs);
    for (const t of cb.tokens) {
      if (t.address && prices[t.address.toLowerCase()] !== undefined) {
        t.usd = round(Number(t.human) * prices[t.address.toLowerCase()]!);
        total += t.usd;
        any = true;
      }
    }
  }

  return any ? round(total) : null;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
