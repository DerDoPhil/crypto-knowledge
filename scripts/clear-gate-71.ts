/**
 * Remove the Normies NFT gate from tool #71 by clearing the predicate's collections.
 * Product decision (Philipp, 2026-07-14): the tool is pure x402 pay-per-call, no NFT gate.
 *
 * Reads getCollections/getRequirements first, then setCollections(71, []) to empty it,
 * then re-reads to confirm. Env: PRIVATE_KEY (creator #2), optional ETH_RPC_URL, DRY_RUN.
 */
import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const PREDICATE = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const TOOL_ID = 71n;

const ABI = parseAbi([
  "function setCollections(uint256 toolId, address[] collections)",
  "function getCollections(uint256 toolId) view returns (address[])",
  "function getRequirements(uint256 toolId) view returns ((bytes4 kind, bytes data, string label)[] requirements, uint8 logic)",
]);

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  const dryRun = process.env.DRY_RUN === "true";
  if (!pk) throw new Error("PRIVATE_KEY required");

  const account = privateKeyToAccount(pk);
  const rpc = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
  const pub = createPublicClient({ chain: mainnet, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain: mainnet, transport: http(rpc) });

  console.log(`creator:   ${account.address}`);
  console.log(`predicate: ${PREDICATE}  tool #${TOOL_ID}`);

  const before = (await pub.readContract({ address: PREDICATE, abi: ABI, functionName: "getCollections", args: [TOOL_ID] })) as string[];
  console.log(`collections BEFORE: [${before.join(", ") || "∅ empty"}]`);
  if (before.length === 0) { console.log("already empty — nothing to do."); return; }

  if (dryRun) { console.log("DRY_RUN=true — not sending."); return; }

  const bal = await pub.getBalance({ address: account.address });
  console.log(`balance:   ${Number(bal) / 1e18} ETH`);

  const hash = await wallet.writeContract({ address: PREDICATE, abi: ABI, functionName: "setCollections", args: [TOOL_ID, []] });
  console.log(`\ntx sent: ${hash}`);
  const receipt = await pub.waitForTransactionReceipt({ hash });
  console.log(`mined block ${receipt.blockNumber}  status ${receipt.status}`);

  const after = (await pub.readContract({ address: PREDICATE, abi: ABI, functionName: "getCollections", args: [TOOL_ID] })) as string[];
  console.log(`collections AFTER:  [${after.join(", ") || "∅ empty"}]`);
  process.exit(receipt.status === "success" && after.length === 0 ? 0 : 1);
}

main().catch((e) => { console.error("clear-gate failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
