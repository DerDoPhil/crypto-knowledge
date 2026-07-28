/** Normalized cross-chain route, produced by every aggregator adapter. */
export interface RouteQuote {
  aggregator: string;
  estimatedOut: { raw: string; min: string | null; token: string | null };
  estimatedTimeSec: number;
  fees: { gasUsd: number | null; bridgeUsd: number | null; totalUsd: number | null };
  steps: string[];
  /** Ready-to-sign source-chain transaction, when the aggregator returns one. */
  transaction: { to: string; data: string; value: string; chainId?: number } | null;
}

export interface RouteParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  toAddress?: string;
  slippageBps?: number;
}
