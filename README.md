# Crypto-Knowledge

**The on-chain brain for autonomous AI agents.** An [MCP](https://modelcontextprotocol.io) server that lets agents perform complex crypto operations — cross-chain routing, contract decoding, portfolio & allowance management, gas/profit estimation and anti-rug security checks — safely and deterministically.

> **Keystore-free by design.** The server never holds private keys and never signs. Every write action returns an *unsigned, ready-to-sign transaction*; the agent signs it with its own wallet. The server is multi-tenant and stateless — bring your own address, get back data + unsigned transactions.

## Tools (9)

| Tool | What it does |
|---|---|
| `route` | Best cross-chain route between any chains/tokens (e.g. CRO → SOL). Queries **LiFi + deBridge** in parallel, compares output, returns the best route plus alternatives, each with a ready-to-sign transaction. |
| `pumpfun` | Direct on-chain pump.fun reads: live bonding-curve reserves, price, graduation progress, market cap, and resolved IPFS metadata. |
| `profitability` | EIP-1559 multi-chain gas estimation + net-profit verdict after gas & slippage (arbitrage guard). |
| `abi` | Fetch any verified EVM contract's ABI (Etherscan V2 / Sourcify), follow EIP-1967 proxies, and tell the agent exactly which parameters each function needs. Decode/encode calldata. Cached. |
| `portfolio` | Multi-chain balances (native + ERC-20 + SPL) and ERC-20 allowance management (check / approve / revoke) returning unsigned transactions. |
| `security` | Anti-rug scan via **GoPlus + honeypot.is** (EVM **and Solana**): honeypot/non-transferable, taxes, liquidity locks, mint/freeze/blacklist/pause powers, holder concentration → 0-100 risk score with red flags. |
| `mev_protection` | Private-RPC guidance (Flashbots Protect, MEV Blocker) + per-chain sandwich risk so the agent broadcasts safely. |
| `whale_watch` | Recent large ERC-20 transfers ("whale moves") for a token over a block window, decoded + sorted. |
| `catalog` | Discovery: lists every tool, supported chain (id/native asset) and provider mode so an agent can self-configure. |

## Supported chains

Ethereum, Base, Arbitrum, Optimism, Polygon, **Cronos**, ApeChain, BNB Smart Chain, Avalanche, Solana (10). Chain-agnostic by design — adding a chain is a single registry entry (`src/registry/chains.ts`).

## Quick start

```bash
npm install
cp .env.example .env   # optional keys — everything degrades to public RPC without them
npm test               # 31 deterministic unit tests
npm run dev            # run the MCP server over stdio
```

### Use it from an MCP client (e.g. Claude Code)

```json
{
  "mcpServers": {
    "crypto-knowledge": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/Crypto-Knowledge/src/index.ts"]
    }
  }
}
```

## Provider modes (per call)

The caller chooses how RPC/data is sourced:

- **`open`** — public RPCs only. Free, but limited data (e.g. no ERC-20 auto-discovery) and lower rate limits.
- **`own_key`** ⭐ *recommended* — pass your own free `heliusKey` / `alchemyKey`. Best performance, your quota. Keys are used transiently and never stored or logged.
- **`tool`** — use the operator's keys (never exposed). Reserved for NFT-holders / paid tier when access gating is enabled.

> Get a free key at [helius.dev](https://helius.dev) (Solana) and [alchemy.com](https://alchemy.com) (EVM). The tool will nudge you when you're on a degraded public RPC.

## Access & monetization (hosted mode)

When `ACCESS_GATING_ENABLED=true` (off by default for local stdio use):

- **Holder** — owns the configured gating NFT (on-chain verified) → free, higher limits, may use the tool's keys.
- **Paid** — \$0.10 per request via [x402](https://x402.org).
- **Free** — public-RPC tier with conservative limits.

## Architecture

```
agent ──▶ MCP tools (6 modules)
            └─ core: RPC pool · retry/backoff · canonical errors · provider resolver
            └─ access: sliding-window rate limit · NFT gate
          returns ONLY unsigned tx + data → agent signs locally
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design, JSON I/O specs and R&D roadmap.

## Security

- No private keys, ever. Read + build-unsigned-tx only.
- Operator keys are server-side only and never echoed to callers.
- Caller-supplied keys are transient (never persisted/logged).

## License

MIT
