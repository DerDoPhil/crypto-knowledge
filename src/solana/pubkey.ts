import { sha256 } from "@noble/hashes/sha256";
import { ed25519 } from "@noble/curves/ed25519";
import bs58 from "bs58";

/**
 * Minimal Solana public-key + PDA utilities in pure JS — replaces @solana/web3.js
 * so the server bundles cleanly into serverless functions (web3.js pulls in
 * rpc-websockets which breaks Vercel's bundler with ERR_REQUIRE_ESM).
 *
 * The PDA derivation is verified to match PublicKey.findProgramAddressSync in
 * tests/pubkey.test.ts.
 */
const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");

export function decodeBase58(s: string): Uint8Array {
  return bs58.decode(s);
}
export function encodeBase58(b: Uint8Array): string {
  return bs58.encode(b);
}

/**
 * Solana's is_on_curve = "the 32 bytes decompress to a valid Edwards point"
 * (no prime-order subgroup requirement). @noble's Point.fromHex performs exactly
 * the decompression validation we need.
 */
export function isOnCurve(bytes: Uint8Array): boolean {
  try {
    // Same call @solana/web3.js uses — decompression validation, no subgroup check.
    ed25519.ExtendedPoint.fromHex(bytes);
    return true;
  } catch {
    return false;
  }
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/** Derive a program-derived address: scan bumps 255..0 for the first off-curve hash. */
export function findProgramAddressSync(seeds: Uint8Array[], programId: Uint8Array): { address: Uint8Array; bump: number } {
  for (let bump = 255; bump >= 0; bump--) {
    const hash = sha256(concatBytes([...seeds, new Uint8Array([bump]), programId, PDA_MARKER]));
    if (!isOnCurve(hash)) return { address: hash, bump };
  }
  throw new Error("unable to find a viable program address bump");
}

/** Convenience: derive a PDA from base58 program id + raw seeds, return base58. */
export function derivePdaBase58(seeds: Uint8Array[], programIdBase58: string): string {
  const { address } = findProgramAddressSync(seeds, decodeBase58(programIdBase58));
  return encodeBase58(address);
}
