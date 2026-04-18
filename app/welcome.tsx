import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../src/constants';
import { createWallet } from '../src/utils/wallet';
import { useWallet } from '../src/hooks/useWallet';
import { useState } from 'react';

export default function Welcome() {
  const { setWallet } = useWallet();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const wallet = await createWallet();
      setWallet(wallet.address, wallet.privateKey);
      router.replace('/home');
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>☁️</Text>
        </View>
        <Text style={styles.appName}>Nimbus</Text>
        <Text style={styles.tagline}>Your Arc-powered wallet</Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: '💳', text: 'NFT-powered virtual card on Arc' },
          { icon: '⚡', text: 'Instant USDC payments, ~$0.01 gas' },
          { icon: '🛒', text: 'Shop & sell on Bazarc marketplace' },
          { icon: '🔒', text: 'Escrow-protected transactions' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleCreate} disabled={creating}>
          <Text style={styles.btnPrimaryText}>{creating ? 'Creating wallet...' : '✨ Create New Wallet'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => router.push('/import')}>
          <Text style={styles.btnSecondaryText}>Import Existing Wallet</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>Keys stored securely on your device only • Arc Testnet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24 },
  glow: { position: 'absolute', top: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORS.accent, opacity: 0.07 },
  logoArea: { alignItems: 'center', marginTop: 20 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 42, fontWeight: '700', color: COLORS.text, letterSpacing: 1 },
  tagline: { fontSize: 16, color: COLORS.textSecondary, marginTop: 6 },
  features: { width: '100%', gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, gap: 14 },
  featureIcon: { fontSize: 22 },
  featureText: { color: COLORS.text, fontSize: 14, fontWeight: '500', flex: 1 },
  buttons: { width: '100%', gap: 12 },
  btn: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.accent },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.accent },
  btnSecondaryText: { color: COLORS.accent, fontSize: 16, fontWeight: '600' },
  disclaimer: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },
});
