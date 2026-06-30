import { decodeFunctionResult, encodeFunctionData, isAddress, parseAbi } from "viem";
import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { resolveEvmRpc, type CallerConfig } from "../../core/providers.js";
import { ethCall } from "../../core/rpc.js";
import { getChain } from "../../registry/chains.js";

/**
 * ChainTrade V2 escrow — P2P cross-chain / same-chain trades incl. NFTs.
 * Live dApp: https://chaintrade.vercel.app. The escrow holds maker assets until
 * a relayer releases to the taker (95%, 5% platform fee on fungibles) or the
 * maker refunds after expiry. This module builds UNSIGNED lock/refund txs.
 */
export const CHAINTRADE_URL = "https://chaintrade.vercel.app";
export const PLATFORM_FEE_BPS = 500; // 5% on fungibles (NFTs transfer whole)

export const ESCROWS: Record<string, { address: `0x${string}`; chainId: number }> = {
  ethereum: { address: "0x51A425f516aa3D95B76665D1Bad3Ea56E57be4b6", chainId: 1 },
  base: { address: "0xD7c9a6b38568c03fbA1f08f4159dD2c032411Ac9", chainId: 8453 },
  polygon: { address: "0x9B2EA7B176D727459233469c88c7352fb060b85B", chainId: 137 },
  arbitrum: { address: "0x9B2EA7B176D727459233469c88c7352fb060b85B", chainId: 42161 },
  apechain: { address: "0x9B2EA7B176D727459233469c88c7352fb060b85B", chainId: 33139 },
};

const ESCROW_ABI = parseAbi([
  "function lockETH(bytes32 offerHash, address taker, uint64 expiresAt) payable",
  "function lockERC20(bytes32 offerHash, address taker, uint64 expiresAt, address token, uint256 amount)",
  "function lockERC721(bytes32 offerHash, address taker, uint64 expiresAt, address token, uint256 tokenId)",
  "function refund(bytes32 offerHash)",
  "function trades(bytes32) view returns (address maker, address taker, uint64 expiresAt, uint64 lockedAt, bool released, bool refunded)",
  "function lockedEth(bytes32) view returns (uint256)",
]);
const ERC20_APPROVE_ABI = parseAbi(["function approve(address spender, uint256 value)"]);
const ERC721_APPROVE_ABI = parseAbi(["function approve(address to, uint256 tokenId)"]);

export interface UnsignedEvmTx {
  chainId: number;
  to: string;
  data: `0x${string}`;
  value: string;
}

function escrowFor(chainKey: string): { address: `0x${string}`; chainId: number } {
  const e = ESCROWS[chainKey];
  if (!e) {
    throw new CryptoKnowledgeError(
      ErrorCode.UNSUPPORTED_CHAIN,
      `ChainTrade is live on ${Object.keys(ESCROWS).join(", ")} — not '${chainKey}'`,
    );
  }
  return e;
}

function assertHash(offerHash: string): `0x${string}` {
  if (!/^0x[0-9a-fA-F]{64}$/.test(offerHash)) {
    throw new CryptoKnowledgeError(ErrorCode.INVALID_INPUT, "offerHash must be a 0x + 64-hex bytes32 (from your ChainTrade offer)");
  }
  return offerHash as `0x${string}`;
}

export interface LockBuild {
  /** Approval tx required first (ERC-20/721 only) — null for native ETH. */
  approval: UnsignedEvmTx | null;
  /** The lock tx that escrows the asset. */
  lock: UnsignedEvmTx;
  note: string;
}

export function buildLockEth(chainKey: string, offerHash: string, taker: string, expiresAt: number, amountWei: string): LockBuild {
  const e = escrowFor(chainKey);
  if (!isAddress(taker)) throw new CryptoKnowledgeError(ErrorCode.INVALID_INPUT, "taker must be a valid address");
  const data = encodeFunctionData({ abi: ESCROW_ABI, functionName: "lockETH", args: [assertHash(offerHash), taker as `0x${string}`, BigInt(expiresAt)] });
  return { approval: null, lock: { chainId: e.chainId, to: e.address, data, value: amountWei }, note: "Sign + send to lock native ETH into escrow." };
}

