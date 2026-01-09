import type { getConnectors } from '@wagmi/core';

export function getAvailableWalletConnectors(connectors: ReturnType<typeof getConnectors>) {
  const metaMaskConnector = connectors.find((c) => c.id === 'metaMaskSDK');

  const walletConnectConnectors = connectors.filter((c) => c.id === 'walletConnect');
  const walletConnector = walletConnectConnectors[0];
  const metaMaskMobileWalletConnector = walletConnectConnectors[1];

  return {
    metaMaskConnector,
    walletConnector,
    metaMaskMobileWalletConnector,
  };
}

export function getPreferredWalletConnector(
  preferredWalletType: string,
  connectors: ReturnType<typeof getConnectors>
) {
  const walletConnectConnectors = connectors.filter((c) => c.id === 'walletConnect');
  const walletConnector = walletConnectConnectors[0];
  const metaMaskMobileWalletConnector = walletConnectConnectors[1];

  if (preferredWalletType === 'metamask') {
    return connectors.find((c) => c.id === 'metaMaskSDK');
  } else if (preferredWalletType === 'fireblocks' || preferredWalletType === 'other_wallet') {
    return walletConnector;
  } else if (preferredWalletType === 'metamask_mobile') {
    return metaMaskMobileWalletConnector || walletConnector;
  }

  return walletConnector || connectors.find((c) => c.id === 'metaMaskSDK');
}
