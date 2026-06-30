import { CryptoKnowledgeError, ErrorCode, errorFromHttpStatus } from "./errors.js";

export interface FetchJsonOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
  /** Total attempts including the first. Default 3. */
  maxAttempts?: number;
  /** Per-attempt timeout in ms. Default 15_000. */
  timeoutMs?: number;
  /** Base backoff in ms (exponential + jitter). Default 300. */
  backoffBaseMs?: number;
  /** Injected fetch — lets tests run without network. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Injected sleep — lets tests run without real delays. */
  sleepImpl?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Resilient JSON fetch: exponential backoff with jitter, per-attempt timeout via
 * AbortController, and canonical error normalization (P2/P4 from the analysis).
 * Retries only retryable failures (429/401-quirk/5xx/timeout); fails fast otherwise.
 */
export async function fetchJson<T = unknown>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    maxAttempts = 3,
    timeoutMs = 15_000,
    backoffBaseMs = 300,
    fetchImpl = fetch,
    sleepImpl = defaultSleep,
  } = opts;

  let lastErr: CryptoKnowledgeError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        method,
        headers: { "content-type": "application/json", accept: "application/json", ...headers },
        ...(body !== undefined ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
        signal: controller.signal,
      });

      if (!res.ok) {
        const norm = errorFromHttpStatus(res.status, new URL(url).pathname);
        lastErr = new CryptoKnowledgeError(norm.code, norm.message, {
          retryable: norm.retryable,
          ...(norm.retryAfterSec !== undefined ? { retryAfterSec: norm.retryAfterSec } : {}),
        });
        if (!norm.retryable || attempt === maxAttempts) throw lastErr;
      } else {
        return (await res.json()) as T;
      }
    } catch (err) {
      if (err instanceof CryptoKnowledgeError) {
        lastErr = err;
        if (!err.retryable || attempt === maxAttempts) throw err;
      } else {
        const aborted = err instanceof Error && err.name === "AbortError";
        lastErr = new CryptoKnowledgeError(
          aborted ? ErrorCode.RPC_TIMEOUT : ErrorCode.UPSTREAM_ERROR,
          aborted ? `request timed out after ${timeoutMs}ms` : (err as Error).message,
          { retryable: true },
        );
        if (attempt === maxAttempts) throw lastErr;
      }
    } finally {
      clearTimeout(timer);
    }

    // Exponential backoff with full jitter before the next attempt.
    const wait = Math.round(Math.random() * backoffBaseMs * 2 ** (attempt - 1));
    await sleepImpl(wait);
  }

  throw lastErr ?? new CryptoKnowledgeError(ErrorCode.INTERNAL, "fetchJson exhausted with no error");
}
