import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { fetchJson } from "../../core/http.js";
import { resolveSolanaRpc, type CallerConfig } from "../../core/providers.js";
import { getAccountDataBase64 } from "../../solana/account.js";
import { decodeBase58, encodeBase58, findProgramAddressSync } from "../../solana/pubkey.js";

const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const METADATA_SEED = new TextEncoder().encode("metadata");
const IPFS_GATEWAYS = ["https://ipfs.io/ipfs/", "https://cloudflare-ipfs.com/ipfs/", "https://gateway.pinata.cloud/ipfs/"];

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  uri: string;
  resolvedImage: string | null;
  description: string | null;
  twitter: string | null;
  telegram: string | null;
  website: string | null;
}

function metadataPda(mintBytes: Uint8Array): string {
  const programBytes = decodeBase58(METADATA_PROGRAM_ID);
  const { address } = findProgramAddressSync([METADATA_SEED, programBytes, mintBytes], programBytes);
  return encodeBase58(address);
}

/** Read a borsh length-prefixed UTF-8 string, returning the value and next offset. */
function readString(data: Buffer, offset: number): { value: string; next: number } {
  const len = data.readUInt32LE(offset);
  const start = offset + 4;
  const raw = data.slice(start, start + len).toString("utf8");
  return { value: raw.replace(/\0/g, "").trim(), next: start + len };
}

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) return IPFS_GATEWAYS[0] + uri.slice("ipfs://".length);
  return uri;
}

interface OffchainJson {
  image?: string;
  description?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

function assertValidMint(mint: string): Uint8Array {
  try {
    const bytes = decodeBase58(mint);
    if (bytes.length !== 32) throw new Error("bad length");
    return bytes;
  } catch {
    throw new CryptoKnowledgeError(ErrorCode.INVALID_INPUT, `invalid mint address '${mint}'`);
  }
}

/** Resolve a pump.fun / SPL token's on-chain metadata + off-chain IPFS JSON. */
export async function getTokenMetadata(
  mintStr: string,
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<TokenMetadata> {
  const mintBytes = assertValidMint(mintStr);
  const { urls } = resolveSolanaRpc(caller, op);
  const data = await getAccountDataBase64(urls, metadataPda(mintBytes));
  if (!data) throw new CryptoKnowledgeError(ErrorCode.NOT_FOUND, `no Metaplex metadata for ${mintStr}`);

  // key(1) + updateAuthority(32) + mint(32) = 65, then name, symbol, uri.
  let offset = 65;
  const name = readString(data, offset);
  offset = name.next;
  const symbol = readString(data, offset);
  offset = symbol.next;
  const uri = readString(data, offset);

  let resolvedImage: string | null = null;
  let description: string | null = null;
  let twitter: string | null = null;
  let telegram: string | null = null;
  let website: string | null = null;

  if (uri.value) {
    try {
      const json = await fetchJson<OffchainJson>(ipfsToHttp(uri.value), { maxAttempts: 2, timeoutMs: 8000 });
      resolvedImage = json.image ? ipfsToHttp(json.image) : null;
      description = json.description ?? null;
      twitter = json.twitter ?? null;
      telegram = json.telegram ?? null;
      website = json.website ?? null;
    } catch {
      // off-chain JSON unreachable — return on-chain fields only
    }
  }

  return {
    mint: mintStr,
    name: name.value,
    symbol: symbol.value,
    uri: uri.value,
    resolvedImage,
    description,
    twitter,
    telegram,
    website,
  };
}
