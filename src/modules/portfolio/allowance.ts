import { decodeFunctionResult, encodeFunctionData, maxUint256, parseAbi } from "viem";
import type { OperatorConfig } from "../../config.js";
import { ethCall } from "../../core/rpc.js";
import { resolveEvmRpc, type CallerConfig } from "../../core/providers.js";
import { getChain } from "../../registry/chains.js";

const ERC20_ALLOWANCE_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
]);

/** Heuristic threshold above which an allowance is treated as "unlimited". */
const UNLIMITED_THRESHOLD = maxUint256 / 2n;

export interface AllowanceResult {
  allowance: string;
  isUnlimited: boolean;
  sufficient: boolean;
  needsApproval: boolean;
}

export async function checkAllowance(
  chainKey: string,
  owner: string,
  token: string,
  spender: string,
  requiredAmount: bigint | undefined,
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<AllowanceResult> {
  const { urls } = resolveEvmRpc(chainKey, caller, op);
  const data = encodeFunctionData({
    abi: ERC20_ALLOWANCE_ABI,
    functionName: "allowance",
    args: [owner as `0x${string}`, spender as `0x${string}`],
  });
  const raw = await ethCall(urls, token, data);
  const allowance = decodeFunctionResult({
    abi: ERC20_ALLOWANCE_ABI,
    functionName: "allowance",
    data: raw as `0x${string}`,
  }) as bigint;

  const sufficient = requiredAmount === undefined ? allowance > 0n : allowance >= requiredAmount;
  return {
    allowance: allowance.toString(),
    isUnlimited: allowance >= UNLIMITED_THRESHOLD,
    sufficient,
    needsApproval: !sufficient,
  };
}

export interface UnsignedEvmTx {
  chainId: number;
  to: string;
  data: `0x${string}`;
  value: "0x0";
}

export interface ApproveBuild {
  transaction: UnsignedEvmTx;
  spender: string;
  amount: string;
  mode: "exact" | "unlimited" | "revoke";
  warning?: string;
}

export function buildApprove(
  chainKey: string,
  token: string,
  spender: string,
  amount: bigint,
  mode: "exact" | "unlimited" | "revoke",
): ApproveBuild {
  const chain = getChain(chainKey);
  if (!chain || chain.chainId === null) throw new Error(`not an EVM chain: ${chainKey}`);
  const data = encodeFunctionData({
    abi: ERC20_ALLOWANCE_ABI,
    functionName: "approve",
    args: [spender as `0x${string}`, amount],
  });
  return {
    transaction: { chainId: chain.chainId, to: token, data, value: "0x0" },
    spender,
    amount: amount.toString(),
    mode,
    ...(mode === "unlimited"
      ? { warning: "Unlimited approval — prefer an exact amount to limit risk if the spender is compromised." }
      : {}),
  };
}
