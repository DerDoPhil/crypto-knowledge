/**
 * Re-gate ERC-8257 tool #71 (Crypto-Knowledge, Ethereum Mainnet) on Auditors
 * instead of the old, removed-2026-07-14 Normies collection, and sync the
 * on-chain manifest hash to the freshly-deployed manifest in the same run.
 *
 * ⚠️ YOU run this — it signs on-chain txs with the tool-creator-#2 wallet and
 *    pays gas. Claude does not execute this. Key in the Vault:
 *    ChainTrade Secrets.md § "Crypto-Knowledge Tool-Creator #2"
 *    (creator address 0x6f352a029e7a03b12bf0e12d925d51eb494a4bdc).
 *
 * Prereqs (in order):
 *   1. Deploy the edited manifest (git push → Vercel auto-deploy) so the LIVE
 *      file at https://crypto-knowledge-mcp.vercel.app/.well-known/ai-tool/crypto-knowledge.json
 *      matches public/.well-known/ai-tool/crypto-knowledge.json in this repo.
 *   2. Compute the authoritative hash from the LIVE file (not the local one):
 *        curl -s https://crypto-knowledge-mcp.vercel.app/.well-known/ai-tool/crypto-knowledge.json -o /tmp/m.json
 *        npx @opensea/tool-sdk validate /tmp/m.json
 *        npx @opensea/tool-sdk hash /tmp/m.json      # → 0x... (32 bytes)
 *   3. Fund 0x6f352a029e7a03b12bf0e12d925d51eb494a4bdc with a little ETH on Mainnet.
 *
 * Run (dry-run first, always):
 *   PRIVATE_KEY=0x<creator-#2-key> NEW_HASH=0x... DRY_RUN=true npx tsx scripts/set-gate-71-auditors.ts
 *   # then DRY_RUN=false to actually send both transactions.
 */
import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const PREDICATE = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const AUDITORS_NFT = "0xa0d2B2Fe20f27bF6bfA1971d41F8B7bF7B3111e6" as const;
const TOOL_ID = 71n;
const URI = "https://crypto-knowledge-mcp.vercel.app/.well-known/ai-tool/crypto-knowledge.json";

const REGISTRY_ABI = parseAbi(["function updateToolMetadata(uint256 toolId, string metadataUrl, bytes32 manifestHash)"]);
const PREDICATE_ABI = parseAbi([
  "function setCollections(uint256 toolId, address[] collections)",
  "function getCollections(uint256 toolId) view returns (address[])",
]);

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  const newHash = process.env.NEW_HASH as Hex | undefined;
  const dryRun = process.env.DRY_RUN !== "false";
  if (!pk) throw new Error("PRIVATE_KEY required (tool-creator #2 — see header comment)");
  if (!newHash || !/^0x[0-9a-fA-F]{64}$/.test(newHash)) {
    throw new Error("NEW_HASH (0x+64 hex) required — hash the LIVE deployed manifest first, see header comment.");
  }

  const account = privateKeyToAccount(pk);
  const rpc = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
  const pub = createPublicClient({ chain: mainnet, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain: mainnet, transport: http(rpc) });

  console.log(`creator:   ${account.address}`);
  console.log(`tool:      #${TOOL_ID} on Ethereum Mainnet`);
  console.log(`new gate:  Auditors NFT (${AUDITORS_NFT})`);
  console.log(`new hash:  ${newHash}`);

  const before = (await pub.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "getCollections", args: [TOOL_ID] })) as string[];
  console.log(`collections BEFORE: [${before.join(", ") || "∅ empty"}]`);

  if (dryRun) {
    console.log("\nDRY_RUN=true — nothing sent. Re-run with DRY_RUN=false to execute both transactions.");
    return;
  }

  const bal = await pub.getBalance({ address: account.address });
  console.log(`balance: ${Number(bal) / 1e18} ETH`);

  console.log("\n1/2 — setCollections(71, [Auditors]) …");
  const gateHash = await wallet.writeContract({
    address: PREDICATE,
    abi: PREDICATE_ABI,
    functionName: "setCollections",
    args: [TOOL_ID, [AUDITORS_NFT]],
  });
  console.log(`  tx: ${gateHash}`);
  await pub.waitForTransactionReceipt({ hash: gateHash });
  console.log("  confirmed.");

  console.log("\n2/2 — updateToolMetadata(71, uri, newHash) …");
  const metaHash = await wallet.writeContract({
    address: REGISTRY,
    abi: REGISTRY_ABI,
    functionName: "updateToolMetadata",
    args: [TOOL_ID, URI, newHash],
  });
  console.log(`  tx: ${metaHash}`);
  const receipt = await pub.waitForTransactionReceipt({ hash: metaHash });
  console.log(`  confirmed in block ${receipt.blockNumber}, status ${receipt.status}`);

  const after = (await pub.readContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "getCollections", args: [TOOL_ID] })) as string[];
  console.log(`\ncollections AFTER: [${after.join(", ")}]`);
  console.log(`\n✅ Tool #71 is now gated on Auditors. Verify on OpenSea: https://opensea.io/tools/erc8257/ethereum/71`);
}

main().catch((e) => {
  console.error("failed:", e.shortMessage ?? e.message ?? e);
  process.exit(1);
});
