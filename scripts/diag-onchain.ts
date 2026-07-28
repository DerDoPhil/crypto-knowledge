/**
 * Read-only ERC-8257 on-chain diagnostic.
 * Compares tool #55 (crypto-knowledge, NOT showing on OpenSea) against
 * tool #25 (SwarmSkill, WORKING) on Ethereum mainnet — hash, URI, predicate.
 * No key, no writes.
 *
 * Run: npx tsx scripts/diag-onchain.ts
 */
import { createPublicClient, http, parseAbi, decodeAbiParameters, hexToString, type Hex } from "viem";
import { mainnet } from "viem/chains";

const REGISTRY   = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const PREDICATE  = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const NORMIES    = "0x9Eb6E2025B64f340691e424b7fe7022fFDE12438";
const LIVE_HASH  = "0x3660dcb14c0024de971b60558a2fa9bb9d070ea6a38219821a1bb02ef5989f32";
const CK_URL     = "https://crypto-knowledge-eight.vercel.app/.well-known/erc8257-manifest.json";

const REGISTRY_ABI = parseAbi([
  "function getToolConfig(uint256 toolId) view returns (bytes)",
  "function toolCount() view returns (uint256)",
]);
const PREDICATE_ABI = parseAbi([
  "function getCollections(uint256 toolId) view returns (address[])",
  "function getRequirements(uint256 toolId) view returns ((bytes4 kind, bytes data, string label)[] requirements, uint8 logic)",
  "function hasAccess(uint256 toolId, address who, bytes data) view returns (bool)",
]);

const rpc = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const client = createPublicClient({ chain: mainnet, transport: http(rpc) });

function asciiHex(s: string): string {
  return Buffer.from(s, "utf8").toString("hex").toLowerCase();
}

async function dumpTool(id: bigint, label: string) {
  console.log(`\n════════ TOOL #${id} (${label}) ════════`);
  let raw: Hex;
  try {
    raw = await client.readContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "getToolConfig", args: [id] });
  } catch (e: any) {
    console.log(`  getToolConfig REVERTED: ${e.shortMessage ?? e.message}`);
    return;
  }
  console.log(`  getToolConfig raw length: ${(raw.length - 2) / 2} bytes`);
  const low = raw.toLowerCase();
  // Try to extract readable URL from the blob
  const urlMatch = Buffer.from(low.slice(2), "hex").toString("latin1").match(/https?:\/\/[^\x00-\x1f"]+/);
  console.log(`  URL in config:  ${urlMatch ? urlMatch[0] : "(none found)"}`);
  console.log(`  contains LIVE hash 0x3660…f32 ? ${low.includes(LIVE_HASH.slice(2)) ? "✅ YES" : "❌ NO"}`);
  // Predicate reads
  try {
    const cols = await client.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "getCollections", args: [id] });
    console.log(`  predicate.getCollections: [${(cols as string[]).join(", ") || "∅ EMPTY"}]`);
  } catch (e: any) { console.log(`  predicate.getCollections: n/a (${e.shortMessage ?? e.message})`); }
  try {
    const [reqs, logic] = await client.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "getRequirements", args: [id] }) as any;
    console.log(`  predicate.getRequirements: ${reqs.length} req(s), logic=${logic === 0 ? "AND" : "OR"}`);
    for (const r of reqs) console.log(`     - kind=${r.kind} label="${(r.label || "").slice(0, 60)}" data=${r.data.slice(0, 66)}`);
  } catch (e: any) { console.log(`  predicate.getRequirements: n/a (${e.shortMessage ?? e.message})`); }
  try {
    const acc = await client.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "hasAccess", args: [id, "0x000000000000000000000000000000000000dEaD", "0x"] });
    console.log(`  predicate.hasAccess(0xdead, non-holder): ${acc}`);
  } catch (e: any) { console.log(`  predicate.hasAccess: n/a (${e.shortMessage ?? e.message})`); }
}

async function main() {
  console.log(`RPC: ${rpc}`);
  await dumpTool(25n, "SwarmSkill — WORKING");
  await dumpTool(55n, "Crypto-Knowledge — NOT SHOWING");
}

main().catch((e) => { console.error("diag failed:", e.message ?? e); process.exit(1); });
