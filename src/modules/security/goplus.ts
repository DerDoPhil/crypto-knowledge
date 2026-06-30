import { CryptoKnowledgeError, ErrorCode } from "../../core/errors.js";
import { fetchJson } from "../../core/http.js";
import { getChain } from "../../registry/chains.js";

/** Subset of GoPlus token_security fields we surface. All are "1"/"0" strings or numeric strings. */
export interface GoPlusToken {
  is_honeypot?: string;
  honeypot_with_same_creator?: string;
  cannot_sell_all?: string;
  buy_tax?: string;
  sell_tax?: string;
  is_open_source?: string;
  is_proxy?: string;
  is_mintable?: string;
  owner_address?: string;
  can_take_back_ownership?: string;
  hidden_owner?: string;
  transfer_pausable?: string;
  is_blacklisted?: string;
  is_whitelisted?: string;
  trading_cooldown?: string;
  holder_count?: string;
  total_supply?: string;
  lp_holders?: Array<{ is_locked?: number; percent?: string; address?: string }>;
  lp_total_supply?: string;
  holders?: Array<{ percent?: string; address?: string; is_contract?: number }>;
  creator_address?: string;
  creator_percent?: string;
}

interface GoPlusResponse {
  code: number;
  message: string;
  result?: Record<string, GoPlusToken>;
}

/**
 * Fetch raw token-security data from GoPlus for an EVM token. Keyless works (rate
 * limited); operator app_key/secret raise limits when present.
 */
export async function fetchGoPlus(chainKey: string, address: string): Promise<GoPlusToken> {
  const chain = getChain(chainKey);
  if (!chain || chain.chainId === null) {
    throw new CryptoKnowledgeError(ErrorCode.UNSUPPORTED_CHAIN, `GoPlus security needs an EVM chain, got '${chainKey}'`);
  }
  const url = `https://api.gopluslabs.io/api/v1/token_security/${chain.chainId}?contract_addresses=${address.toLowerCase()}`;
  const res = await fetchJson<GoPlusResponse>(url);
  if (res.code !== 1 || !res.result) {
    throw new CryptoKnowledgeError(ErrorCode.UPSTREAM_ERROR, `GoPlus: ${res.message || "no result"}`);
  }
  const token = res.result[address.toLowerCase()];
  if (!token) {
    throw new CryptoKnowledgeError(ErrorCode.NOT_FOUND, `GoPlus has no data for ${address} (token may be too new)`);
  }
  return token;
}
