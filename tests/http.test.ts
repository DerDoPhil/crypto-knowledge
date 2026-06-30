import { describe, expect, it, vi } from "vitest";
import { fetchJson } from "../src/core/http.js";
import { CryptoKnowledgeError, ErrorCode, errorFromHttpStatus } from "../src/core/errors.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const noSleep = () => Promise.resolve();

describe("errorFromHttpStatus", () => {
  it("maps 429 to RATE_LIMITED (retryable)", () => {
    expect(errorFromHttpStatus(429)).toMatchObject({ code: ErrorCode.RATE_LIMITED, retryable: true });
  });
  it("treats 401 on /drops as a rate-limit quirk", () => {
    expect(errorFromHttpStatus(401, "/v2/collections/drops")).toMatchObject({ code: ErrorCode.RATE_LIMITED });
  });
  it("treats a plain 401 as non-retryable upstream error", () => {
    expect(errorFromHttpStatus(401, "/v2/account")).toMatchObject({ code: ErrorCode.UPSTREAM_ERROR, retryable: false });
  });
  it("maps 5xx to retryable upstream error", () => {
    expect(errorFromHttpStatus(503)).toMatchObject({ code: ErrorCode.UPSTREAM_ERROR, retryable: true });
  });
});

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { hello: "world" }));
    const data = await fetchJson<{ hello: string }>("https://x.test/ok", { fetchImpl, sleepImpl: noSleep });
    expect(data.hello).toBe("world");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const data = await fetchJson<{ ok: boolean }>("https://x.test/r", { fetchImpl, sleepImpl: noSleep });
    expect(data.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails fast on a non-retryable 400 without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(400, {}));
    await expect(fetchJson("https://x.test/bad", { fetchImpl, sleepImpl: noSleep })).rejects.toBeInstanceOf(
      CryptoKnowledgeError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxAttempts on persistent 503", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(503, {}));
    await expect(
      fetchJson("https://x.test/down", { fetchImpl, sleepImpl: noSleep, maxAttempts: 3 }),
    ).rejects.toMatchObject({ code: ErrorCode.UPSTREAM_ERROR });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
