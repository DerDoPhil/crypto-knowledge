# Crypto-Knowledge — Das On-Chain-Gehirn für autonome KI-Agenten

> **Typ:** MCP (Model Context Protocol) Server + Developer-Tool
> **Ziel:** Autonome Agenten führen komplexe Krypto-Operationen (Cross-Chain-Routing, Smart-Contract-Interaktion, Marktanalyse) sicher, deterministisch und fehlerfrei aus.
> **Status:** Architektur-Entwurf v0.3 — basiert auf Tiefenanalyse des lokalen Workspaces (Stand 2026-06-30)
> **Autor:** Claude (Lead Web3 & AI Systems Engineer) für Philipp
>
> **Produkt-Entscheidungen (2026-06-30):**
> - **Chain-agnostisch von Anfang an** — Modul 1 baut auf einer Aggregator-Abstraktion (LiFi/deBridge), die *jede* unterstützte Chain bedient. Cronos (CRO) ist nur **ein Registry-Eintrag**, kein Sonderpfad.
> - **Öffentlich aufrufbares Produkt** — andere Entwickler/Agenten rufen Crypto-Knowledge auf, um *ihren* Agenten Crypto-Wissen zu verleihen. Damit ist es **Multi-Tenant**: kein Per-User-Secret-State, jeder Caller übergibt eigene Adressen, der Server gibt nur unsigned tx + Daten zurück.
> - **Tool-Sprache = Englisch** — alle agent-facing Outputs, Schema-Beschreibungen, Fehlertexte, README und Tool-Manifest sind **Englisch** (internationales Publikum). Implementierungssprache bleibt TypeScript. (Dieses interne Planungs-Doc bleibt Deutsch.)
> - **Provider-/Key-Wahl pro Caller** — der Caller wählt, wie RPC/Daten bezogen werden: **(A) Free open API** (public RPC) · **(B) eigener Helius-Key** (empfohlen, Agent soll dazu raten) · **(C) Helius vom Tool** (Philipps Key, **wird nie an den Caller herausgegeben**). Secrets verlassen den Server nie.
> - **Access-Modell** — **Normies-NFT-gated** (Holder = freier Zugang, on-chain verifiziert wie bei SwarmSkill) · sonst **$0.10 pro Anfrage** via x402.
> - **Keine AgentTrust-Kopplung** — R&D-11 (AI-to-AI) bleibt eigenständig, ohne Abhängigkeit zum AgentTrust-Reputations-Score.

---

## 0. Executive Summary

Die Analyse von **11 lokalen Krypto-Projekten** zeigt ein klares Bild: Es existieren bereits **produktionsreife on-chain Primitive** (pump.fun-Direktintegration, Wormhole+Jupiter-Bridge, Multi-Chain-Balance-Inventory über Helius/Alchemy, robuste Retry/Backoff-Patterns). Diese sind aber **projekt-lokal verstreut, nicht standardisiert und für Agenten nicht konsumierbar** — jedes Projekt löst RPC-Resilienz, Slippage-Schutz und Daten-Parsing neu und leicht anders.

**Crypto-Knowledge bündelt diese Primitive zu einer einzigen, agenten-nativen MCP-Schnittstelle** mit 6 Modulen. Das Leitprinzip:

> **Der Server hält NIEMALS Private Keys.** Er liefert *signierfertige, unsignierte Transaktionsdaten* + Risiko-Bewertung + Profitabilitäts-Check. Signieren und Senden bleibt beim Agenten/Wallet. Das macht den Server sicher delegierbar (auch an Dritt-Agenten) und kompatibel mit der bestehenden Vault-Security-Regel (keine Secrets nach außen).

**Größte Hebel (existiert noch NICHT, hoher Agenten-Wert):**
1. **ABI- & Interaction-Decoder** (Modul 4) — Agenten können heute keine unbekannten Contracts lesen.
2. **Security/Anti-Rug-Scanner** (Modul 6) — kein Honeypot-/Liquidity-Lock-Check vorhanden.
3. **Allowance-Manager** (Modul 5b) — Balances ja, Approvals/Revokes nein.
4. **Multi-Chain-Gas-/Profit-Oracle** (Modul 3) — nur rudimentäre Gas-Logik vorhanden.
5. **Aggregator-Routing** LiFi/deBridge inkl. **Cronos (CRO)** — heute nur hardcoded ETH→SOL.

---

# SCHRITT 1 — Tiefengutachten des Workspaces

## 1.1 Inventar der analysierten Projekte

| Projekt | Stack | Relevanz für Crypto-Knowledge |
|---|---|---|
| **SwarmSkill** | TS, `@solana/web3.js`, `@pump-fun/pump-sdk`, `ethers`, `axios` | ★★★ pump.fun on-chain, Bridge ETH→SOL, ERC-8257-Tool-Erfahrung |
| **ChainTrade** | Next.js, `viem`/`wagmi`/`ethers`, `@solana/*`, Supabase | ★★★ 5 EVM-Chains + Solana, Inventory (Helius/Alchemy), Relayer, Cross-Chain-Safety |
| **NFTMintSniper** | Python, `web3.py`, urllib | ★★ EVM-TX-Bau, Slippage-Cap, OpenSea-Backoff, Scheduling |
| **BitfaunaMainnet** | Solana, Metaplex, API | ★ Mint-/RPC-Friction-Historie (Logs), Helius-Nutzung |
| **pump-vanity** | Next.js 16, `@solana/web3.js` | ★ pump.fun create-Flow, Vanity-Grinder |
| **BulkPump** | (Spec) | ★ News-Jacking-Sniper-Spec, create-Kosten on-chain gemessen |
| **AgentTrust** | Solidity, Operator | ★ ERC-8004/8257/x402-Reputations-Layer, relevant für AI-to-AI-Trust |
| **Wallet Recovery APK** | RN/JS, eigene Solana-RPC-Klasse | ★ Referenz-Implementierung RPC-Retry/Timeout/Confirm |
| ChainTradeContracts, CommunityCanvas, Normies-APP | div. | Kontext |

