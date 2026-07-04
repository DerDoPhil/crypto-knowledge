/**
 * READ-ONLY (kein Key, keine tx): aktuellen on-chain metadataURI + manifestHash
 * für Tool #71 (Crypto-Knowledge) und #25 (SwarmSkill) auslesen.
 * Temporär — wird nach dem Lauf wieder gelöscht.
 */
import { createPublicClient, http, parseAbi, decodeAbiParameters, type Hex } from "viem";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const REGISTRY_ABI = parseAbi(["function getToolConfig(uint256 toolId) view returns (bytes)"]);
const rpc = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const client = createPublicClient({ chain: mainnet, transport: http(rpc) });

async function dump(id: bigint, label: string) {
  console.log(`\n════════ TOOL #${id} (${label}) ════════`);
  const raw = await client.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getToolConfig", args: [id] }) as Hex;
  console.log(`  raw bytes: ${(raw.length - 2) / 2}`);
  // Versuch 1: (string metadataURI, bytes32 manifestHash, address predicate)
  const attempts: Array<[string, readonly { type: string }[]]> = [
    ["(string,bytes32,address)", [{ type: "string" }, { type: "bytes32" }, { type: "address" }]],
    ["(address,string,bytes32,address)", [{ type: "address" }, { type: "string" }, { type: "bytes32" }, { type: "address" }]],
    ["(address,string,bytes32)", [{ type: "address" }, { type: "string" }, { type: "bytes32" }]],
  ];
  let decoded = false;
  for (const [sig, params] of attempts) {
    try {
      const out = decodeAbiParameters(params as any, raw);
      console.log(`  ✅ decoded as ${sig}:`);
      out.forEach((v, i) => console.log(`       [${i}] ${String(v)}`));
      decoded = true;
      break;
    } catch { /* next */ }
  }
  if (!decoded) {
    const latin1 = Buffer.from(raw.slice(2), "hex").toString("latin1");
    const url = latin1.match(/https?:\/\/[^\x00-\x1f"]+/);
    console.log(`  (ABI-decode fehlgeschlagen) URL per regex: ${url ? url[0] : "(none)"}`);
    console.log(`  raw hex: ${raw}`);
  }
}

async function main() {
  console.log(`RPC: ${rpc}`);
  await dump(71n, "Crypto-Knowledge");
  await dump(25n, "SwarmSkill");
}
main().catch((e) => { console.error("diag failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
