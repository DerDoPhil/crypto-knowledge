import { decodeFunctionResult, encodeFunctionData, formatUnits, parseAbi } from "viem";
import type { OperatorConfig } from "../../config.js";
import { ethCall, jsonRpc } from "../../core/rpc.js";
import {
  resolveEvmRpc,
  resolveSolanaRpc,
  shouldNudgeOwnKey,
  OWN_KEY_NUDGE,
  type CallerConfig,
} from "../../core/providers.js";
import { getChain } from "../../registry/chains.js";

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

export interface TokenBalance {
  address: string | null; // null = native
  symbol: string | null;
  decimals: number | null;
  raw: string;
  human: string;
  usd: number | null;
}

export interface ChainBalances {
  chain: string;
  native: TokenBalance;
  tokens: TokenBalance[];
}

export interface BalancesResult {
  balances: ChainBalances[];
  warnings: string[];
}

async function erc20Field<T>(rpc: string, token: string, fn: "decimals" | "symbol"): Promise<T | null> {
  try {
    const data = encodeFunctionData({ abi: ERC20_ABI, functionName: fn });
    const raw = await ethCall(rpc, token, data);
    return decodeFunctionResult({ abi: ERC20_ABI, functionName: fn, data: raw as `0x${string}` }) as T;
  } catch {
    return null;
  }
}

interface AlchemyTokenBalances {
  tokenBalances: Array<{ contractAddress: string; tokenBalance: string | null }>;
}

async function evmBalances(
  chainKey: string,
  address: string,
  tokens: string[] | undefined,
  caller: CallerConfig,
  op: OperatorConfig,
  warnings: string[],
): Promise<ChainBalances> {
  const chain = getChain(chainKey)!;
  const { url, keyed } = resolveEvmRpc(chainKey, caller, op);

  const nativeRaw = BigInt(await jsonRpc<string>(url, "eth_getBalance", [address, "latest"]));
  const native: TokenBalance = {
    address: null,
    symbol: chain.nativeSymbol,
    decimals: chain.nativeDecimals,
    raw: nativeRaw.toString(),
    human: formatUnits(nativeRaw, chain.nativeDecimals),
    usd: null,
  };

  // Determine which token contracts to inspect.
  let contracts: string[] = tokens ?? [];
  if (!tokens && keyed) {
    try {
      const res = await jsonRpc<AlchemyTokenBalances>(url, "alchemy_getTokenBalances", [address, "erc20"]);
      contracts = res.tokenBalances
        .filter((t) => t.tokenBalance && BigInt(t.tokenBalance) > 0n)
        .map((t) => t.contractAddress);
    } catch {
      warnings.push(`${chainKey}: token auto-discovery unavailable, pass a 'tokens' list for ERC-20 balances`);
    }
  } else if (!tokens && !keyed) {
    warnings.push(
      `${chainKey}: public RPC can't auto-discover ERC-20s — pass a 'tokens' list or use providerMode 'own_key'/'tool'`,
    );
  }

  const tokenBalances: TokenBalance[] = [];
  for (const token of contracts) {
    try {
      const balData = encodeFunctionData({ abi: ERC20_ABI, functionName: "balanceOf", args: [address as `0x${string}`] });
      const balRaw = BigInt(await ethCall(url, token, balData));
      if (balRaw === 0n) continue;
      const decimals = (await erc20Field<number>(url, token, "decimals")) ?? 18;
      const symbol = (await erc20Field<string>(url, token, "symbol")) ?? null;
      tokenBalances.push({
        address: token,
        symbol,
        decimals,
        raw: balRaw.toString(),
        human: formatUnits(balRaw, decimals),
        usd: null,
      });
    } catch {
      warnings.push(`${chainKey}: failed reading token ${token}`);
    }
  }

  if (shouldNudgeOwnKey(caller, { url, keyed })) warnings.push(OWN_KEY_NUDGE);
  return { chain: chainKey, native, tokens: tokenBalances };
}

const SPL_TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

interface SolTokenAccounts {
  value: Array<{
    account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string; decimals: number; uiAmountString: string } } } } };
  }>;
}

async function solanaBalances(
  address: string,
  caller: CallerConfig,
  op: OperatorConfig,
  warnings: string[],
): Promise<ChainBalances> {
  const sol = getChain("solana")!;
  const { url, keyed } = resolveSolanaRpc(caller, op);

  const lamports = await jsonRpc<{ value: number }>(url, "getBalance", [address]);
  const native: TokenBalance = {
    address: null,
    symbol: "SOL",
    decimals: sol.nativeDecimals,
    raw: String(lamports.value),
    human: formatUnits(BigInt(lamports.value), sol.nativeDecimals),
    usd: null,
  };

  const tokens: TokenBalance[] = [];
  try {
    const accounts = await jsonRpc<SolTokenAccounts>(url, "getTokenAccountsByOwner", [
      address,
      { programId: SPL_TOKEN_PROGRAM },
      { encoding: "jsonParsed" },
    ]);
    for (const acc of accounts.value) {
      const info = acc.account.data.parsed.info;
      if (BigInt(info.tokenAmount.amount) === 0n) continue;
      tokens.push({
        address: info.mint,
        symbol: null,
        decimals: info.tokenAmount.decimals,
        raw: info.tokenAmount.amount,
        human: info.tokenAmount.uiAmountString,
        usd: null,
      });
    }
  } catch {
    warnings.push("solana: failed to read SPL token accounts");
  }

  if (shouldNudgeOwnKey(caller, { url, keyed })) warnings.push(OWN_KEY_NUDGE);
  return { chain: "solana", native, tokens };
}

export async function getBalances(
  chains: string[],
  address: string,
  tokensByChain: Record<string, string[]> | undefined,
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<BalancesResult> {
  const warnings: string[] = [];
  const balances: ChainBalances[] = [];
  for (const chainKey of chains) {
    const chain = getChain(chainKey);
    if (!chain) {
      warnings.push(`unknown chain '${chainKey}' skipped`);
      continue;
    }
    if (chain.kind === "solana") {
      balances.push(await solanaBalances(address, caller, op, warnings));
    } else {
      balances.push(await evmBalances(chainKey, address, tokensByChain?.[chainKey], caller, op, warnings));
    }
  }
  return { balances, warnings };
}
