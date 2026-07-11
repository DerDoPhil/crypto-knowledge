/** Block-82 live verification: Velodrome routers (OP) + HyperEVM precompile. Throwaway sweep script. */
import { createPublicClient, http, parseAbi } from "viem";

const op = createPublicClient({ transport: http("https://mainnet.optimism.io") });
const hyper = createPublicClient({ transport: http("https://rpc.hyperliquid.xyz/evm") });

const routerAbi = parseAbi([
  "function defaultFactory() view returns (address)",
  "function factory() view returns (address)",
  "function factoryRegistry() view returns (address)",
]);
const factoryAbi = parseAbi([
  "function allPoolsLength() view returns (uint256)",
  "function allPairsLength() view returns (uint256)",
]);

async function probeRouter(name: string, addr: `0x${string}`) {
  console.log(`--- ${name} ${addr}`);
  const code = await op.getCode({ address: addr });
  console.log(`  code: ${code ? code.length / 2 - 1 : 0} bytes`);
  if (!code || code === "0x") return;
  for (const fn of ["defaultFactory", "factory", "factoryRegistry"] as const) {
    try {
      const r = await op.readContract({ address: addr, abi: routerAbi, functionName: fn });
      console.log(`  ${fn}() = ${r}`);
      if (fn !== "factoryRegistry") {
        for (const lenFn of ["allPoolsLength", "allPairsLength"] as const) {
          try {
            const n = await op.readContract({ address: r as `0x${string}`, abi: factoryAbi, functionName: lenFn });
            console.log(`    factory.${lenFn}() = ${n}`);
          } catch { /* not this one */ }
        }
      }
    } catch { console.log(`  ${fn}() reverted/absent`); }
  }
}

async function main() {
  await probeRouter("Velodrome Router (etherscan label)", "0x9c12939390052919af3155f41bf4160fd3666a6f");
  await probeRouter("Velodrome Router (codeslaw label)", "0xa062ae8a9c5e11aaa026fc2670b0d65ccc8b2858");

  // HyperEVM read precompile: markPx(uint32) — try 0x...0806 with index 0
  for (const pc of ["0x0000000000000000000000000000000000000806", "0x0000000000000000000000000000000000000808"] as const) {
    try {
      const res = await hyper.call({ to: pc, data: "0x00000000000000000000000000000000000000000000000000000000000000" + "00" as `0x${string}` });
      console.log(`precompile ${pc} (32B zero input) →`, res.data);
    } catch (e: any) { console.log(`precompile ${pc} →`, e.shortMessage ?? e.message); }
  }

  // HyperEVM: system bridge address + HyperSwap candidates
  const erc20Abi = parseAbi(["function symbol() view returns (string)", "function WETH() view returns (address)", "function factory() view returns (address)"]);
  const code2222 = await hyper.getCode({ address: "0x2222222222222222222222222222222222222222" });
  console.log("0x2222…2222 (HYPE system bridge) code bytes:", code2222 ? code2222.length / 2 - 1 : 0);
  for (const [name, addr] of [
    ["HyperSwap V2 Router", "0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A"],
    ["HyperSwap V3 SwapRouter", "0x4E2960a8cd19B467b82d26D83fAcb0fAE26b094D"],
  ] as const) {
    const code = await hyper.getCode({ address: addr });
    console.log(`--- ${name} ${addr}: code ${code ? code.length / 2 - 1 : 0} bytes`);
    if (!code || code === "0x") continue;
    for (const fn of ["factory", "WETH"] as const) {
      try {
        const r = await hyper.readContract({ address: addr, abi: erc20Abi, functionName: fn });
        console.log(`  ${fn}() = ${r}`);
        if (fn === "WETH") {
          const sym = await hyper.readContract({ address: r as `0x${string}`, abi: erc20Abi, functionName: "symbol" });
          console.log(`    WETH().symbol() = ${sym}`);
        }
        if (fn === "factory") {
          for (const lenFn of ["allPoolsLength", "allPairsLength"] as const) {
            try {
              const n = await hyper.readContract({ address: r as `0x${string}`, abi: factoryAbi, functionName: lenFn });
              console.log(`    factory.${lenFn}() = ${n}`);
            } catch { /* not this one */ }
          }
        }
      } catch { console.log(`  ${fn}() reverted/absent`); }
    }
  }
}
main();
