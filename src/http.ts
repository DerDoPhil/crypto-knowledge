#!/usr/bin/env node
/**
 * Hosted HTTP entry — exposes the MCP server over Streamable HTTP so any remote
 * agent can use Crypto-Knowledge. Stateless: a fresh server + transport per
 * request (safe for serverless / horizontal scaling). Also serves /llms.txt and
 * a landing page for tool discovery (the SwarmSkill distribution pattern).
 *
 * Run: PORT=8787 npm run start:http
 */
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { AccessEnforcer } from "./access/enforce.js";
import { loadOperatorConfig } from "./config.js";
import { createServer } from "./index.js";
import { LLMS_TXT, LANDING_HTML } from "./landing.js";

const PORT = Number(process.env.PORT ?? 8787);
const enforcer = new AccessEnforcer(loadOperatorConfig());

/**
 * Streamable-HTTP requires Accept to include both application/json and
 * text/event-stream (else 406). The transport reads `req.rawHeaders` (via
 * @hono/node-server), not the parsed header object, so normalize rawHeaders so
 * lenient agent clients and registry/health probes (wildcard Accept or none) work.
 */
function ensureMcpAccept(req: http.IncomingMessage): void {
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

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : undefined);
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";

  if (url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "crypto-knowledge", version: "0.1.0" }));
    return;
  }
  if (url === "/llms.txt") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(LLMS_TXT);
    return;
  }
  if (url === "/" && req.method === "GET") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(LANDING_HTML);
    return;
  }

  if (url.startsWith("/mcp")) {
    try {
      ensureMcpAccept(req);
      const body = req.method === "POST" ? await readBody(req) : undefined;

      // NFT-holder / x402 gate (no-op unless ACCESS_GATING_ENABLED=true).
      const verdict = await enforcer.enforce({
        headers: req.headers,
        body,
        resourceUrl: `https://${req.headers.host ?? `localhost:${PORT}`}/mcp`,
      });
      if (!verdict.allowed) {
        res.writeHead(verdict.status ?? 402, { "content-type": "application/json", ...(verdict.headers ?? {}) });
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
      await transport.handleRequest(req, res, body);
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    }
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.error(`crypto-knowledge HTTP MCP server on :${PORT} (POST /mcp, GET /llms.txt, GET /health)`);
});
