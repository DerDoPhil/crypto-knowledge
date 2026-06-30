/**
 * Crypto-Knowledge — ERC-8257 On-Chain Registration (OpenSea Agent Tools)
 *
 * Registers Crypto-Knowledge on the canonical ToolRegistry so it appears on
 * OpenSea among your developer tools (next to SwarmSkill / AgentRoom). Modeled
 * on SwarmSkill's scripts/register.ts.
 *
 * ⚠️ YOU run this — it signs an on-chain tx with YOUR wallet and pays gas.
 *    Claude does not execute this.
 *
 * Canonical addresses (same CREATE2 on every chain):
 *   ToolRegistry         0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1
 *   ERC721OwnerPredicate 0xc8721c9A776958FfFfEb602DA1b708bf1D318379
 *   Normies NFT (mainnet)0x9Eb6E2025B64f340691e424b7fe7022fFDE12438
 *
 * Prereqs:
 *   1. Manifest live:  https://crypto-knowledge-eight.vercel.app/.well-known/erc8257-manifest.json
 *   2. Authoritative hash (JCS-canonicalized, schema-validated — NOT naive keccak):
 *        curl -s <manifest-url> -o /tmp/m.json
 *        npx @opensea/tool-sdk validate /tmp/m.json
 *        npx @opensea/tool-sdk hash /tmp/m.json      # → 0x... (32 bytes)
 *   3. Fund the creator wallet with a little gas (~0.002 ETH on Base).
 *
 * Run (Base, cheapest; same creator address as your other tools):
 *   MANIFEST_HASH=0x... \
 *   PRIVATE_KEY=0x<creator-wallet-key> \
 *   REGISTER_NETWORK=base \
 *   ACCESS=normies \
 *   DRY_RUN=true \
 *   npx tsx scripts/register-erc8257.ts
 *
 *   (set DRY_RUN=false to actually send. ACCESS=open registers with no NFT gate.)
 */
import { createPublicClient, createWalletClient, http, parseAbi, zeroAddress, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, mainnet } from "viem/chains";

const TOOL_REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const ERC721_PREDICATE = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const NORMIES_NFT = "0x9Eb6E2025B64f340691e424b7fe7022fFDE12438" as const;
const MANIFEST_URL = "https://crypto-knowledge-eight.vercel.app/.well-known/erc8257-manifest.json";

const REGISTRY_ABI = parseAbi([
  "function registerTool(string metadataURI, bytes32 manifestHash, address accessPredicate) returns (uint256 toolId)",
  "function toolCount() view returns (uint256)",
  "event ToolRegistered(uint256 indexed toolId, address indexed creator, address indexed accessPredicate, string metadataURI, bytes32 manifestHash)",
]);
const PREDICATE_ABI = parseAbi(["function configure(uint256 toolId, address[] collections)"]);

const NETWORKS = { base, mainnet } as const;

async function main() {
  const net = (process.env.REGISTER_NETWORK ?? "base") as keyof typeof NETWORKS;
  const access = (process.env.ACCESS ?? "normies").toLowerCase();
  const dryRun = process.env.DRY_RUN !== "false";
  const manifestHash = process.env.MANIFEST_HASH as Hex | undefined;
  const pk = process.env.PRIVATE_KEY as Hex | undefined;

  const chain = NETWORKS[net];
  if (!chain) throw new Error(`REGISTER_NETWORK must be 'base' or 'mainnet', got '${net}'`);
  if (!manifestHash || !/^0x[0-9a-fA-F]{64}$/.test(manifestHash)) {
    throw new Error("MANIFEST_HASH (0x + 64 hex) required — get it via: npx @opensea/tool-sdk hash /tmp/m.json");
  }
  if (!pk) throw new Error("PRIVATE_KEY required (your creator wallet — same address as your other OpenSea tools)");

  const account = privateKeyToAccount(pk);
  const rpc = net === "base" ? process.env.BASE_RPC_URL ?? "https://mainnet.base.org" : process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
  const publicClient = createPublicClient({ chain, transport: http(rpc) });
  const walletClient = createWalletClient({ account, chain, transport: http(rpc) });
  const accessPredicate = access === "normies" ? ERC721_PREDICATE : zeroAddress;

  console.log("── Crypto-Knowledge ERC-8257 registration ──");
  console.log(`  network:        ${net} (chainId ${chain.id})`);
  console.log(`  creator:        ${account.address}`);
  console.log(`  registry:       ${TOOL_REGISTRY}`);
  console.log(`  metadataURI:    ${MANIFEST_URL}`);
  console.log(`  manifestHash:   ${manifestHash}`);
  console.log(`  accessPredicate:${accessPredicate} (${access})`);

  const count = await publicClient.readContract({ address: TOOL_REGISTRY, abi: REGISTRY_ABI, functionName: "toolCount" });
  console.log(`  current toolCount on ${net}: ${count} → this tool will be #${count + 1n}`);

  if (dryRun) {
    console.log("\nDRY_RUN=true — nothing sent. Re-run with DRY_RUN=false to register on-chain.");
    return;
  }

  console.log("\nSending registerTool …");
  const hash = await walletClient.writeContract({
    address: TOOL_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: "registerTool",
    args: [MANIFEST_URL, manifestHash, accessPredicate],
  });
  console.log(`  tx: ${hash}`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  mined in block ${receipt.blockNumber}, status ${receipt.status}`);

  const toolId = count + 1n; // toolCount increments by one
  console.log(`\n✅ Registered as tool #${toolId} on ${net}.`);

  if (access === "normies") {
    console.log("Configuring Normies NFT gate …");
    const cfgHash = await walletClient.writeContract({
      address: ERC721_PREDICATE,
      abi: PREDICATE_ABI,
      functionName: "configure",
      args: [toolId, [NORMIES_NFT]],
    });
    await publicClient.waitForTransactionReceipt({ hash: cfgHash });
    console.log(`  predicate configured (tx ${cfgHash}).`);
  }

  console.log(`\nOpenSea: https://opensea.io/ (search your creator address ${account.address} / tool #${toolId})`);
}

main().catch((e) => {
  console.error("registration failed:", e.message ?? e);
  process.exit(1);
});
