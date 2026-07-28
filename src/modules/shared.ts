import { z } from "zod";
import type { OperatorConfig } from "../config.js";
import type { CallerConfig, ProviderMode } from "../core/providers.js";
import type { AccessGate } from "../access/gate.js";

/** Context handed to every tool registration. */
export interface ToolContext {
  op: OperatorConfig;
  gate: AccessGate;
}

/** Zod raw-shape fragment shared by tools that hit RPC/data providers. */
export const providerInputShape = {
  providerMode: z
    .enum(["open", "own_key", "tool"])
    .default("open")
    .describe("Provider mode: 'open' (public RPC), 'own_key' (you pass keys), 'tool' (operator keys, gated)."),
  heliusKey: z.string().optional().describe("Your own Helius key (own_key mode). Used transiently, never stored."),
  alchemyKey: z.string().optional().describe("Your own Alchemy key (own_key mode). Used transiently, never stored."),
  evmRpcOverrides: z.record(z.string(), z.string()).optional().describe("Optional { chainKey: rpcUrl } overrides."),
} as const;

export interface ProviderInput {
  providerMode?: ProviderMode;
  heliusKey?: string;
  alchemyKey?: string;
  evmRpcOverrides?: Record<string, string>;
}

export function buildCallerConfig(input: ProviderInput): CallerConfig {
  return {
    providerMode: input.providerMode ?? "open",
    ...(input.heliusKey ? { heliusKey: input.heliusKey } : {}),
    ...(input.alchemyKey ? { alchemyKey: input.alchemyKey } : {}),
    ...(input.evmRpcOverrides ? { evmRpcOverrides: input.evmRpcOverrides } : {}),
  };
}

/** Wrap an Envelope into the MCP CallToolResult shape (text + structuredContent). */
export function toToolResult(envelope: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(envelope, null, 2) }],
    structuredContent: envelope as Record<string, unknown>,
  };
}
