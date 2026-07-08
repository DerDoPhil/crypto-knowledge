/**
 * Operator-side configuration, read once from the environment. These are the
 * TOOL's own provider keys — they are used server-side only and are NEVER echoed
 * back to callers in any response, log, or error message.
 */
export interface OperatorConfig {
  heliusKey?: string;
  alchemyKey?: string;
  etherscanKey?: string;
  goplusAppKey?: string;
  goplusAppSecret?: string;
  lifiKey?: string;
  access: {
    gatingEnabled: boolean;
    holderNftContract?: string;
    holderNftChain: string;
    treasuryAddress?: string;
  };
  x402: {
    facilitatorUrl: string;
    network: string;
    asset: string;
    priceAtomic: string;
  };
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export function loadOperatorConfig(): OperatorConfig {
  return {
    heliusKey: env("HELIUS_API_KEY"),
    alchemyKey: env("ALCHEMY_API_KEY"),
    etherscanKey: env("ETHERSCAN_API_KEY"),
    goplusAppKey: env("GOPLUS_APP_KEY"),
    goplusAppSecret: env("GOPLUS_APP_SECRET"),
    lifiKey: env("LIFI_API_KEY"),
    access: {
      gatingEnabled: env("ACCESS_GATING_ENABLED") === "true",
      holderNftContract: env("HOLDER_NFT_CONTRACT"),
      holderNftChain: env("HOLDER_NFT_CHAIN") ?? "ethereum",
      treasuryAddress: env("TREASURY_ADDRESS"),
    },
    x402: {
      // keyless xpay facilitator (the SwarmSkill pattern) — no account/KYB needed
      facilitatorUrl: env("X402_FACILITATOR_URL") ?? "https://facilitator.xpay.sh",
      network: env("X402_NETWORK") ?? "base",
      // USDC on Base
      asset: env("X402_ASSET") ?? "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      // $0.02 in 6-decimals USDC — must match the on-chain manifest's pricing[0].amount
      priceAtomic: env("X402_PRICE_ATOMIC") ?? "20000",
    },
  };
}
