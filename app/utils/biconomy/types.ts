import type { EthereumProvider } from './account';

export interface EthereumProviderWithEvents extends EthereumProvider {
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  off?: (event: string, callback: (...args: unknown[]) => void) => void;
}

export interface WalletConnectSession {
  expiry?: number;
  namespaces?: {
    eip155?: {
      chains?: string[];
      accounts?: string[];
    };
  };
}

export interface WalletProvider extends EthereumProviderWithEvents {
  session?: WalletConnectSession;
  client?: {
    extend?: unknown;
  };
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
