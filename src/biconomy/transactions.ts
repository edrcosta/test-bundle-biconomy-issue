import { erc20Abi } from 'viem';
import type { Hex, WalletClient } from 'viem';
import type { MultichainSmartAccount, MeeClient } from '@biconomy/abstractjs';
import type { TransferParams, TransferResult } from '../types';
import { getMeeScanLink } from '../utils/format';

export async function buildTransferInstructions(
  smartAccount: MultichainSmartAccount,
  params: TransferParams
) {
  const { recipients, amount, tokenAddress, chainId } = params;

  const transfers = await Promise.all(
    recipients
      .filter(recipient => recipient)
      .map(recipient =>
        smartAccount.buildComposable({
          type: 'default',
          data: {
            abi: erc20Abi,
            chainId,
            to: tokenAddress as Hex,
            functionName: 'transfer',
            args: [recipient as Hex, amount]
          }
        })
      )
  );

  return transfers;
}

export async function prepareChain(walletClient: WalletClient, chainId: number, chain: { id: number; name: string }) {
  await walletClient.addChain({ chain: chain as Parameters<WalletClient['addChain']>[0]['chain'] });
  await walletClient.switchChain({ id: chainId });
}

export async function executeGaslessTransfer(
  meeClient: MeeClient,
  walletClient: WalletClient,
  smartAccount: MultichainSmartAccount,
  params: TransferParams,
  chain: { id: number; name: string }
): Promise<TransferResult> {
  await prepareChain(walletClient, params.chainId, chain);

  const transfers = await buildTransferInstructions(smartAccount, params);
  const totalAmount = params.amount * BigInt(params.recipients.filter(r => r).length);

  const fusionQuote = await meeClient.getFusionQuote({
    instructions: transfers,
    trigger: {
      chainId: params.chainId,
      tokenAddress: params.tokenAddress as Hex,
      amount: totalAmount
    },
    feeToken: {
      address: params.tokenAddress as Hex,
      chainId: params.chainId
    }
  });

  const { hash } = await meeClient.executeFusionQuote({ fusionQuote });
  await meeClient.waitForSupertransactionReceipt({ hash });

  return {
    hash,
    meeScanLink: getMeeScanLink(hash)
  };
}
