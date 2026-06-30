import { type Abi, type AbiFunction, getAbiItem, isAddress } from "viem";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fail, invalidInput, ok } from "../../core/envelope.js";
import { ErrorCode, toCryptoKnowledgeError } from "../../core/errors.js";
import { getChain } from "../../registry/chains.js";
import { toToolResult, type ToolContext } from "../shared.js";
import { decodeCalldata, describeFunction, encodeCall, listFunctions } from "./decoder.js";
import { getAbiBundle } from "./explorer.js";

/** Coerce JSON args into viem-compatible values based on the function's input types. */
function coerceArgs(abi: Abi, functionName: string, raw: unknown[]): unknown[] {
  const item = getAbiItem({ abi, name: functionName }) as AbiFunction | undefined;
  const inputs = item?.inputs ?? [];
  return raw.map((v, i) => {
    const type = inputs[i]?.type ?? "";
    if (/^u?int\d*$/.test(type) && (typeof v === "string" || typeof v === "number")) return BigInt(v);
    if (type === "bool" && typeof v === "string") return v === "true";
    return v;
  });
}

export function registerAbiTool(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "abi",
    {
      title: "Smart Contract ABI & Interaction Decoder",
      description:
        "Read any verified EVM contract. Fetches the ABI (Etherscan V2 or Sourcify), follows EIP-1967 proxies, " +
        "and tells the agent exactly which parameters each function needs. Actions: get_abi, list_functions, " +
        "describe_function, decode_calldata, encode_call.",
      inputSchema: {
        action: z.enum(["get_abi", "list_functions", "describe_function", "decode_calldata", "encode_call"]),
        chain: z.string().describe("Chain key, e.g. 'ethereum', 'arbitrum', 'cronos'."),
        address: z.string().optional().describe("Contract address (required unless you pass `abi`)."),
        abi: z.array(z.any()).optional().describe("Optional ABI to use directly, skipping the explorer fetch."),
        function: z.string().optional().describe("Function name (describe_function / encode_call)."),
        calldata: z.string().optional().describe("0x-prefixed calldata to decode (decode_calldata)."),
        args: z.array(z.any()).optional().describe("Arguments for encode_call, in declared order."),
      },
    },
    async (input) => {
      const startedAt = performance.now();
      const chain = getChain(input.chain);
      const meta = { source: "abi", startedAt, chain: input.chain };

      if (!chain) return toToolResult(invalidInput(`unknown chain '${input.chain}'`, meta));
      if (chain.kind !== "evm") return toToolResult(invalidInput("ABI module supports EVM chains only", meta));

      try {
        // Resolve the ABI: caller-provided wins, otherwise fetch from explorer.
        let abi: Abi;
        let provenance: Record<string, unknown> = { source: "caller-provided" };
        if (input.abi) {
          abi = input.abi as Abi;
        } else {
          if (!input.address || !isAddress(input.address)) {
            return toToolResult(invalidInput("a valid `address` (or an `abi`) is required", meta));
          }
          const bundle = await getAbiBundle(input.chain, input.address, ctx.op);
          abi = bundle.abi;
          provenance = {
            source: bundle.source,
            verified: bundle.verified,
            contractName: bundle.contractName,
            isProxy: bundle.isProxy,
            implementation: bundle.implementation,
            proxyResolved: bundle.proxyResolved,
          };
        }

        switch (input.action) {
          case "get_abi":
            return toToolResult(ok({ provenance, abi }, meta));

          case "list_functions":
            return toToolResult(ok({ provenance, functions: listFunctions(abi) }, meta));

          case "describe_function": {
            if (!input.function) return toToolResult(invalidInput("`function` is required", meta));
            const specs = describeFunction(abi, input.function);
            if (specs.length === 0) {
              return toToolResult(
                fail({ code: ErrorCode.NOT_FOUND, message: `no function '${input.function}' in ABI` }, meta),
              );
            }
            const warnings = specs.length > 1 ? [`'${input.function}' is overloaded (${specs.length} variants)`] : [];
            return toToolResult(ok({ provenance, function: specs.length === 1 ? specs[0] : specs }, meta, warnings));
          }

          case "decode_calldata": {
            if (!input.calldata || !input.calldata.startsWith("0x")) {
              return toToolResult(invalidInput("`calldata` (0x-prefixed) is required", meta));
            }
            return toToolResult(ok({ provenance, decoded: decodeCalldata(abi, input.calldata as `0x${string}`) }, meta));
          }

          case "encode_call": {
            if (!input.function) return toToolResult(invalidInput("`function` is required", meta));
            const args = coerceArgs(abi, input.function, input.args ?? []);
            const calldata = encodeCall(abi, input.function, args);
            return toToolResult(ok({ provenance, function: input.function, calldata }, meta));
          }
        }
      } catch (err) {
        const e = toCryptoKnowledgeError(err);
        return toToolResult(fail({ code: e.code, message: e.message, retryable: e.retryable }, meta));
      }
    },
  );
}
