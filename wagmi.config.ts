import type { Config } from '@wagmi/core';
import { createConfig, http } from '@wagmi/core';
import type { CreateConnectorFn } from 'wagmi';
import { avalanche, avalancheFuji, mainnet, sepolia } from 'wagmi/chains';
import { metaMask, walletConnect } from 'wagmi/connectors';

declare global {
  var __wagmiConfig: Config | undefined;
  var __wagmiConnectors: CreateConnectorFn[] | undefined;
}

const isProduction = process.env.EXPO_PUBLIC_DD_ENV === 'production';

const DEVELOPMENT_DEPOSIT_ADDRESS: `0x${string}` = '0x0cBeE0516372F55dcff5a1299AD37498F54c30C8';

function getDepositAddress(): `0x${string}` | null {
  if (!isProduction) return DEVELOPMENT_DEPOSIT_ADDRESS;
  return (process.env.EXPO_PUBLIC_DEPOSIT_ADDRESS as `0x${string}`) ?? null;
}

export const targetChain = isProduction ? avalanche : avalancheFuji;
export const targetUsdcAddress: `0x${string}` = isProduction
  ? '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  : '0x926394525525a86Ef0a847698742dfBD9D42E6B3';
export const targetDepositAddress = getDepositAddress();
export const targetAssetType = isProduction ? 'USDC_AVAX' : 'MOCKDIV_AVAX_T';

function getConnectors(): CreateConnectorFn[] {
  if (!globalThis.__wagmiConnectors) {
    const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

    globalThis.__wagmiConnectors = [
      walletConnect({
        projectId: process.env.ENVIRONMENT === 'production' ? projectId : '',
      }),
      metaMask(),
    ];
  }
  return globalThis.__wagmiConnectors;
}

function getConfig(): Config {
  if (!globalThis.__wagmiConfig) {
    const productionChains = [avalanche, mainnet] as const;
    const developmentChains = [avalancheFuji, sepolia] as const;
    const chains = isProduction ? productionChains : developmentChains;
    globalThis.__wagmiConfig = createConfig({
      chains: chains as typeof productionChains | typeof developmentChains,
      connectors: getConnectors(),
      transports: {
        [avalanche.id]: http(),
        [avalancheFuji.id]: http(),
        [mainnet.id]: http(),
        [sepolia.id]: http(),
      },
    });
  }
  return globalThis.__wagmiConfig;
}

export const config = getConfig();
