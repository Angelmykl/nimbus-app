import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { useWallet } from '../src/hooks/useWallet';
import { shortAddress, mintNimbusCard } from '../src/utils/wallet';
import { COLORS, CONTRACTS } from '../src/constants';

export default function Card() {
  const { address, hasCard, balance, refresh } = useWallet();
  const [minting, setMinting] = useState(false);

  const copyAddress = async () => {
    if (address) { await Clipboard.setStringAsync(address); Alert.alert('Copied!', 'Address copied'); }
  };

  const handleMint = async () => {
    if (!address) return;
    Alert.alert('💳 Mint Nimbus Card', 'This sends a real transaction on Arc Testnet. Your card will be an ERC-721 NFT.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mint Card',
        onPress: async () => {
          setMinting(true);
          try {
            const { hash } = await mintNimbusCard(address);
            await refresh();
            Alert.alert('🎉 Card Minted!', `NFT issued to your wallet!\n\nTx: ${hash.slice(0, 20)}...`);
          } catch (e: any) {
            if (e.message === 'OWNER_ONLY') {
              Alert.alert('Owner Required', 'To mint a card:\n\n1. Import the deployer wallet (from nimbus-contracts)\n2. Come back here and tap Mint\n\nThe deployer address is:\n0xC802Aca1766Aa343b54D5Bde70D4E90655468AD0');
            } else {
              Alert.alert('Error', e.message || 'Minting failed');
            }
          } finally { setMinting(false); }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Nimbus Card</Text>
        <View style={{ width: 40 }} />
      </View>

      {hasCard ? (
        <View style={styles.card}>
          <View style={styles.cardGlow} />
          <View style={styles.cardTop}>
            <View style={styles.chip}><View style={styles.chipInner} /></View>
            <Text style={styles.networkBadge}>⚡ Arc</Text>
          </View>
          <Text style={styles.cardNumber}>•••• •••• •••• {address?.slice(-4)}</Text>
          <View style={styles.cardBottom}>
            <View><Text style={styles.cardLabel}>CARDHOLDER</Text><Text style={styles.cardValue}>NIMBUS USER</Text></View>
            <View style={{ alignItems: 'flex-end' }}><Text style={styles.cardLabel}>BALANCE</Text><Text style={styles.cardValue}>${parseFloat(balance).toFixed(2)}</Text></View>
          </View>
          <View style={styles.cardFooter}><Text style={styles.cardBrand}>NIMBUS</Text><Text style={styles.cardStatus}>✓ ACTIVE NFT</Text></View>
        </View>
      ) : (
        <View style={styles.cardEmpty}>
          <Text style={styles.cardEmptyIcon}>💳</Text>
          <Text style={styles.cardEmptyTitle}>No Card Yet</Text>
          <Text style={styles.cardEmptyText}>Your Nimbus Card is an ERC-721 NFT on Arc that authorizes payments on Bazarc</Text>
          <TouchableOpacity style={[styles.mintBtn, minting && { opacity: 0.6 }]} onPress={handleMint} disabled={minting}>
            {minting ? <ActivityIndicator color="#fff" /> : <Text style={styles.mintBtnText}>🪄 Mint My Nimbus Card</Text>}
          </TouchableOpacity>
          <Text style={styles.mintNote}>Requires deployer wallet • ~$0.01 USDC gas</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Details</Text>
        <View style={styles.detailCard}>
          {[
            { label: 'Type', value: 'ERC-721 NFT' },
            { label: 'Network', value: 'Arc Testnet ⚡' },
            { label: 'Contract', value: shortAddress(CONTRACTS.NIMBUS_CARD) },
            { label: 'Status', value: hasCard ? '✓ Active' : '✗ Not issued' },
          ].map((item, i) => (
            <View key={i} style={[styles.detailRow, i < 3 && styles.detailBorder]}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={[styles.detailValue, item.label === 'Status' && hasCard && { color: COLORS.success }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Address</Text>
        <TouchableOpacity style={styles.addressCard} onPress={copyAddress}>
          <Text style={styles.addressText} selectable>{address}</Text>
          <Text style={styles.copyIcon}>⎘</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.howCard}>
          {[
            { step: '1', text: 'Card is minted as an NFT to your wallet' },
            { step: '2', text: 'Smart contract verifies you hold the NFT' },
            { step: '3', text: 'Tap "Buy" on Bazarc to authorize payments' },
          ].map((item) => (
            <View key={item.step} style={styles.howRow}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>{item.step}</Text></View>
              <Text style={styles.howText}>{item.text}</Text>
            </View>
          ))}
        </View>
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
  card: { backgroundColor: COLORS.accent, borderRadius: 24, padding: 24, height: 210, justifyContent: 'space-between', overflow: 'hidden' },
  cardGlow: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: '#fff', opacity: 0.08 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { width: 36, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  chipInner: { width: 22, height: 16, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  networkBadge: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
  cardNumber: { color: '#fff', fontSize: 20, letterSpacing: 4, fontWeight: '300' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 1, fontWeight: '600' },
  cardValue: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '800', letterSpacing: 3 },
  cardStatus: { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  cardEmpty: { backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed', minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  cardEmptyIcon: { fontSize: 44 },
  cardEmptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  cardEmptyText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  mintBtn: { marginTop: 8, backgroundColor: COLORS.accent, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, minWidth: 160, alignItems: 'center' },
  mintBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mintNote: { color: COLORS.textMuted, fontSize: 11 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  detailCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  detailLabel: { color: COLORS.textSecondary, fontSize: 14 },
  detailValue: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  addressCard: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressText: { color: COLORS.textSecondary, fontSize: 12, flex: 1 },
  copyIcon: { color: COLORS.accent, fontSize: 18 },
  howCard: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, gap: 14 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accentGlow, borderWidth: 1, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  howText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
});
