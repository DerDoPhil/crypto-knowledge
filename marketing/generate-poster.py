#!/usr/bin/env python3
# Crypto-Knowledge Werbe-Poster — radiale Mindmap, Normies-Monochrom
import math

W, H = 1200, 1600
CX, CY = 600, 830
Ri = 234          # inner ring (action tools)
Ro = 386          # outer ring (knowledge categories)
CORE = 94         # brain node radius

# ---- palette (Normies monochrome) ----
BG      = "#e3e5e4"
SURF    = "#edeeed"
INK     = "#48494b"
STRONG  = "#2c2d2f"
MUTE    = "#8d8f90"
HAIR    = "#cdcfce"
PAPER   = "#f4f5f4"

MONO = "'SFMono-Regular','SF Mono','JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace"
SANS = "'Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif"

# ---- 12 action tools (inner ring) ----
tools = [
    "route", "solana_swap", "pumpfun", "profitability",
    "abi", "portfolio", "security", "mev_protection",
    "whale_watch", "simulate", "chaintrade", "catalog",
]

# ---- 18 knowledge categories (outer ring). order tuned so long labels sit top/bottom,
#      short labels sit near 3 & 9 o'clock to avoid horizontal overflow ----
# slots go clockwise from top (90deg), step -20deg
cats = [
    "Market & DeFi data",   # 90  top
    "Trading strategies",   # 70
    "Wallets & setup",      # 50
    "Signing & auth",       # 30
    "NFTs",                 # 10  ~3 o'clock (short!)
    "Solana",               # 350 ~3 o'clock (short!)
    "Stablecoins",          # 330
    "Payments & x402",      # 310
    "Compressed NFTs",      # 290
    "Deploy contracts",     # 270 bottom
    "Swaps & bridging",     # 250
    "Send & debug tx",      # 230
    "Smart accounts",       # 210
    "Bitcoin",              # 190 ~9 o'clock (short!)
    "Security",             # 170 ~9 o'clock (short!)
    "Staking",              # 150
    "Infra & perf",         # 130
    "Tokens ERC-20/SPL",    # 110
]

svg = []
def add(s): svg.append(s)

add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{SANS}">')

# defs: subtle paper texture via faint dot grid + soft shadow for core
add('<defs>')
add(f'<radialGradient id="vign" cx="50%" cy="46%" r="72%">'
    f'<stop offset="0%" stop-color="{PAPER}"/>'
    f'<stop offset="100%" stop-color="{BG}"/></radialGradient>')
add(f'<filter id="soft" x="-40%" y="-40%" width="180%" height="180%">'
    f'<feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#2c2d2f" flood-opacity="0.16"/></filter>')
add('</defs>')

# background
add(f'<rect width="{W}" height="{H}" fill="url(#vign)"/>')
# outer frame hairline
add(f'<rect x="26" y="26" width="{W-52}" height="{H-52}" fill="none" stroke="{HAIR}" stroke-width="1.5"/>')

