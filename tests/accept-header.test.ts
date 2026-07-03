/**
 * Regression test for the 406 "Not Acceptable" bug: agent HTTP clients that do
 * not send the exact `Accept: application/json, text/event-stream` header (e.g.
 * wildcard Accept, application/json only, or none) must still be able to call
 * the MCP endpoint. The Streamable-HTTP transport reads req.rawHeaders (via
 * @hono/node-server), so the fix normalizes rawHeaders before handing off.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { AddressInfo } from "node:net";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "../src/index.js";

// mirrors the normalization in api/mcp.ts + src/http.ts
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
    req.on("end", () => resolve(data ? JSON.parse(data) : undefined));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  ensureMcpAccept(req);
  const body = req.method === "POST" ? await readBody(req) : undefined;
  const mcp = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on("close", () => { transport.close(); mcp.close(); });
  await mcp.connect(transport);
  await transport.handleRequest(req, res, body);
});

let port = 0;
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, r));
  port = (server.address() as AddressInfo).port;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

async function callToolsList(port: number, accept?: string): Promise<{ status: number; tools: string[] }> {
  const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(accept ? { accept } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });
  let tools: string[] = [];
  try {
    const j: any = await res.clone().json();
    tools = (j?.result?.tools ?? []).map((t: any) => t.name);
  } catch { /* non-JSON body */ }
  return { status: res.status, tools };
}

describe("MCP /mcp Accept-header tolerance", () => {
  it.each([
    ["wildcard */*", "*/*"],
    ["application/json only", "application/json"],
    ["no accept header", undefined],
    ["correct dual accept", "application/json, text/event-stream"],
  ])("returns 200 + tools for %s", async (_label, accept) => {
    const { status, tools } = await callToolsList(port, accept as string | undefined);
    expect(status).toBe(200);
    expect(tools.length).toBeGreaterThan(5);
  });
});
