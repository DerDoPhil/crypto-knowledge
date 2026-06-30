import type { OperatorConfig } from "../config.js";
import { getChain } from "../registry/chains.js";

/**
 * Per-call provider selection (product decision 2026-06-30):
 *   open    → public RPC only (limited data, lower limits) — free tier
 *   own_key → caller supplies their OWN Helius/Alchemy key (recommended)
 *   tool    → use the operator's keys (never exposed) — holder/paid tiers only
 */
export type ProviderMode = "open" | "own_key" | "tool";

export interface CallerConfig {
  providerMode: ProviderMode;
  /** Caller-supplied keys (own_key mode). Used transiently, never persisted/logged. */
  heliusKey?: string;
  alchemyKey?: string;
  /** Optional per-chain RPC overrides. */
  evmRpcOverrides?: Record<string, string>;
}

export interface ResolvedRpc {
  url: string;
  /** True when an API key backs the endpoint (full token/NFT data available). */
  keyed: boolean;
}

/** Choose the effective key for a provider given the caller mode + operator env. */
function effectiveKey(
  mode: ProviderMode,
  callerKey: string | undefined,
  operatorKey: string | undefined,
): string | undefined {
  if (mode === "own_key") return callerKey;
  if (mode === "tool") return operatorKey;
  return undefined; // open
}

export function resolveEvmRpc(chainKey: string, caller: CallerConfig, op: OperatorConfig): ResolvedRpc {
  const chain = getChain(chainKey);
  if (!chain || chain.kind !== "evm") throw new Error(`not an EVM chain: ${chainKey}`);

  const override = caller.evmRpcOverrides?.[chainKey];
  if (override) return { url: override, keyed: true };

  const key = effectiveKey(caller.providerMode, caller.alchemyKey, op.alchemyKey);
  if (key && chain.alchemySubdomain) {
    return { url: `https://${chain.alchemySubdomain}.g.alchemy.com/v2/${key}`, keyed: true };
  }
  return { url: chain.publicRpc, keyed: false };
}

export function resolveSolanaRpc(caller: CallerConfig, op: OperatorConfig): ResolvedRpc {
  const sol = getChain("solana")!;
  const key = effectiveKey(caller.providerMode, caller.heliusKey, op.heliusKey);
  if (key) return { url: `https://mainnet.helius-rpc.com/?api-key=${key}`, keyed: true };
  return { url: sol.publicRpc, keyed: false };
}

/**
 * Whether the tool should nudge the caller to bring their own Helius key.
 * True for the open mode (degraded data) — surfaced as an English warning.
 */
export function shouldNudgeOwnKey(caller: CallerConfig, resolved: ResolvedRpc): boolean {
  return caller.providerMode === "open" && !resolved.keyed;
}

export const OWN_KEY_NUDGE =
  "You're on a public RPC, so token/NFT data may be incomplete and rate limits are lower. " +
  "For full data, get a free key at helius.dev (Solana) or alchemy.com (EVM) and pass it as " +
  "heliusKey/alchemyKey with providerMode 'own_key', or hold the gating NFT for tool-provided access.";
