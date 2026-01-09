import type { Config } from '@wagmi/core';
import { createConfig, http } from '@wagmi/core';
import { avalanche as viemAvalanche, avalancheFuji as viemAvalancheFuji } from 'viem/chains';
import type { CreateConnectorFn } from 'wagmi';
import { avalanche, avalancheFuji } from 'wagmi/chains';

import { metaMask, walletConnect } from 'wagmi/connectors';

declare global {
  var __wagmiConfig: Config | undefined;
  var __wagmiConnectors: CreateConnectorFn[] | undefined;
}

export const isProduction = process.env.EXPO_PUBLIC_DD_ENV === 'production';

const DEVELOPMENT_DEPOSIT_ADDRESS: `0x${string}` = '0x0cBeE0516372F55dcff5a1299AD37498F54c30C8';

function getDepositAddress(): `0x${string}` | null {
  if (!isProduction) return DEVELOPMENT_DEPOSIT_ADDRESS;
  return (process.env.EXPO_PUBLIC_DEPOSIT_ADDRESS as `0x${string}`) ?? null;
}

export const targetChain = isProduction ? avalanche : avalancheFuji;
export const targetChainViem = isProduction ? viemAvalanche : viemAvalancheFuji;

const USDC_MAINNET_TOKEN_ADDRESS = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
const MOCK_DIV_TESTNET_TOKEN_ADDRESS = '0x926394525525a86Ef0a847698742dfBD9D42E6B3';

export const targetUsdcAddress: `0x${string}` = isProduction
  ? USDC_MAINNET_TOKEN_ADDRESS
  : MOCK_DIV_TESTNET_TOKEN_ADDRESS;

export const targetDepositAddress = getDepositAddress();
export const targetAssetType = isProduction ? 'USDC_AVAX' : 'MOCKDIV_AVAX_T';

function getConnectors(): CreateConnectorFn[] {
  if (!globalThis.__wagmiConnectors) {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://profitr.com';

    globalThis.__wagmiConnectors = [
      walletConnect({
        projectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
        metadata: {
          name: 'Profitr',
          description: 'Profitr Investment Platform',
          url,
          icons: ['https://profitr.com/icon.png'],
        },
        showQrModal: true,
        disableProviderPing: false,
        customStoragePrefix: 'profitr_wc',
        qrModalOptions: {
          themeMode: 'light',
          explorerRecommendedWalletIds: undefined,
        },
      }),
      metaMask(),
    ];
  }
  return globalThis.__wagmiConnectors;
}

function getConfig(): Config {
  if (!globalThis.__wagmiConfig) {
    const productionChains = [avalanche] as const;
    const developmentChains = [avalancheFuji] as const;
    const chains = isProduction ? productionChains : developmentChains;

    globalThis.__wagmiConfig = createConfig({
      chains,
      connectors: getConnectors(),
      transports: {
        [avalancheFuji.id]: http(),
        [avalanche.id]: http(),
      },
    });
  }
  return globalThis.__wagmiConfig;
}

export const config = getConfig();
