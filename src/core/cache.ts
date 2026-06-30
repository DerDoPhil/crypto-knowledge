/**
 * Tiny in-memory TTL cache. Protects operator provider quotas (a real concern
 * for a public multi-tenant tool) by collapsing repeated identical reads. Swap
 * for Redis when horizontally scaled. Per-datatype TTLs live with each caller.
 */
interface Entry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

export class TtlCache {
  private readonly store = new Map<string, Entry<unknown>>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = 5000,
  ) {}

  get<T>(key: string): { value: T; storedAt: number } | undefined {
    const e = this.store.get(key) as Entry<T> | undefined;
    if (!e) return undefined;
    if (this.now() >= e.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return { value: e.value, storedAt: e.storedAt };
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxEntries) {
      // Evict the oldest entry (simple FIFO — good enough for this scale).
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    const t = this.now();
    this.store.set(key, { value, expiresAt: t + ttlMs, storedAt: t });
  }

  /** Memoize an async producer under `key` for `ttlMs`. Returns cache status. */
  async wrap<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<{ value: T; cached: boolean; storedAt: number }> {
    const hit = this.get<T>(key);
    if (hit) return { value: hit.value, cached: true, storedAt: hit.storedAt };
    const value = await producer();
    this.set(key, value, ttlMs);
    return { value, cached: false, storedAt: this.now() };
  }
}

/** Recommended TTLs per data type (ms). */
export const TTL = {
  abi: 60 * 60_000, // ABIs almost never change
  price: 30_000, // native USD price
  security: 5 * 60_000, // token risk profile
  gas: 5_000, // gas moves fast
} as const;

/** Process-wide shared cache instance. */
export const sharedCache = new TtlCache();
