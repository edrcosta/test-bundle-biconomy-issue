import { WalletType } from '../types';

interface WalletSelectorProps {
  onSelectWallet: (walletType: WalletType) => void;
  isConnecting: boolean;
}

export function WalletSelector({ onSelectWallet, isConnecting }: WalletSelectorProps) {
  const wallets = [
    { type: WalletType.METAMASK, label: 'MetaMask', emoji: '🦊' },
    { type: WalletType.WALLETCONNECT, label: 'WalletConnect', emoji: '🔗' },
    { type: WalletType.FIREBLOCKS, label: 'Fireblocks', emoji: '🔥' },
    { type: WalletType.ANCHORAGE, label: 'Anchorage', emoji: '⚓' },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Select Wallet:</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {wallets.map(({ type, label, emoji }) => (
          <button
            key={type}
            onClick={() => onSelectWallet(type)}
            disabled={isConnecting}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isConnecting ? 0.6 : 1,
              cursor: isConnecting ? 'not-allowed' : 'pointer'
            }}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