**Provider-Landschaft im Bestand:** Helius (Solana DAS + RPC), Alchemy (EVM NFT/Token), öffentliche RPCs als Fallback, Jupiter (Solana-Swap), Wormhole (Bridge), Etherscan/Basescan/Arbiscan/Polygonscan (Explorer-Links, aber **nicht** programmatisch für ABI genutzt), OpenSea-API.

## 1.2 Solide Fundamente — was bereits gut funktioniert

| # | Fundament | Beleg (Datei) | Wiederverwendbar für |
|---|---|---|---|
| F1 | **pump.fun komplett on-chain** — offizielles `@pump-fun/pump-sdk`, Bonding-Curve-Formel verifiziert, Buy/Sell-Instructions, Compute-Budget/Priority-Fees, Real-Time-Events via `onLogs`+Anchor `EventParser` | `SwarmSkill/src/solana/pumpfun.ts` | **Modul 2** (≈80 % fertig) |
| F2 | **Cross-Chain-Bridge ETH→SOL** — Wormhole Portal + Jupiter, verifizierte Endpoints, raw-unit-Handling, Quote-Struktur | `SwarmSkill/src/solana/bridge.ts` | **Modul 1** (Basis, 1 Route) |
| F3 | **Multi-Chain-Inventory** — Alchemy für 5 EVM-Chains (ETH/Base/Arb/Polygon/Ape), Helius DAS für Solana SPL+NFT, normalisiertes `NormalizedAsset`-Schema, Floor-Preise, SBT-Erkennung | `ChainTrade/lib/server/inventory/{alchemy,helius}.ts` | **Modul 5a** (Balances) |
| F4 | **Resiliente API-Calls** — exponential Backoff, Behandlung von „401-statt-429"-Quirk, Retry auf 429/5xx | `NFTMintSniper/sniper/opensea.py`, `signalbound.py` | **Resilience-Layer** (alle Module) |
| F5 | **Slippage-/Preis-Cap + EVM-TX-Bau** — `check_price_cap`, max-slippage, `wait_for_transaction_receipt(timeout)` | `NFTMintSniper/sniper/mint.py` | **Modul 3** (Slippage-Schutz) |
| F6 | **Cross-Chain-Settlement-Safety** — asymmetrische Timeouts (SOL 4 h / ETH 48 h), Replay-Schutz, Refund-Logik | `ChainTrade/relayer/safety.ts` | **Modul 1** (Atomicity-Denke), R&D-MEV |
| F7 | **Robuste Solana-RPC-Klasse** — `AbortController`-Timeout, `retries`, `waitConfirmed(deadline)` | `Wallet Recovery APK/RentReclaimer/src/solana/rpc.js` | **Resilience-Layer** (Solana) |
| F8 | **Chain-Registry** — chainId-Map, RPC-URLs mit Public-Fallback, Explorer-URLs, Escrow-Adressen pro Chain | `ChainTrade/lib/config.ts` | **Chain-Registry** (Resource) |

**Kern-Erkenntnis:** Die Bausteine sind da und teils battle-tested. Was fehlt, ist die **Standardisierung in ein einheitliches JSON-Vertrags-Format** und die **Vervollständigung der „Lese"-Fähigkeiten** (ABI, Security, Allowances).

## 1.3 Friction Points — die Schmerzpunkte, die Crypto-Knowledge lösen muss

| # | Friction Point | Beleg | Folge für Agenten | Modul-Lösung |
|---|---|---|---|---|
| P1 | **Unzuverlässige 3rd-Party-APIs** — pump.fun/PumpPortal so volatil, dass SwarmSkill bewusst auf Direkt-on-chain umgestellt hat | Projekt-Notiz + `pumpfun.ts`-Header | Agent bekommt 5xx/Schema-Drift → bricht ab | M2 + Resilience |
| P2 | **OpenSea-Rate-Limit gibt 401 statt 429** — nicht-standardkonforme Fehlercodes | `opensea.py:20-21,38` | naiver Agent interpretiert 401 als Auth-Fehler, gibt auf | Resilience-Layer (Fehler-Normalisierung) |
| P3 | **Public RPC ohne Key liefert nur Native-Balance** — Token/NFT-Daten brauchen Key | `alchemy.ts:9-11` | Agent „sieht" Token nicht → Fehlentscheidung | M5 + RPC-Pool (Key-aware Routing) |
| P4 | **Solana „blockhash not found" / Confirm-Timeouts** — Confirmations laufen in Timeout | `rpc.js`, `instructions.js:111`, ChainTrade SOL-Timeout | TX gilt fälschlich als gescheitert → Doppel-Send-Risiko | Resilience + Confirm-Strategie |
| P5 | **Cross-Chain ist nicht atomar** — Jupiter kann kein Cross-Chain nativ, Komposition Wormhole+Jupiter, asymmetrische Timeouts | `bridge.ts:17-19`, `safety.ts:18-19` | Agent verliert Funds in „Bridge-Limbo" ohne Status | M1 (Status-Tracking) + R&D |
| P6 | **Mint-/RPC-Pain historisch massiv** — 14 KB `Mintfix.txt`, 590 KB `Fixes26.4` | BitfaunaMainnet-Logs | wiederkehrende Debug-Schleifen, keine Standard-Recovery | Resilience + Idempotenz |
| P7 | **Keine programmatische ABI-Auflösung** — Explorer nur als Link, nie als API | `config.ts:154-156` (nur URLs) | Agent kann unbekannte Contracts nicht aufrufen | **M4 (neu)** |
| P8 | **Kein Approval-Bewusstsein** — Balances bekannt, Allowances nicht | Gap (kein `.approve()`/`allowance` im Code) | Swap revertet, weil Allowance fehlt → verbranntes Gas | **M5b (neu)** |
| P9 | **Kein Rug-/Honeypot-Schutz** — kein Honeypot-, Liquidity-Lock-, Blacklist-Check | Gap (kein Treffer) | Agent kauft Honeypot, kann nicht verkaufen | **M6 (neu)** |
| P10 | **Keine Gas-/Profit-Vorhersage** — nur fixe Compute-Budgets / Receipt-Timeout | `pumpfun.ts:46-47`, `mint.py` | Agent macht unprofitable Swaps (Gas > Gewinn) | **M3 (neu)** |
| P11 | **CRO/Cronos nirgends konfiguriert** — nur ETH/Base/Polygon/Arb/Ape + Solana | `config.ts` | vom User explizit gefordertes CRO→SOL nicht möglich | M1 + Chain-Registry erweitern |

