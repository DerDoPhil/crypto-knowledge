import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { fetchJson } from "../../core/http.js";
import { getChain } from "../../registry/chains.js";
import type { RouteParams, RouteQuote } from "./types.js";

const DLN_BASE = "https://dln.debridge.finance/v1.0";
const EVM_NATIVE = "0x0000000000000000000000000000000000000000";
const SOL_NATIVE = "11111111111111111111111111111111";

/** deBridge uses real EVM chainIds and the internal id 7565164 for Solana. */
function dlnChainId(chainKey: string): number {
  const chain = getChain(chainKey);
  if (!chain) throw new CryptoKnowledgeError(ErrorCode.UNSUPPORTED_CHAIN, `unknown chain '${chainKey}'`);
  if (chain.kind === "solana") return 7565164;
  return chain.chainId!;
}

function tokenParam(token: string, chainKey: string): string {
  if (token.toLowerCase() !== "native") return token;
  return getChain(chainKey)?.kind === "solana" ? SOL_NATIVE : EVM_NATIVE;
}

interface DlnResponse {
  estimation?: {
    srcChainTokenIn?: { amount?: string; approximateOperatingExpense?: string };
    dstChainTokenOut?: { amount?: string; recommendedAmount?: string; symbol?: string };
    costsDetails?: Array<{ payload?: { feeAmount?: string; amountInUsd?: string } }>;
  };
  tx?: { to?: string; data?: string; value?: string };
  order?: { approximateFulfillmentDelay?: number };
  fixFee?: string;
  orderId?: string;
  errorId?: string;
  errorMessage?: string;
}

/** Fetch a cross-chain route from the deBridge Liquidity Network (DLN). */
export async function getRoute(params: RouteParams, _lifiUnused?: unknown): Promise<RouteQuote> {
  const recipient = params.toAddress ?? params.fromAddress;
  const query = new URLSearchParams({
    srcChainId: String(dlnChainId(params.fromChain)),
    srcChainTokenIn: tokenParam(params.fromToken, params.fromChain),
    srcChainTokenInAmount: params.amount,
    dstChainId: String(dlnChainId(params.toChain)),
    dstChainTokenOut: tokenParam(params.toToken, params.toChain),
    dstChainTokenOutAmount: "auto",
    dstChainTokenOutRecipient: recipient,
    srcChainOrderAuthorityAddress: params.fromAddress,
    dstChainOrderAuthorityAddress: recipient,
    prependOperatingExpenses: "true",
  });

  const res = await fetchJson<DlnResponse>(`${DLN_BASE}/dln/order/create-tx?${query.toString()}`);
  if (res.errorId || !res.estimation?.dstChainTokenOut?.amount) {
    throw new CryptoKnowledgeError(
      ErrorCode.INSUFFICIENT_LIQUIDITY,
      `deBridge: ${res.errorMessage ?? "no route for this pair/amount"}`,
    );
  }

  const out = res.estimation.dstChainTokenOut;
  const bridgeUsd =
    res.estimation.costsDetails?.reduce((acc, c) => acc + Number(c.payload?.amountInUsd ?? 0), 0) || null;

  return {
    aggregator: "debridge:dln",
    estimatedOut: { raw: out.amount!, min: out.recommendedAmount ?? null, token: out.symbol ?? null },
    estimatedTimeSec: res.order?.approximateFulfillmentDelay ?? 60,
    fees: { gasUsd: null, bridgeUsd: bridgeUsd ? round(bridgeUsd) : null, totalUsd: bridgeUsd ? round(bridgeUsd) : null },
    steps: ["bridge:debridge-dln"],
    transaction:
      res.tx?.to && res.tx.data ? { to: res.tx.to, data: res.tx.data, value: res.tx.value ?? "0x0" } : null,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
