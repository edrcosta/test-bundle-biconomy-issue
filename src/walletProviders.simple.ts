import { createWalletClient, custom, type WalletClient, type Chain } from 'viem';

export const WalletType = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
} as const;

export type WalletType = typeof WalletType[keyof typeof WalletType];

export async function createWalletProvider(
  _walletType: WalletType,
  chain: Chain
): Promise<WalletClient> {
  if (typeof (window as any).ethereum === 'undefined') {
    throw new Error('No wallet detected. Please install MetaMask or use WalletConnect.');
  }

  return createWalletClient({
    chain,
    transport: custom((window as any).ethereum),
  });
}