---

# SCHRITT 2 — Architektur & Modul-Spezifikation

## 2.1 Gesamtarchitektur

```
                ┌─────────────────────────────────────────────┐
   KI-Agent ───▶│            Crypto-Knowledge MCP             │
 (Claude/Grok/  │  Transport: stdio  +  optional HTTP/SSE     │
  beliebig)     ├─────────────────────────────────────────────┤
                │  TOOLS (6 Module, je mit Sub-Actions)       │
                │   M1 route   M2 pumpfun   M3 profitability  │
                │   M4 abi     M5 portfolio M6 security        │
                ├─────────────────────────────────────────────┤
                │  RESOURCES (statisch/cachebar)              │
                │   chain-registry · token-list · abi-cache   │
                ├─────────────────────────────────────────────┤
                │  CORE-LAYER (querschnitt)                   │
                │   • RPC-Pool + Failover (key-aware)         │
                │   • Retry/Backoff + Fehler-Normalisierung   │
                │   • Cache (TTL pro Datentyp)                │
                │   • Idempotenz / Confirm-Strategie          │
                │   • Telemetrie (Friction-Logging)           │
                └──────────────┬──────────────────────────────┘
                               │ liefert NUR unsigned tx + Daten
                               ▼
                Agent signiert lokal mit eigenem Wallet/Key
```

**Designprinzipien (verbindlich):**

0. **Multi-Tenant & öffentlich.** Da fremde Agenten das Tool aufrufen, gibt es **keinen Per-User-Secret-State**. Jeder Call ist zustandslos: Caller übergibt eigene Adressen → Server liefert Daten + unsigned tx. Server-eigene Keys existieren nur für *eigene* Provider-Zugänge (Helius/Alchemy/LiFi), nie für Caller-Wallets. (Distribution: npm-installierbarer MCP **und** als ERC-8257/x402-Tool gelistet — analog SwarmSkill, monetarisierbar/auffindbar.)
1. **Keystore-frei.** Server signiert/sendet nie. Output = unsigned tx (EVM: `{to,data,value,chainId,gas,...}` / Solana: serialisierte Transaction base64). → erfüllt „signierfertige Hex-Transaktionsdaten" und die Vault-Security-Regel.
2. **Deterministische Verträge.** Jedes Tool hat ein striktes JSON-Schema (Zod/JSON-Schema validiert). Jeder Output trägt `ok`, `data`, `warnings[]`, `errors[]`, `source`, `cachedAt`, `latencyMs`.
3. **Fail-loud, nie still.** Fehler werden in einen **kanonischen Fehler-Code** normalisiert (`RATE_LIMITED`, `RPC_TIMEOUT`, `NOT_VERIFIED`, `INSUFFICIENT_LIQUIDITY`, `SIMULATION_REVERTED`, …) — löst P2/P4.
4. **Read-before-write-Pipeline.** Empfohlener Agenten-Flow: `security.scan` → `portfolio.check_allowance` → `profitability.estimate` → `route`/`build_*`. Module sind komponierbar.
5. **Provider-agnostisch.** Provider hinter Interfaces (Helius/Alchemy/QuickNode/public) — Failover transparent.

**Tech-Stack-Entscheidung:** **TypeScript + `@modelcontextprotocol/sdk`** (offizielles MCP-SDK). Begründung: 4 von 5 relevanten Bestands-Module sind bereits TS (`viem`/`ethers`/`@solana/web3.js`), direkte Code-Wiederverwendung von SwarmSkill/ChainTrade. Python-Teile (NFTMintSniper-Patterns) werden portiert.
→ *Vor Implementierung: aktuelle MCP-SDK-API via `ctx7` verifizieren (Tool-Registrierung, Resources, Transports).*

## 2.2 Gemeinsames Envelope-Format

Jeder Tool-Output ist in diesen Envelope gewickelt:

```json
{
  "ok": true,
  "data": { "...modulspezifisch..." },
  "warnings": ["destination token has 0.4% price impact"],
  "errors": [],
  "meta": { "source": "lifi", "cachedAt": null, "latencyMs": 380, "chain": "cronos" }
}
```

Fehlerfall:
```json
{ "ok": false, "data": null,
  "errors": [{ "code": "INSUFFICIENT_LIQUIDITY", "message": "no route CRO->SOL >= minOut", "retryable": false }],
  "warnings": [], "meta": { "source": "lifi", "latencyMs": 410 } }
```

---

## Modul 1 — Cross-Chain Routing Optimizer

**Zweck:** Beste Route zwischen beliebigen Chains/Tokens (Fokus z. B. **CRO → SOL**). Fragt Aggregatoren (LiFi, deBridge) + Bestands-Pfad (Wormhole+Jupiter) ab, vergleicht Kosten/Zeit/Sicherheit und liefert signierfertige TX-Schritte.

