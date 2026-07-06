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

  foundry_invariant_testing: {
    topic: "foundry_invariant_testing",
    title: "Foundry invariant & fuzz testing: prove your contract can't break",
    summary: "The handler/ghost pattern for stateful invariant testing — how an agent writes tests that fuzz thousands of call sequences to catch what unit tests miss.",
    scope: ["evm"],
    prerequisites: ["A Foundry project (forge init)"],
    steps: [
      { title: "Fuzz test first (stateless)", command: "function testFuzz_deposit(uint256 amt) public { amt = bound(amt, 1, 1e24); vault.deposit(amt); assertEq(vault.balanceOf(address(this)), amt); }", note: "forge runs it with many random inputs. ALWAYS bound(x, min, max) inputs to realistic ranges — unbounded fuzzing wastes runs on impossible values (a uint256 amount of 2^255 tells you nothing)." },
      { title: "Invariant test = fuzz over CALL SEQUENCES", note: "Declare properties that must hold after ANY sequence of calls: function invariant_solvency() public { assertGe(token.balanceOf(address(vault)), vault.totalAssets()); }. forge calls random public functions in random order, then checks every invariant_ after each step." },
      { title: "Use a Handler to constrain the fuzzer", note: "Point the fuzzer at a Handler contract (targetContract(address(handler))) instead of the raw contract. The handler wraps each action with bound()ed inputs and realistic actors — otherwise 99% of calls revert on nonsense and you get no coverage. Track 'ghost variables' (running sums) in the handler to assert conservation properties." },
      { title: "Config in foundry.toml", command: "[invariant]\\nruns = 256\\ndepth = 128\\nfail_on_revert = false", note: "runs = independent sequences, depth = calls per sequence. fail_on_revert=false lets the sequence continue past expected reverts (use handler-level assumptions to filter); set true when you want ANY revert to fail the run." },
      { title: "Classic DeFi invariants to assert", note: "Solvency (contract balance ≥ obligations), supply accounting (Σ balances == totalSupply), no-free-mint (only authorized paths change supply), monotonic share price (ERC-4626: virtual price only up barring fees), access control (non-owner can't reach owner paths). These are exactly the properties whose violation = an exploit (rugpull_forensics, price_oracle_safety)." },
      { title: "Run it", command: "forge test --mt invariant_ -vvv   (or: forge test --match-path test/Invariant.t.sol)", note: "A failing invariant prints the exact call sequence (the 'counterexample') that broke it — replay that as a unit test. Add coverage-guided runs in CI (web3_ci_cd guide)." },
    ],
    warnings: [
      "An invariant test that never reverts AND never covers the interesting states is a false sense of safety — check the handler actually reaches edge states (log call counts; forge --show-metrics).",
      "Invariant testing complements but never replaces an audit + a formal-verification pass on the highest-value contracts.",
    ],
    references: ["https://book.getfoundry.sh/forge/invariant-testing"],
  },

  web3_ci_cd: {
    topic: "web3_ci_cd",
    title: "Web3 CI/CD: GitHub Actions for Foundry (test, fuzz, Slither, deploy, verify)",
    summary: "A production-grade pipeline for a smart-contract repo — what to run on every PR, how to keep keys safe, and the matrix pattern for multi-chain deploys.",
    scope: ["evm"],
    prerequisites: ["A Foundry project", "foundry_invariant_testing"],
    steps: [
      { title: "The PR gate (run on every push)", command: "forge fmt --check && forge build --sizes && forge test -vvv && forge test --mt invariant_", note: "Use foundry-rs/foundry-toolchain@v1 in the workflow to install forge. --sizes catches the 24KB contract limit BEFORE deploy; separate the invariant job so its longer runtime doesn't block fast unit feedback." },
      { title: "Static analysis in CI", command: "crytic/slither-action@v0 (Slither) — fail the build on high-severity findings", note: "Slither catches reentrancy, uninitialized storage, arbitrary-send, shadowing etc. for free. Add Aderyn as a second linter. Gate merges on a clean run; triage/annotate acceptable findings rather than disabling the check." },
      { title: "Coverage + gas snapshots", command: "forge coverage --report lcov  ·  forge snapshot --check .gas-snapshot", note: "gas-snapshot diff in the PR shows regressions; coverage upload (codecov) surfaces untested branches. A gas snapshot that jumps unexpectedly is a red flag for an accidental storage write (gas_optimization)." },
      { title: "Secrets: NEVER a raw private key in CI", note: "Store ETHERSCAN_API_KEY as a repo secret. For deploys prefer Foundry's keystore/`--account` or a hardware/KMS signer over a plaintext PRIVATE_KEY secret — a leaked CI key is a drained wallet (wallet_security_checklist). Restrict deploy jobs to protected branches + manual approval (environments)." },
      { title: "Multi-chain deploy + verify (matrix)", command: "strategy.matrix.chain: [1, 8453, 42161, 10]  →  forge script Deploy --rpc-url ${{ matrix.rpc }} --broadcast --verify --etherscan-api-key ${{ secrets.ETHERSCAN_API_KEY }}", note: "One Etherscan V2 key verifies all chains (verify_contract). Use CREATE2 so the address is identical across the matrix (deterministic_deploys_create2). Gate broadcast behind a manual workflow_dispatch, never auto-deploy on merge." },
      { title: "Solana equivalent", command: "anchor build && anchor test (with solana-test-validator in the runner); anchor deploy gated to a manual job", note: "Cache the Solana/Anchor toolchain; run the local validator as a service. Program upgrades need the upgrade authority key — same KMS/keystore discipline." },
    ],
    warnings: [
      "fail_on_revert defaults differ between unit and invariant runs — a green CI with fail_on_revert=false can still hide broken invariants if the handler swallows reverts; assert coverage of the target functions.",
      "Auto-deploy-on-merge to mainnet is how repos get rugged by a compromised CI — deploys are manual, approved, and signed by a key CI never sees in plaintext.",
    ],
    references: ["https://book.getfoundry.sh/config/continuous-integration", "https://github.com/crytic/slither-action"],
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

  scripting_with_onchain_tools: {
    topic: "scripting_with_onchain_tools",
    title: "Scripting pattern: combine this server's tools with viem for safe automation",
    summary: "How an agent chains knowledge → abi → simulate → sign locally in a viem/Foundry script — the keystore-free loop that avoids hardcoded addresses and blind sends.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Resolve addresses from knowledge, don't hardcode", command: 'knowledge { action: "reference", kind: "addresses" } → canonical Multicall3/Permit2/USDC/WETH per chain; knowledge { action: "ask", query: "<protocol> router address" }', note: "Hardcoded mainnet addresses are the #1 cross-chain bug (they differ or don't exist on other chains — see robinhood_chain_playbook, bnb_chain_playbook). Pull the verified value at runtime; cache it locally after." },
      { title: "Build calldata with the right ABI", command: 'knowledge { action: "reference", kind: "abis" } for standard selectors; call tool "abi" { action: "get_abi", chain, address } for a specific contract (Etherscan/Sourcify + proxy resolution + 4byte fallback)', note: "viem encodeFunctionData with the fetched ABI — no guessing selectors. For a proxy the abi tool returns the IMPLEMENTATION ABI." },
      { title: "Simulate EVERY tx before signing", command: 'call tool "simulate" { chain, tx: { from, to, data, value } } → success + decoded revert', note: "This is the keystore-free contract: the server returns UNSIGNED data and simulation results; YOUR script holds the key and signs (viem walletClient.sendTransaction). The server never sees your key. A failed simulate = don't sign." },
      { title: "Gate the send on profitability + security", command: 'call tool "security" { chain, address } before touching a new token; call tool "profitability" { … } before a trade; call tool "route"/"solana_swap" for the unsigned swap tx', note: "Compose the tools into a pre-flight (the playbook_pre_trade_check sequence) so the script aborts on a honeypot or an unprofitable route BEFORE spending gas." },
      { title: "Sign & submit locally, then confirm", command: "viem: signed = await walletClient.sendTransaction(tx); await publicClient.waitForTransactionReceipt({ hash }). Solana: build via solana_swap, sign with your Keypair, sendAndConfirmTransaction", note: "Re-fetch nonce ('pending') / blockhash right before signing; make the loop idempotent (tx_confirmation_patterns). Retry with fee bump on timeout, not a blind re-send." },
      { title: "The persistent-agent shape", note: "Wrap it as: discover (knowledge.ask) → validate (security/simulate) → decide (profitability) → execute (sign local) → verify (receipt) → log. Save this server's endpoint + your resolved addresses to the agent's memory (MEMORY_HINT) so future runs skip re-discovery." },
    ],
    warnings: [
      "The server is stateless and keystore-free BY DESIGN — if any tool ever asks for a private key or seed, it's not this server; never send keys to any tool (wallet_security_checklist).",
      "Runtime address resolution is safer than hardcoding but still verify once on a new chain (getter/symbol check) before wiring real capital — this server live-verifies, but chains change.",
    ],
    references: ["https://viem.sh/docs/actions/wallet/sendTransaction"],
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

  proxy_upgrade_patterns: {
    topic: "proxy_upgrade_patterns",
    title: "Upgradeable contracts: proxy patterns, storage collisions, and how to read them",
    summary: "How proxy upgrades work, the storage-layout rules that break them, and how an agent detects/inspects a proxy before trusting it.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "The proxy model", note: "A Proxy holds the STATE and delegatecalls to an Implementation that holds the LOGIC. Upgrading = pointing the proxy at a new implementation. The user always interacts with the proxy address; the logic can change under it." },
      { title: "Find the implementation (EIP-1967)", command: "eth_getStorageAt(proxy, 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc) → implementation address", note: "This server's abi tool follows EIP-1967 proxies automatically. Admin slot: 0xb53127684a568b3173 ...eb1c7 (0xb531…). UUPS keeps the upgrade fn in the implementation; Transparent keeps it in the proxy." },
      { title: "Storage collision = the classic bug", note: "Because logic runs in the proxy's storage, a new implementation MUST keep the same storage layout and only APPEND new variables. Reordering/inserting a variable corrupts existing state. Use a storage gap (uint256[50] __gap) or ERC-7201 namespaced storage." },
      { title: "Never let the implementation be initialized/selfdestructed", note: "Implementations use initializer() not constructors (constructors run in the impl's own storage, not the proxy's). An uninitialized UUPS implementation that anyone can initialize + upgrade has been drained before — check it's locked (_disableInitializers)." },
      { title: "As an agent: assess upgrade risk", note: "A proxy means the code CAN change — check who the admin/owner is (an EOA? a multisig? a timelock?). An upgradeable token/vault controlled by a single EOA is a rug vector; a timelock-guarded one gives you exit time." },
    ],
    warnings: ["'Verified source' on a proxy shows the PROXY, not the implementation — always resolve and inspect the implementation address separately (it can be swapped after you check)."],
    references: ["https://eips.ethereum.org/EIPS/eip-1967", "https://docs.openzeppelin.com/upgrades-plugins"],
  },

  governance_attacks: {
    topic: "governance_attacks",
    title: "DAO governance risks: flash-loan votes, timelock analysis, malicious proposals",
    summary: "How on-chain governance gets attacked and what an agent checks before trusting a protocol's decentralization or acting on a proposal.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Flash-loan governance attacks", note: "If voting power = token balance measured at vote time, an attacker flash-borrows tokens, passes a malicious proposal, repays — all in patterns that snapshot-at-proposal (not at execution) mitigate. Check whether the Governor snapshots voting power at proposal creation (safe) or live (vulnerable)." },
      { title: "Read the timelock", note: "Legit governance routes passed proposals through a Timelock (a delay before execution). The delay is your exit window if a malicious proposal passes. NO timelock, or a short one, or an admin that can bypass it = the 'DAO' can rug instantly. Find the timelock + its delay." },
      { title: "Inspect a proposal's calldata BEFORE it executes", command: "decode the proposal's targets/calldata with the abi tool; simulate the effect", note: "Malicious proposals hide behind innocent descriptions — a 'treasury management' proposal that actually transfers funds or upgrades a contract to attacker code. Decode what it ACTUALLY calls (proxy_upgrade_patterns)." },
      { title: "Concentration = centralization", note: "Query token distribution (a few wallets holding quorum = they control the DAO), delegate concentration (Tally/Snapshot, dao_governance_data), and whether the team multisig can veto/execute unilaterally. 'Decentralized' with 3 whales isn't." },
      { title: "As an agent holding governance tokens", note: "Watch active proposals (Snapshot/Tally), and treat a passed-but-timelocked malicious proposal as a signal to EXIT before execution — the delay exists precisely for that." },
    ],
    warnings: ["A protocol can be technically sound but governance-captured — an upgradeable contract controlled by a capturable DAO is only as safe as its timelock + voter distribution."],
  },

  wash_trading_detection: {
    topic: "wash_trading_detection",
    title: "Detect wash trading & fake volume (NFTs and tokens)",
    summary: "The on-chain fingerprints of faked volume so an agent doesn't mistake manipulation for real liquidity/demand.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Why it matters", note: "Fake volume makes a token/collection look liquid and in-demand to lure buyers (and to farm reward/ranking systems). Trading on faked liquidity = you're the exit liquidity. Real volume ≠ reported volume." },
      { title: "Token wash-trade signals", note: "The same few wallets trading back and forth, buys and sells netting ~zero, volume concentrated in a handful of addresses, volume with no corresponding holder growth or price discovery, and round-number repetitive trades. Cross-check DexScreener volume against unique-trader count." },
      { title: "NFT wash-trade signals", note: "The same NFT flipped between related wallets at rising prices, sales funded from a common source, wallets with no other activity, and 'sales' where buyer+seller are the same entity (often to farm token rewards or fake a floor). Filter marketplace stats to arm's-length trades." },
      { title: "Verify with holder/flow analysis", command: "whale_watch (large transfers) + holder distribution + fund-source tracing (rugpull_forensics)", note: "Real demand shows broadening holders and organic price action; wash trading shows circular flows among a cluster. Discount volume that doesn't grow the holder base." },
      { title: "Agent rule", note: "Never size a position on reported volume alone. Require independent signals: unique holders growing, liquidity locked and paired with a real asset, and price action consistent with the volume." },
    ],
    warnings: ["Some 'volume' leaderboards and airdrop criteria are gamed by wash trading — don't trust a ranking as a quality signal; verify the underlying flows."],
  },

  rugpull_forensics: {
    topic: "rugpull_forensics",
    title: "Rugpull & scam forensics: the on-chain red flags before and after",
    summary: "The concrete signals that a token/protocol is a rug — beyond the automated security score — so an agent can avoid or diagnose one.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Start with the automated scan", command: "call tool \"security\" { chain, address }", note: "GoPlus + honeypot sim covers the common flags (honeypot, taxes, mint, blacklist). This guide is the JUDGMENT layer on top." },
      { title: "Ownership & control red flags", note: "Owner can mint unlimited supply, change fees/taxes arbitrarily, pause transfers, or blacklist sellers. A 'permanent delegate' (Solana Token-2022) or upgradeable proxy controlled by an EOA = issuer can take your funds. Renounced ownership is safer but not sufficient." },
      { title: "Liquidity red flags", note: "LP NOT locked (or lock expiring soon) → dev can pull liquidity anytime. Tiny liquidity vs market cap → one sell craters it. Liquidity paired with a worthless token instead of USDC/WETH/SOL → fake depth. Check lock via the LP token holder + a locker contract." },
      { title: "Holder & trade red flags", note: "Top-heavy holder distribution (dev/insiders hold most supply), lots of wallets funded from ONE source (Sybil for fake volume), buys succeed but sells fail (honeypot), organic-looking volume that's actually wash trading between a few wallets." },
      { title: "Post-mortem (diagnose a rug that happened)", command: "Trace via an explorer / whale_watch: the liquidity-removal tx, the mint-then-dump, or the upgrade tx that changed the logic", note: "Follow the funds to the exit (often a fresh wallet → bridge → CEX). The abi/simulate tools decode the malicious call; the pattern (who called what, when) is the evidence." },
    ],
    warnings: ["No single signal is proof — rugs combine several (unlocked LP + mint power + insider concentration). And a 'clean' token today can rug tomorrow if control isn't renounced/timelocked. Re-check before large exposure."],
  },

  solidity_security_patterns: {
    topic: "solidity_security_patterns",
    title: "Solidity security patterns: the vulnerability classes with before/after code",
    summary: "The bugs that drain contracts — reentrancy, access control, oracle trust, arithmetic, low-level calls — each with the wrong pattern and the fix.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Reentrancy → checks-effects-interactions", note: "WRONG: external call (or ETH send) BEFORE updating state — the callee re-enters and drains. RIGHT: update all state first, THEN interact; add a nonReentrant guard (OpenZeppelin ReentrancyGuard) on functions that make external calls. Watch cross-function and read-only reentrancy too (a view read during a callback returning stale state)." },
      { title: "Access control → explicit, not implicit", note: "WRONG: assuming a function is 'internal enough', or tx.origin for auth. RIGHT: onlyOwner/onlyRole (Ownable2Step, AccessControl); use msg.sender, NEVER tx.origin (phishable). Every state-changing privileged function needs an explicit modifier — and initializer functions must be guarded (initializer / _disableInitializers in the constructor for upgradeables, proxy_upgrade_patterns)." },
      { title: "Oracle trust → no single spot price", note: "WRONG: pricing off one AMM's reserves (flash-loan-movable in one tx). RIGHT: Chainlink feed with staleness + bounds checks, or a TWAP; cross-check sources. This is the most common drain vector — full playbook in price_oracle_safety." },
      { title: "Arithmetic & rounding → precision and direction", note: "Solidity ≥0.8 reverts on overflow (good), but DIVISION truncates: order operations to multiply-before-divide, and always round in the protocol's favor (ERC-4626 inflation attack = rounding shares the wrong way — round deposits DOWN, withdrawals such that the vault never loses). unchecked blocks re-open overflow risk — justify each one." },
      { title: "Low-level calls → check the return", note: "WRONG: ignoring the bool from address.call / not checking token transfer return. RIGHT: require(success) on raw calls; use SafeERC20 (safeTransfer/safeTransferFrom) because some tokens (USDT) don't return a bool and non-safe calls silently 'succeed'. Never assume an external call reverted just because it 'failed'." },
      { title: "Verify with tools, not vibes", command: "Slither (crytic/slither-action in CI, web3_ci_cd) for the static classes; forge invariant tests (foundry_invariant_testing) for the stateful ones; call tool \"simulate\" to dry-run the exact exploit tx", note: "Slither flags reentrancy/tx.origin/uninitialized-storage automatically. Invariants catch the accounting bugs. An audit catches the rest — tools reduce, don't eliminate, the audit surface." },
    ],
    warnings: [
      "The expensive bugs are usually COMPOSITIONS: reentrancy + a stale oracle, or a rounding error reachable only through a specific call sequence — which is exactly why invariant testing (fuzzed sequences) beats hand-written unit tests for security.",
      "Copy-pasting 'audited' snippets without understanding the trust assumptions (who can call, what it reads) reintroduces the same bug in a new context — patterns are a starting point, not a substitute for reasoning about YOUR flow.",
    ],
    references: ["https://github.com/crytic/slither", "https://docs.openzeppelin.com/contracts/5.x/security"],
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

  layerzero_oapp_messaging: {
    topic: "layerzero_oapp_messaging",
    title: "LayerZero V2 OApp: send & receive a cross-chain message (dev)",
    summary: "The OApp pattern for omnichain contracts — sending, receiving, quoting fees, and the trust/config traps that brick deployments.",
    scope: ["evm"],
    prerequisites: ["deploy_contract_evm", "crosschain_message_tracking"],
    steps: [
      { title: "The endpoint + EID model", note: "Every chain has ONE LayerZero V2 Endpoint (canonical 0x1a44076050125825900e736c501f859c50fE728c on most EVM chains, live-verified). You address a destination by its EID (endpoint id — LayerZero's own number, NOT chainId; look it up in the LZ deployments docs). Same address everywhere makes multichain deploys easy." },
      { title: "Inherit OApp", command: "contract MyOApp is OApp { constructor(address endpoint, address owner) OApp(endpoint, owner) Ownable(owner) {} }", note: "OApp (from @layerzerolabs/oapp-evm) wires the endpoint + ownership. You implement the send path and the _lzReceive handler." },
      { title: "Send", command: "_lzSend(dstEid, abi.encode(payload), options, MessagingFee(nativeFee, 0), payable(refundAddress)); — get the fee first via quote()", note: "options carry the destination gas (built with OptionsBuilder.addExecutorLzReceiveOption(gas, value)). ALWAYS quote() the native fee and pass it as msg.value — underpaying reverts, overpaying refunds to your refundAddress." },
      { title: "Receive", command: "function _lzReceive(Origin calldata origin, bytes32 guid, bytes calldata message, ...) internal override { require(msg.sender == endpoint); ... decode(message) ... }", note: "Only the endpoint may call it (enforced by OApp). Decode and act. The message is delivered once verified by your configured DVNs (decentralized verifier networks)." },
      { title: "Wire the peers — the #1 deploy failure", command: "setPeer(dstEid, bytes32(uint256(uint160(remoteOAppAddress)))) on BOTH chains", note: "Each OApp must register its counterpart's address per destination EID. Forget one side and messages send but never deliver (the classic 'source-confirmed, never arrived' — crosschain_message_tracking). Also set the DVN/executor config or delivery stalls." },
      { title: "Track & verify delivery", command: "LayerZero Scan: https://scan.layerzero-api.com/v1 by tx/GUID (keyless, live-verified)", note: "Source success ≠ destination delivery. Poll the scan or your _lzReceive side-effects; build idempotent handlers (tx_confirmation_patterns)." },
    ],
    warnings: [
      "Unconfigured or mismatched DVN/executor settings = messages that pay fees and silently never deliver — verify the full pathway config on testnet before mainnet (testnets_and_faucets).",
      "setPeer trust is absolute: a wrong or malicious peer address means you _lzReceive attacker-controlled messages — treat peer wiring like access control.",
    ],
    references: ["https://docs.layerzero.network/v2/developers/evm/oapp/overview"],
  },

  uniswap_v4_hook_development: {
    topic: "uniswap_v4_hook_development",
    title: "Building a Uniswap v4 hook: permission flags, the address mine, testing",
    summary: "How to actually write, address-mine, test and deploy a v4 hook — the parts that trip up every first implementation.",
    scope: ["evm"],
    prerequisites: ["uniswap_v4_basics", "foundry_invariant_testing"],
    steps: [
      { title: "Permissions are encoded in the hook ADDRESS", note: "v4 reads which callbacks a hook implements from the low bits of its address (e.g. BEFORE_SWAP_FLAG = 1<<7). You don't register permissions — you must DEPLOY the hook to an address whose bits match getHookPermissions(). This is the #1 thing newcomers miss." },
      { title: "Mine the address with CREATE2", command: "use HookMiner.find(deployer, flags, creationCode, constructorArgs) → (address, salt), then deploy with that salt via CREATE2", note: "HookMiner (from v4-periphery test utils) brute-forces a salt so the resulting CREATE2 address carries the right permission bits. Deterministic deploy → the mined address is where it lands (deterministic_deploys_create2)." },
      { title: "Implement only the callbacks you flagged", command: "contract MyHook is BaseHook { function getHookPermissions() returns (Hooks.Permissions memory) { ... beforeSwap: true ... } function _beforeSwap(...) internal override returns (bytes4, BeforeSwapDelta, uint24) { ... } }", note: "Return the correct selector; mismatched flags vs implemented functions revert at pool init. Use BaseHook so unflagged callbacks revert safely." },
      { title: "Handle deltas correctly (flash accounting)", note: "Hooks that move value return a BeforeSwapDelta/BalanceDelta the PoolManager settles at unlock. Get the sign wrong and you either revert (CurrencyNotSettled) or leak funds. Account for every currency you touch — this is where audits find the money bugs." },
      { title: "Test against a real PoolManager harness", command: "Foundry: deploy PoolManager in setUp(), use the v4-template's Deployers util to init a pool with your hook, then fuzz swaps/liquidity through it", note: "Run invariant tests (foundry_invariant_testing): 'hook never leaves currency unsettled', 'fees never exceed cap', 'no reentrancy into modifyLiquidity'. The v4-template repo is the canonical starting scaffold." },
      { title: "Security checklist before mainnet", note: "Access-control the privileged callbacks, guard against JIT-liquidity bypass if that's your fee model (jit_liquidity), no unbounded loops in swap-path callbacks (DoS), validate PoolKey so your hook isn't reused by a malicious pool, and reentrancy-guard external calls. A hook holds the pool's trust — treat it like a bridge (security tool + an audit)." },
    ],
    warnings: [
      "A deployed hook is part of the PoolKey forever — you can't 'upgrade' the pool's hook; ship it right or deploy a new pool. Bake upgradeability into the hook contract itself if you need it (proxy_upgrade_patterns).",
      "Address-mining flags wrong = pool init reverts at best, silent wrong behavior at worst. Assert the deployed address bits in your deploy script before seeding liquidity.",
    ],
    references: ["https://docs.uniswap.org/contracts/v4/guides/hooks/your-first-hook"],
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
      { title: "Chainlink CCIP", note: "For programmable cross-chain messages/token-transfers with Chainlink security: Router.ccipSend(destinationChainSelector, message). The destinationChainSelector is CCIP's OWN id, NOT the chainId — look it up. Router (Ethereum) 0x80226fc0…f7D (live-verified), per-chain addresses differ." },
      { title: "Prefer a router for the actual move", command: "call tool \"route\" (LiFi + deBridge), or Across for fast fills (reference kind='endpoints')", note: "Routers return the ready-to-sign tx AND abstract the delivery mechanism; use the scan APIs above to observe/debug an in-flight transfer." },
    ],
    warnings: ["Some bridges auto-redeem on the destination, others require a manual claim tx — check the specific bridge before assuming funds arrive by themselves.", "Every cross-chain protocol uses its OWN chain identifiers (CCIP chainSelector, CCTP domain, LayerZero eid) — never pass a raw chainId."],
  },

  onchain_perps_gmx: {
    topic: "onchain_perps_gmx",
    title: "Trade on-chain perps (GMX v2): the 2-step order model + keeper reality",
    summary: "How on-chain perpetual DEXes like GMX actually execute — you don't get a fill in your own transaction — and what that means for agents.",
    scope: ["evm"],
    prerequisites: ["Collateral (USDC/ETH) on Arbitrum or Avalanche"],
    steps: [
      { title: "Two-step execution (the key difference from a CEX)", note: "You submit a CreateOrder tx (via the GMX ExchangeRouter) with collateral + params; a KEEPER executes it a moment later at an oracle price. Your create tx does NOT fill the position — poll for the execution/cancellation event." },
      { title: "Order types", note: "MarketIncrease/Decrease (open/close at oracle price), LimitIncrease/Decrease, StopLoss. Position = (market, collateral, sizeInUsd, isLong). Leverage = sizeInUsd / collateralUsd." },
      { title: "Read market + price data", command: "GET https://arbitrum-api.gmxinfra.io/prices/tickers (keyless, live-verified) + on-chain DataStore reads via the GMX Reader", note: "Prices are dual (min/max) reflecting spread; funding + borrowing fees accrue continuously against your position." },
      { title: "Execution fee + slippage", note: "You prepay an execution fee for the keeper (refunded if unused). Set acceptablePrice — if the oracle moves past it before the keeper runs, the order CANCELS (funds returned) rather than filling at a bad price." },
      { title: "Alternatives", note: "Hyperliquid (its own L1, order-book perps, keyless API — perps_funding_data) is the other major venue. GMX = on-chain-native oracle pricing; Hyperliquid = CLOB speed." },
    ],
    warnings: ["Because a keeper executes later, an agent must handle the async gap: the position may open, cancel, or partially fill — never assume the create tx = a live position."],
    references: ["https://docs.gmx.io"],
  },

  yield_farming_mechanics: {
    topic: "yield_farming_mechanics",
    title: "Yield farming for real: LP returns, impermanent loss, reward decay",
    summary: "What actually determines whether an LP/farming position is profitable — the costs and risks that the headline APY hides.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Where the yield comes from", note: "Trading fees (organic, sustainable), token emissions (apyReward — often inflationary and decaying), and lending interest. Separate them: a farm living on emissions alone bleeds value as the reward token is sold (defi_yield_research)." },
      { title: "Impermanent loss (the hidden cost)", note: "Providing liquidity to a volatile pair means you end up with MORE of the loser and LESS of the winner vs just holding. IL grows with price divergence — a 2x move ≈ 5.7% IL, 4x ≈ 20%. Fees must out-earn IL for the position to beat holding." },
      { title: "Pick the pool for the risk", note: "Correlated/stable pairs (USDC/USDT, ETH/wstETH) have minimal IL — safest farming. Volatile pairs need high fee volume to compensate. Concentrated liquidity (Uniswap v3/v4) boosts fees but amplifies IL and needs active range management." },
      { title: "Net it out before entering", command: "call tool \"profitability\"; check pool history via yields.llama.fi/chart/{pool}", note: "Subtract: entry/exit gas, swap fees to build the LP, IL estimate, and reward-token price risk. Then compare to just holding or to a stableswap/4626 vault (lower effort)." },
      { title: "Auto-compounding vaults", note: "ERC-4626 vaults (erc4626_vaults) and Solana equivalents auto-harvest+reinvest rewards — less gas/effort than manual farming, at a small performance fee. Often the better risk-adjusted choice for an agent." },
    ],
    warnings: ["A 4-digit APY is almost always emissions that will collapse — and the reward token may be worth far less by the time you sell. Always model reward-token price decay, not just the quoted APY."],
    references: ["https://docs.uniswap.org/concepts/protocol/concentrated-liquidity"],
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

  solana_program_security: {
    topic: "solana_program_security",
    title: "Solana/Anchor program security: account validation, signers, PDAs, CPI",
    summary: "The Solana-specific bug classes that don't exist on EVM — missing owner/signer checks, PDA seed confusion, unchecked CPI — with the Anchor constraints that prevent them.",
    scope: ["solana"],
    prerequisites: ["anchor_program_interaction"],
    steps: [
      { title: "The core difference: YOU validate every account", note: "Solana passes accounts as untrusted input — the runtime does NOT check that an account is the one you expect. Missing validation is the #1 Solana exploit class (attacker passes a look-alike account). Anchor's #[account(...)] constraints ARE your security layer; a plain AccountInfo with no checks is a hole." },
      { title: "Owner & type checks", note: "Use typed accounts (Account<'info, MyState>) so Anchor verifies the account is owned by your program and deserializes the right type. For token accounts use Account<'info, TokenAccount> + constraints (token::mint, token::authority). A raw UncheckedAccount/AccountInfo must carry a /// CHECK justification and manual validation." },
      { title: "Signer & authority checks", command: "#[account(mut)] pub authority: Signer<'info>  +  #[account(mut, has_one = authority)] pub state: Account<'info, State>", note: "Signer<'info> enforces the account signed the tx. has_one = authority checks state.authority == authority.key(). Together: only the recorded authority can mutate the state. Forgetting has_one lets anyone with A signature act on anyone's state." },
      { title: "PDA derivation & bump discipline", command: "#[account(seeds = [b\"vault\", user.key().as_ref()], bump)] — and store/reuse the canonical bump", note: "Anchor re-derives and checks the PDA from seeds+bump. Use the CANONICAL bump (the one Anchor finds) and persist it; accepting an arbitrary bump lets an attacker derive a different valid address for the same seeds (bump seed canonicalization bug)." },
      { title: "CPI safety", note: "When cross-program-invoking, verify the program you're calling is the REAL one (Anchor's Program<'info, Token> checks the program id) — don't trust a program account passed by the caller. For privileged CPIs from a PDA use with_signer(seeds); never expose a CPI that lets arbitrary target programs run with your PDA's authority." },
      { title: "Other Solana-specific traps", note: "Account reinitialization (init_if_needed can be abused → prefer init + explicit checks), integer overflow (Rust debug panics but release wraps — use checked_add/checked_mul), duplicate mutable accounts (constraint against passing the same account twice), and remaining_accounts you don't validate. Fuzz with the Anchor test validator; audit is mandatory for value-holding programs." },
    ],
    warnings: [
      "An #[account] without constraints compiles fine and works in the happy path — the exploit only shows up when an attacker passes a substituted account. Test the ADVERSARIAL path, not just your own client.",
      "init_if_needed and UncheckedAccount are the two most-abused escape hatches — every use needs an explicit justification and manual validation, or it's a finding.",
    ],
    references: ["https://www.anchor-lang.com/docs/account-constraints", "https://github.com/coral-xyz/sealevel-attacks"],
  },

  account_abstraction_dev: {
    topic: "account_abstraction_dev",
    title: "Building AA infra: paymasters, session keys, 7702 batching (code)",
    summary: "The developer side of account abstraction — implementing gas sponsorship, scoped session keys and EIP-7702 batching that an agent wallet actually runs on.",
    scope: ["evm"],
    prerequisites: ["account_abstraction_4337 (the UserOp model)", "eip7702_smart_eoas"],
    steps: [
      { title: "ERC-20 paymaster: sponsor gas, charge in tokens", note: "A paymaster implements validatePaymasterUserOp (approve the op + pull a token deposit estimate) and postOp (settle the actual token cost). It must pre-stake ETH in the EntryPoint (depositTo) and hold enough balance. The account passes paymasterAndData in the userOp; the provider (Pimlico/Alchemy) exposes ready ERC-20 paymasters if you don't want to run your own." },
      { title: "Session keys = scoped, revocable agent authority", note: "A session key is a secondary signer the smart account authorizes for LIMITED actions (specific target contracts, function selectors, spend caps, expiry). Implement as a validation module (Safe modules, Kernel, or a 4337 validator plugin) that checks the call against the session's policy before allowing it. This is the AA-native version of Hyperliquid's API wallets (hyperliquid_trading) — the agent holds a key that can trade but not drain (wallet_security_checklist blast-radius)." },
      { title: "EIP-7702: batch + sponsor from a plain EOA", command: "viem: const auth = await walletClient.signAuthorization({ contractAddress: delegateImpl }); then send an EIP-7702 tx whose authorizationList=[auth] — the EOA temporarily runs the delegate's code", note: "Lets an existing EOA execute a batch (approve+swap in one) or be sponsored WITHOUT migrating to a new smart-account address (eip7702_smart_eoas for the delegation-persistence + chainId-0 takeover warnings)." },
      { title: "Test the stack", command: "Pimlico public bundler https://public.pimlico.io/v2/{chainId}/rpc (live-verified, keyless for testing) + permissionless.js; run on a testnet (testnets_and_faucets) before mainnet", note: "eth_estimateUserOperationGas then eth_sendUserOperation; simulate the inner call (simulate tool) so a bad batch fails before it's bundled." },
      { title: "Security gotchas that lose funds", note: "Paymaster: unbounded sponsorship = someone drains your ETH stake — scope policies and rate-limit. Session keys: over-broad selectors/targets = the 'limited' key isn't limited; always cap spend + expiry. 7702: a malicious delegate address is a full account takeover — only sign authorizations for audited implementations." },
    ],
    warnings: [
      "A paymaster with a weak validatePaymasterUserOp is a faucet for attackers — validate WHAT you sponsor (target, calldata, sender allowlist), not just that the op is well-formed.",
      "Session-key policies are only as safe as their tightest scope: 'any call to the DEX router' still lets an approval-drain through — enumerate selectors and cap amounts.",
    ],
    references: ["https://docs.pimlico.io", "https://viem.sh/docs/eip7702"],
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

  balancer_swaps: {
    topic: "balancer_swaps",
    title: "Balancer v2/v3: batch swaps, weighted pools, 0-fee flash loans",
    summary: "How an agent quotes and executes swaps against the Balancer Vault directly — and when to use it over an aggregator.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Know the architecture", note: "Balancer v2 keeps ALL pool liquidity in ONE Vault (0xBA12222222228d8Ba445958a75a0704d566BF2C8, live-verified byte-identical on Ethereum/Arbitrum/Base). Pools only do math; tokens sit in the Vault. A v2 poolId is 32 bytes: pool address (20) + specialization (2) + nonce (10) — the first 20 bytes ARE the pool contract." },
      { title: "Discover pools", command: 'POST https://api-v3.balancer.fi/ {"query":"{ poolGetPools(first:10, where:{chainIn:[MAINNET]}, orderBy: totalLiquidity, orderDirection: desc){ id name type dynamicData{ totalLiquidity } } }"}', note: "Keyless GraphQL (live-verified). type: WEIGHTED (e.g. 80/20), STABLE, GYROE… Weighted 80/20 pools reduce impermanent loss for the dominant asset — that's why veBAL uses 80BAL/20WETH." },
      { title: "Read a pool's tokens on-chain", command: "Vault.getPoolTokens(poolId) → (tokens[], balances[], lastChangeBlock)", note: "Live-verified against the veBAL pool. Token order here defines the assets[] indices for swaps." },
      { title: "Quote via queryBatchSwap (eth_call only!)", command: "Vault.queryBatchSwap(kind, swaps[], assets[], funds) → int256[] assetDeltas", note: "kind: 0=GIVEN_IN, 1=GIVEN_OUT. swaps[] = {poolId, assetInIndex, assetOutIndex, amount, userData:'0x'}. Deltas are signed from the VAULT's perspective: positive = you pay, negative = you receive. Live-verified: 0.1 WETH GIVEN_IN → ~1868 BAL. The function is declared state-changing — call it with eth_call/simulate, NEVER send it as a transaction." },
      { title: "Execute with batchSwap", command: "Vault.batchSwap(kind, swaps, assets, funds, limits, deadline)", note: "funds = {sender, fromInternalBalance:false, recipient, toInternalBalance:false}. limits[] = per-asset signed caps (max in / min out — derive from the query minus slippage), deadline = unix timestamp. Multi-hop routes chain several swap steps through one settlement (cheaper than sequential swaps)." },
      { title: "v3 is different", note: "v3 Vault 0xbA1333333333a1BA1108E8412f11850A5C319bA9 (live-verified, Ethereum): you interact via its Router (resolve current address from docs.balancer.fi deployments — don't hardcode), pools are plain ERC-20 addresses (no 32-byte poolIds), and boosted pools auto-lend idle liquidity. The GraphQL API covers both versions." },
      { title: "Or just route", note: "For best-price execution across ALL DEXes use this server's route tool or an aggregator (aggregator_swaps). Direct Vault interaction wins when you target a specific pool (LBP entries, veBAL, custom weighted pools) or need its 0-fee flash loans (flash_loans guide)." },
    ],
    warnings: [
      "queryBatchSwap as a real transaction wastes gas and settles nothing useful — it's a simulation helper. Always eth_call it.",
      "batchSwap without tight limits[] and deadline is MEV bait — a sandwich bot will take the slack (mev_strategies has the defense playbook).",
    ],
    references: ["https://docs.balancer.fi"],
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

  playbook_memecoin_launch_analysis: {
    topic: "playbook_memecoin_launch_analysis",
    title: "PLAYBOOK: analyze a fresh memecoin launch in 5 calls (Solana + EVM)",
    summary: "The decision tree for a just-launched token: curve state, security, holders, liquidity — with abort conditions at every step.",
    scope: ["all"],
    prerequisites: ["token_launch_mechanics (how launches work)"],
    steps: [
      { title: "1 — Curve state (is it even tradeable yet?)", command: 'Solana: call tool "pumpfun" { "mint": "<mint>" } → bonding-curve progress + graduation status. BNB: four.meme progress toward the ~18-BNB graduation (bnb_chain_playbook)', note: "Pre-graduation = curve pricing, thin exits, antisniper taxes possible. Post-graduation = real AMM pool, normal rules. Know which regime you're in before anything else." },
      { title: "2 — Security scan", command: 'call tool "security" { "chain": …, "address": … }', note: "ABORT on: honeypot flag, mint authority live (Solana: mint/freeze not revoked), owner can blacklist/upgrade, sell tax >10%. On Solana also check Token-2022 transfer hooks (pumpfun_token2022_gotchas)." },
      { title: "3 — Holder concentration", command: "Solana: DAS getTokenAccounts / Helius. EVM: Blockscout /api/v2/tokens/{addr}/holders (keyless where available)", note: "Top-10 holders >30% (excluding curve/LP) = one seller controls the chart. Fresh-wallet clusters funded from one source = the dev's sybil bags (wash_trading_detection)." },
      { title: "4 — Liquidity reality", command: "GET https://api.dexscreener.com/latest/dex/tokens/{token}", note: "LP burned/locked? Volume real or wash (volume >> unique traders = fake)? Your exit size vs pool depth decides max position." },
      { title: "5 — Decide + execute small", note: "All green → playbook_pre_trade_check steps 3-4 (simulate + protected execution), position sized to the SELL side. Any red → skip; there are hundreds of launches per day, the edge is selectivity, not speed (sniping_launches for the speed game)." },
    ],
    warnings: ["Most launches are designed to extract from exactly this kind of analysis-lite buyer: passing 4 of 5 checks is a FAIL. The playbook is a veto chain, not a scorecard."],
    references: ["https://api.dexscreener.com"],
  },

  playbook_cross_chain_arbitrage: {
    topic: "playbook_cross_chain_arbitrage",
    title: "PLAYBOOK: cross-chain price gap — detect, cost out, execute (5 tool calls)",
    summary: "The full chain from spotting a cross-venue price gap to a costed, simulated, tracked execution — and why most detected gaps die in step 3.",
    scope: ["all"],
    prerequisites: ["arbitrage_basics (the cost framework)"],
    steps: [
      { title: "1 — Detect the gap from independent sources", command: "DEX leg: GET https://api.dexscreener.com/latest/dex/tokens/{token} · reference leg: CEX public data (Binance/Coinbase/Kraken endpoint) or DefiLlama prices", note: "A 'gap' measured from one indexer is often just a stale cache. Two independent quotes or it doesn't exist (price_oracle_safety)." },
      { title: "2 — Cost the whole route BEFORE moving", command: 'call tool "profitability" { … } — include both swap fees, bridge fee, gas on BOTH chains (L2s: L1 data fee, opstack_l2_fees), slippage at your size', note: "This is where most gaps die: a 0.8% gap minus 2×0.25% swap fees minus bridge fee minus gas is usually negative." },
      { title: "3 — Get the bridge route", command: 'call tool "route" { "fromChain": …, "toChain": …, "fromToken": …, "amount": … } → LiFi + deBridge in parallel, best + alternatives, unsigned tx', note: "Bridge time (seconds–minutes) is your exposure window — the gap can close in transit. Cross-chain arb is NOT atomic (arbitrage_basics)." },
      { title: "4 — Simulate both legs", command: 'call tool "simulate" on the swap legs; inspect the route tool unsigned txs before signing', note: "A reverted leg = a one-sided directional position, not an arb." },
      { title: "5 — Execute + track to completion", command: "Bridge status: deBridge /Orders tracking or Across /deposit/status; confirm balances on BOTH chains via the portfolio tool", note: "Idempotent state machine per tx_confirmation_patterns — detect bridge limbo instead of double-sending; log realized vs expected PnL to calibrate profitability inputs." },
    ],
    warnings: ["Pre-positioned inventory on both chains turns this into two local swaps — the professional version. Bridging inside the arb loop is the beginner version that pays the exposure window."],
    references: ["https://docs.debridge.finance", "https://docs.across.to"],
  },

  playbook_pre_trade_check: {
    topic: "playbook_pre_trade_check",
    title: "PLAYBOOK: the pre-trade check — never buy a token blind (4 tool calls)",
    summary: "The exact tool-call sequence this server recommends before ANY token buy — rug scan, liquidity reality, dry-run, protected execution.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "1 — Security scan (kills 90% of bad trades)", command: 'call tool "security" { "chain": "<chain>", "address": "<token>" }', note: "0-100 risk score from GoPlus + honeypot.is: honeypot flags, buy/sell tax, owner powers (mint/blacklist/upgrade), LP lock. Hard rules: honeypot → abort; sell tax >10% → abort unless you explicitly trade taxed tokens; owner can mint/blacklist → treat as rug-capable (rugpull_forensics)." },
      { title: "2 — Liquidity & price reality", command: "GET https://api.dexscreener.com/latest/dex/tokens/{token} (keyless)", note: "Real pool depth, 24h volume, price impact for YOUR size. A token you can buy but not SELL at size is a soft honeypot — size ≤ what the sell side absorbs (token_discovery has the full checklist)." },
      { title: "3 — Dry-run the exact trade", command: 'call tool "simulate" { "chain": "<chain>", "from": "<you>", "to": "<router>", "data": "<swap calldata>" } — or for Solana: call tool "solana_swap" (Jupiter builds the unsigned tx) and inspect it', note: "Catches reverts, unexpected taxes and approval issues BEFORE gas is spent; decode unknown calldata with the abi tool first." },
      { title: "4 — Execute protected", command: 'call tool "mev_protection" { "chain": "<chain>" } → use the returned private RPC (Flashbots/MEV-Blocker) or Jito bundle on Solana', note: "Tight slippage + deadline; verify the fill afterwards via portfolio. Full defense rationale: mev_strategies." },
    ],
    warnings: ["No single step substitutes for the others: a clean security scan with thin liquidity, or deep liquidity with an unverified proxy owner, are both losing trades. The sequence is the product."],
    references: ["https://api.dexscreener.com"],
  },

  ethena_usde_mechanics: {
    topic: "ethena_usde_mechanics",
    title: "Ethena USDe/sUSDe: the delta-hedged 'synthetic dollar' and its real risks",
    summary: "Where the sUSDe yield actually comes from (perp funding, not lending), the verified contracts, and why the loop unwinds violently when funding flips.",
    scope: ["evm"],
    prerequisites: ["basis_trade (funding-rate mechanics)", "stablecoin_mechanics"],
    steps: [
      { title: "The mechanism", note: "USDe is backed by a DELTA-NEUTRAL position: long stETH/BTC collateral + short the equivalent perp — price risk cancels, and the position EARNS the funding rate (shorts collect when funding is positive) plus staking yield. It is a tokenized basis trade (basis_trade), not a lending product." },
      { title: "Verified contracts (Ethereum)", note: "USDe 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3, sUSDe 0x9D39A5DE30e57443BfF2A8307A4256c8797A3497 — both symbol()-verified, and sUSDe.asset() == USDe cross-verified on-chain. sUSDe is a standard ERC-4626 vault (deposit USDe → yield-accruing shares; erc4626_vaults applies 1:1)." },
      { title: "What an agent does with it", note: "Hold sUSDe for passive basis yield — but check the CURRENT funding regime first (Hyperliquid predictedFundings / Binance funding via the CEX endpoint): the yield is variable and can go NEGATIVE. sUSDe PT on Pendle = the fixed-rate version of the same trade (pendle_yield_tokenization)." },
      { title: "Monitor like a stablecoin, think like a perp desk", command: "GET https://stablecoins.llama.fi/stablecoins?includePrices=true (USDe listed) + live funding from CEX/Hyperliquid endpoints", note: "The peg holds while the hedge works; the yield holds while funding is positive. Extended negative funding drains the reserve fund and compresses sUSDe APY toward zero." },
    ],
    warnings: [
      "Looped sUSDe collateral (deposit → borrow stable → buy more sUSDe) stacks liquidation risk on funding risk: when funding flips negative, APY collapses AND collateral derisks simultaneously — the ezETH-cascade lesson (restaking_eigenlayer) applies.",
      "USDe is NOT fiat-backed: exchange counterparty risk and reserve-fund depth are the real backing — read current attestations before treating it as 'a stablecoin' (tokenized_treasuries for contrast).",
    ],
    references: ["https://docs.ethena.fi"],
  },

  pendle_yield_tokenization: {
    topic: "pendle_yield_tokenization",
    title: "Pendle: split yield into PT + YT (fixed yield vs leveraged yield bets)",
    summary: "How yield tokenization works, what an agent can actually do with PT/YT, and the expiry mechanics that decide the trade.",
    scope: ["evm"],
    prerequisites: ["erc4626_vaults (share/asset mental model)"],
    steps: [
      { title: "The split", note: "A yield-bearing asset (stETH, sUSDe, LP shares) gets wrapped into SY, then split: PT (principal token — redeems 1:1 for the underlying AT EXPIRY) + YT (yield token — receives ALL the yield until expiry, then goes to zero). PT + YT = SY, always." },
      { title: "The two basic trades", note: "FIXED YIELD: buy PT below par — a PT trading at 0.95 that redeems at 1.00 in 6 months locks ~10% APY regardless of where the variable rate goes. LEVERAGED YIELD: buy YT — you pay a small price for the FULL yield stream of one unit; if realized yield beats what you paid, you profit (and vice versa — YT can easily go to ~0)." },
      { title: "Find markets + addresses (keyless, live-verified)", command: "GET https://api-v2.pendle.finance/core/v1/{chainId}/markets/active → [{name, address, expiry, pt, yt, sy}]", note: "Implied APY (what the AMM currently prices) vs your view of the underlying APY IS the trade. Pendle's hosted SDK routes return ready calldata for swaps/LP — pair with the simulate tool before signing." },
      { title: "Expiry discipline", note: "PT converges to par at expiry (your fixed yield realizes). YT decays to zero — holding YT past its yield-collection value is pure loss. LPing a Pendle AMM earns fees + rewards but carries both PT-price and impermanent-loss risk until expiry." },
    ],
    warnings: [
      "YT is a decaying asset by construction — never 'hold and forget' a YT position; the value goes to zero at expiry with mathematical certainty (only collected yield remains).",
      "PT fixed yield is fixed only if held to expiry — selling early is a rates trade, and thin markets gap (defi_yield_research for the underlying-APY leg).",
    ],
    references: ["https://api-v2.pendle.finance/core/docs", "https://docs.pendle.finance"],
  },

  restaking_eigenlayer: {
    topic: "restaking_eigenlayer",
    title: "Restaking: EigenLayer, LRTs (weETH/ezETH) and the stacked-risk model",
    summary: "How restaking reuses staked-ETH security for extra yield, the three entry paths, and why an agent must price the stacked risks — not just the APY.",
    scope: ["evm"],
    prerequisites: ["eth_staking (stETH/wstETH model)"],
    steps: [
      { title: "The idea", note: "Restaking pledges already-staked ETH as security for additional services (AVSs — data availability, oracles, bridges…). Extra yield for extra slashing exposure: an operator misbehaving on an AVS can burn part of your stake. It is leverage on TRUST, not on capital." },
      { title: "Three entry paths", note: "(a) NATIVE: run a validator whose withdrawal credentials point to an EigenPod — full control, 32-ETH granularity. (b) LST restaking: deposit stETH & co into an EigenLayer Strategy. (c) LRT: hold a Liquid Restaking Token (weETH = ether.fi, ezETH = Renzo — both live-verified via symbol()) and let the protocol do (a)/(b). Most agents touch only (c)." },
      { title: "LST deposit flow (path b)", command: "approve(StrategyManager, amount) → StrategyManager.depositIntoStrategy(strategy, token, amount) → shares; then DelegationManager.delegateTo(operator, …)", note: "Core contracts (all proxies, live-verified): StrategyManager 0x858646372CC42E1A627fcE94aa7A7033e7CF075A, DelegationManager 0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A, stETH-Strategy 0x93c4b944D05dfe6df7645A86cd2206016c51564D (underlyingToken() = stETH, cross-verified). Delegating picks WHOSE operator behavior you're exposed to — that choice IS the risk decision." },
      { title: "Withdrawals are queued", note: "Exit = queueWithdrawal → wait the protocol withdrawal delay (days, parameter-dependent) → completeQueuedWithdrawal. No instant exit at the protocol level; the instant path is selling the LRT on a DEX at whatever discount the market charges." },
      { title: "Price LRTs like a risk asset, not like ETH", note: "An LRT stacks FOUR risk layers: ETH staking + LST contract + EigenLayer contracts + LRT protocol (plus operator/AVS slashing). ezETH famously depegged ~2% in April 2024 on an airdrop announcement — thin DEX liquidity plus leveraged loopers = gap risk. Price via oracle/DEX quote (price_oracle_safety), never assume 1:1, and check DEX depth before sizing (token_discovery)." },
      { title: "Where the yield data lives", command: "GET https://yields.llama.fi/pools → filter project ilike 'ether.fi'/'renzo'/'eigen'", note: "Compare LRT APY vs plain wstETH: the restaking premium is often small — if the spread doesn't pay for the extra risk layers, plain LST staking wins (defi_yield_research: apyBase vs apyReward — points/airdrop hopes are not cash flow)." },
    ],
    warnings: [
      "Looped LRT strategies (deposit LRT as collateral → borrow ETH → buy more LRT) turn a 2% depeg into a liquidation cascade — the April-2024 ezETH event liquidated exactly those loops (defi_lending health-factor discipline applies doubly).",
      "AVS slashing is the tail risk everyone ignores while farming points: read WHICH AVSs an operator/LRT secures before delegating — 'restaked' does not mean 'diversified'.",
    ],
    references: ["https://docs.eigenlayer.xyz"],
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

  copy_trading_bots: {
    topic: "copy_trading_bots",
    title: "Copy-trading bots: mirror smart-money wallets safely",
    summary: "How to find wallets worth copying, mirror their trades with proper sizing, and avoid the traps that make naive copy-bots lose.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Find wallets worth following", note: "Screen by realized PnL + consistency, not one lucky trade. Sources: DexScreener/GeckoTerminal top traders, on-chain PnL via a subgraph/Dune, or watching wallets that repeatedly enter before pumps. Verify the track record over months, not days." },
      { title: "Watch their activity in real time", command: "EVM: subscribe to the wallet's txs (mempool or new-block filter); Solana: onLogs / getSignaturesForAddress polling (solana_subscriptions)", note: "You must see the trade fast — copiers who lag get worse fills than the leader." },
      { title: "Size relative to YOUR book, not theirs", note: "Never mirror absolute amounts (a whale's $100k is your ruin). Scale by a fixed % of your capital per trade, with a per-token cap. Blocklist obvious wash/self-trades and their known-scam tokens." },
      { title: "Gate every copied token through safety", command: "call tool \"security\" before mirroring a buy", note: "Leaders sometimes buy their own rugs or get exit-liquidity. A copy-bot without a rug filter is a honeypot funnel (rugpull_forensics)." },
      { title: "Exit logic is yours", note: "Copy entries is easy; exits are where copiers lose — the leader may sell in a venue/size you can't mirror, or off-chain. Define your own take-profit/stop rather than waiting to see their sell." },
    ],
    warnings: ["The leader knows they're being copied and can bait copiers (buy to attract, then dump into them). Treat copied signals as ONE input, not gospel."],
  },

  sniping_launches: {
    topic: "sniping_launches",
    title: "Sniping token launches: EVM new-pairs vs Solana pump.fun (fast + safe)",
    summary: "How launch snipers detect and buy new tokens at block zero — and why speed without safety just funds rugs.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Detect the launch", note: "EVM: watch the factory for PairCreated/PoolCreated events (or the mempool for the addLiquidity tx to frontrun the open). Solana: onLogs the pump.fun program for new-mint events (solana_subscriptions, pumpfun_token2022_gotchas)." },
      { title: "Speed decides the fill", note: "EVM: high priority fee + private submission (so you're not frontrun) + pre-signed tx templates. Solana: priority fee + Jito bundle (reference kind='endpoints') to land in the same slot. Milliseconds and fees separate winners from bag-holders." },
      { title: "Safety in the same breath", command: "call tool \"security\" { chain, address } + check LP lock + honeypot sim BEFORE buying", note: "Most launches are rugs. A sniper that skips the rug check to save 50ms is just faster at losing money. Set max buy tax, require locked LP, cap position." },
      { title: "Have an exit before you enter", note: "Set a take-profit ladder and a hard stop. Snipes spike then dump — decide your sell BEFORE buying, and make sure the token is actually SELLABLE (honeypot sim) or your 'gain' is unrealizable." },
      { title: "Pre-create accounts (Solana)", note: "Pre-make ATAs and warm any ALTs so the buy tx is minimal and fast; rent + fees on the hot path cost you the race (spl_token_basics)." },
    ],
    warnings: ["Frontrunning the liquidity-add on EVM can revert or buy into a honeypot before sells are enabled — extreme risk. Sniping is the highest-loss-rate bot type; size tiny."],
  },

  grid_dca_bots: {
    topic: "grid_dca_bots",
    title: "Grid & DCA bots: the low-risk, no-latency-race strategies",
    summary: "Range-based and time-based accumulation bots — the safest automated strategies for an agent, and how to set them up.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "DCA (dollar-cost averaging)", note: "Buy a fixed amount on a schedule regardless of price. Zero latency race, minimal skill — just automate a recurring swap (aggregator_swaps / solana_swap) with a cron. Best for accumulating a long-term position without timing risk." },
      { title: "Grid trading", note: "Place staggered buy orders below and sell orders above a price range; each fill flips into the opposite order. Profits from RANGE-BOUND chop. On-chain you emulate it with limit orders (some DEXes) or a bot that swaps at grid levels." },
      { title: "Set the range from volatility, not hope", note: "Grid works when price oscillates inside your range; a trend blows through one side and leaves you fully in the losing asset. Set bounds from recent volatility (ATR-like) and cap total capital per side." },
      { title: "Costs still apply", note: "Every grid fill pays gas + swap fees — on expensive chains that eats thin grid margins. Prefer L2s/Solana for grid density; net fees before setting grid spacing (profitability tool)." },
      { title: "Why agents like these", note: "No mempool race, no frontrun risk, deterministic logic — the easiest to run reliably 24/7. The tradeoff is capped upside vs directional bets." },
    ],
    warnings: ["Grid bots quietly accumulate the falling asset in a downtrend ('catching a knife') — pair with a trend filter or a hard stop on the whole grid."],
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

  token_launch_mechanics: {
    topic: "token_launch_mechanics",
    title: "Token launch mechanics: bonding curves, fair launch, LBPs",
    summary: "How tokens actually come to market — the models, their price dynamics, and what each means for a buyer or a launcher.",
    scope: ["evm", "solana"],
    prerequisites: [],
    steps: [
      { title: "Bonding curve (pump.fun style)", note: "Price rises deterministically as supply is bought along a curve; once a market-cap threshold is hit the token 'graduates' to a real DEX pool with the accumulated liquidity. Early buyers pay less — which is why snipers race the first block (sniping_launches, pumpfun_token2022_gotchas)." },
      { title: "Fair launch", note: "No pre-sale/pre-mine; everyone buys from the same starting point (often a bonding curve or an open LP add). 'Fair' in theory — in practice bots + snipers get block-zero advantage, so retail rarely gets the bottom." },
      { title: "Liquidity Bootstrapping Pool (LBP)", note: "A Balancer weighted pool that starts weighted heavily toward the token and shifts over time, pushing price DOWN if demand is flat — designed to deter snipers/whales (buying early is expensive and mean-reverts). Used for more equitable price discovery." },
      { title: "Pre-sale / IDO", note: "Tokens sold before listing at a fixed price, then TGE (token generation event) + vesting. Watch the unlock schedule — a low float + big cliff unlocks = sell pressure later (defi_yield_research emissions logic applies)." },
      { title: "As a buyer: the checklist", command: "call tool \"security\" + check LP lock + supply distribution + unlock schedule", note: "New launches are the highest-scam-density surface. Verify sellability (honeypot sim), who holds supply, and whether liquidity is locked before touching it (rugpull_forensics)." },
    ],
    warnings: ["'Fair launch' is a marketing term, not a guarantee — insiders/snipers routinely capture the early supply. Assume you are NOT first and price your entry accordingly."],
    references: ["https://docs.balancer.fi/concepts/pools/liquidity-bootstrapping.html"],
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

  flash_loans: {
    topic: "flash_loans",
    title: "Flash loans: borrow millions with no collateral (uses & the atomic rule)",
    summary: "The one-transaction uncollateralized loan primitive — how it works, which providers are cheapest, and the legitimate use cases.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "The atomic rule", note: "You borrow, do arbitrary things, and repay + fee — ALL in one transaction. If you don't repay by the end, the whole tx reverts as if nothing happened. That's why no collateral is needed: the protocol is never at risk." },
      { title: "Providers & fees", note: "Balancer v2 Vault (0xBA12…2C8, live-verified): 0% fee — the cheapest. Aave v3 Pool (0x8787…4E2): ~0.05%. Morpho: callback-based, free on Blue. Uniswap v3/v4 flash via swap callbacks. Pick by fee + which token has depth." },
      { title: "Legitimate uses", note: "Liquidations (borrow the repay asset, seize collateral, repay — liquidation_bots), arbitrage (borrow, arb across DEXes, repay — arbitrage_basics), collateral swaps (avoid unwinding a position), and self-liquidation to exit safely. NOT a money printer — you still need a profitable strategy inside." },
      { title: "The pattern", command: "vault.flashLoan(receiver, tokens, amounts, userData) → your receiver's callback runs → do the strategy → approve repayment → return", note: "Implement the provider's callback interface (receiveFlashLoan / executeOperation). Simulate the whole thing first (simulate tool) — a revert costs gas for nothing." },
      { title: "Risk framing", note: "Flash loans remove the CAPITAL requirement, not the COSTS (fee + gas + slippage) or the STRATEGY risk. They're also the tool of choice for oracle-manipulation attacks — which is why you price against manipulation-resistant oracles (price_oracle_safety)." },
    ],
    warnings: ["A flash-loan strategy that isn't atomically profitable just reverts and wastes gas — there's no 'partial' outcome. Model every cost before deploying."],
    references: ["https://docs.aave.com/developers/guides/flash-loans"],
  },

  airdrop_farming: {
    topic: "airdrop_farming",
    title: "Airdrop farming: earn eligibility without getting Sybil-flagged",
    summary: "How airdrops actually select recipients and the patterns that get farmers either rewarded or filtered out.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "What projects actually reward", note: "Genuine usage over time: real volume, providing liquidity, bridging, holding through volatility, governance participation, multi-week activity. Snapshot dates are usually SECRET and retroactive — you can't cram the day before." },
      { title: "How Sybil filters work", note: "Projects cluster wallets by funding source (all funded from one address/CEX withdrawal in a batch), identical behavior/timing, tiny uniform amounts, and no organic activity. Clustered wallets get ZEROED — the most common farmer failure." },
      { title: "Legitimate multi-wallet hygiene (if you do it)", note: "Independent funding paths, varied amounts and timing, genuinely different usage per wallet, real holding periods. This is operationally expensive — and many projects now explicitly penalize obvious multi-accounting. One well-used wallet often beats 50 farmed ones." },
      { title: "Find opportunities without the noise", note: "Target protocols that are live, unincentivized, VC-backed and token-less (the classic setup). Track via the community, not 'airdrop lists' (which flood the target with Sybils and lower per-user allocation)." },
      { title: "Costs are real", note: "Gas across many wallets/chains + capital at risk + time. Model expected value soberly: most farmed airdrops underpay vs the gas+opportunity cost, and unlock/vesting can gut the headline number." },
    ],
    warnings: ["Interacting with an unaudited 'airdrop' contract to 'claim' is a top scam vector — verify the contract (abi/security tools) before signing; fake claim sites harvest approvals/Permit2 signatures."],
  },

  stablecoin_mechanics: {
    topic: "stablecoin_mechanics",
    title: "Stablecoin mechanics: fiat-backed vs crypto-backed vs algo, and depeg signals",
    summary: "How each stablecoin type holds its peg, where the risk sits, and the on-chain signals that warn of a depeg before the price moves.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Fiat-backed (USDC, USDT)", note: "1:1 reserves at a custodian, redeemable by authorized parties. Risk = issuer/banking (USDC briefly depegged when reserves sat in a failed bank). Trust the attestations + redemption path; on-chain it's just an ERC-20." },
      { title: "Crypto-backed (DAI, crvUSD, GHO)", note: "Over-collateralized by crypto in vaults; peg held by liquidations + arbitrage. Risk = collateral crash faster than liquidations clear (bad debt). Watch the collateralization ratio and the backing mix (DAI holds significant USDC → inherits its risk)." },
      { title: "Algorithmic / hybrid", note: "Peg via mint/burn incentives, sometimes under-collateralized. Historically fragile (UST collapse = death spiral when the arb broke). Treat purely-algo pegs as high-risk; hybrids (partial collateral) sit in between." },
      { title: "Depeg early-warning signals (on-chain)", command: "stablecoins.llama.fi (peg price per coin) + Curve pool balances (get_virtual_price / imbalance, stableswap_pools)", note: "A stableswap pool going heavily imbalanced toward one coin = the market dumping the OTHER = depeg in progress, often BEFORE the aggregated price reflects it. Falling protocol collateralization is the crypto-backed warning." },
      { title: "Agent rule", note: "Don't treat 'stablecoin' as 'always $1'. Price it (DefiLlama/oracle), check the pool health, and prefer the most battle-tested (USDC/USDT/DAI) for treasury; size exposure to riskier ones accordingly." },
    ],
    warnings: ["Bridged/wrapped stablecoins (USDC.e, multichain variants) carry BRIDGE risk on top of issuer risk — a bridge hack can depeg the wrapped version while native is fine. Know which one you hold (addresses reference)."],
    references: ["https://docs.llama.fi"],
  },

  jit_liquidity: {
    topic: "jit_liquidity",
    title: "JIT liquidity & Uniswap v3/v4 LP strategy: why passive LPs earn less than expected",
    summary: "Just-in-time liquidity mechanics on concentrated-liquidity DEXes, what v4 hooks change, and what it means whether you run it or LP against it.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Concentrated liquidity is the precondition", note: "On Uniswap v3 (NonfungiblePositionManager 0xC36442b4a4522E871399CD717aBDD847Ab11FE88, live-verified 'Uniswap V3 Positions NFT-V1') an LP chooses a tick range. Fees from a swap go only to positions ACTIVE at the traded ticks, pro-rata to their liquidity share — that's the lever JIT exploits." },
      { title: "The JIT play (3 steps, 1 block)", note: "A searcher spots a large pending swap → (1) mint a huge position in a razor-thin range around the current tick, (2) the target swap executes and pays fees almost entirely to that fresh position, (3) burn the position + collect. Requires bundle atomicity (Flashbots on EVM) so steps can't be separated or front-run; inventory risk exists only within that block." },
      { title: "The economics", note: "Profit = swap fees captured + spread vs impermanent move during the swap − gas (3 heavy txs) − bundle tip. Only large swaps on high-fee-tier pools clear that bar; in practice JIT concentrates on a handful of blue-chip pools (ETH/USDC 5bps+). It does NOT steal from the swapper — the swapper often gets a slightly BETTER price (more depth); it dilutes the fees of passive LPs in that pool." },
      { title: "If you LP passively, price this in", note: "On pools with active JIT competition, realized fee APR for passive ranges is materially below the naive volume×fee estimate — the biggest swaps (most fees) get JIT-diluted. Check realized fee growth of your own position (collect-simulation) instead of pool-level averages, and prefer pools/fee tiers where JIT is uneconomical (smaller swaps, exotic pairs)." },
      { title: "What v4 hooks change", note: "On v4 (PoolManager singleton 0x000000000004444c5dc75cB358380D2e3dE08A90, live-verified) each pool can attach a hook contract; which callbacks it implements is encoded in the hook ADDRESS bits. Hooks can charge dynamic fees, restrict who can add liquidity in-range, add TWAMM/auction order flow, or explicitly neutralize JIT (e.g. minimum-hold-time or fee-share rules for fresh liquidity). Read a pool's hook before assuming v3-style LP economics (uniswap_v4_basics)." },
      { title: "Running JIT yourself — the realistic bar", note: "You compete with established searchers on latency, mempool visibility (private order flow!), gas efficiency and bundle-tip sizing. Entry path: simulate historical big swaps first (fetch Swap events, recompute what a JIT position would have earned), then live with strict revert-if-unprofitable checks. Most agents get better risk-adjusted returns from the defensive knowledge than from running it (trading_bot_architecture, mev_strategies)." },
    ],
    warnings: [
      "A JIT bundle that lands AFTER the target swap (mis-ordering, missed slot) leaves you holding a concentrated position through real price moves — the burn must be in the same bundle, never 'next block'.",
      "v4 hook contracts are arbitrary code: a malicious hook can rug LPs (fee capture, withdrawal gating). Audit the hook address before LPing into a hooked pool (security tool + proxy_upgrade_patterns thinking).",
    ],
    references: ["https://docs.uniswap.org"],
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

  portfolio_management: {
    topic: "portfolio_management",
    title: "Portfolio management for agents: rebalancing, risk sizing, exposure limits",
    summary: "The discipline that keeps an autonomous agent solvent — position sizing, rebalancing rules, and exposure caps across chains.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Read the real portfolio first", command: "call tool \"portfolio\" { chain, address } (native + ERC-20 + SPL with USD values)", note: "Aggregate across chains for a true picture. You can't manage risk you can't see — include LP positions, staked/lent balances and pending bridge transfers." },
      { title: "Size by risk, not conviction", note: "Fixed-fractional: risk a small % of the book per position; cap per-asset and per-chain exposure. Correlated assets (ETH + ETH-LSTs + ETH-perps) count as ONE exposure — don't fool yourself that 3 ETH bets are diversified." },
      { title: "Rebalancing rules", note: "Threshold rebalancing (act only when an allocation drifts >X%) beats calendar rebalancing on gas — every rebalance pays swap fees + gas (net it via profitability). On expensive chains, widen thresholds; on L2s/Solana you can rebalance tighter." },
      { title: "Keep dry powder + gas", note: "Always hold native gas per active chain (a stranded position you can't exit is a total loss) and a stable reserve for opportunities/margin calls. An agent that spends its last ETH on a trade can't pay to exit it." },
      { title: "Define exits and stops in advance", note: "Per-position stop-loss and take-profit, plus a portfolio-level drawdown kill-switch. Autonomous agents fail by holding losers hoping for recovery — encode the exit, don't 'decide' it live." },
    ],
    warnings: ["USD valuations use market prices that can be stale/manipulated for illiquid holdings (price_oracle_safety) — a portfolio that looks balanced can be concentrated in something you can't actually sell at 'value'."],
  },

  basis_trade: {
    topic: "basis_trade",
    title: "Basis trading & funding-rate arbitrage (delta-neutral yield)",
    summary: "Capture perp funding or spot-futures spread while hedged — the mechanics and the risks that turn 'neutral' into a loss.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "The funding-rate trade", note: "When perp funding is strongly positive (longs pay shorts), go SHORT the perp and LONG the equal spot amount → delta-neutral, and you COLLECT funding each interval. Negative funding = flip it (long perp, short/borrow spot). Read funding from perps_funding_data (Hyperliquid/GMX/CEX, keyless)." },
      { title: "Size the hedge exactly", note: "Delta-neutral means the perp notional == spot notional. Any mismatch leaves directional exposure. Rebalance as price moves so the legs stay equal (costs gas/fees — factor it)." },
      { title: "Net ALL costs before calling it yield", command: "call tool \"profitability\"", note: "Funding income must exceed: trading fees (both legs), spot borrow cost (if shorting spot), gas/rebalancing, and slippage. A 10% annualized funding can be net-negative after costs on small size." },
      { title: "The risks that break 'neutral'", note: "1) Liquidation of the perp leg if margin runs low during a spike — keep buffer (defi_lending health logic). 2) Funding flips against you. 3) Exchange/venue risk (CEX insolvency, on-chain perp exploit). 4) Spot-perp basis moving on exit." },
      { title: "On-chain venues", note: "Hyperliquid (order-book perps), GMX (oracle perps, onchain_perps_gmx). Spot leg via aggregator_swaps / solana_swap. Keep the two legs on venues you can rebalance quickly." },
    ],
    warnings: ["'Delta-neutral' is only neutral if both legs stay equal AND solvent — a perp liquidation during a wick leaves you naked directional at the worst moment. Margin buffer is the whole game."],
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

  aggregator_swaps: {
    topic: "aggregator_swaps",
    title: "Best-price swaps via DEX aggregators (which are keyless, and the safety checks)",
    summary: "How agents get the best same-chain swap route + ready calldata, and the approval/slippage/simulation discipline that prevents losses.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Pick an aggregator by auth cost", note: "KEYLESS: KyberSwap (aggregator-api.kyberswap.com, live-verified) — zero setup, 20+ chains. Odos (keyless, rate-limited). FREE-KEY: 1inch (api.1inch.dev) and 0x (api.0x.org) return 401 without a key. This server's own \"route\" tool aggregates LiFi+deBridge and returns an unsigned tx." },
      { title: "Get route + calldata", command: "KyberSwap: GET /{chain}/api/v1/routes?tokenIn=&tokenOut=&amountIn=  →  POST /{chain}/api/v1/route/build → {data, routerAddress, value}", note: "Native token uses the 0xEeee…EEeE sentinel. The build step returns the exact tx to sign." },
      { title: "Approve the ROUTER, exact amount", command: "erc20.approve(routerAddress, amountIn)  // skip for native-token swaps", note: "Approve the aggregator's router (from the build response), not a random address. Prefer exact over infinite (erc20_patterns). Many aggregators route approvals through Permit2 (permit2_usage) — a signature instead of an approve tx." },
      { title: "Set slippage + simulate", command: "call tool \"simulate\" with the built tx before signing", note: "Set a minOut/slippage the aggregator enforces on-chain; too loose invites sandwiching (mev_strategies). Simulate to catch reverts (stale route, insufficient allowance) before paying gas." },
      { title: "Compare before trusting one quote", note: "Aggregators differ per pair/chain; for size, compare 2 (e.g. KyberSwap vs the route tool). For cross-CHAIN swaps use bridge routing (bridge_funds), not these same-chain aggregators." },
    ],
    warnings: ["A returned route goes stale within seconds on volatile pairs — build → simulate → sign quickly, and rely on the on-chain minOut, not the quoted amount."],
    references: ["https://docs.kyberswap.com", "https://docs.1inch.io"],
  },

  hyperliquid_trading: {
    topic: "hyperliquid_trading",
    title: "Hyperliquid for agents: keyless data, signed trading, API wallets",
    summary: "The perp DEX most agent-friendly by design — full market data without a key, order placement via signed actions, and agent wallets that can trade but never withdraw.",
    scope: ["evm"],
    prerequisites: ["USDC collateral (deposits run over the Arbitrum bridge)"],
    steps: [
      { title: "Market data — no key, no auth, everything", command: 'POST https://api.hyperliquid.xyz/info {"type":"allMids"} → 900+ mids (live-verified); {"type":"l2Book","coin":"ETH"} → full order book; {"type":"metaAndAssetCtxs"} → leverage caps, open interest, funding', note: "Also clearinghouseState (positions/margin of any address — the whole book is public!), fundingHistory, predictedFundings (231 assets incl. cross-venue Binance/Bybit predictions, live-verified). This is the richest keyless perp dataset anywhere — use it even if you trade elsewhere (basis_trade, perps_funding_data)." },
      { title: "Trading = signed actions, not txs", command: 'POST https://api.hyperliquid.xyz/exchange {"action":{…order…}, "nonce": Date.now(), "signature": …}', note: "No gas, no mempool — the L1 is a purpose-built CLOB. nonce = current timestamp in ms and must strictly increase per wallet: serialize your order submissions, parallel sends with equal/backwards nonces get rejected." },
      { title: "Order types", note: "Limit orders with tif: 'Gtc' (rest), 'Ioc' (fill-or-kill the remainder), 'Alo' (post-only — cancels instead of taking). Trigger orders carry triggerPx + tpsl ('tp'/'sl') for stop-loss/take-profit server-side — an agent doesn't need its own price-watcher loop for exits." },
      { title: "API wallets: the blast-radius pattern built in", note: "approveAgent authorizes a SEPARATE keypair that can trade but can NOT withdraw funds (1 unnamed + up to 3 named per account, +2 per subaccount). Run your bot on the agent key, keep the funded key cold — this is exactly the wallet_security_checklist blast-radius rule as a protocol feature. Use the official Python SDK (hyperliquid-python-sdk) for the signing details instead of hand-rolling." },
      { title: "Sizing & execution discipline", note: "allMids is a MID — quote real execution from l2Book (best bid/ask + depth). Check the asset's max leverage and isolated-vs-cross margin in meta before sizing; funding settles hourly and flips sign (perps_funding_data)." },
      { title: "HyperEVM", note: "A normal EVM chain (chainId 999, RPC https://rpc.hyperliquid.xyz/evm, live-verified) attached to the same L1 — standard EVM tooling works, with precompiles exposing exchange state to contracts. Useful when you want on-chain logic reacting to the order book." },
    ],
    warnings: [
      "The entire account state is public via clearinghouseState — anyone can read your positions, and copy-/counter-trading bots do exactly that (copy_trading_bots). Randomize sizing/timing if that matters.",
      "Perp liquidations are the default failure mode: a leveraged position + hourly funding against you + no stop = slow-motion liquidation. Set tpsl triggers at order time, not 'later'.",
    ],
    references: ["https://hyperliquid.gitbook.io/hyperliquid-docs"],
  },

  intent_based_trading: {
    topic: "intent_based_trading",
    title: "Intent-based trading: CoW Protocol & UniswapX (sign the WHAT, not the HOW)",
    summary: "Instead of building a swap tx, you sign an order and let solvers compete to fill it — gasless, MEV-protected, better for size. The full CoW flow an agent can run keyless.",
    scope: ["evm"],
    prerequisites: ["eip712_signing", "erc20_patterns (approvals)"],
    steps: [
      { title: "The model", note: "You sign an INTENT ('sell 1 WETH for ≥X USDC, valid until T') off-chain. Competing solvers/fillers find the execution (AMMs, private inventory, other users' opposite orders) and settle on-chain, paying the gas. No public-mempool tx from you = nothing to sandwich (mev_strategies). Trade-off: settlement is asynchronous — seconds to minutes, or the order expires unfilled." },
      { title: "CoW Protocol — the open path (keyless API)", command: 'POST https://api.cow.fi/mainnet/api/v1/quote {"sellToken","buyToken","sellAmountBeforeFee","kind":"sell","from"} → quote (live-verified: 1 WETH → ~1797 USDC incl. fee + validTo)', note: "Batch auctions with a uniform clearing price: all orders in a batch trade at the same price, and opposite orders match peer-to-peer (a 'Coincidence of Wants' — no AMM fee at all). Also on base/arbitrum/gnosis via /{chain}/api/v1." },
      { title: "CoW step 2: approve the RIGHT contract", command: "ERC20.approve(0xC92E8bdf79f0507f65a392b0ab4667716BFE0110, amount)  // GPv2VaultRelayer — Sourcify exact_match", note: "Approvals go to the VaultRelayer, NOT to the Settlement contract (GPv2Settlement 0x9008D19f58AAbD9eD0D60971565AA8510560ab41, verified). Settlement never needs your approval — an 'approve the settlement' request is a phishing tell." },
      { title: "CoW step 3: sign & submit the order", command: "sign EIP-712 GPv2Order {sellToken, buyToken, sellAmount, buyAmount(min), validTo, appData, feeAmount, kind, partiallyFillable} → POST /orders → orderUid; track via GET /orders/{uid} + /trades", note: "buyAmount is your limit — solvers must beat it, surplus goes to YOU (better fill than quoted is common). partiallyFillable:true lets big orders fill across batches. Limit orders = same flow with your own price and long validTo." },
      { title: "UniswapX — Dutch auctions", note: "Orders start at a good price for you and decay toward your worst-acceptable; the first filler for whom it's profitable executes via a Reactor (ExclusiveDutchOrderReactor 0x6000da47483062A0D734Ba3dc7576Ce6A0B645C4, V2DutchOrderReactor 0x00000011F84B9aa48e5f8aA8B9897600006289Be — both Sourcify-verified). Permit2-based, gasless. In practice order creation runs through Uniswap's interface/trading API — less open for standalone agents than CoW's API." },
      { title: "When intents beat aggregators", note: "Size (batch price + P2P matching beats walking the AMM curve), MEV-sensitive pairs, gasless UX (agent wallet holds no ETH), and limit orders without infrastructure. When they DON'T: you need guaranteed instant execution (arb legs, liquidations) — an intent that fills 'usually' is not an atomic leg (arbitrage_basics)." },
    ],
    warnings: [
      "An expired-unfilled order is a silent no-op — always check order status instead of assuming execution, and re-quote before re-submitting (tx_confirmation_patterns thinking applies to orders too).",
      "The quote's feeAmount and price are only valid until validTo; signing a stale quote either fails or fills at a worse-than-market limit you set yourself.",
    ],
    references: ["https://docs.cow.fi", "https://docs.uniswap.org/contracts/uniswapx/overview"],
  },

  token_discovery: {
    topic: "token_discovery",
    title: "Discover tokens & new pairs across chains (prices, liquidity, age)",
    summary: "How an agent finds tokens, checks if they're real/liquid, and spots fresh launches — the keyless data layer before any trade.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Find pairs for a token (any chain)", command: "GET https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}", note: "Keyless (live-verified). Returns every DEX pair, price, liquidity USD, 24h volume and pair age across all chains — one call to see where a token actually trades." },
      { title: "Search / spot new launches", command: "GET https://api.dexscreener.com/latest/dex/search?q={symbol}  · sort/filter by pairCreatedAt for fresh pairs", note: "For sniping/monitoring, new-pair age + rising liquidity are the signals; combine with a security scan before touching it." },
      { title: "On-chain DEX prices & OHLCV", command: "GET https://api.geckoterminal.com/api/v2/networks/{net}/tokens/{addr} (net: eth, solana, base…)", note: "Keyless (live-verified). Good for candles/pool-level data and trending pools." },
      { title: "ALWAYS gate discovery through safety", command: "call tool \"security\" { chain, address } before any buy", note: "A token showing on DexScreener can still be a honeypot/high-tax scam. Check liquidity depth + lock, holder concentration, and the risk score first (security tool, token_discovery → security → trade)." },
      { title: "Cross-check price", note: "For a canonical USD price use DefiLlama/CoinGecko; DexScreener/GeckoTerminal reflect the specific pool (can be thin/manipulated for microcaps — price_oracle_safety)." },
      { title: "Solana: resolve the RIGHT mint", command: "GET https://lite-api.jup.ag/tokens/v2/search?query={symbol} (keyless, live-verified)", note: "Impostor SPL tokens reuse popular symbols — match against Jupiter's verified list to get the correct mint before trading (Birdeye has more depth but needs a key)." },
    ],
    warnings: ["Liquidity USD can be faked with worthless paired tokens — verify the quote asset is real (USDC/WETH/SOL) and the liquidity is locked, not just 'present'.", "Symbol ≠ identity: always trade by verified contract/mint address, never by ticker (many scams reuse well-known symbols)."],
    references: ["https://docs.dexscreener.com"],
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

  solana_versioned_tx: {
    topic: "solana_versioned_tx",
    title: "Solana versioned transactions & Address Lookup Tables (fit more in one tx)",
    summary: "How to break past Solana's tx account limit — the versioned-tx + ALT pattern every serious DeFi/swap tx now uses.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "The problem", note: "A legacy Solana tx is capped at ~35 accounts by the 1232-byte size limit. A Jupiter swap or multi-hop route needs far more — legacy txs simply can't hold them." },
      { title: "Address Lookup Tables (ALTs)", note: "An ALT is an on-chain account storing addresses; a versioned tx references them by 1-byte INDEX instead of full 32-byte pubkeys. This compresses accounts so a single tx can touch 64+ accounts. Jupiter etc. return the ALT addresses to use." },
      { title: "Build a v0 transaction", command: "const msg = new TransactionMessage({ payerKey, recentBlockhash, instructions }).compileToV0Message([lookupTableAccount]);\nconst tx = new VersionedTransaction(msg);\ntx.sign([signer]);", note: "Pass the resolved ALT accounts (fetch via connection.getAddressLookupTable). Aggregator APIs hand you both the instructions and the ALT keys." },
      { title: "Send it", command: "connection.sendTransaction(tx)  // VersionedTransaction, not the legacy Transaction", note: "Most RPCs default to accepting versioned txs; ensure maxSupportedTransactionVersion:0 when fetching them back (getTransaction)." },
      { title: "Creating your own ALT", note: "AddressLookupTableProgram.createLookupTable + extendLookupTable if you repeatedly hit the same many accounts (e.g. a market-making bot). Tables need one slot to 'warm up' before use." },
    ],
    warnings: ["A referenced ALT must exist and be active on-chain at execution — a tx pointing at a not-yet-warmed or closed table fails."],
    references: ["https://solana.com/docs/advanced/lookup-tables"],
  },

  solana_token_extensions: {
    topic: "solana_token_extensions",
    title: "Solana Token-2022 extensions: transfer fees, hooks, and the traps",
    summary: "What Token-2022 (Token Extensions) adds over classic SPL and why naive integrations break on these tokens.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Detect the program first", note: "Token-2022 mints are owned by TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb (classic = Tokenkeg…). ALWAYS check the mint's owner and pass the correct programId to every ATA/instruction (pumpfun_token2022_gotchas)." },
      { title: "Transfer Fee extension", note: "The mint can levy a % fee on every transfer, withheld in the recipient account and later harvested by the fee authority. Your 'transfer 100' delivers <100 — read the TransferFeeConfig and use transferCheckedWithFee, or the amount received won't match." },
      { title: "Transfer Hook extension", note: "The mint can require a callback to an arbitrary program on every transfer (e.g. allowlist, royalty). A plain transfer that omits the hook's extra accounts FAILS — resolve the hook's ExtraAccountMetaList and include them." },
      { title: "Other extensions to expect", note: "Non-transferable ('soulbound'), permanent delegate (issuer can move/burn your tokens — a rug vector), default-account-state (frozen until allowed), confidential transfers, interest-bearing. Read the mint's TLV extension data before assuming ERC-20-like behavior." },
      { title: "Use the SDK", command: "@solana/spl-token with the TOKEN_2022_PROGRAM_ID + getMint/getTransferFeeConfig helpers", note: "It parses the extension TLV data for you; hand-parsing is error-prone." },
    ],
    warnings: [
      "A 'permanent delegate' extension lets the token issuer transfer or burn YOUR balance at will — treat such tokens as issuer-controlled; scan with the security tool before holding.",
      "Transfer-fee and transfer-hook tokens break naive swap/transfer code that assumes classic SPL — always branch on the token program.",
    ],
    references: ["https://solana.com/docs/tokens/extensions"],
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
      { title: "Tune priority fees from live data", command: 'POST rpc {"method":"getRecentPrioritizationFees","params":[[]]} → median of recent fees\n// then prepend ComputeBudgetProgram.setComputeUnitPrice(microLamports)', note: "During congestion 0-fee txs get dropped silently; re-fetch the blockhash right before signing. Full fee/tip strategy incl. Jito: solana_priority_fees guide." },
      { title: "Read balances the easy way", command: "call tool \"portfolio\" { chain: 'solana', address }", note: "Returns native + SPL balances with USD values in one call." },
    ],
  },

  solana_priority_fees: {
    topic: "solana_priority_fees",
    title: "Solana priority fees & Jito tips: land transactions during congestion",
    summary: "The two separate markets for Solana block space — compute-unit pricing and Jito tips — and how an agent sizes each from live data.",
    scope: ["solana"],
    prerequisites: [],
    steps: [
      { title: "Understand the two knobs", note: "Priority fee = ComputeBudget instructions inside your tx (paid per compute unit, goes to the leader). Jito tip = a plain SOL transfer to a tip account (only useful when submitting through the Jito block engine). They are independent markets — a huge tip does nothing for a tx sent to the public RPC, and vice versa." },
      { title: "Set BOTH compute-budget instructions", command: "ComputeBudgetProgram.setComputeUnitLimit({units}) + ComputeBudgetProgram.setComputeUnitPrice({microLamports})", note: "Cost = units × microLamports / 1e6 lamports. Default limit is 200k/instruction (max 1.4M per tx). ALWAYS right-size the limit: simulate first, take consumed units × ~1.1 — a smaller CU footprint is cheaper AND schedules better, since leaders pack blocks by compute." },
      { title: "Size the CU price from live data — percentiles, not median", command: 'POST rpc {"method":"getRecentPrioritizationFees","params":[["<program or account you touch>"]]}', note: "Returns the fee paid per recent slot for txs locking those accounts. Live measurement (Jupiter program): median 0, max ~209k microLamports — most slots are empty, so take a high percentile (p75–p90) of the NON-ZERO values for the accounts you contend on. Passing [] gives global fees, which underestimates hot-account contention. Helius getPriorityFeeEstimate (free key) does this aggregation for you." },
      { title: "Jito path: tip + bundle for atomicity", command: 'getTipAccounts via POST https://mainnet.block-engine.jito.wtf/api/v1/bundles → pick one of the 8 tip accounts AT RANDOM; append a SystemProgram.transfer to it as the LAST instruction (or last tx of a bundle)', note: "Random tip-account choice avoids write-lock contention with everyone else tipping the same account. Bundles (≤5 txs) execute atomically all-or-nothing — the tool for snipes, arb legs and liquidations. If the bundle fails, the tip isn't paid (it's inside the failed bundle)." },
      { title: "Size the tip from the live floor", command: "GET https://bundles.jito.wtf/api/v1/bundles/tip_floor", note: "Keyless (live-verified). Returns landed-tip percentiles in SOL: p25 ≈ 1e-6, p50 ≈ 2e-6, p95 ≈ 1e-3 at measurement time — tips are a fat-tailed auction. For routine inclusion pay ~p50–p75; only chase p95+ when racing (sniping_launches)." },
      { title: "Choose the path per situation", note: "Normal tx → priority fee on public/own RPC is enough. Congestion or must-land → Jito sendTransaction/sendBundle with tip (plus a modest priority fee — belt and braces). Atomic multi-tx (arb, liquidation) → bundle, nothing else gives atomicity. MEV-sensitive swap → bundle also hides you from the public mempool-equivalent (see mev_strategies)." },
      { title: "Landing is never guaranteed — build the retry loop", note: "Re-fetch a fresh blockhash right before signing, resubmit on expiry, and make handlers idempotent (tx_confirmation_patterns). A dropped Solana tx costs nothing — dropping and re-sending with a higher fee/tip IS the fee-bump mechanism (there is no EVM-style replace-by-nonce)." },
    ],
    warnings: [
      "Fee/tip numbers in examples are point-in-time measurements — always read getRecentPrioritizationFees / tip_floor live; hardcoded values go stale within days.",
      "Never send tips as a standalone tx outside the bundle/Jito submission — you'd pay for nothing if your target tx doesn't land.",
    ],
    references: ["https://docs.jito.wtf", "https://solana.com/docs/core/fees"],
  },

  tokenized_treasuries: {
    topic: "tokenized_treasuries",
    title: "Tokenized treasuries & RWAs: BUIDL, OUSG, USDY — and why transfer() reverts",
    summary: "The on-chain T-bill funds behind the RWA wave, how their yield mechanics differ, and the permissioned-ERC-20 trap that breaks naive agent integrations.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "The big three (all live-verified on Ethereum)", note: "BUIDL 0x7712c34205737192402172409a8F7ccef8aA2AEc (name() = 'BlackRock USD Institutional Digital Liquidity Fund', via Securitize) · OUSG 0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92 (Ondo, institutional) · USDY 0x96F6eF951840721AdBF46Ac996b59E0235CB985C (Ondo, non-US retail). All hold short-term US treasuries/repo off-chain — the 'risk-free rate' as a token." },
      { title: "THE integration trap: these are permissioned ERC-20s", note: "BUIDL and OUSG enforce a KYC whitelist at the token level — transfer()/transferFrom() to a non-whitelisted address REVERTS even though the ABI looks like plain ERC-20. An agent can hold the interface and still be unable to move the asset. Simulate first (simulate tool) and expect 'not allowed'-style custom errors (debug_failed_tx)." },
      { title: "Yield mechanics differ — account for them differently", note: "BUIDL targets $1.00 and pays yield as DAILY DIVIDENDS in new tokens (balance grows, price flat — rebasing-like; the stETH lesson from eth_staking applies). USDY is ACCUMULATING: fixed balance, redemption value/price rises over time (wstETH-like). Mixing the two models under- or over-counts portfolio value (portfolio_management)." },
      { title: "Where an agent actually gets exposure", note: "Direct mint/redeem = KYC'd institutional flow (not autonomous). Liquid paths: USDY trades on DEXes on several chains (check token_discovery + DEX depth), and DeFi wrappers (e.g. vault tokens holding OUSG/BUIDL) exist — each wrapper adds its own contract + issuer risk layer (the restaking_eigenlayer stacked-risk lens applies). sDAI/sUSDS remain the permissionless yield-bearing-stable alternative (erc4626_vaults)." },
      { title: "Data & monitoring", command: "GET https://stablecoins.llama.fi/stablecoins?includePrices=true (USDY listed) · GET https://api.llama.fi/protocols → filter category 'RWA'", note: "Watch NAV-vs-DEX-price like a depeg (stablecoin_mechanics): a discount on the DEX price of an accumulating token = liquidity stress or redemption friction, not 'cheap yield'." },
    ],
    warnings: [
      "Fed-rate changes move these yields directly — 'the safe 5%' is a floating rate, not a protocol constant; strategies comparing RWA yield vs DeFi yield must re-check both sides (defi_yield_research).",
      "Ticker impostors are rampant in RWA: verify the exact address against the issuer's docs before touching anything named BUIDL/OUSG/USDY on a DEX (security tool + the addresses above).",
    ],
    references: ["https://ondo.finance", "https://securitize.io"],
  },

  testnets_and_faucets: {
    topic: "testnets_and_faucets",
    title: "Testnets & faucets: the map (ETH/SOL/BTC/L2s) and how an agent funds itself autonomously",
    summary: "Which testnet to use per chain (all RPCs live-verified) and the funding paths ranked by how autonomously an agent can walk them — local forks first, then API airdrops, PoW faucets, and bridges.",
    scope: ["all"],
    prerequisites: [],
    steps: [
      { title: "Rule 0: a local fork beats every faucet", command: "EVM: anvil --fork-url <mainnet-rpc>  ·  Solana: solana-test-validator  ·  Bitcoin: bitcoind -regtest", note: "Unlimited funds (anvil pre-funds 10 accounts with 10k ETH; anvil_setBalance mints at will), real mainnet state if forked, zero rate limits, fully autonomous. Use PUBLIC testnets only when you genuinely need other parties (indexers, bridges, faucet-gated protocols) — not for logic tests." },
      { title: "The EVM testnet map (chainIds live-verified)", note: "Sepolia 11155111 (THE app testnet; https://ethereum-sepolia-rpc.publicnode.com) · Hoodi 560048 (staking/validator testnet, Holesky's successor; ethereum-hoodi-rpc.publicnode.com) · Holesky: DEPRECATED — publicnode already dropped it (live-checked). L2s mirror Sepolia: Base Sepolia 84532 (sepolia.base.org), Arbitrum Sepolia 421614 (sepolia-rollup.arbitrum.io/rpc), OP Sepolia 11155420 (sepolia.optimism.io). Robinhood Chain testnet: 46630 (robinhood_chain). Full registry: chainid.network/chains.json." },
      { title: "Solana: requestAirdrop is the autonomous path — with limits", command: 'POST https://api.devnet.solana.com {"method":"requestAirdrop","params":["<pubkey>", 100000000]}  // or: solana airdrop 1 --url devnet', note: "Live-measured reality: the public faucet answers 429 'reached your airdrop limit today or the faucet has run dry' when exhausted (per-IP + per-address limits) and testnet-cluster airdrops often throw 'Internal error'. Strategy: ask small (0.1–1 SOL), retry hours later, fall back to faucet.solana.com (web, CAPTCHA) or a Helius devnet key. Devnet = where programs are tested; testnet cluster = validator/core testing, not for you." },
      { title: "Sepolia ETH without logins: PoW faucets", note: "https://sepolia-faucet.pk910.de and https://hoodi-faucet.pk910.de (both live-checked reachable): you MINE for testnet ETH in a JS/WASM session — no account, no CAPTCHA, no mainnet-balance gate → the most automatable ETH-testnet source. Provider faucets (Alchemy/QuickNode/Google Cloud) require accounts and often a mainnet balance — NOT autonomous. Budget mining time: minutes per 0.05–1 ETH depending on load." },
      { title: "L2 testnet gas: bridge it, don't faucet it", note: "Once you hold Sepolia ETH, the canonical bridges move it autonomously by contract call: Arbitrum Sepolia via the portal/Inbox depositEth, Base/OP Sepolia via the Superchain L1StandardBridge (send ETH to the bridge address = depositETH). ~Minutes to arrive (opstack_l2_fees deposit path). One PoW-mined pot funds ALL your L2 testnets." },
      { title: "Test tokens: deploy your own before hunting faucets", note: "For ERC-20/SPL flows just deploy a mint-anything mock (deploy_erc20 / spl_token_basics) — fully autonomous and you control decimals/supply. Circle's official testnet USDC faucet (faucet.circle.com, live-checked) exists but is web+CAPTCHA; only needed when a protocol hardcodes the canonical testnet-USDC address (e.g. CCTP testing, cctp_native_usdc)." },
      { title: "Bitcoin: regtest locally, signet publicly", note: "testnet4 (current public testnet, block height live-verified via mempool.space/testnet4/api) and signet (mempool.space/signet/api) both work with Esplora-style APIs (bitcoin_basics). Their faucets are CAPTCHA web pages — not autonomous — so: regtest for logic (generatetoaddress mines yourself = unlimited), signet when you need a live network and fund it once manually." },
    ],
    warnings: [
      "Testnets get deprecated on a schedule (Ropsten→Rinkeby→Goerli→Holesky all died) — re-verify via chainid.network before hardcoding, and expect faucet URLs to rot faster than RPCs.",
      "Never reuse a key between testnet and mainnet: faucet keys end up in logs/CI configs, and muscle-memory sends real funds to test addresses. One throwaway keypair per testnet campaign (wallet_security_checklist).",
      "Faucet limits are per-IP AND per-address — parallel agents behind one NAT share the budget; a 429 today usually resets within 24h.",
    ],
    references: ["https://chainid.network", "https://faucet.solana.com"],
  },

  robinhood_chain: {
    topic: "robinhood_chain",
    title: "Robinhood Chain: the tokenized-stocks L2 (connect, read, trade context)",
    summary: "Robinhood's Arbitrum-based L2 went mainnet 2026-07-01 with equities as ERC-20s. What an agent needs: connection data, the token landscape, and the regulatory caveats.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Connect (all live-verified)", command: "Mainnet: chainId 4663, RPC https://rpc.mainnet.chain.robinhood.com, explorer https://robinhoodchain.blockscout.com (keyless Blockscout API). Testnet: chainId 46630, RPC https://rpc.testnet.chain.robinhood.com/rpc.", note: "Gas token is ETH. Fully EVM-compatible (Solidity/Vyper unmodified; Hardhat/Foundry/viem work as-is) and contract deployment is permissionless — official docs. Multicall3 is deployed at the canonical address (live-verified)." },
      { title: "What it is", note: "An Arbitrum-stack ('Dedicated Blockchains') L2 settling to Ethereum, launched by Robinhood for tokenized stocks and RWAs. Sequencing is first-come-first-served — like Arbitrum One there's no priority-fee auction, so execution priority is LATENCY, not gas bidding (changes your MEV/sniping assumptions vs mainnet: mev_strategies)." },
      { title: "The token landscape (from the live explorer)", command: "GET https://robinhoodchain.blockscout.com/api/v2/tokens", note: "Live-verified day-5 snapshot: equity tokens named '<Company> • Robinhood Token' (NVDA, TSLA, AMD, COIN, CRCL …) as plain ERC-20s, plus stables (USDG 'Global Dollar', Ethena USDe) and DeFi tokens (VIRTUAL). Uniswap, 1inch, Lighter and Arcus deployed from day one — standard DeFi composability applies (aggregator_swaps, token_discovery)." },
      { title: "Read equity-token data like any ERC-20", note: "balanceOf/decimals/Transfer events — the ABIS reference table applies unchanged. Price feeds: DEX pools on-chain (price_oracle_safety rules apply — thin early liquidity!) or off-chain equity prices as sanity check. 24/7 on-chain trading vs. market-hours underlying = expect basis/gap risk around open/close." },
      { title: "Bridging in and out", note: "LayerZero is the official omnichain messaging/bridging partner (docs); the Arbitrum portal handles the canonical path (testnet parent per Chainlist = Sepolia). Standard L2 rules from opstack_l2_fees do NOT all transfer — this is Arbitrum-stack, not OP-stack — but the two-part-fee intuition (L1 data cost) is the same family (l2_bridging_basics)." },
      { title: "Regulatory reality check before trading", note: "Tokenized equities are jurisdiction-gated products: Robinhood's stock tokens launched for EU users as price-tracking instruments, NOT direct share ownership (no voting rights; dividends per product terms), and US persons are excluded. An agent buying the ERC-20 on a DEX may sidestep the app's KYC but NOT the legal nature of the asset — read the current terms at docs.robinhood.com/chain before sizing." },
    ],
    warnings: [
      "A '• Robinhood Token' ERC-20 tracking a stock is an issuer-dependent claim — its peg to the underlying depends on Robinhood's redemption/backing mechanics, not on-chain collateral you can verify. Treat depeg risk like a stablecoin's (stablecoin_mechanics), and check the token address against the explorer's verified list — ticker-squatting scams will come.",
      "The chain is days old (mainnet 2026-07-01): expect parameter changes, thin DEX liquidity and evolving docs — re-verify RPC/explorer facts before hardcoding them into agents.",
    ],
    references: ["https://docs.robinhood.com/chain/", "https://robinhoodchain.blockscout.com"],
  },

  robinhood_chain_playbook: {
    topic: "robinhood_chain_playbook",
    title: "Robinhood Chain playbook: launch tokens, the DeFi map, and where the edge is",
    summary: "The money-making angles specific to this chain — verified DeFi addresses (NOT the canonical ones!), the empty memecoin field, stock-token arbitrage, and the FCFS latency game.",
    scope: ["evm"],
    prerequisites: ["robinhood_chain (connection & basics)"],
    steps: [
      { title: "The DeFi map — canonical addresses DON'T apply here", note: "Uniswap v3 IS live but at chain-specific addresses (all live-verified): Factory 0x1f7d7550b1b028f7571e69a784071f0205fd2efa (derived via NonfungiblePositionManager.factory() — the trustworthy way), NPM 0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3, WETH 0x0bd7d308f8e1639fab988df18a8011f41eacad73 (symbol()=WETH; NOT 0xC02aaA…!). Permit2 IS at its canonical address (live-verified). Rule: on new chains, resolve protocol addresses from a live contract's getters, never from mainnet muscle memory." },
      { title: "Launch a token (memecoin) — the field is EMPTY", note: "Live token census day 5: almost exclusively official stock tokens + stables + VIRTUAL — no native memecoin scene yet, and no pump.fun-style launchpad observed. The NFT side already has community culture (Robinhood Dinos 2165 holders, Punks, Kitties, GMCards) — meme demand exists, meme SUPPLY doesn't. Launch path is plain EVM: deploy ERC-20 (deploy_erc20) → Factory.createPool(token, WETH, 3000) → NPM.mint(...) seeded with initial liquidity → announce. First movers on brand-new chains historically capture outsized attention (token_launch_mechanics, sniping_launches from the OTHER side)." },
      { title: "Edge #1: stock-token basis trading", note: "Stock tokens trade 24/7 on-chain; the underlying trades market hours. Around US market open/close, on-chain price gaps vs the official quote are structural — compare pool price against real-time equity quotes and CEX crypto refs (CEX endpoint). SPCX (SpaceX, 357 holders) is PRE-IPO: no public reference price at all → wide, opinion-driven spreads. Caveats: your redemption path is Robinhood's mechanics, not an on-chain peg (treat like stablecoin_mechanics depeg risk), and tokenized-equity rules apply (robinhood_chain regulatory step)." },
      { title: "Edge #2: thin-liquidity LP + new-pool sniping with less competition", note: "Day-5 pools are shallow: fee APR per TVL is high, and the professional bot swarm from Base/Solana hasn't fully migrated. Watching Factory PoolCreated events (fetch_event_logs) catches every new token/pool at birth. Same discipline as everywhere: security-scan the token first (security tool), size for rug risk, and jit_liquidity economics apply once volume grows." },
      { title: "Edge #3: the FCFS latency game", note: "First-come-first-served sequencing means NO priority-gas auction: you can't outbid, only out-race (co-location/latency to the sequencer wins). Classic sandwiching is structurally harder — good for your swaps (less MEV tax), bad if MEV capture was your plan. Arbitrage between Robinhood-chain pools and mainnet/CEX prices is a latency race, not a gas race (arbitrage_basics)." },
      { title: "Edge #4: early-ecosystem farming", note: "Robinhood funds builders (e.g. $1M Arbitrum Open House prizes for teams building on the chain) and new-chain ecosystems historically reward early users/deployers retroactively. Interacting early and building something real is the +EV version; industrial sybil farming is the -EV version (airdrop_farming has the sybil-risk math). Robinhood itself has no token — expect partner/ecosystem incentives rather than a HOOD-chain airdrop." },
      { title: "Data sources for all of this", command: "Blockscout keyless: /api/v2/tokens?type=ERC-20|ERC-721 (token census), /api/v2/stats, plus PoolCreated logs via the RPC (topic0 filter)", note: "No dedicated indexer coverage yet (DexScreener/DefiLlama listings will lag the chain) — the explorer API + raw logs ARE the data layer for now. That information asymmetry is itself part of the early edge." },
    ],
    warnings: [
      "Everything here is a day-5 snapshot (2026-07-06): liquidity, deployments and even RPC endpoints will shift fast — re-verify addresses via contract getters before wiring capital.",
      "Launching a token that IMITATES a stock ticker or Robinhood branding invites both scam-filter delisting and legal attention — the memecoin lane is open, the fake-equity lane is radioactive.",
    ],
    references: ["https://docs.robinhood.com/chain/", "https://robinhoodchain.blockscout.com"],
  },

  cronos_playbook: {
    topic: "cronos_playbook",
    title: "Cronos playbook: thin-liquidity edges in the Crypto.com ecosystem",
    summary: "The quiet chain: fast blocks, small DeFi, tight Crypto.com integration — where low competition is the edge and low liquidity is the risk.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Chain profile (live-measured)", note: "chainId 25, block time measured at 0.40s (LLM training data still says ~5s — long obsolete), Cosmos/Tendermint-based EVM chain, TVL ~$259M (DefiLlama live) — 19× smaller than BNB. This server supports Cronos natively (RPC registry with failover). A zkEVM L2 also exists (zkevm.cronos.org)." },
      { title: "The verified DeFi core", note: "VVS Finance is the #1 DEX: Factory 0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15 (live-verified: 23,463 pairs; a wrong factory address circulates in LLM memory — verify via allPairsLength()), WCRO 0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23 (symbol()-verified). Ecosystem staples per DefiLlama: Tectonic (lending), Fulcrom (perps), Veno (liquid staking)." },
      { title: "The central trade-off: TVL without volume", note: "VVS holds ~$100M TVL but daily DEX volume runs well under $1M — pools are deep relative to flow. Consequences: LP fee APR is modest, but STALE PRICES are common → the cross-venue gap between VVS pools and the CRO/majors price on Crypto.com or Binance (CEX endpoint) persists longer than on busy chains. That is the arbitrage edge — sized small, because your exit IS the thin liquidity." },
      { title: "Memecoins: puush.fun, a small pond", note: "puush.fun (live-checked) is the fair-launch venue on Cronos EVM + zkEVM — pump.fun mechanics, no presale/team allocation. Far smaller than four.meme: less bot competition on snipes, but also far less exit liquidity and attention. First-mover dynamics resemble the robinhood_chain_playbook situation more than BNB." },
      { title: "NFTs & the Crypto.com angle", note: "The Crypto.com NFT marketplace remains operational (status page live-checked) with curated drops. The structural Cronos edge is CEX integration: instant CRO on/off-ramps, card/Pay rails, and Crypto.com pushing agent payments (Cronos x402 hackathons — your x402_payments knowledge applies directly on this chain)." },
      { title: "Yield routes", note: "CRO liquid staking via Veno, lending on Tectonic, VVS farms — small, stable, low-competition yields. Check every pool through defi_yield_research discipline (apyBase vs apyReward: many Cronos APYs are emission-heavy)." },
    ],
    warnings: [
      "Thin liquidity cuts both ways: a position that took days to build can be impossible to exit at quote — size to the order book you can SEE, not the TVL headline.",
      "Ecosystem concentration risk: most Cronos value routes through Crypto.com entities — an exchange-side incident propagates on-chain faster than on neutral chains.",
    ],
    references: ["https://vvs.finance", "https://defillama.com/chain/cronos"],
  },

  bnb_chain_playbook: {
    topic: "bnb_chain_playbook",
    title: "BNB Chain playbook: four.meme launches, sub-second blocks, the Binance edge",
    summary: "The memecoin factory of EVM-land: how four.meme launches work, the verified DeFi core, and where agents actually make money on chainId 56.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Chain profile (live-measured)", note: "chainId 56, PoSA consensus, block time measured at 0.45s (Maxwell hard fork 06/2025 → 0.75s, Fermi 01/2026 → ~0.45s) — sub-second blocks make this a LATENCY chain like Solana, with near-instant finality and very low fees. TVL ~$4.96B (DefiLlama live). Deep on/off-ramp gravity: Binance itself." },
      { title: "The verified DeFi core", note: "PancakeSwap v2 Router 0x10ED43C718714eb63d5aA57B78B54704E256024E, Factory 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73 (proven via Router.factory(); 2.62 MILLION pairs live — the memecoin scale of this chain), WBNB 0xbb4CdB9CBd36B01bD1cBaeBf2De08d9173bc095c (proven via Router.WETH() — note: a NEAR-IDENTICAL wrong address with the same first 21 hex chars circulates in LLM memory; derive, don't recall). v3 + PancakeSwap Infinity (the v4 rebrand: singleton + hooks + CLAMM/LBAMM) addresses: resolve from docs.pancakeswap.finance — a same-bytecode fork ('PlunderV3Factory') pollutes Sourcify name lookups on BSC." },
      { title: "four.meme — THE launchpad (pump.fun of BNB)", note: "No-code bonding-curve launches: price rises with buys; raise targets ~18 BNB (or USDT/USD1 variants); at 100% the liquidity auto-migrates to a PancakeSwap pair with LP tokens burned. Optional ANTISNIPER mode taxes the first blocks after launch with very high fees — a snipe that ignores it buys straight into a 90%+ tax. Same mechanics family as pump.fun (token_launch_mechanics); graduation event = the tradeable moment (sniping_launches)." },
      { title: "Where the money is", note: "(1) Launch sniping on four.meme graduations — but 0.45s blocks mean the bot competition is latency-tier; check the antisniper window first. (2) CEX-DEX arbitrage: Binance listings/delistings move PancakeSwap pools within blocks — the CEX public-data endpoint gives you the reference leg keyless. (3) LP on Infinity pools early (hook-aware: jit_liquidity warnings apply). (4) Launching your own token: cheapest audience-rich launch venue in EVM-land, but you compete with thousands per day." },
      { title: "NFT venues", note: "Element Market (aggregator, element.market/bsc, live-checked) is the pro-trader venue; Binance NFT for curated drops. NFT liquidity on BNB is thinner than Ethereum — price in exit slippage before flipping." },
    ],
    warnings: [
      "2.6M pairs means the rug density is the highest anywhere in EVM — a pre-buy security scan (security tool) + LP-burn check is the minimum bar, and most four.meme launches go to zero by design (rugpull_forensics).",
      "Sub-second blocks compress your reaction window but also the sandwich window — private submission matters less than on mainnet, raw latency matters more (mev_strategies).",
    ],
    references: ["https://four.meme/en", "https://docs.pancakeswap.finance"],
  },

  opstack_l2_fees: {
    topic: "opstack_l2_fees",
    title: "OP-Stack chains (Base/OP/…): the two-part fee, predeploys, deposits & withdrawals",
    summary: "What's different when your agent runs on an OP-Stack L2 — the L1 data fee that eth_estimateGas doesn't show, the 0x4200… predeploys, and the asymmetric bridge timings.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Every tx pays TWO fees", note: "Total cost = L2 execution gas (normal EIP-1559, usually sub-cent) + L1 DATA fee for publishing the tx to Ethereum. eth_estimateGas covers ONLY the L2 part — the classic bug is a balance check that passes, then 'insufficient funds' on send because the L1 fee wasn't budgeted." },
      { title: "Read the L1 fee, don't compute it", command: "GasPriceOracle (predeploy 0x420000000000000000000000000000000000000F).getL1Fee(serializedUnsignedTx) → wei", note: "Live-verified on Base: 201-byte sample tx → ~1.06e9 wei at l1BaseFee 0.108 gwei, baseFeeScalar 2269, blobBaseFeeScalar 1055762, isFjord=true. Post-Fjord the formula is FastLZ-compression-estimated size × (baseFeeScalar×l1BaseFee + blobBaseFeeScalar×blobBaseFee) — parameters change with upgrades, the oracle call stays correct." },
      { title: "The 0x4200… predeploy family (same on every OP-Stack chain)", note: "L1Block 0x4200000000000000000000000000000000000015 → number() gives the L1 block the L2 currently sees (live-verified; useful for cross-layer logic). L2StandardBridge 0x4200000000000000000000000000000000000010. WETH 0x4200000000000000000000000000000000000006. Receipts include l1Fee/l1GasUsed fields — reconcile real costs from there (profitability tool)." },
      { title: "Cheap-calldata discipline pays double here", note: "The L1 fee scales with COMPRESSED tx size: shorter and more compressible calldata = cheaper. Zero bytes and repeated patterns compress well; random-looking bytes don't. For small txs the L1 fee often exceeds the L2 fee — batching several actions into one tx (multicall_batching) amortizes the fixed overhead." },
      { title: "Deposits L1→L2: fast and censorship-resistant", note: "OptimismPortal.depositTransaction on L1 lands on L2 in minutes and works even if the sequencer censors you — it's the escape hatch. Normal path: bridge UI / L1StandardBridge." },
      { title: "Withdrawals L2→L1: 7 days and TWO L1 txs", note: "initiate (L2) → wait for the output root → prove (L1 tx) → 7-day challenge window → finalize (L1 tx). Agents must budget BOTH L1 gas costs and track the two-step state; for UX-speed exits use a fast bridge and pay the spread (l2_bridging_basics, bridge_funds)." },
    ],
    warnings: [
      "Gas estimates from mainnet habits transfer badly: an L2 tx that 'costs nothing' in execution can still cost real money in data fee during L1 congestion — always price via getL1Fee before batching decisions.",
      "The scalar parameters (baseFeeScalar/blobBaseFeeScalar) are governance-settable per chain and change on upgrades (Ecotone→Fjord) — hardcoding the fee formula rots; hardcode only the oracle ADDRESS.",
    ],
    references: ["https://docs.optimism.io/stack/transactions/fees", "https://docs.base.org"],
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

  eip4844_blobs: {
    topic: "eip4844_blobs",
    title: "EIP-4844 blob transactions: cheap L2 data (and how to read blob gas)",
    summary: "What blobs are, why they made L2s ~10x cheaper, and how an agent reads/uses blob gas — mostly relevant if you operate a rollup or post data.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "What a blob is", note: "A type-0x03 tx carries up to 6 'blobs' (~128KB each) of data that is NOT stored in EVM history — it's available for ~18 days then pruned. Rollups post their compressed batch data as blobs instead of expensive calldata → the bulk of the L2-fee drop since Dencun." },
      { title: "Separate fee market", command: '{"method":"eth_feeHistory","params":["0x5","latest",[]]} → baseFeePerBlobGas + blobGasUsedRatio (live-verified)', note: "Blob gas has its OWN base fee, independent of execution gas. A blob tx pays maxFeePerBlobGas on top of normal fees." },
      { title: "Building a blob tx", command: "viem: walletClient.sendTransaction({ blobs, kzg, maxFeePerBlobGas, to, ... }) — needs a KZG setup (c-kzg / trusted setup)", note: "Blobs are KZG-committed (versioned hash goes on-chain, data goes to the consensus layer). Almost always done by rollup batchers, not app agents." },
      { title: "When it matters to an agent", note: "If you post data availability (your own rollup/appchain) or price L2 costs precisely. For ordinary L2 transacting you don't touch blobs directly — but knowing L1 blob base fee explains why L2 fees spike when many rollups post at once." },
    ],
    references: ["https://eips.ethereum.org/EIPS/eip-4844"],
  },

  gas_optimization: {
    topic: "gas_optimization",
    title: "Gas optimization for contracts & calls (storage packing, calldata, batching)",
    summary: "The high-leverage gas savings that matter — for writing contracts and for building cheaper transactions as an agent.",
    scope: ["evm"],
    prerequisites: [],
    steps: [
      { title: "Storage is the dominant cost", note: "SSTORE a fresh slot = 20,000 gas; a warm write far less. Pack multiple small vars into ONE 32-byte slot (e.g. uint128+uint64+uint64 declared adjacently), use uint256 for standalone vars (smaller types cost MORE alone due to masking), and cache storage reads in memory inside loops." },
      { title: "Calldata is priced per byte", note: "On L2s calldata/blob data is the main cost. Minimize it: pack args tightly, avoid redundant zero-padding, use bytes over string when possible. Zero bytes are cheaper than non-zero (4 vs 16 gas) — a reason some addresses/salts are 'mined' for leading zeros." },
      { title: "Batch to amortize base cost", command: "Multicall3 (reference kind='addresses') for reads; MultiSend/batch for writes", note: "Every tx pays a 21,000-gas base cost — batching N actions into one saves (N-1)×21k plus per-call overhead. A single agent tx doing approve+swap+stake beats three." },
      { title: "Cheaper patterns", note: "Use events instead of storage for data you only need off-chain; unchecked{} blocks where overflow is impossible (post-0.8); custom errors instead of require-strings; immutable/constant for deploy-time values (no SLOAD). Measure with forge test --gas-report — don't guess." },
      { title: "As a caller (no contract changes)", note: "Send during low-base-fee windows (eth_feeHistory), set tight-but-sufficient gas, and prefer aggregators/routers that already batch. profitability tool nets gas against expected value before you commit." },
    ],
    warnings: ["Micro-optimizations that hurt readability rarely pay off vs the big three (storage, calldata, batching) — and a gas trick that changes storage layout can break an upgradeable contract (see proxy patterns)."],
    references: ["https://book.getfoundry.sh/forge/gas-reports"],
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
      { title: "Off-chain alternatives (no RPC needed)", command: "GET https://coins.llama.fi/prices/current/coingecko:ethereum", note: "For agent logic that doesn't need on-chain trust, several keyless sources exist and can be cross-checked: DefiLlama/CoinGecko (aggregated), DIA (source-auditable), RedStone + Pyth Hermes (signed pull-oracles), GeckoTerminal (per-pool). Batch + compare instead of one eth_call per price." },
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

  bitcoin_taproot: {
    topic: "bitcoin_taproot",
    title: "Bitcoin Taproot (P2TR): key-path vs script-path spends, and why it matters",
    summary: "What Taproot added and how an agent builds/spends P2TR outputs — the basis for modern Bitcoin scripting, Ordinals and better privacy.",
    scope: ["bitcoin"],
    prerequisites: ["bitcoinjs-lib or a Taproot-capable library"],
    steps: [
      { title: "P2TR addresses (bc1p…)", note: "Taproot outputs use bech32m encoding (bc1p prefix, vs bc1q for segwit v0). A P2TR output commits to an internal public key that can hide a whole script tree — spenders reveal only what they use." },
      { title: "Key-path spend (cheap, private)", note: "If you just sign with the (tweaked) internal key, the spend looks like a plain signature — no script revealed. Cheapest and most private. Schnorr signatures (BIP-340) replace ECDSA here and enable signature aggregation." },
      { title: "Script-path spend (reveal a leaf)", note: "To use a spending condition, reveal that ONE script leaf + a Merkle proof — the rest of the tree stays hidden. This is how complex conditions (multisig, timelocks, and Ordinals inscription envelopes) live cheaply in Taproot." },
      { title: "Building it", command: "bitcoinjs-lib payments.p2tr({ internalPubkey, scriptTree, redeem }) → output script + address; sign with Schnorr", note: "Ordinals inscriptions are a script-path Taproot spend that embeds data in an OP_FALSE OP_IF … envelope (bitcoin_ordinals_runes)." },
      { title: "Fees & data", note: "Witness data (incl. inscription content) is discounted (~1/4 weight) but large inscriptions still cost real sats at high fee rates — quote sat/vB from mempool.space (bitcoin_basics)." },
    ],
    warnings: ["Taproot uses x-only (32-byte) public keys and Schnorr sigs — mixing them up with ECDSA/33-byte keys is a common integration bug. Use a library that handles the key tweaking."],
    references: ["https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki"],
  },

  bitcoin_lightning: {
    topic: "bitcoin_lightning",
    title: "Lightning Network basics: instant Bitcoin payments via channels & invoices",
    summary: "How Lightning moves BTC off-chain instantly and what an agent needs to pay or get paid over it.",
    scope: ["bitcoin"],
    prerequisites: ["Access to an LN node or a hosted LN API (LNbits, Voltage, an exchange LN endpoint)"],
    steps: [
      { title: "The model", note: "Payment channels are 2-of-2 multisig UTXOs; balances update off-chain instantly and only settle on-chain at open/close. Payments route across many channels — you don't need a direct channel to the payee, just a path." },
      { title: "Invoices (BOLT11)", note: "The payee generates an invoice (lnbc… string) encoding amount, a payment hash and expiry. The payer pays it; the preimage that unlocks the hash IS the proof of payment. No addresses reused — each invoice is one-shot." },
      { title: "As an agent: pay", command: "Via a node's API (LND REST/gRPC, Core Lightning, or hosted LNbits): decode the invoice, check amount/expiry, then payInvoice(bolt11)", note: "Set a max fee (routing costs a few ppm). A failed route just doesn't pay — funds aren't lost, you retry another path." },
      { title: "As an agent: receive", note: "Generate an invoice for the amount, watch for settlement (the preimage). Requires inbound liquidity (someone must have a channel balance pointing at you) — the classic onboarding hurdle." },
      { title: "When to use it vs on-chain / x402", note: "Lightning = tiny, instant, high-frequency BTC payments. For agent-to-service API payments, x402 (USDC/HTTP) is usually simpler; Lightning shines for native-BTC micropayments and streaming." },
    ],
    warnings: ["Channel liquidity is directional — you can be unable to receive (no inbound) or send (no outbound) even with a funded node. Hosted LN providers abstract this at the cost of custody."],
    references: ["https://docs.lightning.engineering"],
  },

  bitcoin_ordinals_runes: {
    topic: "bitcoin_ordinals_runes",
    title: "Bitcoin metaprotocols: Ordinals, Runes, BRC-20 (query & basics)",
    summary: "What the Bitcoin metaprotocols actually are and how an agent reads inscription/rune/BRC-20 data now that Hiro's API is gone.",
    scope: ["bitcoin"],
    prerequisites: [],
    steps: [
      { title: "The three, briefly", note: "ORDINALS = arbitrary data 'inscribed' onto individual sats (NFT-like). RUNES = a native fungible-token protocol encoded in OP_RETURN (post-halving, UTXO-based, efficient). BRC-20 = older fungible standard built ON TOP of ordinal inscriptions (JSON in inscriptions) — heavier than Runes, still has volume." },
      { title: "Query data (Hiro Ordinals API is DEPRECATED — returns 410)", command: 'GET https://ordinals.com/rune/{NAME} with "Accept: application/json" (keyless, live-verified) — or Ordiscan (x402/free key) for address-level indexing', note: "ordinals.com answers JSON for /rune, /runes and /inscription when you send the Accept header. Ordiscan adds per-address inscriptions/runes/brc20 (unpaid call → HTTP 402). Magic Eden has keyless Runes market data. Etching/minting mechanics: bitcoin_runes_minting guide." },
      { title: "Runes vs BRC-20 for new work", note: "Prefer Runes for new fungible tokens — UTXO-native, far cheaper to mint/transfer than BRC-20's inscription overhead. BRC-20 mainly matters for existing tokens." },
      { title: "Base-layer reads still via Esplora", note: "Ordinal/rune INDEXING needs a specialized indexer (Ordiscan); raw UTXOs/txs/fees stay on mempool.space + Blockstream (see bitcoin_basics)." },
    ],
    warnings: ["Inscription/rune transfers are still normal Bitcoin txs — respect dust limits and sat-vB fees (bitcoin_basics). Sending an inscribed sat as ordinary change BURNS the inscription."],
    references: ["https://docs.ordinals.com", "https://docs.ordiscan.com"],
  },

  bitcoin_runes_minting: {
    topic: "bitcoin_runes_minting",
    title: "Runes etching & minting in detail: runestones, commitments, edicts, cenotaphs",
    summary: "The exact mechanics of creating and minting a Bitcoin Rune — and the malformed-runestone trap that burns tokens.",
    scope: ["bitcoin"],
    prerequisites: ["bitcoin_basics (UTXOs, PSBT, fees)"],
    steps: [
      { title: "A runestone is an OP_RETURN message", note: "Protocol data lives in the FIRST output scripting `OP_RETURN OP_13 <payload>` (OP_13 is the Runes magic number). The payload is varint-encoded tag/value pairs. One runestone per tx; it can etch, mint and transfer in the same message." },
      { title: "Etching = creating the rune", note: "Fields: name (modified base-26, A=0…Z=25, AA=26…), spacers (bitfield rendering '•' separators — DOG•GO•TO•THE•MOON), divisibility (decimal places), symbol (one char, e.g. 🐕), premine (allocated to the etcher), and optional terms {amount per mint, cap, height/offset window}. Verified against the live DOG entry: id 840000:3, divisibility 5, premine 10_000_000_000_000_000." },
      { title: "Name commitment — 6 blocks, or the etch is ignored", note: "Non-reserved names must be COMMITTED first: a data-push of the name in an input's witness tapscript whose spent output has ≥6 confirmations. This anti-frontrun step means etching is a commit-reveal flow over ~1 hour minimum — plan the two txs (ord wallet does this for you: `ord wallet etch`)." },
      { title: "Name availability follows the unlock schedule", note: "From block 840,000, names of 13+ chars were open; one character length unlocks every 17,500 blocks (~4 months) down to 1 char by ~block 1,050,000. Check current height (mempool.space) against the schedule before planning a short name." },
      { title: "Minting", command: 'check first: GET https://ordinals.com/rune/{NAME} ("Accept: application/json") → mintable, terms, mints vs cap', note: "A mint tx carries a runestone with the Mint field = the rune's ID (block:tx of the etching, e.g. 840000:3). Valid only while terms allow: mints < cap and height inside the window. Each mint issues exactly terms.amount — competitive mints are a fee race (bitcoin_basics RBF/fee sizing)." },
      { title: "Transfers via edicts", note: "Edict = {id, amount, output}: move `amount` of rune `id` to output index `output` (amount 0 = all remaining; id 0:0 = the rune being etched in this tx). Unassigned runes default to the first non-OP_RETURN output. Runes ride on UTXOs — spending a rune-bearing UTXO without a runestone moves ALL its runes to output 0 implicitly." },
      { title: "Market/holder data", command: "GET https://api-mainnet.magiceden.dev/v2/ord/btc/runes/market/{NAME}/info (keyless, live-verified); Ordiscan for per-address balances", note: "Supply math: totalSupply = premine + mints×amount − burned; divisibility applies for display only (amounts are raw integers, like ERC-20)." },
    ],
    warnings: [
      "CENOTAPH: any malformed runestone (unrecognized even tag, bad varint, edict pointing to a nonexistent output) burns ALL runes entering the tx — and a cenotaph mint still counts against the cap while its tokens burn. Never hand-roll the encoding; use ord or a battle-tested library and test on signet first.",
      "The etch commitment reveals nothing, but the REVEAL tx is public the moment you broadcast — a hot name can still be fee-sniped between broadcast and confirmation. Use a competitive fee for the reveal.",
    ],
    references: ["https://docs.ordinals.com/runes/specification.html"],
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
