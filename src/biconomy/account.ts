import { toMultichainNexusAccount, getMEEVersion, MEEVersion } from '@biconomy/abstractjs';
import type { MultichainSmartAccount } from '@biconomy/abstractjs';
import type { WalletClient, Chain } from 'viem';
import { http } from 'viem';

export async function createMultichainAccount(
  walletClient: WalletClient,
  chain: Chain
): Promise<MultichainSmartAccount> {
  console.log('>>>>', getMEEVersion(MEEVersion.V2_1_0))
  const multiAccount = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain,
        transport: http(),
        version: getMEEVersion(MEEVersion.V2_1_0)
      }
    ],
    signer: walletClient as unknown as Parameters<typeof toMultichainNexusAccount>[0]['signer']
  });

  return multiAccount;
}
