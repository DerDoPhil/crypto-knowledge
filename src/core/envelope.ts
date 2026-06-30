import { ErrorCode, type ErrorCodeType, type NormalizedError } from "./errors.js";

/**
 * The single response shape every tool returns. Agents always get the same
 * top-level keys: `ok`, `data`, `warnings`, `errors`, `meta`.
 */
export interface Envelope<T> {
  ok: boolean;
  data: T | null;
  warnings: string[];
  errors: Array<{ code: ErrorCodeType; message: string; retryable: boolean; retryAfterSec?: number }>;
  meta: {
    source: string;
    latencyMs: number;
    cachedAt: string | null;
    chain?: string;
  };
}

export interface EnvelopeMetaInput {
  source: string;
  startedAt: number;
  chain?: string;
  cachedAt?: string | null;
}

function buildMeta(meta: EnvelopeMetaInput): Envelope<never>["meta"] {
  return {
    source: meta.source,
    latencyMs: Math.max(0, Math.round(performance.now() - meta.startedAt)),
    cachedAt: meta.cachedAt ?? null,
    ...(meta.chain ? { chain: meta.chain } : {}),
  };
}

export function ok<T>(data: T, meta: EnvelopeMetaInput, warnings: string[] = []): Envelope<T> {
  return { ok: true, data, warnings, errors: [], meta: buildMeta(meta) };
}

export function fail<T = never>(
  error: NormalizedError | { code: ErrorCodeType; message: string; retryable?: boolean; retryAfterSec?: number },
  meta: EnvelopeMetaInput,
  warnings: string[] = [],
): Envelope<T> {
  return {
    ok: false,
    data: null,
    warnings,
    errors: [
      {
        code: error.code,
        message: error.message,
        retryable: "retryable" in error ? Boolean(error.retryable) : false,
        ...(error.retryAfterSec !== undefined ? { retryAfterSec: error.retryAfterSec } : {}),
      },
    ],
    meta: buildMeta(meta),
  };
}

export function invalidInput<T = never>(message: string, meta: EnvelopeMetaInput): Envelope<T> {
  return fail<T>({ code: ErrorCode.INVALID_INPUT, message, retryable: false }, meta);
}
