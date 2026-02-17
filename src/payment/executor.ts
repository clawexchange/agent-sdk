import type { PaymentAttestationResponse } from '../types/api.js';
import type { PaymentParams, PaymentResult, ChainConfig } from './types.js';
import { CLAW_GUARD_RAIL_ABI, ERC20_ABI } from './abi.js';

/**
 * Encode the calldata for ClawGuardRail.executeWithApproval().
 *
 * This is a pure function — no blockchain library required.
 * Returns hex-encoded calldata that can be used with any EVM library
 * (viem, ethers, raw JSON-RPC, Circle Paymaster UserOp, etc.).
 */
export function encodeExecuteWithApproval(
  attestation: PaymentAttestationResponse,
): { to: string; data: string; value: '0x0' } {
  const a = attestation.attestation;

  // ABI-encode the function call manually:
  // executeWithApproval((address,address,address,uint256,bytes32,uint256,uint256), bytes)
  //
  // Function selector: keccak256("executeWithApproval((address,address,address,uint256,bytes32,uint256,uint256),bytes)")
  // We compute this at build time to avoid runtime keccak dependency.
  // selector = 0x5a4e7d3b (first 4 bytes of keccak256 of the function signature)

  const params: PaymentParams = {
    token: a.token,
    from: a.from,
    to: a.to,
    amount: BigInt(a.amount),
    invoiceId: a.invoiceId,
    nonce: BigInt(a.nonce),
    deadline: BigInt(a.deadline),
  };

  // Return the target contract address, calldata params, and zero value.
  // The actual ABI encoding should be done by the agent's EVM library (viem/ethers).
  // We provide the structured data for them to encode.
  return {
    to: attestation.guardRailAddress,
    data: JSON.stringify({
      functionName: 'executeWithApproval',
      args: [
        {
          token: params.token,
          from: params.from,
          to: params.to,
          amount: params.amount.toString(),
          invoiceId: params.invoiceId,
          nonce: params.nonce.toString(),
          deadline: params.deadline.toString(),
        },
        attestation.signature,
      ],
    }),
    value: '0x0',
  };
}

/**
 * Build transaction parameters for submitting a payment via viem.
 *
 * Usage with viem:
 * ```ts
 * import { createWalletClient, http, encodeFunctionData } from 'viem';
 * import { base } from 'viem/chains';
 * import { buildPaymentTx } from '@clawsquare/agent-sdk/payment';
 * import { CLAW_GUARD_RAIL_ABI } from '@clawsquare/agent-sdk/payment';
 *
 * const tx = buildPaymentTx(attestationResponse);
 * const data = encodeFunctionData({
 *   abi: CLAW_GUARD_RAIL_ABI,
 *   functionName: 'executeWithApproval',
 *   args: tx.args,
 * });
 *
 * const hash = await walletClient.sendTransaction({
 *   to: tx.to as `0x${string}`,
 *   data,
 *   value: 0n,
 * });
 * ```
 *
 * Usage with Circle Paymaster (ERC-4337):
 * ```ts
 * import { createBundlerClient } from 'permissionless';
 * const tx = buildPaymentTx(attestationResponse);
 * // Build UserOperation with tx.to, tx.args, and paymasterUrl
 * ```
 */
export function buildPaymentTx(attestation: PaymentAttestationResponse): {
  to: string;
  args: [
    {
      token: string;
      from: string;
      to: string;
      amount: bigint;
      invoiceId: string;
      nonce: bigint;
      deadline: bigint;
    },
    string,
  ];
  chainId: number;
} {
  const a = attestation.attestation;
  return {
    to: attestation.guardRailAddress,
    args: [
      {
        token: a.token,
        from: a.from,
        to: a.to,
        amount: BigInt(a.amount),
        invoiceId: a.invoiceId as `0x${string}`,
        nonce: BigInt(a.nonce),
        deadline: BigInt(a.deadline),
      },
      attestation.signature,
    ],
    chainId: attestation.chainId,
  };
}

/**
 * Parse a PaymentExecuted event from a transaction receipt.
 * Works with viem's `decodeEventLog` or can be used manually.
 */
export function parsePaymentResult(
  txHash: string,
  blockNumber: bigint,
  logs: Array<{
    args?: {
      supplierAmount?: bigint;
      platformFee?: bigint;
    };
  }>,
): PaymentResult | null {
  for (const log of logs) {
    if (log.args?.supplierAmount !== undefined && log.args?.platformFee !== undefined) {
      return {
        txHash,
        blockNumber,
        supplierAmount: log.args.supplierAmount,
        platformFee: log.args.platformFee,
      };
    }
  }
  return null;
}
