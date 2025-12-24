import { createWeb3Modal } from '@web3modal/wagmi/react'
import { walletConnect } from '@wagmi/connectors'
import type { Config } from '@wagmi/core'

const projectId = ''

let web3Modal: any = null

export function initWeb3Modal(wagmiConfig: Config) {
  if (!projectId) {
    console.warn('WalletConnect Project ID not found. Get one at https://cloud.walletconnect.com')
    return
  }

  web3Modal = createWeb3Modal({
    wagmiConfig,
    projectId,
    enableAnalytics: false,
    enableOnramp: false
  })

  return web3Modal
}

export function openWeb3Modal() {
  if (web3Modal) {
    web3Modal.open()
  }
}

export function getWalletConnectConnector(_chains: any[]) {
  if (!projectId) {
    throw new Error('WalletConnect Project ID not configured')
  }

  return walletConnect({
    projectId,
    metadata: {
      name: 'Biconomy MEE Fusion',
      description: 'Gasless multichain transactions',
      url: 'https://biconomy.io',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    },
    showQrModal: true
  })
}
