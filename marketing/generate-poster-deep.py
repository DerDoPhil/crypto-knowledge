#!/usr/bin/env python3
# Crypto-Knowledge — TIEFE Mindmap (Brain -> Kategorien -> einzelne Guides)
import math

W, H = 1600, 2050
CX, CY = 800, 1035
R1 = 300          # category ring
R2 = 612          # leaf ring
CORE = 66

BG="#e3e5e4"; SURF="#edeeed"; INK="#48494b"; STRONG="#2c2d2f"
MUTE="#8d8f90"; HAIR="#cdcfce"; PAPER="#f4f5f4"; FAINT="#b9bbba"
MONO="'SFMono-Regular','SF Mono','JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace"
SANS="'Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif"

# ---- category -> [guide ids] (from GUIDE_SECTIONS, dict order) ----
SECTIONS = [
 ("Getting started & wallets", ["create_wallet","get_testnet_funds","wallet_security_checklist","vanity_address"]),
 ("Sending & debugging tx", ["debug_failed_tx","tx_confirmation_patterns","eth_jsonrpc_cheatsheet","fetch_event_logs"]),
 ("Tokens · ERC-20 / SPL", ["erc20_patterns","permit2_usage","spl_token_basics","erc_standards_cheatsheet"]),
 ("Swaps, bridging & routing", ["aggregator_swaps","bridge_funds","l2_bridging_basics","cctp_native_usdc","crosschain_message_tracking","uniswap_v4_basics","chaintrade_p2p_swap"]),
 ("Deploying contracts", ["deploy_contract_evm","deploy_contract_solana","deploy_erc20","deterministic_deploys_create2","verify_contract"]),
 ("Signing & auth", ["eip712_signing","siwe_auth","account_abstraction_4337","ens_resolution"]),
 ("NFTs", ["nft_metadata_standards","ipfs_for_nfts","seaport_orders"]),
 ("Solana specifics", ["anchor_program_interaction","solana_subscriptions","solana_versioned_tx","solana_token_extensions","pumpfun_token2022_gotchas","solana_pay"]),
 ("Bitcoin", ["bitcoin_basics","bitcoin_taproot","bitcoin_ordinals_runes","bitcoin_lightning"]),
 ("Smart accounts & upgrades", ["account_abstraction_4337","eip7702_smart_eoas","safe_multisig"]),
 ("Market, DeFi & social", ["defi_yield_research","yield_farming_mechanics","defi_lending","erc4626_vaults","stableswap_pools","perps_funding_data","dao_governance_data","farcaster_social"]),
 ("Staking", ["solana_staking","eth_staking"]),
 ("Compressed NFTs", ["solana_compressed_nfts"]),
 ("Trading & strategies", ["token_discovery","arbitrage_basics","basis_trade","portfolio_management","trading_bot_architecture","copy_trading_bots","sniping_launches","grid_dca_bots","mev_strategies","liquidation_bots","flash_loans","airdrop_farming","onchain_perps_gmx","prediction_markets","perps_funding_data","price_oracle_safety"]),
 ("Stablecoins", ["stablecoin_mechanics"]),
 ("Token launches", ["token_launch_mechanics","sniping_launches"]),
 ("Security", ["price_oracle_safety","wallet_security_checklist","rugpull_forensics","proxy_upgrade_patterns","governance_attacks","wash_trading_detection"]),
 ("Payments & agent economy", ["x402_payments","register_onchain_tool","opensea_api"]),
 ("Infra & performance", ["multicall_batching","fetch_event_logs","gas_optimization","eip4844_blobs","chainlink_price_feeds","vercel_dapp_deploy_gotchas"]),
]

