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
import { createServer } from "./index.js";
import { LLMS_TXT, LANDING_HTML } from "./landing.js";

const PORT = Number(process.env.PORT ?? 8787);

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
      const body = req.method === "POST" ? await readBody(req) : undefined;
      const mcp = createServer();
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
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
