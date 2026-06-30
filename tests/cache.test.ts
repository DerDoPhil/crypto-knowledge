import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "../src/core/cache.js";

describe("TtlCache", () => {
  it("returns a cached value within the TTL and skips the producer", async () => {
    let now = 0;
    const cache = new TtlCache(() => now);
    const producer = vi.fn().mockResolvedValue(42);

    const a = await cache.wrap("k", 1000, producer);
    expect(a).toMatchObject({ value: 42, cached: false });

    now = 500;
    const b = await cache.wrap("k", 1000, producer);
    expect(b).toMatchObject({ value: 42, cached: true });
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it("re-runs the producer after the TTL expires", async () => {
    let now = 0;
    const cache = new TtlCache(() => now);
    const producer = vi.fn().mockResolvedValueOnce("a").mockResolvedValueOnce("b");

    expect((await cache.wrap("k", 1000, producer)).value).toBe("a");
    now = 1500;
    const second = await cache.wrap("k", 1000, producer);
    expect(second).toMatchObject({ value: "b", cached: false });
    expect(producer).toHaveBeenCalledTimes(2);
  });

  it("evicts the oldest entry when over capacity", () => {
    const cache = new TtlCache(() => 0, 2);
    cache.set("a", 1, 10_000);
    cache.set("b", 2, 10_000);
    cache.set("c", 3, 10_000); // should evict "a"
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")?.value).toBe(2);
    expect(cache.get("c")?.value).toBe(3);
  });
});
