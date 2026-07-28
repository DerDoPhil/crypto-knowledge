/**
 * End-to-end live check against public endpoints (no keys required).
 * Run: npx tsx scripts/livecheck.ts
 */
import { encodeFunctionData, parseAbi } from "viem";
import { loadOperatorConfig } from "../src/config.js";
import { getBalances } from "../src/modules/portfolio/balances.js";
import { valuateBalances } from "../src/modules/portfolio/prices.js";
import { fetchGoPlus } from "../src/modules/security/goplus.js";
import { scoreToken } from "../src/modules/security/score.js";
import { getRoute as lifiRoute } from "../src/modules/routing/lifi.js";
import { getRoute as dlnRoute } from "../src/modules/routing/debridge.js";
import { getJupiterQuote } from "../src/modules/jupiter/swap.js";
import { simulateTx } from "../src/modules/simulate/simulate.js";
import { lookupSelector, abiFromSignature } from "../src/modules/abi/fourbyte.js";
import { decodeCalldata } from "../src/modules/abi/decoder.js";

const op = loadOperatorConfig();
const caller = { providerMode: "open" as const };
const VITALIK = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
let pass = 0;
let total = 0;

async function check(label: string, fn: () => Promise<string>) {
  total++;
  try {
    const out = await fn();
    pass++;
    console.log(`✓ ${label}: ${out}`);
  } catch (e) {
    console.log(`✗ ${label}: ${(e as Error).message}`);
  }
}

async function main() {
  console.log("=== Crypto-Knowledge live self-check (public endpoints) ===\n");

  await check("portfolio+USD", async () => {
    const r = await getBalances(["ethereum"], VITALIK, undefined, caller, op);
    const usd = await valuateBalances(r.balances);
    return `${r.balances[0]!.native.human} ETH = $${r.balances[0]!.native.usd} | total $${usd}`;
  });

  await check("security (GoPlus)", async () => {
    const s = scoreToken(await fetchGoPlus("ethereum", USDC));
    return `USDC verdict=${s.verdict} score=${s.riskScore}`;
  });

  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  await check("route LiFi (ETH→Base USDC)", async () => {
    const r = await lifiRoute(
      { fromChain: "ethereum", toChain: "base", fromToken: "native", toToken: USDC_BASE, amount: "50000000000000000", fromAddress: VITALIK },
      op,
    );
    return `${r.aggregator} out~${(Number(r.estimatedOut.raw) / 1e6).toFixed(2)} USDC fees=$${r.fees.totalUsd}`;
  });

  await check("route deBridge (ETH→Base USDC)", async () => {
    const r = await dlnRoute({
      fromChain: "ethereum",
      toChain: "base",
      fromToken: "native",
      toToken: USDC_BASE,
      amount: "50000000000000000",
      fromAddress: VITALIK,
      toAddress: VITALIK,
    });
    return `${r.aggregator} out~${(Number(r.estimatedOut.raw) / 1e6).toFixed(2)} USDC`;
  });

  await check("solana_swap (Jupiter 1 SOL→USDC)", async () => {
    const q = await getJupiterQuote("SOL", "USDC", "1000000000", 50);
    return `1 SOL → ${(Number(q.outAmount) / 1e6).toFixed(2)} USDC`;
  });

  await check("simulate revert decode", async () => {
    const data = encodeFunctionData({ abi: parseAbi(["function transfer(address,uint256)"]), functionName: "transfer", args: ["0x0000000000000000000000000000000000000002", 100000000000n] });
    const r = await simulateTx("ethereum", { from: "0x0000000000000000000000000000000000000001", to: USDC, data }, caller, op);
    return `willRevert=${r.willRevert} reason="${r.revertReason}"`;
  });

  await check("abi 4byte decode (unverified)", async () => {
    const sigs = await lookupSelector("0xa9059cbb");
    const d = decodeCalldata(abiFromSignature(sigs[0]!), "0xa9059cbb0000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000007b");
    return `${d.function} via 4byte (${sigs.length} candidates)`;
  });

  console.log(`\n=== ${pass}/${total} live checks passed ===`);
  process.exit(pass === total ? 0 : 1);
}

main();
