/** Live on-chain check against public endpoints (no keys). Best-effort. */
import { loadOperatorConfig } from "../src/config.js";
import { getBalances } from "../src/modules/portfolio/balances.js";
import { fetchGoPlus } from "../src/modules/security/goplus.js";
import { scoreToken } from "../src/modules/security/score.js";
import { getAbiBundle } from "../src/modules/abi/explorer.js";

const op = loadOperatorConfig();
const caller = { providerMode: "open" as const };
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

async function run(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.log(`  ${label}: ERROR ${(e as Error).message}`);
  }
}

async function main() {
  console.log("LIVE CHECK (public endpoints):");

  await run("balances", async () => {
    const r = await getBalances(["ethereum"], "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", { ethereum: [USDC] }, caller, op);
    const eth = r.balances[0]!.native;
    console.log(`  balances: ETH native of vitalik.eth = ${eth.human} ETH (raw ${eth.raw})`);
  });

  await run("security", async () => {
    const g = await fetchGoPlus("ethereum", USDC);
    const s = scoreToken(g);
    console.log(`  security: USDC verdict=${s.verdict} score=${s.riskScore} honeypot=${s.checks.honeypot.isHoneypot}`);
  });

  await run("abi", async () => {
    const b = await getAbiBundle("ethereum", USDC, op);
    console.log(`  abi: USDC verified=${b.verified} source=${b.source} proxy=${b.isProxy} name=${b.contractName}`);
  });

  console.log("LIVE CHECK done.");
}

main();
