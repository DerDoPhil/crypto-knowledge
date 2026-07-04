# Crypto-Knowledge — Wissens-Sweep Roadmap

Laufender autonomer Ausbau des Chain-Brains (Tool #71 auf OpenSea). Jeder Block:
**recherchieren → LIVE verifizieren (curl/eth_call) → einbauen → tsc + vitest → deploy →
list_topics-Check → Hash-Regression (`0x6d9f34e5…`) → commit+push**. Nichts aus dem
Gedächtnis; jede Adresse/jeder Endpunkt wird vor Einbau live geprüft.

Stand: **64 Guides, 17 Sektionen, ~55 Endpunkte** (Blöcke 1–31 erledigt).

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
- [ ] 1inch / 0x / Paraswap Swap-Aggregator-APIs (Key-Status prüfen)
- [ ] Kyberswap Aggregator API (oft keyless)
- [ ] Odos / Enso Routing-APIs
- [ ] Dune API (Query-Execution, free tier)
- [ ] Allium / Transpose (falls keyless-tier)
- [ ] DIA Oracle API (keyless prices)
- [ ] RedStone Oracle (pull-model, wie Pyth)
- [ ] Chainlink CCIP (cross-chain, Router-Adresse verifizieren)
- [ ] Across Protocol (fast bridge) API
- [ ] Socket/Bungee Bridge-Aggregator API
- [ ] Tenderly Simulation API (free tier)
- [ ] Etherscan Gas-Oracle (V2) als eigener Eintrag
- [ ] Solscan / SolanaFM (aktuellen Key-Status verifizieren)
- [ ] Birdeye (Solana token data, key-status)
- [ ] DexScreener API (keyless token/pair data — sehr nützlich)
- [ ] GeckoTerminal API (on-chain DEX prices, keyless)
- [ ] Blockdaemon / Ankr free-RPC-Status
- [ ] Reservoir (NFT aggregator API) / OpenSea Stream
- [ ] Farcaster Frames v2 / Warpcast API-Details

## 🔜 TODO — Strategie / Domänen-Wissen
- [ ] Copy-Trading-Bot-Detail (Wallet-Discovery, Sizing, Blocklists)
- [ ] Sniping-Detail (EVM launch-detection vs Solana pump.fun)
- [ ] Grid/DCA-Bot-Detail (Range, Rebalancing)
- [ ] Statistical Arbitrage / Basis-Trade (Perp-Funding vs Spot)
- [ ] JIT-Liquidity / Uniswap-v3-v4-Hook-Strategien
- [ ] Flash-Loan-Muster generell (Aave/Balancer/Morpho, use-cases)
- [ ] Token-Launch-Mechaniken (Fair-Launch, bonding curves, LBPs)
- [ ] Airdrop-Farming-Mechanik (Sybil-Risiko, eligibility patterns)
- [ ] Portfolio-Rebalancing / Risk-Parity für Agents
- [ ] Stablecoin-Mechaniken (fiat vs crypto-backed vs algo, depeg-Signale)
- [ ] Governance-Attacken / Timelock-Analyse
- [ ] Rugpull-Forensik (Post-Mortem-Muster über security-Tool hinaus)
- [ ] Wash-Trading-/Volumen-Fake-Erkennung
- [ ] Gas-Optimierung für Contracts (Storage-Packing, calldata)
- [ ] Upgradeable-Contracts (Proxy-Patterns, Storage-Kollisionen)

## 🔜 TODO — Chain-spezifische Tiefe (BTC/ETH/SOL Fokus)
- [ ] Bitcoin: Taproot/Miniscript, PSBT-v2, Lightning-Basics
- [ ] Bitcoin: Runes-Etching/Minting-Detail
- [ ] Ethereum: Blob-Txs (EIP-4844) für L2-Kosten
- [ ] Ethereum: Verkle/Statelessness-Ausblick (nur wenn stabil)
- [ ] Solana: Address-Lookup-Tables (Tx-Size)
- [ ] Solana: Versioned-Transactions-Detail
- [ ] Solana: Token-Extensions (Token-2022 transfer-hooks/fees) Detail
- [ ] Solana: Priority-Fee-Markt + Jito-Tip-Strategie Detail

## 🔜 TODO — Tool-/Produkt-Verbesserungen (Aufbau)
- [ ] `ask` weiter tunen (Synonyme, Stemming light)
- [ ] Guide-Cross-Links prüfen (referenzierte Topics existieren)
- [ ] llms.txt um die neuen Kategorien erweitern
- [ ] Optional (Philipp-Freigabe): Contribution-Feature (Vault-Idee)
- [ ] Optional (Philipp-Freigabe): Cloudflare Monetization Gateway anschließen

> Reihenfolge flexibel; DeFi-Aggregatoren (DexScreener/GeckoTerminal/1inch) und
> Strategie-Tiefe zuerst, da höchster Agent-Nutzen.
