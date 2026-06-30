/**
 * Smoke test: spawn the server over stdio with a real MCP client, list tools,
 * and call one offline tool (abi encode_call with a caller-provided ABI — no
 * network) to prove the full request/response path works end to end.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/index.ts"],
  });
  const client = new Client({ name: "smoke", version: "0.0.0" });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log("TOOLS:", tools.tools.map((t) => t.name).sort().join(", "));

  const res = await client.callTool({
    name: "abi",
    arguments: {
      action: "encode_call",
      chain: "ethereum",
      abi: [
        {
          type: "function",
          name: "transfer",
          stateMutability: "nonpayable",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ],
      function: "transfer",
      args: ["0x1111111111111111111111111111111111111111", "1000000"],
    },
  });
  const structured = (res as { structuredContent?: { data?: { calldata?: string } } }).structuredContent;
  console.log("ENCODE_CALL calldata:", structured?.data?.calldata);

  await client.close();
  const okTools = tools.tools.length === 12;
  const okEncode = structured?.data?.calldata?.startsWith("0xa9059cbb");
  console.log(okTools && okEncode ? "SMOKE: PASS" : "SMOKE: FAIL");
  process.exit(okTools && okEncode ? 0 : 1);
}

main().catch((e) => {
  console.error("SMOKE ERROR:", e);
  process.exit(1);
});
