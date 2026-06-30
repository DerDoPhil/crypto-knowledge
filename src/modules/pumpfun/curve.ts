import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { resolveSolanaRpc, type CallerConfig } from "../../core/providers.js";
import { getAccountDataBase64 } from "../../solana/account.js";
import { decodeBase58, encodeBase58, findProgramAddressSync } from "../../solana/pubkey.js";

export const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const BONDING_CURVE_SEED = new TextEncoder().encode("bonding-curve");

/** pump.fun graduates to Raydium at ~85 SOL of real reserves. */
const GRADUATION_SOL = 85;

export interface BondingCurveState {
  mint: string;
  bondingCurve: string;
  complete: boolean;
  phase: "bonding" | "graduated";
  progressPct: number;
  virtualTokenReserves: string;
  virtualSolReserves: string;
  realTokenReserves: string;
  realSolReserves: string;
  tokenTotalSupply: string;
  priceSolPerToken: number;
  marketCapSol: number;
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

/** Derive the bonding-curve PDA: seeds ["bonding-curve", mint]. Returns base58. */
export function bondingCurvePda(mintBytes: Uint8Array): string {
  const { address } = findProgramAddressSync([BONDING_CURVE_SEED, mintBytes], decodeBase58(PUMP_PROGRAM_ID));
  return encodeBase58(address);
}

function decodeCurve(data: Buffer): {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
} {
  // 8-byte Anchor discriminator, then five u64 LE fields and a bool.
  if (data.length < 49) throw new CryptoKnowledgeError(ErrorCode.RPC_ERROR, "bonding curve account too short");
  return {
    virtualTokenReserves: data.readBigUInt64LE(8),
    virtualSolReserves: data.readBigUInt64LE(16),
    realTokenReserves: data.readBigUInt64LE(24),
    realSolReserves: data.readBigUInt64LE(32),
    tokenTotalSupply: data.readBigUInt64LE(40),
    complete: data.readUInt8(48) === 1,
  };
}

/** Read a pump.fun token's live bonding-curve state and price (direct on-chain). */
export async function getBondingCurve(
  mintStr: string,
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<BondingCurveState> {
  const mintBytes = assertValidMint(mintStr);
  const { urls } = resolveSolanaRpc(caller, op);
  const curvePk = bondingCurvePda(mintBytes);

  const data = await getAccountDataBase64(urls, curvePk);
  if (!data) {
    throw new CryptoKnowledgeError(ErrorCode.NOT_FOUND, `no bonding curve for ${mintStr} (not a pump.fun token or graduated)`);
  }

  const c = decodeCurve(data);

  // price = (virtualSol / 1e9) / (virtualToken / 1e6)  — verified formula.
  const solReserves = Number(c.virtualSolReserves) / 1e9;
  const tokenReserves = Number(c.virtualTokenReserves) / 1e6;
  const priceSolPerToken = tokenReserves > 0 ? solReserves / tokenReserves : 0;
  const totalSupply = Number(c.tokenTotalSupply) / 1e6;

  const realSol = Number(c.realSolReserves) / 1e9;
  const progressPct = c.complete ? 100 : Math.min(100, (realSol / GRADUATION_SOL) * 100);

  return {
    mint: mintStr,
    bondingCurve: curvePk,
    complete: c.complete,
    phase: c.complete ? "graduated" : "bonding",
    progressPct: round(progressPct),
    virtualTokenReserves: c.virtualTokenReserves.toString(),
    virtualSolReserves: c.virtualSolReserves.toString(),
    realTokenReserves: c.realTokenReserves.toString(),
    realSolReserves: c.realSolReserves.toString(),
    tokenTotalSupply: c.tokenTotalSupply.toString(),
    priceSolPerToken,
    marketCapSol: round(priceSolPerToken * totalSupply),
  };
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
