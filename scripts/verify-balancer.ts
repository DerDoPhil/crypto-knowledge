/** One-off live verification for the Balancer guide (block 53). */
import { createPublicClient, http, parseAbi, formatEther } from "viem";
import { mainnet } from "viem/chains";

const VAULT = "0xBA12222222228d8Ba445958a75a0704d566BF2C8" as const;
// 80/20 BAL/WETH pool (canonical veBAL pool)
const POOL_ID = "0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014" as const;
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const BAL = "0xba100000625a3754423978a60c9317c58a424e3D";

const abi = parseAbi([
  "function getPoolTokens(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)",
  "function queryBatchSwap(uint8 kind, (bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, (address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds) returns (int256[] assetDeltas)",
]);

async function main() {
  const client = createPublicClient({ chain: mainnet, transport: http("https://eth.drpc.org") });
  const [tokens, balances] = await client.readContract({ address: VAULT, abi, functionName: "getPoolTokens", args: [POOL_ID] });
  console.log("pool tokens:", tokens);
  console.log("balances:", balances.map((b) => formatEther(b)));

  // queryBatchSwap is state-changing in the ABI but meant for eth_call → use simulateContract
  const { result } = await client.simulateContract({
    address: VAULT,
    abi,
    functionName: "queryBatchSwap",
    args: [
      0, // GIVEN_IN
      [{ poolId: POOL_ID, assetInIndex: 1n, assetOutIndex: 0n, amount: 10n ** 17n, userData: "0x" }],
      [BAL, WETH], // assets sorted: index0=BAL, index1=WETH
      { sender: "0x0000000000000000000000000000000000000001", fromInternalBalance: false, recipient: "0x0000000000000000000000000000000000000001", toInternalBalance: false },
    ],
  });
  console.log("queryBatchSwap deltas (0.1 WETH GIVEN_IN):", result.map((d) => formatEther(d)));
  console.log("→ BAL out:", formatEther(-result[0]!));
}

main().catch((e) => { console.error(e.shortMessage ?? e); process.exit(1); });
