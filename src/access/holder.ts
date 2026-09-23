/**
 * On-chain Auditors NFT holder check (the free tier — replaces the old Normies
 * gate, removed 2026-07-14, restored 2026-09-24 pointing at Auditors instead).
 *
 * Two-step proof, mirrors the design sketched in Groks-ToDo.md §"Normies NFT
 * holders" that was never wired up: the caller signs a day-bound message with
 * their wallet (no RPC needed to check that — pure EIP-191 recovery), and the
 * server checks that wallet's on-chain Auditors balance (cached 5 min so a
 * chatty agent doesn't cause an eth_call per tool call).
 */
import { verifyMessage } from "viem";
import type { OperatorConfig } from "../config.js";
import { resolveEvmRpc } from "../core/providers.js";
import { ethCall } from "../core/rpc.js";
import { TtlCache } from "../core/cache.js";

const BALANCE_OF_SELECTOR = "0x70a08231"; // balanceOf(address)
const HOLDER_CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new TtlCache();

/** The exact message a wallet must sign; day-bound so a leaked signature expires quickly. */
export function holderAccessMessage(wallet: string, dateUtc: string = todayUtc()): string {
  return `Crypto-Knowledge access as ${wallet.toLowerCase()} on ${dateUtc}`;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Verifies the wallet actually signed today's access message — no RPC round-trip. */
export async function verifyWalletProof(wallet: string, signature: string): Promise<boolean> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet) || !/^0x[a-fA-F0-9]{130}$/.test(signature)) return false;
  try {
    return await verifyMessage({
      address: wallet as `0x${string}`,
      message: holderAccessMessage(wallet),
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

/** True when `wallet` holds >=1 token of `op.access.holderNftContract` on `op.access.holderNftChain`. */
export async function holdsGateNft(wallet: string, op: OperatorConfig): Promise<boolean> {
  const contract = op.access.holderNftContract;
  if (!contract) return false;

  const cacheKey = `holder:${op.access.holderNftChain}:${contract.toLowerCase()}:${wallet.toLowerCase()}`;
  const cached = cache.get<boolean>(cacheKey);
  if (cached) return cached.value;

  const rpc = resolveEvmRpc(op.access.holderNftChain, { providerMode: "tool" }, op);
  const data = BALANCE_OF_SELECTOR + wallet.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  try {
    const raw = await ethCall(rpc.urls, contract, data);
    const balance = BigInt(raw === "0x" ? "0x0" : raw);
    const holds = balance > 0n;
    cache.set(cacheKey, holds, HOLDER_CACHE_TTL_MS);
    return holds;
  } catch {
    // A revert or unreachable RPC must never silently grant free access.
    return false;
  }
}

/** Full check: valid day-bound signature AND a positive on-chain balance. */
export async function checkHolderAccess(wallet: string | undefined, signature: string | undefined, op: OperatorConfig): Promise<boolean> {
  if (!wallet || !signature) return false;
  if (!(await verifyWalletProof(wallet, signature))) return false;
  return holdsGateNft(wallet, op);
}
