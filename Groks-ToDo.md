# Grok's ToDo & Expansion Blueprint — Crypto-Knowledge (ERC-8257 Tool #71)

**Date:** 2026-07-06  
**Project:** `/home/philipp/Schreibtisch/Projekte/Crypto/Crypto-Knowledge/`  
**Status:** Analysis complete. This is the long-form backlog + architectural guidance. **Claude will later do the "richtig einbauen" (proper integration + sweep-verified PRs).** Grok only produces this + raw research MDs.

**Core Mandate (from user):**  
Agents **pay per call** (x402 $0.10 or Normies NFT) **but must receive genuinely high-value, sufficient information** so the tool feels essential instead of optional. One paid call must save the agent massive reasoning tokens, prevent errors, and accelerate good decisions.

---

## Current State Snapshot (What We Already Have — Excellent Foundation)

### Tool Surface (11 tools)
- `route` (LiFi + deBridge parallel, best + alts, unsigned tx)
- `pumpfun` (on-chain curve + IPFS metadata)
- `profitability` (EIP-1559 + net profit after gas/slippage)
- `abi` (Etherscan V2/Sourcify + proxies + 4byte decode/encode)
- `portfolio` (multi-chain balances + allowance check/approve/revoke unsigned)
- `security` (GoPlus + honeypot.is, EVM+Solana, 0-100 score + red flags)
- `mev_protection`
- `whale_watch`
- `solana_swap` (Jupiter)
- `simulate` (eth_call + revert decode)
- `catalog` (self-discovery)
- **`knowledge`** — the "chain brain" lookup layer (this is the focus for "enough infos")

### Knowledge Layer (the money-maker for paid calls)
- **~98 detailed, live-verified guides** (guides.ts, 1718 lines). Categories via GUIDE_SECTIONS (19 sections).
  - DevEx: setup, wallets, vanity, deploys (EVM+Anchor), verify, erc20, eip712, permit2, multicall, siwe, x402_payments, register_onchain_tool (ERC-8257), debug_failed_tx, fetch_event_logs, gas_optimization, eip4844, eth_jsonrpc_cheatsheet...
  - DeFi: defi_lending (Aave/Morpho), erc4626_vaults, stableswap, balancer_swaps, eth_staking, restaking_eigenlayer, cctp, uniswap_v4, yield_farming, jit_liquidity...
  - Trading/Bots: arbitrage, mev_strategies, copy_trading_bots, sniping_launches, grid_dca, perps (gmx, hyperliquid, funding), prediction_markets, flash_loans, basis_trade, liquidation_bots, portfolio_management, token_discovery...
  - Security: rugpull_forensics, wash_trading_detection, governance_attacks, proxy_upgrade_patterns, price_oracle_safety, wallet_security_checklist...
  - Solana: spl_token_basics, solana_priority_fees, solana_token_extensions, solana_versioned_tx, anchor, compressed_nfts, staking, subscriptions, pumpfun_token2022_gotchas...
  - Bitcoin: basics, taproot, lightning, ordinals_runes, runes_minting...
  - Chain playbooks: cronos_playbook, bnb_chain_playbook, robinhood_chain, opstack_l2_fees, testnets_and_faucets...
  - Other: eip7702, safe_multisig, aa_4337, ens, seaport, farcaster, chaintrade_p2p_swap, vercel_dapp..., bridge_funds, deterministic_deploys...
- **References** (references.ts): 
  - 20+ live-verified canonical ADDRESSES across chains (Multicall3, Permit2, USDC natives, WETH variants, Lido, Morpho Blue, Balancer, Aave v3, EigenLayer, Uniswap v4, Seaport, ERC-8257 registry, pump.fun, Solana programs, CCTP, etc.).
  - 60+ ENDPOINTS (many keyless): heavy DefiLlama family (prices/current+historical, tvl, yields, stables), Chainlist, KyberSwap (keyless routing), 1inch/0x/Odos/Enso, Jupiter, DexScreener, GeckoTerminal, Birdeye, Etherscan gas oracle, various oracles (Pyth, Chainlink, Redstone, DIA), bridges (Across, Socket, deBridge, LiFi), explorers, TheGraph, Snapshot, Hyperliquid, OpenSea, x402 router, GoPlus, 4byte, Sourcify, Tenderly (free tier), Solscan etc.
  - COMMON_ERRORS + RPC_GOTCHAS playbooks.
