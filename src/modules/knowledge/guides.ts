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
