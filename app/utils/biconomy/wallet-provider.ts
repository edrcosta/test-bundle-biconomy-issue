import type { EthereumProvider } from './account';
import './types';

interface WagmiConnection {
  connector: {
    provider?: EthereumProvider;
    getProvider?: () => Promise<EthereumProvider>;
  };
}

export interface AvailableWalletProvider {
  on?: (event: string, cb: () => void) => void;
  off?: (event: string, cb: () => void) => void;
  session?: {
    topic?: string;
    expiry?: number;
    namespaces?: Record<string, { accounts?: string[]; chains?: string[] }>;
    requiredNamespaces?: Record<string, unknown>;
    optionalNamespaces?: Record<string, unknown>;
  };
  accounts?: string[];
  chainId?: number;
  connected?: boolean;
  client?: Record<string, unknown>;
  // WalletConnect specific methods
  connect?: (opts?: { optionalChains?: number[]; pairingTopic?: string }) => Promise<void>;
  enable?: () => Promise<string[]>;
  disconnect?: () => Promise<void>;
  request?: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
}

export function getMetaMaskProvider(): EthereumProvider {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected in window');
  }
  return window.ethereum;
}

export function getProviderFromConnection(connection: WagmiConnection): EthereumProvider {
  if (!connection?.connector?.provider) {
    throw new Error('No provider found in connection');
  }
  return connection.connector.provider;
}

/**
 * Both Fireblocks and generic WalletConnect ("other_wallet") use the
 * 'walletConnect' connector ID, so this function works for both.
 */
export async function getWalletConnectProviderAsync(
  connection: WagmiConnection
): Promise<EthereumProvider> {
  if (!connection?.connector) {
    throw new Error('No connector found in connection');
  }

  if (typeof connection.connector.getProvider === 'function') {
    return await connection.connector.getProvider();
  }

  if (connection.connector.provider) {
    return connection.connector.provider;
  }

  throw new Error('No provider found in WalletConnect connection');
}
