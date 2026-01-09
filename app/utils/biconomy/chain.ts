import type { Chain } from 'viem';
import type { EthereumProvider } from './account';
import {
  KNOWN_WALLET_ERRORS,
  rpcAddEthereumChain,
  rpcGetChainId,
  rpcWalletSwitchEthereumChain,
} from './rpc';

const normalizeChainId = (chainId: string | number): number => {
  if (typeof chainId === 'number') return chainId;
  if (chainId.startsWith('0x')) return Number.parseInt(chainId, 16);
  return Number.parseInt(chainId, 10);
};

async function isUsingCorrectChain(
  provider: EthereumProvider,
  chain: Chain,
  throws = false
): Promise<boolean> {
  const rawChainId = await rpcGetChainId(provider);
  const currentChainId = normalizeChainId(rawChainId);

  if (currentChainId === chain.id) {
    return true;
  }

  if (throws) {
    throw new Error(
      `Please switch your wallet to ${chain.name} (chain ${chain.id}). ` +
        `Current chain: ${currentChainId}. ` +
        `Open your wallet app and switch networks manually.`
    );
  }

  return false;
}

async function tryAddChain(provider: EthereumProvider): Promise<void> {
  try {
    await rpcWalletSwitchEthereumChain(provider);
  } catch (switchError: unknown) {
    const errorCode = (switchError as { code?: number })?.code;

    if (errorCode !== KNOWN_WALLET_ERRORS.chainNotAdded) {
      throw switchError;
    }
    // Error 4902: chain not added - try adding it
    await rpcAddEthereumChain(provider);
    await rpcWalletSwitchEthereumChain(provider);
  }
}

/**
 * Ensures the provider is switched to the target chain.
 * Attempts to add the chain if it doesn't exist (error 4902).
 */
export async function ensureProviderOnChain(
  provider: EthereumProvider,
  chain: Chain
): Promise<void> {
  // 1. Initial check
  if (await isUsingCorrectChain(provider, chain)) {
    return;
  }

  // 2. Try to switch/add chain
  await tryAddChain(provider);

  // 3. Poll for successful switch (some wallets are slow to update chainId)
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000;

  for (let i = 0; i < MAX_RETRIES; i++) {
    if (await isUsingCorrectChain(provider, chain)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
  }

  // 4. Final check / throw
  await isUsingCorrectChain(provider, chain, true);
}
