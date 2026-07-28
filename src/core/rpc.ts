import { CryptoKnowledgeError, ErrorCode } from "./errors.js";
import { fetchJson, type FetchJsonOptions } from "./http.js";

interface JsonRpcResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

async function jsonRpcSingle<T>(url: string, method: string, params: unknown[], opts: FetchJsonOptions): Promise<T> {
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

/**
 * JSON-RPC 2.0 call with endpoint failover. Pass one url or a list; network
 * failures (timeout/5xx/429/403) fall over to the next endpoint, but a real
 * RPC_ERROR (the node returned a JSON-RPC error, e.g. a revert) is returned
 * immediately — it is deterministic and would repeat on every endpoint.
 */
export async function jsonRpc<T>(
  urlOrUrls: string | string[],
  method: string,
  params: unknown[],
  opts: FetchJsonOptions = {},
): Promise<T> {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      return await jsonRpcSingle<T>(url, method, params, opts);
    } catch (err) {
      if (err instanceof CryptoKnowledgeError && err.code === ErrorCode.RPC_ERROR) throw err;
      lastErr = err; // network-level failure → try the next endpoint
    }
  }
  throw lastErr ?? new CryptoKnowledgeError(ErrorCode.RPC_ERROR, `${method}: all endpoints failed`);
}

/** eth_call against an EVM endpoint (with failover), returns the raw hex result. */
export function ethCall(url: string | string[], to: string, data: string, opts?: FetchJsonOptions): Promise<string> {
  return jsonRpc<string>(url, "eth_call", [{ to, data }, "latest"], opts);
}

/** eth_getStorageAt — used for EIP-1967 proxy implementation slot reads. */
export function ethGetStorageAt(url: string | string[], address: string, slot: string, opts?: FetchJsonOptions): Promise<string> {
  return jsonRpc<string>(url, "eth_getStorageAt", [address, slot, "latest"], opts);
}
