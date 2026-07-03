/**
 * updateToolMetadata for ERC-8257 tool #55 (crypto-knowledge) on Ethereum mainnet.
 * Syncs the on-chain manifest hash to the freshly-deployed manifest AND emits a
 * metadata-update event that forces OpenSea to re-fetch & re-index the tool.
 *
 * Env: PRIVATE_KEY (creator wallet), NEW_HASH (0x+64), optional ETH_RPC_URL, DRY_RUN.
 * Run: PRIVATE_KEY=0x… NEW_HASH=0x… npx tsx scripts/update-metadata.ts
 */
import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
// Seit 2026-07-03 ist das gelistete Tool #71 „Crypto-Knowledge" (das Chain-Brain,
// Creator #2 0x6f35… — PRIVATE_KEY aus Vault-Abschnitt „Tool-Creator #2" nehmen!).
// Manifest-Änderungen: Datei editieren → deploy → Hash via tool-sdk@latest → dieses Skript.
const TOOL_ID = 71n;
const URI = "https://crypto-knowledge-mcp.vercel.app/.well-known/ai-tool/crypto-knowledge.json";

const ABI = parseAbi([
  "function updateToolMetadata(uint256 toolId, string metadataUrl, bytes32 manifestHash)",
  "function getToolConfig(uint256 toolId) view returns (bytes)",
]);

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  const newHash = process.env.NEW_HASH as Hex | undefined;
  const dryRun = process.env.DRY_RUN === "true";
  if (!pk) throw new Error("PRIVATE_KEY required");
  if (!newHash || !/^0x[0-9a-fA-F]{64}$/.test(newHash)) throw new Error("NEW_HASH (0x+64 hex) required");

  const account = privateKeyToAccount(pk);
  const rpc = process.env.ETH_RPC_URL ?? "https://ethereum.publicnode.com";
  const pub = createPublicClient({ chain: mainnet, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain: mainnet, transport: http(rpc) });

  console.log(`creator:   ${account.address}`);
  console.log(`tool:      #${TOOL_ID}  registry ${REGISTRY}`);
  console.log(`uri:       ${URI}`);
  console.log(`new hash:  ${newHash}`);

  try {
    const before = await pub.readContract({ address: REGISTRY, abi: ABI, functionName: "getToolConfig", args: [TOOL_ID] });
    console.log(`on-chain already has new hash? ${(before as string).toLowerCase().includes(newHash.slice(2).toLowerCase()) ? "yes (nothing to do)" : "no — will update"}`);
  } catch (e: any) { console.log(`(pre-read skipped: ${e.shortMessage ?? e.message})`); }

  if (dryRun) { console.log("DRY_RUN=true — not sending."); return; }

  try {
    const bal = await pub.getBalance({ address: account.address });
    console.log(`balance:   ${Number(bal) / 1e18} ETH`);
  } catch { /* non-fatal */ }

  const hash = await wallet.writeContract({ address: REGISTRY, abi: ABI, functionName: "updateToolMetadata", args: [TOOL_ID, URI, newHash] });
  console.log(`\ntx sent: ${hash}`);
  const receipt = await pub.waitForTransactionReceipt({ hash });
  console.log(`mined block ${receipt.blockNumber}  status ${receipt.status}`);

  console.log(`\ntx confirmed. Verify on-chain hash separately via raw eth_call (viem read is flaky on public RPCs).`);
  process.exit(receipt.status === "success" ? 0 : 1);
}

main().catch((e) => { console.error("update failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
