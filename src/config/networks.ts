import { getAddress, isAddress, type Address } from "viem";
import type {
  AssetInfo,
  NearNetworkConfig,
  NetworkConfig,
  NetworkKey,
} from "@/types";

/**
 * Avalanche network configuration.
 * Values mirror README.md §Network Support. Fuji is the default for all
 * development and demo activity — real assets are never used.
 */
export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  fuji: {
    key: "fuji",
    family: "evm",
    chainId: 43113,
    name: "Primary EVM Testnet",
    shortName: "Testnet",
    rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
    explorerUrl: "https://testnet.snowtrace.io",
    explorerName: "Block Explorer",
    explorerApiUrl: "https://api-testnet.snowtrace.io/api",
    currencySymbol: "AVAX",
    testnet: true,
  },
  mainnet: {
    key: "mainnet",
    family: "evm",
    chainId: 43114,
    name: "Primary EVM Network",
    shortName: "Mainnet",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://snowtrace.io",
    explorerName: "Block Explorer",
    explorerApiUrl: "https://api.snowtrace.io/api",
    currencySymbol: "AVAX",
    testnet: false,
  },
  "aurora-testnet": {
    key: "aurora-testnet",
    family: "evm",
    chainId: 1313161555,
    name: "Aurora Testnet",
    shortName: "Aurora Testnet",
    rpcUrl: "https://testnet.aurora.dev",
    explorerUrl: "https://explorer.testnet.aurora.dev",
    explorerName: "Aurora Explorer Testnet",
    explorerApiUrl: "https://explorer.testnet.aurora.dev/api",
    currencySymbol: "ETH",
    testnet: true,
  },
  "aurora-mainnet": {
    key: "aurora-mainnet",
    family: "evm",
    chainId: 1313161554,
    name: "Aurora Mainnet",
    shortName: "Aurora Mainnet",
    rpcUrl: "https://mainnet.aurora.dev",
    explorerUrl: "https://explorer.aurora.dev",
    explorerName: "Aurora Explorer",
    explorerApiUrl: "https://explorer.aurora.dev/api",
    currencySymbol: "ETH",
    testnet: false,
  },
};

export const DEFAULT_NETWORK: NetworkKey = "fuji";

export const SUPPORTED_NETWORKS = Object.values(NETWORKS);

export const NEAR_NETWORKS: Record<
  NearNetworkConfig["key"],
  NearNetworkConfig
> = {
  "near-testnet": {
    key: "near-testnet",
    family: "near",
    networkId: "testnet",
    name: "NEAR Testnet",
    shortName: "NEAR Testnet",
    rpcUrl: "https://rpc.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
    explorerName: "NEARBlocks Testnet",
    currencySymbol: "NEAR",
    testnet: true,
  },
  "near-mainnet": {
    key: "near-mainnet",
    family: "near",
    networkId: "mainnet",
    name: "NEAR Mainnet",
    shortName: "NEAR Mainnet",
    rpcUrl: "https://rpc.mainnet.near.org",
    explorerUrl: "https://nearblocks.io",
    explorerName: "NEARBlocks",
    currencySymbol: "NEAR",
    testnet: false,
  },
};

export function networkByChainId(chainId: number): NetworkConfig | undefined {
  return SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
}

/** Hex chain id string used by EIP-1193 `wallet_switchEthereumChain`. */
export function toHexChainId(chainId: number): `0x${string}` {
  return `0x${chainId.toString(16)}`;
}

/**
 * Deployed contract addresses, supplied per network at build time.
 *
 * Reading these from the environment means the app activates on-chain features
 * the moment real addresses exist — no code change, and no hardcoded address
 * that could drift from what is actually deployed. Absent values leave the
 * on-chain features correctly inert.
 */
function readAddress(value: string | undefined): Address | null {
  if (!value) return null;
  const trimmed = value.trim();
  return isAddress(trimmed) ? getAddress(trimmed) : null;
}

export const CONTRACTS: Record<
  NetworkKey,
  { announcer: Address | null; router: Address | null; testToken: Address | null }
> = {
  fuji: {
    announcer: readAddress(process.env.NEXT_PUBLIC_FUJI_ANNOUNCER_ADDRESS),
    router: readAddress(process.env.NEXT_PUBLIC_FUJI_ROUTER_ADDRESS),
    testToken: readAddress(process.env.NEXT_PUBLIC_FUJI_TEST_TOKEN_ADDRESS),
  },
  mainnet: {
    announcer: readAddress(process.env.NEXT_PUBLIC_MAINNET_ANNOUNCER_ADDRESS),
    router: readAddress(process.env.NEXT_PUBLIC_MAINNET_ROUTER_ADDRESS),
    testToken: readAddress(process.env.NEXT_PUBLIC_MAINNET_TEST_TOKEN_ADDRESS),
  },
  "aurora-testnet": {
    announcer: readAddress(process.env.NEXT_PUBLIC_AURORA_TESTNET_ANNOUNCER_ADDRESS),
    router: readAddress(process.env.NEXT_PUBLIC_AURORA_TESTNET_ROUTER_ADDRESS),
    testToken: readAddress(process.env.NEXT_PUBLIC_AURORA_TESTNET_TEST_TOKEN_ADDRESS),
  },
  "aurora-mainnet": {
    announcer: readAddress(process.env.NEXT_PUBLIC_AURORA_MAINNET_ANNOUNCER_ADDRESS),
    router: readAddress(process.env.NEXT_PUBLIC_AURORA_MAINNET_ROUTER_ADDRESS),
    testToken: readAddress(process.env.NEXT_PUBLIC_AURORA_MAINNET_TEST_TOKEN_ADDRESS),
  },
};

/**
 * Assets surfaced in the UI for a given network.
 *
 * The native asset is always present. The ERC-20 test token only appears once a
 * real contract address is configured for that network — there is no
 * `planned`/placeholder entry implying support that is not actually wired up.
 */
export function assetsFor(network: NetworkKey): AssetInfo[] {
  const assets: AssetInfo[] = [
    {
      symbol: "Native",
      name: NETWORKS[network].name,
      decimals: 18,
      native: true,
    },
  ];
  const testToken = CONTRACTS[network].testToken;
  if (testToken) {
    assets.push({
      symbol: "stUSD",
      name: "StealthPay Test USD (ERC-20)",
      decimals: 6,
      native: false,
      contract: testToken,
    });
  }
  return assets;
}

/** Block from which to begin scanning announcements, per network. */
export const SCAN_START_BLOCK: Record<NetworkKey, bigint> = {
  fuji: BigInt(process.env.NEXT_PUBLIC_FUJI_SCAN_START_BLOCK ?? "0"),
  mainnet: BigInt(process.env.NEXT_PUBLIC_MAINNET_SCAN_START_BLOCK ?? "0"),
  "aurora-testnet": BigInt(
    process.env.NEXT_PUBLIC_AURORA_TESTNET_SCAN_START_BLOCK ?? "0",
  ),
  "aurora-mainnet": BigInt(
    process.env.NEXT_PUBLIC_AURORA_MAINNET_SCAN_START_BLOCK ?? "0",
  ),
};

export function contractsFor(network: NetworkKey) {
  return CONTRACTS[network];
}

export function isPaymentsConfigured(network: NetworkKey): boolean {
  return CONTRACTS[network].announcer !== null;
}
