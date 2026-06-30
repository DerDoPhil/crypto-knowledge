/**
 * Canonical error codes. Every failure inside Crypto-Knowledge is normalized to
 * one of these so agents can branch on a stable string instead of guessing from
 * provider-specific HTTP codes (e.g. OpenSea returns 401 on rate-limit, not 429).
 */
export const ErrorCode = {
  RATE_LIMITED: "RATE_LIMITED",
  RPC_TIMEOUT: "RPC_TIMEOUT",
  RPC_ERROR: "RPC_ERROR",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
  NOT_FOUND: "NOT_FOUND",
  NOT_VERIFIED: "NOT_VERIFIED",
  INVALID_INPUT: "INVALID_INPUT",
  UNSUPPORTED_CHAIN: "UNSUPPORTED_CHAIN",
  INSUFFICIENT_LIQUIDITY: "INSUFFICIENT_LIQUIDITY",
  ACCESS_DENIED: "ACCESS_DENIED",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface NormalizedError {
  code: ErrorCodeType;
  message: string;
  retryable: boolean;
  retryAfterSec?: number;
}

/** A thrown error carrying a canonical code, used by the resilience layer. */
export class CryptoKnowledgeError extends Error {
  readonly code: ErrorCodeType;
  readonly retryable: boolean;
  readonly retryAfterSec?: number;

  constructor(code: ErrorCodeType, message: string, opts: { retryable?: boolean; retryAfterSec?: number } = {}) {
    super(message);
    this.name = "CryptoKnowledgeError";
    this.code = code;
    this.retryable = opts.retryable ?? false;
    this.retryAfterSec = opts.retryAfterSec;
  }
}

/**
 * Map an arbitrary HTTP status (from any upstream) to a canonical error.
 * `path` lets us encode known quirks — e.g. OpenSea's "401 means rate-limit on
 * /drops" behaviour observed in the NFTMintSniper logs.
 */
export function errorFromHttpStatus(status: number, path = ""): NormalizedError {
  const is401RateLimitQuirk = status === 401 && /\/drops|\/listings/.test(path);
  if (status === 429 || is401RateLimitQuirk) {
    return { code: ErrorCode.RATE_LIMITED, message: `rate limited (${status})`, retryable: true, retryAfterSec: 2 };
  }
  if (status === 404) return { code: ErrorCode.NOT_FOUND, message: "not found (404)", retryable: false };
  if (status >= 500) return { code: ErrorCode.UPSTREAM_ERROR, message: `upstream error (${status})`, retryable: true };
  return { code: ErrorCode.UPSTREAM_ERROR, message: `upstream responded ${status}`, retryable: false };
}

/** Best-effort normalization of any caught value into a CryptoKnowledgeError. */
export function toCryptoKnowledgeError(err: unknown): CryptoKnowledgeError {
  if (err instanceof CryptoKnowledgeError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (/abort|timed? ?out/i.test(msg)) {
    return new CryptoKnowledgeError(ErrorCode.RPC_TIMEOUT, msg, { retryable: true });
  }
  return new CryptoKnowledgeError(ErrorCode.INTERNAL, msg, { retryable: false });
}
