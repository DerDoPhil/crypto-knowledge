/** Static discovery content served by the hosted HTTP server. */

export const LLMS_TXT = `# Crypto-Knowledge

> The on-chain brain for autonomous AI agents. An MCP server that lets agents
> perform cross-chain routing, contract decoding, portfolio & allowance
> management, gas/profit estimation and anti-rug security checks — safely and
> deterministically. Keystore-free: it never holds keys and returns only
> unsigned transactions for the agent to sign.

## Connect (MCP, Streamable HTTP)

POST /mcp  — JSON-RPC 2.0 over Streamable HTTP (Model Context Protocol)

## Tools

- route: best cross-chain route (LiFi + deBridge), e.g. CRO -> SOL, with a ready-to-sign tx
- pumpfun: on-chain pump.fun bonding-curve, price, graduation progress, IPFS metadata
- profitability: EIP-1559 gas estimate + net-profit verdict (arbitrage guard)
- abi: fetch any verified EVM ABI (Etherscan V2 / Sourcify), follow EIP-1967 proxies, decode/encode calldata
- portfolio: multi-chain balances (native + ERC-20 + SPL) and allowance check/approve/revoke
- security: anti-rug scan (GoPlus), EVM + Solana, 0-100 risk score
- mev_protection: private-RPC guidance (Flashbots Protect, MEV Blocker) + per-chain sandwich risk

## Chains

Ethereum, Base, Arbitrum, Polygon, Cronos, ApeChain, Solana.

## Access

Provider modes per call: open (public RPC), own_key (bring your own Helius/Alchemy key, recommended), tool (operator key, gated).
Optionally NFT-gated for free access, otherwise pay-per-request via x402.

## Source

https://github.com/derdophil/crypto-knowledge
`;

export const LANDING_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Crypto-Knowledge — On-chain brain for AI agents</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; font:16px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace; background:#0b0d10; color:#e6e8eb; }
  main { max-width:760px; margin:0 auto; padding:64px 24px; }
  h1 { font-size:28px; margin:0 0 4px; }
  .sub { color:#8b929c; margin:0 0 32px; }
  code { background:#15181d; padding:2px 6px; border-radius:6px; color:#7ee3c7; }
  .grid { display:grid; gap:10px; margin:24px 0; }
  .tool { background:#12151a; border:1px solid #1d222b; border-radius:10px; padding:12px 14px; }
  .tool b { color:#7ee3c7; }
  a { color:#7ee3c7; }
  .pill { display:inline-block; background:#15181d; border:1px solid #1d222b; border-radius:999px; padding:2px 10px; margin:2px; font-size:13px; color:#aeb4bd; }
</style>
</head>
<body><main>
  <h1>Crypto-Knowledge</h1>
  <p class="sub">The on-chain brain for autonomous AI agents — keystore-free MCP server.</p>
  <p>Connect via MCP Streamable HTTP: <code>POST /mcp</code> &nbsp;·&nbsp; <a href="/llms.txt">/llms.txt</a></p>
  <div class="grid">
    <div class="tool"><b>route</b> — best cross-chain route (LiFi + deBridge), e.g. CRO → SOL</div>
    <div class="tool"><b>pumpfun</b> — on-chain bonding curve, price, graduation, IPFS metadata</div>
    <div class="tool"><b>profitability</b> — EIP-1559 gas + net-profit verdict</div>
    <div class="tool"><b>abi</b> — fetch/parse any verified EVM ABI, follow proxies, decode/encode</div>
    <div class="tool"><b>portfolio</b> — multi-chain balances + allowance manager</div>
    <div class="tool"><b>security</b> — anti-rug scan (EVM + Solana), 0–100 risk score</div>
    <div class="tool"><b>mev_protection</b> — private-RPC guidance vs sandwich attacks</div>
  </div>
  <div>
    <span class="pill">Ethereum</span><span class="pill">Base</span><span class="pill">Arbitrum</span>
    <span class="pill">Polygon</span><span class="pill">Cronos</span><span class="pill">ApeChain</span><span class="pill">Solana</span>
  </div>
</main></body>
</html>`;
