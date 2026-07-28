/**
 * Runde 7 (2026-07-02): Registrierung mit FRISCHEM Creator-Wallet (0x6f352a02…, Key im
 * Vault: ChainTrade Secrets.md § "Crypto-Knowledge Tool-Creator #2"), weil das Haupt-Wallet
 * 0xbC5C… nach ~15 Registry-Events heute vermutlich vom OpenSea-Indexer als Spam geflaggt
 * ist. Kein deregister: #65 bleibt als A/B-Kontrolle stehen (kommt das neue Tool rein und
 * #65 nie, ist das Creator-Flag bewiesen). Manifest v0.2.3 auf onchain-brain-mcp.vercel.app
 * (Manifest+endpoint+image same-domain, statische Datei, kein Redirect).
 *
 * Run: PRIVATE_KEY=0x<creator2> npx tsx scripts/register-fresh.ts
 */
import { createPublicClient, createWalletClient, http, parseAbi, parseEventLogs, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;
const PREDICATE = "0xc8721c9A776958FfFfEb602DA1b708bf1D318379" as const;
const NORMIES = "0x9Eb6E2025B64f340691e424b7fe7022fFDE12438" as const;
// Runde 8 (2026-07-02, EIP-8257 origin-binding endlich verstanden): Der Manifest-Pfad MUSS
// /.well-known/ai-tool/<deriveSlug(name)>.json auf dem Endpoint-Origin sein, wobei
// deriveSlug = lowercase, \s+→"-", [^a-z0-9-] entfernt (tool-sdk cli.js). Alle 7 bisherigen
// Registrierungen hatten Slug≠Name. name jetzt "Crypto-Knowledge" → crypto-knowledge.json.
// Runde 10 (2026-07-03, nach OpenSea-Dev-Antwort): Die bisherigen Registrierungen wurden
// von OpenSeas SECURITY-CHECKS geflaggt, weil das Manifest ein Meta-Tool beschrieb
// (inputs = MCP tools/call-Passthrough = "a tool call to list tool calls"). Gewünschtes
// Muster: SEPARATE Tools pro Capability mit konkretem Schema. Erstes Tool:
// "Crypto-Knowledge Security" (Anti-Rug-Scanner) mit eigener REST-Route
// api/tools/security.ts (gleiches Holder/x402-Gate) und konkretem inputs-Schema.
// Runde 11 (2026-07-03, Philipps Richtungsentscheid): Fokus = CHAIN-BRAIN, nicht Security.
// Neues Tool "Crypto-Knowledge" (Wissens-Lookup: 18 Runbooks + 4 Referenz-Tabellen via
// api/tools/knowledge.ts, list_topics frei, Rest gated). Security-Listing #70 wird erst
// NACH erfolgreichem Listing des Brains deregistriert.
const URI = "https://crypto-knowledge-mcp.vercel.app/.well-known/ai-tool/crypto-knowledge.json";
const HASH = "0x324058c0b970812f21e1b3b297c0b7133188ce8a21cc3eddc51cab9c2a774c5c" as Hex;

const REGISTRY_ABI = parseAbi([
  "function registerTool(string metadataURI, bytes32 manifestHash, address accessPredicate) returns (uint256 toolId)",
  "event ToolRegistered(uint256 indexed toolId, address indexed creator, address indexed accessPredicate, string metadataURI, bytes32 manifestHash)",
]);
const PREDICATE_ABI = parseAbi(["function setCollections(uint256 toolId, address[] collections)"]);

async function main() {
  const pk = process.env.PRIVATE_KEY as Hex | undefined;
  if (!pk) throw new Error("PRIVATE_KEY required (creator #2)");
  const account = privateKeyToAccount(pk);
  const rpc = process.env.ETH_RPC_URL ?? "https://ethereum.publicnode.com";
  const pub = createPublicClient({ chain: mainnet, transport: http(rpc) });
  const wallet = createWalletClient({ account, chain: mainnet, transport: http(rpc) });

  console.log(`creator:  ${account.address}`);
  console.log(`uri:      ${URI}`);
  console.log(`hash:     ${HASH}`);
  const bal = await pub.getBalance({ address: account.address });
  console.log(`balance:  ${Number(bal) / 1e18} ETH`);

  console.log(`\n[1/2] registerTool(…) …`);
  const tx = await wallet.writeContract({ address: REGISTRY, abi: REGISTRY_ABI, functionName: "registerTool", args: [URI, HASH, PREDICATE] });
  const r = await pub.waitForTransactionReceipt({ hash: tx });
  console.log(`  tx ${tx}  block ${r.blockNumber}  ${r.status}`);
  if (r.status !== "success") throw new Error("register failed");
  const events = parseEventLogs({ abi: REGISTRY_ABI, eventName: "ToolRegistered", logs: r.logs });
  const toolId = (events[0]?.args as { toolId?: bigint } | undefined)?.toolId;
  if (toolId === undefined) throw new Error("ToolRegistered-Event fehlt");
  console.log(`  ✅ neue toolId: #${toolId}`);

  console.log(`[2/2] setCollections(${toolId}, [Normies]) …`);
  const tx2 = await wallet.writeContract({ address: PREDICATE, abi: PREDICATE_ABI, functionName: "setCollections", args: [toolId, [NORMIES]] });
  const r2 = await pub.waitForTransactionReceipt({ hash: tx2 });
  console.log(`  tx ${tx2}  block ${r2.blockNumber}  ${r2.status}`);

  console.log(`\n✅ Fertig: https://opensea.io/tools/erc8257/ethereum/${toolId}`);
}

main().catch((e) => { console.error("register failed:", e.shortMessage ?? e.message ?? e); process.exit(1); });
