import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useWallet } from '../src/hooks/useWallet';
import { shortAddress, formatUSDC } from '../src/utils/wallet';
import { COLORS } from '../src/constants';
import { useState } from 'react';

export default function Home() {
  const { address, balance, hasCard, unreadCount, refresh } = useWallet();
  const [refreshing, setRefreshing] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const copyAddress = async () => {
    if (address) { await Clipboard.setStringAsync(address); Alert.alert('✅ Copied!', 'Wallet address copied to clipboard'); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <TouchableOpacity onPress={copyAddress}>
            <Text style={styles.address}>{address ? shortAddress(address) : '...'} ⎘</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <Text style={styles.iconBtnEmoji}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/profile')}>
            <Text style={styles.iconBtnEmoji}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceGlow} />
        <Text style={styles.balanceLabel}>USDC Balance</Text>
        <Text style={styles.balanceAmount}>${formatUSDC(balance)}</Text>
        <Text style={styles.balanceNetwork}>on Arc Testnet ⚡</Text>
        <View style={styles.actionRow}>
          {[
            { emoji: '↗️', label: 'Send', onPress: () => router.push('/send') },
            { emoji: '↙️', label: 'Receive', onPress: () => setShowReceive(true) },
            { emoji: '💳', label: 'Card', onPress: () => router.push('/card') },
            { emoji: '🛒', label: 'Bazarc', onPress: () => router.push('/bazarc') },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionBtn} onPress={action.onPress}>
              <View style={styles.actionIcon}><Text style={styles.actionEmoji}>{action.emoji}</Text></View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nimbus Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Nimbus Card</Text>
        <TouchableOpacity style={[styles.card, hasCard ? styles.cardActive : styles.cardInactive]} onPress={() => router.push('/card')}>
          {hasCard ? (
            <>
              <View style={styles.cardTop}><Text style={styles.cardChip}>▪▪▪▪</Text><Text style={styles.cardNetwork}>Arc ⚡</Text></View>
              <Text style={styles.cardNumber}>•••• •••• •••• {address?.slice(-4)}</Text>
              <View style={styles.cardBottom}><Text style={styles.cardHolder}>NIMBUS CARD</Text><Text style={styles.cardBadge}>✓ ACTIVE</Text></View>
            </>
          ) : (
            <View style={styles.cardEmpty}>
              <Text style={styles.cardEmptyIcon}>💳</Text>
              <Text style={styles.cardEmptyText}>No card yet — Tap to mint yours</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bazarc */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bazarc Marketplace</Text>
        <TouchableOpacity style={styles.promoCard} onPress={() => router.push('/bazarc')}>
          <Text style={styles.promoEmoji}>🛒</Text>
          <View style={styles.promoText}>
            <Text style={styles.promoTitle}>Shop & Sell with USDC</Text>
            <Text style={styles.promoSubtitle}>Decentralized marketplace on Arc</Text>
          </View>
          <Text style={styles.promoArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testnetBadge}>
        <Text style={styles.testnetText}>⚠️ Arc Testnet — Funds have no real value</Text>
      </View>

      {/* Receive Modal */}
      <Modal visible={showReceive} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Receive USDC</Text>
            <Text style={styles.modalSubtitle}>Share your address to receive USDC on Arc Testnet</Text>
            <View style={styles.qrBox}><Text style={styles.qrEmoji}>📲</Text><Text style={styles.qrLabel}>Your Wallet</Text></View>
            <View style={styles.addressBox}><Text style={styles.addressFull} selectable>{address}</Text></View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtn} onPress={copyAddress}><Text style={styles.modalBtnText}>⎘ Copy Address</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGray]} onPress={() => setShowReceive(false)}><Text style={[styles.modalBtnText, { color: COLORS.textSecondary }]}>Close</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  address: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  iconBtnEmoji: { fontSize: 18 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  balanceCard: { backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 24, overflow: 'hidden' },
  balanceGlow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.accent, opacity: 0.08 },
  balanceLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  balanceAmount: { fontSize: 42, fontWeight: '700', color: COLORS.text },
  balanceNetwork: { fontSize: 12, color: COLORS.accent, marginTop: 4, marginBottom: 24 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  actionEmoji: { fontSize: 18 },
  actionLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  card: { borderRadius: 20, padding: 22, height: 160, justifyContent: 'space-between' },
  cardActive: { backgroundColor: COLORS.accent },
  cardInactive: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardChip: { color: 'rgba(255,255,255,0.6)', fontSize: 14, letterSpacing: 2 },
  cardNetwork: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  cardNumber: { color: '#fff', fontSize: 18, letterSpacing: 4, fontWeight: '300' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHolder: { color: 'rgba(255,255,255,0.8)', fontSize: 12, letterSpacing: 2, fontWeight: '600' },
  cardBadge: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  cardEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  cardEmptyIcon: { fontSize: 32 },
  cardEmptyText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  promoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, gap: 14 },
  promoEmoji: { fontSize: 28 },
  promoText: { flex: 1 },
  promoTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  promoSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  promoArrow: { color: COLORS.textMuted, fontSize: 22 },
  testnetBadge: { backgroundColor: 'rgba(255, 179, 71, 0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 179, 71, 0.3)', alignItems: 'center' },
  testnetText: { color: COLORS.warning, fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  qrBox: { height: 140, backgroundColor: COLORS.accentGlow, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', gap: 8 },
  qrEmoji: { fontSize: 48 },
  qrLabel: { color: COLORS.accent, fontWeight: '600' },
  addressBox: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.cardBorder },
  addressFull: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnGray: { backgroundColor: COLORS.cardBorder },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
