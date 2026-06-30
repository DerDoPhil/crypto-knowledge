import { CryptoKnowledgeError, ErrorCode } from "./errors.js";
import { fetchJson, type FetchJsonOptions } from "./http.js";

interface JsonRpcResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

/** Single JSON-RPC 2.0 call (works for both EVM and Solana endpoints). */
export async function jsonRpc<T>(
  url: string,
  method: string,
  params: unknown[],
  opts: FetchJsonOptions = {},
): Promise<T> {
  const data = await fetchJson<JsonRpcResponse<T>>(url, {
    ...opts,
    method: "POST",
    body: { jsonrpc: "2.0", id: 1, method, params },
  });
  if (data.error) {
    throw new CryptoKnowledgeError(ErrorCode.RPC_ERROR, `${method}: ${data.error.message}`, { retryable: false });
  }
  if (data.result === undefined) {
    throw new CryptoKnowledgeError(ErrorCode.RPC_ERROR, `${method}: empty result`, { retryable: false });
  }
  return data.result;
}

/** eth_call against an EVM endpoint, returns the raw hex result. */
export function ethCall(url: string, to: string, data: string, opts?: FetchJsonOptions): Promise<string> {
  return jsonRpc<string>(url, "eth_call", [{ to, data }, "latest"], opts);
}

/** eth_getStorageAt — used for EIP-1967 proxy implementation slot reads. */
export function ethGetStorageAt(url: string, address: string, slot: string, opts?: FetchJsonOptions): Promise<string> {
  return jsonRpc<string>(url, "eth_getStorageAt", [address, slot, "latest"], opts);
}
