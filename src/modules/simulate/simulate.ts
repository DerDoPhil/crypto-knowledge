import { decodeErrorResult, parseAbi } from "viem";
import type { OperatorConfig } from "../../config.js";
import { fetchJson } from "../../core/http.js";
import { resolveEvmRpc, type CallerConfig } from "../../core/providers.js";
import { getChain } from "../../registry/chains.js";
import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";

const STD_ERRORS = parseAbi(["error Error(string)", "error Panic(uint256)"]);

export interface SimTx {
  from?: string;
  to: string;
  data?: string;
  value?: string;
}

export interface SimResult {
  willRevert: boolean;
  revertReason: string | null;
  returnData: string | null;
  rawError: string | null;
}

/** Decode a revert payload (Error(string) / Panic(uint256) / unknown custom). */
export function decodeRevert(data: string | undefined, message: string | undefined): string | null {
  if (data && data !== "0x" && data.length >= 10) {
    try {
      const decoded = decodeErrorResult({ abi: STD_ERRORS, data: data as `0x${string}` });
      if (decoded.errorName === "Error") return String(decoded.args?.[0]);
      if (decoded.errorName === "Panic") return `Panic(0x${(decoded.args?.[0] as bigint).toString(16)})`;
    } catch {
      return `custom error ${data.slice(0, 10)} (ABI needed to decode)`;
    }
  }
  if (message) {
    const m = /execution reverted:?\s*(.*)/i.exec(message);
    if (m && m[1]) return m[1].trim() || "execution reverted";
    if (/revert/i.test(message)) return message;
  }
  return null;
}

/**
 * Dry-run an EVM transaction via eth_call before the agent signs it. Returns
 * whether it would revert and the decoded reason — so the agent never burns gas
 * on a doomed transaction.
 */
export async function simulateTx(
  chainKey: string,
  tx: SimTx,
  caller: CallerConfig,
  op: OperatorConfig,
): Promise<SimResult> {
  const chain = getChain(chainKey);
  if (!chain || chain.kind !== "evm") {
    throw new CryptoKnowledgeError(ErrorCode.UNSUPPORTED_CHAIN, `simulation needs an EVM chain, got '${chainKey}'`);
  }
  const { urls } = resolveEvmRpc(chainKey, caller, op);
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [{ from: tx.from, to: tx.to, data: tx.data, value: tx.value ?? "0x0" }, "latest"],
  };

  // Try each endpoint; a network failure falls over, a JSON-RPC reply (result or
  // revert error) is authoritative and returned.
  let res: { result?: string; error?: { message?: string; data?: string } } | undefined;
  let lastErr: unknown;
  for (const url of urls) {
    try {
      res = await fetchJson<{ result?: string; error?: { message?: string; data?: string } }>(url, { method: "POST", body });
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!res) throw lastErr ?? new CryptoKnowledgeError(ErrorCode.RPC_ERROR, "simulation: all endpoints failed");

  if (res.error) {
    const reason = decodeRevert(res.error.data, res.error.message);
    return { willRevert: true, revertReason: reason, returnData: res.error.data ?? null, rawError: res.error.message ?? null };
  }
  return { willRevert: false, revertReason: null, returnData: res.result ?? "0x", rawError: null };
}
