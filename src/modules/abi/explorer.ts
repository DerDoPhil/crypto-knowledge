import type { Abi } from "viem";
import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { fetchJson } from "../../core/http.js";
import { ethGetStorageAt } from "../../core/rpc.js";
import { getChain, type ChainEntry } from "../../registry/chains.js";

/** EIP-1967 logic-implementation storage slot. */
const EIP1967_IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

export interface AbiBundle {
  abi: Abi;
  verified: boolean;
  source: "etherscan-v2" | "sourcify";
  contractName: string | null;
  isProxy: boolean;
  implementation: string | null;
  /** When a proxy resolves, the implementation's ABI is the callable surface. */
  proxyResolved: boolean;
}

interface EtherscanSourceResult {
  status: string;
  message: string;
  result:
    | Array<{ ABI: string; ContractName: string; Proxy: string; Implementation: string }>
    | string;
}

function parseAbiString(raw: string): Abi {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new CryptoKnowledgeError(ErrorCode.UPSTREAM_ERROR, "ABI is not an array");
  return parsed as Abi;
}

async function fromEtherscan(chain: ChainEntry, address: string, key: string): Promise<AbiBundle | null> {
  if (chain.etherscanV2ChainId === null) return null;
  const url =
    `https://api.etherscan.io/v2/api?chainid=${chain.etherscanV2ChainId}` +
    `&module=contract&action=getsourcecode&address=${address}&apikey=${key}`;
  const res = await fetchJson<EtherscanSourceResult>(url);
  if (res.status !== "1" || typeof res.result === "string" || !res.result[0]) return null;

  const row = res.result[0];
  if (!row.ABI || row.ABI.startsWith("Contract source code not verified")) return null;

  const isProxy = row.Proxy === "1" && /^0x[0-9a-fA-F]{40}$/.test(row.Implementation);
  return {
    abi: parseAbiString(row.ABI),
    verified: true,
    source: "etherscan-v2",
    contractName: row.ContractName || null,
    isProxy,
    implementation: isProxy ? row.Implementation : null,
    proxyResolved: false,
  };
}

interface SourcifyMetadata {
  output?: { abi?: Abi };
}

async function fromSourcify(chain: ChainEntry, address: string): Promise<AbiBundle | null> {
  if (chain.chainId === null) return null;
  for (const match of ["full_match", "partial_match"]) {
    try {
      const url = `https://repo.sourcify.dev/contracts/${match}/${chain.chainId}/${address}/metadata.json`;
      const meta = await fetchJson<SourcifyMetadata>(url);
      if (meta.output?.abi) {
        return {
          abi: meta.output.abi,
          verified: true,
          source: "sourcify",
          contractName: null,
          isProxy: false,
          implementation: null,
          proxyResolved: false,
        };
      }
    } catch {
      // try next match level
    }
  }
  return null;
}

/** Read the EIP-1967 implementation slot directly from chain state. */
async function detectProxyOnChain(chain: ChainEntry, address: string): Promise<string | null> {
  try {
    const raw = await ethGetStorageAt(chain.publicRpc, address, EIP1967_IMPL_SLOT);
    if (!raw || raw === "0x" || /^0x0+$/.test(raw)) return null;
    const impl = "0x" + raw.slice(-40);
    return /^0x0+$/.test(impl) ? null : impl;
  } catch {
    return null;
  }
}

/**
 * Resolve a contract's callable ABI. Tries the verified explorer (Etherscan V2),
 * falls back to keyless Sourcify, and transparently follows EIP-1967 proxies so
 * the agent sees the implementation's functions, not the proxy stub.
 */
export async function getAbiBundle(chainKey: string, address: string, op: OperatorConfig): Promise<AbiBundle> {
  const chain = getChain(chainKey);
  if (!chain || chain.kind !== "evm") {
    throw new CryptoKnowledgeError(ErrorCode.UNSUPPORTED_CHAIN, `ABI lookup needs an EVM chain, got '${chainKey}'`);
  }

  let bundle: AbiBundle | null = null;
  if (op.etherscanKey) bundle = await fromEtherscan(chain, address, op.etherscanKey);
  if (!bundle) bundle = await fromSourcify(chain, address);

  if (!bundle) {
    throw new CryptoKnowledgeError(
      ErrorCode.NOT_VERIFIED,
      `Contract ${address} is not verified on ${chain.name} (no ABI from Etherscan V2 or Sourcify).`,
    );
  }

  // If the explorer didn't already flag a proxy, probe the EIP-1967 slot.
  if (!bundle.isProxy) {
    const onchainImpl = await detectProxyOnChain(chain, address);
    if (onchainImpl) {
      bundle.isProxy = true;
      bundle.implementation = onchainImpl;
    }
  }

  // Follow the proxy: fetch the implementation's ABI as the real surface.
  if (bundle.isProxy && bundle.implementation) {
    let implBundle: AbiBundle | null = null;
    if (op.etherscanKey) implBundle = await fromEtherscan(chain, bundle.implementation, op.etherscanKey);
    if (!implBundle) implBundle = await fromSourcify(chain, bundle.implementation);
    if (implBundle) {
      return {
        ...implBundle,
        isProxy: true,
        implementation: bundle.implementation,
        contractName: bundle.contractName ?? implBundle.contractName,
        proxyResolved: true,
      };
    }
  }

  return bundle;
}
