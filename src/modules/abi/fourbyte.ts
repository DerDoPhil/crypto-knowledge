import { type Abi, parseAbi } from "viem";
import { sharedCache, TTL } from "../../core/cache.js";
import { fetchJson } from "../../core/http.js";

/**
 * 4byte directory fallback — recover a function signature from its 4-byte
 * selector so calldata can be decoded even for UNVERIFIED contracts (no ABI).
 * Returns candidate signatures ordered most-likely-first.
 */
interface FourByteResponse {
  results: Array<{ id: number; text_signature: string }>;
}

export async function lookupSelector(selector: string): Promise<string[]> {
  const sel = selector.toLowerCase();
  if (!/^0x[0-9a-f]{8}$/.test(sel)) return [];
  const { value } = await sharedCache.wrap(`4byte:${sel}`, TTL.abi, async () => {
    const res = await fetchJson<FourByteResponse>(
      `https://www.4byte.directory/api/v1/signatures/?hex_signature=${sel}`,
      { maxAttempts: 2, timeoutMs: 8000 },
    );
    // Earliest id = registered first = usually the canonical signature.
    return res.results.sort((a, b) => a.id - b.id).map((r) => r.text_signature);
  });
  return value;
}

/** Build a minimal ABI from a `name(types...)` signature string. */
export function abiFromSignature(textSignature: string): Abi {
  // Widen to string[] so viem's parseAbi skips compile-time literal validation
  // (the signature is only known at runtime).
  const sigs: string[] = [`function ${textSignature}`];
  return parseAbi(sigs) as Abi;
}
