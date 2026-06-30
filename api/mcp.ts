import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "../src/index.js";

/**
 * Vercel serverless entry for the Crypto-Knowledge MCP server (Streamable HTTP,
 * stateless JSON mode — a fresh server + transport per request). Reachable at
 * POST /mcp (rewritten from /api/mcp by vercel.json).
 */
export const config = { maxDuration: 60 };

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  if (req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, service: "crypto-knowledge", transport: "streamable-http", endpoint: "POST /mcp" }));
    return;
  }
  try {
    const mcp = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => {
      transport.close();
      mcp.close();
    });
    await mcp.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: (err as Error).message }));
    }
  }
}
