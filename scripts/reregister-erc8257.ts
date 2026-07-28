/**
 * Plan B (2026-07-02): OpenSea hat Tool #55 nie initial indexiert (Registrierung am
 * 06-30 traf auf falschen Hash + 406-Endpoint; updateToolMetadata-Events nehmen keine
 * neuen Tools in den Index auf). Ein frisches ToolRegistered-Event ist der einzige
 * nachweisliche Erst-Aufnahme-Trigger (so kamen SwarmSkill #25 / AgentRoom #41 rein).
 *
 * Ablauf in EINEM Lauf (Zwischenzustand ohne Normies-Gate kurz halten):
 *   1. deregisterTool(55)                                  — alte, tote Registrierung weg
 *   2. registerTool(ai-tool-URI, HASH, ERC721Predicate)    — neue toolId aus Event
 *   3. setCollections(neueId, [Normies])                   — Gate scharf
 *
 * Env: PRIVATE_KEY (creator 0xbC5C…), optional ETH_RPC_URL, DRY_RUN=true.
 * Run: PRIVATE_KEY=0x… npx tsx scripts/reregister-erc8257.ts
 */
import { createPublicClient, createWalletClient, http, parseAbi, parseEventLogs, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const PREDICATE = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const NORMIES = "0x9Eb6E2025B64f340691e424b7fe7022fFDE12438" as const;
// Runde 6 (2026-07-02): #64 (same-domain, statisch, kein Redirect) wurde ebenfalls nicht
// aufgenommen → These: OpenSea bindet eine DOMAIN an ein Tool, und crypto-knowledge-eight
// hängt noch an der toten Erst-Registrierung #55 (Duplikat-Verwerfung; vgl. #57/#58 wo bei
// gleicher Domain nur eines überlebte). Frische Projekt-Domain crypto-knowledge-mcp.vercel.app
// (gleiches Vercel-Projekt/Server) für Manifest+endpoint+image, Manifest v0.2.2 statisch.
const OLD_TOOL_ID = 64n;
const URI = "https://crypto-knowledge-mcp.vercel.app/.well-known/ai-tool/crypto-knowledge.json";
// tool-sdk@latest-Hash des Live-Manifests v0.2.2, live verifiziert 2026-07-02.
const HASH = "0x1562cdc089daeaa6f85f78d372be3dfa46b4db2ddf9dacb454ba88bd07d53477" as Hex;

const REGISTRY_ABI = parseAbi([
  "function deregisterTool(uint256 toolId)",
  "function registerTool(string metadataURI, bytes32 manifestHash, address accessPredicate) returns (uint256 toolId)",
  "event ToolRegistered(uint256 indexed toolId, address indexed creator, address indexed accessPredicate, string metadataURI, bytes32 manifestHash)",
]);
const PREDICATE_ABI = parseAbi(["function setCollections(uint256 toolId, address[] collections)"]);

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  const dryRun = process.env.DRY_RUN === "true";
  if (!pk) throw new Error("PRIVATE_KEY required (creator wallet)");

  const account = privateKeyToAccount(pk);
  const rpc = process.env.ETH_RPC_URL ?? "https://ethereum.publicnode.com";
  const pub = createPublicClient({ chain: mainnet, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain: mainnet, transport: http(rpc) });

  console.log(`creator:  ${account.address}`);
  console.log(`registry: ${REGISTRY}`);
  console.log(`uri:      ${URI}`);
  console.log(`hash:     ${HASH}`);
  const bal = await pub.getBalance({ address: account.address });
  console.log(`balance:  ${Number(bal) / 1e18} ETH`);

  if (dryRun) { console.log("\nDRY_RUN=true — nichts gesendet."); return; }

  console.log(`\n[1/3] deregisterTool(${OLD_TOOL_ID}) …`);
  const tx1 = await wallet.writeContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "deregisterTool", args: [OLD_TOOL_ID] });
  const r1 = await pub.waitForTransactionReceipt({ hash: tx1 });
  console.log(`  tx ${tx1}  block ${r1.blockNumber}  ${r1.status}`);
  if (r1.status !== "success") throw new Error("deregister failed — Abbruch");

  console.log(`[2/3] registerTool(…) …`);
  const tx2 = await wallet.writeContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "registerTool", args: [URI, HASH, PREDICATE] });
  const r2 = await pub.waitForTransactionReceipt({ hash: tx2 });
  console.log(`  tx ${tx2}  block ${r2.blockNumber}  ${r2.status}`);
  if (r2.status !== "success") throw new Error("register failed — Abbruch");
  const events = parseEventLogs({ abi: REGISTRY_ABI, eventName: "ToolRegistered", logs: r2.logs });
  const toolId = (events[0]?.args as { toolId?: bigint } | undefined)?.toolId;
  if (toolId === undefined) throw new Error("ToolRegistered-Event nicht gefunden — toolId unbekannt, setCollections manuell nachziehen!");
  console.log(`  ✅ neue toolId: #${toolId}`);

  console.log(`[3/3] setCollections(${toolId}, [Normies]) …`);
  const tx3 = await wallet.writeContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "setCollections", args: [toolId, [NORMIES]] });
  const r3 = await pub.waitForTransactionReceipt({ hash: tx3 });
  console.log(`  tx ${tx3}  block ${r3.blockNumber}  ${r3.status}`);

  console.log(`\n✅ Fertig. Neue kanonische URL: https://opensea.io/tools/erc8257/ethereum/${toolId}`);
}

main().catch((e) => { console.error("re-register failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
