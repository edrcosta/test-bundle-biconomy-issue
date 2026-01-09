import { useState } from 'react';
import { useConnect, useConnections, useDisconnect, useConnectors } from 'wagmi';
import type { WalletType } from '../types/wallet';
import { useBiconomyPaymentFlow } from '../hooks/transactions/useBiconomyPaymentFlow';
import { 
  targetDepositAddress, 
  targetChainViem, 
  isProduction,
  targetAssetType 
} from '../../wagmi.config';
import { getPreferredWalletConnector } from '../utils/biconomy';

export default function BiconomyDemo() {
  const [selectedWallet, setSelectedWallet] = useState<WalletType>('other_wallet');
  const [amount, setAmount] = useState<string>('1');
  const [status, setStatus] = useState<string>('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);

  const connections = useConnections();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();

  const tokenName = isProduction ? 'USDC' : 'MOCKDIV';
  const chainName = isProduction ? 'Avalanche C-Chain' : 'Avalanche Fuji Testnet';
  const chainId = targetChainViem.id;

  // Use useConnect with mutation callbacks like production
  const connectHook = useConnect({
    mutation: {
      onSuccess: (data) => {
        const address = data.accounts[0];
        if (address) {
          const addressStr = typeof address === 'string' ? address : address.address;
          setStatus('Connected');
          addLog(`Connected: ${addressStr.substring(0, 10)}...`);
        }
      },
      onError: (err) => {
        const message = err.message || 'Connection failed';
        const isUserRejection = message.toLowerCase().includes('user rejected') || 
                               message.toLowerCase().includes('user denied');
        
        if (isUserRejection) {
          setStatus('User cancelled connection');
          addLog('User cancelled the connection request');
        } else {
          setStatus(`Connection error: ${message}`);
          addLog(`Connection failed: ${message}`);
        }
      },
    },
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const connection = connections[0];
  const walletAddress = connection?.accounts[0] as `0x${string}` | undefined;
  const isConnected = !!walletAddress;

  const { executePayment, isLoading, error } = useBiconomyPaymentFlow(
    {
      payerWalletAddress: walletAddress,
      walletType: selectedWallet,
      depositAddress: targetDepositAddress || '0x0cBeE0516372F55dcff5a1299AD37498F54c30C8',
      amountUsd: Number.parseFloat(amount),
      paymentTokenDecimals: 6, // USDC decimals
    },
    {
      onSignatureRequested: () => {
        setStatus('Signature requested - check your wallet');
        addLog('Signature requested');
      },
      onSignatureReceived: (hash) => {
        setStatus(`Transaction submitted: ${hash}`);
        addLog(`Signature received: ${hash.substring(0, 10)}...`);
      },
      onSuccess: (result) => {
        setStatus('Transaction successful!');
        addLog(`Success! Hash: ${result.transactionHash.substring(0, 10)}...`);
        addLog(`MEE Scan: ${result.biconomyScanLink}`);
      },
      onError: (error) => {
        setStatus(`Error: ${error.message}`);
        addLog(`Error: ${error.message}`);
      },
    }
  );

  const handleConnect = async (walletType: WalletType) => {
    try {
      setSelectedWallet(walletType);
      addLog(`Connecting to ${walletType}...`);
      setStatus('Connecting...');

      // Get connector using the same logic as production
      const connector = getPreferredWalletConnector(walletType, connectors);

      if (!connector) {
        throw new Error(`${walletType} connector not found`);
      }

      addLog(`Using connector: ${connector.name} (${connector.id})`);

      // Use connectAsync with chainId parameter (required for WalletConnect)
      // This is the exact same pattern as production FireblocksModal
      await connectHook.connectAsync({ 
        connector,
        chainId: targetChainViem.id 
      });
      
      // Success is handled by mutation.onSuccess callback
    } catch (err) {
      // Error is handled by mutation.onError callback
      console.error('[Demo] Connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setStatus('Disconnected');
      addLog('Disconnected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Disconnect failed';
      addLog(`Disconnect failed: ${message}`);
    }
  };

  const handleExecutePayment = async () => {
    try {
      addLog(`Initiating payment of ${amount} ${tokenName}...`);
      await executePayment();
    } catch (err) {
      // Error handling is done in the hook callbacks
      console.error('Payment execution error:', err);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      overflowY: 'auto', 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'system-ui' 
    }}>
      <h1>Biconomy MEE Demo - Profitr Flow</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Test Biconomy gasless transfers with WalletConnect (Fireblocks) and MetaMask on {chainName}
      </p>

      {/* Connection Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>1. Connect Wallet</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => handleConnect('other_wallet')}
            disabled={isConnected || connectHook.isPending}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedWallet === 'other_wallet' ? '#0070f3' : '#eee',
              color: selectedWallet === 'other_wallet' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: isConnected || connectHook.isPending ? 'not-allowed' : 'pointer',
              opacity: isConnected || connectHook.isPending ? 0.5 : 1,
            }}
          >
            WalletConnect
          </button>
          <button
            onClick={() => handleConnect('fireblocks')}
            disabled={isConnected || connectHook.isPending}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedWallet === 'fireblocks' ? '#0070f3' : '#eee',
              color: selectedWallet === 'fireblocks' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: isConnected || connectHook.isPending ? 'not-allowed' : 'pointer',
              opacity: isConnected || connectHook.isPending ? 0.5 : 1,
            }}
          >
            Fireblocks
          </button>
          <button
            onClick={() => handleConnect('metamask')}
            disabled={isConnected || connectHook.isPending}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedWallet === 'metamask' ? '#0070f3' : '#eee',
              color: selectedWallet === 'metamask' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: isConnected || connectHook.isPending ? 'not-allowed' : 'pointer',
              opacity: isConnected || connectHook.isPending ? 0.5 : 1,
            }}
          >
            MetaMask
          </button>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Disconnect
            </button>
          )}
        </div>
        {walletAddress && (
          <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <strong>Connected:</strong> {walletAddress}
          </div>
        )}
      </div>

      {/* Payment Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>2. Execute Gasless Transfer</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>Amount ({tokenName}):</strong>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e: any) => setAmount(e.target.value)}
            disabled={!isConnected || isLoading}
            style={{
              padding: '10px',
              width: '200px',
              border: '1px solid #ddd',
              borderRadius: '5px',
            }}
            step="0.01"
            min="0.01"
          />
        </div>
        <button
          onClick={handleExecutePayment}
          disabled={!isConnected || isLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: !isConnected || isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !isConnected || isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {isLoading ? 'Processing...' : 'Execute Transfer'}
        </button>
      </div>

      {/* Status Section */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Status</h2>
        <div
          style={{
            padding: '15px',
            backgroundColor: error ? '#ffe6e6' : '#e6f3ff',
            borderRadius: '5px',
            fontFamily: 'monospace',
          }}
        >
          {status}
        </div>
      </div>

      {/* Logs Section */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Activity Log</h2>
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#999' }}>No activity yet</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Section */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <strong>Configuration:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>Environment: {isProduction ? 'Production' : 'Development'}</li>
          <li>Chain: {chainName} ({chainId})</li>
          <li>Token: {tokenName} ({targetAssetType})</li>
          <li>Deposit Address: {targetDepositAddress}</li>
          <li>Sponsorship: {isProduction ? 'Enabled (gasless)' : 'Disabled (gas required)'}</li>
        </ul>
      </div>
    </div>
  );
}