# ---------- HEADER ----------
# eyebrow
eb_y = 96
add(f'<g font-family="{MONO}" font-size="15" letter-spacing="3" fill="{INK}">')
# verified tick box
add(f'<rect x="80" y="{eb_y-13}" width="17" height="17" rx="3" fill="{STRONG}"/>')
add(f'<path d="M84 {eb_y-5} l3 3 l6 -7" fill="none" stroke="{BG}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
add(f'<text x="108" y="{eb_y}">ERC-8257 AGENT TOOL &#183; OPENSEA #71 &#183; ONCHAIN-HASH VERIFIED</text>')
add('</g>')

# title
add(f'<text x="80" y="216" font-family="{SANS}" font-weight="800" font-size="80" '
    f'letter-spacing="-3" fill="{STRONG}">CRYPTO-KNOWLEDGE</text>')
# subtitle
add(f'<text x="82" y="262" font-family="{SANS}" font-weight="400" font-size="27" '
    f'fill="{INK}">The on-chain brain for autonomous AI agents.</text>')
# thin rule
add(f'<line x1="80" y1="300" x2="{W-80}" y2="300" stroke="{HAIR}" stroke-width="1.5"/>')
# two lane labels sitting on the rule
add(f'<g font-family="{MONO}" font-size="14" letter-spacing="2" fill="{MUTE}">')
add(f'<text x="80" y="330">INNER RING &#8594; 12 ACTION TOOLS &#183; UNSIGNED TX + LIVE DATA</text>')
add(f'<text x="{W-80}" y="330" text-anchor="end">OUTER RING &#8594; 77 GUIDES / 18 CATEGORIES</text>')
add('</g>')

# ---------- GRAPHIC: guide circles ----------
add(f'<circle cx="{CX}" cy="{CY}" r="{Ro}" fill="none" stroke="{HAIR}" stroke-width="1.2"/>')
add(f'<circle cx="{CX}" cy="{CY}" r="{Ri}" fill="none" stroke="{HAIR}" stroke-width="1.2" stroke-dasharray="2 5"/>')

def pol(r, deg):
    a = math.radians(deg)
    return CX + r*math.cos(a), CY - r*math.sin(a)

# ---------- connectors + inner tool nodes ----------
n = len(tools)
for i, name in enumerate(tools):
    deg = 90 - i*(360/n)
    nx, ny = pol(Ri, deg)
    ex, ey = pol(CORE, deg)   # edge of core
    # connector
    add(f'<line x1="{ex:.1f}" y1="{ey:.1f}" x2="{nx:.1f}" y2="{ny:.1f}" stroke="{INK}" stroke-width="1.4" opacity="0.55"/>')

# nodes drawn after lines so they sit on top
for i, name in enumerate(tools):
    deg = 90 - i*(360/n)
    nx, ny = pol(Ri, deg)
    c = math.cos(math.radians(deg))
    s = math.sin(math.radians(deg))
    # filled pixel square node
    add(f'<rect x="{nx-6.5:.1f}" y="{ny-6.5:.1f}" width="13" height="13" fill="{STRONG}"/>')
    # label
    fs = 18
    if c > 0.30:
        lx, anchor = nx + 14, "start"
        ly = ny + fs*0.34
    elif c < -0.30:
        lx, anchor = nx - 14, "end"
        ly = ny + fs*0.34
    else:  # near vertical
        lx, anchor = nx, "middle"
        ly = ny - 14 if s > 0 else ny + 14 + fs*0.72
    add(f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}" font-family="{MONO}" '
        f'font-size="{fs}" font-weight="500" fill="{STRONG}">{name}</text>')

# ---------- outer category nodes ----------
m = len(cats)
for i, name in enumerate(cats):
    deg = 90 - i*(360/m)
    nx, ny = pol(Ro, deg)
    c = math.cos(math.radians(deg))
    s = math.sin(math.radians(deg))
    # hollow square node on the ring
    add(f'<rect x="{nx-5:.1f}" y="{ny-5:.1f}" width="10" height="10" fill="{BG}" stroke="{INK}" stroke-width="1.6"/>')
    fs = 15
    if c > 0.30:
        lx, anchor = nx + 12, "start"; ly = ny + fs*0.34
    elif c < -0.30:
        lx, anchor = nx - 12, "end"; ly = ny + fs*0.34
    else:
        lx, anchor = nx, "middle"
        ly = ny - 12 if s > 0 else ny + 12 + fs*0.72
    add(f'<text x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}" font-family="{MONO}" '
        f'font-size="{fs}" fill="{INK}">{name}</text>')

# ---------- central BRAIN node ----------
add(f'<circle cx="{CX}" cy="{CY}" r="{CORE}" fill="{STRONG}" filter="url(#soft)"/>')
add(f'<circle cx="{CX}" cy="{CY}" r="{CORE}" fill="none" stroke="{BG}" stroke-width="1.5" opacity="0.25"/>')

