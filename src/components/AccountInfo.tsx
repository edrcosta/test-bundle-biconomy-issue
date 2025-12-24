import { formatBalance } from '../utils/format';

interface AccountInfoProps {
  account: string;
  balance: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  tokenName: string;
  onDisconnect: () => void;
}

export function AccountInfo({ account, balance, isLoading, isError, tokenName, onDisconnect }: AccountInfoProps) {
  const displayBalance = () => {
    if (isLoading) return 'Loading...';
    if (isError) return 'Error loading balance';
    return `${formatBalance(balance)} ${tokenName}`;
  };

  return (
    <div style={{
      marginTop: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '10px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px'
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
          Connected: <strong>{account.slice(0, 6)}...{account.slice(-4)}</strong>
        </p>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
          Balance: <strong>{displayBalance()}</strong>
        </p>
      </div>
      <button
        style={{
          padding: '8px 16px',
          fontSize: '0.9rem',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500'
        }}
        onClick={onDisconnect}
      >
        Disconnect
      </button>
    </div>
  );
}
