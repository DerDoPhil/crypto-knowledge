import { formatUnits } from "viem";
import type { OperatorConfig } from "../../config.js";
import { sharedCache, TTL } from "../../core/cache.js";
import { fetchJson } from "../../core/http.js";
import { jsonRpc } from "../../core/rpc.js";
import { resolveEvmRpc, type CallerConfig } from "../../core/providers.js";
import { getChain } from "../../registry/chains.js";

const GWEI = 1_000_000_000n;

/** CoinGecko native-asset ids for USD conversion (keyless simple-price endpoint). */
const COINGECKO_NATIVE: Record<string, string> = {
  ethereum: "ethereum",
  base: "ethereum",
  arbitrum: "ethereum",
  optimism: "ethereum",
  polygon: "matic-network",
  cronos: "crypto-com-chain",
  apechain: "apecoin",
  bsc: "binancecoin",
  avalanche: "avalanche-2",
  solana: "solana",
};

export async function getNativeUsd(chainKey: string): Promise<number | null> {
  const id = COINGECKO_NATIVE[chainKey];
  if (!id) return null;
  try {
    const { value } = await sharedCache.wrap(`price:${id}`, TTL.price, async () => {
      const res = await fetchJson<Record<string, { usd: number }>>(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`,
      );
      return res[id]?.usd ?? null;
    });
    return value;
  } catch {
    return null;
  }
}

export interface EvmTxRequest {
  from?: string;
  to: string;
  data?: string;
  value?: string;
}

export interface GasEstimate {
  baseFeeGwei: number;
  priorityFeeGwei: number;
  estGasUnits: string;
  gasCostNativeWei: string;
  gasCostNative: string;
  gasCostUsd: number | null;
  eip1559: { maxFeePerGas: string; maxPriorityFeePerGas: string };
}

const SPEED_MULTIPLIER: Record<string, number> = { slow: 1, standard: 1.2, fast: 1.5 };

/**
 * EIP-1559 gas estimate for an EVM chain. Reads the latest base fee + suggested
 * priority fee, estimates gas units for the supplied txs, and converts to USD
 * using the native asset price (best-effort).
 */
export async function estimateGas(
  chainKey: string,
  txs: EvmTxRequest[],
  speed: "slow" | "standard" | "fast",
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<GasEstimate> {
  const chain = getChain(chainKey);
  if (!chain || chain.chainId === null) throw new Error(`not an EVM chain: ${chainKey}`);
  const { urls } = resolveEvmRpc(chainKey, caller, op);

  // Base fee from the latest block.
  const block = await jsonRpc<{ baseFeePerGas?: string }>(urls, "eth_getBlockByNumber", ["latest", false]);
  const baseFee = block.baseFeePerGas ? BigInt(block.baseFeePerGas) : 0n;

  // Suggested priority fee (fallback to 1 gwei if the node doesn't support it).
  let priority = GWEI;
  try {
    priority = BigInt(await jsonRpc<string>(urls, "eth_maxPriorityFeePerGas", []));
  } catch {
    /* keep 1 gwei default */
  }

  const mult = SPEED_MULTIPLIER[speed] ?? 1.2;
  const maxPriority = (priority * BigInt(Math.round(mult * 100))) / 100n;
  const maxFee = baseFee * 2n + maxPriority;

  // Gas units: sum eth_estimateGas across txs (fallback 150k each if it reverts).
  let gasUnits = 0n;
  for (const tx of txs) {
    try {
      const est = await jsonRpc<string>(urls, "eth_estimateGas", [
        { from: tx.from, to: tx.to, data: tx.data, value: tx.value ?? "0x0" },
      ]);
      gasUnits += BigInt(est);
    } catch {
      gasUnits += 150_000n;
    }
  }

  const gasCostWei = maxFee * gasUnits;
  const nativeUsd = await getNativeUsd(chainKey);
  const gasCostNative = formatUnits(gasCostWei, chain.nativeDecimals);
  const gasCostUsd = nativeUsd !== null ? round(Number(gasCostNative) * nativeUsd) : null;

  return {
    baseFeeGwei: Number(formatUnits(baseFee, 9)),
    priorityFeeGwei: Number(formatUnits(maxPriority, 9)),
    estGasUnits: gasUnits.toString(),
    gasCostNativeWei: gasCostWei.toString(),
    gasCostNative,
    gasCostUsd,
    eip1559: { maxFeePerGas: maxFee.toString(), maxPriorityFeePerGas: maxPriority.toString() },
  };
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
