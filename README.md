# Biconomy MEE + WalletConnect/Fireblocks Demo

This is a simplified demo application that reproduces the exact Biconomy flow from the Profitr production application. It's designed to help debug issues with WalletConnect and Fireblocks integration.

## Purpose

This demo app isolates the Biconomy gasless transfer flow to make it easier to:

- Reproduce and debug wallet connection issues
- Test Fireblocks and WalletConnect integration
- Share a minimal reproducible example with the Biconomy team

## Architecture

The demo replicates the production flow exactly:

1. **Wagmi Configuration** - Same connector setup (WalletConnect, MetaMask)
2. **Biconomy Utilities** - Exact copies from production:
   - `account.ts` - Multichain account creation with SDK bug workaround
   - `chain.ts` - Chain switching and validation
   - `rpc.ts` - EIP-1193 RPC methods
   - `transactions.ts` - Gasless transfer execution
   - `connections.ts` & `connectors.ts` - Wallet connection helpers
3. **Hooks** - Production hooks:
   - `useBiconomyGasLessTransfer` - Main transfer hook
   - `useBiconomyPaymentFlow` - Payment flow orchestration

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_BICONOMY_API_KEY` - Get from https://dashboard.biconomy.io
- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID` - Get from https://cloud.walletconnect.com

### 3. Run the Application

```bash
bun run dev
```

The app will start on http://localhost:8081

## Configuration

The app uses the same configuration as production:

- **Chain**: Avalanche Fuji Testnet (development) / Avalanche Mainnet (production)
- **Token**: MOCKDIV testnet token (0x926394525525a86Ef0a847698742dfBD9D42E6B3)
- **Deposit Address**: 0x0cBeE0516372F55dcff5a1299AD37498F54c30C8
- **Biconomy**: MEE V2.1.0 with gasless transfers

## Testing the Flow

### 1. Connect Wallet
- Click "WalletConnect" to test generic WalletConnect wallets
- Click "Fireblocks" to test Fireblocks specifically (uses same WalletConnect connector)
- Click "MetaMask" to test MetaMask browser extension

### 2. Execute Transfer
- Enter an amount (in USDC)
- Click "Execute Transfer"
- Approve the signature in your wallet
- Watch the activity log for status updates

## Key Implementation Details

### Biconomyy SDK Workarounds

**Provider injection**

The Biconomy SDK has a bug where it doesn't properly handle custom transports for WalletConnect. The workaround:

1. Set `transport.key = "custom"` in the provider
2. Inject the provider into `window.ethereum` before transaction execution
3. Restore the original `window.ethereum` after completion

**Metro config export -  CJS build**

A circular dependency issue caused by the way Metro Bundler works required a different package resolution for @biconomy/abstractjs  

See `app/utils/biconomy/account.ts` for implementation.

### WalletConnect Flow

For WalletConnect (including Fireblocks):
1. Get provider from connector via `getProvider()`
2. Check chain and switch if needed (all except for fireblocks that do not support the necessary RPC commands)
3. Request accounts
4. Inject provider into window.ethereum
5. Create multichain account with custom transport
6. Execute gasless transfer
7. Restore window.ethereum

### Fireblocks Specifics

Fireblocks uses the same WalletConnect connector but skips some RPC calls:
- No chain switching (Fireblocks controls the chain)
- No account requests (handled by Fireblocks)

### Common Issues

**"Please switch your wallet to Avalanche Fuji"**
- Wallet is on wrong chain
- Solution: Manually switch in wallet app or approve chain switch request

## Original Quickstart

https://docs.biconomy.io/new/quickstart/external-wallets-quickstart#app-ts
