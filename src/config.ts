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
  };
}
