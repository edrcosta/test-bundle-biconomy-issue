import { useState } from 'react';
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import type { WalletClient } from 'viem';
import { WalletType } from '../types';
import { createWalletProvider } from '../biconomy';
import { getActiveChain } from '../config/chains';

export function useWallet() {
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address: wagmiAddress } = useAccount();

  const connectWallet = async (walletType: WalletType): Promise<{ wallet: WalletClient; address: string }> => {
    setIsConnecting(true);
    setSelectedWallet(walletType);

    try {
      let wallet: WalletClient;
      let address: string;

      const useWalletConnect = [
        WalletType.WALLETCONNECT,
        WalletType.FIREBLOCKS,
        WalletType.ANCHORAGE
      ].includes(walletType as typeof WalletType.WALLETCONNECT | typeof WalletType.FIREBLOCKS | typeof WalletType.ANCHORAGE);

      if (useWalletConnect) {
        const wcConnector = connectors.find(c => c.id === 'walletConnect');
        if (!wcConnector) {
          throw new Error('WalletConnect connector not found');
        }

        await connect({ connector: wcConnector });

        let attempts = 0;
        while (!wagmiAddress && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          attempts++;
        }

        address = wagmiAddress as string;
        if (!address) {
          throw new Error('Failed to get address from WalletConnect');
        }
      } else {
        wallet = await createWalletProvider(walletType, getActiveChain());
        [address] = await wallet.requestAddresses();
      }

      wallet = await createWalletProvider(walletType, getActiveChain());
      setWalletClient(wallet);

      return { wallet, address };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const wcWallets = [WalletType.WALLETCONNECT, WalletType.FIREBLOCKS, WalletType.ANCHORAGE];
      if (selectedWallet && wcWallets.includes(selectedWallet as typeof WalletType.WALLETCONNECT | typeof WalletType.FIREBLOCKS | typeof WalletType.ANCHORAGE)) {
        disconnect();
      }

      const ethereum = (window as any)?.ethereum;
      const hasMetaMask = selectedWallet === WalletType.METAMASK && ethereum;
      
      if (hasMetaMask) {
        try {
          await ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (err) {
          console.error('MetaMask disconnect error:', err);
        }
      }

      setWalletClient(null);
      setSelectedWallet(null);

      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (err) {
      console.error('Disconnect error:', err);
      window.location.reload();
    }
  };

  return {
    walletClient,
    selectedWallet,
    isConnecting,
    connectWallet,
    disconnectWallet
  };
}
