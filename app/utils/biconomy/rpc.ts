import { targetChainViem } from '../../wagmi';
import type { WalletProvider } from './types';
import type { AvailableWalletProvider } from './wallet-provider';

/**
 * EIP-1193 https://eips.ethereum.org/EIPS/eip-1193
 *
 * NOTE: These RPC methods may not be supported or exist for all wallet providers.
 * so their errors are caught and logged as non-critical.
 */

export const KNOWN_WALLET_ERRORS = {
  chainNotAdded: 4902, // Error code 4902 means chain not added to wallet
};

export async function rpcAddEthereumChain(provider: WalletProvider) {
  return await provider.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: `0x${targetChainViem.id.toString(16)}`,
        chainName: targetChainViem.name,
        nativeCurrency: targetChainViem.nativeCurrency,
        rpcUrls: [targetChainViem.rpcUrls.default.http[0]],
        blockExplorerUrls: targetChainViem.blockExplorers
          ? [targetChainViem.blockExplorers.default.url]
          : undefined,
      },
    ],
  });
}

export async function rpcEthAccounts(provider: AvailableWalletProvider): Promise<string | null> {
  try {
    const result = await provider.request?.({
      method: 'eth_accounts',
    });

    const accounts = result as string[] | undefined;
    return accounts?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function rcpRequestAccount(provider: WalletProvider) {
  try {
    const data = await provider.request({ method: 'eth_requestAccounts' });

    console.log(data);
  } catch (requestAccountsError) {
    console.warn('[Biconomy] eth_requestAccounts failed (non-critical):', requestAccountsError);
  }
}

export async function rpcWalletSwitchEthereumChain(provider: WalletProvider) {
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${targetChainViem.id.toString(16)}` }],
  });
}

export async function rpcGetChainId(provider: WalletProvider) {
  return (await provider.request({
    method: 'eth_chainId',
  })) as string | number;
}
