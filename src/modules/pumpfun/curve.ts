import { Connection, PublicKey } from "@solana/web3.js";
import type { OperatorConfig } from "../../config.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { resolveSolanaRpc, type CallerConfig } from "../../core/providers.js";

export const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

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

/** Derive the bonding-curve PDA: seeds ["bonding-curve", mint]. */
export function bondingCurvePda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), mint.toBuffer()], PUMP_PROGRAM_ID);
  return pda;
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
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintStr);
  } catch {
    throw new CryptoKnowledgeError(ErrorCode.INVALID_INPUT, `invalid mint address '${mintStr}'`);
  }

  const { url } = resolveSolanaRpc(caller, op);
  const connection = new Connection(url, "confirmed");
  const curvePk = bondingCurvePda(mint);

  const account = await connection.getAccountInfo(curvePk);
  if (!account) {
    throw new CryptoKnowledgeError(ErrorCode.NOT_FOUND, `no bonding curve for ${mintStr} (not a pump.fun token or graduated)`);
  }

  const c = decodeCurve(account.data as Buffer);

  // price = (virtualSol / 1e9) / (virtualToken / 1e6)  — verified formula.
  const solReserves = Number(c.virtualSolReserves) / 1e9;
  const tokenReserves = Number(c.virtualTokenReserves) / 1e6;
  const priceSolPerToken = tokenReserves > 0 ? solReserves / tokenReserves : 0;
  const totalSupply = Number(c.tokenTotalSupply) / 1e6;

  const realSol = Number(c.realSolReserves) / 1e9;
  const progressPct = c.complete ? 100 : Math.min(100, (realSol / GRADUATION_SOL) * 100);

  return {
    mint: mintStr,
    bondingCurve: curvePk.toBase58(),
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
