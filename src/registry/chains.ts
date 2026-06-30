/**
 * Data-driven chain registry. Adding a chain = adding an entry here, no code
 * changes elsewhere. Chain-agnostic by design (product decision 2026-06-30):
 * Cronos is just one entry among equals.
 *
 * `etherscanV2ChainId` is the chainid passed to the unified Etherscan V2 API
 * (https://api.etherscan.io/v2/api?chainid=...). Chains not covered by Etherscan
 * V2 set it to null and fall back to their own explorer / Sourcify.
 */

export type ChainKind = "evm" | "solana";

export interface ChainEntry {
  /** Stable slug used in tool inputs. */
  key: string;
  name: string;
  kind: ChainKind;
  /** EVM numeric chainId, or null for non-EVM. */
  chainId: number | null;
  nativeSymbol: string;
  nativeDecimals: number;
  /** Public RPC used when the caller has no own/tool key (provider mode "open"). */
  publicRpc: string;
  /** Alchemy subdomain for keyed EVM RPC, or null if Alchemy has no endpoint. */
  alchemySubdomain: string | null;
  /** chainid for the unified Etherscan V2 API, or null if unsupported. */
  etherscanV2ChainId: number | null;
  /** Human explorer base (for links in responses). */
  explorerUrl: string;
}

export const CHAINS: Record<string, ChainEntry> = {
  ethereum: {
    key: "ethereum",
    name: "Ethereum",
    kind: "evm",
    chainId: 1,
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    publicRpc: "https://ethereum-rpc.publicnode.com",
    alchemySubdomain: "eth-mainnet",
    etherscanV2ChainId: 1,
    explorerUrl: "https://etherscan.io",
  },
  base: {
    key: "base",
    name: "Base",
    kind: "evm",
    chainId: 8453,
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    publicRpc: "https://mainnet.base.org",
    alchemySubdomain: "base-mainnet",
    etherscanV2ChainId: 8453,
    explorerUrl: "https://basescan.org",
  },
  arbitrum: {
    key: "arbitrum",
    name: "Arbitrum One",
    kind: "evm",
    chainId: 42161,
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    publicRpc: "https://arb1.arbitrum.io/rpc",
    alchemySubdomain: "arb-mainnet",
    etherscanV2ChainId: 42161,
    explorerUrl: "https://arbiscan.io",
  },
  polygon: {
    key: "polygon",
    name: "Polygon",
    kind: "evm",
    chainId: 137,
    nativeSymbol: "POL",
    nativeDecimals: 18,
    publicRpc: "https://polygon-rpc.com",
    alchemySubdomain: "polygon-mainnet",
    etherscanV2ChainId: 137,
    explorerUrl: "https://polygonscan.com",
  },
  cronos: {
    key: "cronos",
    name: "Cronos",
    kind: "evm",
    chainId: 25,
    nativeSymbol: "CRO",
    nativeDecimals: 18,
    publicRpc: "https://evm.cronos.org",
    alchemySubdomain: null, // no Alchemy endpoint — public RPC only for inventory
    etherscanV2ChainId: 25, // Cronoscan is part of the Etherscan V2 federation
    explorerUrl: "https://cronoscan.com",
  },
  apechain: {
    key: "apechain",
    name: "ApeChain",
    kind: "evm",
    chainId: 33139,
    nativeSymbol: "APE",
    nativeDecimals: 18,
    publicRpc: "https://apechain.calderachain.xyz/http",
    alchemySubdomain: null,
    etherscanV2ChainId: 33139,
    explorerUrl: "https://apescan.io",
  },
  solana: {
    key: "solana",
    name: "Solana",
    kind: "solana",
    chainId: null,
    nativeSymbol: "SOL",
    nativeDecimals: 9,
    publicRpc: "https://api.mainnet-beta.solana.com",
    alchemySubdomain: null,
    etherscanV2ChainId: null,
    explorerUrl: "https://solscan.io",
  },
};

export const CHAIN_KEYS = Object.keys(CHAINS);
export const EVM_CHAIN_KEYS = CHAIN_KEYS.filter((k) => CHAINS[k]!.kind === "evm");

export function getChain(key: string): ChainEntry | undefined {
  return CHAINS[key.toLowerCase()];
}

export function getChainByEvmId(chainId: number): ChainEntry | undefined {
  return Object.values(CHAINS).find((c) => c.chainId === chainId);
}

export function isEvmChain(key: string): boolean {
  return getChain(key)?.kind === "evm";
}
