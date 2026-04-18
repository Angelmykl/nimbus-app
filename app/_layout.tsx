import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WalletProvider } from '../src/hooks/useWallet';
import { COLORS } from '../src/constants';

export default function RootLayout() {
  return (
    <WalletProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="home" />
        <Stack.Screen name="send" />
        <Stack.Screen name="card" />
        <Stack.Screen name="import" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="bazarc" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="profile" />
      </Stack>
    </WalletProvider>
  );
}
