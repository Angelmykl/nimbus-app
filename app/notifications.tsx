import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useWallet } from '../src/hooks/useWallet';
import { shortAddress, timeAgo } from '../src/utils/wallet';
import { COLORS, Transaction } from '../src/constants';

function TxItem({ tx }: { tx: Transaction }) {
  const isSent = tx.type === 'sent' || tx.type === 'purchase';
  const icons = { sent: '↗️', received: '↙️', card_minted: '💳', purchase: '🛒' };
  const labels = { sent: 'Sent USDC', received: 'Received USDC', card_minted: 'Card Minted', purchase: 'Bazarc Purchase' };
  const bgColors = { sent: 'rgba(255,107,107,0.15)', received: 'rgba(0,212,170,0.15)', card_minted: 'rgba(108,99,255,0.15)', purchase: 'rgba(255,179,71,0.15)' };

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: bgColors[tx.type] }]}>
        <Text style={styles.txEmoji}>{icons[tx.type]}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txLabel}>{tx.label || labels[tx.type]}</Text>
        <Text style={styles.txAddress}>{shortAddress(tx.address)}</Text>
        <Text style={styles.txTime}>{timeAgo(tx.timestamp)}</Text>
      </View>
      <View style={styles.txRight}>
        {tx.type !== 'card_minted' && (
          <Text style={[styles.txAmount, { color: isSent ? COLORS.danger : COLORS.success }]}>
            {isSent ? '-' : '+'}${tx.amount}
          </Text>
        )}
        <Text style={styles.txStatus}>✓ {tx.status}</Text>
      </View>
    </View>
  );
}

export default function Notifications() {
  const { transactions, markNotificationsRead, refresh } = useWallet();
  useEffect(() => { markNotificationsRead(); refresh(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Activity</Text>
        <View style={{ width: 40 }} />
      </View>
      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyText}>Your transactions will appear here after you send USDC or mint a card</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>Recent Transactions</Text>
          {transactions.map((tx) => <TxItem key={tx.id} tx={tx} />)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  backIcon: { color: COLORS.text, fontSize: 24, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  sectionLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, marginTop: 4 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 14, gap: 12 },
  txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txEmoji: { fontSize: 18 },
  txInfo: { flex: 1, gap: 2 },
  txLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  txAddress: { color: COLORS.textSecondary, fontSize: 12 },
  txTime: { color: COLORS.textMuted, fontSize: 11 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txStatus: { color: COLORS.success, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
