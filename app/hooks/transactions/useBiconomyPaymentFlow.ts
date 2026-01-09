import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import type { WalletType } from '../../types/wallet';
import { useBiconomyGasLessTransfer } from './useBiconomyGasLessTransfer';

export interface BiconomyPaymentConfig {
  payerWalletAddress: `0x${string}` | undefined;
  walletType: WalletType;
  depositAddress: `0x${string}`;
  amountUsd: number;
  paymentTokenDecimals: number;
}

export interface BiconomyPaymentCallbacks {
  onSignatureRequested?: () => void;
  onSignatureReceived?: (hash: string) => void;
  onSuccess?: (result: { transactionHash: string; biconomyScanLink: string }) => void;
  onError?: (error: Error) => void;
}

export interface UseBiconomyPaymentFlowReturn {
  executePayment: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Simplified Biconomy payment flow for demo purposes.
 * Encapsulates the Biconomy gasless payment flow.
 */
export const useBiconomyPaymentFlow = (
  config: BiconomyPaymentConfig,
  callbacks: BiconomyPaymentCallbacks
): UseBiconomyPaymentFlowReturn => {
  const {
    payerWalletAddress,
    walletType,
    depositAddress,
    amountUsd,
    paymentTokenDecimals,
  } = config;

  const { onSignatureRequested, onSignatureReceived, onSuccess, onError } = callbacks;
  const [currentTransactionHash, setCurrentTransactionHash] = useState<string>('');

  const {
    executeTransaction: executeBiconomyTransaction,
    isLoading,
    error,
  } = useBiconomyGasLessTransfer(walletType, payerWalletAddress);

  const executePayment = useCallback(async () => {
    if (!payerWalletAddress) {
      const err = new Error('No wallet address provided');
      onError?.(err);
      return;
    }

    setCurrentTransactionHash('');

    try {
      const amountInSmallestUnit = parseUnits(String(amountUsd), paymentTokenDecimals);

      const result = await executeBiconomyTransaction(depositAddress, amountInSmallestUnit, {
        onSignatureRequested: () => {
          console.log('Signature requested');
          onSignatureRequested?.();
        },
        onSignatureReceived: (hash: string) => {
          console.log('Signature received, transaction hash:', hash);
          setCurrentTransactionHash(hash);
          onSignatureReceived?.(hash);
        },
      });

      if (!result) {
        throw new Error('Transaction failed or was not completed');
      }

      onSuccess?.(result);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Transaction failed');
      onError?.(errorObj);
    }
  }, [
    payerWalletAddress,
    amountUsd,
    paymentTokenDecimals,
    depositAddress,
    executeBiconomyTransaction,
    onSignatureRequested,
    onSignatureReceived,
    onSuccess,
    onError,
  ]);

  return {
    executePayment,
    isLoading,
    error,
  };
};
