/** One-off live verification for the OP-Stack guide (block 60). */
import { createPublicClient, http, parseAbi, formatGwei } from "viem";
import { base } from "viem/chains";

const client = createPublicClient({ chain: base, transport: http("https://mainnet.base.org") });
const GPO = "0x420000000000000000000000000000000000000F" as const;
const abi = parseAbi([
  "function getL1Fee(bytes) view returns (uint256)",
  "function baseFeeScalar() view returns (uint32)",
  "function l1BaseFee() view returns (uint256)",
]);

async function main() {
  const sampleTx = ("0x02" + "ab".repeat(200)) as `0x${string}`;
  const [fee, scalar, l1fee] = await Promise.all([
    client.readContract({ address: GPO, abi, functionName: "getL1Fee", args: [sampleTx] }),
    client.readContract({ address: GPO, abi, functionName: "baseFeeScalar" }),
    client.readContract({ address: GPO, abi, functionName: "l1BaseFee" }),
  ]);
  console.log("getL1Fee(201-byte sample tx):", fee.toString(), "wei");
  console.log("baseFeeScalar:", scalar, "| l1BaseFee:", formatGwei(l1fee), "gwei");
}

main().catch((e) => { console.error(e.shortMessage ?? e); process.exit(1); });
