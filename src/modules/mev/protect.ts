import { getChain } from "../../registry/chains.js";

export interface ProtectedRpc {
  name: string;
  url: string;
  notes: string;
}

export interface MevAdvice {
  chain: string;
  sandwichRisk: "high" | "low" | "n/a";
  protectedRpcs: ProtectedRpc[];
  recommendation: string;
}

/**
 * MEV-protection guidance per chain. The agent signs its transaction normally and
 * broadcasts it through a private RPC instead of the public mempool, hiding it
 * from sandwich/front-running bots. We only return endpoints, never broadcast.
 */
const PROTECTED_RPCS: Record<string, ProtectedRpc[]> = {
  ethereum: [
    { name: "Flashbots Protect", url: "https://rpc.flashbots.net", notes: "Private relay, MEV+gas refunds. Append ?hint=... to tune." },
    { name: "MEV Blocker", url: "https://rpc.mevblocker.io", notes: "Searcher auction rebates up to 90% of back-run value." },
  ],
};

/** L2s with a single sequencer have no public mempool → negligible sandwich risk. */
const LOW_RISK_L2 = new Set(["base", "arbitrum", "optimism"]);

export function getMevAdvice(chainKey: string): MevAdvice {
  const chain = getChain(chainKey);
  if (!chain || chain.kind !== "evm") {
    return {
      chain: chainKey,
      sandwichRisk: "n/a",
      protectedRpcs: [],
      recommendation:
        chain?.kind === "solana"
          ? "On Solana, use Jito bundles / a low-slippage limit and a tight priorityFee instead of a private RPC."
          : "Unknown or non-EVM chain.",
    };
  }

  const rpcs = PROTECTED_RPCS[chainKey] ?? [];
  if (rpcs.length > 0) {
    return {
      chain: chainKey,
      sandwichRisk: "high",
      protectedRpcs: rpcs,
      recommendation:
        `Broadcast your signed transaction via ${rpcs[0]!.name} (${rpcs[0]!.url}) instead of the public mempool ` +
        "to avoid sandwich attacks. Set a strict amountOutMin from the profitability module.",
    };
  }

  if (LOW_RISK_L2.has(chainKey)) {
    return {
      chain: chainKey,
      sandwichRisk: "low",
      protectedRpcs: [],
      recommendation:
        `${chain.name} uses a centralized sequencer with no public mempool, so sandwich risk is low. A strict ` +
        "amountOutMin is still recommended.",
    };
  }

  return {
    chain: chainKey,
    sandwichRisk: "high",
    protectedRpcs: [],
    recommendation:
      `No bundled private RPC is configured for ${chain.name}. Use a strict amountOutMin (from the profitability ` +
      "module) and consider a multi-chain protector (e.g. Merkle, bloXroute Protect) if available.",
  };
}
