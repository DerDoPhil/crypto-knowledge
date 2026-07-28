import { fetchJson } from "../../core/http.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";

/**
 * Jupiter — Solana swap aggregator (keyless). Verified endpoints (from the
 * SwarmSkill bridge): quote + swap build. Returns a serialized, unsigned
 * transaction the agent signs itself (keystore-free).
 */
const JUP_QUOTE = "https://api.jup.ag/swap/v1/quote";
const JUP_SWAP = "https://api.jup.ag/swap/v1/swap";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{ swapInfo: { label?: string; ammKey?: string } }>;
}

function mint(token: string): string {
  if (token.toLowerCase() === "sol" || token.toLowerCase() === "native") return SOL_MINT;
  if (token.toLowerCase() === "usdc") return USDC_MINT;
  return token;
}

export async function getJupiterQuote(
  inputToken: string,
  outputToken: string,
  amount: string,
  slippageBps: number,
): Promise<JupiterQuote> {
  const q = new URLSearchParams({
    inputMint: mint(inputToken),
    outputMint: mint(outputToken),
    amount,
    slippageBps: String(slippageBps),
  });
  try {
    return await fetchJson<JupiterQuote>(`${JUP_QUOTE}?${q.toString()}`);
  } catch (err) {
    if (err instanceof CryptoKnowledgeError && err.code === ErrorCode.NOT_FOUND) {
      throw new CryptoKnowledgeError(ErrorCode.INSUFFICIENT_LIQUIDITY, "no Jupiter route for this pair/amount");
    }
    throw err;
  }
}

export interface SwapBuild {
  quote: {
    inAmount: string;
    outAmount: string;
    minOut: string;
    priceImpactPct: string;
    route: string[];
  };
  serializedTransaction: string;
  encoding: "base64";
  lastValidBlockHeight: number | null;
}

export async function buildJupiterSwap(
  inputToken: string,
  outputToken: string,
  amount: string,
  slippageBps: number,
  userPublicKey: string,
): Promise<SwapBuild> {
  const quote = await getJupiterQuote(inputToken, outputToken, amount, slippageBps);
  const res = await fetchJson<{ swapTransaction?: string; lastValidBlockHeight?: number; error?: string }>(JUP_SWAP, {
    method: "POST",
    body: { quoteResponse: quote, userPublicKey, wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true },
  });
  if (!res.swapTransaction) {
    throw new CryptoKnowledgeError(ErrorCode.UPSTREAM_ERROR, `Jupiter swap build failed: ${res.error ?? "no transaction"}`);
  }
  return {
    quote: {
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      minOut: quote.otherAmountThreshold,
      priceImpactPct: quote.priceImpactPct,
      route: quote.routePlan.map((r) => r.swapInfo.label ?? "amm"),
    },
    serializedTransaction: res.swapTransaction,
    encoding: "base64",
    lastValidBlockHeight: res.lastValidBlockHeight ?? null,
  };
}