**Datenquellen:** LiFi-API, deBridge-API, Bestands-`bridge.ts` (Wormhole+Jupiter) als Fallback. Chain-Registry für RPC/Explorer.

### Input
```json
{
  "action": "quote",
  "fromChain": "cronos",
  "toChain": "solana",
  "fromToken": "native",
  "toToken": "SOL",
  "amount": "1000000000000000000000",
  "fromAddress": "0xabc...",
  "toAddress": "So1aNa...",
  "preference": "cheapest",
  "maxSlippageBps": 100,
  "allowedAggregators": ["lifi", "debridge", "wormhole+jupiter"]
}
```

### Output (`data`)
```json
{
  "best": {
    "aggregator": "lifi",
    "routeId": "0x9f2c...",
    "estimatedOut": { "raw": "182400000000", "human": "182.4", "token": "SOL" },
    "estimatedTimeSec": 240,
    "fees": { "gasUsd": 3.10, "bridgeUsd": 0.80, "aggregatorUsd": 0.0, "totalUsd": 3.90 },
    "priceImpactPct": 0.42,
    "steps": [
      { "type": "approve", "chain": "cronos", "token": "0x...", "spender": "0x...", "required": false },
      { "type": "swap",   "chain": "cronos", "venue": "vvs",      "tokenIn": "CRO", "tokenOut": "USDC" },
      { "type": "bridge", "from": "cronos",  "to": "solana",      "via": "debridge" },
      { "type": "swap",   "chain": "solana", "venue": "jupiter",  "tokenIn": "USDC", "tokenOut": "SOL" }
    ],
    "transactions": [
      { "chainId": 25, "to": "0x...", "data": "0x...", "value": "0x0", "gasLimit": "210000",
        "requiresApproval": true,
        "approval": { "token": "0x...", "spender": "0x...", "amount": "1000000000000000000000" } }
    ],
    "destinationTracking": { "method": "bridge_status_poll", "ref": "0x9f2c..." }
  },
  "alternatives": [ { "aggregator": "debridge", "totalUsdFees": 4.40, "estimatedTimeSec": 90 } ]
}
```

**Edge-Cases:** keine Route (→ `INSUFFICIENT_LIQUIDITY`), Bridge-Limbo (Status-Polling-Ref, P5), Token braucht Approval (Verknüpfung zu M5b), Ziel-Token nicht kanonisch (Adress-Disambiguierung).

---

## Modul 2 — Pump.fun & Memecoin Lifecycle Engine

**Zweck:** Standardisierte Schnittstelle für volatile Memecoin-APIs. Bonding-Curve-Tracking, IPFS-Metadaten-Auflösung, deterministische Buy/Sell-Calls. **Basis existiert** (`pumpfun.ts`) — wird in den Envelope gehoben + IPFS-Resolver + Graduation-Logik ergänzt.

**Sub-Actions:** `get_curve` · `get_metadata` · `build_buy` · `build_sell` · `subscribe_events` (Whale/Trade-Stream → siehe R&D).

### Input (build_buy)
```json
{ "action": "build_buy", "mint": "Hx...pump", "solAmount": "100000000",
  "slippageBps": 500, "buyer": "So1aNa...", "priorityFeeMicroLamports": 100000 }
```

### Output `get_curve` (`data`)
```json
{
  "mint": "Hx...pump",
  "phase": "bonding",
  "progressPct": 63.2,
  "complete": false,
  "graduatesAtSol": 85,
  "reserves": { "virtualSol": "...", "virtualToken": "...", "realSol": "...", "realToken": "..." },
  "price": { "solPerToken": 0.0000000312, "usdPerToken": 0.0000051 },
  "marketCapUsd": 51000,
  "metadata": { "name": "DogWifChain", "symbol": "DWC",
    "imageUri": "ipfs://Qm...", "resolvedImage": "https://ipfs.io/ipfs/Qm...",
    "twitter": null, "createdSlot": 312445901 }
}
```

### Output `build_buy` (`data`)
```json
{ "serializedTx": "Ag...base64...", "encoding": "base64",
  "expectedTokens": "412877.91", "minTokensOut": "392234.0",
  "priceImpactPct": 1.8, "computeUnits": 200000, "priorityFeeLamports": 20000 }
```

**Edge-Cases:** Token bereits „graduated" (AMM statt Curve → Jupiter-Pfad), IPFS-Gateway-Timeout (Multi-Gateway-Fallback), Dev-Sell/Rug während Curve (Verknüpfung M6), Slippage-Spike bei Volatilität.

---

## Modul 3 — Dynamic Gas & Profitability Calculator

**Zweck:** Multi-Chain-Gas-Vorhersage (EIP-1559) + Netto-Profitabilität nach Gas & Slippage → **Arbitrage-Schutz**. Verhindert, dass Agent unprofitable Transaktionen sendet (P10). **Neu** — Bestand hat nur fixe Compute-Budgets.

**Datenquellen:** `eth_feeHistory`/`eth_maxPriorityFeePerGas` (EVM), Solana `getRecentPrioritizationFees`, `eth_estimateGas` / Simulation, Preis-Oracle für USD-Umrechnung.

### Input
```json
{
  "action": "estimate",
  "chain": "ethereum",
  "txs": [
    { "to": "0x...", "data": "0x38ed1739...", "value": "0x0", "from": "0x..." }
  ],
  "expectedRevenueUsd": 1012.0,
  "slippageBps": 50,
  "speed": "standard"
}
```

