import { useState } from 'react';
import {
  createWalletClient,
  custom,
  erc20Abi,
  http,
  type WalletClient,
  type Hex,
  formatUnits
} from 'viem';
import { baseSepolia } from 'viem/chains';
import {
  createMeeClient,
  toMultichainNexusAccount,
  runtimeERC20BalanceOf,
  greaterThanOrEqualTo,
  getMeeScanLink,
  type MeeClient,
  type MultichainSmartAccount,
  getMEEVersion,
  MEEVersion
} from '@biconomy/abstractjs';
import { useReadContract } from 'wagmi';

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [meeClient, setMeeClient] = useState<MeeClient | null>(null);
  const [orchestrator, setOrchestrator] = useState<MultichainSmartAccount | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [meeScanLink, setMeeScanLink] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<string[]>(['']);

  const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

  const { data: balance } = useReadContract({
    abi: erc20Abi,
    address: usdcAddress,
    chainId: baseSepolia.id,
    functionName: 'balanceOf',
    args: account ? [account as Hex] : undefined,
    query: { enabled: !!account }
  });

  const connectAndInit = async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      alert('MetaMask not detected');
      return;
    }

    const wallet = createWalletClient({
      chain: baseSepolia,
      transport: custom((window as any).ethereum)
    });
    setWalletClient(wallet);

    const [address] = await wallet.requestAddresses();
    setAccount(address);

    const multiAccount = await toMultichainNexusAccount({
      chainConfigurations: [
        {
          chain: baseSepolia,
          transport: http(),
          version: getMEEVersion(MEEVersion.V2_1_0)
        }
      ],
      signer: createWalletClient({
        account: address,
        transport: custom((window as any).ethereum)
      })
    });
    setOrchestrator(multiAccount);

    const mee = await createMeeClient({ account: multiAccount });
    setMeeClient(mee);
  };

  const executeTransfers = async () => {
    if (!orchestrator || !meeClient || !account) {
      alert('Account not initialized');
      return;
    }

    try {
      setStatus('Encoding instructions…');

      await walletClient?.addChain({ chain: baseSepolia });
      await walletClient?.switchChain({ id: baseSepolia.id });

      const transfers = await Promise.all(
        recipients
          .filter((r) => r)
          .map((recipient) =>
            orchestrator.buildComposable({
              type: 'default',
              data: {
                abi: erc20Abi,
                chainId: baseSepolia.id,
                to: usdcAddress,
                functionName: 'transfer',
                args: [recipient as Hex, 1n * 10n ** 6n] // 1 USDC
              }
            })
          )
      );

      const totalAmount = BigInt(transfers.length) * 1_000_000n;

      setStatus('Requesting quote…');
      const fusionQuote = await meeClient.getFusionQuote({
        instructions: transfers,
        trigger: {
          chainId: baseSepolia.id,
          tokenAddress: usdcAddress,
          amount: totalAmount
        },
        feeToken: {
          address: usdcAddress,
          chainId: baseSepolia.id
        }
      });

      setStatus('Executing quote…');
      const { hash } = await meeClient.executeFusionQuote({ fusionQuote });

      const link = getMeeScanLink(hash);
      setMeeScanLink(link);
      setStatus('Waiting for completion…');

      await meeClient.waitForSupertransactionReceipt({ hash });

      setStatus('Transaction completed!');
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err.message ?? err}`);
    }
  };

  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', color: 'orangered' }}>
      <h1>Biconomy MEE Quickstart (Base Sepolia)</h1>

      <button
        style={{ padding: '10px 20px', fontSize: '1rem' }}
        onClick={connectAndInit}
        disabled={!!account}
      >
        {account ? `Connected` : 'Connect Wallet'}
      </button>

      {account && (
        <div style={{ marginTop: 20 }}>
          <p><strong>Address:</strong> {account}</p>
          <p>USDC Balance: {balance ? `${formatUnits(balance, 6)} USDC` : '–'}</p>

          <h3>Recipients</h3>
          {recipients.map((recipient, idx) => (
            <input
              key={idx}
              type="text"
              value={recipient}
              onChange={(e) => {
                const updated = [...recipients];
                updated[idx] = e.target.value;
                setRecipients(updated);
              }}
              placeholder="0x..."
              style={{ display: 'block', margin: '8px 0', padding: '6px', width: '100%' }}
            />
          ))}

          <button onClick={() => setRecipients([...recipients, ''])}>
            Add Recipient
          </button>
        </div>
      )}

      {meeClient && (
        <>
          <p style={{ marginTop: 20 }}>
            <strong>MEE client ready</strong> – you can now orchestrate multichain transactions!
          </p>

          <button
            style={{ padding: '10px 20px', fontSize: '1rem' }}
            onClick={executeTransfers}
          >
            Send 1 USDC to each recipient
          </button>
        </>
      )}

      {status && <p style={{ marginTop: 20 }}>{status}</p>}

      {meeScanLink && (
        <p style={{ marginTop: 10 }}>
          <a href={meeScanLink} target='_blank' rel='noopener noreferrer'>
            View on MEE Scan
          </a>
        </p>
      )}
    </main>
  );
}