# pixel-grid head/brain emblem (Normies nod), light squares on dark node
grid = [
    "0111110",
    "1111111",
    "1101011",
    "1111111",
    "1011101",
    "0111110",
    "0010100",
]
cell = 10.5
gw = len(grid[0]) * cell
gh = len(grid) * cell
gx0 = CX - gw/2
gy0 = CY - gh/2 - 6
for r, row in enumerate(grid):
    for cidx, ch in enumerate(row):
        if ch == "1":
            add(f'<rect x="{gx0+cidx*cell:.1f}" y="{gy0+r*cell:.1f}" '
                f'width="{cell-1.4:.1f}" height="{cell-1.4:.1f}" fill="{PAPER}"/>')
# label under emblem, inside node
add(f'<text x="{CX}" y="{CY+CORE-20:.1f}" text-anchor="middle" font-family="{MONO}" '
    f'font-size="12.5" letter-spacing="2" fill="{PAPER}">MCP BRAIN</text>')

# ---------- FOOTER ----------
fy = 1372
add(f'<line x1="80" y1="{fy-34}" x2="{W-80}" y2="{fy-34}" stroke="{HAIR}" stroke-width="1.5"/>')
# big stat line
add(f'<text x="{CX}" y="{fy}" text-anchor="middle" font-family="{MONO}" font-weight="600" '
    f'font-size="23" letter-spacing="0.5" fill="{STRONG}">'
    f'77 GUIDES &#183; 18 CATEGORIES &#183; 27 ENDPOINTS &#183; 10 CHAINS</text>')
add(f'<text x="{CX}" y="{fy+34}" text-anchor="middle" font-family="{MONO}" '
    f'font-size="17" letter-spacing="0.5" fill="{MUTE}">'
    f'KEYSTORE-FREE &#183; STATELESS &#183; UNSIGNED TX ONLY &#183; 89 TESTS</text>')

# access chip
chip_y = fy + 78
add(f'<g>')
add(f'<rect x="{CX-232:.0f}" y="{chip_y-24}" width="464" height="40" rx="20" fill="none" stroke="{INK}" stroke-width="1.6"/>')
add(f'<rect x="{CX-232+14:.0f}" y="{chip_y-16}" width="15" height="15" rx="3" fill="{STRONG}"/>')
add(f'<path d="M{CX-232+18:.0f} {chip_y-9} v-3 a3.5 3.5 0 0 1 7 0 v3" fill="none" stroke="{BG}" stroke-width="1.6"/>')
add(f'<text x="{CX+6}" y="{chip_y+2}" text-anchor="middle" font-family="{MONO}" font-size="15.5" '
    f'letter-spacing="0.5" fill="{INK}">hold a Normie NFT &#8212;or&#8212; pay $0.10 via x402</text>')
add('</g>')

# url line
add(f'<text x="{CX}" y="{chip_y+64}" text-anchor="middle" font-family="{MONO}" font-weight="700" '
    f'font-size="25" letter-spacing="0.5" fill="{STRONG}">crypto-knowledge-mcp.vercel.app</text>')
add(f'<text x="{CX}" y="{chip_y+92}" text-anchor="middle" font-family="{MONO}" '
    f'font-size="14" letter-spacing="1" fill="{MUTE}">opensea.io/tools/erc8257/ethereum/71</text>')

add('</svg>')

out = "\n".join(svg)
with open("/tmp/claude-1000/-home-philipp/f53d15d9-3d3d-4cf3-a14c-0176a36f9a32/scratchpad/crypto-knowledge.svg", "w") as f:
    f.write(out)

# html wrapper for crisp chrome render
html = (f'<!doctype html><html><head><meta charset="utf-8">'
        f'<style>html,body{{margin:0;padding:0;background:{BG}}}</style></head>'
        f'<body>{out}</body></html>')
with open("/tmp/claude-1000/-home-philipp/f53d15d9-3d3d-4cf3-a14c-0176a36f9a32/scratchpad/preview.html", "w") as f:
    f.write(html)
print("written", len(out), "bytes")
