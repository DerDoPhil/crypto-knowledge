import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { fetchJson } from "../../core/http.js";
import { getChain } from "../../registry/chains.js";
import type { RouteParams, RouteQuote } from "./types.js";

const LIFI_BASE = "https://li.quest/v1";
const NATIVE_PLACEHOLDER = "0x0000000000000000000000000000000000000000";

/** Map our chain key to LiFi's chain identifier (numeric EVM id, or 'SOL'). */
function lifiChainId(chainKey: string): string | number {
  const chain = getChain(chainKey);
  if (!chain) throw new CryptoKnowledgeError(ErrorCode.UNSUPPORTED_CHAIN, `unknown chain '${chainKey}'`);
  if (chain.kind === "solana") return "SOL";
  return chain.chainId!;
}

function tokenParam(token: string): string {
  return token.toLowerCase() === "native" ? NATIVE_PLACEHOLDER : token;
}

interface LifiQuote {
  estimate: {
    toAmount: string;
    toAmountMin: string;
    executionDuration: number;
    fromAmountUSD?: string;
    toAmountUSD?: string;
    gasCosts?: Array<{ amountUSD?: string }>;
    feeCosts?: Array<{ amountUSD?: string; name?: string }>;
  };
  tool: string;
  toolDetails?: { name?: string };
  includedSteps?: Array<{ type: string; tool: string; action?: { fromChainId?: number; toChainId?: number } }>;
  transactionRequest?: { to: string; data: string; value: string; chainId: number; gasLimit?: string; gasPrice?: string };
  action?: { toToken?: { symbol?: string; decimals?: number } };
}

function sumUsd(items: Array<{ amountUSD?: string }> | undefined): number | null {
  if (!items || items.length === 0) return null;
  let total = 0;
  let any = false;
  for (const it of items) {
    if (it.amountUSD) {
      total += Number(it.amountUSD);
      any = true;
    }
  }
  return any ? round(total) : null;
}

/** Fetch the best cross-chain route from LiFi and normalize it for agents. */
export async function getRoute(params: RouteParams, op: OperatorConfig): Promise<RouteQuote> {
  const query = new URLSearchParams({
    fromChain: String(lifiChainId(params.fromChain)),
    toChain: String(lifiChainId(params.toChain)),
    fromToken: tokenParam(params.fromToken),
    toToken: tokenParam(params.toToken),
    fromAmount: params.amount,
    fromAddress: params.fromAddress,
    ...(params.toAddress ? { toAddress: params.toAddress } : {}),
    slippage: String((params.slippageBps ?? 50) / 10_000),
    integrator: "crypto-knowledge", // LiFi requires an integrator id, else 400
  });

  const headers: Record<string, string> = {};
  if (op.lifiKey) headers["x-lifi-api-key"] = op.lifiKey;

  let quote: LifiQuote;
  try {
    quote = await fetchJson<LifiQuote>(`${LIFI_BASE}/quote?${query.toString()}`, { headers });
  } catch (err) {
    if (err instanceof CryptoKnowledgeError && err.code === ErrorCode.NOT_FOUND) {
      throw new CryptoKnowledgeError(ErrorCode.INSUFFICIENT_LIQUIDITY, "no route found for this pair/amount");
    }
    throw err;
  }

  const gasUsd = sumUsd(quote.estimate.gasCosts);
  const bridgeUsd = sumUsd(quote.estimate.feeCosts);
  const totalUsd = gasUsd === null && bridgeUsd === null ? null : round((gasUsd ?? 0) + (bridgeUsd ?? 0));

  return {
    aggregator: `lifi:${quote.toolDetails?.name ?? quote.tool}`,
    estimatedOut: {
      raw: quote.estimate.toAmount,
      min: quote.estimate.toAmountMin,
      token: quote.action?.toToken?.symbol ?? null,
    },
    estimatedTimeSec: quote.estimate.executionDuration,
    fees: { gasUsd, bridgeUsd, totalUsd },
    steps: (quote.includedSteps ?? []).map((s) => `${s.type}:${s.tool}`),
    transaction: quote.transactionRequest
      ? {
          to: quote.transactionRequest.to,
          data: quote.transactionRequest.data,
          value: quote.transactionRequest.value,
          ...(quote.transactionRequest.chainId !== undefined ? { chainId: quote.transactionRequest.chainId } : {}),
        }
      : null,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
