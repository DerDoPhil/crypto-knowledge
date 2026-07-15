# Crypto-Knowledge — Wissens-Sweep Roadmap

Laufender autonomer Ausbau des Chain-Brains (Tool #71 auf OpenSea). Jeder Block:
**recherchieren → LIVE verifizieren (curl/eth_call) → einbauen → tsc + vitest → deploy →
list_topics-Check → Hash-Regression (`scripts/check-hash-71.ts` + tool-sdk hash, Baseline
`0x6305190e…240e`) → commit+push**. Nichts aus dem Gedächtnis; jede Adresse/jeder
Endpunkt wird vor Einbau live geprüft.

Stand: **158 Guides, 21 Sektionen, 78 Endpunkte** (Blöcke 1–91 erledigt; **Manifest v1.4.0, Baseline `0x575dfe50…5219`**).

### 🔓 ACCESS-MODELL GEÄNDERT (2026-07-14, Philipp): Normie-Gate RAUS + Preis $0.02→$0.01
Reines x402-Pay-per-call für alle, KEIN NFT-Gate mehr. Server (config.ts priceAtomic=10000, enforce.ts
Holder-Pfad entfernt, gate.ts NFT-Check raus) + Manifest (access + io.opensea.access ENTFERNT, pricing 10000,
v1.4.0) + alle user-facing Texte + skill.md. **On-chain (creator #2 0x6f35): updateToolMetadata(71) tx
0x48ed6f01 → neue Hash-Baseline `0x575dfe50241ec86f552cc8ac87e6d9082cfe224484316c87d998c143b1915219`
(ersetzt 0xe0a6553a); setCollections(71,[]) tx 0xc5f80cdb → getRequirements(71)=0, Gate weg.** Live verifiziert
(402→$0.01/10000 ohne holderAccess, Manifest v1.4.0 kein access, on-chain Hash+getRequirements). vitest 75
(3 Holder-Tests entfernt). **NEUE REGRESSION-BASELINE für künftige Blöcke: 0x575dfe50 (nicht mehr 0xe0a6553a).**


### Block 91 (2026-07-13/14) — Sonic-Playbook + Solana-DEXe (2 Opus-Agenten)
2 Guides, alle Adressen/Programm-IDs selbst live-verifiziert: **sonic_playbook** (10. Chain-Playbook; chainId 146, ~1.4s Blöcke,
keyless rpc.soniclabs.com; wS+USDC(6); Shadow-DEX kreuz-verifiziert legacy-Router factory()→pair-factory UND WETH()→wS,
CL-Router WETH9()→wS; Aave-v3 ADDRESSES_PROVIDER kreuz-verifiziert; FeeM-Edge selfRegister→90% Gas-Rebate; ehrlicher Vorbehalt:
Airdrop endete Nov 2025) · **solana_dex_amms** (Lücke: kein direkter Solana-DEX-Guide; Orca/Raydium/Meteora ALLE executable
selbst geprüft, Raydium keyless Swap-API, CLMM-ticks-vs-DLMM-bins, Jupiter-vs-direkt, „h"-vs-„P"-Stable-Falle gefangen).
ADDRESSES +Sonic +Solana-DEX; ENDPOINTS +Solana-DEX-APIs +Sonic-RPC. **NEUE REGEL: about.html-Übersicht (Guide/Endpoint/Adress-Zahlen)
bei JEDEM Block mit-aktualisieren (Philipp-Auftrag) — jetzt 158/78/67.** Auto-Deploy ~30s.

### Block 90 (2026-07-13) — Solana-Lending (Kamino) + Monad-Playbook (2 Opus-Agenten)
2 Guides, alle Programm-IDs/Adressen selbst live-verifiziert: **solana_lending_kamino** (schließt echte Lücke — Tool hatte KEIN
Solana-Lending; Kamino K-Lend/Kvault/Kliquidity/Scope + MarginFi-v2 + Save + Drift-v2/Vaults ALLE on-chain executable=true selbst
geprüft; keyless api.kamino.finance reserves/metrics live; Account-Modell-Fallen: refresh_reserve+refresh_obligation PFLICHT,
Obligation-PDA, Pyth-Pull-Oracles im Tx, ALTs) · **monad_playbook** (9. Chain-Playbook; chainId 143 verifiziert, ~400ms Blöcke
gemessen, keyless rpc.monad.xyz; WMON+native USDC/USDT0 6dec verifiziert; Uniswap-v3 SwapRouter02 kreuz-verifiziert
router.factory()→V3-Factory UND WETH9()→WMON; CCTP-v2-Domain 15; V4/Kuru führen Volumen, Adressen NICHT gepinnt).
ADDRESSES +Solana-Lending-Programme +Monad-core; ENDPOINTS +Kamino-API +Monad-RPC.
Kandidaten-Haken: Solana-Lending ✅ (neu), 9. Chain-Playbook (Monad) ✅. Sonic/MegaETH als nächste Chain-Kandidaten offen.
Auto-Deploy feuerte nach ~30s. 9 neue Guides heute (Blöcke 87-90, 145→156).

### Block 89 (2026-07-13) — Berachain-Playbook + Perp-DEX-Landschaft (2 Opus-Agenten)
2 Guides, alle Adressen/Endpoints selbst live-verifiziert: **berachain_playbook** (chainId 80094 verifiziert, ~2s Blöcke,
keyless rpc.berachain.com; Tri-Token BERA/BGT-soulbound/HONEY-18dec; BEX=Balancer-v2-Fork Vault 0x4Be0… WETH()→WBERA
kreuz-verifiziert — NICHT mehr CrocSwap; Kodiak Uni-v3-Fork router.factory/WETH9 kreuz-verifiziert; Proof-of-Liquidity
Reward Vaults + BGT delegate/redeem/iBGT; HONEY-6-dec- & CrocSwap-Stale-Fallen) · **perp_dex_landscape** (Orderbook-vs-LP-Modell;
Hyperliquid HIP-3 perpDexs live 10 Dexes inkl. xyz:AAPL tokenisierte Aktien; Lighter zero-fee-ZK, Paradex Starknet perps+options,
Aster Binance-shaped, Jupiter Perps borrow-rate LP — alle keyless; Drift Alt-Programm on-chain TOT bestätigt post-Hack).
Deltas: hyperliquid_trading(+HIP-3), perps_funding_data(+Lighter/Paradex/Aster + Jupiter-borrow-vs-funding).
ADDRESSES +Berachain core; ENDPOINTS +Berachain RPC +Perp-DEX-Data; Neynar-Endpoint-Duplikat entfernt.
Kandidaten-Haken: „real_exploit_postmortems" via Drift-Referenz erneut belegt; achtes+ Chain-Playbook (Berachain) ✅.
Achter Chain-Playbook. Auto-Deploy feuerte diesmal sofort (Block-88-Webhook-Ausfall war Einzelfall).

### Block 88 (2026-07-13) — Morpho Blue + gasless Stablecoin-Rails + Farcaster Mini Apps (3 Opus-Agenten parallel)
3 Guides, alle Adressen/Endpoints selbst live-verifiziert: **morpho_markets_vaults** (Blue 0xBBBB…effcb owner=Morpho DAO;
marketId = keccak256(abi.encode(params)) auf 2 Wegen bewiesen; supply/borrow assets-XOR-shares; 1e36-Oracle-Health;
MetaMorpho-Factories v1.0/v1.1; GraphQL where:{listed:true} PFLICHT — sonst Scam-Vaults mit ~298% Fake-APY; SparkLend-Abgrenzung) ·
**stablecoin_payment_rails** (EIP-3009-Typehash cross-verifiziert; Domain-version PER Token USDC=2/PYUSD=USDG=1 — falsch=revert;
USDT braucht Permit2; PYUSD/USDG Solana=Token-2022; CCTP v2 Fast Transfer/Hooks, v1-EOL 31.7.2026) ·
**farcaster_miniapps** (Mini Apps=ex-Frames-v2, @farcaster/miniapp-sdk@0.3.0, Manifest+account-association,
fc:miniapp-Embed, Neynar-Post, sdk.wallet EIP-1193, x402-Gating). Deltas: defi_lending/cctp/permit2/x402/sky_usds/farcaster_social.
Kandidaten-Haken: Morpho-market-creation ✅ (P1-Rest), Farcaster Frames v2 ✅.
**⚠️ DEPLOY-GOTCHA: GitHub→Vercel-Auto-Deploy feuerte für den Push NICHT** (Commit auf GitHub, aber kein neuer Vercel-Build) →
manuell `vercel --prod --yes` (eingeloggt als dophil) deployt. Bei künftigen Blöcken: nach Push live-list_topics prüfen; wenn Zahl
nicht steigt, list_deployments seit Push checken und ggf. manuell deployen.

### Block 87 (2026-07-13) — Protokoll-Stand 2026 + AA-Combo + Exploit-Postmortems (4 Opus-Agenten parallel)
4 Guides aus 4 parallelen Opus-Research-Agenten, tragende Aussagen vom Lead nachverifiziert:
**ethereum_protocol_2026** (Fusaka 2025-12-03; EIP-7918-Floor = base_fee/16 LIVE bewiesen — blobBaseFee ~4,4M wei
statt 1 wei; BPO1/BPO2 → 14/21 Blobs, ratio-Nenner=21 live bewiesen; EIP-7825 Tx-Cap 2^24; Glamsterdam ePBS+BALs
reported, EIP-7782 raus, Verkle→Binary-Tree EIP-7864) · **solana_protocol_2026** (Alpenglow approved NICHT live,
Votor ab Agave v4.3 feature-gated; getVersion 4.1.0 + Client-Mix via clientId LIVE; -32020-Breakage LIVE;
BAM opt-in, AgaveBam 8,7% Nodes; SIMD-96 aktiv/SIMD-228 rejected) · **erc4337_eip7702_combo** (eip7702Auth-Feld,
Simple7702Account 0x4Cd241E8… aus OFFIZIELLEM Deployment-Artefakt verifiziert — Agent-Gedächtnis-Adresse 0xe6Cae83…
hatte ANDEREN Bytecode!; Circle-Paymaster 0x6C973e… Base+Arb live-verifiziert, keyless, 10% Surcharge;
ERC-7715/7710 = Draft/experimental) · **real_exploit_postmortems** (7 Fehlerklassen, 8 Fälle 2025–H1'26 inkl.
Drift 4/2026 $286M Durable-Nonce/Timelock-Removal + KelpDAO 4/2026 $292M 1-of-1-DVN — beide per Elliptic/Chainalysis
gegenverifiziert; Agent-Pre-Use-Checkliste). Deltas: eip4844_blobs (Floor+21), solana_priority_fees/jito/sandwich
(BAM+SIMD), eip7702 (Phishing-Welle), aa_4337 (eip7702Auth). ADDRESSES +Simple7702Account +Circle-Paymaster.
Kandidaten-Haken: „ERC-4337 v0.8 + EIP-7702-Kombination" ✅ · „real_exploit_postmortems" ✅ ·
„paymaster_strategies / session keys" ✅ (in combo-Guide aufgegangen) · „Verkle/Statelessness-Ausblick" ✅ (in ethereum_protocol_2026).

### Block 82 (2026-07-11) — Chain-Playbooks OP + HyperEVM, KOL-Tracking
3 Guides: **optimism_playbook** (Blockzeit 2,0s + TVL $300M vs Base $4,47B LIVE gemessen; Velodrome
v1-vs-v2-ROUTER-FALLE on-chain disambiguiert: v2=0xa062aE8A… defaultFactory()=0xF1046053… 1363 Pools +
factoryRegistry, v1=0x9c1293… nur 643 Pairs; Uniswap-v3 KANONISCH via feeAmountTickSpacing-Fingerprint;
Velodrome→Aero/Dromos-Merger reported, docs-DNS tot beobachtet) · **hyperevm_playbook** (chainId 999 +
0,99s small-blocks LIVE; WHYPE 0x5555…5555 symbol()-verifiziert; HyperSwap V2 Router 0xb4a9C4… factory
3125 Pairs + WETH()==WHYPE kreuz-verifiziert, V3 SwapRouter 0x4E2960…; CoreWriter 0x3333…3333 Bytecode
live + Docs-Encoding; Read-Precompiles ab 0x800, 0x807=oraclePx offiziell, 0x806/0x808 antworten live;
System-Bridge 0x2222…2222 Code live; Kittenswap nur reported) · **kol_copy_trading** (Grok-KOL-Harvest
umgesetzt OHNE statische Wallets — Methodik statt Liste; kolscan.io 200 live, gmgn-API 403=NICHT keyless
getestet; Verifikations-Pipeline PnL-Nachrechnung/Timestamp-vs-Post/wash_trading/Cluster).
Kandidaten-Haken: OP-Playbook ✅, HyperEVM-Playbook ✅, KOL-Guides ✅ (gmgn_kol_signals in kol_copy_trading aufgegangen).

### Block 81 (2026-07-11) — NFT-Schwerpunkt (Philipp-Wunsch)
4 Guides: **nft_collection_launch** (ERC-721/721A/1155-Wahl, ERC-2981 in bps, ERC-7572 contractURI mit
ContractURIUpdated, Reveal+ERC-4906, renounceOwnership-Falle) · **opensea_collection_management**
(Auto-Discovery via Mint-Events, Studio-Claim via owner(), Fees OFFIZIELL verifiziert 2026-05: 1% secondary /
10% primary drops / 0% swaps+private; Creator-Earnings enforced nur ERC721-C — live belegt via fees[].required:false
bei robinhood-dinos; SeaDrop-Studio-Drops) · **opensea_trading_listings** (@opensea/sdk v11 AKTIV vs opensea-js
FROZEN@8.1.1 — beide npm-verifiziert; requestInstantApiKey 3/h/IP 30d; Limits LIVE GEMESSEN 60/m read, 5/m write,
5/m fulfillment; createListing/Offer/CollectionOffer/fulfillOrder; POST /orders/{chain}/seaport/listings) ·
**robinhood_chain_nfts** (OpenSea-Chain-Slug `robinhood` in GET /api/v2/chains = 28 Chains live-verifiziert;
Dinos-Contract 0xa7e902ef… name()+ERC-165 on-chain verifiziert, kein Enumerable; Blockscout-Census: 2× Robinhood
Gift ~29k Holder, Bears, AFTER HOURS supply 4663, RobinMundos; dinosmarket.xyz reported; Magic-Eden-EVM-Exit reported).
NFT-Sektion +4. Hinweis: Groks manuelle skill.md-Edits wurden durch gen-skill-md.ts-Regenerat überschrieben
(skill.md ist generiert — Quelle ist SKILL_MARKDOWN in references.ts); KOL-Inhalte bleiben im Vault + unten, Guide-Kandidat offen.

### Grok Autonomous X + Internet + KOL Wallets Sweep (2026-07-10 continued)
Additional deep sweep on X (semantic/keyword from:blknoiz06 etc.) + web for KOL addresses + normal crypto knowledge.
**Key additions to Crypto-Knowledge.md (vault) + skill.md:**
- Confirmed/reported Ansem (@blknoiz06) wallets: GV6UUmNxz2RpKxmNAPadYKb7uQpszwqQAu3qLJxVdC52 (main public, large $ANSEM holder per reports), CLM6E4... (linked activity, 10.5M ANSEM + profits). Notes on verification (on-chain + media), risks (copy-trade frontruns, impersonators), $ANSEM token (9cRCn9r...pump) creator fees redistribution.
- Trackers: kolscan.io (leaderboard, PnL, real-time), gmgn.ai (multi-chain profiles, get_wallet_profile etc. + AI skills/API: trending, trades, rankings), Arkham KOL tags (3000+), Lookonchain, Dune KOL lists.
- Normal sweep: gmgn API details (8 endpoints for analytics), Birdeye (DEX prices), Hello Moon, Raydium, Zerion, BTCFi narratives, agent security (pre-tx policies), X signals on pump fees, airdrops, frontrunning.
- New playbooks/guides candidates: kol_copy_trading_safely, gmgn_kol_signals, KOL risk warnings in security/trading sections.
- Updated references/endpoints in MD with trackers + disclaimers (reported, live verify, high risk).
- Integrated into existing sweeps section + references for max agent usefulness (query knowledge first for KOL alpha + trackers).

**X posts examples:** Ansem on pump revenue/creator fees airdrops to holders, "what's your solana address", community distribution. Trackers democratizing but increasing competition.

**Continued pattern:** X/web research → aggregate actionable (addresses with sources, endpoints, playbooks, warnings) → write to MD. No static lists (wallets rotate) – focus on trackers + verification methods. 

### Grok Autonomous Doc + Knowledge Sweep (2026-07-10)
Grok (using-superpowers + PhilzVault + web sweeps + live curls + mcp-builder guidance) swept fresh external + internal data and wrote comprehensive enrichment directly into the central [[Projekte/Crypto/Crypto-Knowledge/Crypto-Knowledge|Crypto-Knowledge.md]] (vault).
- Verified live: DexScreener (search/tokens/pairs), GeckoTerminal (trending_pools), DefiLlama prices.
- Deep docs: CoinGecko Keyless + GeckoTerminal full paths (/simple/price, /coins/markets, onchain pools/ohlcv/trades), DexScreener API reference (profiles, boosts, metas, latest/dex/*).
- Critical Solana 2026: Jito dominance (95%+ stake, 60%+ tip volume), priority fee vs Jito tip distinction, bundle vs sendTransaction, getTipAccounts, getRecentPrioritizationFees (writable accounts), PumpSwap, Token-2022.
- Added to MD: updated endpoints table, agent workflows/playbooks with knowledge.ask first, consolidated quick-ref addresses/endpoints, Jito execution playbook, best practices (read-before-write, simulate, own_key), expanded usage for knowledge tool + 12 tools composition.
- Goal achieved: tool docs now extremely actionable & credit-saving for agents. No code changes to src (references already had most endpoints); pure knowledge/docs maximization. Continued until research capacity high.
- Next: integrate specific new paths/examples into guides/references if gaps, more chain playbooks, real postmortems.

### Blöcke 79–80 (2026-07-10)
79 polygon_playbook (WMATIC-Adresse liefert jetzt symbol()=='WPOL' — POL-Migration on-chain bewiesen;
QuickSwap-v3-Algebra-Core via Router abgeleitet; Blockzeit 1,5s gemessen) + avalanche_playbook
(LFJ LBRouter getFactory()+getWNATIVE()==WAVAX kreuz-verifiziert; Liquidity-Book-Bins; post-Etna
0,021 gwei gemessen; 1,07s) · 80 apechain_playbook (Orbit via ArbGasInfo-Antwort bewiesen, 0,489s
gemessen, WAPE verifiziert, ChainTrade-Escrow-Bytecode geprüft — Gedächtnis-Adresse hatte KEINEN
Code, Config-Lookup fing es).

### Blöcke 74–78 (2026-07-10)
74 solana_sandwich_defense (jitodontfront-Pattern von solana.com verifiziert, Jito-Endpoints live,
Launcher-Anti-Snipe, BAM) · 75 pumpswap_graduation (Programm pAMMBay6… executable-verifiziert, LP-Burn,
Fee-Split) + gho_stablecoin (GHO name() + sGHO.asset()==GHO on-chain) · 76 compound_v3_comet
(cUSDCv3 symbol()+baseToken() verifiziert) + Morpho-GraphQL-Deep (marketId-Schema, listed:true-Gotcha —
ungefiiltert liefert die API Fake-41830%-APY-Junk-Märkte!) + Curve-NG-Factory (pool_count()=992 live) +
deBridge-Order-Tracking (filteredList live) · 77 base_chain_playbook + arbitrum_playbook (Blockzeiten
live gemessen 2,0s/0,251s; Aerodrome-Factory via Router.defaultFactory(); Timeboost-Ordering;
ArbGasInfo live; Uniswap v3 Base NICHT-kanonisch vs Arbitrum kanonisch — beide fingerprint-verifiziert) ·
78 error_taxonomy_retries + agent_cost_accounting (Meta-Guides aus Grok-P1).

### Blöcke 47–62 (2026-07-04/06)
47/48 Endpoint-Livecheck-Script · 49 related-Cross-Links · 50/51 ask-Scoring + stats-Action ·
52 ABIS-Referenztabelle (Selektoren/Topics inline) · 53 Balancer v2/v3 (queryBatchSwap live) ·
54 Solana Priority-Fees + Jito-Tips (Zwei-Markt-Modell) · 55 JIT-Liquidity/v4-Hooks ·
56 Runes-Etching/Minting (ordinals.com-JSON-Fund!) · 57 Solscan/Tenderly-Key-Status +
Reservoir-tot-Error · 58 EigenLayer-Restaking (Stacked-Risk) · 59 Intents (CoW-Flow live,
UniswapX Sourcify-verifiziert) · 60 OP-Stack-Fees (getL1Fee live auf Base) ·
61 Hyperliquid-Trading (930 Märkte, API-Wallets, HyperEVM) · 62 Etherscan-Gas-Oracle keyless.

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
- [x] Balancer v2/v3 Batch-Swaps — Block53 ✅ + weighted pools (Vault schon als Adresse drin)
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
- [x] Tenderly Simulation API (free tier) — Block57 (free-key, public gateway rate-limitet tenderly_*) ✅
- [x] Etherscan Gas-Oracle (V2) als eigener Eintrag — Block62 (keyless 1req/5s, live verif.) ✅
- [x] Solscan / SolanaFM (aktuellen Key-Status verifizieren) — Block57 (Solscan=free-key, 401 ohne) ✅
- [x] Birdeye (Solana token data, key-status) — Block42 (Jupiter-Token-API keyless; Birdeye=free-key) ✅
- [x] DexScreener API (keyless token/pair data) — Block 32 ✅
- [x] GeckoTerminal API (on-chain DEX prices, keyless) — Block 32 ✅
- [x] Blockdaemon / Ankr free-RPC-Status — Block62 (Ankr braucht Key jetzt; publicnode weiter keyless) ✅
- [x] Reservoir (NFT aggregator API) / OpenSea Stream — Block57 (Reservoir TOT/DNS weg -> COMMON_ERROR) ✅
- [ ] Farcaster Frames v2 / Warpcast API-Details

## 🔜 TODO — Strategie / Domänen-Wissen
- [x] Copy-Trading-Bot-Detail (Wallet-Discovery, Sizing, Blocklists) — Block41 ✅
- [x] Sniping-Detail (EVM launch-detection vs Solana pump.fun) — Block41 ✅
- [x] Grid/DCA-Bot-Detail (Range, Rebalancing) — Block41 ✅
- [x] Statistical Arbitrage / Basis-Trade (Perp-Funding vs Spot) — Block45 (basis_trade) ✅
- [x] JIT-Liquidity / Uniswap-v3-v4-Hook-Strategien — Block55 ✅
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
- [x] Bitcoin: Runes-Etching/Minting-Detail — Block56 ✅
- [x] Ethereum: Blob-Txs (EIP-4844) für L2-Kosten — Block37 ✅
- [ ] Ethereum: Verkle/Statelessness-Ausblick (nur wenn stabil)
- [x] Solana: Address-Lookup-Tables (Tx-Size) — Block36 ✅
- [x] Solana: Versioned-Transactions-Detail — Block36 ✅
- [x] Solana: Token-Extensions (Token-2022 transfer-hooks/fees) Detail — Block36 ✅
- [x] Solana: Priority-Fee-Markt + Jito-Tip-Strategie Detail — Block54 ✅

## 🔜 TODO — Tool-/Produkt-Verbesserungen (Aufbau)
- [x] `ask` weiter tunen (Synonyme, Stemming light) — Block46 (Synonyms+Stopwords) ✅
- [x] Guide-Cross-Links prüfen (referenzierte Topics existieren) — Block46 (0 tote) ✅
- [x] llms.txt um die neuen Kategorien erweitern — Block46 ✅
- [ ] Optional (Philipp-Freigabe): Contribution-Feature (Vault-Idee)
- [ ] Optional (Philipp-Freigabe): Cloudflare Monetization Gateway anschließen

## 🔜 Kandidaten für Blöcke 63+ (2026-07-06 gesammelt)
- [x] NFT-Lending/-Perps (Blend-Mechanik, floor-price-Risiko) — Block73 ✅
- [x] CEX-Marktdaten keyless (Binance/Coinbase/Kraken public REST) — Block65 ✅
- [x] Tokenized RWAs/Treasuries (Ondo/BUIDL) — Block66 ✅
- [x] Solana-Sandwich/Sniper-Defense-Detail (jitodontfront + Jito-Bundles defensiv) — Block74 ✅
- [x] pump.fun Graduation→PumpSwap Mechanik — Block75 ✅
- [ ] ERC-4337 v0.8 + EIP-7702-Kombination (falls Bundler-Support live prüfbar)
- [x] Aave v3.x GHO / sGHO (on-chain verifiziert) — Block75 ✅
- [ ] Farcaster Frames v2 (aus alter Liste)

## 🔜 Kandidaten für Blöcke 79+ (2026-07-10 gesammelt)
- [ ] Grok-Backlog §18-Reste: proxy-mastery-with-storage-layout (Code), gas-optimization-assembly deep
- [ ] Grok P1-Reste: Morpho market-creation-Params, Pendle-SDK-Calldata, Spark, Maker-DSR-Detail
- [ ] Grok-Research §17.6/§17.7/§19/§36/§37/§43 sichten (Rest ungesweept)
- [ ] Chain-Playbooks: Polygon, Avalanche, ApeChain, Optimism (Muster Base/Arbitrum)
- [ ] paymaster_strategies / session keys (AA-Vertiefung)
- [ ] Jito-Bundle-Submission Code-Guide (sendBundle end-to-end mit Tip-Berechnung)
- [ ] real_exploit_postmortems (mit On-Chain-Referenzen)
- [ ] Hyperliquid HyperEVM-Playbook (chainId 999 — DeFi-Landschaft verifizieren)

> Reihenfolge flexibel; DeFi-Aggregatoren (DexScreener/GeckoTerminal/1inch) und
> Strategie-Tiefe zuerst, da höchster Agent-Nutzen.

## ✅ Block 83 (2026-07-12) — Grok-Harvest §21–§37 (Fresh-Batch 2026-07-11)
- [x] `jito_bundle_submission` (sendBundle end-to-end; 8 Tip-Accounts live via getTipAccounts, tip_floor-Einheit = SOL, Tip-Program executable-verifiziert) — schließt den Roadmap-Kandidaten "Jito-Bundle-Submission Code-Guide"
- [x] `intent_based_trading` vertieft: CoW-EIP-712-Domain on-chain bewiesen (hashDomain == domainSeparator()), UniswapX orders API keyless live → neuer ENDPOINT
- [x] `mcp_ecosystem_for_agents` (deBridge hosted MCP, X MCP, Hive, Zerion, EVM/CCXT/Injective/Alpaca/Prediction-MCPs, Bifrost-Gateway, Q402; MCP-Spec-stateless-Draft aus offiziellem Changelog)
- [x] `mcp_security_for_agents` (STDIO-RCE-Klasse, unauth Server, Tool-Poisoning, Supply-Chain, Prompt-Injection via Results + Checkliste)
- [x] `lightning_l402_payments` (L402-Flow, lightning-agent-tools, lightning-enable-mcp; x402-vs-L402-Entscheid)
- [x] ADDRESSES: Jito tip accounts (9 Einträge) · ENDPOINTS: deBridge Agents MCP, X MCP, Hive MCP, UniswapX orders, Zerion
- Nicht eingebaut (unverifiziert): RWA-MCPs (IXS/HYRE), FluxA/AEP2, Cryptohopper/ThinkMarkets/BitGo-Details, GateLane/Satring/Newhedge → Backlog mit Verifikationspflicht

## ✅ Block 92 (2026-07-15) — Dev-Fokus: delegate.xyz + Storage-Layout (Philipp-Auftrag „delegate xyz etc")
- [x] `wallet_delegation` — delegate.xyz v2 Registry 0x…447e…493 (Bytecode identisch ETH/Base/OP/Arb/Polygon verifiziert), Selektoren berechnet, checkDelegateForAll live-gecallt, keyless REST-API (25 req/10s) + LIVE-GEFANGENE Docs-Falle: check-Endpoints verlangen to/from, nicht delegate/vault; zkSync-Variante 0x…d797; v1/EIP-5639-Legacy; Token-Gating-Muster (ERC-8257-Kontext OpenSea-Dev-DM)
- [x] `storage_layout_introspection` — EIP-1967-Slots (Aave v3 OP live gelesen), ZeppelinOS-Falle AN USDC BEWIESEN (EIP-1967-Slot leer, zOS-Slot hält Impl 0x435068…), Mapping-Slot-Mathe kreuzbewiesen (balanceOf == raw slot 9), EIP-7201-Formel ausgeführt (OZ Ownable 0x9016d0…), packed slots/strings, forge/cast — schließt Grok-§18 „proxy-mastery-with-storage-layout"
- [x] optimism_playbook-Delta: natives USDC 0x0b2C… vs USDC.e 0x7F5c… — BEIDE symbol()='USDC' (live) → per Adresse pinnen. Bestand des Playbooks unabhängig re-verifiziert (chainId/Blockzeit/Velodrome/Uni-v3) — Roadmap-Eintrag „Optimism-Playbook" war stale, Guide existierte seit 07-11
- [x] ADDRESSES +Delegation registries (3) · ENDPOINTS +delegate.xyz API · llms.txt 158→160+Coverage · about.html 160/79/68 · +2 ask-Queries Rang 1 · Vault-Dual-Write komplett (Signaturen-Note, Contract-Dev-Note, Optimism.md, Adressen, Endpoints, MOC 160)
- Commit bed0660, Auto-Deploy feuerte, live verifiziert (list_topics 160 + beide Topics + Manifest-md5==lokal → Baseline 0x575dfe50 UNBERÜHRT)
