import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ok } from "../../core/envelope.js";
import { CHAINS } from "../../registry/chains.js";
import { toToolResult, type ToolContext } from "../shared.js";

const TOOL_CATALOG = [
  { name: "route", purpose: "Best cross-chain route (LiFi + deBridge) with a ready-to-sign tx.", kinds: ["evm", "solana"] },
  { name: "pumpfun", purpose: "On-chain pump.fun bonding curve, price, graduation, IPFS metadata.", kinds: ["solana"] },
  { name: "profitability", purpose: "EIP-1559 gas estimate + net-profit verdict (arbitrage guard).", kinds: ["evm"] },
  { name: "abi", purpose: "Fetch/parse any verified EVM ABI, follow proxies, decode/encode calldata.", kinds: ["evm"] },
  { name: "portfolio", purpose: "Multi-chain balances + ERC-20 allowance manager (unsigned tx).", kinds: ["evm", "solana"] },
  { name: "security", purpose: "Anti-rug scan (GoPlus + honeypot.is), EVM + Solana, 0-100 risk score.", kinds: ["evm", "solana"] },
  { name: "mev_protection", purpose: "Private-RPC guidance vs sandwich attacks + per-chain risk.", kinds: ["evm", "solana"] },
  { name: "whale_watch", purpose: "Recent large ERC-20 transfers (whale moves) over a block window.", kinds: ["evm"] },
  { name: "solana_swap", purpose: "Quote/build same-chain Solana swaps via Jupiter (unsigned tx).", kinds: ["solana"] },
] as const;

export function registerCatalogTool(server: McpServer, _ctx: ToolContext): void {
  server.registerTool(
    "catalog",
    {
      title: "Capabilities & Chain Catalog",
      description:
        "Discover what Crypto-Knowledge supports: every tool with its purpose, the supported chains with their ids/" +
        "native assets, and the provider modes. Call this first to self-configure. Action 'list'.",
      inputSchema: { action: z.literal("list").default("list") },
    },
    async () => {
      const startedAt = performance.now();
      const chains = Object.values(CHAINS).map((c) => ({
        key: c.key,
        name: c.name,
        kind: c.kind,
        chainId: c.chainId,
        nativeSymbol: c.nativeSymbol,
        explorer: c.explorerUrl,
      }));
      return toToolResult(
        ok(
          {
            service: "crypto-knowledge",
            version: "0.1.0",
            keystoreFree: true,
            providerModes: {
              open: "public RPC (free, limited data)",
              own_key: "bring your own Helius/Alchemy key (recommended)",
              tool: "operator key (gated to NFT holders / paid tier)",
            },
            tools: TOOL_CATALOG,
            chains,
          },
          { source: "catalog", startedAt },
        ),
      );
    },
  );
}
