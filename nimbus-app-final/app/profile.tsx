import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useWallet } from '../src/hooks/useWallet';
import { shortAddress, formatUSDC } from '../src/utils/wallet';
import { COLORS, CONTRACTS, ARC_TESTNET } from '../src/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const { address, balance, hasCard, transactions } = useWallet();

  const copyAddress = async () => {
    if (address) { await Clipboard.setStringAsync(address); Alert.alert('✅ Copied!', 'Address copied to clipboard'); }
  };

  const viewOnExplorer = () => {
    Alert.alert('Arc Explorer', `${ARC_TESTNET.explorerUrl}/address/${address}`);
  };

  const clearWallet = () => {
    Alert.alert('⚠️ Clear Wallet', 'This removes your wallet from this device. Make sure you have your private key saved!', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Wallet',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('nimbus_wallet_pk');
          router.replace('/welcome');
        }
      }
    ]);
  };

  const totalSent = transactions.filter(t => t.type === 'sent').reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  const totalTxs = transactions.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Avatar & address */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarEmoji}>☁️</Text></View>
        <Text style={styles.walletLabel}>Nimbus Wallet</Text>
        <TouchableOpacity onPress={copyAddress}>
          <Text style={styles.walletAddress}>{address ? shortAddress(address) : '...'} ⎘</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Balance', value: `$${formatUSDC(balance)}` },
          { label: 'Transactions', value: totalTxs.toString() },
          { label: 'Total Sent', value: `$${totalSent.toFixed(2)}` },
        ].map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Card status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nimbus Card</Text>
        <TouchableOpacity style={styles.cardStatusRow} onPress={() => router.push('/card')}>
          <View style={[styles.cardDot, { backgroundColor: hasCard ? COLORS.success : COLORS.textMuted }]} />
          <Text style={styles.cardStatusText}>{hasCard ? '✓ Active NFT Card' : 'No card — Tap to get one'}</Text>
          <Text style={styles.cardStatusArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Info</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'Network', value: 'Arc Testnet ⚡' },
            { label: 'USDC Contract', value: shortAddress(CONTRACTS.USDC) },
            { label: 'Card Contract', value: shortAddress(CONTRACTS.NIMBUS_CARD) },
            { label: 'Escrow Contract', value: shortAddress(CONTRACTS.BAZARC_ESCROW) },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i < 3 && styles.infoBorder]}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Full address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Wallet Address</Text>
        <TouchableOpacity style={styles.addressCard} onPress={copyAddress}>
          <Text style={styles.addressText} selectable>{address}</Text>
          <Text style={styles.copyIcon}>⎘</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={viewOnExplorer}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>View on Arc Explorer</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/import')}>
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionText}>Import Different Wallet</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={clearWallet}>
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionText, { color: COLORS.danger }]}>Clear Wallet from Device</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.versionBadge}>
        <Text style={styles.versionText}>Nimbus v1.0 • Arc Testnet • Built by Angelmykl</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  backIcon: { color: COLORS.text, fontSize: 24, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  avatarSection: { alignItems: 'center', gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.accentGlow, borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  walletLabel: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  walletAddress: { fontSize: 13, color: COLORS.accent, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardStatusRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, gap: 12 },
  cardDot: { width: 10, height: 10, borderRadius: 5 },
  cardStatusText: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  cardStatusArrow: { color: COLORS.textMuted, fontSize: 20 },
  infoCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  infoLabel: { color: COLORS.textSecondary, fontSize: 13 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '500' },
  addressCard: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressText: { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
  copyIcon: { color: COLORS.accent, fontSize: 18 },
  actionsCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  actionDivider: { height: 1, backgroundColor: COLORS.cardBorder },
  actionIcon: { fontSize: 18 },
  actionText: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  actionArrow: { color: COLORS.textMuted, fontSize: 20 },
  versionBadge: { alignItems: 'center' },
  versionText: { color: COLORS.textMuted, fontSize: 11 },
});
