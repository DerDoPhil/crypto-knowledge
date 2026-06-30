import { describe, expect, it } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";
import { decodeBase58, encodeBase58, findProgramAddressSync, isOnCurve } from "../src/solana/pubkey.js";

const PUMP = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const META = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

function mine(seeds: Uint8Array[], program: string): [string, number] {
  const { address, bump } = findProgramAddressSync(seeds, decodeBase58(program));
  return [encodeBase58(address), bump];
}
const enc = (s: string) => new TextEncoder().encode(s);

const mints = [
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "So11111111111111111111111111111111111111112",
  ...Array.from({ length: 6 }, () => Keypair.generate().publicKey.toBase58()),
];

describe("findProgramAddressSync matches @solana/web3.js", () => {
  for (const m of mints) {
    it(`bonding-curve PDA for ${m.slice(0, 8)}…`, () => {
      const [refPk, refBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("bonding-curve"), new PublicKey(m).toBuffer()],
        new PublicKey(PUMP),
      );
      const [myPk, myBump] = mine([enc("bonding-curve"), decodeBase58(m)], PUMP);
      expect(myPk).toBe(refPk.toBase58());
      expect(myBump).toBe(refBump);
    });

    it(`metadata PDA for ${m.slice(0, 8)}…`, () => {
      const [refPk] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), new PublicKey(META).toBuffer(), new PublicKey(m).toBuffer()],
        new PublicKey(META),
      );
      const [myPk] = mine([enc("metadata"), decodeBase58(META), decodeBase58(m)], META);
      expect(myPk).toBe(refPk.toBase58());
    });
  }

  it("isOnCurve agrees with PublicKey.isOnCurve on random 32-byte values", () => {
    for (let i = 0; i < 30; i++) {
      const bytes = Keypair.generate().publicKey.toBytes(); // valid pubkeys are usually on-curve
      expect(isOnCurve(bytes)).toBe(PublicKey.isOnCurve(bytes));
    }
  });
});
