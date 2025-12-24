import React from 'react';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { YStack, Text, H1 } from 'tamagui';
import { WalletSelector } from '../src/components/WalletSelector';
import { AccountInfo } from '../src/components/AccountInfo';
import { TransferForm } from '../src/components/TransferForm';
import { useWallet } from '../src/hooks/useWallet';
import { useBiconomy } from '../src/hooks/useBiconomy';
import { useTokenBalance } from '../src/hooks/useTokenBalance';
import type { WalletType } from '../src/types';
import { TRANSFER_AMOUNT, getCurrencyAddress, getCurrencyName } from '../src/config/constants';
import { getActiveChain } from '../src/config/chains';

export default function Index() {
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [meeScanLink, setMeeScanLink] = useState<string | null>(null);

  const { isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { account, status, isInitialized, initialize, executeTransfer, reset } = useBiconomy();
  const { balance, isLoading, isError } = useTokenBalance(getCurrencyAddress(), account);

  const handleConnect = async (walletType: WalletType) => {
    try {
      const { wallet, address } = await connectWallet(walletType);
      await initialize(wallet, address);
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    reset();
    setRecipients(['']);
    setMeeScanLink(null);
    await disconnectWallet();
  };

  const handleExecuteTransfer = async () => {
    try {
      const result = await executeTransfer({
        recipients,
        amount: TRANSFER_AMOUNT,
        tokenAddress: getCurrencyAddress(),
        chainId: getActiveChain().id
      });
      setMeeScanLink(result.meeScanLink);
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  return (
    <ScrollView>
      <YStack flex={1} padding="$4" backgroundColor="$background">
        <H1 color="$orange10" marginBottom="$4">
          Biconomy MEE Quickstart ({getActiveChain().name})
        </H1>

        {!account ? (
          <WalletSelector onSelectWallet={handleConnect} isConnecting={isConnecting} />
        ) : (
          <>
            <AccountInfo
              account={account}
              balance={balance}
              isLoading={isLoading}
              isError={isError}
              tokenName={getCurrencyName()}
              onDisconnect={handleDisconnect}
            />

            <TransferForm
              recipients={recipients}
              transferAmount={TRANSFER_AMOUNT}
              tokenName={getCurrencyName()}
              onRecipientsChange={setRecipients}
              onSubmit={handleExecuteTransfer}
              isInitialized={isInitialized}
            />
          </>
        )}

        {status && (
          <Text color="$color" marginTop="$4">
            {status}
          </Text>
        )}

        {meeScanLink && (
          <Text color="$blue10" marginTop="$2" onPress={() => {
            // @ts-ignore - web specific
            if (typeof window !== 'undefined') window.open(meeScanLink, '_blank');
          }}>
            View on MEE Scan
          </Text>
        )}
      </YStack>
    </ScrollView>
  );
}
