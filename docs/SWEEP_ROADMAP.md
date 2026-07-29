# Crypto-Knowledge — Wissens-Sweep Roadmap

Laufender autonomer Ausbau des Chain-Brains (Tool #71 auf OpenSea). Jeder Block:
**recherchieren → LIVE verifizieren (curl/eth_call) → einbauen → tsc + vitest → deploy →
list_topics-Check → Hash-Regression (`scripts/check-hash-71.ts` + tool-sdk hash, Baseline
`0xf5ff3a29…ebc4`) → commit+push**. Nichts aus dem Gedächtnis; jede Adresse/jeder
Endpunkt wird vor Einbau live geprüft.

Stand: **215 Guides, 21 Sektionen, 88 Endpunkte** (Blöcke 1–128 erledigt; Block 128 = 8 neue Endpunkte, 2026-07-29; **Manifest v1.4.1, Baseline `0xf5ff3a29…ebc4` unberührt; Sweep-Workflow: Guides werden im privaten `crypto-knowledge-content`-Repo gepflegt, siehe Block-109-Eintrag; Philipp-Auftrag: mind. 5 nützliche Guides + 8 Endpunkte**).

### Block 128 (2026-07-29) — 8 neue Endpunkte (Philipp-Auftrag)
80→88 Endpunkte, alle 8 live per curl verifiziert bevor Einbau: L2Beat Scaling-Summary (Aggregat-TVL, Stage-0/1/2-Datenbasis), Axelarscan GMP-API (searchGMP, POST-only bestätigt), Hyperlane GraphQL-API (api.hyperlane.xyz/v1/graphql), Nexus Mutual Products-API (live Cover-Preise/-Verfügbarkeit statt nur reported Adoptionszahlen), Flashbots-Relay-Bidtraces (konkrete Builder-Bid-Daten hinter mev_boost_pbs_mechanism), MEV-Share-Event-Stream (SSE, bereits früher in der Session verifiziert), zkSync-Era-Blockscout-API (Etherscan-kompatibel), DefiLlama-Fees&Revenue-Overview (getrennt von den bereits bestehenden Prices/TVL/Yields-Einträgen). Alle 8 gezielt so gewählt, dass sie bereits bestehende Guides dieser Session konkreter/aktionsfähiger machen (L2Beat→op_stack_fault_proofs/zkevm_landscape_2026, Axelarscan/Hyperlane→cross_chain_messaging_landscape, Nexus Mutual→defi_insurance_coverage, Flashbots/MEV-Share→mev_boost_pbs_mechanism, zkSync→zkevm_landscape_2026, DefiLlama-Fees→tokenomics_flywheels/fee_switch_design_patterns/depin_tokenomics).

Vault-Sync (Web3 API-Endpoints.md +8 Einträge, 80→88, Kopfzeile+Footer-Datum aktualisiert; MOC-Endpoint-Zähler 80→88), about.html-Zähler 80→88. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 127 (2026-07-29) — autonome Fortsetzung
1 Guide (214→215): `defi_insurance_coverage` — Nexus-Mutual/Sherlock-Mechanismus (NXM-Stake-und-Burn, Claims-Committee) PLUS die ehrlichen Adoptionszahlen: ~81,56 Mio. $ Sektor-TVL (85% Nexus Mutual) gegen Hunderte Milliarden DeFi-TVL, nur ~18 Mio. $ Claims in 7 Jahren ausgezahlt vs. dem einzelnen 292-Mio.-$-Kelp-DAO-Exploit, InsurAce/Sherlock-TVL-Kollaps (150M→132K bzw. 60M→505K), und die durchgerechnete Prämien-Mathematik, die zeigt, dass Cover oft den Großteil/die gesamte Yield auffrisst, die es eigentlich schützen soll.

Vault-Dual-Write (Web3 Security & Forensik +1, 6→7 Guides), MOC/Praxis-Referenz 214→215, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 126 (2026-07-29) — autonome Fortsetzung
1 Guide (213→214): `smart_wallet_social_recovery` — Safes Recovery-Module (designierte Recovery-Adresse + Timelock) und Argents Guardian-System (Quorum + Sicherheitsfenster) als Alternativen zur reinen Seed-Phrasen-EOA-Recovery. Kern-Muster herausgearbeitet: Autorität + verpflichtende Verzögerung, dasselbe „der ehrlichen Partei Zeit zu reagieren geben"-Prinzip wie DelayedWETH in op_stack_fault_proofs. **Labeling-Disziplin bewusst eingehalten:** spezifische Zahlen (7-Tage-Timelock, 36h-Fenster) als „reported, nicht in diesem Durchgang aus Contract-Source neu abgeleitet" gekennzeichnet, statt so zu tun als wären sie primärquellen-verifiziert.

Vault-Dual-Write (Signaturen, Auth & Smart Accounts +1, 12→13 Guides), MOC/Praxis-Referenz 213→214, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 125 (2026-07-29) — autonome Fortsetzung (schließt Lücke unter account_abstraction_4337/_dev)
1 Guide (212→213): `erc4337_bundler_economics` — die ökonomische Schicht, die entscheidet, ob ein Bundler eine UserOperation tatsächlich inkludiert. Fee-Mechanik (Bundler streckt L1-Gas vor, UserOp-eigene maxFeePerGas/maxPriorityFeePerGas müssen das decken), Marktkonzentration (78% bei 3 Bundlern Q1 2026, reported), Paymaster-Sponsoring-Zentralisierungsdruck als dokumentierte Kritik. ERC-7562s DoS-Verhinderungs-Rationale direkt gegen die Raw-EIP-Quelle verifiziert (Status: Draft) — erklärt, WARUM Bundler strikte Validierungsphasen-Regeln durchsetzen (abstrahierte Validierung bricht die implizite „nur höher bezahlende Tx verdrängt"-DoS-Resistenz von EOA-Transaktionen).

Vault-Dual-Write (Signaturen, Auth & Smart Accounts +1, 11→12 Guides), MOC/Praxis-Referenz 212→213, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 124 (2026-07-29) — autonome Fortsetzung (Substrat-Guide, schließt Lücke unter mev_share/based_rollups)
1 Guide (211→212): `mev_boost_pbs_mechanism` — der tatsächliche Proposer-Builder-Separation-Mechanismus hinter ~90% der Ethereum-Blöcke (reported), den mev_share_order_flow_auctions UND based_rollups_preconfirmations' Commit-Boost beide voraussetzen, aber bisher nirgends selbst erklärt wurde. Commit-Reveal-Schema (Proposer signiert Header blind, Relay enthüllt Body erst danach) + exakter Builder-API-3-Call-Flow (registerValidator/getHeader/getPayload) direkt gegen flashbots/mev-boost + flashbots/mev-boost-relay verifiziert (beide Repos aktiv, 5 Tage bzw. 1 Monat vor Check gepusht). Enshrined-PBS-Forschungsrichtung als „aktuelle Off-Chain-Realität, kein Endzustand" sauber eingeordnet.

Vault-Dual-Write (Trading-Strategien & Bots +1, 23→24 Guides), MOC/Praxis-Referenz 211→212, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 123 (2026-07-29) — autonome Fortsetzung (Solana-Infra, Themen-Rotation)
1 Guide (210→211): `solana_zk_compression` — Light Protocols allgemeinere Primitive hinter solana_compressed_nfts: beliebige Accounts/SPL-Token-Balances/PDAs komprimierbar bei ~99% geringeren Speicherkosten (Merkle-Root + Validity-Proof statt roher Rent). Echte Falle herausgearbeitet: komprimierten State lesen braucht eine Photon-Indexer-fähige RPC (Helius/Alchemy u.a.), keine beliebige generische Solana-RPC. SDK-Pakete (@lightprotocol/stateless.js, @lightprotocol/compressed-token, @lightprotocol/zk-compression-cli) verifiziert, Repo-Aktivität bestätigt (gepusht 2026-07-21, ~1 Woche vor Check).

Vault-Dual-Write (Solana Agent-Wissen +1, 20→21 Guides), MOC/Praxis-Referenz 210→211, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 122 (2026-07-29) — autonome Fortsetzung (DeFi-Primitive-Fokus, Themen-Rotation)
1 Guide (209→210): `onchain_private_credit` — strukturell andere RWA-Kategorie neben tokenized_treasuries: echte Kredite statt Staatsschulden. Maples syrupUSDC live on-chain verifiziert (symbol()/name()/asset() direkt via eth_call gegen 0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b — asset() bestätigt kanonisches USDC). Nicht-offensichtlicher Permission-Grenzen-Fund: KYC/Underwriting sitzt bei den KREDITNEHMERN, nicht bei den Lendern — Retail hält den Wrapper-Token vollkommen permissionless. Maple/Centrifuge/Goldfinch als 3 unterschiedliche Kreditnehmer-Kategorien sauber getrennt statt austauschbar dargestellt.

Vault-Dual-Write (DeFi - Lending, Yields, Staking & Stablecoins +1, 19→20 Guides), MOC/Praxis-Referenz 209→210, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 121 (2026-07-29) — autonome Fortsetzung (L2-Architektur-Kontrast zu Block 112)
1 Guide (208→209): `zkevm_landscape_2026` — zkSync Era / Linea / Scroll / Starknet als strukturell entgegengesetzte Lösung zu op_stack_fault_proofs' Fault-Proof-Modell: Validity-Proof vor Finalisierung statt Anfechtungsfenster danach, daher <24h-Withdrawals statt 7 Tage. SNARK- (zkSync/Linea/Scroll) vs. STARK-Trade-off (Starknet, post-quantum, kein Trusted Setup) sauber herausgearbeitet. EVM-Äquivalenz-Spektrum (zkSync-custom-VM vs. Lineas Type-2 vs. Scrolls Bytecode-Äquivalenz) explizit als Spektrum statt Binär dargestellt. L2BEAT-Stage-0/1/2-Framework auf BEIDE Rollup-Familien angewendet — ehrlich benannt: zkSync Era+Linea Stage 0 (derselbe Trust-Vorbehalt wie optimistische Rollups), Starknet+Scroll Stage 1; Lineas Prover-Zentralisierung (ConsenSys-Cluster, Dezentralisierungs-Roadmap Ende 2026) als praktischer Flaschenhals unabhängig von der Kryptografie benannt.

Vault-Dual-Write (EVM Transaktionen, Gas & Debugging +1, 15→16 Guides), MOC/Praxis-Referenz 208→209, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 120 (2026-07-29) — autonome Fortsetzung (Agent-Dev/Security-Fokus)
1 Guide (207→208): `onchain_data_prompt_injection` — Token-Namen/NFT-Metadaten/ENS-Records als unauthentifizierte Freitext-Felder, die einen On-Chain-Agenten indirekt prompt-injizieren können. Zscaler-ThreatLabz-2026-Kampagnen (Web-Content-Injection, dokumentiert 4-von-26-LLMs führten betrügerische Krypto-Zahlung tatsächlich aus) als verifizierter Beweis der GENERELLEN Schwachstellen-Klasse zitiert; On-Chain-Metadaten-Erweiterung EHRLICH als „aus ersten Prinzipien abgeleitet, keine separat benannte Kampagne" gelabelt statt so getan als wäre sie unabhängig dokumentiert. Nebenbei TOC-Lücke bei `mcp_security_for_agents` gefixt (Sektion existierte bereits, Link fehlte).

Vault-Dual-Write (Agent Economy - ERC-8257, x402 & OpenSea +1, 9→10 Guides), MOC/Praxis-Referenz 207→208, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 119 (2026-07-29) — autonome Fortsetzung (Agent-Dev-Fokus)
1 Guide (206→207): `agent_local_fork_dry_run` — stärkere Ergänzung zum bestehenden `simulate`-Tool: einen GANZEN Multi-Step-Agent-Plan (nicht nur einen Call) gegen einen lokalen Anvil-Mainnet-Fork proben, mit Account-Impersonation + Balance-Setzen für realistische Tests, null echtes Gas/Kapital-Risiko. Bekannte Ecken (anvil_setBalance-Reports auf Nicht-Mainnet-Forks, Impersonation-Rough-Edges) ehrlich als „gegen eigene Foundry-Version prüfen" gelabelt statt verschwiegen.

Vault-Dual-Write (Smart-Contract-Entwicklung EVM +1, 17→18 Guides), MOC/Praxis-Referenz 206→207, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 118 (2026-07-29) — autonome Fortsetzung (Agent-Dev-Fokus)
1 Guide (205→206): `abi_to_agent_tool_schemas` — die uint256-als-JSON-Schema-„number"-Falle beim Umwandeln einer Contract-ABI in ein LLM-Tool-Schema (MCP/OpenAI-Function-Calling/Anthropic-Tool-Use nutzen alle dieselbe JSON-Schema-Form). **Selbstreferenziell verifiziert:** das korrekte Muster (`z.string()` statt `z.number()` für Beträge, server-seitig via BigInt geparst) wörtlich aus diesem Repos eigenem `src/modules/portfolio/tool.ts` zitiert statt als abstrakte Empfehlung — das Tool demonstriert die eigene Lehre bereits produktiv. Address/bytes/tuple-Mapping-Regeln + Decimals-vs-Präzision-Unterscheidung ergänzt.

Vault-Dual-Write (Smart-Contract-Entwicklung EVM +1, 16→17 Guides), MOC/Praxis-Referenz 205→206, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 117 (2026-07-29) — autonome Fortsetzung (Philipp-Feedback: mehr Vielfalt jenseits Cross-Chain)
1 Guide (204→205): `nft_royalty_enforcement` — ERC-2981 (reine Signal-Funktion, keine Durchsetzung) vs. ERC-721C (echte On-Chain-Durchsetzung via CreatorTokenTransferValidator, exakte Security-Level-Tabelle 1-7 wörtlich aus Source zitiert). OpenSeas Operator-Filter-Durchsetzung mit exakten Daten als vollständig tot bestätigt (2023-09-01 Stopp für neue Contracts, 2024-02-29 letzte Legacy-Durchsetzung ausgelaufen) — eine Doku/ein Tutorial, das das noch referenziert, beschreibt einen nicht mehr funktionierenden Mechanismus.

Vault-Dual-Write (NFTs - Metadaten, IPFS & Seaport +1, 8→9 Guides), MOC/Praxis-Referenz 204→205. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 116 (2026-07-29) — autonome Fortsetzung
1 Guide (203→204): `cross_chain_messaging_landscape` — Hyperlane (steckbare Interchain Security Modules, pro App wählbar, 140+ Chains reported), Axelar (General Message Passing + Cosmos-IBC-Reichweite, 70+ Chains), Chainlink CCIP (Oracle-Verifikation + separates Risk Management Network, 25+ Chains) als Landschaft jenseits von LayerZero/Wormhole. Alle drei Dispatch-Funktionssignaturen (Mailbox.dispatch, Gateway.callContract, Router.ccipSend) direkt gegen den jeweiligen Source-Repo verifiziert. Aktivitäts-Nuance ehrlich benannt: Hyperlane-Repo gepusht am Check-Tag, Axelar-Repo ~7-8 Wochen alt, smartcontractkit/ccip-Repo >1 Jahr ruhig — aber explizit als „Repo-Signal, nicht zwingend Projekt-Status" gelabelt statt vorschnell als abandoned eingeordnet.

Vault-Dual-Write (Swaps, Bridges & Cross-Chain +1, 16→17 Guides), MOC/Praxis-Referenz 203→204, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 115 (2026-07-29) — autonome Fortsetzung
1 Guide (202→203): `erc7683_cross_chain_intents` — **echte, gut verifizierte Falle:** der lebende EIP-7683-Spec-Text wurde per Commit-Historie bestätigt am 2026-05-13 „Redesign around resolvers" umgebaut (IResolver.resolve() statt IOriginSettler.open()/IDestinationSettler.fill()), aber das breit deployte „ERC-7683"-Ökosystem (Across = 88% seines Volumens Stand April 2026, laut eigener Statistik) läuft weiter auf dem ALTEN open()/fill()-Design von VOR diesem Redesign. eips.ethereum.org heute zu lesen beschreibt nicht, wie deployte Bridges tatsächlich arbeiten — ein Fund, der klassische „geläufig = wahr"-Fehlannahme (Operating-Manual §4) direkt widerlegt hätte, wäre er nicht doppelt (Raw-Spec-Diff + Commit-Historie + Ökosystem-Cross-Check) verifiziert worden.

Vault-Dual-Write (Swaps, Bridges & Cross-Chain +1, 15→16 Guides), MOC/Praxis-Referenz 202→203, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 114 (2026-07-29) — letzter Block dieser Session (Philipp: „nach 202 kannst du Pause machen")
1 Guide (201→202): `eip6963_wallet_discovery` — Multi-Wallet-Discovery via Announce/Request-Events statt der window.ethereum-„letzte-Extension-gewinnt"-Kollision. Status direkt gegen eips.ethereum.org verifiziert: **Final**, kein Draft. Event-Namen (eip6963:announceProvider/requestProvider) + Interface-Shapes (EIP6963ProviderInfo/ProviderDetail, uuid vs. rdns-Unterscheidung) exakt zitiert. wagmi als dominante Connector-Library aktiv verifiziert (gepusht am Tag des Checks).

Vault-Dual-Write (Wallets, Dev-Setup & Testnets +1, 6→7 Guides), MOC/Praxis-Referenz 201→202, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt. **SESSION-ABSCHLUSS: 169→202 (33 neue Guides, Blöcke 97-114) + kompletter Architektur-Umbau (Guide-Content in privates Repo ausgelagert) + Repo-Neuanlage (Historie-Purge auf Philipps expliziten Wunsch) + neue Domain web3knowlage.vercel.app.**

### Block 113 (2026-07-29) — autonome Fortsetzung
1 Guide (200→201): `onchain_options_protocols` — Options als strukturell andere DeFi-Primitive neben Perps: Off-Chain-Orderbook + On-Chain-Settlement (Derive, Aevo) statt On-Chain-AMM, European-Style TWAP-Settlement (30-Min-Fenster, verifiziert gegen Derives eigene Doku), Cash-Settlement + Cross-/Portfolio-Margining, DOV-Structured-Products-Linie (Lyra-Ursprung). **Echtes, unabhängig verifiziertes Aktivitäts-Delta:** derivexyz-SDK-Repos (derive-rs/derive-ts) gepusht am/kurz vor dem Check-Tag, aevoxyz/aevo-sdk zuletzt 2024-03-12 (>2 Jahre ruhig) — ehrlich als „prüfbares Signal, kein Beweis für Exchange-Status" gelabelt.

Vault-Dual-Write (Marktdaten, Perps & Oracles +1, 10→11 Guides), MOC/Praxis-Referenz 200→201, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 112 (2026-07-29) — autonome Fortsetzung
1 Guide (199→200): `op_stack_fault_proofs` — schließt die Lücke, die opstack_l2_fees bewusst offenließ: WARUM Withdrawals 7 Tage dauern. Cannon (MIPS64-Fault-Proof-VM) + FaultDisputeGame-Bisektions-Mechanismus (Streit verengt sich bis zu EINER MIPS64-Instruktion, die on-chain in MIPS64.sol entschieden wird) + DelayedWETH-Bond-Delay (7 Tage, damit der Contract-Owner bei Fehlern eingreifen kann) — alle Contract-Namen + Mechanismus direkt gegen das ethereum-optimism/specs-Repo verifiziert (gepusht am selben Tag wie dieser Check). Permissionless seit 2024-06-10 (Optimisms eigene Ankündigung), Multi-Proof-Zukunft (ZK neben Cannon) als Roadmap-Richtung benannt, nicht als Ist-Zustand.

Vault-Dual-Write (EVM Transaktionen, Gas & Debugging +1, 14→15 Guides), MOC/Praxis-Referenz 199→200, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 110 (2026-07-28) — autonome Fortsetzung
1 Guide (197→198): `zkvm_onchain_verification` — SP1 (`ISP1Verifier.verifyProof`) vs. RISC Zero (`IRiscZeroVerifier.verify`/`verifyIntegrity`) On-Chain-Interfaces, beide direkt gegen die Raw-GitHub-Quelle verifiziert (sp1-contracts, risc0-ethereum — sp1 gepusht am selben Tag wie dieser Check). SP1-Verifier-Gateway-Adresse auf Ethereum-Mainnet via eth_getCode als echter Bytecode bestätigt. STARK-in-SNARK-Wrap-Pattern erklärt (warum On-Chain-Verifikation konstant-billig ist, unabhängig von der Off-Chain-Rechenmenge). Prover-Netzwerk-Modell (Succinct Prover Network, RISC Zeros Boundless — Mainnet-Beta auf Base) als Alternative zum Selbst-Betreiben einer Prover-Farm; Boundless-Produktionsnutzung (EigenLayer/Celestia/Taiko/Lido) klar als „reported, nicht unabhängig nachverifiziert" gelabelt.

Vault-Dual-Write (Smart-Contract-Entwicklung EVM +1, 15→16 Guides), MOC/Praxis-Referenz 197→198, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

**Zwischenzeitlich (2026-07-28, spät):** Auf Philipps expliziten Wunsch wurde die Repo-Historie zusätzlich WIRKLICH bereinigt (reiner Squash reichte nicht — alte SHAs blieben per direkter GitHub-API abrufbar). Repo komplett gelöscht + unter demselben Namen neu angelegt (via sauberes Zwischen-Repo + Rename, um nie ganz ohne Repo dazustehen), Backup lokal im Vault. Vercel-Git-Integration blieb automatisch verbunden. Neue Zusatz-Domain `web3knowlage.vercel.app` hinzugefügt. Details: Memory `reference_crypto_knowledge_private_content.md`.

### Block 111 (2026-07-29) — autonome Fortsetzung
1 Guide (198→199): `based_rollups_preconfirmations` — Taikos Based-Rollup-Design (Ethereum-L1-Validatoren sequenzieren L2-Blöcke direkt, kein separater Sequencer) + Preconfirmations als Ersatz für die verlorene Instant-Soft-Confirmation. Sequencing→Batching→Proposing-Flow + PreconfWhitelist-Contract (2 Operatoren) + 3 Block-Building-Operatoren (Nethermind/Chainbound/Gattaca) direkt aus Taikos Doku übernommen (nicht gegen den Contract selbst nachverifiziert). Commit-Boost als teamübergreifender Standard-Sidecar (70+ Teams). Puffers UniFi AVS (EigenLayer-Restaking) **Aktivitäts-Delta ehrlich benannt**: Taiko+Commit-Boost-Repos beide am Tag des Checks gepusht, Puffers Preconf-Repo ~3,5 Monate ruhig.

Vault-Dual-Write (EVM Transaktionen, Gas & Debugging +1, 13→14 Guides), MOC/Praxis-Referenz 198→199, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed. Baseline unberührt.

### Block 109 (2026-07-28) — Guide + Architektur-Umbau (Philipp-Auftrag: Content darf nicht mehr kostenlos über GitHub lesbar sein)
**1 Guide (196→197):** `solana_staked_connections` — Gegenstück zu `jito_bundle_submission` für Einzel-Txs ohne Atomaritäts-Bedarf: Helius Sender (Multi-Pathway-Fan-out, Endpoints+Tip-Mechanik live gegen Heliusʼ eigene Doku verifiziert), 0slot (eigener Tip-Account/Minimum, live gegen 0slots Seite verifiziert), breitere Relay-Kategorie (Nozomi/Temporal/NextBlock) explizit als „reported, nicht endpoint-getestet" gelabelt.

**Architektur-Umbau (Philipp: „Github Repo ist public, jeder kommt kostenlos an den kompletten Guide-Content — das muss geändert werden"):** Reflex „ganzes Repo privat" verworfen (bricht Discoverability-Strategie, löst nichts rückwirkend, 0 Forks aktuell verifiziert aber kein Automatismus dagegen) — stattdessen sauber getrennt: neues **privates Repo `DerDoPhil/crypto-knowledge-content`** hält jetzt `guides.json` (197 Guides, aus der alten `guides.ts` migriert + Feld-für-Feld verifiziert), `src/modules/knowledge/guides.ts` im PUBLIC Repo ist auf 51 Zeilen geschrumpft (nur noch Interfaces + Top-Level-Await-Fetch über die GitHub Contents API mit `GITHUB_CONTENT_TOKEN`, fine-grained PAT, read-only, nur dieses eine Repo). Dank Top-Level-Await bleiben ALLE bestehenden Konsumenten (search.ts, tool.ts, api/tools/knowledge.ts, gen-brain-data.ts, alle Tests) unverändert — kein DI-Refactor. **Verifiziert: alle 91 Tests weiterhin grün** (inkl. der 29 content-abhängigen search.test.ts-Assertions wie `healthFactor`/`depositForBurn`) — Beweis, dass der Fetch denselben Datensatz liefert. `guides.ts` enthält jetzt nachweislich keine Guide-Bodies mehr (grep-Probe negativ). `GITHUB_CONTENT_TOKEN` in Vercel (Production+Development) + lokal `.env` gesetzt. references.ts (GUIDE_SECTIONS/ADDRESSES/ENDPOINTS/ERRORS/GOTCHAS/ABIS) bleibt bewusst public — Referenztabellen, nicht der von Philipp genannte "Guide-Inhalt". **Bewusst NICHT gemacht:** Git-Historie des public Repos bereinigen (alle bisherigen Commits enthalten weiterhin den alten Guide-Text) — separate, deutlich disruptivere Entscheidung, nicht Teil dieses Umbaus.

Vault-Dual-Write (Solana Agent-Wissen +1, 19→20 Guides; TOC-Lücke bei jito_bundle_submission nebenbei gefixt). MOC/Praxis-Referenz 196→197. tsc grün, vitest 91 passed. Baseline unberührt (Manifest nicht angefasst).

### Block 105 (2026-07-28) — autonome Fortsetzung
1 Guide (192→193): `depin_tokenomics` — **fünfter, strukturell eigener Flywheel-Archetyp** neben ve(3,3)/Buyback-Burn/POL/Fee-Switch-Burn-Gate: Heliums Proof-of-Coverage nutzt RF-Physik selbst (Signalstärke ∝ 1/Distanz², Lichtgeschwindigkeits-Ausbreitung) als Anti-Spoofing — Challenger/Target/Witness-Rollen verifiziert via Heliums Devdocs; **Burn-and-Mint-Equilibrium verifiziert: HNT-Emission passt sich JEDE EPOCHE dynamisch an tatsächlich gemessenen Netzwerk-Nutzungs-Burn an** (Unternutzung → Nachmint ins Subnetzwerk-Treasury statt fixem Plan) — Supply an echte physische Nachfrage gebunden statt Finanz-Aktivität. Beide Helium-Repos (HIP + helium-program-library) hochaktiv (Pushes 2026-07-13 bzw. buchstäblich den Tag vor Check). io.net/Render Network als Breite ergänzt, aber ehrlich als „reported, weniger verifiziert" gelabelt. DePIN-Marktgröße (~9-10 Mrd.$ 2026) klar von spekulativer 3-Billionen-$-2028-Prognose getrennt.

Vault-Dual-Write (Trading-Strategien&Bots +1), MOC/Praxis-Referenz 192→193. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

### Block 106 (2026-07-28) — autonome Fortsetzung
1 Guide (193→194): `data_availability_layers` — modulare DA-Alternativen zu EIP-4844-Blobs, als **strukturell eigenes drittes Sicherheitsmodell** neben Rollup-Sequencing und Ethereum-nativer DA: Celestia (eigene L1 + Data-Availability-Sampling, leichte Nodes prüfen per Erasure-Coding ohne volle Daten zu laden), EigenDA (Restaking-gesichertes Operator-Committee via EigenLayer, ökonomische statt kryptografische Sicherheit), Avail (Validity-Proofs + KZG-Commitments, ähnliches Sampling-Modell wie Celestia mit anderem Trust-Stack). Alle drei Repos (celestiaorg/celestia-node, Layr-Labs/eigenda, availproject/avail) live als aktiv entwickelt verifiziert Stand 2026-07-28 (einer davon mit Push am selben Tag). Warnungen klar getrennt: Celestia/Avail-Sampling ist kryptografisch/statistisch abgesichert, EigenDA-Sicherheit hängt vom Restaking-Committee (ökonomisches statt kryptografisches Modell) ab — keine der drei ist ein Drop-in-Ersatz ohne eigene Bridge-/Verifier-Integration auf der L1.

Vault-Dual-Write (EVM Transaktionen, Gas & Debugging +1, 12→13 Guides), MOC/Praxis-Referenz 193→194, llms.txt-Prosa ergänzt. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

### Block 107 (2026-07-28) — autonome Fortsetzung
1 Guide (194→195): `superchain_interop` — **sechster, strukturell eigener Trust-Model-Bucket** neben den fünf aus bridge_security_trust_models: OP-Stack-natives Interop (Base/OP Mainnet/weitere „Standard"-Charter-Chains) via burn-mint desselben Token-Contracts statt Lock-Mint einer Wrapped-Version. Alle drei Predeploy-Adressen (CrossL2Inbox 0x...0022, L2ToL2CrossDomainMessenger 0x...0023, SuperchainTokenBridge 0x...0028) **doppelt verifiziert**: einmal via WebFetch gegen specs.optimism.io, einmal unabhängig via `curl` direkt gegen die Raw-Markdown-Quelle im ethereum-optimism/specs-GitHub-Repo — identisch. ERC-7802-Funktionssignaturen (crosschainMint/crosschainBurn + Events) direkt gegen eips.ethereum.org verifiziert, Status **Draft** (nicht Final) klar gelabelt. Rollout-Status ehrlich eingeordnet: offizielle OP-Stack-Doku sagt selbst „in aktiver Entwicklung, manche Features experimentell", kein zugesagtes Mainnet-überall-Datum — explizit als Warnung aufgenommen, nicht als „ist live" verkauft. Drei Safety-Level (unsafe/safe/finalized) + das neue, additive Sequencer-Reorg-Risiko von 'unsafe'-Reads als eigener Denkfehler-Punkt herausgearbeitet.

Vault-Dual-Write (Swaps, Bridges & Cross-Chain +1, 14→15 Guides), MOC/Praxis-Referenz 194→195, llms.txt-Prosa ergänzt (Swaps-Absatz). tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

### Block 108 (2026-07-28) — autonome Fortsetzung
1 Guide (195→196): `mev_share_order_flow_auctions` — Gegenstück zu `mev_strategies`: statt Order-Flow nur zu verstecken, kontrolliert Sichtbarkeit an Searcher verkaufen und einen Anteil des Backrun-Profits zurückbekommen. Event-Stream-Endpoint `https://mev-share.flashbots.net` live via curl verifiziert (200, content-type text/event-stream), Event-Schema + `mev_sendBundle`-Format (inclusion/body/validity.refund+refundConfig/privacy.hints) über zwei unabhängige WebFetch-Abfragen gegen die offizielle Flashbots-Doku gegengeprüft, Protect-RPC-Redirect (`protect.flashbots.net`) live via curl bestätigt (302, echte Infra). Default-Refund 90% + „nur Backruns, kein Sandwich-Ermöglicher" klar herausgestellt; Warnung zum Hint/Leak-Tradeoff und zur fehlenden Solana-Äquivalenz (Jito hat keinen Refund-Prozentsatz-Mechanismus).

Vault-Dual-Write (Trading-Strategien & Bots +1, 22→23 Guides), MOC/Praxis-Referenz 195→196, llms.txt-Prosa ergänzt (Trading-strategies-Absatz). tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

**Laufende Session-Bilanz (Blöcke 97-105, 2026-07-27/28): 169→193, 24 neue Guides.**

### Block 104 (2026-07-28) — autonome Fortsetzung
1 Guide (191→192): `quadratic_funding_retropgf` — exakte QF-Formel verifiziert (F(p)=(Σ√c_i)², Match=F−C); **Kollusions-Schwachstelle + MACI-Fix verifiziert** (MACI-Repo gepusht 5 Tage vor Check, Gitcoins GG24-Runde nutzte es via „Privote"); Gitcoin-Skalen-Fakten (GG24: 55 Projekte/1.028 Spender/220 Mio.$ kumulativ). Als Kontrastmodell Optimisms RetroPGF/Retro Funding (4 Runden, >100 Mio.$, **850 Mio. OP = 20% Gesamt-Supply langfristig reserviert**) — retroaktiv statt prospektiv, umgeht QFs Versprechen-vs-Lieferung-Lücke; 2025er Struktur-Wandel (periodische Jahres-Runden → kontinuierliche Evaluation) ehrlich als „Mechanismus im Umbau" markiert statt als Fixzustand.

Vault-Dual-Write (Trading-Strategien&Bots +1), MOC/Praxis-Referenz 191→192. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

**Laufende Session-Bilanz (Blöcke 97-104, 2026-07-27/28): 169→192, 23 neue Guides.**

### Block 103 (2026-07-28) — autonome Fortsetzung (Philipp „weiterweiter... bis du kein usage mehr hast")
2 weitere Guides (189→191): `sybil_resistant_points_programs` (Human Passport [ex-Gitcoin Passport, seit Feb.2025 Holonym-Foundation-Übernahme — Namensänderung bestätigt via Web-Recherche] + EAS als Identitäts-Bausteine; **LayerZeros 2024er Sybil-Cleanup als größte dokumentierte Operation der Airdrop-Geschichte verifiziert: 803.093 von ~2,08 Mio. Wallets [39%] geflaggt, 3-Phasen-Mechanismus inkl. Community-Bounty-Hunter-Phase [10% Reward fürs Melden fremder Sybils] als genuin neuartiges Crowdsourcing-Element hervorgehoben**) · `vote_bribe_markets` (Vertiefung zu tokenomics_flywheels' ve(3,3)-Bribes aus Block 100; Votium+Hidden Hand beide live [Votium-Contracts-Repo gepusht 7 Tage vor Check]; **Convex' ~50%-veCRV-Konzentration als Zentralisierungs-Lehre** — „dezentrale" Gauge-Governance läuft praktisch über einen Meta-Aggregator; historischer >50%-APY-Bribe-Peak vs. ehrlicher 2026er Zustand: läuft weiter, aber „Bruchteil des 2021er Volumens" bei strukturell schrumpfendem Curve-Emissions-Plan [~16%/Jahr August-Kürzung]).

Kleiner Selbstfehler beim Einfügen bemerkt+sofort korrigiert: doppeltes `topic:`-Feld beim Voranstellen des Vote-Bribe-Guides vor fee_switch_design_patterns, per tsc-Check gefangen bevor committet wurde.

Vault-Dual-Write (Trading-Strategien&Bots +2), MOC/Praxis-Referenz 189→191. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

**Session-Gesamtbilanz (Blöcke 97-103, 2026-07-27/28): 169→191, 22 neue Guides.** Grok-Recherche-Kontingent über die GESAMTE Session nicht verfügbar — komplett per Lead-Recherche gearbeitet. Zusätzlich: unabhängig entdeckte SEO-Arbeit einer Parallel-Session (robots.txt/sitemap.xml/brain.html-OG-Tags) nach Sicherheits-/Breaking-Change-Prüfung mit-committet (Philipp-Freigabe „wenn nicht breaking").

### Block 102 (2026-07-28) — autonome Fortsetzung (letzter Guide dieser Sweep-Session)
1 Guide (188→189): `fee_switch_design_patterns` — Uniswaps Fee-Switch-Toggle war seit v2 (2020) im Contract ruhend, erst per „UNIfication"-Governance-Vote (Dez. 2025, 99,9% Zustimmung) aktiviert; exakter Mechanismus aus dem Proposal zitiert (feeTo→TokenJar-Contract, feeToSetter→Governance-Timelock; v3-Factory-Ownership→v3FeeController); v2-Split 0,30%→0,25%LP+0,05%Protokoll, v3 tier-abhängig 1/4 oder 1/6 der LP-Fee. **Neuartiger, bislang nirgends im Tool erfasster Flywheel-Mechanismus verifiziert: TokenJar/Firepit — Fees nur abhebbar, wenn UNI im separaten Firepit-Contract verbrannt wird = Burn strukturell erzwungen, kein Ermessen** (Kontrast zu Hyperliquids diskretionärem Buyback-and-Burn aus tokenomics_flywheels, Block 100). **Live-unentschiedene Governance-Lage ehrlich eingeordnet:** Juli-2026-Erweiterungs-Votes (v4-Pools über 11 Chains + Robinhood Chain) hatten Stand Check nur ~7,4% des 40-Mio.-UNI-Quorums erreicht trotz 93%-Temperature-Check-Zustimmung — nicht als entschieden dargestellt.

Vault-Dual-Write (Trading-Strategien&Bots +1), MOC/Praxis-Referenz 188→189. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

**Session-Gesamtbilanz (Blöcke 97-102, 2026-07-27/28): 169→189, 20 neue Guides in einer durchgehenden autonomen Sweep-Session** — 3 BTC-Contracts (DLC/RGB/Covenants) + BitVM2 + Stacks/Clarity (5 gesamt), 5 ETH-Contract-Dev-Lücken, Contract-/Chain-Migrationen, Bridge-Security/API-Keys/Agent-Wallets (3), und 6 praktische Web3-Dev-Themen (Tokenomics-Flywheels/Market-Making/Vesting/Merkle-Airdrops/Referral-Loops/Fee-Switches). Grok-Recherche-Kontingent durchgehend nicht verfügbar (Blöcke 97-102) — komplett per Lead-Recherche (WebFetch/WebSearch/gh) gearbeitet, oft präziser als Modell-Zusammenfassungen (direkte GitHub-API-Push-Daten, direkte Source-Zitate).

### Block 101 (2026-07-28) — autonome Fortsetzung von Block 100 (Philipp „weiter", kein neuer Auftrag)
2 weitere Guides (186→188), Themenwahl weiter autonom, gleiche Rigor:
- `merkle_airdrop_distributor` — Uniswaps kanonisches MerkleDistributor-Muster exakt aus Source zitiert (claim/isClaimed-Bitmap/Leaf-Hash); **echte, nicht weithin bekannte Schwachstellenklasse verifiziert: Second-Preimage-/Leaf-vs-Internal-Node-Hash-Kollision** (zwei interne Node-Hashes als Leaf reinterpretierbar, Standard-Fixes Double-Hashing/Domain-Separation via mehrere Quellen + offenes OZ-GitHub-Issue bestätigt); ZKsync-Fall (April 2025, 111 Mio. ZK durch Admin-Key-Kompromiss unautorisiert gemintet) sauber als ANDERE Fehlerkategorie (Key-Custody, kein Merkle-Logik-Bug) eingeordnet.
- `referral_growth_loops` — GMXs On-Chain-Referral-Mechanik direkt aus offiziellen Docs zitiert (Code wird bei erster Order auf Contract-Ebene gebunden, ReferralCodeValidator auf Arbitrum + LayerZero-Cross-Chain-Propagation, exakte Tier-Prozente 5/5→10/10→10/15); **ehrlich als Lücke markiert:** GMXs eigene Docs behaupten Self-Referral-Prävention, legen den konkreten technischen Mechanismus aber nicht offen — als Design-Ziel statt verifizierte Garantie gelabelt.

Vault-Dual-Write (Trading-Strategien&Bots +2), MOC 186→188 + Sektions-Zähler, Praxis-Referenz 186→188, llms.txt/about.html/gen:brain 188/21/80. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

### Block 100 (2026-07-28) — Philipp „weiter sweepen und einbauen voll autonom auswählen welche themen. Fokus: praktisch für web3 entwicklung vllt flywheels volume bots etc etc"
Themenwahl komplett autonom (Gap-Analyse gegen alle 183 bestehenden Topic-IDs, keine Duplikate). 3 neue Guides (183→186), alle tragenden Aussagen live verifiziert (DefiLlama-TVL, GitHub-Push-Daten, OpenZeppelin-Source-Fetch, dokumentierte Enforcement-Fälle):
- `tokenomics_flywheels` — 3 echte, verschiedene Flywheel-Archetypen: ve(3,3) (Aerodrome, Base-dominant, Slipstream-TVL ~155,9 Mio.$ live) emissions-getrieben; Buyback-and-Burn (Hyperliquid Assistance Fund, >1,3 Mrd.$ annualisiertes Revenue, ~45,7 Mio. HYPE formell verbrannt) revenue-getrieben; Protocol-Owned-Liquidity (Olympus DAO, ~298 Mio.$ Marktkapitalisierung April 2026, überlebte den 2022er OHM-Fork-Kollaps via RBS+Cooler-Loans-Weiterentwicklung) — ehrlich als fragilstes der drei eingeordnet.
- `market_making_bots` — Two-Sided-Quoting + Inventory-Skew-Mechanik (Avellaneda-Stoikov-Theorie) auf Hyperliquid (kein privilegiertes MM-Programm, jeder kann MM, Maker-Rebate -0,003%); **Self-Trade-Prevention live gegen Hyperliquid-Doku verifiziert** (Same-Address-Match storniert die Resting-Order statt zu füllen — macht Same-Wallet-Wash-Trading strukturell sinnlos, zwingt zu Multi-Wallet-Koordination); konkreter Enforcement-Fall SEC v. Rainberry/Justin Sun ($10-Mio.-Vergleich, März 2026) als Gegengewicht zu „macht doch jeder für Rankings".
- `token_vesting_lock_patterns` — OpenZeppelin VestingWallet/VestingWalletCliff exakte Formel direkt aus aktuellem Source zitiert (linear, nicht-widerrufbar per Design — 0 Treffer für „revoke" im Code bestätigt); Sablier (Push 2026-07-15) als widerrufbare Alternative; **Team-Finance-Hack (Okt. 2022, 14,5 Mio.$, Migrations-Funktions-Bug den ein Audit übersah)** als Lehre, dass ein Third-Party-LP-Locker trotz „locked"-Badge eigenes Contract-Risiko trägt.

**Zwischendurch:** Philipp bat um Security-Check von github.com/kukapay/crypto-skills (Verdacht: könnte Scam sein). Passiv geprüft (nur Metadaten/Read via gh api + WebFetch, nichts geklont/ausgeführt): etablierter Entwickler (101 Repos, 174 Follower, Fokus Krypto-MCP-Server), MIT-lizenziert, alle 6 Skills gelesen inkl. des einzigen ausführbaren Scripts (generate_contract.py — triviale ERC20-Boilerplate-Generierung, keine Netzwerk-/Wallet-Interaktion) — **unbedenklich, aber nichts Neues für unser Tool** (Überschneidendes bereits tiefer abgedeckt, Rest zu generisch/außerhalb On-Chain-Fokus). Nichts übernommen.

Grok weiterhin nicht verfügbar für Recherche-Calls (Kontingent-Muster aus Block 97-99 bestätigt sich); komplett per Lead-Recherche (WebSearch/WebFetch/gh) gearbeitet. Vault-Dual-Write komplett (Trading-Strategien&Bots +1, Web3-Security&Forensik +1, Smart-Contract-Entwicklung-EVM +1), MOC 183→186 + 3 Sektions-Zähler, Praxis-Referenz 183→186, llms.txt/about.html/gen:brain 186/21/80. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

### Block 99 (2026-07-27) — Philipp-Nachtrag „und Umzüge von Contracts zwischen Chains bitte noch"
1 neuer Guide (182→183): `contract_chain_migrations` — desambiguiert drei oft verwechselte Mechanismen (Token-Migration via Swap/Merkle-Drop / proaktiver CREATE2-Same-Address-Multi-Deploy / vollständige Chain-Migration mit erhaltenem State). **Fallstudie selbst on-chain verifiziert:** Celos 2025er Umzug von unabhängiger L1 zu Ethereum-L2 — chainId 42220 unverändert (eth_chainId live geprüft) UND cUSD-Contract 0x765DE816…B1282a hat lebenden Bytecode an identischer Adresse nach der Migration (getCode live geprüft) — Migration bei Block 31056500, 2025-03-26, via OP Stack + EigenDA, State komplett per Genesis-Import übernommen statt Bridge/Redeploy. Cross-Referenzen statt Duplikat zu bereits vorhandenen Fällen (Polygon MATIC→POL in polygon_playbook, USDC.e→native USDC in optimism_playbook). Security-Sektion: Migrations-Ankündigungen als Phishing-Template (723 Mio.$ Phishing-Verluste 2025 reported) + Verifikations-Checkliste. Grok erneut probiert (Philipp „weiter auch mit Grok, max infos" aus Block 98) — schon der einfache Text-Call traf diesmal das Kontingent, Lead-Recherche direkt fortgesetzt. Vault-Dual-Write (Smart-Contract-Entwicklung EVM.md +1 Sektion), MOC 182→183 + Sektions-Zähler, Praxis-Referenz 182→183, llms.txt/about.html/gen:brain 183/21/80. tsc grün, vitest 91 passed (derselbe vorbestehende pubkey.test.ts-Fail). Baseline unberührt.

### Block 98 (2026-07-27) — Philipp „weiter voll autonom" nach Block 97: 2 weitere BTC-Contract-Guides + Praxis-Referenz-Staleness-Fix
Fortsetzung desselben Sweeps ohne weitere Rückfrage. Zuerst Praxis-Referenz.md-Drift gefixt (zeigte weiter "111 Guides" von 2026-07-07 trotz Tool-Stand 180 — 3 Stellen auf 182 korrigiert). Dann 2 neue Guides (180→182), auf Philipps "weiter auch mit grok, max infos" hin Grok erneut probiert (einfacher Text-Call ging durch, der eigentliche Recherche-Call traf erneut das "free Grok Build usage limit" — Lead-Recherche wie in Block 97 fortgesetzt):
- `bitcoin_bitvm2` — Fraud-Proof-Computation-Verification ohne Soft-Fork; BitVM1→BitVM2-Delta (permissionless Challenger statt fixem Komitee, 2-Runden-Disputes statt vieler) live gegen mehrere Quellen geprüft; Referenz-Repo BitVM/BitVM weiter bei dev/alpha-Tags (letzter Push 2026-01-26) — **echte Produktions-Bridges sind wo das Momentum liegt:** Bitlayers "BitVM Bridge" (Mainnet Juli 2025, YBTC) + Citreas "Clementine" (Citrea-Mainnet 2026-01-27 live per Direkt-Fetch verifiziert, volle BitVM-Aktivierung aber zuerst auf Testnet bewiesen — Sequenzierungs-Nuance ehrlich als offen markiert, chainwayxyz/clementine-Repo aktiv, Push 2026-07-14). Als sechstes Bridge-Trust-Model explizit von bridge_security_trust_models abgegrenzt.
- `stacks_clarity_contracts` — **aktivstes Ding im ganzen Sweep:** stacks-core UND sbtc beide gepusht am Check-Tag selbst (2026-07-27), Clarinet 4 Tage zuvor (v3.22.0). PoX-Mechanik, Clarity decidable/non-Turing-complete/kein dynamic dispatch (verifiziert), sBTC 70%-Signer-Threshold (SIP-028, Signer-Rolle GETRENNT von Stacks' eigenen Nakamoto-Block-Signern). **TVL-Sorgfalt:** selbst verifizierte DefiLlama-Chain-TVL (~81,5 Mio.$) klar von einer weit gestreuten PR-Zahl (Q1-2026 sBTC-TVL 437-545 Mio.$, EINE Chainwire-Meldung über 5 Portale repliziert, hier NICHT unabhängig kreuzverifiziert) unterschieden — nicht verwechseln. Ehrliche Sicherheits-Lektion: Zest Protocol (Stacks' reported größtes Lending-Protokoll) wurde trotz Claritys Decidability-Design 04/2024 für ~1 Mio.$ über Borrow-Pool-Logik exploited — Decidability verhindert eine Bugklasse, keine Anwendungslogik-Fehler (Parallele zu formal_verification_halmos_certora).

**Vault-Dual-Write komplett** (Bitcoin Ressourcen.md +2 Sektionen, TOC+Kopfzeile aktualisiert), Web3-Wissen-MOC 180→182, Praxis-Referenz 111→182 (Drift-Fix). llms.txt/about.html/gen:brain 182/21/80. tsc grün, vitest 91 passed (derselbe vorbestehende sweep-unabhängige pubkey.test.ts-Fail wie Block 97). Baseline 0xf5ff3a29… unberührt (Manifest nicht angefasst).

### Block 97 (2026-07-27) — Philipp-Auftrag „BTC contracts + ETH smart contracts, dann Bridges/API-Keys/Agent-Wallets" (Lead inline, Grok-Quota nach 1 Call erschöpft → Lead-Recherche via WebFetch/WebSearch/gh direkt)
11 neue Guides (169→180), alle tragenden Aussagen selbst verifiziert (GitHub-API push-dates, eips.ethereum.org Live-Fetch, on-chain eth_call, curl-Reachability-Checks) — **Grok-Fallback-Note:** `grok -p` traf nach dem ersten Research-Call (Discreet Log Contracts) das "free Grok Build usage limit"; laut Fallback-Prinzip nicht gewartet, sondern ab da direkt mit WebSearch/WebFetch/gh weiterrecherchiert (lieferte teils präzisere Primärquellen-Treffer als Grok's erster Teil-Output, z. B. GitHub-Push-Daten statt Prosa).

**Bitcoin „Contracts" (Lücke: vorher nur Basics/Taproot/Runes/Lightning):**
- `bitcoin_dlc_contracts` — Discreet Log Contracts: Adaptor-Signaturen + Oracle-Attestation-Mechanik (dlcspecs Introduction.md wörtlich verifiziert); **ehrlicher Adoptions-Befund:** dlcspecs-Spec eingefroren seit 2023-06-21 (22 Issues offen), einzige 2026-aktive Implementierung ist bitcoin-s (Suredbits, Push 2026-07-25), rust-dlc selbst als "early stage, nicht für Mainnet" gekennzeichnet, 10101.finance (Flaggschiff-Consumer-App) 2024 eingestellt, oracle.suredbits.com beim Live-Check nicht erreichbar
- `bitcoin_rgb_protocol` — Client-Side-Validation + Single-Use-Seals; Mainnet seit Juli 2025 (v0.11.1); **Spec-Org (RGB-WG) vs. Praxis-Stack (RGB-Tools/Bitfinex) — deutlich unterschiedliches Tempo:** RGB-WG-Kernrepos größtenteils seit Mitte 2025 still, RGB-Tools (rgb-lib/rgb-lightning-node/Iris-Wallet) täglich aktiv (rgb-lib gepusht am Check-Tag selbst); BitMask/Tether-Presseerklärung (Nov 2025) gegen bitmask-core-Repo (2024-02 stale) geprüft → Verifikationslücke offen gelegt; KaleidoSwap bewies RGB20-Stablecoin-Swap auf Lightning-Mainnet, App selbst aber weiter Alpha/Testnet-only laut eigener Doku
- `bitcoin_covenants` — OP_CTV (BIP-119, Draft seit Jan 2020) / OP_VAULT (BIP-345, **Closed, abgelöst durch BIP-443/OP_CCV**) / OP_CAT (BIP-347, Complete-Status ≠ aktiviert); **live gefangen:** 2026er UASF-Aktivierungsversuch für CTV läuft (Fenster seit 2026-03-30), Miner-Signaling aber bei ~0% drei Monate rein — Taproot bleibt der letzte tatsächlich aktivierte Soft-Fork

**ETH Smart-Contract-Dev-Lücken (Rest war schon stark abgedeckt):**
- `session_keys_and_paymasters` — Vertiefung zu account_abstraction_dev: ERC-7579 (Draft, Real-Adoption via Biconomy Nexus) + Rhinestone Smart Sessions (Modul-Repo gepusht 2026-07-06) vs. ERC-7715 (Draft, exakte RPC-Methodennamen — verbreitetes "wallet_grantPermissions" ist FALSCH) + MetaMask Delegation Toolkit (Push am Check-Tag) + ERC-7677 (Review-Status, exakte pm_getPaymasterStubData/pm_getPaymasterData-Signaturen) + EntryPoint-addStake/depositTo-Interface wörtlich aus eip-4337 zitiert
- `diamond_pattern_eip2535` — EIP-2535 ist tatsächlich FINAL (nicht Draft); exaktes diamondCut/Loupe-Interface zitiert; Aavegotchi als aktiv gepflegte Referenz-Diamond (Push 2026-02-11) vs. mudgen-Referenzimplementierungen (2+ Jahre stale); louper.dev als lebender Diamond-Inspector (v3 gepusht 2026-07-06)
- `formal_verification_halmos_certora` — Halmos (Foundry-natives symbolisches Testen, `check_`/`prove_`-Konvention, echtes Beispiel aus eigener Doku zitiert) vs. Certora Prover (**gerade Open Source gegangen**, >100 Mrd. $ TVL verifiziert, CVLR für Solana/Stellar); **Aktivitäts-Lücke gefangen:** Halmos seit ~11 Monaten ohne Release (letzter Push 2025-08-06) vs. Certora-Push 2026-07-21
- `erc6900_modular_accounts` — Alchemys Standard (3 Modul-Typen, ERC-7201-Storage vorgeschrieben) vs. ERC-7579; **Markt-Entscheidung dokumentiert:** Safe/ZeroDev/Biconomy/Rhinestone/OpenZeppelin auf ERC-7579, ERC-6900 im Wesentlichen nur Alchemy selbst (Community-Repos seit 2025 still, Alchemys eigenes Modular-Account-Produkt aber aktiv gepflegt, Push 2026-05-06)
- `uniswap_v1_v2_v3_evolution` — exaktes Mechanik-Delta (ETH-only-Pools → direkte ERC20-Paare+TWAP-Oracle+Flash-Swaps → konzentrierte Liquidität+NFT-Positionen+Multi-Fee-Tiers), Factory-Adressen + alle 4 v3-Fee-Tiers on-chain via feeAmountTickSpacing() verifiziert; **live TVL-Split (DefiLlama):** v1 ~3,16 Mio.$ (praktisch tot) vs. v2 ~662,8 Mio.$ (weiterhin sehr lebendig) vs. v3 ~868,8 Mio.$ (größte)

**Philipp-Nachtrag (mid-Sweep): Bridges vertiefen + mehr autonome API-Keys + Agent-Wallet-Guide:**
- `bridge_security_trust_models` — Trust-Model-Taxonomie (Lock-Mint-Custodial/Guardian-Attestation/Optimistic/Native-Burn-Mint/Liquidity-Intent) + Wormholes 19-Guardian/13-Threshold-VAA-Mechanik (docs live verifiziert) + **4 reale Hack-Postmortems mit exaktem Fehlermodus:** Ronin (~625 Mio.$, Key-Kompromiss 5-von-9) / Wormhole (~320 Mio.$, Signaturverifikations-Bug im Contract) / Nomad (~190 Mio.$, Trusted-Root=0x00-Upgrade-Bug → permissionless Free-for-all) / Multichain (~126 Mio.$, "MPC" verdeckte Ein-Personen-Custody, CEO-Verhaftung) — Muster: nie die Kryptografie bricht, immer Key-Konzentration oder Implementierungs-Bug
- `autonomous_api_key_acquisition` — Katalog agent-autonomer Key-Beschaffung: OpenSea requestInstantApiKey (reiner POST, 3/h/IP) + dRPC SIWE→x402/EIP-3009-USDC-Fallback (drpc-agent-skills gepusht 2026-06-21) als generelles x402-Muster; klar abgegrenzt von Infura/Alchemy/Etherscan/QuickNode (E-Mail+CAPTCHA, nicht autonom provisionierbar)
- `agent_wallet_provisioning` — TEE-Sub-Organizations (Turnkey CREATE_SUB_ORGANIZATION in AWS-Nitro-Enclaves, Dfns POST /wallets + Policy-Engine/Delegation-Unterscheidung, Privy Server Wallets — alle drei am Check-Tag/binnen 2 Wochen aktiv gepusht) vs. lokale BIP-32/44-HD-Derivation; Lifecycle-Hinweis (Wallet pro Task erstellen UND abbauen)

**Vault-Dual-Write komplett** (6 Notes: Bitcoin Ressourcen +3, Signaturen/Auth/Smart-Accounts +2, Smart-Contract-Entwicklung +2, Swaps/Bridges/Cross-Chain +2, Agent-Economy +1, Wallets/Dev-Setup +1; alle TOCs + Datums-Header aktualisiert), Web3-Wissen-MOC 169→180 + 5 Sektions-Zähler korrigiert. llms.txt 169→180 + Coverage-Absätze ergänzt · about.html 180/80/71 · gen:brain 180/21/80 · skill.md regeneriert.
tsc grün, vitest 91 passed (1 vorbestehender, sweep-unabhängiger Fail: tests/pubkey.test.ts bricht an einem ESM/CJS-Require-Konflikt in rpc-websockets/uuid innerhalb der @solana/web3.js-Dependency-Kette — nicht durch diesen Sweep verursacht, nicht gefixt, da außerhalb Scope).
Bekannte vorbestehende Staleness (nicht in diesem Block behoben): `Infrastruktur/Web3 Praxis-Referenz.md` zeigt weiterhin "111 Guides" (Stand 2026-07-07) — Drift existierte schon vor diesem Sweep, eigener Nachzieh-Block empfohlen.

### 🔓 ACCESS-MODELL GEÄNDERT (2026-07-14, Philipp): Normie-Gate RAUS + Preis $0.02→$0.01
Reines x402-Pay-per-call für alle, KEIN NFT-Gate mehr. Server (config.ts priceAtomic=10000, enforce.ts
Holder-Pfad entfernt, gate.ts NFT-Check raus) + Manifest (access + io.opensea.access ENTFERNT, pricing 10000,
v1.4.0) + alle user-facing Texte + skill.md. **On-chain (creator #2 0x6f35): updateToolMetadata(71) tx
0x48ed6f01 → neue Hash-Baseline `0x575dfe50241ec86f552cc8ac87e6d9082cfe224484316c87d998c143b1915219`
(ersetzt 0xe0a6553a); setCollections(71,[]) tx 0xc5f80cdb → getRequirements(71)=0, Gate weg.** Live verifiziert
(402→$0.01/10000 ohne holderAccess, Manifest v1.4.0 kein access, on-chain Hash+getRequirements). vitest 75
(3 Holder-Tests entfernt). **NEUE REGRESSION-BASELINE für künftige Blöcke: 0x575dfe50 (nicht mehr 0xe0a6553a).**


### Block 96 (2026-07-21/22) — Dev-Fokus ETH/Robinhood/Solana + API-Credit-Saving (4 Opus-Agenten + PhilzAgents)
4 Guides (165→169), tragende Aussagen ALLE vom Lead unabhängig nachverifiziert (2 Wege): **solana_kit_web3js2**
(@solana/kit 7.0.0 = umbenanntes web3.js v2, 1.98.4 = Maintenance-Branch README-verbatim; kompletter build/sign-Pfad
live auf mainnet-beta exekutiert; gill-0.14.0-Falle: pinnt kit ^5.0.0 vs latest 7.0.0 → doppelte Kit-Kopien; Anchor 0.32.1
weiter web3.js-1.x; Codama 1.9.0 = Anchor-IDL→Kit-Client) · **solana_program_testing** (bankrun DEPRECATED README-verbatim
→ LiteSVM 1.3.0 Nachfolger, Live-Test 2× unabhängig: System-Transfer=150 CU; litesvm-1.x-läuft-auf-Kit-Falle 'value.split'
live reproduziert; Mollusk 0.14.0 CU-Bencher; surfpool v1.5.0 = anvil-für-Solana, crates.io-Eintrag 0.1.0 STALE;
LiteSVM-simulate-CU=0-Quirk dokumentiert) · **onchain_data_indexing** (Ponder 0.17.1/graph-cli 0.98.1/envio 3.2.1;
LEAD-KORREKTUR am Agenten-Report: publicnode served getLogs DOCH — aber nur ~50–100-Block-Fenster nahe Head (50 ok,
100→Archive-Fehler, selbst gemessen); HyperSync präzisiert: GET /height offen, POST /query 401 → NICHT keyless;
drpc Code-35-10k-Cap bestätigt; TheGraph hosted tot seit 2024-06; Helius-Webhooks free-tier UNSICHER gelabelt) ·
**robinhood_chain_dev** (Agent korrigierte eigene Task-Prämissen: scope ["evm"] statt "robinhood", L1-Fee fluktuiert statt 0;
DER Fang: Stock-Tokens sind BeaconProxies über EINE Stock-Impl 0xb35490d6… mit mint/adminBurn/pause + uiMultiplier —
Lead re-verifiziert inkl. Selektor 0xa60bf13d selbst berechnet → NVDA uiMultiplier()=1e18; Blockzeit 0,10s gemessen;
Blockscout-Verify keyless; ETFs SPY/SGOV neu; Playbook-Delta „field is EMPTY"→CROWDED CASHCAT 33k Holder; Stats 7.4M→126.7M txs).
**API-CREDIT-SAVING (Philipps Frage „System verbessern?", PhilzAgents-Zweitmeinung deckungsgleich; Gemini-CLI nicht mehr
installiert → Fallback):** (1) ask/search default: Rang 1 VOLL + Rang 2+ Previews (topic/title/summary/score) + PREVIEW_NOTE,
`full:true` = altes Verhalten — spart Output-Tokens massiv ohne den Ein-Call-Vorteil zu opfern; (2) get_guide-Miss RETTET den
bezahlten Call: eindeutiger Substring-Match → voller Guide mit resolvedFrom (uniswap_v3→uniswap_v3_swap_coding), sonst
Suggestions statt nacktem 404 (REST 404+suggestions, MCP ok-Envelope found:false); (3) reference bekommt `filter`-Param
(server-side AND-Terme, count+totalCount+hint) — ganze Tabellen nicht mehr nötig; (4) QUICKSTART/skill.md/llms.txt-Texte
nachgezogen. Alles rein additiv-optional → **Manifest v1.4.1 UNANGETASTET, Baseline 0xf5ff3a29 UNBERÜHRT**. vitest 75→101
(26 neue Tests), tsc grün. ask-Ranking: 6/6 neue Queries Rang 1. ADDRESSES Robinhood +6 (USDG/USDe/syrupUSDG/Stock-Impl/
Registry/NVDA) · ENDPOINTS +Envio-HyperSync (Duplikat-grep vorher!), TheGraph/Helius/Robinhood angereichert ·
ERRORS/RPC_GOTCHAS getLogs-Fenster präzisiert. llms.txt 164→169+Coverage · about.html 169/80/71 · gen:brain 169/21/80 ·
skill.md regeneriert. Vault-Dual-Write komplett: Solana-Note +2 Sektionen, Robinhood-Note +Dev-Sektion+3 Deltas,
NEUE Note „On-Chain-Daten indexieren (EVM + Solana)", Endpoints/Adressen/Gotchas-Deltas, MOC 169 + stale Zähler
44/67→71/80 gefixt + 4 Sektionslisten. Philipp-Entscheid 2026-07-22 („erstmal auf Agentenfreundlichkeit"): BEIDE umgesetzt —
**Batch-get_guide** ({topics:[…]} ODER Komma-topic; bis 5 volle Runbooks pro $0.01-Call; Überlänge wird GEKAPPT statt
abgelehnt + note, Miss-Rettung pro Topic mit resolvedFrom/suggestions, Dedupe) und **topK** (1–10, ask default 3 /
search default 5; topK:1 = bester Guide minimal-Token). vitest 101→108. Manifest weiter UNANGETASTET (additiv-optional),
Baseline 0xf5ff3a29 unberührt.

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

## ✅ Block 93 (2026-07-15) — Wallet-Batching + Advanced Gas + Pendle-Staleness-Fix
- [x] `eip5792_wallet_calls` — Wallet Call API FINAL: 4 RPC-Methoden, atomic-Capability (supported/ready/unsupported, MetaMask='ready'→7702-Upgrade-Prompt), viem sendCalls (forceAtomic, experimental_fallback), 6xx-Partial-Failure-Reconciliation; Wallet-Support reported 03/2026 (MetaMask/Coinbase/Rainbow/Trust)
- [x] `advanced_gas_patterns` — EIP-1153 transient (100 Gas, TX-scoped ≠ call-scoped → Batch-Falle!), **TSTORE-Poison solc 0.8.28–0.8.33 via-IR (delete-Helper-Cache vertauscht sstore/tstore, Fix 0.8.34 — Hexens-Disclosure)**, SSTORE2, Assembly-Kosten/Nutzen; schließt Grok-§18 „gas-optimization-assembly deep" — §18 KOMPLETT
- [x] Pendle-Delta: **alte /v1/sdk/…/swap-Routen sind 404 (live geprobt)** → Convert-API v2 GET / v3 POST, live-verifiziert mit echter wstETH→PT-Quote; Router V4 0x8888…F946 API-returned + Code-verifiziert; ENDPOINTS gefixt, ADDRESSES +Pendle — schließt Grok-P1 „Pendle-SDK-Calldata"
- [x] llms.txt 160→162+Coverage · about.html 162/79/69 · +2 ask-Queries Rang 1 · Vault-Dual-Write (EVM-Transaktionen-Note +2 Sektionen, DeFi-Pendle-Delta, Endpoints, Adressen, MOC 162+Zähler 12)
- Commit b7cac43, live verifiziert (list_topics 162), Manifest unberührt → Baseline 0x575dfe50

## ✅ Block 94 (2026-07-16) — Swap/Bridge-Fokus: Across-Intents + Uniswap-v3-Coding (Lead inline)
- [x] `across_bridge_intents` — Intent-Bridging end-to-end: suggested-fees/available-routes/deposit/status ALLE keyless live-verifiziert; **5 SpokePools DOPPELT verifiziert (API + on-chain wrappedNativeToken()→WETH/WPOL je Chain)**; depositV3 0x7b939232 + deposit(bytes32) 0xad5425c6 in Impl-Bytecode bestätigt (EIP-1967-Proxies!); fillDeadlineBuffer()=21600s alle 5; outputAmount=amount−relayFee exakt gegengerechnet; Refund-Pfad als dritter Zustand; ERC-7683-Kontext
- [x] `uniswap_v3_swap_coding` — das Standard-Handwerk, fehlte komplett: QuoterV2 non-view via eth_call (LIVE 1 WETH→1876,25 USDC, gasEstimate 98710), Pfad-Encoding 20B‖3B‖20B (Multi-Hop LIVE 1875,35 DAI), **Router02-DEADLINE-FALLE: exactInputSingle 0x04e45aaf OHNE deadline-Feld, v1-Signatur 0x414bf389 NICHT im Bytecode — deadline nur via multicall(uint256,bytes[])**; Sentinel MSG_SENDER=address(1)/ADDRESS_THIS=address(2) Sourcify-verifiziert (unwrapWETH9-Muster); **Chain-Falle: Mainnet-Router-Adresse hält auf Base FREMDEN 2109-Byte-Code (Call schlägt nicht sauber fehl!)**
- [x] bridge_funds-Delta (+Alternativen-Step Across/CCTP/kanonisch) · ADDRESSES +2 (SpokePools 5 Chains, v3-Periphery) · ENDPOINTS: Across-Eintrag ANGEREICHERT statt neu (Duplikat-Falle wie Neynar Block 88 diesmal GEFANGEN — vor Anlegen grep!)
- [x] llms.txt 162→164+Coverage · about.html 164/79/71 · +2 ask-Queries Rang 1 · gen:brain 164/21/79 · Vault-Dual-Write (Swaps-Note +2 Sektionen +Delta, Adressen 59 Gruppen, Endpoints 80, MOC 164 + Swaps-Zähler 12 + 2 Topic-Links; stale Vault-Kopfzähler 44/67 auf real 59/80 korrigiert)
- Commit 536335c, Auto-Deploy nach 30s, live verifiziert (list_topics + brain-data + llms.txt + about), Manifest-md5 live==lokal → Baseline 0x575dfe50 UNBERÜHRT
- [x] **Manifest v1.4.1 + ON-CHAIN-SYNC (Philipp: „Angaben auf OpenSea aktuell"):** description „100+"→„160+ runbooks" + swaps&bridging + 13 chain playbooks (≤500-Zeichen-Schema-Limit!), Tag normies→bridges (Gate seit 07-14 weg). Sequenz deploy→verify(beide Domains md5==lokal)→updateToolMetadata(71) tx 0xbbae81d6 Block 25548049 → **NEUE HASH-BASELINE `0xf5ff3a2929882cbf89b52daa46c26ec5aca7e9e48b005a2ca1babce9ac2bebc4`** (ersetzt 0x575dfe50; on-chain raw-eth_call verifiziert). Commits eac77a4+8d3fa29.