# short readable leaf labels
LBL = {
 "create_wallet":"create wallet","get_testnet_funds":"testnet funds","wallet_security_checklist":"wallet security","vanity_address":"vanity address",
 "debug_failed_tx":"debug failed tx","tx_confirmation_patterns":"tx confirmation","eth_jsonrpc_cheatsheet":"JSON-RPC cheats","fetch_event_logs":"event logs",
 "erc20_patterns":"ERC-20 patterns","permit2_usage":"Permit2","spl_token_basics":"SPL tokens","erc_standards_cheatsheet":"ERC standards",
 "aggregator_swaps":"aggregator swaps","bridge_funds":"bridging funds","l2_bridging_basics":"L2 bridging","cctp_native_usdc":"CCTP USDC",
 "crosschain_message_tracking":"x-chain msgs","uniswap_v4_basics":"Uniswap v4","chaintrade_p2p_swap":"ChainTrade P2P",
 "deploy_contract_evm":"deploy EVM","deploy_contract_solana":"deploy Solana","deploy_erc20":"deploy ERC-20","deterministic_deploys_create2":"CREATE2","verify_contract":"verify contract",
 "eip712_signing":"EIP-712","siwe_auth":"SIWE login","account_abstraction_4337":"ERC-4337 AA","ens_resolution":"ENS",
 "nft_metadata_standards":"metadata std","ipfs_for_nfts":"IPFS","seaport_orders":"Seaport orders",
 "anchor_program_interaction":"Anchor programs","solana_subscriptions":"subscriptions","solana_versioned_tx":"versioned tx","solana_token_extensions":"token-2022","pumpfun_token2022_gotchas":"pump.fun gotchas","solana_pay":"Solana Pay",
 "bitcoin_basics":"basics · UTXO/PSBT","bitcoin_taproot":"taproot","bitcoin_ordinals_runes":"ordinals & runes","bitcoin_lightning":"lightning",
 "eip7702_smart_eoas":"EIP-7702 EOAs","safe_multisig":"Safe multisig",
 "defi_yield_research":"yield research","yield_farming_mechanics":"yield farming","defi_lending":"lending · Aave","erc4626_vaults":"ERC-4626 vaults","stableswap_pools":"stableswap","perps_funding_data":"perps funding","dao_governance_data":"DAO governance","farcaster_social":"Farcaster",
 "solana_staking":"Solana staking","eth_staking":"ETH staking · Lido",
 "solana_compressed_nfts":"compressed NFTs",
 "token_discovery":"token discovery","arbitrage_basics":"arbitrage","basis_trade":"basis trade","portfolio_management":"portfolio mgmt","trading_bot_architecture":"bot architecture","copy_trading_bots":"copy-trading","sniping_launches":"sniping launches","grid_dca_bots":"grid / DCA","mev_strategies":"MEV strategies","liquidation_bots":"liquidation bots","flash_loans":"flash loans","airdrop_farming":"airdrop farming","onchain_perps_gmx":"perps · GMX","prediction_markets":"prediction mkts","price_oracle_safety":"oracle safety",
 "stablecoin_mechanics":"stablecoin mechanics",
 "token_launch_mechanics":"launch mechanics",
 "rugpull_forensics":"rugpull forensics","proxy_upgrade_patterns":"proxy upgrades","governance_attacks":"governance attacks","wash_trading_detection":"wash-trade detect",
 "x402_payments":"x402 payments","register_onchain_tool":"register ERC-8257","opensea_api":"OpenSea API",
 "multicall_batching":"multicall","gas_optimization":"gas optimization","eip4844_blobs":"EIP-4844 blobs","chainlink_price_feeds":"Chainlink feeds","vercel_dapp_deploy_gotchas":"Vercel deploy",
}

# dedupe (first occurrence) -> clean tree
seen=set(); tree=[]
for cat, ids in SECTIONS:
    leaves=[i for i in ids if i not in seen]
    for i in leaves: seen.add(i)
    if leaves: tree.append((cat, leaves))

L = sum(len(v) for _,v in tree)
C = len(tree)

