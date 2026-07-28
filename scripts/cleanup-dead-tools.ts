/**
 * Aufräumen nach dem Registrierungs-Marathon (2026-07-02/03): deregistriert die toten,
 * nie von OpenSea aufgenommenen Registrierungen. #59/#60/#62/#63/#64 wurden bereits in
 * den Reregister-Runden entfernt; übrig sind #65 (Creator 1 = 0xbC5C…) und #66/#67/#68
 * (Creator 2 = 0x6f35…). Nur der jeweilige Creator darf deregistrieren.
 *
 * Run: PRIVATE_KEY=0x<key> TOOL_IDS=66,67,68 npx tsx scripts/cleanup-dead-tools.ts
 */
import { createPublicClient, createWalletClient, http, parseAbi, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const ABI = parseAbi(["function deregisterTool(uint256 toolId)"]);

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  const ids = (process.env.TOOL_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean).map(BigInt);
  if (!pk) throw new Error("PRIVATE_KEY required");
  if (ids.length === 0) throw new Error("TOOL_IDS required (comma-separated)");

  const account = privateKeyToAccount(pk);
  const rpc = process.env.ETH_RPC_URL ?? "https://ethereum.publicnode.com";
  const pub = createPublicClient({ chain: mainnet, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain: mainnet, transport: http(rpc) });

  console.log(`creator: ${account.address}`);
  console.log(`balance: ${Number(await pub.getBalance({ address: account.address })) / 1e18} ETH`);

  for (const id of ids) {
    try {
      const tx = await wallet.writeContract({ address: REGISTRY, abi: ABI, functionName: "deregisterTool", args: [id] });
      const r = await pub.waitForTransactionReceipt({ hash: tx });
      console.log(`deregisterTool(${id}): tx ${tx}  block ${r.blockNumber}  ${r.status}`);
    } catch (e: any) {
      console.log(`deregisterTool(${id}) FAILED: ${(e.shortMessage ?? e.message ?? "").slice(0, 100)}`);
    }
  }
}

main().catch((e) => { console.error("cleanup failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
