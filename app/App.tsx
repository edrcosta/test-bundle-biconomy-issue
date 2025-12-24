import './App.css';
// src/main.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import AppTest from './index';

export default function App() {
  const queryClient = new QueryClient();

  return <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
        <AppTest/>
    </QueryClientProvider>
  </WagmiProvider>
}