export function buildLockErc20(chainKey: string, offerHash: string, taker: string, expiresAt: number, token: string, amount: string): LockBuild {
  const e = escrowFor(chainKey);
  if (!isAddress(taker) || !isAddress(token)) throw new CryptoKnowledgeError(ErrorCode.INVALID_INPUT, "taker/token must be valid addresses");
  const approval = encodeFunctionData({ abi: ERC20_APPROVE_ABI, functionName: "approve", args: [e.address, BigInt(amount)] });
  const lock = encodeFunctionData({ abi: ESCROW_ABI, functionName: "lockERC20", args: [assertHash(offerHash), taker as `0x${string}`, BigInt(expiresAt), token as `0x${string}`, BigInt(amount)] });
  return {
    approval: { chainId: e.chainId, to: token, data: approval, value: "0x0" },
    lock: { chainId: e.chainId, to: e.address, data: lock, value: "0x0" },
    note: "Send the approval tx first, then the lock tx. 5% platform fee applies to fungibles on release.",
  };
}

export function buildLockErc721(chainKey: string, offerHash: string, taker: string, expiresAt: number, token: string, tokenId: string): LockBuild {
  const e = escrowFor(chainKey);
  if (!isAddress(taker) || !isAddress(token)) throw new CryptoKnowledgeError(ErrorCode.INVALID_INPUT, "taker/token must be valid addresses");
  const approval = encodeFunctionData({ abi: ERC721_APPROVE_ABI, functionName: "approve", args: [e.address, BigInt(tokenId)] });
  const lock = encodeFunctionData({ abi: ESCROW_ABI, functionName: "lockERC721", args: [assertHash(offerHash), taker as `0x${string}`, BigInt(expiresAt), token as `0x${string}`, BigInt(tokenId)] });
  return {
    approval: { chainId: e.chainId, to: token, data: approval, value: "0x0" },
    lock: { chainId: e.chainId, to: e.address, data: lock, value: "0x0" },
    note: "Send the approval tx first (approves this specific NFT to the escrow), then the lock tx. NFTs transfer whole (no fee).",
  };
}

export function buildRefund(chainKey: string, offerHash: string): UnsignedEvmTx {
  const e = escrowFor(chainKey);
  const data = encodeFunctionData({ abi: ESCROW_ABI, functionName: "refund", args: [assertHash(offerHash)] });
  return { chainId: e.chainId, to: e.address, data, value: "0x0" };
}

export interface TradeState {
  maker: string;
  taker: string;
  expiresAt: number;
  lockedAt: number;
  released: boolean;
  refunded: boolean;
  lockedEthWei: string;
  exists: boolean;
}

export async function getTrade(chainKey: string, offerHash: string, caller: CallerConfig, op: OperatorConfig): Promise<TradeState> {
  const e = escrowFor(chainKey);
  const { urls } = resolveEvmRpc(chainKey, caller, op);
  const hash = assertHash(offerHash);

  const tradeData = await ethCall(urls, e.address, encodeFunctionData({ abi: ESCROW_ABI, functionName: "trades", args: [hash] }));
  const [maker, taker, expiresAt, lockedAt, released, refunded] = decodeFunctionResult({
    abi: ESCROW_ABI,
    functionName: "trades",
    data: tradeData as `0x${string}`,
  }) as [string, string, bigint, bigint, boolean, boolean];

  const ethData = await ethCall(urls, e.address, encodeFunctionData({ abi: ESCROW_ABI, functionName: "lockedEth", args: [hash] }));
  const lockedEth = decodeFunctionResult({ abi: ESCROW_ABI, functionName: "lockedEth", data: ethData as `0x${string}` }) as bigint;

  return {
    maker,
    taker,
    expiresAt: Number(expiresAt),
    lockedAt: Number(lockedAt),
    released,
    refunded,
    lockedEthWei: lockedEth.toString(),
    exists: maker !== "0x0000000000000000000000000000000000000000",
  };
}
