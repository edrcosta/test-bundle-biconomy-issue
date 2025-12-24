import { formatBalance } from '../utils/format';

interface TransferFormProps {
  recipients: string[];
  transferAmount: bigint;
  tokenName: string;
  onRecipientsChange: (recipients: string[]) => void;
  onSubmit: () => void;
  isInitialized: boolean;
}

export function TransferForm({
  recipients,
  transferAmount,
  tokenName,
  onRecipientsChange,
  onSubmit,
  isInitialized
}: TransferFormProps) {
  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    onRecipientsChange(updated);
  };

  const addRecipient = () => {
    onRecipientsChange([...recipients, '']);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Recipients</h3>
      {recipients.map((recipient, idx) => (
        <input
          key={idx}
          type="text"
          value={recipient}
          onChange={(e) => updateRecipient(idx, e.target.value)}
          placeholder="0x..."
          style={{
            display: 'block',
            margin: '8px 0',
            padding: '6px',
            width: '100%'
          }}
        />
      ))}

      <button onClick={addRecipient} style={{ marginTop: 10 }}>
        Add Recipient
      </button>

      {isInitialized && (
        <>
          <p style={{ marginTop: 20 }}>
            Ready to send gasless transactions!
          </p>

          <button
            style={{ padding: '10px 20px', fontSize: '1rem' }}
            onClick={onSubmit}
          >
            Send {formatBalance(transferAmount)} {tokenName} to each recipient
          </button>
        </>
      )}
    </div>
  );
}
