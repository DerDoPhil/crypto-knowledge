/**
 * Read-only diagnostic for ERC-8257 tool #71 (Crypto-Knowledge, Ethereum Mainnet).
 * Prints the live manifest URL + access-predicate config. No key, no writes.
 *
 * getToolConfig's return type isn't a plain ABI-decodable `bytes` in practice
 * (viem's decoder throws "not in safe integer range" on it) — read it with a
 * raw eth_call and grep the URL out of the blob instead, same trick as the
 * original diag-onchain.ts intended but never actually got past this bug.
 *
 * Run: npx tsx scripts/diag-71.ts
 */
import { createPublicClient, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const PREDICATE = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const TOOL_ID = 71n;

const PREDICATE_ABI = parseAbi([
  "function getCollections(uint256 toolId) view returns (address[])",
  "function getRequirements(uint256 toolId) view returns ((bytes4 kind, bytes data, string label)[] requirements, uint8 logic)",
]);

const rpc = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const client = createPublicClient({ chain: mainnet, transport: http(rpc) });

async function main() {
  const selector = "0xa0178453"; // getToolConfig(uint256)
  const data = (selector + TOOL_ID.toString(16).padStart(64, "0")) as `0x${string}`;
  const raw = await client.request({ method: "eth_call", params: [{ to: REGISTRY, data }, "latest"] });
  const bytes = Buffer.from((raw as string).slice(2), "hex");
  console.log("raw bytes length:", bytes.length);
  const urlMatch = bytes.toString("latin1").match(/https?:\/\/[^\x00-\x1f"]+/);
  console.log("URL in config:", urlMatch ? urlMatch[0] : "(none found)");

  const cols = await client.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "getCollections", args: [TOOL_ID] });
  console.log("predicate.getCollections:", cols);
  const [reqs, logic] = (await client.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "getRequirements", args: [TOOL_ID] })) as any;
  console.log("predicate.getRequirements:", reqs.length, "logic=", logic === 0 ? "AND" : "OR");
  for (const r of reqs) console.log("  -", r.kind, r.label, r.data);
}

main().catch((e) => { console.error(e); process.exit(1); });
