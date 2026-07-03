/**
 * Curated, ready-to-retrieve Web3 how-to knowledge. Step-by-step runbooks with
 * REAL commands so an agent can execute them without burning reasoning/search
 * credits re-deriving well-known procedures. Each guide is verified against the
 * current tooling (Foundry, Solana/Anza CLI, Anchor) as of 2026-06.
 */
export interface GuideStep {
  title: string;
  command?: string;
  note?: string;
}

export interface Guide {
  topic: string;
  title: string;
  summary: string;
  /** Which chains this applies to: chain keys, or "evm" / "solana" / "all". */
  scope: string[];
  prerequisites: string[];
  steps: GuideStep[];
  warnings?: string[];
  references?: string[];
}

export const GUIDES: Record<string, Guide> = {
  setup_dev_env: {
    topic: "setup_dev_env",
    title: "Install the Web3 dev toolchain (Foundry, Solana CLI, Anchor)",
    summary: "Install everything needed to build, deploy and interact with EVM and Solana programs.",
    scope: ["all"],
    prerequisites: ["A Unix shell (macOS/Linux/WSL)", "Node.js 20+ for JS tooling"],
    steps: [
      { title: "Install Foundry (EVM: forge, cast, anvil)", command: "curl -L https://foundry.paradigm.xyz | bash && foundryup", note: "Provides forge (build/deploy), cast (RPC/abi/wallet), anvil (local chain)." },
      { title: "Install the Solana CLI (Anza)", command: 'sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"', note: "Anza maintains the Solana CLI. Then: solana --version" },
      { title: "Install Anchor (Solana program framework) via avm", command: "cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest && avm use latest", note: "Requires Rust (rustup). Anchor scaffolds + deploys Solana programs." },
      { title: "Verify", command: "forge --version && cast --version && solana --version && anchor --version" },
    ],
    references: ["https://book.getfoundry.sh", "https://docs.anza.xyz/cli/install", "https://www.anchor-lang.com"],
  },

  create_wallet: {
    topic: "create_wallet",
    title: "Create a wallet (EVM and Solana)",
    summary: "Generate a fresh keypair on EVM (Foundry) or Solana (CLI), and store it safely as an encrypted keystore.",
    scope: ["all"],
    prerequisites: ["setup_dev_env"],
    steps: [
      { title: "EVM — generate a new random wallet", command: "cast wallet new", note: "Prints a new address + private key. For scripts, capture both." },
      { title: "EVM — import into an encrypted keystore (recommended)", command: "cast wallet import myKey --interactive", note: "Prompts for the private key + a password; stores ~/.foundry/keystores/myKey. Use --account myKey instead of --private-key in forge/cast." },
      { title: "Solana — generate a keypair file", command: "solana-keygen new --outfile ~/.config/solana/id.json", note: "Writes a JSON keypair and prints the public key + a BIP39 seed phrase. Back up the seed phrase offline." },
      { title: "Solana — show the address", command: "solana address -k ~/.config/solana/id.json" },
    ],
    warnings: [
      "NEVER paste a private key or seed phrase into a chat, a shared terminal, or any 3rd-party API.",
      "Prefer encrypted keystores (cast wallet import / --account) over raw --private-key on the command line (shell history leaks).",
    ],
    references: ["https://book.getfoundry.sh/reference/cast/cast-wallet"],
  },

  vanity_address: {
    topic: "vanity_address",
    title: "Generate a vanity address (custom prefix/suffix) per chain",
    summary: "Grind a keypair whose address starts/ends with chosen characters. EVM uses hex (0-9a-f); Solana uses base58.",
    scope: ["all"],
    prerequisites: ["setup_dev_env"],
    steps: [
      { title: "EVM — grind a prefix", command: "cast wallet vanity --starts-with dead", note: "Hex only (0-9, a-f). Each extra character ~16x slower. Prints address + private key when found." },
      { title: "EVM — grind a suffix", command: "cast wallet vanity --ends-with 0000", note: "Combine --starts-with and --ends-with to constrain both ends." },
      { title: "Solana — grind a prefix (base58, case-sensitive)", command: "solana-keygen grind --starts-with abc:1", note: "Format prefix:count. base58 excludes 0, O, I, l. Each extra char ~58x slower; saves <prefix>...json on success." },
      { title: "Solana — grind a suffix", command: "solana-keygen grind --ends-with pump:1", note: "Used e.g. for pump.fun mints ending in 'pump'." },
    ],
    warnings: [
      "Difficulty grows exponentially with prefix length. 4 EVM chars is fast; 7+ can take hours/days. 4 Solana chars is fast; 6+ is slow.",
      "A vanity address is just a normal keypair — it is NOT more secure. Guard the private key as usual.",
    ],
    references: ["https://book.getfoundry.sh/reference/cast/cast-wallet-vanity", "https://docs.anza.xyz/cli/wallets/paper"],
  },

  deploy_contract_evm: {
    topic: "deploy_contract_evm",
    title: "Deploy a smart contract on any EVM chain (Foundry)",
    summary: "Compile and deploy a Solidity contract to Ethereum, Base, Arbitrum, Optimism, Polygon, Cronos, BSC, Avalanche, ApeChain.",
    scope: ["evm"],
    prerequisites: ["setup_dev_env", "create_wallet", "Native gas token on the target chain"],
    steps: [
      { title: "Scaffold a project", command: "forge init my-contract && cd my-contract" },
      { title: "Build", command: "forge build" },
      { title: "Deploy with a keystore account", command: "forge create src/Counter.sol:Counter --rpc-url <RPC_URL> --account myKey --broadcast", note: "Use the chain's RPC (see the catalog tool for endpoints). Add constructor args with --constructor-args <args...>." },
      { title: "Deploy with a raw key (CI only)", command: "forge create src/Counter.sol:Counter --rpc-url <RPC_URL> --private-key $PRIVATE_KEY --broadcast" },
      { title: "Scripted deploy (reproducible)", command: "forge script script/Deploy.s.sol --rpc-url <RPC_URL> --account myKey --broadcast", note: "Put deployment logic in a forge Script for multi-step/automated deploys." },
    ],
    warnings: ["Newer Foundry requires the --broadcast flag to actually send the tx (otherwise it's a dry run).", "Fund the deployer with the chain's native gas token first (ETH/POL/CRO/BNB/AVAX/APE)."],
    references: ["https://book.getfoundry.sh/forge/deploying"],
  },

  deploy_contract_solana: {
    topic: "deploy_contract_solana",
    title: "Deploy a Solana program (Anchor)",
    summary: "Build and deploy an Anchor program to devnet or mainnet-beta.",
    scope: ["solana"],
    prerequisites: ["setup_dev_env", "create_wallet", "SOL for rent + deploy fees (mainnet ~a few SOL for larger programs)"],
    steps: [
      { title: "Scaffold", command: "anchor init my_program && cd my_program" },
      { title: "Set cluster + wallet", command: "solana config set --url mainnet-beta --keypair ~/.config/solana/id.json", note: "Use --url devnet to test for free first." },
      { title: "Build", command: "anchor build", note: "Outputs the program .so and the program keypair under target/deploy/." },
      { title: "Sync the program id", command: "anchor keys sync", note: "Updates declare_id! and Anchor.toml to match the deploy keypair." },
      { title: "Deploy", command: "anchor deploy --provider.cluster mainnet", note: "Deploy fees scale with program size; ensure the wallet holds enough SOL." },
    ],
    warnings: ["Test on devnet (free SOL via faucet) before mainnet.", "Program deploys cost rent-exempt SOL proportional to byte size — large programs can cost several SOL."],
    references: ["https://www.anchor-lang.com/docs/installation", "https://solana.com/docs/programs/deploying"],
  },

  deploy_erc20: {
    topic: "deploy_erc20",
    title: "Deploy an ERC-20 token (OpenZeppelin + Foundry)",
    summary: "Create and deploy a standard, audited ERC-20 token on any EVM chain.",
    scope: ["evm"],
    prerequisites: ["deploy_contract_evm"],
    steps: [
      { title: "Add OpenZeppelin", command: "forge install OpenZeppelin/openzeppelin-contracts" },
      { title: "Write the token (src/MyToken.sol)", command: '// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.20;\\nimport "openzeppelin-contracts/token/ERC20/ERC20.sol";\\ncontract MyToken is ERC20 {\\n  constructor() ERC20("MyToken","MTK") { _mint(msg.sender, 1_000_000 ether); }\\n}' },
      { title: "Deploy", command: "forge create src/MyToken.sol:MyToken --rpc-url <RPC_URL> --account myKey --broadcast" },
    ],
    warnings: ["Use audited OpenZeppelin bases — do not hand-roll ERC-20 transfer/allowance logic."],
    references: ["https://docs.openzeppelin.com/contracts/5.x/erc20"],
  },

  verify_contract: {
    topic: "verify_contract",
    title: "Verify a contract on the block explorer (Etherscan V2)",
    summary: "Publish source so the contract is readable on Etherscan/Basescan/Arbiscan/etc. — one unified Etherscan V2 key covers all chains.",
    scope: ["evm"],
    prerequisites: ["deploy_contract_evm", "A free Etherscan API key (etherscan.io/myapikey)"],
    steps: [
      { title: "Verify by chain id", command: "forge verify-contract <ADDRESS> src/Counter.sol:Counter --chain <CHAIN_ID> --etherscan-api-key $ETHERSCAN_API_KEY --watch", note: "Etherscan V2 is multichain: one key, pass --chain (1=Ethereum, 8453=Base, 42161=Arbitrum, 10=Optimism, 137=Polygon, 56=BSC, 43114=Avalanche, 25=Cronos)." },
      { title: "With constructor args", command: "forge verify-contract <ADDRESS> src/MyToken.sol:MyToken --chain 8453 --constructor-args $(cast abi-encode 'constructor(string,string)' 'MyToken' 'MTK') --etherscan-api-key $ETHERSCAN_API_KEY" },
    ],
    references: ["https://book.getfoundry.sh/forge/deploying#verifying", "https://docs.etherscan.io/etherscan-v2"],
  },

  get_testnet_funds: {
    topic: "get_testnet_funds",
    title: "Get testnet funds (faucets)",
    summary: "Fund a wallet on testnets/devnet for free before spending real money.",
    scope: ["all"],
    prerequisites: ["create_wallet"],
    steps: [
      { title: "Solana devnet", command: "solana airdrop 2 <ADDRESS> --url devnet", note: "Up to ~2 SOL per request; rate-limited." },
      { title: "Ethereum Sepolia", note: "Use a faucet such as sepoliafaucet.com or the Alchemy/QuickNode faucets (often require a mainnet balance to deter abuse)." },
      { title: "Base Sepolia", note: "Coinbase Developer Platform faucet, or bridge Sepolia ETH via the Base bridge." },
      { title: "Check balance (EVM)", command: "cast balance <ADDRESS> --rpc-url <TESTNET_RPC>" },
    ],
    references: ["https://docs.anza.xyz/cli/examples/test-validator"],
  },

  register_onchain_tool: {
    topic: "register_onchain_tool",
    title: "Register an agent tool on-chain (ERC-8257 / OpenSea)",
    summary: "List your agent tool in the canonical ERC-8257 ToolRegistry so it appears on OpenSea's agent-tools surface, optionally NFT-gated. Follows the indexer's REAL acceptance rules (origin binding, name-slug path, listing limits) — most of which `tool-sdk validate` does NOT check.",
    scope: ["evm"],
    prerequisites: ["A public HTTPS host serving BOTH the manifest and the tool endpoint on the exact same origin", "Node 20+", "A funded creator wallet (gas)"],
    steps: [
      { title: "Derive the canonical manifest path from your tool name (origin binding)", command: '// slug = name.toLowerCase().replace(/\\s+/g, "-").replace(/[^a-z0-9-]/g, "")\n// manifest MUST live at: https://<endpoint-origin>/.well-known/ai-tool/<slug>.json', note: "This binding is enforced at registration. Pick a short ASCII name (e.g. 'My Tool' → my-tool.json); special characters make the slug ambiguous. The endpoint in the manifest MUST be on the exact same origin (RFC 6454: same scheme+host+port — subdomains do NOT count). Serve the manifest as a real static file; the indexer does NOT follow redirects, so avoid rewrites/redirects in the path." },
      { title: "Write the manifest within the indexer's listing limits", note: "Required: type='https://ercs.ethereum.org/ERCS/erc-8257#tool-manifest-v1', name (1-128 chars), description (1-500 chars), endpoint (https, same origin), inputs/outputs (JSON Schema), creatorAddress (LOWERCASE, must equal the registering wallet). Limits validate does NOT check but the indexer enforces: MAX 16 tags (lowercase alphanumeric+hyphens, 1-32 chars; recommended category tags: ai, defi, nft, trading, image, security); image = square 1:1; featuredImage MUST be 16:9 (omit it if you only have a square icon — it is only needed for the Featured section). NO un-namespaced extension fields — anything beyond the spec fields must use a reverse-DNS prefix (e.g. io.yourname.docs), or first-time ingestion rejects the manifest." },
      { title: "Validate + compute the authoritative hash", command: "curl -s https://<origin>/.well-known/ai-tool/<slug>.json -o /tmp/m.json\nnpx -y @opensea/tool-sdk@latest validate /tmp/m.json   # must be valid AND warning-free\nnpx -y @opensea/tool-sdk@latest hash /tmp/m.json       # use THIS hash on-chain", note: "Always pin @latest — a cached old SDK computes a DIFFERENT hash than OpenSea verifies with. Never keccak raw bytes and never use the generic npm `canonicalize` package (different key order → wrong hash → OpenSea treats the tool as stale forever)." },
      { title: "Register on the canonical ToolRegistry", command: "// ToolRegistry 0x265BB2DBFC0A8165C9A1941Eb1372F349baD2cf1 (same address on Ethereum + Base)\n// registerTool(string metadataURI, bytes32 manifestHash, address accessPredicate) returns (uint256 toolId)\n// accessPredicate = address(0) for open access", note: "Read the new toolId from the ToolRegistered event. Gas ~0.00006 ETH on mainnet at low gwei." },
      { title: "Optional NFT gate", command: "// On the ERC721OwnerPredicate 0xc8721c9A776958FfFfEb602DA1b708bf1D318379:\n// setCollections(uint256 toolId, address[] collections)   <-- NOT 'configure'\n// pass [<your NFT contract>]", note: "Configuring the gate 1-2 blocks AFTER registerTool is fine (listed tools do the same). CRITICAL: the gate only works on the chain where the NFT lives — a Base predicate can't reference a mainnet collection." },
      { title: "Cross-check exactly like OpenSea does", command: "npx -y @opensea/tool-sdk@latest inspect --tool-id <id> --network mainnet", note: "Checks on-chain config, manifest validity, hash match and endpoint reachability in one shot. NOTE: inspect does NOT check the listing limits (tag count, featuredImage ratio) — recheck those by hand against docs.opensea.io/docs/tool-manifest." },
      { title: "Wait for ingestion, then verify", note: "Tool appears at https://opensea.io/tools/erc8257/<chain>/<toolId> — fresh, rule-conform registrations have been observed to index within ~40 minutes; there is also a daily metadata refresh job. The page shows 'Tool not found' until ingested." },
      { title: "Update the manifest later", command: "// updateToolMetadata(uint256 toolId, string newURI, bytes32 newHash) on the registry", note: "Always recompute the hash with @opensea/tool-sdk@latest and sync on-chain, or OpenSea won't re-index the change. The update path is more tolerant than first-time ingestion — but a hash mismatch still freezes re-indexing." },
    ],
    warnings: [
      "Origin mismatch between manifest and endpoint ⇒ the tool is rejected and MARKED AS DEREGISTERED by the indexer (per official docs) — a later fix requires a fresh registerTool, updateToolMetadata won't resurrect it.",
      "First-time ingestion validates HARD (slug path, origin, no un-namespaced fields, listing limits). `tool-sdk validate`, `verify` and `inspect` all pass manifests the indexer still refuses — the docs pages are the real spec.",
      "The gate predicate function is setCollections, not configure (configure does not exist on the canonical predicate).",
      "NFT-gating only works on the chain where the NFT contract is deployed.",
      "Registrations can be removed via deregisterTool(toolId) (creator only).",
    ],
    references: [
      "https://docs.opensea.io/docs/tool-manifest",
      "https://docs.opensea.io/docs/agent-tool-registry",
      "https://eips.ethereum.org/EIPS/eip-8257",
      "https://github.com/ProjectOpenSea/tool-registry",
    ],
  },

  opensea_tool_logo: {
    topic: "opensea_tool_logo",
    title: "Make your ERC-8257 tool logo render on OpenSea (image + cache pitfalls)",
    summary:
      "Get the tool image to actually show on opensea.io/tools: the two manifest image fields, the mandatory on-chain hash sync, and the CloudFront image-cache trap that no manifest change can fix.",
    scope: ["evm"],
    prerequisites: ["register_onchain_tool"],
    steps: [
      { title: "Add both image fields to the manifest", note: "Top-level `image` = the square logo/icon (~1000x1000 PNG or JPG). `featuredImage` = a ~16:9 banner (e.g. 1536x864). Both must be absolute HTTPS URLs. OpenSea indexes exactly these two fields — it does NOT scrape <meta>/OpenGraph tags off your page." },
      { title: "Serve valid, fully-decodable images BEFORE syncing the hash", command: "curl -sfI https://<host>/logo.png   # expect: 200 + content-type: image/png", note: "A corrupt/partial PNG or a 404 at fetch time gets cached as an ERROR by OpenSea's image proxy (see warnings). Decode the file end-to-end locally first (e.g. Pillow im.load()), not just the magic bytes." },
      { title: "Recompute the hash and sync it on-chain", command: "npx @opensea/tool-sdk hash /tmp/m.json   # then: updateToolMetadata(toolId, manifestUri, thisHash)", note: "This on-chain 'hash update event' is what makes OpenSea RE-INDEX the manifest — text, tags, access AND images. If the on-chain hash doesn't match the served manifest's tool-sdk hash, OpenSea treats it as stale and ignores every change." },
      { title: "Confirm the metadata re-indexed", note: "The tool page (opensea.io/tools/erc8257/<chain>/<toolId>) then shows 'Onchain hash verified' + 'Updated Xm ago' plus your new text/tags. That proves the hash sync worked and metadata was picked up (usually within minutes)." },
      { title: "If text is correct but the logo is still blank — inspect the image proxy", command: "// the logo <img> src on the tool page is https://i2c.seadn.io/tool-images/<id>/<id>.png\n// fetch(src) and read .status + the cache-control header", note: "200 + valid PNG = it will render. HTTP 422 with 'x-cache: Error from cloudfront' = the proxy cached a fetch error; see warnings for the ONLY fixes." },
    ],
    warnings: [
      "OpenSea's tool-image CDN id (i2c.seadn.io/tool-images/<id>/<id>.png) is STABLE and tool-bound. It does NOT change when you change the manifest image URL (a 'cache-bust' of the source URL does nothing) nor when you update the on-chain hash.",
      "If OpenSea's proxy ever fetched a broken source image (corrupt/partial/404), CloudFront caches that error as HTTP 422 with cache-control max-age=31536000 (ONE YEAR). After that, fixing the source and changing the URL will NOT force a re-fetch.",
      "There is NO public 'refresh metadata' button for tools (only NFT items have one). Recovery = wait for OpenSea's autonomous daily broken-metadata refresh (up to ~1 day), OR ask an OpenSea dev to purge the cached tool image for your toolId.",
      "Metadata (text/tags/hash) is picked up fast via the on-chain event; the image runs through a separate async pipeline and can lag well behind the text — don't assume the logo failed just because the text updated first.",
    ],
    references: [
      "https://docs.opensea.io/docs/tool-manifest",
      "https://github.com/ProjectOpenSea/tool-sdk/tree/main/examples/token-nft-overlap-tool/public",
    ],
  },

  eip7702_smart_eoas: {
    topic: "eip7702_smart_eoas",
    title: "EIP-7702: give a normal EOA smart-account powers (Pectra)",
    summary: "The post-Pectra upgrade that lets a regular wallet temporarily act as a smart account — batching, sponsorship, session keys — and the security cliff it introduces.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "What it does", note: "A new tx type (0x04, SetCode) lets an EOA set its code to POINT AT a smart-contract implementation via a signed authorization. The EOA keeps its address but executes like that contract — batching, gas sponsorship and session keys without deploying a new wallet or migrating funds." },
      { title: "The authorization", note: "The account signs an authorization tuple (chainId, implementation address, nonce). chainId 0 = valid on all chains (dangerous — see warnings). A relayer/bundler can then submit txs that run the delegated code." },
      { title: "Delegation is persistent until changed", note: "Unlike a one-shot meta-tx, the delegation STAYS set until the EOA signs a new authorization (including to address(0) to clear it). Your EOA now has code — dapps checking `extcodesize == 0` for 'is EOA' will misjudge it." },
      { title: "Use a vetted implementation", note: "Point ONLY at an audited delegate (e.g. from a wallet vendor). The implementation has full control of the account when invoked — a malicious one drains everything." },
      { title: "Tooling", note: "viem supports 7702 (walletClient.signAuthorization + sendTransaction with authorizationList). Combine with ERC-4337 stacks for full AA UX." },
    ],
    warnings: [
      "Signing a chainId-0 authorization to a malicious contract is a full account takeover across ALL chains — treat 7702 auth signatures like handing over your keys.",
      "Live since the Pectra upgrade; support varies by chain and RPC — verify the target chain enables type-0x04 before relying on it.",
    ],
    references: ["https://eips.ethereum.org/EIPS/eip-7702"],
  },

  solana_pay: {
    topic: "solana_pay",
    title: "Solana Pay: request payments via URL / QR (transaction requests)",
    summary: "The two Solana Pay flows — simple transfer requests and interactive transaction requests — for agent checkout and machine payments on Solana.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Transfer request (static)", command: "solana:<recipient>?amount=0.1&spl-token=<mint>&reference=<pubkey>&label=Store&message=Order%23123", note: "Encode as a URL/QR; the wallet builds a plain transfer. `reference` (a unique pubkey) lets you find the tx later via getSignaturesForAddress without a callback." },
      { title: "Transaction request (interactive)", note: "A URL pointing to YOUR https endpoint: GET returns {label, icon}; POST {account} returns a base64 serialized transaction for the wallet to sign. This is how you charge for arbitrary program interactions, not just transfers." },
      { title: "Detect payment settled", command: "poll getSignaturesForAddress(reference) → then validate the tx transfers the expected amount to the expected recipient", note: "Match amount + recipient + reference before fulfilling — never trust the client's 'paid' claim." },
      { title: "Agent-to-agent alternative", note: "For pure machine payments prefer x402 (HTTP-native, see x402_payments); Solana Pay shines for wallet/QR human-in-the-loop or on-chain-native checkout." },
    ],
    references: ["https://docs.solanapay.com"],
  },

  eip712_signing: {
    topic: "eip712_signing",
    title: "Sign and verify EIP-712 typed data",
    summary: "Structured signatures (permits, orders, SIWE-adjacent auth) with viem — the domain/types/message pattern and the classic pitfalls.",
    scope: ["evm"],
    prerequisites: ["viem", "A signer (local account or wallet)"],
    steps: [
      { title: "Define domain + types + message", command: "const domain = { name: 'MyApp', version: '1', chainId: 1, verifyingContract: '0x…' };\nconst types = { Order: [ { name: 'maker', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'deadline', type: 'uint256' } ] };\nconst message = { maker, amount, deadline };", note: "chainId and verifyingContract MUST match what the contract hashes on-chain, or recovery silently yields a different signer." },
      { title: "Sign", command: "const signature = await account.signTypedData({ domain, types, primaryType: 'Order', message });" },
      { title: "Verify off-chain", command: "await verifyTypedData({ address: expectedSigner, domain, types, primaryType: 'Order', message, signature })" },
      { title: "Verify for smart-contract wallets", note: "EOAs recover via ecrecover; smart wallets (Safe, 4337 accounts) need EIP-1271: call isValidSignature(hash, sig) on the wallet — viem's verifyTypedData/verifyMessage handles 1271 automatically when given a client." },
    ],
    warnings: [
      "uint256 values must be bigint, not number/string — silent type coercion changes the hash.",
      "Field ORDER inside each type matters; it is part of the type hash.",
    ],
    references: ["https://eips.ethereum.org/EIPS/eip-712"],
  },

  erc20_patterns: {
    topic: "erc20_patterns",
    title: "ERC-20 interactions: allowance, approve, permit, transferFrom (unsigned tx)",
    summary: "The standard token flows as ready-to-encode calldata, including EIP-2612 permit and the USDT approve quirk.",
    scope: ["evm"],
    prerequisites: ["viem"],
    steps: [
      { title: "Check allowance before anything", command: "call tool \"portfolio\" { action: 'allowance', chain, token, owner, spender }", note: "Or raw: allowance(address,address) selector 0xdd62ed3e." },
      { title: "Build an approve tx", command: "encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender, amount] })  // → { to: token, data }", note: "Prefer exact amounts over infinite approvals; an exploited spender drains whatever it is approved for." },
      { title: "Gasless approval via EIP-2612 permit (if the token supports it)", command: "signTypedData Permit { owner, spender, value, nonce: await token.nonces(owner), deadline } → contract call permit(owner, spender, value, deadline, v, r, s)", note: "Not universal: USDC supports permit; many tokens don't. Probe nonces() existence first." },
      { title: "transferFrom after approval", command: "encodeFunctionData({ abi: erc20Abi, functionName: 'transferFrom', args: [from, to, amount] })" },
    ],
    warnings: [
      "USDT (mainnet) reverts when changing a non-zero allowance — approve(spender, 0) first, then the new amount.",
      "Some tokens return no boolean from transfer/approve; use viem's erc20Abi which tolerates it, and treat missing return data as success only for known-legacy tokens.",
    ],
    references: ["https://eips.ethereum.org/EIPS/eip-2612"],
  },

  debug_failed_tx: {
    topic: "debug_failed_tx",
    title: "Debug a failing transaction (before or after sending)",
    summary: "Deterministic debug order that avoids burning gas on reverts: simulate → decode revert → check the usual suspects.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "ALWAYS simulate before signing", command: "call tool \"simulate\" { chain, tx: { from, to, data, value } }", note: "Runs eth_call with your exact params and decodes the revert reason (custom errors via 4byte fallback)." },
      { title: "Decode unknown calldata/selectors", command: "call tool \"abi\" { action: 'decode_calldata', chain, address, data }", note: "Works for unverified contracts via 4byte." },
      { title: "Walk the usual suspects", note: "allowance too low → erc20_patterns; nonce/fee errors, rent, blockhash → retrieve knowledge reference kind='errors' for the pattern→cause→fix table." },
      { title: "For already-mined failures", command: "eth_getTransactionReceipt → status 0x0; then re-run the SAME call via simulate at blockNumber: receipt.blockNumber - 1", note: "Simulating at the pre-inclusion block reproduces the original state and thus the original revert." },
    ],
    references: ["https://www.4byte.directory"],
  },

  fetch_event_logs: {
    topic: "fetch_event_logs",
    title: "Fetch contract event logs reliably on free RPCs",
    summary: "eth_getLogs the way it actually works on public endpoints: topic filters, block chunking, provider limits.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Build topic0 from the event signature", command: "toEventSelector('Transfer(address,address,uint256)')  // viem → 0xddf252ad…" },
      { title: "Always filter by address + topics", command: "eth_getLogs { address: contract, topics: [topic0, indexedArg1?], fromBlock, toBlock }", note: "Unfiltered getLogs is rejected or truncated almost everywhere." },
      { title: "Chunk the block range per provider", note: "drpc.org free: <=10,000 blocks. Many public RPCs: 500-2,000. publicnode: may require an archive token for getLogs entirely. Loop in chunks and merge.", command: "for (let from = start; from <= end; from += 9999n) { … toBlock: min(from+9998n, end) … }" },
      { title: "Or use the ready-made tool", command: "call tool \"whale_watch\" { chain, token, minAmount, blockWindow }", note: "Does the chunking/decoding for ERC-20 Transfers for you." },
    ],
    warnings: ["Indexed string/bytes topics are keccak hashes of the value, not the value itself."],
  },

  x402_payments: {
    topic: "x402_payments",
    title: "x402 machine payments — pay for APIs and charge for yours (keyless)",
    summary: "The HTTP 402 flow agents use to buy API access with USDC on Base, and how to charge for your own endpoint without any account/KYB via the xpay facilitator.",
    scope: ["evm"],
    prerequisites: ["A funded Base wallet (USDC) for paying; a treasury address for receiving"],
    steps: [
      { title: "As the CLIENT: read the 402", note: "An unpaid request returns HTTP 402 with JSON { x402Version, accepts: [{ scheme: 'exact', network, asset, maxAmountRequired, payTo, … }] }." },
      { title: "Pay + retry with one wrapper", command: "import { wrapFetchWithPayment } from '@x402/fetch';\nconst fetchWithPay = wrapFetchWithPayment(fetch, walletClient);\nawait fetchWithPay(url, opts);", note: "The wrapper signs the payment payload and retries with the X-PAYMENT header automatically." },
      { title: "As the SERVER: answer 402 with requirements", note: "Return the accepts[] body for unpaid gated requests (see this server's /mcp: every tools/call except catalog is gated)." },
      { title: "Verify AND settle via the keyless facilitator", command: "POST https://facilitator.xpay.sh/verify  { x402Version: 1, paymentPayload, paymentRequirements }\nPOST https://facilitator.xpay.sh/settle  (same body)", note: "verify alone moves NO money — you must settle. xpay needs no account, no KYB, payTo is just your address." },
    ],
    warnings: ["Asset addresses in requirements are chain-specific: USDC on Base = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (6 decimals — $0.10 = '100000')."],
    references: ["https://www.x402.org", "https://facilitator.xpay.sh", "https://blog.cloudflare.com/monetization-gateway/ (edge-enforced x402 for sites behind Cloudflare, waitlist since 2026-07)"],
  },

  multicall_batching: {
    topic: "multicall_batching",
    title: "Batch reads with Multicall3 (one RPC call instead of fifty)",
    summary: "The portable way to bulk-read on EVM chains — cheaper, faster, and immune to per-endpoint batch limits.",
    scope: ["evm"],
    prerequisites: ["viem"],
    steps: [
      { title: "With viem (automatic)", command: "await client.multicall({ contracts: [ { address, abi, functionName: 'balanceOf', args: [user] }, … ] })", note: "viem routes through Multicall3 at 0xcA11bde05977b3631167028862bE2a173976CA11 (same address on 250+ chains) and falls back per-call if unsupported." },
      { title: "Raw (any language)", command: "Multicall3.aggregate3([{ target, allowFailure: true, callData }]) via ONE eth_call", note: "allowFailure:true returns per-call success flags instead of reverting the whole batch." },
    ],
    warnings: ["JSON-RPC array batching is NOT the same thing and is capped/disabled on many public endpoints — Multicall3 is the portable option."],
  },

  siwe_auth: {
    topic: "siwe_auth",
    title: "Wallet-based auth: SIWE and lightweight signature gates",
    summary: "Prove wallet ownership to a server: full EIP-4361 Sign-In with Ethereum, or the minimal dated-message pattern used by this server's NFT gate.",
    scope: ["evm"],
    prerequisites: ["viem"],
    steps: [
      { title: "Minimal stateless gate (what this server uses)", command: "message = `crypto-knowledge-auth ${wallet.toLowerCase()} ${new Date().toISOString().slice(0,10)}`\nsignature = await account.signMessage({ message })\n// send headers: X-Wallet + X-Wallet-Signature", note: "Server side: verifyMessage({ address, message, signature }) + an on-chain check (e.g. balanceOf) — no session state, replayable only within the date window." },
      { title: "Full SIWE (EIP-4361) for real sessions", note: "Use the standard message format (domain, address, uri, version, chainId, nonce, issuedAt) with a server-issued nonce to prevent replay; libraries: siwe (npm) or viem's siwe utilities." },
      { title: "Verify supporting smart wallets too", command: "publicClient.verifyMessage({ address, message, signature })", note: "Falls back to EIP-1271 isValidSignature for contract wallets automatically." },
    ],
    references: ["https://eips.ethereum.org/EIPS/eip-4361"],
  },

  opensea_api: {
    topic: "opensea_api",
    title: "Use the OpenSea API + MCP server (NFT data, prices, agent-tool discovery)",
    summary: "Query NFT/collection data, floor prices, swaps and the ERC-8257 agent-tool registry — with a free API key issued WITHOUT signup.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Get a free API key (no account needed)", command: "curl -X POST https://api.opensea.io/api/v2/auth/keys", note: "Free tier: ~60 reads/min, 5 writes/min. Send it as x-api-key header on every request." },
      { title: "REST: collection data + floor price", command: "curl -s https://api.opensea.io/api/v2/collections/{slug} -H 'x-api-key: KEY'", note: "Other groups: /chain/{chain}/account/{address}/nfts, listings/offers (Seaport), events (sales/transfers), swap quotes." },
      { title: "MCP: connect an agent directly", command: "https://mcp.opensea.io/mcp  (Streamable HTTP; auth X-API-KEY or Bearer)", note: "Tools include token prices/swaps, collection research, wallet portfolios, trending assets, drops and SEARCHING the ERC-8257 agent-tool registry. Remember: Accept: application/json, text/event-stream." },
      { title: "Discover other agent tools on-chain", note: "The ERC-8257 ToolRegistry (see reference kind='addresses') is the source of truth; OpenSea surfaces it at opensea.io/tools. To publish YOUR tool there, follow the register_onchain_tool guide." },
    ],
    references: ["https://docs.opensea.io/reference/api-overview", "https://docs.opensea.io/reference/mcp"],
  },

  nft_metadata_standards: {
    topic: "nft_metadata_standards",
    title: "NFT metadata that marketplaces actually render (fields, traits, refresh)",
    summary: "The exact metadata JSON format OpenSea & co. parse — required fields, the attributes/display_type system, storage URI schemes and how to force a re-index.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Core JSON fields", command: '{ "name": "…", "description": "…", "image": "ipfs://… or https://…", "external_url": "…", "background_color": "RRGGBB (no #)", "animation_url": "…" }', note: "image: ≥3000×3000px recommended. animation_url supports GLTF/GLB/WEBM/MP4/OGG/MP3/WAV and even HTML pages (interactive NFTs)." },
      { title: "Traits: the attributes array", command: '"attributes": [ { "trait_type": "Speed", "value": 92, "display_type": "number", "max_value": 100 }, { "trait_type": "Background", "value": "Wild" }, { "trait_type": "Birthday", "value": 1735689600, "display_type": "date" } ]', note: "display_type variants: number, boost_number, boost_percentage, date (unix seconds). No display_type = plain text trait; marketplaces auto-compute rarity per trait_type/value pair." },
      { title: "Storage URI schemes", note: "ipfs://<CID> (see ipfs_for_nfts), ar://<hash> (Arweave), data:application/json;base64,… (fully on-chain), web3:// (ERC-4804). tokenURI must return one of these; gateways are the marketplace's job." },
      { title: "Collection-level metadata", note: "Implement contractURI() returning a JSON with collection name/description/image — that's what fills the collection page header." },
      { title: "Force a metadata refresh", note: "Emit ERC-4906 events (MetadataUpdate(tokenId) / BatchMetadataUpdate) — indexers listen for them. ERC-1155: the URI event. Manual fallback: OpenSea API /refresh_nft_metadata per token." },
    ],
    warnings: ["Metadata JSON is parsed strictly — a trailing comma or numeric value quoted as string in a number-typed trait breaks trait indexing silently."],
    references: ["https://docs.opensea.io/docs/metadata-standards"],
  },

  permit2_usage: {
    topic: "permit2_usage",
    title: "Permit2: signature-based token transfers for ANY ERC-20",
    summary: "Give every token EIP-2612-style UX: one on-chain approval to Permit2, then off-chain signatures authorize transfers — the pattern Uniswap and most modern routers use.",
    scope: ["evm"],
    prerequisites: ["viem"],
    steps: [
      { title: "One-time setup per token", command: "approve(PERMIT2, MaxUint256) on the token", note: "Permit2 = 0x000000000022D473030F116dDEE9F6B43aC78BA3 (same on all major chains, reference kind='addresses'). After this, no more per-spender on-chain approvals for that token." },
      { title: "SignatureTransfer (one-shot payments)", note: "Sign a PermitTransferFrom EIP-712 message {permitted:{token,amount}, spender, nonce, deadline}; the spender submits permitTransferFrom(...) — perfect for agent checkout flows. Nonces are unordered bitmaps: pick random nonces, no sequencing needed." },
      { title: "AllowanceTransfer (session allowances)", note: "Sign a PermitSingle granting spender an allowance with EXPIRATION — time-boxed approvals instead of infinite ones. Query current state via allowance(owner, token, spender) → (amount, expiration, nonce)." },
      { title: "Build the typed data with the SDK", command: "npm i @uniswap/permit2-sdk  → SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, chainId)", note: "Then walletClient.signTypedData(...) — hand-building the EIP-712 structs is error-prone (see eip712_signing)." },
    ],
    warnings: ["Your Permit2 signature is as powerful as an approval — sign only spenders you trust, with tight amounts/deadlines. Phishing sites harvest Permit2 signatures precisely because no on-chain action is visible until redemption."],
    references: ["https://github.com/Uniswap/permit2"],
  },

  solana_subscriptions: {
    topic: "solana_subscriptions",
    title: "Real-time Solana: WebSocket subscriptions (logs, accounts, program events)",
    summary: "Push instead of poll: subscribe to program logs and account changes over the RPC WebSocket — the pattern behind live token-launch and trade monitors.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Connect the WS endpoint", note: "wss://api.mainnet-beta.solana.com (same host as HTTP RPC; provider endpoints have their own wss URLs — public WS is aggressively rate-limited, use a free Helius key for anything serious)." },
      { title: "Watch a program's activity", command: "connection.onLogs(new PublicKey(PROGRAM_ID), ({logs, signature}) => …, 'confirmed')", note: "This is how new pump.fun launches are detected live: subscribe to the pump.fun program (reference kind='addresses') and parse its Anchor events from the logs (see anchor_program_interaction)." },
      { title: "Watch balances/accounts", command: "connection.onAccountChange(pubkey, cb)  // token accounts, curve state PDAs …", note: "Fires on every write to the account — decode with the owning program's layout." },
      { title: "Build in reconnect + backfill", note: "WS connections drop silently. On reconnect, backfill the gap via getSignaturesForAddress since your last seen signature — otherwise you miss events and double-process others (dedupe by signature)." },
      { title: "Unsubscribe or leak", command: "const id = connection.onLogs(…); await connection.removeOnLogsListener(id)", note: "Serverless runtimes + WS don't mix — run subscribers on a long-lived process (VPS/worker), not inside request handlers." },
    ],
  },

  price_oracle_safety: {
    topic: "price_oracle_safety",
    title: "Price oracle safety: why spot prices get you drained (TWAP, Chainlink, sanity bands)",
    summary: "The oracle-manipulation playbook from the defender's side — what a price source must survive before agent logic or a contract trusts it.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Never trust a single pool's spot price", note: "AMM spot (reserve ratio) is flash-loan-movable within one tx — the classic drain: attacker skews the pool, your logic prices against it, attacker profits. This applies to AGENT decisions too, not just contracts." },
      { title: "Prefer manipulation-resistant sources", note: "Chainlink feeds (aggregated off-chain, see chainlink_price_feeds guide) or Uniswap v3 TWAP (observe() over 10-30 min windows — attacker must hold the skew across many blocks, which costs real money)." },
      { title: "Cross-check two independent sources", command: "chainlink latestRoundData  vs  GET https://coins.llama.fi/prices/current/{chain}:{token}", note: "Diverging >1-2% ⇒ halt the trade path and investigate; one of them is stale or being gamed." },
      { title: "Apply sanity bands in agent logic", note: "Reject quotes that imply price moves beyond a per-asset band (e.g. ±10% vs last known good) — this catches decimal bugs, depegs and manipulation in one check. The route/profitability tools of this server already price against aggregator quotes, not single pools." },
      { title: "Low-liquidity tokens have NO safe price", note: "If liquidity is thin (check the security tool's LP data / Jupiter Price liquidity field), any oracle is manipulable — size positions accordingly or skip." },
    ],
  },

  cctp_native_usdc: {
    topic: "cctp_native_usdc",
    title: "Bridge NATIVE USDC across chains with Circle CCTP (burn & mint)",
    summary: "The trust-minimized way to move real USDC (not a wrapped IOU) between chains — burn on source, attest, mint on destination.",
    scope: ["evm"],
    prerequisites: ["USDC on the source chain"],
    steps: [
      { title: "Why CCTP over a liquidity bridge", note: "CCTP BURNS your USDC on the source and MINTS canonical native USDC on the destination via Circle's attestation — no wrapped USDC.e, no liquidity-pool slippage, no third-party bridge risk. Ideal for treasury moves." },
      { title: "1) Burn on source", command: "TokenMessenger.depositForBurn(amount, destinationDomain, mintRecipient(bytes32), usdcAddress)", note: "TokenMessenger addresses per chain in reference kind='addresses' (live-verified). destinationDomain is Circle's domain id (Ethereum=0, Avalanche=1, OP=2, Arbitrum=3, Base=6, …), NOT the chainId. mintRecipient is the address left-padded to bytes32." },
      { title: "2) Get the attestation", command: "messageHash = keccak256(the MessageSent event's message bytes)\nGET https://iris-api.circle.com/v1/attestations/{messageHash}  (poll until status:'complete')", note: "Keyless (live-verified). Takes seconds to minutes after source finality." },
      { title: "3) Mint on destination", command: "MessageTransmitter.receiveMessage(message, attestation)", note: "Anyone can submit this (the recipient is baked into the burn) — a relayer can complete it for the user." },
      { title: "Or just use the router", command: "call tool \"route\"", note: "LiFi/deBridge may route via CCTP under the hood and hand you a ready tx; use raw CCTP when you specifically want native mint + full control." },
    ],
    warnings: ["destinationDomain ≠ chainId — using the chainId sends funds to the wrong domain. Double-check Circle's domain table."],
    references: ["https://developers.circle.com/stablecoins/docs/cctp-getting-started"],
  },

  uniswap_v4_basics: {
    topic: "uniswap_v4_basics",
    title: "Uniswap v4 architecture: singleton PoolManager, hooks, flash accounting",
    summary: "What changed in v4 and how an agent interacts with it — you don't call pools directly anymore.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "One singleton, not a contract per pair", note: "All v4 pools live inside ONE PoolManager (0x000000000004444c5dc75cB358380D2e3dE08A90, live-verified). Pools are identified by a PoolKey (currency0, currency1, fee, tickSpacing, hooks), not a deployed pair address." },
      { title: "You interact through periphery, not PoolManager", note: "Swaps go via the Universal Router / v4 position & swap routers. The PoolManager uses the 'lock' pattern (flash accounting): callbacks settle net balances at the end of a transaction — hand-calling it is expert-only." },
      { title: "Hooks = custom pool logic", note: "A pool can attach a hooks contract that runs before/after swap/modifyLiquidity (dynamic fees, TWAMM, limit orders, MEV capture). The hook address is part of the PoolKey — different hooks = different pool." },
      { title: "Getting quotes / swapping", command: "Use the Uniswap routing API / SDK, or this server's \"route\" tool (aggregates across versions and DEXes) — it abstracts v3 vs v4 vs other venues.", note: "Native ETH is a first-class currency in v4 (address 0), no WETH-wrapping needed for ETH pools." },
    ],
    warnings: ["A malicious or buggy hook can trap or skim funds — only trade pools whose hooks you trust; the hooks address is visible in the PoolKey."],
    references: ["https://docs.uniswap.org/contracts/v4/overview"],
  },

  crosschain_message_tracking: {
    topic: "crosschain_message_tracking",
    title: "Track cross-chain messages & bridge transfers (LayerZero, Wormhole)",
    summary: "How an agent confirms an omnichain action actually delivered on the destination — the keyless scan APIs and the 'source-confirmed ≠ delivered' trap.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "The two-sided reality", note: "A cross-chain tx has TWO confirmations: source (message sent) and destination (message delivered/executed). Your source receipt says nothing about delivery — poll the messaging-layer scan, not just the source chain." },
      { title: "LayerZero messages", command: "GET https://scan.layerzero-api.com/v1/messages?srcTxHash=0x… → status per message (INFLIGHT / DELIVERED / FAILED)", note: "Keyless (live-verified). GUID identifies the message across both chains." },
      { title: "Wormhole VAAs", command: "GET https://api.wormholescan.io/api/v1/vaas?limit=1 (or by tx) → the signed VAA + redemption status", note: "A VAA existing = guardians signed; it still must be REDEEMED on the destination to complete. Keyless (live-verified)." },
      { title: "Prefer a router for the actual move", command: "call tool \"route\" (LiFi + deBridge)", note: "It returns the ready-to-sign tx AND abstracts the delivery mechanism; use the scan APIs above to observe/debug an in-flight transfer." },
    ],
    warnings: ["Some bridges auto-redeem on the destination, others require a manual claim tx — check the specific bridge before assuming funds arrive by themselves."],
  },

  perps_funding_data: {
    topic: "perps_funding_data",
    title: "Read perp funding rates & derivatives data (keyless)",
    summary: "Where agents get funding rates for basis trades and sentiment — on-chain (Hyperliquid) and CEX (Binance/Bybit), all keyless.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "On-chain perps: Hyperliquid", command: 'POST https://api.hyperliquid.xyz/info {"type":"predictedFundings"} → per-asset current + predicted funding across venues', note: "Keyless (live-verified). {\"type\":\"metaAndAssetCtxs\"} gives mark prices, open interest, oracle prices." },
      { title: "CEX funding (keyless)", command: "GET https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1  (live-verified)\nGET https://api.bybit.com/v5/market/funding/history?category=linear&symbol=BTCUSDT", note: "fundingRate is per interval (usually 8h on CEXes, 1-8h on Hyperliquid — check fundingIntervalHours)." },
      { title: "Interpret the sign", note: "Positive funding = longs pay shorts (bullish crowding); negative = shorts pay longs. Extreme funding is a mean-reversion / squeeze signal, not a directional guarantee." },
      { title: "Basis-trade sanity", note: "Funding is annualized as rate × intervals/year. Compare against the cost of the hedge (spot borrow + gas) before calling it 'free yield'." },
    ],
  },

  dao_governance_data: {
    topic: "dao_governance_data",
    title: "Query DAO governance (proposals, votes) with Snapshot & Tally",
    summary: "How an agent reads what a DAO is voting on and how — off-chain (Snapshot, keyless) and on-chain (Tally).",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Snapshot: off-chain votes (keyless)", command: 'POST https://hub.snapshot.org/graphql {"query":"{ proposals(first:5, where:{space:\\"aave.eth\\", state:\\"active\\"}){ id title choices scores end } }"}', note: "Live-verified. Most large DAOs signal on Snapshot (gasless); scores = current vote weight per choice." },
      { title: "Find a space", command: '{"query":"{ spaces(first:5, where:{}){ id name followersCount } }"}', note: "space id is usually an ENS name (aave.eth, uniswapgovernance.eth)." },
      { title: "On-chain execution: Tally / Governor", note: "Binding votes run through OpenZeppelin Governor contracts (proposal → vote → queue → execute via Timelock). Tally (api.tally.xyz, free key) indexes these; or read the Governor contract directly with the abi tool." },
      { title: "Voting power", note: "Snapshot strategies compute power off-chain (token balance, delegation, quadratic …) — the 'scores' already reflect the space's strategy; don't re-derive from raw balances." },
    ],
  },

  deterministic_deploys_create2: {
    topic: "deterministic_deploys_create2",
    title: "Deploy a contract to the SAME address on every chain (CREATE2/CREATE3)",
    summary: "Deterministic deployments for multichain protocols and vanity contract addresses — the address formula, Foundry workflow, and the redeploy trap.",
    scope: ["evm"],
    prerequisites: ["Foundry"],
    steps: [
      { title: "The address formula", command: "address = keccak256(0xff ++ deployer ++ salt ++ keccak256(initCode))[12:]", note: "Depends ONLY on deployer contract, salt and creation bytecode — nonce-independent, so the same inputs give the same address on every chain." },
      { title: "Foundry does it for you", command: "// in a script: new MyContract{salt: bytes32(uint256(1))}(constructorArgs)\nforge script … --broadcast", note: "Foundry routes salted creations through the canonical Arachnid proxy 0x4e59b44847b379578588920cA78FbF26c0B4956C (live-verified, deployed on virtually every EVM chain). Deploy from the SAME proxy on each chain to keep addresses equal." },
      { title: "Vanity contract addresses", note: "Brute-force salts until the computed address matches your pattern (tools: cast create2 --starts-with 0xbeef --deployer … --init-code-hash …). Cheap for 4-6 hex chars, exponential beyond." },
      { title: "CREATE3 when initCode may change", note: "CreateX (0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed, live-verified) offers CREATE3: address depends only on deployer+salt, NOT the bytecode — deploy different versions to the same address across chains." },
      { title: "Constructor args are part of initCode", note: "Different constructor args ⇒ different address (CREATE2). If chains need different configs, move config to an initialize() call after deployment." },
    ],
    warnings: ["A CREATE2 address can be redeployed after selfdestruct with DIFFERENT code (metamorphic contracts) — treat 'same address' as identity proof only together with verified source."],
    references: ["https://github.com/pcaversaccio/createx", "https://book.getfoundry.sh"],
  },

  ens_resolution: {
    topic: "ens_resolution",
    title: "Resolve ENS names correctly (forward, reverse, offchain)",
    summary: "Name → address and back with the pitfalls that cause silent wrong-address bugs: normalization, reverse-record spoofing, offchain (CCIP-Read) names.",
    scope: ["evm"],
    prerequisites: ["viem"],
    steps: [
      { title: "Forward resolution", command: "await publicClient.getEnsAddress({ name: normalize('vitalik.eth') })  // → 0xd8dA6BF2…", note: "viem walks Registry → resolver → addr and handles CCIP-Read (offchain names like *.cb.id) automatically. ALWAYS pass the name through normalize() (ENSIP-15) — visually identical unicode names resolve differently." },
      { title: "Reverse resolution (address → name)", command: "await publicClient.getEnsName({ address })", note: "SECURITY: anyone can point their reverse record at any name. After reverse-resolving, forward-resolve the returned name and require it to match the original address (viem does NOT do this check for you in getEnsName on old versions — verify)." },
      { title: "Other records", command: "getEnsText({ name, key: 'com.twitter' }); getEnsAvatar({ name })", note: "Text records hold socials/URLs; avatar can be NFT-URIs (eip155:1/erc721:… format)." },
      { title: "Registry (for raw calls)", note: "ENS Registry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e (reference kind='addresses'); node = namehash(normalized name). Never hash unnormalized input." },
    ],
    warnings: ["ENS names EXPIRE — a resolved address can change owners after expiry+re-registration; don't cache name→address mappings long-term for payments."],
    references: ["https://docs.ens.domains"],
  },

  safe_multisig: {
    topic: "safe_multisig",
    title: "Interact with a Safe (Gnosis Safe) multisig: propose, sign, execute",
    summary: "How an agent reads a Safe's config and participates in its M-of-N transaction flow — the standard for treasuries and shared control.",
    scope: ["evm"],
    prerequisites: ["An owner key (to sign) or read-only for inspection"],
    steps: [
      { title: "Read the Safe's config", command: "GET https://safe-transaction-mainnet.safe.global/api/v1/safes/{safe-address}/ → owners[], threshold, nonce", note: "Keyless (live-verified, follow redirects). threshold = how many owner signatures a tx needs (the M in M-of-N)." },
      { title: "The transaction model", note: "A SafeTx (to, value, data, operation, nonce, …) is hashed (EIP-712) and each owner signs off-chain. Once `threshold` signatures collect, ANYONE can submit execTransaction() with the packed signatures." },
      { title: "Propose + collect signatures", command: "Use the Safe{Core} SDK (@safe-global/protocol-kit + api-kit): protocolKit.createTransaction(...), signHash, apiKit.proposeTransaction(...)", note: "The Transaction Service stores pending txs + confirmations so owners sign asynchronously; it does NOT hold keys." },
      { title: "Execute", command: "protocolKit.executeTransaction(safeTx) once confirmations >= threshold", note: "Gas is paid by the executor (any owner or a relayer). The Safe's nonce is sequential — a proposed tx blocks later nonces until executed or rejected." },
      { title: "Batch calls", note: "Safes execute one tx, but via a MultiSend call you batch many actions atomically — the SDK builds this. Great for approve+swap in one owner approval." },
    ],
    warnings: ["Signature ORDER matters in execTransaction (owners sorted ascending by address) — the SDK handles it; hand-packing wrong order reverts."],
    references: ["https://docs.safe.global"],
  },

  account_abstraction_4337: {
    topic: "account_abstraction_4337",
    title: "ERC-4337 account abstraction: UserOperations, bundlers, paymasters",
    summary: "How smart-account transactions work — the UserOperation flow, bundler RPC methods, gas sponsoring — and what an agent needs to integrate them.",
    scope: ["evm"],
    prerequisites: ["A bundler endpoint (Pimlico/Alchemy — free keys)"],
    steps: [
      { title: "The model", note: "Smart accounts don't send txs — they sign UserOperations, a bundler wraps them into EntryPoint.handleOps(). EntryPoint v0.7: 0x0000000071727De22E5E9d8BAf0edAc6f37da032 (reference kind='addresses'; v0.6 legacy still common — accounts are pinned to ONE version)." },
      { title: "Bundler RPC methods", command: "eth_sendUserOperation(userOp, entryPoint)\neth_estimateUserOperationGas(userOp, entryPoint)\neth_getUserOperationReceipt(userOpHash)", note: "Same JSON-RPC shape as Ethereum but served by the bundler, not a normal node. Track inclusion by userOpHash, NOT tx hash (many userOps share one tx)." },
      { title: "Gas sponsoring via paymaster", note: "A paymaster field in the userOp lets a third party pay gas (or accept ERC-20 for it) — this is how 'gasless' dApp UX works. Sponsorship policies are configured on the provider (Pimlico/Alchemy dashboards)." },
      { title: "Use an SDK, not raw structs", command: "permissionless.js (viem-native) or the provider SDKs", note: "UserOp signing digests, nonces (2D nonce keys!), initCode for counterfactual deployment and paymaster data are easy to get subtly wrong by hand." },
      { title: "Signature validation differs", note: "Smart accounts verify via EIP-1271 isValidSignature — relevant when such an account logs into YOUR service (see siwe_auth/eip712_signing guides)." },
    ],
    references: ["https://eips.ethereum.org/EIPS/eip-4337", "https://docs.pimlico.io"],
  },

  anchor_program_interaction: {
    topic: "anchor_program_interaction",
    title: "Interact with any Anchor program on Solana (IDL fetch, discriminators, events)",
    summary: "How to talk to Solana programs you didn't write: pull the on-chain IDL, build instructions with the right discriminator, and decode events/errors.",
    scope: ["solana"],
    prerequisites: ["Anchor CLI or @coral-xyz/anchor (npm)"],
    steps: [
      { title: "Fetch the on-chain IDL", command: "anchor idl fetch <PROGRAM_ID> --provider.cluster mainnet\n# or in JS: await Program.fetchIdl(programId, provider)", note: "Most serious Anchor programs publish their IDL on-chain (an IDL PDA owned by the program). No IDL on-chain → check the project's GitHub; without any IDL you're reverse-engineering." },
      { title: "Instruction discriminators", note: "Anchor instructions start with an 8-byte discriminator = sha256('global:<instruction_name>')[0..8]. The IDL lists names + argument layouts (borsh-serialized in order). Account METAS order in the IDL is mandatory — wrong order = cryptic custom errors." },
      { title: "Build + call via the anchor client", command: "const program = new Program(idl, provider);\nawait program.methods.myInstruction(args).accounts({...}).rpc();", note: "The client derives discriminators, borsh-encodes args and validates accounts against the IDL for you." },
      { title: "Decode program errors", note: "'custom program error: 0x1770' → 0x1770 = 6000 = first entry in the IDL's errors array (Anchor error codes start at 6000). Look it up instead of guessing." },
      { title: "Parse emitted events from logs", command: "new EventParser(programId, new BorshCoder(idl)).parseLogs(tx.meta.logMessages)", note: "Events live base64-encoded in 'Program data:' log lines — the parser handles it; this is how pump.fun token streams are consumed." },
    ],
    references: ["https://www.anchor-lang.com"],
  },

  seaport_orders: {
    topic: "seaport_orders",
    title: "Buy/sell NFTs programmatically via Seaport (the sane way)",
    summary: "How OpenSea orders actually work (offer/consideration model) and why agents should fetch fulfillment data from the API instead of hand-building orders.",
    scope: ["evm"],
    prerequisites: ["OpenSea API key (free, keyless issuance — see opensea_api guide)"],
    steps: [
      { title: "Understand the order model", note: "A Seaport order = offerer + offer[] (what they give) + consideration[] (what they require, incl. fees) + timestamps + conduit. Listings and bids are the SAME structure with sides swapped. Orders are EIP-712-signed off-chain; only fulfillment hits the chain." },
      { title: "Fetch, don't build: get fulfillment data from the API", command: "POST https://api.opensea.io/api/v2/listings/fulfillment_data  { listing: { hash, chain, protocol_address }, fulfiller: { address } }", note: "Returns the exact transaction (to, calldata, value) to execute a purchase — handles consideration items, fees, conduits and protocol versioning for you. Hand-building fulfillOrder calldata is a classic source of burned gas." },
      { title: "Find listings first", command: "GET /api/v2/listings/collection/{slug}/best  (cheapest per token)", note: "protocol_address tells you which Seaport version the order targets — pass it through, don't assume 1.6." },
      { title: "Verify before signing", command: "call tool \"simulate\" with the returned tx + call tool \"abi\" to decode it", note: "The decoded call should be fulfillBasicOrder/fulfillOrder on a LIVE-VERIFIED Seaport address (reference kind='addresses') — anything else is a scam contract." },
      { title: "Approvals", note: "Selling requires approving the conduit (NOT the Seaport core) for your NFT contract — the fulfillment/creation API responses specify the exact operator address to approve." },
    ],
    references: ["https://docs.opensea.io/reference/api-overview", "https://github.com/ProjectOpenSea/seaport"],
  },

  l2_bridging_basics: {
    topic: "l2_bridging_basics",
    title: "Bridging to/from L2s: canonical vs fast bridges (and when each is wrong)",
    summary: "The decision framework for moving funds between Ethereum and its L2s — withdrawal delays, trust models, and cost realities.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Know the two bridge classes", note: "CANONICAL bridges (the rollup's own) inherit L1 security but are slow to exit: OP-Stack (Base/Optimism) withdrawals take ~7 days (fault-proof window), Arbitrum ~1 week. FAST/liquidity bridges (routed via LiFi/deBridge) settle in minutes but add third-party trust + fees." },
      { title: "Deposits are always fast", note: "L1→L2 via canonical bridge lands in minutes on both OP-Stack and Arbitrum — no reason for a third-party bridge on the way IN unless you need a token swap en route." },
      { title: "Choose by amount and urgency", note: "Large/treasury withdrawals → canonical (trust-minimized, plan the 7 days). Working capital → fast bridge via the route tool (compares LiFi + deBridge quotes incl. fees)." },
      { title: "Get a ready-to-sign route", command: "call tool \"route\" { action: 'quote', fromChain, toChain, fromToken, toToken, amount, fromAddress }", note: "Returns the best route with an unsigned transactionRequest; check tool \"profitability\" for net-cost sanity on small amounts (L1 gas can exceed the bridged value)." },
      { title: "Mind L2 fee duality", note: "Every L2 tx pays L2 execution + L1 data fees (see rpc_gotchas) — bridging dust is uneconomical." },
    ],
  },

  tx_confirmation_patterns: {
    topic: "tx_confirmation_patterns",
    title: "Wait for transaction confirmation correctly (EVM, Solana, Bitcoin)",
    summary: "The per-chain patterns for knowing a tx is REALLY in — with timeouts, reorg awareness and the failure modes naive polling misses.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "EVM: poll the receipt, then wait confirmations", note: "eth_getTransactionReceipt returns null until mined — poll with backoff + hard timeout. For value transfers wait 1-2 extra blocks (reorg safety); L2s: distinguish soft confirmation from L1 finality if bridging follows. status 0x0 = mined but REVERTED — that's final, don't retry the same call blindly." },
      { title: "EVM: handle the stuck case", note: "No receipt after N minutes → tx may be underpriced. Same nonce + >=10% fee bump replaces it; a NEW nonce would create a second payment." },
      { title: "Solana: confirm against block height, not time", note: "sendTransaction → confirmTransaction({signature, blockhash, lastValidBlockHeight}). Once the chain passes lastValidBlockHeight without inclusion the tx is DEAD (blockhash expired) — safe to rebuild+resend. getSignatureStatuses for 'confirmed' vs 'finalized' (~32 slots)." },
      { title: "Bitcoin: mempool then blocks", command: "GET https://mempool.space/api/tx/{txid}/status → {confirmed, block_height}", note: "0-conf = fully reversible (esp. RBF-signaled). 1 conf ok for small amounts, 3-6 for meaningful value." },
      { title: "Idempotency for agents", note: "Persist txid/signature BEFORE broadcasting; on restart resume by checking status of the stored id instead of re-sending — double-spends by crashed agents are a classic self-inflicted loss." },
    ],
  },

  ipfs_for_nfts: {
    topic: "ipfs_for_nfts",
    title: "Resolve and host NFT metadata on IPFS (gateways, pinning, ipfs:// URIs)",
    summary: "Turn ipfs:// token URIs into data reliably, and pin your own NFT metadata for free — with the gateway fallback reality.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Resolve ipfs:// URIs", command: "ipfs://<CID>/<path> → https://<gateway>/ipfs/<CID>/<path>", note: "tokenURI() often returns ipfs:// — never pass it to fetch() directly." },
      { title: "Use a gateway FALLBACK LIST, never one gateway", command: "gateway.pinata.cloud/ipfs/ → dweb.link/ipfs/ (follow redirects!) → ipfs.io/ipfs/", note: "Live-tested reality: public gateways time out or redirect to subdomain form (https://<cid>.ipfs.dweb.link) under load — treat every gateway call as fallible, follow 3xx, time-box to ~10s each." },
      { title: "Pin your own metadata (free tiers)", note: "Pinata free tier (~1GB) or web3.storage: upload image first, put its ipfs:// URI into the metadata JSON, upload that, use the metadata CID in tokenURI. CIDs are content-addressed — changing one byte changes the CID." },
      { title: "On-chain SVG alternative", note: "Fully on-chain collections return data:application/json;base64,… from tokenURI — decode base64 twice (JSON, then image field). No gateway involved, nothing can rot." },
    ],
    warnings: ["Metadata that only lives on ONE pinning service disappears when the pin lapses — pin on two services or use a paid pinning plan for anything that matters."],
  },

  erc4626_vaults: {
    topic: "erc4626_vaults",
    title: "ERC-4626 tokenized vaults: deposit, redeem, share↔asset math",
    summary: "The standard yield-vault interface (sDAI, Morpho, Yearn, LST wrappers) and the share-price rounding traps that lose dust or enable inflation attacks.",
    scope: ["evm"],
    prerequisites: ["viem"],
    steps: [
      { title: "The model: shares vs assets", note: "A 4626 vault is an ERC-20 whose tokens are SHARES of an underlying asset. asset() returns the underlying (e.g. sDAI.asset() = DAI, live-verified). Share value grows as the vault earns — 1 share > 1 asset over time." },
      { title: "Convert without depositing", command: "convertToShares(assets) / convertToAssets(shares) — read-only previews", note: "Use previewDeposit/previewRedeem for the EXACT amount including fees at execution; convert* ignores fees/slippage." },
      { title: "Deposit", command: "approve(vault, assets) then vault.deposit(assets, receiver) → mints shares\n// or vault.mint(shares, receiver) to target an exact share count", note: "Selectors: deposit 0x6e553f65, redeem 0xba087652, asset 0x38d52e0f, totalAssets 0x01e1d114." },
      { title: "Withdraw", command: "vault.redeem(shares, receiver, owner) → assets  //  or withdraw(assets, receiver, owner)", note: "redeem burns a share count; withdraw targets an asset amount. maxWithdraw/maxRedeem tell you the cap (liquidity may be lent out)." },
      { title: "Rounding direction matters", note: "The spec rounds AGAINST the user (deposit → fewer shares, withdraw → fewer assets) to protect the vault. For tiny amounts you can round to zero shares — check the return value, never assume." },
    ],
    warnings: ["Inflation/donation attack: a freshly-deployed empty vault can be manipulated by donating assets to skew share price so the first depositor loses funds. Prefer vaults with a virtual-shares/dead-shares mitigation or existing TVL."],
    references: ["https://eips.ethereum.org/EIPS/eip-4626"],
  },

  stableswap_pools: {
    topic: "stableswap_pools",
    title: "Curve-style stableswap pools: virtual price, get_dy, LP safety",
    summary: "How to price and safely interact with Curve stableswap/metapools — and why get_virtual_price is the number that matters.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Quote a swap on-chain", command: "get_dy(i, j, dx) → output amount for swapping dx of coin i to coin j (indices from the pool's coins())", note: "This is the authoritative on-chain quote incl. the pool's amplification curve; use it, don't approximate stableswap math by hand." },
      { title: "LP-token value: get_virtual_price", command: "get_virtual_price() → 1e18-scaled value of ONE LP token in the pool's invariant units", note: "Live-verified (3pool ~1.04). It only ever goes UP (from fees) barring a depeg — a sudden DROP is a depeg/exploit signal. This is the manipulation-resistant number for pricing LP collateral, NOT the spot balance ratio (see price_oracle_safety)." },
      { title: "Add/remove liquidity", command: "add_liquidity([amounts], minMint) / remove_liquidity_one_coin(lpAmount, i, minOut)", note: "Imbalanced add/remove pays a fee; balanced is cheapest. calc_token_amount previews LP minted (approximate — set a min)." },
      { title: "Discover pools", command: "GET https://api.curve.finance/api/getPools/ethereum/main (keyless, live-verified)", note: "Returns pool addresses, coins and TVL across chains; or this server's route tool for the best swap across DEXes." },
    ],
    warnings: ["A stableswap pool that has gone heavily imbalanced (one coin dominates) signals a depeg in progress — swapping INTO the scarce coin gets terrible rates, and LPs are left holding the depegged asset."],
    references: ["https://docs.curve.finance"],
  },

  defi_lending: {
    topic: "defi_lending",
    title: "Lending & borrowing with Aave v3 (supply, borrow, health factor)",
    summary: "How an agent supplies collateral, borrows, and — critically — monitors liquidation risk on Aave v3.",
    scope: ["evm"],
    prerequisites: ["Collateral tokens on the chain"],
    steps: [
      { title: "Resolve the Pool per chain", note: "Aave v3 Pool on Ethereum: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2 (live-verified). Other chains: read PoolAddressesProvider.getPool() — never hardcode across chains." },
      { title: "Supply collateral", command: "approve(Pool, amount) then Pool.supply(asset, amount, onBehalfOf, referralCode=0)", note: "You receive aTokens (interest-bearing, 1:1 rebasing). Collateral must be enabled to back a borrow." },
      { title: "Borrow", command: "Pool.borrow(asset, amount, interestRateMode=2 /*variable*/, referralCode=0, onBehalfOf)", note: "Only up to your available borrows; over-borrowing reverts." },
      { title: "MONITOR the health factor", command: "Pool.getUserAccountData(user) → healthFactor (1e18-scaled)", note: "healthFactor < 1.0 = liquidatable. Agents MUST watch this: a price move against your collateral triggers liquidation (penalty + lost collateral). Keep a safety buffer (e.g. >1.5) and use price_oracle_safety for the price feed." },
      { title: "Repay / withdraw", command: "Pool.repay(asset, amount, rateMode, onBehalfOf)  ·  Pool.withdraw(asset, amount, to)", note: "Withdraw is blocked if it would push healthFactor below 1." },
    ],
    warnings: ["Liquidation is permissionless and instant — no grace period. A funded liquidator bot WILL take your collateral the moment healthFactor < 1."],
    references: ["https://aave.com/docs"],
  },

  eth_staking: {
    topic: "eth_staking",
    title: "Stake ETH: Lido (stETH/wstETH) vs solo vs Rocket Pool",
    summary: "The ETH liquid-staking options for an agent and the stETH-vs-wstETH gotcha that breaks naive integrations.",
    scope: ["evm"],
    prerequisites: ["ETH on Ethereum mainnet"],
    steps: [
      { title: "Liquid staking (easiest): Lido", command: "stETH.submit(referralOrZero) with msg.value = amount → mints stETH 1:1", note: "stETH (0xae7ab965…, live-verified) REBASES: your balance grows daily as rewards accrue. Great UX, but many DeFi contracts mishandle rebasing tokens." },
      { title: "The stETH → wstETH gotcha", command: "wstETH.wrap(stETHamount)  /  wstETH.unwrap(wstETHamount)", note: "wstETH (0x7f39C581…, live-verified) is NON-rebasing: fixed balance, value-per-token grows instead. Use wstETH for lending/LP/bridging; use stETH only where rebasing is understood. Mixing them up under-/over-counts holdings." },
      { title: "Other routes", note: "Rocket Pool (rETH, more decentralized), or solo staking (32 ETH, run a validator — see the Beacon API endpoint for validator data). Liquid tokens redeem via the protocol or just swap on a DEX for instant exit." },
      { title: "Exit", note: "Lido withdrawals go through a request+claim queue (can take days when the validator exit queue is long); swapping stETH→ETH on Curve/DEX is the instant path at a small discount." },
    ],
    warnings: ["stETH/ETH is NOT hard-pegged — it trades slightly below 1.0 and de-pegged notably during past liquidity crunches. Price it via a feed, don't assume 1:1 (price_oracle_safety)."],
    references: ["https://docs.lido.fi"],
  },

  solana_compressed_nfts: {
    topic: "solana_compressed_nfts",
    title: "Solana compressed NFTs (cNFTs): read, mint, transfer via DAS",
    summary: "cNFTs live in Merkle trees, not token accounts — how an agent actually reads and moves them.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Why they're different", note: "Compressed NFTs (Metaplex Bubblegum, BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY) store state in a concurrent Merkle tree — minting millions costs cents. They are NOT SPL token accounts; getTokenAccountsByOwner will NOT find them." },
      { title: "Read them via DAS", command: 'POST rpc {"method":"getAssetsByOwner","params":{"ownerAddress":"<addr>","page":1}}', note: "The DAS API (getAsset/getAssetsByOwner) returns both regular AND compressed NFTs. Live-verified on the public mainnet RPC (and on Helius). Filter items by compression.compressed === true." },
      { title: "Transfer needs a proof", command: "Fetch the asset proof (getAssetProof) → build the Bubblegum transfer with the Merkle proof", note: "Unlike a normal token transfer, you must supply the current proof path; the Metaplex JS SDK (mpl-bubblegum) or Helius helpers build this. A stale proof (tree changed) fails — fetch it right before sending." },
      { title: "Verify authenticity", note: "A cNFT's collection/creators come from the DAS response, verified against the tree. Don't trust off-chain metadata alone — check grouping (collection) and creator-verified flags." },
    ],
    warnings: ["cNFT proofs go stale as the tree updates — always fetch getAssetProof immediately before the transfer, and retry on proof-invalid errors."],
    references: ["https://developers.metaplex.com/bubblegum"],
  },

  solana_staking: {
    topic: "solana_staking",
    title: "Stake SOL: native staking vs liquid staking (jitoSOL, mSOL)",
    summary: "The two ways to earn SOL staking yield and which fits an agent that also needs liquidity.",
    scope: ["solana"],
    prerequisites: ["SOL"],
    steps: [
      { title: "Native staking (locked)", note: "Create a stake account (Stake Program: Stake11111111111111111111111111111111111111), delegate to a validator. Yield ~5-7% but SOL is locked; undelegation takes an epoch (~2-3 days) to cool down." },
      { title: "Liquid staking (keeps liquidity)", note: "Deposit SOL into a stake pool → receive a liquid token (jitoSOL/Jito, mSOL/Marinade, or via Sanctum) that accrues value and is tradable/usable in DeFi immediately. Jito adds MEV rewards on top." },
      { title: "Which to use", note: "Agent needs the SOL usable → liquid staking. Pure long-term hold, max decentralization → native + a good validator. jitoSOL/mSOL redeem back to SOL via the pool (or just swap on Jupiter for instant exit, minus a small discount)." },
      { title: "Data", command: "Jito: https://kobe.mainnet.jito.network/api/v1/validators (keyless, live-verified); prices/APY via the stake-pool account or Jupiter Price.", note: "Compare APYs net of pool fees before choosing." },
    ],
    references: ["https://docs.jito.network", "https://docs.marinade.finance"],
  },

  trading_bot_architecture: {
    topic: "trading_bot_architecture",
    title: "Build a trading bot that doesn't lose money to its own bugs",
    summary: "The operational skeleton for sniper / copy-trading / grid bots — the parts that matter more than the strategy: idempotency, risk limits, and not getting rugged by your own infra.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "The loop", note: "detect (WS subscription / mempool / event poll) → decide (strategy + risk checks) → simulate → sign → submit → CONFIRM → record. Never skip simulate/confirm: unconfirmed 'fire and forget' is how bots double-spend or think they hold a position they don't (tx_confirmation_patterns)." },
      { title: "Idempotency & crash safety", note: "Persist intent (what you're about to do) BEFORE submitting, and the tx id AFTER. On restart, reconcile against chain state — never blindly re-fire. A crashed bot that re-buys on reboot is a classic self-inflicted loss." },
      { title: "Hard risk limits, enforced in code", note: "Max position size, max slippage, per-token exposure cap, daily loss stop, and a global kill-switch. Pre-flight every counterparty token with the security tool. Sniping a fresh token WITHOUT an anti-rug scan = donating to a honeypot." },
      { title: "Bot types, briefly", note: "SNIPER: react to a launch (Solana: onLogs the pump.fun program; EVM: mempool/launch event) — speed + priority fees decide. COPY-TRADE: watch a wallet's txs and mirror with size scaling + a blocklist. GRID/DCA: schedule buys/sells around a range — the safest, no latency race." },
      { title: "Infra realities", note: "Bring your own funded RPC (public RPCs rate-limit you out mid-trade). Submit sensitive txs privately (Flashbots/MEV-Blocker on EVM, Jito bundles on Solana — reference kind='endpoints') so you aren't the one getting sandwiched. Keys in a secret manager, hot wallet holds working capital only (wallet_security_checklist)." },
    ],
    warnings: [
      "Backtests lie: real fills include slippage, MEV, failed-tx gas and latency. Paper-trade live before risking size.",
      "A public-mempool bot broadcasts its strategy — competitors frontrun it. Private submission is not optional for profitable signals.",
    ],
  },

  mev_strategies: {
    topic: "mev_strategies",
    title: "MEV explained: sandwich, backrun, liquidation — attack and DEFENSE",
    summary: "What MEV searchers do to your transactions and how an agent both avoids being a victim and (where legitimate) captures it.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "The main forms", note: "SANDWICH: a searcher buys before your swap (pushing price up) and sells after — you get a worse fill, they pocket the difference. BACKRUN: they trade right after a big price-moving tx (arb/liquidation). LIQUIDATION: they repay an underwater loan to claim the collateral bonus (defi_lending)." },
      { title: "DEFENSE (do this by default)", note: "1) Private submission: Flashbots Protect / MEV-Blocker RPC (EVM), Jito bundles (Solana) — your tx skips the public mempool so it can't be sandwiched. 2) Tight slippage: a small maxSlippage caps how much a sandwich can extract (too tight = failed tx; balance it). 3) Use aggregators/CoW Swap that batch and MEV-protect natively." },
      { title: "CAPTURE (the legitimate side)", note: "Backrunning arbitrage and liquidations are permissionless and non-predatory. Landing them needs bundle submission (Flashbots bundles / Jito) with a competitive tip, and atomic revert-if-unprofitable execution (arbitrage_basics)." },
      { title: "Measure your exposure", command: "call tool \"mev_protection\" { chain } for per-chain sandwich risk + the right private RPC", note: "High-value swaps on public mempools are the ones that get hit; route them privately." },
    ],
    warnings: ["Sandwiching ordinary users is predatory and, increasingly, reputationally/legally risky. This guide is for DEFENDING against it and capturing the legitimate (arb/liquidation) forms."],
    references: ["https://docs.flashbots.net", "https://docs.jito.network"],
  },

  prediction_markets: {
    topic: "prediction_markets",
    title: "Prediction markets for agents: read probabilities, trade, resolve (Polymarket)",
    summary: "How an agent reads market-implied probabilities and participates — plus the resolution/settlement risk that isn't obvious.",
    scope: ["evm"],
    prerequisites: ["USDC on Polygon to trade"],
    steps: [
      { title: "Price = probability", command: "GET https://gamma-api.polymarket.com/markets?closed=false", note: "A YES share trading at $0.63 means the market prices ~63% probability; YES+NO ≈ $1.00. Live-verified keyless. Great signal source for agents even if you never trade." },
      { title: "The mechanics", note: "Outcome shares are ERC-1155 (Gnosis Conditional Tokens) on Polygon; $1 is paid to the winning side at resolution. Buy YES if you think the market underprices the event; sell/short via NO." },
      { title: "Trade via the CLOB", command: "Order book + order placement at https://clob.polymarket.com (live-verified); the py/ts clients sign orders (EIP-712) and post them.", note: "Trading needs derived API creds + on-chain USDC allowance to the exchange. Read-only market data needs neither." },
      { title: "RESOLUTION risk (the non-obvious part)", note: "Markets resolve via an oracle (UMA optimistic oracle) — there's a dispute window, and ambiguous questions can resolve unexpectedly or stay frozen. Don't assume instant settlement; read the market's resolution source before sizing a position." },
    ],
    warnings: ["Low-volume markets have wide spreads and thin liquidity — the displayed 'probability' can be stale or manipulable. Check volume + order-book depth first."],
    references: ["https://docs.polymarket.com"],
  },

  liquidation_bots: {
    topic: "liquidation_bots",
    title: "Liquidation bots: find underwater loans and liquidate profitably",
    summary: "How liquidations work on Aave/Morpho/Compound, how to find liquidatable positions, and the flash-loan pattern that needs no upfront capital.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "The opportunity", note: "When a borrower's healthFactor < 1 (defi_lending), anyone can repay part of their debt and seize collateral at a discount (the liquidation bonus, ~5-15%). Permissionless and competitive — bots race for it." },
      { title: "Find liquidatable positions", note: "Query the protocol's indexer: Aave subgraph / Morpho API (blue-api.morpho.org/graphql, keyless, live-verified) for positions near healthFactor 1. Or watch price feeds + recompute health on the accounts you track (cheaper than scanning all)." },
      { title: "The flash-loan pattern (no capital needed)", note: "In ONE atomic tx: flash-borrow the repay asset (Balancer v2 Vault 0xBA12…2C8 offers 0-fee flash loans, live-verified; or Aave) → liquidationCall/liquidate → receive discounted collateral → swap enough to repay the flash loan → keep the spread. Reverts if unprofitable, so you only ever pay gas on failure." },
      { title: "Win the race", note: "Simulate first (simulate tool), submit via a private RPC / bundle (Flashbots/Jito) with a competitive priority fee — public mempool submission gets frontrun by faster bots. The margin is thin; gas + swap slippage decide profit." },
      { title: "Protocol specifics differ", note: "Aave: liquidationCall(collateral, debt, user, debtToCover, receiveAToken). Morpho: liquidate(marketParams, borrower, seizedAssets/repaidShares, data). Read the exact signature + close-factor (how much of the debt you may repay at once) per protocol." },
    ],
    warnings: ["Liquidations are winner-take-all and bot-saturated on major markets — realistic edges are on smaller/newer markets or during fast price moves. Always net gas + swap costs before firing."],
    references: ["https://docs.morpho.org", "https://aave.com/docs"],
  },

  arbitrage_basics: {
    topic: "arbitrage_basics",
    title: "On-chain arbitrage: DEX, cross-chain and the costs that eat naive bots",
    summary: "The real arbitrage playbook for agents — where edges exist, and the fees/risks that turn a 'profitable' quote into a loss.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "The forms", note: "DEX↔DEX (same chain, price differs between pools), triangular (A→B→C→A on one venue), cross-chain (same asset cheaper on chain X), and CEX↔DEX. Agents realistically compete only where they have a latency or capital edge — the obvious ones are bot-saturated." },
      { title: "ALWAYS net out every cost BEFORE deciding", command: "call tool \"profitability\" with the trade legs + expected revenue", note: "Costs: gas (both chains for cross-chain), DEX fees per hop, slippage/price-impact at YOUR size, bridge fees + delay, and MEV (your profitable tx gets sandwiched/frontrun). A 0.4% gross edge is usually negative after all of these." },
      { title: "Simulate the whole path atomically", command: "call tool \"simulate\" (EVM) — dry-run the full route; if any leg reverts you pay gas for nothing", note: "Same-chain arb should be atomic (one tx, revert-if-unprofitable) — often via a flash loan so you need no upfront capital. Cross-chain CANNOT be atomic → you carry inventory/price risk during the bridge." },
      { title: "Protect the transaction", note: "Submit via a private/MEV-protected RPC (Flashbots/MEV-Blocker, reference kind='endpoints') so searchers can't frontrun your arb. Public mempool = your edge gets stolen." },
      { title: "Data sources for spotting edges", note: "Cross-DEX quotes via the route tool; prices via DefiLlama/Pyth/CoinGecko; funding-rate/basis arb via perps_funding_data; CEX prices via Binance/Bybit keyless endpoints." },
    ],
    warnings: [
      "Cross-chain arb is NOT atomic — the price can move against you during the bridge delay; size for that risk.",
      "'Free' flash-loan arb still pays the flash-loan fee + gas; the loan just removes the capital requirement, not the costs.",
    ],
  },

  defi_yield_research: {
    topic: "defi_yield_research",
    title: "Research DeFi yields and stablecoin health (keyless, one API family)",
    summary: "How an agent screens yield opportunities and monitors stablecoin pegs with DefiLlama's free APIs — including the traps in APY numbers.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Pull the full pool universe", command: "curl -s https://yields.llama.fi/pools", note: "Returns every tracked pool with chain, project, symbol, tvlUsd, apy/apyBase/apyReward. Filter client-side: tvlUsd floor first (e.g. >$1M) — tiny pools show fantasy APYs." },
      { title: "Read APY correctly", note: "apyBase = organic (fees/interest), apyReward = token emissions (often sell-pressure-decaying), apy = both. For sustainability compare apyBase; a pool living on apyReward alone dies with the incentives." },
      { title: "Check the pool's history before entering", command: "curl -s https://yields.llama.fi/chart/{pool-id}", note: "A 3-day-old 80% APY pool is a launch spike, not an opportunity." },
      { title: "Monitor stablecoin pegs", command: "curl -s 'https://stablecoins.llama.fi/stablecoins?includePrices=true'", note: "price notably off 1.00 = depeg signal; also shows circulating per chain (bridge-risk exposure)." },
      { title: "Cross-check protocol health", command: "curl -s https://api.llama.fi/tvl/{protocol}", note: "Falling TVL + rising APY = exit signal, not entry. Always security-scan the pool's token contracts first (security tool)." },
    ],
    references: ["https://api-docs.defillama.com"],
  },

  spl_token_basics: {
    topic: "spl_token_basics",
    title: "SPL tokens on Solana: ATAs, decimals, transfers, priority fees",
    summary: "The Solana token model for agents: derive the associated token account, respect raw amounts, detect Token-2022, and tune priority fees from live data.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Balances live in ATAs, not wallets", command: "ATA = findProgramAddress([owner, tokenProgramId, mint], ATA_PROGRAM)  // @solana/spl-token: getAssociatedTokenAddressSync(mint, owner, false, tokenProgramId)", note: "Pass the CORRECT token program (classic vs Token-2022 — the mint account's owner tells you; see pumpfun_token2022_gotchas)." },
      { title: "Amounts are raw integers", note: "amount = ui_amount × 10^decimals. Fetch decimals from the mint account — 6 for USDC, 9 for wrapped SOL, arbitrary for memecoins. bigint everywhere." },
      { title: "Transfers to fresh wallets need ATA creation", note: "createAssociatedTokenAccountIdempotent (payer pays ~0.002 SOL rent) + transferChecked (validates mint/decimals — prefer it over plain transfer)." },
      { title: "Tune priority fees from live data", command: 'POST rpc {"method":"getRecentPrioritizationFees","params":[[]]} → median of recent fees\n// then prepend ComputeBudgetProgram.setComputeUnitPrice(microLamports)', note: "During congestion 0-fee txs get dropped silently; re-fetch the blockhash right before signing." },
      { title: "Read balances the easy way", command: "call tool \"portfolio\" { chain: 'solana', address }", note: "Returns native + SPL balances with USD values in one call." },
    ],
  },

  wallet_security_checklist: {
    topic: "wallet_security_checklist",
    title: "Wallet & key security checklist for agent operators",
    summary: "The non-negotiables before an agent touches real funds: key storage, approval hygiene, transaction discipline, blast-radius design.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Keys never enter code, logs or chats", note: "Load from env/secret manager only; never echo them (even 'briefly'); .env in .gitignore BEFORE the first commit; a key that ever appeared in terminal output or a paste is considered exposed → rotate." },
      { title: "Design for blast radius", note: "One purpose = one wallet. Hot agent wallets hold gas + working capital only; treasury/owner keys stay cold and are never in server env vars. A relayer that can only call release() can't drain an escrow." },
      { title: "Approval hygiene", note: "Approve exact amounts to specific spenders; review and revoke stale allowances periodically (portfolio tool: allowance action / revoke tx). Infinite approvals to upgradeable contracts are standing risk." },
      { title: "Transaction discipline", note: "Simulate before signing (simulate tool), verify the decoded calldata matches intent (abi tool), never blind-sign eth_sign/personal_sign of hex you didn't construct — signature phishing drains via Permit/Permit2." },
      { title: "Pre-flight every counterparty token", command: "call tool \"security\" { chain, address }", note: "Honeypot/tax/owner-power scan before the first buy — 0-100 risk score with red flags." },
    ],
  },

  eth_jsonrpc_cheatsheet: {
    topic: "eth_jsonrpc_cheatsheet",
    title: "Ethereum JSON-RPC methods that matter (and their traps)",
    summary: "The execution-layer RPC methods agents actually need — fee estimation done right, state overrides, storage reads — with the gotchas that cost real money.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "EIP-1559 fees: use eth_feeHistory, not gasPrice", command: '{"method":"eth_feeHistory","params":["0x5","latest",[25,75]]}', note: "Returns baseFeePerGas history + priority-fee percentiles of real blocks. maxPriorityFeePerGas ≈ 75th percentile, maxFeePerGas ≈ 2×latestBaseFee + priority. eth_gasPrice is legacy and overpays." },
      { title: "eth_call with state overrides (3rd param)", command: '{"method":"eth_call","params":[{to, data}, "latest", {"0xYourAddr": {"balance": "0xDE0B6B3A7640000"}}]}', note: "Simulate as if an address had balance/code/storage — test a swap without owning the tokens. Not all public RPCs support the override param." },
      { title: "Read raw storage slots", command: '{"method":"eth_getStorageAt","params":[contract, slot, "latest"]}', note: "EIP-1967 proxy implementation slot: 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc (this server's abi tool follows it automatically)." },
      { title: "Receipts tell the truth", command: '{"method":"eth_getTransactionReceipt","params":[txHash]}', note: "status 0x1/0x0, effectiveGasPrice, logs. A tx can 'succeed' while an inner call failed silently IF the contract swallows reverts — always check emitted events, not just status." },
      { title: "Pending state exists", note: "Use block tag 'pending' for nonce (eth_getTransactionCount) when firing sequential txs; 'latest' gives you the mined nonce and causes 'nonce too low' races." },
      { title: "What free RPCs won't do", note: "debug_traceTransaction / trace_* need archive+debug nodes (paid tiers); eth_getLogs is range-capped (see rpc_gotchas reference). Plan around it: use this server's simulate tool + receipts." },
    ],
    references: ["https://ethereum.org/en/developers/docs/apis/json-rpc/"],
  },

  chainlink_price_feeds: {
    topic: "chainlink_price_feeds",
    title: "Read on-chain prices from Chainlink feeds (without guessing addresses)",
    summary: "The safe pattern for on-chain price data: verified feed lookup, latestRoundData decoding, staleness checks — plus when to prefer a keyless HTTP price API instead.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Look up the feed address — NEVER guess it", note: "Feed proxies differ per chain and get migrated. Verified directory: https://data.chain.link (and docs.chain.link/data-feeds/price-feeds/addresses). Example verified anchor: ETH/USD on Ethereum = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419." },
      { title: "Call latestRoundData()", command: "selector 0xfeaf968c → (roundId, int256 answer, startedAt, updatedAt, answeredInRound)", note: "answer for USD pairs has 8 decimals (price = answer / 1e8). Verify decimals() (0x313ce567) if unsure." },
      { title: "ALWAYS check staleness", note: "Reject if now - updatedAt exceeds the feed's heartbeat (ETH/USD: ~1h) — a stale answer during volatility is worse than no answer." },
      { title: "Off-chain alternative (no RPC needed)", command: "GET https://coins.llama.fi/prices/current/coingecko:ethereum", note: "For agent logic that doesn't need on-chain trust, DefiLlama/CoinGecko are keyless and batchable — cheaper than an eth_call per price." },
    ],
    warnings: ["A feed address that returns 0x on eth_call is wrong or deprecated — this exact check caught a wrong 'well-known' BTC/USD address during curation of this guide."],
    references: ["https://data.chain.link", "https://docs.chain.link/data-feeds"],
  },

  erc_standards_cheatsheet: {
    topic: "erc_standards_cheatsheet",
    title: "ERC interface IDs, selectors and events — the exact constants",
    summary: "The precise ERC-165 interface IDs, function selectors and event topics agents most often need (and most often hallucinate).",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Detect a contract's standard via ERC-165", command: "supportsInterface(bytes4) selector 0x01ffc9a7\nERC-721: 0x80ac58cd   ERC-721Metadata: 0x5b5e139f\nERC-1155: 0xd9b67a26  ERC-2981 (royalties): 0x2a55205a\nERC-4906 (metadata update): 0x49064906", note: "ERC-20 has NO ERC-165 id — probe decimals()/balanceOf() instead." },
      { title: "Core ERC-20 selectors", command: "transfer(address,uint256)      0xa9059cbb\ntransferFrom(address,address,uint256) 0x23b872dd\napprove(address,uint256)       0x095ea7b3\nbalanceOf(address)             0x70a08231\nallowance(address,address)     0xdd62ed3e\ndecimals()                     0x313ce567" },
      { title: "Core ERC-721 selectors", command: "ownerOf(uint256)               0x6352211e\nsafeTransferFrom(address,address,uint256) 0x42842e0e\ntokenURI(uint256)              0xc87b56dd\nsetApprovalForAll(address,bool) 0xa22cb465" },
      { title: "Event topic0 hashes", command: "Transfer(address,address,uint256)  0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef\nApproval(address,address,uint256)  0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925\nTransferSingle (ERC-1155)          0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62", note: "ERC-20 and ERC-721 Transfer share the SAME topic0 — distinguish by topic count (721 indexes tokenId → 4 topics, 20 has 3)." },
      { title: "Verify any selector yourself", command: "call tool \"abi\" { action: 'decode_calldata', data: '0x…' }  // or toFunctionSelector('transfer(address,uint256)') in viem" },
    ],
  },

  bitcoin_basics: {
    topic: "bitcoin_basics",
    title: "Bitcoin for agents: UTXOs, fees, PSBT, broadcasting (keyless APIs)",
    summary: "Everything an agent needs to build and send Bitcoin transactions correctly — address types, sat/vB fees from mempool.space, the PSBT workflow with bitcoinjs-lib, dust and RBF rules.",
    scope: ["bitcoin"],
    prerequisites: ["Node 20+, npm i bitcoinjs-lib ecpair tiny-secp256k1 (for building)"],
    steps: [
      { title: "Know the address types", note: "P2PKH (1…, legacy, largest vsize), P2SH (3…), P2WPKH (bc1q…, segwit, cheap), P2TR (bc1p…, taproot). Prefer bc1q/bc1p for lower fees; validate with a bech32/bech32m decoder, not regex." },
      { title: "Fetch the feerate — never guess", command: "curl -s https://mempool.space/api/v1/fees/recommended", note: "Returns sat/vB tiers (fastest/halfHour/hour/economy/minimum). Total fee = feerate × estimated vsize. Bitcoin fees are per VBYTE, not per tx." },
      { title: "Fetch spendable UTXOs", command: "curl -s https://mempool.space/api/address/{addr}/utxo", note: "Bitcoin has NO account balance on-chain — you spend concrete UTXOs and send change back to yourself. Forgetting the change output donates it to miners." },
      { title: "Build + sign with PSBT", command: "const psbt = new bitcoin.Psbt({ network });\npsbt.addInput({ hash, index, witnessUtxo: { script, value } });\npsbt.addOutput({ address: dest, value: amount });\npsbt.addOutput({ address: changeAddr, value: total - amount - fee });\npsbt.signAllInputs(keyPair); psbt.finalizeAllInputs();\nconst rawHex = psbt.extractTransaction().toHex();", note: "For segwit inputs witnessUtxo is required; legacy inputs need nonWitnessUtxo (the full previous tx)." },
      { title: "Broadcast (two independent keyless endpoints)", command: "curl -s -X POST https://mempool.space/api/tx --data-binary $rawHex\n# failover: curl -s -X POST https://blockstream.info/api/tx --data-binary $rawHex" },
      { title: "Stuck tx? Use RBF", note: "If the tx signals replaceability (sequence < 0xfffffffe), rebuild with the SAME inputs and a higher feerate. Otherwise CPFP: spend the change output with a high-fee child." },
    ],
    warnings: [
      "Outputs below the dust limit (~546 sats P2PKH / ~294 sats P2WPKH) are rejected by relay policy.",
      "Testnet coordinates: use mempool.space/testnet4/api and bitcoin.networks.testnet.",
    ],
    references: ["https://mempool.space/docs/api", "https://github.com/bitcoinjs/bitcoinjs-lib"],
  },

  bitcoin_ordinals_runes: {
    topic: "bitcoin_ordinals_runes",
    title: "Bitcoin metaprotocols: Ordinals, Runes, BRC-20 (query & basics)",
    summary: "What the Bitcoin metaprotocols actually are and how an agent reads inscription/rune/BRC-20 data now that Hiro's API is gone.",
    scope: ["bitcoin"],
    prerequisites: [],
    steps: [
      { title: "The three, briefly", note: "ORDINALS = arbitrary data 'inscribed' onto individual sats (NFT-like). RUNES = a native fungible-token protocol encoded in OP_RETURN (post-halving, UTXO-based, efficient). BRC-20 = older fungible standard built ON TOP of ordinal inscriptions (JSON in inscriptions) — heavier than Runes, still has volume." },
      { title: "Query data (Hiro Ordinals API is DEPRECATED — returns 410)", command: "GET https://api.ordiscan.com/v1/address/{btc-addr}/inscriptions | /runes | /brc20", note: "Ordiscan is the practical replacement: keyless via x402 micro-pay (unpaid call → HTTP 402, live-verified) or a free key. Magic Eden also exposes ordinals/marketplace endpoints." },
      { title: "Runes vs BRC-20 for new work", note: "Prefer Runes for new fungible tokens — UTXO-native, far cheaper to mint/transfer than BRC-20's inscription overhead. BRC-20 mainly matters for existing tokens." },
      { title: "Base-layer reads still via Esplora", note: "Ordinal/rune INDEXING needs a specialized indexer (Ordiscan); raw UTXOs/txs/fees stay on mempool.space + Blockstream (see bitcoin_basics)." },
    ],
    warnings: ["Inscription/rune transfers are still normal Bitcoin txs — respect dust limits and sat-vB fees (bitcoin_basics). Sending an inscribed sat as ordinary change BURNS the inscription."],
    references: ["https://docs.ordinals.com", "https://docs.ordiscan.com"],
  },

  farcaster_social: {
    topic: "farcaster_social",
    title: "Read Farcaster social data (casts, users, channels)",
    summary: "How an agent pulls decentralized-social context from Farcaster — the hosted API and the on-protocol reality.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Hosted API (easiest): Neynar", command: "GET https://api.neynar.com/v2/farcaster/user/bulk?fids=3  (header x-api-key: KEY)", note: "Free-key signup; unpaid call returns 402 (live-verified). Also casts, reactions, follows, channels, and posting (with a signer)." },
      { title: "Identity model", note: "Users are identified by FID (numeric Farcaster ID), not wallet address — though FIDs link to verified Ethereum addresses. Resolve FID ↔ address via the user endpoint." },
      { title: "On-protocol (no vendor)", note: "Farcaster runs on Snapchain hubs; self-hosted/public hubs expose an HTTP API (/v1/castsByFid etc.) directly and keyless, at the cost of running/finding a hub." },
      { title: "Agent use", note: "Good for social signals, mention monitoring, or posting agent updates. For token/market data it's orthogonal — combine with the price/security tools." },
    ],
    references: ["https://docs.neynar.com", "https://docs.farcaster.xyz"],
  },

  chaintrade_p2p_swap: {
    topic: "chaintrade_p2p_swap",
    title: "P2P swap of NFTs/tokens with escrow protection (ChainTrade)",
    summary: "Trustless peer-to-peer trades — NFT for token, token for token, incl. cross-chain — via ChainTrade's V2 escrow contracts. This server builds the unsigned transactions.",
    scope: ["evm"],
    prerequisites: ["A funded wallet on the escrow chain"],
    steps: [
      { title: "Understand the model", note: "The maker locks assets in an audited escrow contract; a relayer releases to the taker when both sides are locked, or the maker refunds after expiry. No custody by any party. Platform fee: 5% on fungibles; NFTs transfer whole (fee taken on the fungible side)." },
      { title: "Escrow contracts (V2, live)", command: "ethereum: 0x51A425f516aa3D95B76665D1Bad3Ea56E57be4b6\nbase:     0xD7c9a6b38568c03fbA1f08f4159dD2c032411Ac9\npolygon/arbitrum/apechain: 0x9B2EA7B176D727459233469c88c7352fb060b85B", note: "Same UI for all chains: https://chaintrade.vercel.app" },
      { title: "Build the lock tx with this server", command: "call tool \"chaintrade\" { action: 'build_lock_eth' | 'build_lock_erc20' | 'build_lock_erc721', chain, offerHash, … }", note: "Returns unsigned transactions (approval + lock where needed) that YOU sign. action 'info' explains the flow, 'get_trade' reads on-chain state." },
      { title: "Refund path", command: "call tool \"chaintrade\" { action: 'build_refund', chain, offerHash }", note: "Only possible after the trade's expiry — funds are never stuck." },
    ],
    warnings: ["ERC-20/721 locks need the approval tx mined BEFORE the lock tx.", "Verify the trade's offerHash and counterparty details before locking — locks are binding until expiry."],
    references: ["https://chaintrade.vercel.app"],
  },

  pumpfun_token2022_gotchas: {
    topic: "pumpfun_token2022_gotchas",
    title: "pump.fun + Token-2022 trading gotchas (Solana)",
    summary: "The traps that break naive pump.fun/SPL bots: Token-2022 mints, ATA rent, real launch costs, micro-trade economics.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Detect the token program — never assume", note: "New pump.fun-era tokens are often Token-2022. The OWNER of the mint account IS the token program (TokenkegQ… = classic SPL, TokenzQdB… = Token-2022). Instructions/ATAs built for the wrong program fail." },
      { title: "Create ATAs up front", note: "Each new token account costs ~0.002 SOL rent. For small trades, pre-create ATAs so rent + priority fees don't eat the position." },
      { title: "Budget real launch costs", note: "A pump.fun token creation costs ~0.009 SOL in rent (NOT free) — 0.1 SOL funds only ~11 launches." },
      { title: "Check quote currency", note: "Some pump.fun coins are USDC-quoted, not SOL-quoted — a SOL-denominated buy path rejects or mis-prices them." },
      { title: "Read curve state before trading", command: "call tool \"pumpfun\" { mint }", note: "Returns bonding-curve state, price and graduation progress; graduated tokens trade via regular DEX routing (solana_swap tool)." },
      { title: "Congestion handling", note: "Add a compute-unit price (priority fee) and re-fetch the blockhash right before signing; blockhashes expire in ~60-90s." },
    ],
    warnings: ["Never run two bots on the same wallet — parallel sells collide on the same ATAs/nonces."],
  },

  vercel_dapp_deploy_gotchas: {
    topic: "vercel_dapp_deploy_gotchas",
    title: "Deploying Web3 dApps/APIs on Vercel — the gotchas",
    summary: "Field-tested fixes for the failures that only show up when a chain-touching app hits Vercel's serverless runtime.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "@solana/web3.js may not bundle", note: "Its rpc-websockets dependency can crash serverless builds with ERR_REQUIRE_ESM. Fixes: use pure-JS crypto (@noble/curves + @noble/hashes + bs58) for PDAs/keys, or pin/alias the dependency in your bundler config." },
      { title: "Pin your toolchain to Node 20+", note: "Solana tooling and modern viem stacks assume Node 20; set \"engines\" and the Vercel project's Node version explicitly." },
      { title: "Extra .vercel.app domains: assign to the PROJECT", command: "npx vercel domains add <name>.vercel.app <project>", note: "Without the project argument the domain lands in the team scope and serves 404; assigned as a project domain it serves your production deployment. Never use `vercel alias` for this (401 traps)." },
      { title: "Serve .well-known files statically", note: "Put manifests/verification files as REAL files under public/.well-known/ — rewrites/redirects break strict fetchers (OpenSea's ERC-8257 indexer follows no redirects at all)." },
      { title: "Pin CDN scripts", note: "Unpinned CDN dependencies (e.g. a Babel standalone) break silently on new majors — always pin exact versions in <script src>." },
      { title: "Health-check external services after deploy", command: "curl -sf https://<app>/api/<health> && curl -s <manifest-url> | sha256sum", note: "Serverless cold starts + env drift are the top post-deploy failure sources; verify live behavior, not build success." },
    ],
  },

  bridge_funds: {
    topic: "bridge_funds",
    title: "Move funds across chains",
    summary: "Bridge/swap assets between chains. Use the `route` tool of this server to get the best quote + a ready-to-sign transaction.",
    scope: ["all"],
    prerequisites: ["A funded wallet on the source chain"],
    steps: [
      { title: "Get the best cross-chain route", command: 'call tool "route" { action:"quote", fromChain, toChain, fromToken, toToken, amount, fromAddress }', note: "Queries LiFi + deBridge, returns the best route and an unsigned transactionRequest." },
      { title: "Check it's worth it", command: 'call tool "profitability" with the route\'s txs + expectedRevenueUsd', note: "Confirms the move is net-positive after gas + slippage." },
      { title: "Sign + broadcast the returned transaction with your own wallet", note: "This server never signs — you sign the unsigned tx it returns." },
    ],
    references: ["https://li.fi", "https://debridge.finance"],
  },
};

export const GUIDE_TOPICS = Object.keys(GUIDES);
