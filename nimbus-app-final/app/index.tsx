import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useWallet } from '../src/hooks/useWallet';
import { COLORS } from '../src/constants';

export default function Index() {
  const { address, loading } = useWallet();
  useEffect(() => {
    if (!loading) {
      router.replace(address ? '/home' : '/welcome');
    }
  }, [loading, address]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
});
