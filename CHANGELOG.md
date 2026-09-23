# Changelog

## Unreleased — 2026-09-24: knowledge tool is gated again — free for Auditors NFT holders

Product decision (Philipp): reverts 2026-09-20 ("free for everyone"). The `knowledge` tool
(ERC-8257 tool #71, Ethereum Mainnet) is gated like every other tool again, but with a real
on-chain NFT-holder free tier — this time pointing at Auditors instead of the old, removed
2026-07-14 Normies collection. The earlier Normies gate lived on the Base-registered listing
and never actually worked (a Base predicate can't verify a Mainnet collection, so it always
fell back to open); this one is wired to tool #71, which is registered on Mainnet itself, so
the on-chain check is same-chain and actually enforceable.

- `src/access/holder.ts` (new): on-chain `balanceOf` check against `HOLDER_NFT_CONTRACT`
  (Auditors, `0xa0d2B2Fe20f27bF6bfA1971d41F8B7bF7B3111e6`), 5-min TTL cache. Proof is a
  day-bound wallet signature (`X-Wallet` + `X-Wallet-Signature`, EIP-191 `personal_sign`,
  verified locally with no RPC call) — the design sketched in Groks-ToDo.md that was never
  wired up before.
- `src/access/gate.ts` / `enforce.ts`: `knowledge` removed from `FREE_TOOLS`; a valid
  wallet-proof + positive Auditors balance grants the `holder` tier (free, same limits the
  old Normies tier had) ahead of the x402 fallback. The 402 body now includes a
  `holderAccess` block describing the free path.
- `api/tools/knowledge.ts`: the `AccessEnforcer` call removed 2026-09-20 is back (same
  pattern the tool used pre-09-20, now backed by the holder path instead of pure x402).
- Manifests: `public/.well-known/ai-tool/crypto-knowledge.json` (the one actually live for
  tool #71 — verified via a raw `getToolConfig(71)` eth_call, NOT the broader
  `public/.well-known/erc8257-manifest.json` used by the Base listing, which was also
  updated for consistency even though its own gate was never functional) gets an
  `access`/`io.opensea.access`/`io.dophil.authentication` block back, Auditors instead of
  Normies, version 1.6.0.
- Agent-facing texts (skill, quickstart, adoption prompt, llms.txt, skill.md, landing,
  README) updated to state the real price again instead of claiming free-for-everyone.
- `scripts/set-gate-71-auditors.ts` (new): the on-chain runbook — `setCollections(71,
  [Auditors])` + `updateToolMetadata(71, newHash)` in one script, same "you run this, not
  Claude" pattern as every other on-chain script in this repo. `scripts/diag-71.ts` (new):
  read-only diagnostic, fixes the `getToolConfig` ABI-decode bug the old `diag-onchain.ts`
  had (viem's `readContract` throws on it; read raw and grep the URL out instead).
- Tests: `tests/enforce.test.ts` — `knowledge` gated again, plus 3 new cases for the holder
  path (valid signature + balance → free, valid signature + zero balance → 402, forged
  signature → 402 with no RPC call made). 63 tests green; the 3 pre-existing failing suites
  (`GITHUB_CONTENT_TOKEN` missing locally, a `@solana/web3.js`/`rpc-websockets` ESM bug) are
  unrelated — confirmed identical on a clean `git stash` of this change.

## Unreleased — 2026-09-20: knowledge tool is FREE

Product decision (Philipp): the `knowledge` tool (ERC-8257 tool #71 on OpenSea) no longer costs anything.

- `src/access/enforce.ts`: `knowledge` joins `catalog` in `FREE_TOOLS` → no x402 on `/mcp` either; every other tool stays $0.01 x402.
- `api/tools/knowledge.ts`: enforcement removed (all actions free).
- Manifest 1.5.0: `pricing` array and `x402` tag removed, "free" advertised; on-chain hash updated via `updateToolMetadata(71)`.
- Agent-facing texts (skill, quickstart, adoption prompt, llms.txt, skill.md, landing) no longer claim a price.
- Tests: `isGatedCall`/`AccessEnforcer` cover "knowledge free, everything else gated".

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
