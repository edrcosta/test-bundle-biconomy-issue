import type { MultichainSmartAccount } from '@biconomy/abstractjs';
import { getMEEVersion, MEEVersion, toMultichainNexusAccount } from '@biconomy/abstractjs';
import type { Chain, Transport, WalletClient } from 'viem';
import { http } from 'viem';
import './types';

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/**
 * BICONOMY SDK BUG WORKAROUND:
 * The SDK's toWalletClient.ts checks `transport.key === "custom"` to decide
 * whether to use window.ethereum for signing. We set transport.key = "custom"
 * and inject our provider into window.ethereum during transaction execution.
 * Without this workaround, WalletConnect transactions fail because the SDK
 * tries to sign using HTTP transport instead of the wallet provider.
 */
export async function createMultichainAccount(
  walletClient: WalletClient,
  chain: Chain,
  customTransport?: Transport,
  provider?: EthereumProvider
): Promise<MultichainSmartAccount> {
  const chainTransport = customTransport || http();

  const address = walletClient.account?.address;
  if (!address) {
    throw new Error('Wallet client must have an account with an address');
  }

  let signer: Parameters<typeof toMultichainNexusAccount>[0]['signer'];

  if (provider) {
    // Set transport.key = "custom" to trigger SDK's browserSigner path (see SDK bug comment above)
    const providerWithCustomKey = {
      ...provider,
      address,
      request: provider.request.bind(provider),
      transport: { key: 'custom' },
    };

    signer = providerWithCustomKey as unknown as Parameters<
      typeof toMultichainNexusAccount
    >[0]['signer'];
  } else {
    // Browser extension path - uses window.ethereum directly
    signer = walletClient as unknown as Parameters<typeof toMultichainNexusAccount>[0]['signer'];
  }

  const smartAccount = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain,
        transport: chainTransport,
        version: getMEEVersion(MEEVersion.V2_1_0),
      },
    ],
    signer,
  });

  return smartAccount;
}

/** Injects provider into window.ethereum temporarily (SDK bug workaround). Returns cleanup function. */
export function injectProviderAsWindowEthereum(provider: EthereumProvider): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const originalEthereum = window.ethereum;
  window.ethereum = provider;

  // reset window eth
  return () => {
    window.ethereum = originalEthereum;
  };
}
