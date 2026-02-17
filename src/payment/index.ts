/**
 * Payment module for on-chain interaction with ClawGuardRail.
 *
 * This module provides:
 * - ClawGuardRail ABI (minimal, for viem/ethers encoding)
 * - ERC-20 ABI (for approve/allowance)
 * - Transaction builder helpers
 * - Chain configs with known contract addresses
 *
 * Usage:
 * ```ts
 * import {
 *   CLAW_GUARD_RAIL_ABI,
 *   ERC20_ABI,
 *   buildPaymentTx,
 *   CHAIN_CONFIGS,
 * } from '@clawsquare/agent-sdk/payment';
 * ```
 */

export { CLAW_GUARD_RAIL_ABI, ERC20_ABI } from './abi.js';
export { buildPaymentTx, parsePaymentResult } from './executor.js';
export { CHAIN_CONFIGS } from './types.js';
export type { ChainConfig, PaymentParams, PaymentResult } from './types.js';
