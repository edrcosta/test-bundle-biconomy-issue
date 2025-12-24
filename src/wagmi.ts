import { avalanche, avalancheFuji } from 'viem/chains';
import { createConfig, http } from 'wagmi';
import { walletConnect, injected } from '@wagmi/connectors';
import { WALLETCONNECT_PROJECT_ID } from './config/constants';

const connectors = [injected()];

if (WALLETCONNECT_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true
    }) as ReturnType<typeof injected>
  );
}

export const config = createConfig({
  chains: [avalanche, avalancheFuji],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http()
  },
  connectors
});