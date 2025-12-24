import type { WalletClient } from 'viem';
import type { MultichainSmartAccount } from '@biconomy/abstractjs';

export const WalletType = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
  FIREBLOCKS: 'fireblocks',
  ANCHORAGE: 'anchorage',
} as const;

export type WalletType = typeof WalletType[keyof typeof WalletType];

export interface BiconomyState {
  account: string | null;
  smartAccount: MultichainSmartAccount | null;
  walletClient: WalletClient | null;
  selectedWallet: WalletType | null;
}

export interface TransferParams {
  recipients: string[];
  amount: bigint;
  tokenAddress: string;
  chainId: number;
}

export interface TransferResult {
  hash: string;
  meeScanLink: string;
}

export interface FusionQuoteParams {
  instructions: unknown[];
  trigger: {
    chainId: number;
    tokenAddress: string;
    amount: bigint;
  };
  feeToken: {
    address: string;
    chainId: number;
  };
}
