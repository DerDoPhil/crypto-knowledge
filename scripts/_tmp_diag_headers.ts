/**
 * READ-ONLY (kein Key): on-chain getToolConfig-Blob für #71 + #25 roh auslesen,
 * metadataURI (latin1-regex) + alle 32-Byte-Wörter dumpen. Temporär.
 */
import { createPublicClient, http, parseAbi, type Hex } from "viem";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const REGISTRY_ABI = parseAbi(["function getToolConfig(uint256 toolId) view returns (bytes)"]);
const rpc = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const client = createPublicClient({ chain: mainnet, transport: http(rpc) });

async function dump(id: bigint, label: string) {
  console.log(`\n════════ TOOL #${id} (${label}) ════════`);
  const raw = await client.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getToolConfig", args: [id] }) as Hex;
  const hex = raw.slice(2);
  console.log(`  raw bytes: ${hex.length / 2}`);
  const latin1 = Buffer.from(hex, "hex").toString("latin1");
  const url = latin1.match(/https?:\/\/[^\x00-\x1f"]+/);
  console.log(`  metadataURI: ${url ? url[0] : "(none found)"}`);
  // 32-Byte-Wörter, die wie ein manifestHash aussehen (nicht 0, nicht offset/adresse)
  console.log(`  candidate 32-byte words (potential manifestHash):`);
  for (let i = 0; i + 64 <= hex.length; i += 64) {
    const w = hex.slice(i, i + 64);
    const nonZero = /[^0]/.test(w);
    const looksAddr = /^0{24}[0-9a-f]{40}$/.test(w);            // 20-byte rechtsbündig = Adresse
    const smallInt = /^0{56}[0-9a-f]{8}$/.test(w);              // kleine Zahl = Länge/Offset
    if (nonZero && !looksAddr && !smallInt) console.log(`     word@${i / 64}: 0x${w}`);
  }
}

async function main() {
  console.log(`RPC: ${rpc}`);
  await dump(71n, "Crypto-Knowledge");
  await dump(25n, "SwarmSkill");
}
main().catch((e) => { console.error("diag failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
