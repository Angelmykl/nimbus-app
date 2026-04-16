import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { sendUSDC } from '../src/utils/wallet';
import { useWallet } from '../src/hooks/useWallet';
import { COLORS } from '../src/constants';

export default function Send() {
  const { balance, refresh } = useWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!toAddress || !amount) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (parseFloat(amount) <= 0) { Alert.alert('Error', 'Amount must be greater than 0'); return; }
    if (parseFloat(amount) > parseFloat(balance)) { Alert.alert('Error', 'Insufficient balance'); return; }
    if (!toAddress.startsWith('0x') || toAddress.length !== 42) { Alert.alert('Error', 'Invalid wallet address'); return; }
    setSending(true);
    try {
      const { hash } = await sendUSDC(toAddress, amount);
      await refresh();
      Alert.alert('✅ Sent!', `$${amount} USDC sent!\n\nTx: ${hash.slice(0, 20)}...`, [{ text: 'Done', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert('Error', e.message || 'Transaction failed'); }
    finally { setSending(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Send USDC</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.balanceChip}><Text style={styles.balanceChipText}>Available: ${parseFloat(balance).toFixed(2)} USDC</Text></View>
        <View style={styles.amountBox}>
          <Text style={styles.currency}>$</Text>
          <TextInput style={styles.amountInput} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          <Text style={styles.usdcLabel}>USDC</Text>
        </View>
        <View style={styles.quickRow}>
          {['1', '5', '10', '25'].map((v) => (
            <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setAmount(v)}>
              <Text style={styles.quickBtnText}>${v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>To Address</Text>
          <TextInput style={styles.input} placeholder="0x..." placeholderTextColor={COLORS.textMuted} value={toAddress} onChangeText={setToAddress} autoCapitalize="none" autoCorrect={false} />
        </View>
        <View style={styles.networkInfo}>
          <Text style={styles.networkLabel}>Network</Text>
          <Text style={styles.networkValue}>⚡ Arc Testnet • ~$0.01 gas</Text>
        </View>
        <TouchableOpacity style={[styles.sendBtn, (!toAddress || !amount || sending) && styles.sendBtnDisabled]} onPress={handleSend} disabled={!toAddress || !amount || sending}>
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Send USDC →</Text>}
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
  content: { flex: 1, paddingHorizontal: 20, gap: 20 },
  balanceChip: { alignSelf: 'center', backgroundColor: COLORS.accentGlow, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.accent },
  balanceChipText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },
  amountBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  currency: { fontSize: 36, color: COLORS.textSecondary, fontWeight: '300' },
  amountInput: { fontSize: 52, fontWeight: '700', color: COLORS.text, minWidth: 80, textAlign: 'center' },
  usdcLabel: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '500', alignSelf: 'flex-end', paddingBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, paddingVertical: 10, alignItems: 'center' },
  quickBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  input: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, color: COLORS.text, fontSize: 15 },
  networkInfo: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.cardBorder },
  networkLabel: { color: COLORS.textSecondary, fontSize: 13 },
  networkValue: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  sendBtn: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 'auto', marginBottom: 40 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
