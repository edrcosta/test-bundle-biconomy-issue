import { avalanche, avalancheFuji } from 'viem/chains';
import { USE_MAINNET } from './constants';

export function getActiveChain() {
  return USE_MAINNET ? avalanche : avalancheFuji;
}