### Output (`data`)
```json
{
  "chain": "ethereum",
  "gas": {
    "baseFeeGwei": 12.3, "priorityFeeGwei": 1.5, "estGasUnits": 184000,
    "gasCostNativeWei": "2540000000000000", "gasCostUsd": 6.40,
    "eip1559": { "maxFeePerGas": "26000000000", "maxPriorityFeePerGas": "1500000000" }
  },
  "slippageCostUsd": 5.06,
  "profitability": {
    "grossUsd": 12.0, "totalCostUsd": 11.46, "netUsd": 0.54,
    "profitable": true, "marginPct": 0.05,
    "breakEven": { "maxGasGweiForProfit": 13.4, "minRevenueUsd": 1011.46 }
  },
  "recommendation": "PROCEED_THIN_MARGIN"
}
```

**Edge-Cases:** Gas-Spike zwischen Estimate und Send (Re-Validation-Hint + TTL), L2-Gas (Calldata-/L1-Data-Fee, z. B. Arbitrum/Base), Solana-Prioritization-Fee-Markt, Simulation revertet (→ `SIMULATION_REVERTED`, profitable=false).

---

## Modul 4 — Smart Contract ABI & Interaction Decoder

**Zweck:** „Übersetzer", der Agenten **unbekannte Contracts lesbar** macht. Holt ABI (Etherscan/Arbiscan/Basescan/…), parst sie, sagt dem Agenten exakt welche Funktion welche Parameter braucht, encodet/decodet Calldata. **Komplett neu** (P7 — größter Einzelhebel).

**Datenquellen:** Block-Explorer-APIs (`?module=contract&action=getabi`), Proxy-Auflösung (EIP-1967 Implementation-Slot), Sourcify als Fallback, 4byte-Directory für unverifizierte Selektoren.

**Sub-Actions:** `get_abi` · `list_functions` · `describe_function` · `encode_call` · `decode_calldata` · `decode_event`.

### Input (describe_function)
```json
{ "action": "describe_function", "chain": "arbitrum",
  "address": "0x1f98431c8aD98523631AE4a59f267346ea31F984",
  "function": "swapExactTokensForTokens" }
```

### Output (`data`)
```json
{
  "address": "0x1f98...",
  "verified": true, "source": "arbiscan",
  "isProxy": true, "implementation": "0xbd4c...",
  "function": {
    "name": "swapExactTokensForTokens", "selector": "0x38ed1739",
    "stateMutability": "nonpayable", "payable": false,
    "inputs": [
      { "name": "amountIn",     "type": "uint256",   "description": "exact input amount (smallest unit)" },
      { "name": "amountOutMin", "type": "uint256",   "description": "min acceptable output (slippage guard)" },
      { "name": "path",         "type": "address[]", "description": "token route [tokenIn, ..., tokenOut]" },
      { "name": "to",           "type": "address",   "description": "recipient" },
      { "name": "deadline",     "type": "uint256",   "description": "unix ts after which tx reverts" }
    ],
    "outputs": [ { "name": "amounts", "type": "uint256[]" } ]
  },
  "exampleEncode": { "argsTemplate": ["<uint256>","<uint256>","[<address>]","<address>","<uint256>"] }
}
```

### Output (decode_calldata)
```json
{ "function": "transfer", "selector": "0xa9059cbb",
  "args": [ { "name": "to", "type": "address", "value": "0xRecipient..." },
            { "name": "amount", "type": "uint256", "value": "1000000", "human": "1.0 USDC" } ] }
```

**Edge-Cases:** unverifizierter Contract (4byte-Heuristik + Warnung `NOT_VERIFIED`), Proxy ohne lesbares Impl-Slot (Beacon/UUPS/Diamond/EIP-2535 Facets), überladene Funktionsnamen (Selektor-Disambiguierung), Explorer-Rate-Limit (Cache, ABI-TTL lang).

---

## Modul 5 — Portfolio & Allowance Manager

**Zweck:** Bevor der Agent swappt, muss er wissen *was er hat* **und** *was er freigegeben hat*. (a) Multi-Chain-Balances (ERC20 + SPL + nativ + NFT) — **Basis existiert** (`inventory/*`). (b) Allowance-Checks + Approve/Revoke-TX-Bau — **neu** (P8).

**Sub-Actions:** `get_balances` · `check_allowance` · `build_approve` · `build_revoke` · `list_approvals` (offene Risiko-Approvals).

### Input (check_allowance)
```json
{ "action": "check_allowance", "chain": "ethereum",
  "owner": "0x...", "token": "0xA0b8...USDC", "spender": "0xUniswapRouter...",
  "requiredAmount": "1000000000" }
```

### Output (`data`)
```json
{ "allowance": "0", "isUnlimited": false,
  "sufficient": false, "needsApproval": true,
  "buildApproveHint": { "action": "build_approve", "recommendedAmount": "exact" } }
```

### Output (get_balances, `data`)
```json
{
  "totalUsd": 1284.55,
  "byChain": {
    "ethereum": {
      "native": { "symbol": "ETH", "raw": "210000000000000000", "human": "0.21", "usd": 712.0 },
      "tokens": [ { "address": "0xA0b8...", "symbol": "USDC", "raw": "500000000", "human": "500.0", "decimals": 6, "usd": 500.0 } ]
    },
    "solana": {
      "native": { "symbol": "SOL", "raw": "1500000000", "human": "1.5", "usd": 72.55 },
      "spl": [ { "mint": "EPjF...", "symbol": "USDC", "raw": "0", "human": "0", "decimals": 6, "usd": 0 } ]
    }
  }
}
```

### Output (build_approve, `data`)
```json
{ "transaction": { "chainId": 1, "to": "0xA0b8...USDC", "data": "0x095ea7b3...", "value": "0x0" },
  "approves": { "spender": "0xUniswapRouter...", "amount": "1000000000", "mode": "exact" },
  "warning": "Prefer exact over unlimited approvals to limit risk" }
```

