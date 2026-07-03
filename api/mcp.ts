import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { AccessEnforcer } from "../src/access/enforce.js";
import { loadOperatorConfig } from "../src/config.js";
import { createServer } from "../src/index.js";

// Module scope: survives warm invocations, so rate-limit windows carry over.
const enforcer = new AccessEnforcer(loadOperatorConfig());

/**
 * Vercel serverless entry for the Crypto-Knowledge MCP server (Streamable HTTP,
 * stateless JSON mode — a fresh server + transport per request). Reachable at
 * POST /mcp (rewritten from /api/mcp by vercel.json).
 */
export const config = { maxDuration: 60 };

/**
 * MCP Streamable-HTTP requires the client to accept BOTH application/json and
 * text/event-stream, else the transport replies 406 Not Acceptable. Many agent
 * HTTP clients — and tool-registry / OpenSea health probes — send a wildcard
 * Accept, application/json, or no Accept at all, and would be locked out. The underlying
 * transport builds its Web Headers from `req.rawHeaders` (via @hono/node-server),
 * NOT the parsed `req.headers` object, so we must normalize rawHeaders. Real MCP
 * clients that already send both values are unaffected.
 */
function ensureMcpAccept(req: IncomingMessage): void {
  const REQUIRED = "application/json, text/event-stream";
  const ok = (v: string) => v.includes("application/json") && v.includes("text/event-stream");
  const raw = req.rawHeaders;
  if (Array.isArray(raw)) {
    let found = false;
    for (let i = 0; i < raw.length; i += 2) {
      if (raw[i]?.toLowerCase() === "accept") {
        found = true;
        if (!ok(raw[i + 1] ?? "")) raw[i + 1] = REQUIRED;
      }
    }
    if (!found) raw.push("Accept", REQUIRED);
  }
  req.headers["accept"] = REQUIRED;
}

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
    ensureMcpAccept(req);

    // NFT-holder / x402 gate (no-op unless ACCESS_GATING_ENABLED=true).
    const verdict = await enforcer.enforce({
      headers: req.headers,
      body: req.body,
      resourceUrl: `https://${req.headers.host ?? "crypto-knowledge-eight.vercel.app"}/mcp`,
    });
    if (!verdict.allowed) {
      res.statusCode = verdict.status ?? 402;
      res.setHeader("content-type", "application/json");
      for (const [k, v] of Object.entries(verdict.headers ?? {})) res.setHeader(k, v);
      res.end(JSON.stringify(verdict.body ?? { error: "access denied" }));
      return;
    }

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
