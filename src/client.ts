import { createMeeClient, getDefaultMEENetworkUrl } from '@biconomy/abstractjs';
import type { MultichainSmartAccount, MeeClient } from '@biconomy/abstractjs';
import { USE_MAINNET } from '../config/constants';

export async function initializeMeeClient(
  smartAccount: MultichainSmartAccount,
  apiKey: string
): Promise<MeeClient> {
  const meeClient = await createMeeClient({
    account: smartAccount,
    url: getDefaultMEENetworkUrl(!USE_MAINNET),
    apiKey
  });

  return meeClient;
}
