import { createWalletClient, custom } from 'viem';
import type { WalletClient, Chain } from 'viem';
import type { WalletType } from '../types';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

export async function createWalletProvider(
  _walletType: WalletType,
  chain: Chain
): Promise<WalletClient> {
  const ethereum = (window as { ethereum?: EthereumProvider }).ethereum;
  if (!ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or use WalletConnect.');
  }

  return createWalletClient({
    chain,
    transport: custom(ethereum),
  });
}
