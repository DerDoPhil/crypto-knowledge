# Changelog

## 0.1.0 — 2026-06-30 (initial build, autonomous session)

First working release. MCP server (stdio + Streamable HTTP), keystore-free,
multi-tenant, chain-agnostic. 44 unit tests + MCP smoke + live on-chain checks.

### Tools (10)
- `route` — cross-chain routing via LiFi **+ deBridge** (parallel, best + alternatives)
- `pumpfun` — on-chain bonding curve + IPFS metadata
- `profitability` — EIP-1559 gas + net-profit verdict
- `abi` — Etherscan V2 / Sourcify ABI, EIP-1967 proxy follow, decode/encode (cached)
- `portfolio` — multi-chain balances + allowance check/approve/revoke
- `security` — GoPlus **+ honeypot.is**, EVM **and Solana**, 0-100 risk score
- `mev_protection` — Flashbots Protect / MEV Blocker guidance + per-chain risk
- `whale_watch` — recent large ERC-20 transfers via getLogs
- `solana_swap` — Jupiter quote + build (unsigned tx)
- `catalog` — capability / chain discovery

### Chains (10)
Ethereum, Base, Arbitrum, Optimism, Polygon, Cronos, ApeChain, BNB Smart Chain,
Avalanche, Solana.

### Infrastructure
- Core: envelope format, canonical error codes (incl. 401-as-rate-limit quirk),
  retry/backoff fetch, JSON-RPC helpers, provider resolver (open/own_key/tool)
- TTL cache (ABI 1h, price 30s, GoPlus 5m) — protects operator provider quotas
- Access: sliding-window rate limiter, on-chain NFT gate, x402 building blocks
- Hosting: HTTP MCP server, /llms.txt, landing page, Dockerfile, context7.json

### Known gaps / next
- pump.fun direct on-chain buy/sell tx (the published `@pump-fun/pump-sdk` errors
  on import in plain Node — deferred; graduated tokens are covered by `solana_swap`)
- x402 payment flow wiring (gated on operator treasury — see docs/GO-LIVE.md)
- whale_watch full data needs a keyed RPC (public RPCs throttle eth_getLogs)