# ---- angular layout (radial dendrogram) ----
GAP = 2.4
unit = (360 - C*GAP) / L
positions=[]   # (cat, mid, [(leafid, ang)...])
ang = 90.0     # start top, go clockwise (decreasing)
for cat, leaves in tree:
    span = len(leaves)*unit
    mid = ang - span/2
    la=[]
    for k, lid in enumerate(leaves):
        a = ang - (k+0.5)*unit
        la.append((lid, a))
    positions.append((cat, mid, la))
    ang -= span + GAP

def pol(r, deg):
    a=math.radians(deg); return CX+r*math.cos(a), CY-r*math.sin(a)

def rot_anchor(a):
    c=math.cos(math.radians(a))
    if c<0: return (-a+180, "end", -7)
    return (-a, "start", 7)

svg=[]; add=svg.append
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{SANS}">')
add('<defs>')
add(f'<radialGradient id="vg" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="{PAPER}"/><stop offset="100%" stop-color="{BG}"/></radialGradient>')
add(f'<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#2c2d2f" flood-opacity="0.18"/></filter>')
add('</defs>')
add(f'<rect width="{W}" height="{H}" fill="url(#vg)"/>')
add(f'<rect x="26" y="26" width="{W-52}" height="{H-52}" fill="none" stroke="{HAIR}" stroke-width="1.5"/>')

# ---- header ----
add(f'<g font-family="{MONO}" font-size="15" letter-spacing="3" fill="{INK}">')
add(f'<rect x="84" y="83" width="17" height="17" rx="3" fill="{STRONG}"/>')
add(f'<path d="M88 92 l3 3 l6 -7" fill="none" stroke="{BG}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<text x="112" y="96">ERC-8257 AGENT TOOL &#183; OPENSEA #71 &#183; ONCHAIN-HASH VERIFIED</text></g>')
add(f'<text x="84" y="196" font-family="{SANS}" font-weight="800" font-size="74" letter-spacing="-3" fill="{STRONG}">CRYPTO-KNOWLEDGE</text>')
add(f'<text x="86" y="240" font-family="{SANS}" font-size="25" fill="{INK}">The on-chain brain for autonomous AI agents &#8212; every branch is a live playbook the agent can call.</text>')
add(f'<line x1="84" y1="276" x2="{W-84}" y2="276" stroke="{HAIR}" stroke-width="1.5"/>')

# ---- connectors: brain -> category ----
for cat, mid, la in positions:
    ex,ey = pol(CORE, mid); nx,ny = pol(R1, mid)
    add(f'<line x1="{ex:.1f}" y1="{ey:.1f}" x2="{nx:.1f}" y2="{ny:.1f}" stroke="{INK}" stroke-width="1.5" opacity="0.6"/>')

# ---- connectors: category -> leaves ----
for cat, mid, la in positions:
    cxp,cyp = pol(R1, mid)
    for lid,a in la:
        lx,ly = pol(R2, a)
        add(f'<line x1="{cxp:.1f}" y1="{cyp:.1f}" x2="{lx:.1f}" y2="{ly:.1f}" stroke="{FAINT}" stroke-width="0.8" opacity="0.85"/>')

# ---- leaf nodes + labels ----
for cat, mid, la in positions:
    for lid,a in la:
        lx,ly = pol(R2, a)
        add(f'<rect x="{lx-3.4:.1f}" y="{ly-3.4:.1f}" width="6.8" height="6.8" fill="{STRONG}"/>')
        rot,anchor,dx = rot_anchor(a)
        lbl = LBL.get(lid, lid.replace("_"," "))
        add(f'<g transform="translate({lx:.1f},{ly:.1f}) rotate({rot:.2f})">'
            f'<text x="{dx}" y="4" text-anchor="{anchor}" font-family="{MONO}" font-size="13" fill="{STRONG}" '
            f'paint-order="stroke" stroke="{BG}" stroke-width="3.2" stroke-linejoin="round">{lbl}</text></g>')

