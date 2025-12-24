import { TamaguiProvider } from 'tamagui';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../src/wagmi';
import tamaguiConfig from '../tamagui.config';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig}>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Biconomy MEE Quickstart' }} />
          </Stack>
        </TamaguiProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
