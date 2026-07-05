/**
 * Regression check: on-chain metadata hash of tool #71 vs the live manifest hash.
 * Uses drpc (allows getLogs/eth_call free) and decodes getToolConfig properly
 * with viem decodeAbiParameters (raw slicing is off by one byte — known gotcha).
 */
import { createPublicClient, http, decodeAbiParameters, keccak256 } from "viem";
import { mainnet } from "viem/chains";

const REGISTRY = "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" as const;

async function main() {
  const client = createPublicClient({ chain: mainnet, transport: http("https://eth.drpc.org") });
  const raw = await client.call({
    to: REGISTRY,
    data: ("0xa0178453" + (71).toString(16).padStart(64, "0")) as `0x${string}`,
  });
  if (!raw.data) throw new Error("empty result");
  const [config] = decodeAbiParameters(
    [
      {
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "metadataHash", type: "bytes32" },
          { name: "accessPredicate", type: "address" },
        ],
      },
    ],
    raw.data,
  );
  console.log("on-chain URI :", config.metadataURI);
  console.log("on-chain hash:", config.metadataHash);

  const res = await fetch(config.metadataURI);
  const body = new Uint8Array(await res.arrayBuffer());
  const liveHash = keccak256(body);
  console.log("live keccak256(manifest bytes):", liveHash);
  console.log(liveHash === config.metadataHash ? "MATCH ✅" : "MISMATCH ❌ (check tool-sdk canonicalization before panicking)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