# ---- category nodes + labels (drawn over leaf lines, with halo) ----
for cat, mid, la in positions:
    nx,ny = pol(R1, mid)
    add(f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="5.5" fill="{BG}" stroke="{STRONG}" stroke-width="2.2"/>')
    rot,anchor,dx = rot_anchor(mid)
    add(f'<g transform="translate({nx:.1f},{ny:.1f}) rotate({rot:.2f})">'
        f'<text x="{dx*1.4:.0f}" y="4.5" text-anchor="{anchor}" font-family="{MONO}" font-size="15.5" font-weight="700" '
        f'letter-spacing="0.3" fill="{STRONG}" paint-order="stroke" stroke="{BG}" stroke-width="4.5" stroke-linejoin="round">{cat}</text></g>')

# ---- central brain ----
add(f'<circle cx="{CX}" cy="{CY}" r="{CORE}" fill="{STRONG}" filter="url(#soft)"/>')
grid=["0111110","1111111","1101011","1111111","1011101","0111110","0010100"]
cell=8.4; gw=len(grid[0])*cell; gh=len(grid)*cell
gx0=CX-gw/2; gy0=CY-gh/2-4
for r,row in enumerate(grid):
    for ci,ch in enumerate(row):
        if ch=="1":
            add(f'<rect x="{gx0+ci*cell:.1f}" y="{gy0+r*cell:.1f}" width="{cell-1.2:.1f}" height="{cell-1.2:.1f}" fill="{PAPER}"/>')
add(f'<text x="{CX}" y="{CY+CORE-14:.1f}" text-anchor="middle" font-family="{MONO}" font-size="10.5" letter-spacing="1.5" fill="{PAPER}">MCP BRAIN</text>')

# ---- footer ----
fy=1888
add(f'<line x1="84" y1="{fy-34}" x2="{W-84}" y2="{fy-34}" stroke="{HAIR}" stroke-width="1.5"/>')
add(f'<text x="{CX}" y="{fy}" text-anchor="middle" font-family="{MONO}" font-weight="600" font-size="23" fill="{STRONG}">'
    f'{L} GUIDES &#183; {C} CATEGORIES &#183; 27 ENDPOINTS &#183; 10 CHAINS</text>')
add(f'<text x="{CX}" y="{fy+33}" text-anchor="middle" font-family="{MONO}" font-size="16.5" fill="{MUTE}">'
    f'12 ACTION TOOLS &#183; KEYSTORE-FREE &#183; STATELESS &#183; UNSIGNED TX ONLY &#183; 89 TESTS</text>')
cy2=fy+76
add(f'<rect x="{CX-240:.0f}" y="{cy2-24}" width="480" height="40" rx="20" fill="none" stroke="{INK}" stroke-width="1.6"/>')
add(f'<text x="{CX}" y="{cy2+2}" text-anchor="middle" font-family="{MONO}" font-size="15.5" fill="{INK}">'
    f'&#128274; hold a Normie NFT &#8212;or&#8212; pay $0.10 via x402</text>')
add(f'<text x="{CX}" y="{cy2+60}" text-anchor="middle" font-family="{MONO}" font-weight="700" font-size="24" fill="{STRONG}">crypto-knowledge-mcp.vercel.app</text>')
add(f'<text x="{CX}" y="{cy2+86}" text-anchor="middle" font-family="{MONO}" font-size="14" letter-spacing="1" fill="{MUTE}">opensea.io/tools/erc8257/ethereum/71</text>')

add('</svg>')
out="\n".join(svg)
base="/tmp/claude-1000/-home-philipp/f53d15d9-3d3d-4cf3-a14c-0176a36f9a32/scratchpad/"
open(base+"crypto-knowledge-deep.svg","w").write(out)
open(base+"preview_deep.html","w").write(f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:{BG}}}</style></head><body>{out}</body></html>')
print(f"leaves={L} categories={C} bytes={len(out)}")
