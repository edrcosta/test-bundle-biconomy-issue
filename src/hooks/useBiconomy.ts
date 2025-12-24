import { useState, useCallback } from 'react';
import type { WalletClient } from 'viem';
import type { MultichainSmartAccount, MeeClient } from '@biconomy/abstractjs';
import type { TransferParams, TransferResult } from '../types';
import { createMultichainAccount, initializeMeeClient, executeGaslessTransfer } from '../biconomy';
import { getActiveChain } from '../config/chains';
import { getBiconomyApiKey } from '../config/constants';

interface UseBiconomyReturn {
  account: string | null;
  smartAccount: MultichainSmartAccount | null;
  meeClient: MeeClient | null;
  status: string | null;
  isInitialized: boolean;
  initialize: (wallet: WalletClient, address: string) => Promise<void>;
  executeTransfer: (params: TransferParams) => Promise<TransferResult>;
  reset: () => void;
}

export function useBiconomy(): UseBiconomyReturn {
  const [account, setAccount] = useState<string | null>(null);
  const [smartAccount, setSmartAccount] = useState<MultichainSmartAccount | null>(null);
  const [meeClient, setMeeClient] = useState<MeeClient | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const initialize = useCallback(async (wallet: WalletClient, address: string) => {
    try {
      setAccount(address);
      setWalletClient(wallet);
      setStatus('Creating multichain account...');

      const multiAccount = await createMultichainAccount(wallet, getActiveChain());
      setSmartAccount(multiAccount);

      setStatus('Initializing MEE client...');
      const mee = await initializeMeeClient(multiAccount, getBiconomyApiKey());
      setMeeClient(mee);

      setStatus(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Error: ${errorMessage}`);
      throw error;
    }
  }, []);

  const executeTransfer = useCallback(async (params: TransferParams): Promise<TransferResult> => {
    if (!smartAccount || !meeClient || !walletClient) {
      throw new Error('Biconomy not initialized');
    }

    if (!params.recipients.some(r => r)) {
      throw new Error('No recipients specified');
    }

    try {
      setStatus('Encoding instructions...');
      
      const result = await executeGaslessTransfer(
        meeClient,
        walletClient,
        smartAccount,
        params,
        getActiveChain()
      );

      setStatus('Transaction completed!');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error: ${errorMessage}`);
      throw error;
    }
  }, [smartAccount, meeClient, walletClient]);

  const reset = useCallback(() => {
    setAccount(null);
    setSmartAccount(null);
    setMeeClient(null);
    setWalletClient(null);
    setStatus(null);
  }, []);

  return {
    account,
    smartAccount,
    meeClient,
    status,
    isInitialized: !!meeClient,
    initialize,
    executeTransfer,
    reset
  };
}
