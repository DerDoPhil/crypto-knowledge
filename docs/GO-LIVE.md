# Crypto-Knowledge — GO-LIVE Checklist (Aktionen für Philipp)

> Claude hat alles **vorbereitet und lokal getestet**. Die folgenden Schritte sind
> **bewusst NICHT autonom ausgeführt**, weil sie unwiderruflich / kostenpflichtig /
> an deine Identität gebunden sind (Deploy, Mint, Login, Publish, öffentliche
> Posts). Du führst sie aus, wenn du zurück bist. Reihenfolge ist sinnvoll, aber
> jeder Block ist unabhängig.

Stand: 2026-06-30 · Repo: `Schreibtisch/Projekte/Crypto/Crypto-Knowledge` (lokal committet, noch kein Remote)

---

## 0. Status (was schon fertig & getestet ist)

- ✅ 7 MCP-Tools, lauffähig über **stdio** und **HTTP** (`POST /mcp`)
- ✅ 37 Unit-Tests grün, MCP-Smoke grün, Live-On-Chain-Check grün (keyless)
- ✅ Production-Build (`npm run build` → `dist/`), Dockerfile, `/llms.txt`, Landing-Page, `context7.json`
- ✅ Provider-Modi A/B/C, NFT-Gate + Rate-Limit, x402-Tier-Logik im Code

---

## 1. GitHub-Remote anlegen (öffentlich, für Discovery)

```bash
cd ~/Schreibtisch/Projekte/Crypto/Crypto-Knowledge
gh repo create derdophil/crypto-knowledge --public --source=. --remote=origin \
  --description "On-chain brain for autonomous AI agents — MCP server (cross-chain routing, ABI decode, anti-rug, gas/profit)"
git push -u origin master
```
Danach Repo-Topics setzen: `mcp`, `model-context-protocol`, `crypto`, `web3`, `ai-agents`, `defi`, `solana`, `ethereum`.

## 2. Keys in `.env` eintragen (Operator-Seite)

```bash
cp .env.example .env
# HELIUS_API_KEY, ALCHEMY_API_KEY, ETHERSCAN_API_KEY (V2 unified), GOPLUS_APP_KEY/SECRET, LIFI_API_KEY
# → siehe Vault: Infrastruktur/Keys & Tokens.md  (Helius/Alchemy/Etherscan)
```
Ohne Keys läuft alles im Free-/Public-Modus (eingeschränkt). Für die Holder/Paid-Tiers brauchst du die Keys.

## 3. Hosten (empfohlen: Railway — langläufiger Node-Server, passt besser als Vercel)

**Railway / Render / Fly** via Dockerfile:
```bash
# Railway (CLI):  npm i -g @railway/cli && railway login && railway init && railway up
# oder im Railway-Dashboard: "Deploy from GitHub repo" → derdophil/crypto-knowledge
# Env-Vars im Dashboard setzen (gleiche wie .env). Port 8787 wird automatisch erkannt.
```
> Hinweis: **Vercel ist hier kein guter Fit** (MCP-HTTP ist langläufig, `@solana/web3.js` ist Node-nativ → nicht edge-tauglich). SwarmSkill läuft auf Vercel, weil es leichter ist. Für Crypto-Knowledge: Railway/Render/Fly.

Nach dem Deploy testen:
```bash
curl https://<deine-domain>/health
curl https://<deine-domain>/llms.txt
```

## 4. Als MCP-Tool nutzbar machen (Clients)

- **Lokal (Claude Code / Cursor):** Eintrag aus `README.md` (stdio via `npx tsx`).
- **Remote:** Clients verbinden auf `https://<domain>/mcp` (Streamable HTTP).

## 5. x402-Bezahlschranke aktivieren (für Non-Holder, $0.10/Anfrage)

- `ACCESS_GATING_ENABLED=true`, `HOLDER_NFT_CONTRACT=<Normies-Contract>`, `HOLDER_NFT_CHAIN=ethereum`, `TREASURY_ADDRESS=<dein Treasury>`.
- x402-Flow analog SwarmSkill (keyless xpay-Facilitator). **TODO im Code:** die x402-Middleware ist als Tier-Logik vorhanden (`src/access/gate.ts`), der HTTP-402-Payment-Handshake muss noch an den xpay-Facilitator gehängt werden (`paymentSettled`-Flag setzen) — 1 kleiner Adapter, bewusst offen gelassen bis du das Treasury bestätigst.

## 6. ERC-8257 / OpenSea-Listing (wie SwarmSkill — kostet Gas, braucht Wallet)

- Tool als ERC-8257-Eintrag registrieren (Base, open+x402 oder NFT-gated).
- **Nicht autonom gemacht** — braucht deine Wallet + Gas. Schritte analog SwarmSkill-Verbreitung (siehe `SwarmSkill/VERBREITUNG_STATUS.md`).

## 7. Weitere Verbreitung (analog SwarmSkill)

- **Context7:** `context7.json` liegt bereit → Repo bei context7.com einreichen (per Dashboard/API).
- **skills.sh / ClawHub:** Paket-Manifest analog SwarmSkill.
- **npm publish** (optional): `npm publish --access public` (braucht deinen npm-Login).
- **`/llms.txt`** ist live, sobald gehostet (Schritt 3).

## 8. npm-Distribution (optional, damit Leute `npx crypto-knowledge` nutzen)

```bash
npm publish --access public   # braucht npm-Login; bin-Entry zeigt auf dist/index.js (stdio)
```

---

### Was Claude weiter autonom macht (ohne dich)
- Tool iterativ erweitern (mehr Chains, Whale-Event-Listener, x402-Adapter-Scaffold, mehr Tests)
- Online weiter nach besseren Endpoints/Datenquellen recherchieren und einarbeiten
- Alles lokal committen — **kein** Remote-Push, **kein** Deploy, **kein** Mint, **kein** Posting ohne dich
