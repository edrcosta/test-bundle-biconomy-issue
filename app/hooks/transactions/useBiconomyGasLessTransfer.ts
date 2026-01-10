import { 
  createMeeClient, 
  getDefaultMEENetworkUrl,
  getMeeScanLink,
  type GetFusionQuoteParams,
  type MeeClient,
  type MultichainSmartAccount,
} from '@biconomy/abstractjs';
import { getConnectors } from '@wagmi/core';
import { useCallback, useState } from 'react';
import { createWalletClient, custom, http, type WalletClient, type Hex, erc20Abi } from 'viem';
import { useConnections } from 'wagmi';
import type { WalletType } from '../../types/wallet';
import {
  createMultichainAccount,
  ensureProviderOnChain,
  getPreferredWalletConnection,
  getPreferredWalletConnector,
  rcpRequestAccount,
  type WalletProvider,
} from '../../utils/biconomy';
import { config, isProduction, targetChainViem, targetUsdcAddress } from '../../wagmi';

interface TransferParams {
  recipient: `0x${string}`;
  amount: bigint;
  tokenAddress: `0x${string}`;
  chainId: number;
}

interface TransferCallbacks {
  onSignatureRequested?: () => void;
  onSignatureReceived?: (hash: string) => void;
}

interface BiconomyTransactionResult {
  transactionHash: string;
  transactionReceipt: {
    from?: string;
    to?: string;
    blockNumber?: number;
    transactionIndex?: number;
    chainId?: number;
    status?: number;
  };
  biconomyScanLink: string;
}

export interface UseBiconomyGasLessTransferReturn {
  executeTransaction: (
    recipientWalletAddress: `0x${string}`,
    amount: bigint,
    callbacks?: TransferCallbacks
  ) => Promise<BiconomyTransactionResult | undefined>;
  isLoading: boolean;
  error: Error | null;
  sessionError: string | null;
  reset: () => void;
}

export const TRANSACTION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Executes a gasless transfer via Biconomy MEE.
 * Provider is injected into window.ethereum by the caller (SDK bug workaround).
 */
async function executeGaslessTransfer(
  meeClient: MeeClient,
  smartAccount: MultichainSmartAccount,
  params: TransferParams,
  callbacks?: TransferCallbacks
) {
  const transferInstruction = await smartAccount.buildComposable({
    type: 'default',
    data: {
      abi: erc20Abi,
      chainId: params.chainId,
      to: params.tokenAddress,
      functionName: 'transfer',
      args: [params.recipient as Hex, params.amount],
    },
  });

  let quoteParams: GetFusionQuoteParams;

  if (isProduction) {
    quoteParams = {
      instructions: [transferInstruction],
      trigger: {
        chainId: params.chainId,
        tokenAddress: params.tokenAddress as Hex,
        amount: params.amount,
      },
      sponsorship: true as const, // gas less in production
    };
  } else {
    quoteParams = {
      instructions: [transferInstruction],
      trigger: {
        chainId: params.chainId,
        tokenAddress: params.tokenAddress as Hex,
        amount: params.amount,
      },
      feeToken: {
        address: params.tokenAddress as Hex,
        chainId: params.chainId,
      },
    };
    console.warn('Using development mode for gasless transfer - sponsorship disabled');
  }

  const fusionQuote = await meeClient.getFusionQuote(quoteParams);

  callbacks?.onSignatureRequested?.();

  const { hash } = await meeClient.executeFusionQuote({ fusionQuote });

  callbacks?.onSignatureReceived?.(hash);

  const transactionReceipt = await meeClient.waitForSupertransactionReceipt({ hash });

  return {
    hash,
    transactionReceipt,
    meeScanLink: getMeeScanLink(hash),
  };
}

/**
 * Gasless transfers via Biconomy for MetaMask, Fireblocks, and WalletConnect wallets.
 */
