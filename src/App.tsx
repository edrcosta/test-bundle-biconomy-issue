import './App.css';
import { useState } from 'react';
import { WalletSelector } from './components/WalletSelector';
import { AccountInfo } from './components/AccountInfo';
import { TransferForm } from './components/TransferForm';
import { useWallet } from './hooks/useWallet';
import { useBiconomy } from './hooks/useBiconomy';
import { useTokenBalance } from './hooks/useTokenBalance';
import type { WalletType } from './types';
import { TRANSFER_AMOUNT, getCurrencyAddress, getCurrencyName } from './config/constants';
import { getActiveChain } from './config/chains';

export default function App() {
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
    <main style={{ padding: 40, fontFamily: 'sans-serif', color: 'orangered' }}>
      <h1>Biconomy MEE Quickstart ({getActiveChain().name})</h1>

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

      {status && <p style={{ marginTop: 20 }}>{status}</p>}

      {meeScanLink && (
        <p style={{ marginTop: 10 }}>
          <a href={meeScanLink} target="_blank" rel="noopener noreferrer">
            View on MEE Scan
          </a>
        </p>
      )}
    </main>
  );
}
