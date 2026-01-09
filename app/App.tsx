import './App.css';
// src/main.tsx
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import BiconomyDemo from './components/BiconomyDemo';

export default function App() {
  const queryClient = new QueryClient();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BiconomyDemo />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

