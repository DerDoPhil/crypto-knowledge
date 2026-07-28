import { fetchJson } from "../../core/http.js";
import { getChain } from "../../registry/chains.js";

/**
 * honeypot.is — simulation-based honeypot detection (actually simulates a
 * buy+sell). A strong second signal alongside GoPlus's static analysis.
 * Keyless. Best-effort: returns null on any failure so it never blocks a scan.
 */
export interface HoneypotResult {
  isHoneypot: boolean | null;
  buyTaxPct: number | null;
  sellTaxPct: number | null;
  flags: string[];
  simulationSuccess: boolean | null;
}

interface HoneypotIsResponse {
  honeypotResult?: { isHoneypot?: boolean };
  simulationSuccess?: boolean;
  simulationResult?: { buyTax?: number; sellTax?: number };
  flags?: string[];
}

export async function fetchHoneypotIs(chainKey: string, address: string): Promise<HoneypotResult | null> {
  const chain = getChain(chainKey);
  if (!chain || chain.chainId === null) return null;
  try {
    const url = `https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${chain.chainId}`;
    const res = await fetchJson<HoneypotIsResponse>(url, { maxAttempts: 2, timeoutMs: 8000 });
    return {
      isHoneypot: res.honeypotResult?.isHoneypot ?? null,
      buyTaxPct: res.simulationResult?.buyTax ?? null,
      sellTaxPct: res.simulationResult?.sellTax ?? null,
      flags: res.flags ?? [],
      simulationSuccess: res.simulationSuccess ?? null,
    };
  } catch {
    return null;
  }
}
