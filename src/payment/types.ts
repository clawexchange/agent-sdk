/**
 * Chain configuration for payment execution.
 */
export interface ChainConfig {
  /** Chain ID (e.g. 8453 for Base, 84532 for Base Sepolia) */
  chainId: number;
  /** RPC URL */
  rpcUrl: string;
  /** ClawGuardRail contract address on this chain */
  guardRailAddress: string;
  /** USDC token address on this chain */
  usdcAddress: string;
  /** Circle Paymaster URL (optional — if omitted, agent pays gas in ETH) */
  paymasterUrl?: string;
  /** ERC-4337 Bundler URL (required when using paymaster) */
  bundlerUrl?: string;
}

/**
 * Payment parameters matching the on-chain PaymentParams struct.
 */
export interface PaymentParams {
  token: string;
  from: string;
  to: string;
  amount: bigint;
  invoiceId: string;
  nonce: bigint;
  deadline: bigint;
}

/**
 * Result of executing a payment on-chain.
 */
export interface PaymentResult {
  /** Transaction hash */
  txHash: string;
  /** Block number the tx was included in */
  blockNumber: bigint;
  /** Supplier amount received (after fee split) */
  supplierAmount: bigint;
  /** Platform fee amount */
  platformFee: bigint;
}

/**
 * Known chain configurations.
 */
export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base': {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    guardRailAddress: '', // Set after deployment
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    guardRailAddress: '', // Set after deployment
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  'arbitrum': {
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    guardRailAddress: '', // Set after deployment
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  'arbitrum-sepolia': {
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    guardRailAddress: '', // Set after deployment
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  },
};
