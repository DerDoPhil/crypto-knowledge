/**
 * Curated Web3 reference data — the "chain brain" lookup layer. Canonical
 * contract addresses, keyless/free API endpoints, a common-error playbook and
 * JSON-RPC gotchas. Everything here is either used live by this server's own
 * modules or battle-verified; agents retrieve it in one call instead of
 * burning search/reasoning credits (or worse: hallucinating an address).
 */

export interface AddressEntry {
  name: string;
  /** chain key → address. "evm" means the same address on effectively all EVM chains. */
  addresses: Record<string, string>;
  note?: string;
}

export const ADDRESSES: AddressEntry[] = [
  {
    name: "Multicall3",
    addresses: { evm: "0xcA11bde05977b3631167028862bE2a173976CA11" },
    note: "Batch many view calls into one eth_call. Same address on 250+ EVM chains. viem's multicall uses it automatically.",
  },
  {
    name: "Permit2 (Uniswap)",
    addresses: { evm: "0x000000000022D473030F116dDEE9F6B43aC78BA3" },
    note: "Signature-based ERC-20 approvals shared across protocols. Same address on all major EVM chains.",
  },
  {
    name: "ERC-4337 EntryPoint v0.7",
    addresses: { evm: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" },
    note: "Account-abstraction entry point. v0.6 (legacy, still widely used): 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789.",
  },
  {
    name: "Wrapped native token (WETH/WPOL/…)",
    addresses: {
      ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      base: "0x4200000000000000000000000000000000000006",
      optimism: "0x4200000000000000000000000000000000000006",
      arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      polygon: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    },
    note: "OP-Stack chains (Base, Optimism, Zora, …) share the 0x4200…0006 predeploy. Polygon entry is wrapped POL.",
  },
  {
    name: "USDC (native Circle deployments)",
    addresses: {
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      solana: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
    note: "6 decimals everywhere. Beware bridged variants (USDC.e) with different addresses — these are the native Circle mints.",
  },
  {
    name: "Chainlink ETH/USD price feed (Ethereum)",
    addresses: { ethereum: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" },
    note: "latestRoundData() selector 0xfeaf968c; answer has 8 decimals. Look up ALL other feed addresses at data.chain.link — do NOT guess them (see the chainlink_price_feeds guide).",
  },
  {
    name: "ENS Registry",
    addresses: { ethereum: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" },
    note: "resolver(node) → resolver contract → addr(node). viem has getEnsAddress/getEnsName built in.",
  },
  {
    name: "ERC-8257 ToolRegistry (OpenSea agent tools)",
    addresses: { ethereum: "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1", base: "0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1" },
    note: "registerTool/updateToolMetadata/deregisterTool. Canonical ERC721OwnerPredicate for NFT gating: 0xc8721c9A776958FfFfEb602DA1b708bf1D318379 (setCollections). See the register_onchain_tool guide.",
  },
  {
    name: "Solana core programs",
    addresses: {
      solana_system: "11111111111111111111111111111111",
      solana_token: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      solana_token2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      solana_ata: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      solana_memo: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
    },
    note: "New pump.fun-era tokens are often Token-2022: the token program is the OWNER of the mint account — check it instead of assuming.",
  },
  {
    name: "pump.fun program",
    addresses: { solana: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P" },
    note: "Bonding-curve program. Use this server's `pumpfun` tool for curve state instead of parsing accounts yourself.",
  },
];

export interface EndpointEntry {
  name: string;
  baseUrl: string;
  auth: "none" | "free-key" | "optional-key";
  what: string;
  example?: string;
  limits?: string;
}

export const ENDPOINTS: EndpointEntry[] = [
  {
    name: "DefiLlama prices",
    baseUrl: "https://coins.llama.fi",
    auth: "none",
    what: "Current + historical token prices, fully keyless. Keys are {chain}:{address} for on-chain tokens or coingecko:{id} for native assets (coingecko:bitcoin, coingecko:ethereum).",
    example: "GET /prices/current/ethereum:0xA0b8…,coingecko:bitcoin (batch, comma-separated); /prices/historical/{ts}/{coins}; /chart/{coins}?span=…",
    limits: "Generous; batch up to ~100 coins per call; returns decimals + confidence per coin.",
  },
  {
    name: "DefiLlama protocols/TVL",
    baseUrl: "https://api.llama.fi",
    auth: "none",
    what: "Protocol TVL, chain TVL, DEX volumes, yields.",
    example: "GET /tvl/uniswap",
  },
  {
    name: "Chainlist chain registry",
    baseUrl: "https://chainid.network",
    auth: "none",
    what: "Canonical JSON of every EVM chain: chainId, native currency, public RPCs, explorers.",
    example: "GET /chains.json",
    limits: "Static file — cache it.",
  },
  {
    name: "LiFi (cross-chain routing)",
    baseUrl: "https://li.quest/v1",
    auth: "none",
    what: "Cross-chain + same-chain swap quotes with ready-to-sign transactionRequest.",
    example: "GET /quote?fromChain=…&toChain=…&fromToken=…&toToken=…&fromAmount=…&fromAddress=…&integrator=<your-name>",
    limits: "The `integrator` param is REQUIRED — omitting it returns HTTP 400.",
  },
  {
    name: "deBridge DLN",
    baseUrl: "https://dln.debridge.finance/v1.0",
    auth: "none",
    what: "Cross-chain order quotes/creation (DLN).",
    example: "GET /dln/order/create-tx?srcChainId=…&srcChainTokenIn=…&…",
  },
  {
    name: "Jupiter (Solana swaps)",
    baseUrl: "https://api.jup.ag",
    auth: "none",
    what: "Best-route Solana swap quote + unsigned swap transaction.",
    example: "GET /swap/v1/quote?inputMint=…&outputMint=…&amount=…",
    limits: "Rate-limited per IP on the free tier.",
  },
  {
    name: "GoPlus token security",
    baseUrl: "https://api.gopluslabs.io/api/v1",
    auth: "none",
    what: "Static token risk analysis: honeypot flags, taxes, owner powers, LP locks (EVM + Solana).",
    example: "GET /token_security/1?contract_addresses=0x…",
    limits: "Keyless tier is rate-limited; returns 4010/429 under load.",
  },
  {
    name: "honeypot.is",
    baseUrl: "https://api.honeypot.is/v2",
    auth: "none",
    what: "Live buy/sell simulation for honeypot detection (Ethereum, Base, BSC).",
    example: "GET /IsHoneypot?address=0x…&chainID=1",
  },
  {
    name: "4byte.directory",
    baseUrl: "https://www.4byte.directory/api/v1",
    auth: "none",
    what: "Function/event signature lookup by selector — decode calldata of UNVERIFIED contracts.",
    example: "GET /signatures/?hex_signature=0xa9059cbb",
  },
  {
    name: "Sourcify",
    baseUrl: "https://sourcify.dev/server",
    auth: "none",
    what: "Verified contract metadata + ABI by chainId/address (open alternative to explorer APIs).",
    example: "GET /files/any/1/0x…  (repo: https://repo.sourcify.dev)",
  },
  {
    name: "Etherscan V2 (multichain)",
    baseUrl: "https://api.etherscan.io/v2/api",
    auth: "free-key",
    what: "ABIs, source, txlists for 60+ chains through ONE endpoint via chainid=…",
    example: "GET ?chainid=8453&module=contract&action=getabi&address=0x…&apikey=KEY",
    limits: "One free key covers all chains (V2). 5 req/s free tier.",
  },
  {
    name: "CoinGecko",
    baseUrl: "https://api.coingecko.com/api/v3",
    auth: "optional-key",
    what: "Prices, market data, coin metadata.",
    example: "GET /simple/price?ids=ethereum&vs_currencies=usd",
    limits: "Keyless: ~5-15 req/min. Free demo key raises limits.",
  },
  {
    name: "Public RPCs (per chain)",
    baseUrl: "https://ethereum-rpc.publicnode.com",
    auth: "none",
    what: "Keyless JSON-RPC: publicnode (many chains), 1rpc.io, drpc.org, plus official ones (mainnet.base.org, arb1.arbitrum.io/rpc, polygon-rpc.com).",
    limits: "See rpc_gotchas: eth_getLogs and archive calls are heavily restricted on free tiers.",
  },
  {
    name: "Helius (Solana, free key)",
    baseUrl: "https://mainnet.helius-rpc.com/?api-key=KEY",
    auth: "free-key",
    what: "Production-grade Solana RPC + DAS API (getAsset/getAssetsByOwner for NFTs incl. compressed) + enhanced/parsed transaction API.",
    example: 'POST {"jsonrpc":"2.0","id":1,"method":"getAssetsByOwner","params":{"ownerAddress":"…"}}',
    limits: "Free tier is generous; the public solana RPC has no DAS API at all.",
  },
  {
    name: "Ethereum Beacon API (consensus layer)",
    baseUrl: "https://ethereum-beacon-api.publicnode.com",
    auth: "none",
    what: "Standard beacon-node REST API: validators, duties, finality checkpoints, blocks.",
    example: "GET /eth/v1/beacon/states/head/finality_checkpoints",
    limits: "For validator/staking data — execution-layer data stays on JSON-RPC.",
  },
  {
    name: "Solana public RPC",
    baseUrl: "https://api.mainnet-beta.solana.com",
    auth: "none",
    what: "Official public JSON-RPC (getBalance, getTokenAccountsByOwner, sendTransaction, getRecentPrioritizationFees for priority-fee tuning).",
    example: 'POST {"jsonrpc":"2.0","id":1,"method":"getRecentPrioritizationFees","params":[[]]}',
    limits: "Strictly rate-limited and no historical data — production agents should bring a free Helius/Alchemy/QuickNode key. publicnode alternative: https://solana-rpc.publicnode.com.",
  },
  {
    name: "MEV-protected RPCs (Ethereum)",
    baseUrl: "https://rpc.flashbots.net",
    auth: "none",
    what: "Send transactions privately to avoid sandwiching. Alternative: https://rpc.mevblocker.io.",
  },
  {
    name: "x402 facilitator (keyless)",
    baseUrl: "https://facilitator.xpay.sh",
    auth: "none",
    what: "Verify + settle x402 machine payments (USDC on Base) without any account/KYB — POST /verify and /settle.",
    limits: "See the x402_payments guide for the full client+server flow.",
  },
  {
    name: "OpenSea REST API v2",
    baseUrl: "https://api.opensea.io/api/v2",
    auth: "free-key",
    what: "NFT/collection data, floor prices, listings/offers, events, swap quotes across chains.",
    example: "GET /collections/{slug} with header x-api-key: KEY — a free key is issued WITHOUT signup: POST /auth/keys",
    limits: "Free tier ~60 reads/min, 5 writes/min.",
  },
  {
    name: "mempool.space (Bitcoin)",
    baseUrl: "https://mempool.space/api",
    auth: "none",
    what: "Bitcoin fees, addresses, transactions, blocks — fully keyless.",
    example: "GET /v1/fees/recommended → {fastestFee, halfHourFee, hourFee, economyFee, minimumFee} in sat/vB; GET /address/{addr}; POST /tx (broadcast raw hex)",
    limits: "Generous public tier; self-hostable.",
  },
  {
    name: "Blockstream Esplora (Bitcoin)",
    baseUrl: "https://blockstream.info/api",
    auth: "none",
    what: "Second independent keyless Bitcoin API (same Esplora schema): addresses, UTXOs, tx broadcast, blocks.",
    example: "GET /blocks/tip/height; GET /address/{addr}/utxo; POST /tx",
    limits: "Use as failover for mempool.space (and vice versa).",
  },
  {
    name: "OpenSea MCP server",
    baseUrl: "https://mcp.opensea.io/mcp",
    auth: "free-key",
    what: "Official MCP server for agents: token prices/swaps, collection research, wallet portfolios, trending assets, drops, and searching the ERC-8257 agent-tool registry.",
    example: "Streamable HTTP; auth via X-API-KEY or Authorization: Bearer. Remember Accept: application/json, text/event-stream.",
    limits: "Same free-tier key as the REST API (POST https://api.opensea.io/api/v2/auth/keys).",
  },
];

export interface ErrorEntry {
  pattern: string;
  cause: string;
  fix: string;
}

export const COMMON_ERRORS: ErrorEntry[] = [
  {
    pattern: "nonce too low / replacement transaction underpriced",
    cause: "Reusing a mined nonce, or resubmitting with the same nonce without raising fees.",
    fix: "Fetch eth_getTransactionCount(address, 'pending') fresh; to replace a stuck tx, resend the SAME nonce with maxFeePerGas AND maxPriorityFeePerGas raised >=10%.",
  },
  {
    pattern: "insufficient funds for gas * price + value",
    cause: "Balance < value + gasLimit*maxFeePerGas (the MAX fee is reserved upfront, not the actual fee).",
    fix: "Lower value or maxFeePerGas, or top up. Remember L1 data fees on L2s (Base/OP/Arbitrum) are charged on top.",
  },
  {
    pattern: "execution reverted (no reason)",
    cause: "Require/custom error in the contract; raw RPCs often swallow the reason.",
    fix: "Dry-run it with this server's `simulate` tool — it decodes revert reasons and custom errors (4byte fallback) before you sign.",
  },
  {
    pattern: "ERC20: transfer amount exceeds allowance / TRANSFER_FROM_FAILED",
    cause: "Spender allowance too low (or token uses non-standard return values).",
    fix: "Check allowance first (portfolio tool: allowance action), then approve the exact spender. Some tokens (USDT) require approving 0 before changing a non-zero allowance.",
  },
  {
    pattern: "max fee per gas less than block base fee",
    cause: "maxFeePerGas below current baseFee (spiking gas).",
    fix: "Re-quote EIP-1559 fees (profitability tool) and set maxFeePerGas ~= 2*baseFee + priorityFee headroom.",
  },
  {
    pattern: "gas required exceeds allowance / out of gas",
    cause: "eth_estimateGas failed (the call reverts) or the gasLimit was set below the estimate.",
    fix: "If estimateGas itself reverts, the tx would fail — simulate first. Otherwise add 10-20% buffer on the estimate.",
  },
  {
    pattern: "Solana: Blockhash not found / block height exceeded",
    cause: "Transaction used an expired recent blockhash (~60-90s validity).",
    fix: "Fetch a fresh blockhash right before signing; for congested periods add a priority fee (ComputeBudgetProgram.setComputeUnitPrice).",
  },
  {
    pattern: "Solana: insufficient funds for rent",
    cause: "Account creation (e.g. an ATA, ~0.002 SOL) needs rent-exempt lamports the payer doesn't have.",
    fix: "Fund the payer with enough SOL for rent + fees; creating token accounts and pump.fun launches (~0.009 SOL rent) are NOT free.",
  },
  {
    pattern: "Solana: custom program error 0x1",
    cause: "Most commonly: insufficient token/lamport balance inside the invoked program.",
    fix: "Check token balance AND that the source ATA exists; decode program-specific errors from the program's IDL when available.",
  },
  {
    pattern: "eth_getLogs: range/limit errors on public RPCs",
    cause: "Free tiers cap block ranges hard (or require archive access).",
    fix: "Chunk requests (drpc.org free allows <=10k blocks; many others 500-2k; publicnode may require an archive token entirely). Filter by topic0 and address to shrink responses.",
  },
  {
    pattern: "Bitcoin: dust output / min relay fee not met",
    cause: "An output below the dust limit (~546 sats for P2PKH, ~294 for P2WPKH) or a tx paying under ~1 sat/vB is rejected by relay policy.",
    fix: "Merge tiny outputs into change, and set the feerate from mempool.space /v1/fees/recommended (sat/vB × estimated vsize).",
  },
  {
    pattern: "Bitcoin: bad-txns-inputs-missingorspent",
    cause: "An input UTXO was already spent (race with another tx, e.g. an RBF replacement) or never existed.",
    fix: "Re-fetch UTXOs (GET /address/{addr}/utxo) right before building; if you replaced a tx via RBF, the old inputs are gone.",
  },
  {
    pattern: "HTTP 429 / rate limited",
    cause: "Free API/RPC tier exhausted.",
    fix: "Exponential backoff + failover to the next public endpoint (this server's chain registry ships multiple RPCs per chain). Cache aggressively.",
  },
];

export interface RpcGotcha {
  topic: string;
  detail: string;
}

export const RPC_GOTCHAS: RpcGotcha[] = [
  {
    topic: "eth_getLogs on free RPCs",
    detail: "publicnode rejects it without an archive token; drpc.org free caps ranges at 10,000 blocks; ankr/merkle need keys. Chunk by block range and always filter by address + topic0.",
  },
  {
    topic: "Decoding large `bytes` returns via libraries",
    detail: "Some public RPCs return data that makes high-level decoders throw (e.g. 'number not in safe integer range'). Fall back to a raw eth_call ({to, data} with the 4-byte selector + padded args) and decode the hex manually.",
  },
  {
    topic: "eth_estimateGas is a simulation",
    detail: "If it reverts, your tx would revert — treat estimate failures as a pre-flight rejection, not an RPC bug. Simulate with the exact from/value/state you will sign with.",
  },
  {
    topic: "JSON-RPC batching",
    detail: "Not all public endpoints allow batched arrays; some silently cap batch size. Multicall3 via a single eth_call is the more portable way to batch reads.",
  },
  {
    topic: "L2 fees are two-dimensional",
    detail: "On OP-Stack + Arbitrum the L1 data fee is charged on top of the L2 execution fee; eth_estimateGas alone understates total cost. Use fee-estimation endpoints (or this server's profitability tool).",
  },
  {
    topic: "MCP Streamable HTTP Accept header",
    detail: "MCP servers answer 406 unless the client sends BOTH application/json and text/event-stream in Accept. When building MCP clients, always set: Accept: application/json, text/event-stream.",
  },
];

export const REFERENCE_KINDS = ["addresses", "endpoints", "errors", "rpc_gotchas"] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

export function getReference(kind: ReferenceKind): unknown {
  switch (kind) {
    case "addresses":
      return { count: ADDRESSES.length, entries: ADDRESSES };
    case "endpoints":
      return { count: ENDPOINTS.length, entries: ENDPOINTS };
    case "errors":
      return { count: COMMON_ERRORS.length, entries: COMMON_ERRORS };
    case "rpc_gotchas":
      return { count: RPC_GOTCHAS.length, entries: RPC_GOTCHAS };
  }
}