**Edge-Cases:** „unlimited approval"-Warnung, USDT-Quirk (Allowance muss erst auf 0 vor Re-Approve), Permit2/EIP-2612-Gasless-Approve-Pfad, SPL-Token-2022 vs. Legacy, NFT-`setApprovalForAll`.

---

## Modul 6 — Security & Anti-Rug Scanner

**Zweck:** Schutzschild des Agenten. Honeypot-, Liquidity-Lock-, Blacklist-, Ownership-, Holder-Konzentrations-Checks vor jedem Kauf. **Komplett neu** (P9).

**Datenquellen:** GoPlus Security API, honeypot.is, On-Chain-Simulation (Buy/Sell-Roundtrip via `eth_call`/Tenderly-artig), Liquidity-Lock-Register (Unicrypt/Team.Finance), für Solana: Mint-/Freeze-Authority-Check + RugCheck-artige Heuristik.

### Input
```json
{ "action": "scan_token", "chain": "ethereum", "address": "0xToken...", "amountUsd": 500 }
```

### Output (`data`)
```json
{
  "riskScore": 78, "verdict": "high_risk",
  "checks": {
    "honeypot": { "isHoneypot": false, "buyTaxPct": 5.0, "sellTaxPct": 12.0, "canSell": true, "simulated": true },
    "liquidity": { "totalUsd": 12000, "lockedPct": 0.0, "lockedUntil": null, "burnedPct": 0.0 },
    "ownership": { "renounced": false, "owner": "0xDev...", "canMint": true, "canBlacklist": true, "canPause": true },
    "holders": { "top10Pct": 64.2, "devWalletPct": 18.0, "holderCount": 312 },
    "contract": { "verified": true, "proxy": true, "dangerousSelectors": ["setMaxTxAmount", "blacklist"] }
  },
  "redFlags": ["sell tax 12%", "liquidity unlocked", "owner can blacklist", "top10 hold 64%"],
  "dataSources": ["goplus", "honeypot.is", "onchain-sim"]
}
```

**Edge-Cases:** „delayed honeypot" (Verkauf erst nach N Blöcken blockiert → Sim mehrerer Blöcke), gefälschte Lock-Beweise, Solana-spezifisch (Freeze-Authority = Soft-Rug), frische Tokens ohne Historie (`verdict: insufficient_data`), Proxy-Upgrade-Risiko (Owner kann Logik tauschen).

---

## 2.3 Querschnitts-Layer (Core)

| Komponente | Funktion | Quelle/Vorbild |
|---|---|---|
| **RPC-Pool** | Key-aware Routing (Helius/Alchemy bei Key, public sonst), Round-Robin + Health-Check, Failover | P3, `config.ts`, `rpc.js` |
| **Retry/Backoff** | exponential + Jitter, kanonische Fehler-Normalisierung (401→RATE_LIMITED-Quirk) | `opensea.py` (F4, P2) |
| **Cache** | TTL pro Datentyp: ABI ∞/lang, Curve ~2 s, Gas ~5 s, Balance ~15 s, Security ~5 min | neu |
| **Confirm-Strategie** | Solana: blockhash-aware, `lastValidBlockHeight`, Idempotenz gegen Doppel-Send | P4, F7 |
| **Telemetrie** | strukturiertes Friction-Logging (welcher Provider/Fehler/Latenz) → speist künftige Optimierung | neu |

## 2.4 Provider- & Key-Auswahl (pro Caller)

Beim ersten Tool-Aufruf (oder via `configure`-Tool) wählt der Caller die Datenquelle. **Der Agent soll aktiv empfehlen, einen eigenen kostenlosen Helius-Key zu holen** (beste Performance, eigene Quota, keine Last für das Tool).

| Modus | Bedeutung | RPC-Qualität | Kosten-Träger | Default-Tier |
|---|---|---|---|---|
| **A — Free open API** | nur öffentliche RPCs | niedrig (P3: oft nur Native-Balance, Rate-Limits) | niemand | Free |
| **B — Own Helius key** | Caller übergibt **eigenen** Key pro Call | hoch | Caller | empfohlen ⭐ |
| **C — Tool's Helius** | Philipps Key, **serverseitig**, nie im Response | hoch | Philipp (→ Rate-Limit nötig) | nur NFT/Paid |

**Sicherheits-Invarianten:**
- Modus C: Philipps Key wird **ausschließlich serverseitig** verwendet, taucht in **keinem** Response, Log oder Fehlertext auf.
- Modus B: caller-gelieferter Key wird **transient pro Request** genutzt, **nie persistiert**, **nie geloggt** (passt zur zustandslosen Multi-Tenant-Regel).
- Modus C ist **nicht** für den Free-Tier verfügbar (sonst brennen fremde Free-User Philipps Quota). Free-Tier ⇒ Modus A oder B.

**Agent-Nudge (Beispiel-Output, EN):**
> *"You're on the free public RPC — responses may be limited to native balances and slower. For full token/NFT data, grab a free Helius key at helius.dev and pass it as `heliusKey`, or hold a Normies NFT for tool-provided access."*

### `configure` Input
```json
{ "action": "configure",
  "providerMode": "own_key",
  "heliusKey": "<caller-supplied, transient>",
  "evmRpcOverrides": { "ethereum": "https://..." } }
```

## 2.5 Access-Tiers & Rate-Limiting

> Punkt 2 (Rate-Limit-Design) wurde an mich delegiert — hier mein Vorschlag zur Abnahme.

**Zugang:** **Normies-NFT-gated** (Holder frei, on-chain via Ownership-Check verifiziert — Wiederverwendung des SwarmSkill-Patterns `ERC721OwnerPredicate`/`getRequirements`) · sonst **$0.10 pro Anfrage** via x402 (keyless xpay-Facilitator, wie SwarmSkill).

