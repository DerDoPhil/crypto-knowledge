#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadOperatorConfig } from "./config.js";
import { AccessGate } from "./access/gate.js";
import type { ToolContext } from "./modules/shared.js";
import { registerAbiTool } from "./modules/abi/tool.js";
import { registerPortfolioTool } from "./modules/portfolio/tool.js";
import { registerSecurityTool } from "./modules/security/tool.js";
import { registerGasTool } from "./modules/gas/tool.js";
import { registerRoutingTool } from "./modules/routing/tool.js";
import { registerPumpfunTool } from "./modules/pumpfun/tool.js";
import { registerMevTool } from "./modules/mev/tool.js";
import { registerEventsTool } from "./modules/events/tool.js";
import { registerCatalogTool } from "./modules/catalog/tool.js";
import { registerJupiterTool } from "./modules/jupiter/tool.js";
import { registerSimulateTool } from "./modules/simulate/tool.js";

export function createServer(): McpServer {
  const op = loadOperatorConfig();
  const ctx: ToolContext = { op, gate: new AccessGate(op) };

  const server = new McpServer({
    name: "crypto-knowledge",
    version: "0.1.0",
  });

  // The 6 modules — the on-chain brain for autonomous agents.
  registerRoutingTool(server, ctx); // M1  route
  registerPumpfunTool(server, ctx); // M2  pumpfun
  registerGasTool(server, ctx); // M3  profitability
  registerAbiTool(server, ctx); // M4  abi
  registerPortfolioTool(server, ctx); // M5  portfolio
  registerSecurityTool(server, ctx); // M6  security
  registerMevTool(server, ctx); // M7  mev_protection (R&D-9)
  registerEventsTool(server, ctx); // M8  whale_watch (R&D-10)
  registerCatalogTool(server, ctx); // discovery: capabilities + chains
  registerJupiterTool(server, ctx); // M2b solana_swap (Jupiter trade tx)
  registerSimulateTool(server, ctx); // R&D-12 simulate (EVM dry-run)

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is reserved for the MCP JSON-RPC stream.
  console.error("crypto-knowledge MCP server running on stdio");
}

// Only auto-start when run directly (not when imported by tests).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err) => {
    console.error("fatal:", err);
    process.exit(1);
  });
}
