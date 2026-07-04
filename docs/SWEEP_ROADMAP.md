# Crypto-Knowledge — Wissens-Sweep Roadmap

Laufender autonomer Ausbau des Chain-Brains (Tool #71 auf OpenSea). Jeder Block:
**recherchieren → LIVE verifizieren (curl/eth_call) → einbauen → tsc + vitest → deploy →
list_topics-Check → Hash-Regression (`0x6d9f34e5…`) → commit+push**. Nichts aus dem
Gedächtnis; jede Adresse/jeder Endpunkt wird vor Einbau live geprüft.

Stand: **85 Guides, 19 Sektionen, ~60 Endpunkte** (Blöcke 1–46 erledigt; Manifest v1.2.0, Baseline 0x72930764…).

## ✅ Erledigt (Blöcke 1–31)
Wallets/Deploys/Vanity/Verify, EIP-712/1271, ERC-20/Permit2, Tx-Debug/Confirm, Event-Logs,
x402, Multicall, SIWE, ERC-8257-Register, EIP-7702, Solana Pay, ENS, AA-4337, Safe-Multisig,
Anchor, Solana-Subscriptions/Staking/cNFTs/SPL, Bitcoin-Basics/Ordinals, NFT-Metadata/IPFS/Seaport,
CCTP, Uniswap-v4, L2-Bridging, Cross-Chain-Tracking, Aave/Morpho-Lending, ERC-4626, Stableswap,
Chainlink/Pyth-Oracles, Oracle-Safety, DeFi-Yield/Farming, Perps (GMX/Hyperliquid/Funding),
DAO-Governance, Prediction-Markets, Arbitrage, Trading-Bots, MEV, Liquidations, Farcaster.
Endpunkte: DefiLlama-Familie, Chainlist, LiFi, deBridge, Jupiter(+Price), GoPlus, honeypot,
4byte, Sourcify, Etherscan-V2, CoinGecko, Blockscout, mempool/Blockstream, Solana-RPC/Helius/Jito,
Beacon/beaconcha, Flashbots/MEV-Blocker, xpay/x402-Router/Cloudflare, OpenSea-REST/MCP, TheGraph,
Uniswap-Lists, CoW, Snapshot, Hyperliquid, LayerZero/Wormholescan, MagicEden, Ordiscan, Neynar,
Pyth-Hermes, Circle-Iris, Curve, Morpho, GMX, Polymarket, Safe-TxService.

## 🔜 TODO — Endpunkte / Protokolle (live-verifizieren!)
- [ ] Balancer v2/v3 Batch-Swaps + weighted pools (Vault schon als Adresse drin)
- [x] 1inch / 0x / Paraswap Swap-Aggregator-APIs (Key-Status prüfen) — Block33 (KyberSwap keyless, 1inch/0x free-key)
- [x] Kyberswap Aggregator API (oft keyless) — Block33 ✅
- [x] Odos / Enso Routing-APIs — Block33 (Odos keyless) ✅
- [x] Dune API (Query-Execution, free tier) — Block35 ✅
- [ ] Allium / Transpose (falls keyless-tier)
- [x] DIA Oracle API (keyless prices) — Block35 ✅
- [x] RedStone Oracle (pull-model, wie Pyth) — Block35 ✅
- [x] Chainlink CCIP (cross-chain, Router-Adresse verifizieren) — Block34 ✅
- [x] Across Protocol (fast bridge) API — Block34 ✅
- [x] Socket/Bungee Bridge-Aggregator API — Block34 (Socket=free-key) ✅
- [ ] Tenderly Simulation API (free tier)
- [ ] Etherscan Gas-Oracle (V2) als eigener Eintrag
- [ ] Solscan / SolanaFM (aktuellen Key-Status verifizieren)
- [x] Birdeye (Solana token data, key-status) — Block42 (Jupiter-Token-API keyless; Birdeye=free-key) ✅
- [x] DexScreener API (keyless token/pair data) — Block 32 ✅
- [x] GeckoTerminal API (on-chain DEX prices, keyless) — Block 32 ✅
- [ ] Blockdaemon / Ankr free-RPC-Status
- [ ] Reservoir (NFT aggregator API) / OpenSea Stream
- [ ] Farcaster Frames v2 / Warpcast API-Details

## 🔜 TODO — Strategie / Domänen-Wissen
- [x] Copy-Trading-Bot-Detail (Wallet-Discovery, Sizing, Blocklists) — Block41 ✅
- [x] Sniping-Detail (EVM launch-detection vs Solana pump.fun) — Block41 ✅
- [x] Grid/DCA-Bot-Detail (Range, Rebalancing) — Block41 ✅
- [x] Statistical Arbitrage / Basis-Trade (Perp-Funding vs Spot) — Block45 (basis_trade) ✅
- [ ] JIT-Liquidity / Uniswap-v3-v4-Hook-Strategien
- [x] Flash-Loan-Muster generell (Aave/Balancer/Morpho, use-cases) — Block38 ✅
- [x] Token-Launch-Mechaniken (Fair-Launch, bonding curves, LBPs) — Block43 ✅
- [x] Airdrop-Farming-Mechanik (Sybil-Risiko, eligibility patterns) — Block38 ✅
- [x] Portfolio-Rebalancing / Risk-Parity für Agents — Block45 ✅
- [x] Stablecoin-Mechaniken (fiat vs crypto-backed vs algo, depeg-Signale) — Block38 ✅
- [x] Governance-Attacken / Timelock-Analyse — Block44 ✅
- [x] Rugpull-Forensik (Post-Mortem-Muster über security-Tool hinaus) — Block40 ✅
- [x] Wash-Trading-/Volumen-Fake-Erkennung — Block44 ✅
- [x] Gas-Optimierung für Contracts (Storage-Packing, calldata) — Block37 ✅
- [x] Upgradeable-Contracts (Proxy-Patterns, Storage-Kollisionen) — Block40 ✅

## 🔜 TODO — Chain-spezifische Tiefe (BTC/ETH/SOL Fokus)
- [x] Bitcoin: Taproot/Miniscript, PSBT-v2, Lightning-Basics — Block39 ✅
- [ ] Bitcoin: Runes-Etching/Minting-Detail
- [x] Ethereum: Blob-Txs (EIP-4844) für L2-Kosten — Block37 ✅
- [ ] Ethereum: Verkle/Statelessness-Ausblick (nur wenn stabil)
- [x] Solana: Address-Lookup-Tables (Tx-Size) — Block36 ✅
- [x] Solana: Versioned-Transactions-Detail — Block36 ✅
- [x] Solana: Token-Extensions (Token-2022 transfer-hooks/fees) Detail — Block36 ✅
- [ ] Solana: Priority-Fee-Markt + Jito-Tip-Strategie Detail

## 🔜 TODO — Tool-/Produkt-Verbesserungen (Aufbau)
- [x] `ask` weiter tunen (Synonyme, Stemming light) — Block46 (Synonyms+Stopwords) ✅
- [x] Guide-Cross-Links prüfen (referenzierte Topics existieren) — Block46 (0 tote) ✅
- [x] llms.txt um die neuen Kategorien erweitern — Block46 ✅
- [ ] Optional (Philipp-Freigabe): Contribution-Feature (Vault-Idee)
- [ ] Optional (Philipp-Freigabe): Cloudflare Monetization Gateway anschließen

> Reihenfolge flexibel; DeFi-Aggregatoren (DexScreener/GeckoTerminal/1inch) und
> Strategie-Tiefe zuerst, da höchster Agent-Nutzen.