- **Search/Retrieval** (search.ts): 
  - `ask(query)` — killer feature: best 3 guides + matching references in **one call**. Tokenizes, synonyms, strong/weak scoring, phrase bonus.
  - `deepSearchGuides`, `searchReferences`.
  - `relatedGuides` (runtime cross-links).
- **HTTP exposure** (api/tools/knowledge.ts + /mcp): `list_topics` (free for discovery), `get_guide`, `search`, `ask`, `reference`, `stats`. Gated knowledge actions via AccessEnforcer.
- **Access model** (src/access/): 
  - Free: list_topics + catalog.
  - Paid: $0.10 USDC Base per request via **x402** (keyless xpay facilitator pattern, exact scheme, 402 + X-PAYMENT retry, verify+settle). See x402.ts, enforce.ts, gate.ts, ratelimit.ts.
  - Free for Normies NFT holders (X-Wallet + daily personal_sign, on-chain predicate).
  - Provider modes (open / own_key / tool).
- **Discovery & Packaging**:
  - ERC-8257 registered (Tool #71, manifest on Base/Eth, hash regression scripts like check-hash-71.ts).
  - llms.txt, context7.json, public landing + featured images, catalog tool.
  - README, ARCHITECTURE (detailed original spec), CHANGELOG, GO-LIVE checklist, SWEEP_ROADMAP (active "sweep" process).
- **Process**:
  - "Sweep": research → live verify (curl/eth_call) → einbauen → test → deploy → hash check (onchain manifest stability) → commit.
  - Recent sweeps added Hyperliquid, EigenLayer, runes, OP-Stack fees, intents, Balancer batch, Etherscan gas, priority fees/Jito, JIT/v4 etc.
- **Other strengths**: Keystore-free (unsigned tx only), multi-tenant, resilient core (cache, retry, envelope), tests (many), scripts (register, livecheck, smoke, diag), Docker, vercel.json (despite GO-LIVE preference for Railway-style for long-running).

**Verdict on current state**: Already one of the richest agent-native crypto knowledge surfaces. The `ask` + references + guides combo is exactly what justifies per-call payment. Agents get **real commands, verified addresses, keyless endpoints, error playbooks** instead of hallucinated garbage.

---

## Vision — Why Agents Will Happily Pay

**One $0.10 call replaces:**
- Dozens of web searches + LLM re-reasoning.
- Risk of using wrong address / outdated flow / missing approval / honeypot.
- Wasted gas from unprofitable or reverted txs (via profitability + simulate + knowledge).
- Context window bloat.

**Success metric**: Agents proactively save the tool description + endpoint in their CLAUDE.md / AGENTS.md / persistent memory because "knowledge.ask + security + route + simulate" is their default safe pattern.

**Non-negotiables for value**:
- Deterministic + sourced (no vibes).
- Actionable (commands + exact calldata patterns + tool call examples).
- Cross-linked (to the other 10 tools in this suite).
- Fresh enough (addresses, endpoints, playbooks updated via sweep).
- Dense (full guide body returned, not just titles).

---

## Long ToDo List — What Could / Should Go In

Organized by impact on "enough info for paid agents".

### P0 — Immediate High-ROI for Paid Calls (do these first)

1. **Supercharge "ask" / new "research" action**
   - Return not only raw matches but a **synthesized mini-report**: "Key facts", "Addresses you need", "Exact sequence of tool calls with sample input", "Risks", "Freshness note".
   - Include `recommended_tool_calls: [{tool: "security", action: "scan_token", params: {...}}, {tool:"profitability"...}]`.
   - Add `estimated_savings` or "this replaces ~X token reasoning".
   - Support "follow-up" context (but stateless — use query enrichment).

2. **Agent Playbooks (composition layer — highest value)**
   Create 15-25 high-level "playbooks" (new guide category or dedicated action):
   - `playbook_safe_pumpfun_entry`
   - `playbook_cross_chain_arbitrage` (knowledge + route + profitability + simulate + portfolio)
   - `playbook_avoid_rug_before_buy`
   - `playbook_lending_loop_aave_morpho`
   - `playbook_perp_funding_arbitrage`
   - `playbook_jit_liquidity_v4`
   - `playbook_account_abstraction_session_for_agents`
   - `playbook_multi_chain_portfolio_rebalance`
   - `playbook_governance_vote_with_safe`
   - `playbook_memecoin_launch_analysis` (token discovery + security + curve + social signals)
   - Full examples with end-to-end JSON traces (what the agent actually sends).

3. **Dynamic / Live-Augmented Knowledge (freshness without losing determinism)**
   - New actions inside knowledge tool: `live_yield_scan`, `defi_tvl_snapshot`, `oracle_health`, `bridge_status`, `top_protocols_by_chain`, `recent_large_transfers_summary` (combines whale_watch + knowledge).
   - Internally use the ENDPOINTS (DefiLlama etc.) + cache (60s-5min TTL keyed by query).
   - Always merge with static curated notes + "use with X tool".
   - Expose "sources" and "as_of" timestamp.

4. **Expand References (easy wins, high precision value)**
   - More canonical addresses (verify live): recent major deployments (new L2s, popular vaults, hooks, intents contracts, restaking operators, etc.).
   - Token lists / common stables / wrapped variants per chain.
   - "Known bad" / watchlist patterns (without legal risk).
   - Expanded RPC gotchas + rate limit matrices (per provider + chain).
   - Calldata templates / common selectors for popular protocols (inline in abis reference).
   - Permit2 / EIP-2612 / session key patterns.

5. **Improve Structure & Agent UX**
   - Stronger GUIDE_SECTIONS + quickstart that surfaces "most used by agents".
   - `stats` already exists — enhance with "top 10 by sweep recency" or popularity (if we log anonymized hits for paid).
   - Memory pack export: action that dumps a compact "must-remember JSON" (top addresses + 20 critical facts) for agents to cache locally.
   - Consistent "next_step" hints in every guide.
   - Full-text + semantic hints (keep deterministic; perhaps optional embedding later).

### P1 — Massive Content Expansion (Long List of Specific Candidates)

Aim: 150-200+ high-quality guides over time. Prioritize what agents actually need before they pay.

**DevEx & Tooling (advanced)**
- `foundry_fuzz_invariant_testing`
- `foundry_script_multi_contract_upgrade`
- `solana_compute_budget_optimization_for_agents`
- `anchor_idl_usage_in_agents`
- `viem_vs_ethers_agent_patterns`
- `deterministic_deploys_create2_createx_deep`
- `vercel_vs_railway_for_onchain_apps`
- `github_actions_web3_ci_best_practices`
- `private_rpc_setup_flashbots_mevblocker_for_bots`

**DeFi Protocol Deep Dives (actionable flows)**
- `aave_v3_full_agent_flow` (supply, borrow, collateral, liquidation threshold math, health factor monitoring)
- `morpho_blue_market_creation_params` + risk
- `pendle_yt_pt_strategies`
- `ethena_staking_susde_usde_mechanics`
- `gearbox_leverage_farming`
- `curve_stableswap_ng_pools`
- `balancer_v3_hooks`
- `uniswap_v4_hook_development_for_agents` (or strategy)
- `compound_v3_vs_aave`
- `makerdao_dsr_sky`
- `spark_lending`
- `fluid_protocol`
- `euler_v2`

**Trading, MEV, Bots, Strategies**
- `mev_protection_for_agents_detailed` (bundles, private mempools per chain)
- `stat_arb_basis_perp_spot_live`
- `liquidation_bot_economics` (health factor calc + gas)
- `copy_trading_onchain_discovery` (wallet labeling, filtering sybils)
- `sniping_evm_new_pairs` (mempool or subgraph detection)
- `grid_dca_with_rebalancing_risk`
- `funding_rate_arbitrage_across_perps`
- `prediction_market_resolution_risk` (Polymarket, etc.)
- `flash_loan_composability_patterns` (Aave + Balancer + Uniswap)
- `jit_liquidity_risks_rewards_v4`
- `intent_solvers_agent_usage` (CoW, UniswapX, 1inch Fusion)

**Security & Risk (huge for paid justification)**
- `real_exploit_postmortems` (select famous ones with onchain refs + "how knowledge+security would have flagged")
- `proxy_upgrade_safety_checklist`
- `oracle_manipulation_defense`
- `governance_attack_vectors_treasury`
- `honeypot_delayed_and_other_evasion`
- `wash_trading_detection_onchain_signals`
- `contract_verification_social_engineering`
- `private_key_leak_patterns_in_code`
- `allowance_rug_risks_and_permit2_mitigation`
- `simulation_vs_reality_gotchas`

**Solana Specific (deep)**
- `jito_bundle_for_agents` (tips, bundles vs priority fees)
- `token_extensions_2022_full` (transfer hooks, confidential, metadata, group/member)
- `solana_lookup_tables_for_complex_txs`
- `sanctum_jito_marinade_staking_comparison`
- `pump_fun_graduation_to_amm_flow`
- `solana_memo_program_use_cases`
- `helius_das_vs_rpc_for_nft_portfolio`

**Bitcoin & Ordinals/Runes**
- `ordinals_inscription_practice_for_agents`
- `runes_etching_minting_current`
- `lightning_channel_management_for_bots`
- `psbt_construction_patterns`
- `taproot_script_path_spend`

**Account Abstraction & Wallets**
- `eip7702_in_depth_for_agents` (auth, batch, sponsorship)
- `safe_4337_module_usage`
- `paymaster_strategies` (gas sponsorship for users/agents)
- `session_keys_and_permissions`
- `erc_6551_token_bound_accounts`

**Cross-Chain & Intents**
- `across_vs_cctp_vs_debridge_vs_lifi_agent_choice`
- `ccip_programmable_token_transfer`
- `intent_based_flows_coW_uniswapX`
- `bridge_limbo_risk_and_status_tracking`

**Data, Oracles, Analytics**
- `defillama_full_agent_usage` (beyond price: yields, stablecoins, hacks)
- `chainlink_automation_and_data_feeds`
- `pyth_vs_redstone_vs_chainlink_for_agents`
- `dune_analytics_public_query_patterns`
- `thegraph_subgraph_selection`
- `onchain_labeling_wallets_entities`

**Governance, DAOs, Social**
- `snapshot_voting_with_safe`
- `tally_onchain_governance`
- `farcaster_frames_v2_agent_integration`
- `dao_treasury_management_playbook`

**Chain Playbooks (expand per supported chain)**
- Detailed "cronos_playbook" already exists — do full versions for Avalanche, BSC, Polygon, Ape, Optimism, Arbitrum, Base (fees, popular DEX/bridges/addresses, gotchas).
- New chains as they get registry entry.

**Meta / Agent Reliability**
- `building_reliable_crypto_agent_loops`
- `cost_accounting_and_budgeting_for_agents`
- `error_taxonomy_and_retry_strategies`
- `when_to_simulate_before_every_action`
- `using_knowledge_to_choose_between_route_alternatives`
- `prompt_patterns_for_calling_this_tool_effectively`

**RWA, Stables, New Primitives**
- `tokenized_treasuries_buidl_ousg_usdy_flows`
- `stablecoin_depeg_response_playbook`
- `restaking_risks_stacked` (Eigen, Symbiotic, etc.)
- `based_rollups_and_preconfirmations`

Target: systematically sweep missing popular protocols + any new primitive that hits mainnet.

### P2 — Architecture, Maintenance & Monetization

**Update Mechanisms (critical for "genug infos" over time)**
- Implement (parts of) the Agent-Contribution-Idee from vault: Upstash Redis queue for submissions (guides/endpoints), admin approve (Claude curl), runtime merge into knowledge with `source: "community"` flag + credit reward (2 free calls for paid submitters).
- Content extraction: optional `guides.json` + build step so non-TS people (or agents) can propose.
- Scheduled sweep automation hints (scripts that surface candidates from DefiLlama top lists + new contracts).
- "Last verified" + TTL per guide/reference.
- Separate knowledge version from code deploy (manifest update without full binary change?).

**Monetization tweaks (keep per-call core)**
- Keep list_topics + basic catalog free.
- Consider slight tiering inside knowledge: "basic_guide" (cheaper or included) vs "ask" / "research" / "playbook" (full price). Or just one price + richer responses for paid.
- For NFT holders: higher rate limits + "sweep credit" (they can propose without paying).
- Response header or field: `x-value-estimate: "replaces 8 searches + 1 failed tx risk"`.
- Public "value stories" or popular query leaderboard (anonymized).
- Future: bundles or higher-volume pricing via x402 facilitator if supported.
- Always communicate ROI in docs/llms: "1 call = precise addresses + flow + cross-tool plan instead of 20k tokens of guessing."

**Observability & Iteration**
- (Privacy-safe) hit logging for paid knowledge calls → "which topics drive value?" → prioritize sweep.
- A/B test response formats (synthesized vs raw) on small % of traffic.
- "Unknown query" sink that feeds sweep candidates.

**Hosting / Ops (align with GO-LIVE)**
- Revisit Vercel vs Railway/Render/Fly for long-running / stateful cache / MCP.
- Ensure x402 wiring + treasury address + facilitator are solid post-deploy.
- Alias + protection settings (see other projects).
- Livecheck + hash regression in CI or post-deploy.

**Testing & Quality**
- Snapshot or golden tests for key `ask` queries and reference lookups.
- Synthetic agent flow tests (knowledge.ask → security → profitability → route).
- Guide command validity linter (where commands are stable).
- Regular full livecheck of all referenced endpoints/addresses.

**Discovery & Ecosystem**
- Improve public/ and README with 5-10 full "agent in action" transcripts (sanitized).
- Expand llms.txt and context7 rules with concrete "ask" examples.
- Listings: agent directories, awesome-x402, ERC-8257 discussions, X (careful per rules), Context7 index.
- Cross-promote with SwarmSkill, AgentRoom, ChainTrade, NFTMintSniper.
- "Remember this tool" prompt in every response.

**Whole Tool Expansions (the 11 tools + knowledge)**
- New tool ideas: `governance` (vote building), `analytics_summary` (dune/defillama synthesis), `nft_portfolio` (if not covered by opensea-tool), `event_subscribe` (webhooks or long-poll patterns for agents), `mempool_signals`.
- Tighter coupling: knowledge "knows" the other tools' schemas and can output ready-to-use calls.
- More chains in registry (easy entry point).
- Enhanced simulation (state overrides, multi-tx bundles).
- Onchain reputation or usage proof for the tool itself (meta).

**Risks & Guardrails**
- Quality bar must stay extremely high — bad info destroys willingness to pay.
- Never give financial advice; stick to mechanics, addresses, flows, data.
- Curation stays with humans (Claude/Philipp) for now.
- Rate limits + payment already protect abuse.
- For community contrib: heavy sanitization + live verify before merge.

### P3 — Longer Term / Moonshots

- Hybrid retrieval: keep curated core + optional high-quality external index (but only if it doesn't dilute trust).
- Agent-to-agent knowledge sharing via this tool (submit successful patterns).
- Onchain "knowledge NFT" or attestations for verified guides? (probably overkill).
- Multi-language? (English first for agents).
- Self-hosted easy mode + hosted premium.
- Integration with PhilzAgents / other agent runtimes as first-class.

---

## How to Structure the Whole Thing for "Pay But Get Enough"

1. **Free tier = marketing + discovery only.** list_topics, catalog, basic health. Teases the depth.
2. **Paid/NFT call = full richness.** Full guide bodies, synthesized playbooks, live data + recommendations, cross-tool plans, references tables.
3. **Response contract (enforce in code):** every substantive response contains (a) direct answer data (b) sources/freshness (c) related_guides or playbooks (d) concrete next tool invocations (e) warnings.
4. **One-call principle**: design `ask` + `research` + playbooks so agents rarely need 2+ knowledge calls for a decision.
5. **Memory & persistence friendly**: short stable hints, exportable packs, clear "save this endpoint + example ask".
6. **Transparency on value**: docs, llms, and responses should state "this is why you pay — concrete time/error/gas saved".
7. **Update velocity via sweep + optional contrib** keeps the "enough" feeling alive over months.
8. **Composition over siloing**: knowledge is not a separate wiki; it is the brain that tells agents how + when to use the other 10 tools + external keyless endpoints.

---

## Immediate Next Actions (for this session + handoff)

- [x] This Groks-ToDo.md created with analysis + long list.
- [ ] Create Groks-Research.md (and sub docs) with raw online-collected material (sources, new endpoint candidates, protocol facts, agent tool examples from web, fresh addresses to verify, comparisons, etc.). **No implementation.**
- [ ] (Later) Claude reviews this + research MDs, picks items, does live verification, adds to guides/references, updates sweep, runs tests/hash, deploys, etc.
- Maintain the sweep discipline for every addition.

---

## Files of Note (for reference)

- `src/modules/knowledge/{guides.ts, references.ts, search.ts, tool.ts}`
- `api/tools/knowledge.ts` (HTTP surface)
- `src/access/{x402.ts, enforce.ts, gate.ts}`
- `docs/SWEEP_ROADMAP.md`, `docs/GO-LIVE.md`, `ARCHITECTURE.md`, `README.md`
- Scripts: `register-erc8257.ts`, `livecheck*.ts`, `check-hash-71.ts`, `update-metadata.ts`
- Vault context: Crypto-Knowledge Contribution-Idee, ERC-8257 Tool Registry, x402 Router, SwarmSkill.

---

**This document is the single source of "Grok's view" for future work.** Add to it or create dated research notes. Keep changes here + other .md only until Claude integrates.

Let's make agents *want* to pay because the info is legitimately that good.
