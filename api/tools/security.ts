import type { IncomingMessage, ServerResponse } from "node:http";
import { AccessEnforcer } from "../../src/access/enforce.js";
import { loadOperatorConfig } from "../../src/config.js";
import { runSecurityScan } from "../../src/modules/security/tool.js";

/**
 * Standalone REST endpoint for the separately registered ERC-8257 tool
 * "Crypto-Knowledge Security" (OpenSea flags meta-tools that proxy arbitrary
 * sub-tool calls, so each capability gets its own concrete endpoint + manifest).
 *
 * POST { "chain": "ethereum" | ... | "solana", "address": "0x… | mint" }
 * → uniform envelope { ok, data, warnings, errors }
 * Same access rules as /mcp: x402 payment ($0.01, pay-per-call, no NFT gate).
 */
export const config = { maxDuration: 60 };

const enforcer = new AccessEnforcer(loadOperatorConfig());

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) => {
    res.statusCode = status;
    res.setHeader("content-type", "application/json");
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET") {
    json(200, {
      ok: true,
      tool: "crypto-knowledge-security",
      usage: 'POST {"chain":"<evm chain or solana>","address":"<token address>"}',
      access: "$0.01 USDC per request via x402 (X-PAYMENT header) — pay-per-call for everyone, no NFT gate.",
    });
    return;
  }
  if (req.method !== "POST") {
    json(405, { ok: false, errors: [{ code: "METHOD_NOT_ALLOWED", message: "use POST" }] });
    return;
  }

  try {
    // Reuse the exact same gate as /mcp by presenting this call as a gated tools/call.
    const verdict = await enforcer.enforce({
      headers: req.headers,
      body: { method: "tools/call", params: { name: "security" } },
      resourceUrl: `https://${req.headers.host ?? "crypto-knowledge-mcp.vercel.app"}/api/tools/security`,
    });
    if (!verdict.allowed) {
      json(verdict.status ?? 402, verdict.body ?? { error: "access denied" }, verdict.headers ?? {});
      return;
    }

    const body = (req.body ?? {}) as { chain?: unknown; address?: unknown };
    if (typeof body.chain !== "string" || typeof body.address !== "string") {
      json(400, { ok: false, errors: [{ code: "INVALID_INPUT", message: "body must be {chain: string, address: string}" }] });
      return;
    }
    const envelope = await runSecurityScan({ chain: body.chain, address: body.address });
    json(200, envelope);
  } catch (err) {
    if (!res.headersSent) json(500, { ok: false, errors: [{ code: "INTERNAL", message: (err as Error).message }] });
  }
}