export const useBiconomyGasLessTransfer = (
  preferredWalletType?: WalletType,
  walletAddress?: `0x${string}`
): UseBiconomyGasLessTransferReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const connections = useConnections();

  const executeBiconomyGasLessTransfer = useCallback(
    async (
      walletClient: WalletClient,
      provider: WalletProvider,
      recipientWalletAddress: `0x${string}`,
      amount: bigint,
      restoreWindowEthereum: () => void,
      callbacks?: TransferCallbacks
    ) => {
      try {
        // Custom transport routes through WalletConnect instead of injected providers
        const customTransport = provider ? custom(provider) : http();

        // Pass provider to bypass SDK bug (see account.ts for details)
        const account = await createMultichainAccount(
          walletClient,
          targetChainViem,
          customTransport,
          provider
        );

        const meeClient = await createMeeClient({
          account,
          url: getDefaultMEENetworkUrl(!isProduction),
          apiKey: process.env.EXPO_PUBLIC_BICONOMY_API_KEY,
        });

        const executionPromise = executeGaslessTransfer(
          meeClient,
          account,
          {
            recipient: recipientWalletAddress,
            amount,
            tokenAddress: targetUsdcAddress,
            chainId: targetChainViem.id,
          },
          callbacks
        );

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error('Transaction timeout. The wallet may have disconnected. Please try again.')
            );
          }, TRANSACTION_TIMEOUT_MS);
        });

        const txResult = await Promise.race([executionPromise, timeoutPromise]);

        return {
          transactionHash: txResult.hash,
          transactionReceipt:
            txResult.transactionReceipt as BiconomyTransactionResult['transactionReceipt'],
          biconomyScanLink: txResult.meeScanLink,
        };
      } finally {
        if (restoreWindowEthereum) {
          restoreWindowEthereum();
        }
      }
    },
    []
  );

  const executeTransaction = useCallback(
    async (
      recipientWalletAddress: `0x${string}`,
      amount: bigint,
      callbacks?: TransferCallbacks
    ) => {
      setIsLoading(true);
      setError(null);
      setSessionError(null);

      let restoreWindowEthereum: (() => void) | undefined;

      try {
        if (amount <= BigInt(0)) {
          throw new Error('Amount must be greater than 0');
        }

        const connection = getPreferredWalletConnection(
          preferredWalletType || 'other_wallet',
          connections
        );

        const connectedAddress = connection?.accounts[0] || walletAddress;

        if (!connectedAddress) {
          throw new Error('No wallet connected');
        }

        const connector = getPreferredWalletConnector(
          preferredWalletType || 'other_wallet',
          getConnectors(config)
        );

        if (!connector) {
          throw new Error('No wallet connector found');
        }

        const provider = (await connector.getProvider?.()) as WalletProvider | undefined;

        if (!provider) {
          throw new Error('Failed to get provider from connector');
        }

        if (provider?.on) {
          provider.on('connect', (payload) => console.log('Connected:', payload));
          provider.on('disconnect', (code, reason) => console.log('Disconnected:', code, reason));
          provider.on('session_update', (session) => console.log('Session updated:', session));
          provider.on('session_proposal', (proposal) => console.log('Session proposal:', proposal));
          provider.on('call_request_sent', (request) => console.log('Request sent:', request));
          provider.on('call_response_received', (response) =>
            console.log('Response received:', response)
          );
        } else {
          console.warn('[Biconomy] Provider does not support event listeners');
        }

        const isWalletConnect = connector.id === 'walletConnect';

        
        // RPC method calls !!! Fireblocks does not support eth_chainId or eth_requestAccounts
        if (preferredWalletType !== 'fireblocks') {
          if (isWalletConnect) {
            try {
              await provider.request({ method: 'eth_chainId' });
            } catch {
              throw new Error('WalletConnect session is inactive. Please reconnect your wallet.');
            }
          }

          // Ensure provider is on the correct chain (includes safety check and chain switching)
          await ensureProviderOnChain(provider, targetChainViem);

          // Request accounts it may request user to open wallet UI
          await rcpRequestAccount(provider);
        }

        // BICONOMY SDK BUG WORKAROUND – inject provider if WalletConnect
        if (isWalletConnect) {
          const { injectProviderAsWindowEthereum } = await import('../../utils/biconomy/account');
          restoreWindowEthereum = injectProviderAsWindowEthereum(provider);
        }

        const walletClient = createWalletClient({
          account: connectedAddress,
          chain: targetChainViem,
          transport: custom(provider),
        });

        if (!walletClient) {
          throw new Error('Failed to create wallet client');
        }

        // Execute biconomy gasless transfer
        return await executeBiconomyGasLessTransfer(
          walletClient,
          provider,
          recipientWalletAddress,
          amount,
          restoreWindowEthereum || (() => {}),
          callbacks
        );
      } catch (err: unknown) {
        console.error('Biconomy] Transaction failed:', err);

        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        const isSessionError =
          errorMessage.toLowerCase().includes('session') ||
          errorMessage.toLowerCase().includes('disconnect') ||
          errorMessage.toLowerCase().includes('expired');

        if (isSessionError) {
          setSessionError(errorMessage);
        }

        const errorObj = err instanceof Error ? err : new Error(errorMessage);
        setError(errorObj);
        throw errorObj;
      } finally {
        if (restoreWindowEthereum) {
          restoreWindowEthereum();
        }

        setIsLoading(false);
      }
    },
    [preferredWalletType, walletAddress, connections, executeBiconomyGasLessTransfer]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSessionError(null);
  }, []);

  return {
    executeTransaction,
    isLoading,
    error,
    sessionError,
    reset,
  };
};
