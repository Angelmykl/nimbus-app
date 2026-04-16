import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { importWallet } from '../src/utils/wallet';
import { useWallet } from '../src/hooks/useWallet';
import { COLORS } from '../src/constants';

export default function Import() {
  const { setWallet } = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!privateKey.trim()) { Alert.alert('Error', 'Please enter your private key'); return; }
    setLoading(true);
    try {
      const wallet = await importWallet(privateKey.trim());
      setWallet(wallet.address, privateKey.trim());
      router.replace('/home');
    } catch { Alert.alert('Error', 'Invalid private key. Please check and try again.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Import Wallet</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>Never share your private key with anyone. Only import keys you own.</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Private Key</Text>
          <TextInput style={styles.input} placeholder="0x..." placeholderTextColor={COLORS.textMuted} value={privateKey} onChangeText={setPrivateKey} autoCapitalize="none" autoCorrect={false} secureTextEntry multiline />
        </View>
        <TouchableOpacity style={[styles.btn, (!privateKey || loading) && styles.btnDisabled]} onPress={handleImport} disabled={!privateKey || loading}>
          <Text style={styles.btnText}>{loading ? 'Importing...' : 'Import Wallet'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  backIcon: { color: COLORS.text, fontSize: 24, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1, paddingHorizontal: 20, gap: 20, paddingTop: 20 },
  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)', padding: 16, gap: 12, alignItems: 'flex-start' },
  warningIcon: { fontSize: 20 },
  warningText: { flex: 1, color: COLORS.danger, fontSize: 13, lineHeight: 18 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  input: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, color: COLORS.text, fontSize: 14, minHeight: 100 },
  btn: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 'auto', marginBottom: 40 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