| Tier | Voraussetzung | Rate-Limit (Vorschlag) | Provider-Modi | Zweck |
|---|---|---|---|---|
| **Free** | keine | 20 req/min · 500 req/Tag, pro Agent-Identität | A oder **B** | Anlocken/Testen |
| **Holder** | Normies-NFT (on-chain verifiziert) | 120 req/min · 20k/Tag | A/B/**C** | Community-Privileg |
| **Paid** | $0.10/req via x402 | ökonomisch (pay-per-call) + Safety-Cap 300 req/min | A/B/**C** | Umsatz |

**Begründung der Zahlen:**
- **Identität:** Normies = Wallet-Adresse; Free = gehasht aus `(IP + agent-id-header)` (kein Login). Anti-Sybil später via R&D.
- **Schutzgut #1 = Philipps Helius-Quota** (Modus C): nur Holder/Paid dürfen C → Free-User können Philipps Quota gar nicht anzapfen.
- **Schutzgut #2 = DoS:** auch zahlende Calls bekommen einen harten Safety-Cap (300/min), damit ein außer Kontrolle geratener Agent nicht den Server lahmlegt.
- **Sliding-Window** (nicht fixed) gegen Burst-am-Fenster-Rand; bei Überschreitung kanonischer Fehler `RATE_LIMITED` mit `retryAfterSec`.
- **Kostendeckung:** ein Helius-Free-Plan deckt ~die Holder-Last; sobald die nicht reicht, drängt das Tool Holder/Free sanft Richtung Modus B (eigener Key) — so skaliert das Tool ohne lineare Kostenexplosion.

*Offen zur Abnahme:* exakte Limits (oben = Startwerte, nach echter Last justierbar) und ob der Safety-Cap im Paid-Tier dir hoch genug ist.

---

# SCHRITT 3 — Wissenslücken & R&D-Liste

## 3.1 Gap-Matrix (Anforderung × Bestand)

| Modul | Anforderung | Im Vault vorhanden? | Lücke |
|---|---|---|---|
| M1 | Aggregator-Routing LiFi/deBridge, CRO→SOL | **Teilweise** (nur Wormhole+Jupiter, ETH→SOL) | Aggregator-Abstraktion, CRO/Cronos, Route-Vergleich, Bridge-Status |
| M2 | pump.fun Buy/Sell/Curve/IPFS | **Ja, ~80 %** (`pumpfun.ts`) | Envelope, IPFS-Multi-Gateway, Graduation→AMM-Pfad, Event-Stream |
| M3 | Multi-Chain-Gas + Netto-Profit | **Nein** (nur fixe CU) | EIP-1559-Oracle, L2-Data-Fee, Solana-Prio-Fee, Profit-Math |
| M4 | ABI holen/parsen/decode | **Nein** | komplett (Explorer-API, Proxy-Auflösung, 4byte, en/decode) |
| M5a | Multi-Chain-Balances | **Ja** (`inventory/*`) | Envelope, USD-Aggregation vereinheitlichen |
| M5b | Allowance/Approve/Revoke | **Nein** | komplett (Allowance-Read, Approve/Revoke-Bau, Permit2) |
| M6 | Honeypot/Anti-Rug | **Nein** | komplett (GoPlus, Sim, Lock-Check, Holder-Analyse) |
| Core | RPC-Pool/Retry/Cache | **Teilweise verstreut** | Konsolidierung in einen Layer |
| MCP | Server-Wrapper | **Nein** (SwarmSkill = ERC-8257/x402, kein MCP) | komplett (Tool-/Resource-Registry, Transports) |

## 3.2 R&D-Items (priorisiert)

**P0 — Fundament (ohne das läuft nichts agenten-tauglich)**
- **R&D-1 MCP-Skeleton:** `@modelcontextprotocol/sdk`, 6 Tools mit Sub-Action-Dispatch, Zod-Schemas, stdio-Transport. *Use Case:* Agent listet/ruft Tools. *Verifizieren via `ctx7`.*
- **R&D-2 Core-Resilience-Layer:** RPC-Pool + Backoff + Fehler-Normalisierung + Cache. *Edge:* 401-statt-429, blockhash-not-found, Key-loser Public-RPC.
- **R&D-3 Generische Chain-Registry:** chain-agnostisches Schema (chainId, RPC, DEX-Venue, Explorer-API, Bridge-Support) als datengetriebene Registry — neue Chain = Config-Eintrag, kein Code. Erst-Befüllung: ETH/Base/Arbitrum/Polygon/ApeChain/Solana (aus Bestand) **+ Cronos** (chainId 25, cronoscan, VVS) als gleichberechtigter Eintrag. *Use Case:* beliebige Chain ohne Sonderpfad.

**P1 — Größte Agenten-Hebel (neue Lese-Fähigkeiten)**
- **R&D-4 ABI-Decoder (M4):** Explorer-Multi-Provider, Proxy-Auflösung (EIP-1967/Beacon/Diamond), 4byte-Fallback, en/decode via `viem`. *Edge:* unverifiziert, überladene Selektoren.
- **R&D-5 Anti-Rug-Scanner (M6):** GoPlus + On-Chain-Buy/Sell-Sim + Liquidity-Lock-Register + Holder-Konzentration; Solana-Freeze/Mint-Authority. *Edge:* delayed honeypot, fake locks.
- **R&D-6 Allowance-Manager (M5b):** Allowance-Read, exact-vs-unlimited Approve, USDT-Reset-Quirk, **Permit2/EIP-2612 gasless**. *Edge:* Re-Approve-Reverts.
- **R&D-7 Gas-/Profit-Oracle (M3):** EIP-1559-Schätzung, L2-Calldata-Fee (Arbitrum/Base), Solana-Prio-Fee-Markt, Break-Even-Math. *Edge:* Gas-Spike-Re-Validation.

**P2 — Cross-Chain-Vervollständigung**
- **R&D-8 Aggregator-Routing (M1):** LiFi- + deBridge-Adapter hinter einheitlichem Interface, Route-Scoring (Kosten/Zeit/Sicherheit), **Bridge-Status-Tracking** gegen „Limbo" (P5). *Edge:* keine Route, partielle Fills.

**P3 — Fortgeschritten (Differenzierung, „revolutionär")**
- **R&D-9 MEV/Flashbots-Protection:** private Tx-Bundles (Flashbots Protect RPC / MEV-Blocker), Sandwich-Schutz für Agenten-Swaps, `amountOutMin`-Tightening basierend auf M3. *Use Case:* Agent sendet Swap front-running-resistent. *Vorarbeit vorhanden:* Atomicity-/Timeout-Denke in `safety.ts`.
- **R&D-10 On-Chain Event Listener / Whale-Tracking:** generischer Log-Subscriber (Vorbild: `pumpfun.ts` `onLogs`+`EventParser`), Schwellwert-Alerts (große Transfers, LP-Add/Remove, Curve-Trades), als MCP-Resource/Stream. *Use Case:* Agent reagiert auf Whale-Bewegung in Echtzeit.
- **R&D-11 AI-to-AI-Verhandlung:** standardisiertes Angebots-/Gegenangebots-Schema für Agent↔Agent-Trades (x402-Bezahlung). *Use Case:* Agent verhandelt Cross-Chain-Tausch mit Gegen-Agent. **Eigenständig — keine AgentTrust-Kopplung** (Entscheidung 2026-06-30). *Vorarbeit:* ChainTrade-Escrow-Logik. *Vertrauens-/Sybil-Absicherung bleibt offenes Sub-Thema, aber ohne externe Reputations-Abhängigkeit.*
- **R&D-12 Simulations-Sandbox:** „dry-run"-Modus, der jede vorgeschlagene TX vor Rückgabe simuliert (state-override) und Revert-Grund + Balance-Delta zurückgibt. *Use Case:* Agent bekommt „würde reverten weil X" statt verbranntem Gas. Verzahnt M3/M4/M6.

## 3.3 Abhängigkeits-Graph der R&D-Items

```
R&D-1 (MCP)  ──┐
R&D-2 (Core) ──┼─▶ alle Module
R&D-3 (Chains)─┘
                  R&D-4 (ABI) ─┬─▶ R&D-12 (Sim)
                  R&D-7 (Gas) ─┤
                  R&D-5 (Rug) ─┘
                  R&D-6 (Allow) ─▶ R&D-8 (Routing) ─▶ R&D-9 (MEV)
                  R&D-10 (Events) ─▶ R&D-11 (AI-to-AI, + AgentTrust)
```

---

## 4. Vorgeschlagene Roadmap (Phasen)

| Phase | Inhalt | Liefert |
|---|---|---|
| **Ph. 0** | R&D-1/2/3: MCP-Skeleton + Core-Layer + Chain-Registry (inkl. CRO) | lauffähiger MCP, ein Dummy-Tool antwortet |
| **Ph. 1** | M5a + M2 portieren (Bestand heben) + M4 (ABI) | Agent liest Balances, pump.fun, beliebige Contracts |
| **Ph. 2** | M6 (Anti-Rug) + M5b (Allowance) + M3 (Gas/Profit) | Agent prüft Sicherheit + Profit vor jedem Trade |
| **Ph. 3** | M1 (chain-agnostisches Aggregator-Routing, LiFi/deBridge) + Bridge-Status | Agent routet cross-chain (jede Registry-Chain, inkl. CRO) |
| **Ph. 4** | R&D-9..12: MEV, Whale-Events, AI-to-AI, Sim-Sandbox | Differenzierung |

---

## 5. Entscheidungen & offene Punkte

**Entschieden (2026-06-30):**
- ✅ **Chain-Fokus:** Chain-**agnostisch von Anfang an** (Aggregator-Abstraktion); Cronos = ein Registry-Eintrag, kein Sonderpfad.
- ✅ **Distribution:** Öffentliches, von Dritten aufrufbares Produkt → Multi-Tenant, zustandslos, keystore-frei; npm-MCP + ERC-8257/x402-Listung.
- ✅ **Tool-Sprache:** Englisch (agent-facing); Implementierung TypeScript.
- ✅ **Provider-/Key-Wahl:** A Free open API / B eigener Helius-Key (empfohlen, Agent rät dazu) / C Helius vom Tool (Key nie herausgegeben). Siehe §2.4.
- ✅ **Access:** Normies-NFT-gated, sonst $0.10/Anfrage via x402. Rate-Limit-Vorschlag in §2.5 (Startwerte, von mir entworfen).
- ✅ **Keine AgentTrust-Kopplung** (R&D-11 eigenständig).

**Noch offen (zur Abnahme):**
1. **Rate-Limit-Zahlen** aus §2.5 ok (Free 20/min · Holder 120/min · Paid Safety-Cap 300/min)? — sind bewusst konservative Startwerte.
2. **Provider-Budget:** Welche kostenpflichtigen APIs für die Module sind ok (GoPlus für M6, LiFi-Key für M1)? Diese laufen — anders als Helius (Caller-Wahl) — immer über das Tool.
3. **x402 ab Start oder nach MVP?** Bezahlschranke sofort scharf, oder erst nach lauffähigem Free/Holder-MVP?
4. **MVP-Modul:** Welches Modul zuerst (Vorschlag: M5a Balances + M4 ABI — höchster Agenten-Nutzen, geringstes externes Risiko)?

---

*Nächster Schritt nach deinem Go: Brainstorming-Skill für die konkrete Modul-Priorisierung, dann `writing-plans` für Phase 0 (MCP-Skeleton + Core-Layer).*
