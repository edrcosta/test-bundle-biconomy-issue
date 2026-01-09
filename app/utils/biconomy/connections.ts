import type { GetConnectionsReturnType } from '@wagmi/core';

export function getAvailableWalletConnections(wagmiConnections: GetConnectionsReturnType) {
  const metaMaskConnection = wagmiConnections.find((c) => c.connector.id === 'metaMaskSDK');
  const walletConnectConnection = wagmiConnections.find((c) => c.connector.id === 'walletConnect');

  return {
    metaMaskConnection,
    walletConnectConnection,
  };
}

export function getPreferredWalletConnection(
  preferredWalletType: string,
  connections: GetConnectionsReturnType
) {
  if (preferredWalletType === 'metamask')
    return connections.find((c) => c.connector.id === 'metaMaskSDK');

  if (preferredWalletType === 'fireblocks' || preferredWalletType === 'other_wallet')
    return connections.find((c) => c.connector.id === 'walletConnect');

  throw new Error('No wallet connector found');
}
