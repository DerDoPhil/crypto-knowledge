import { decodeFunctionResult, encodeFunctionData, formatUnits, parseAbi, parseUnits } from "viem";
import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { ethCall, jsonRpc } from "../../core/rpc.js";
import { resolveEvmRpc, type CallerConfig } from "../../core/providers.js";
import { getChain } from "../../registry/chains.js";

/** keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ERC20_DECIMALS_ABI = parseAbi(["function decimals() view returns (uint8)"]);
const MAX_LOOKBACK = 5000;

export interface LargeTransfer {
  from: string;
  to: string;
  raw: string;
  human: string;
  blockNumber: number;
  txHash: string;
}

export interface WhaleResult {
  token: string;
  decimals: number;
  fromBlock: number;
  toBlock: number;
  minAmountHuman: string;
  transfers: LargeTransfer[];
  warnings: string[];
}

interface RawLog {
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
}

function topicToAddress(topic: string): string {
  return "0x" + topic.slice(-40);
}

/**
 * Find recent large ERC-20 transfers ("whale moves") for a token by scanning
 * Transfer logs over a recent block window. Stateless point-in-time query —
 * the agent decides how to react.
 */
export async function recentLargeTransfers(
  chainKey: string,
  token: string,
  minAmountHuman: number,
  blockLookback: number,
  limit: number,
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<WhaleResult> {
  const chain = getChain(chainKey);
  if (!chain || chain.chainId === null) {
    throw new CryptoKnowledgeError(ErrorCode.UNSUPPORTED_CHAIN, `whale watch needs an EVM chain, got '${chainKey}'`);
  }
  const { urls } = resolveEvmRpc(chainKey, caller, op);
  const warnings: string[] = [];

  const lookback = Math.min(blockLookback, MAX_LOOKBACK);
  if (blockLookback > MAX_LOOKBACK) warnings.push(`blockLookback capped at ${MAX_LOOKBACK}`);

  const latestHex = await jsonRpc<string>(urls, "eth_blockNumber", []);
  const latest = Number(BigInt(latestHex));
  const fromBlock = Math.max(0, latest - lookback);

  // decimals (default 18 if the token doesn't expose it)
  let decimals = 18;
  try {
    const d = await ethCall(urls, token, encodeFunctionData({ abi: ERC20_DECIMALS_ABI, functionName: "decimals" }));
    decimals = Number(decodeFunctionResult({ abi: ERC20_DECIMALS_ABI, functionName: "decimals", data: d as `0x${string}` }));
  } catch {
    warnings.push("could not read decimals — assuming 18");
  }

  let logs: RawLog[] = [];
  try {
    logs = await jsonRpc<RawLog[]>(urls, "eth_getLogs", [
      { fromBlock: `0x${fromBlock.toString(16)}`, toBlock: "latest", address: token, topics: [TRANSFER_TOPIC] },
    ]);
  } catch (err) {
    if (err instanceof CryptoKnowledgeError) {
      warnings.push(`RPC rejected the log range (${err.message}) — try a smaller blockLookback or a keyed RPC`);
    } else {
      throw err;
    }
  }

  const threshold = parseUnits(String(minAmountHuman), decimals);

  const transfers: LargeTransfer[] = [];
  for (const log of logs) {
    if (log.topics.length < 3) continue; // not a standard indexed Transfer
    const raw = BigInt(log.data === "0x" ? "0x0" : log.data);
    if (raw < threshold) continue;
    transfers.push({
      from: topicToAddress(log.topics[1]!),
      to: topicToAddress(log.topics[2]!),
      raw: raw.toString(),
      human: formatUnits(raw, decimals),
      blockNumber: Number(BigInt(log.blockNumber)),
      txHash: log.transactionHash,
    });
  }

  transfers.sort((a, b) => (BigInt(b.raw) > BigInt(a.raw) ? 1 : -1));

  return {
    token,
    decimals,
    fromBlock,
    toBlock: latest,
    minAmountHuman: String(minAmountHuman),
    transfers: transfers.slice(0, limit),
    warnings,
  };
}
