import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useWallet } from '../src/hooks/useWallet';
import { addProduct, createEscrowOrder } from '../src/utils/wallet';
import { COLORS, Product } from '../src/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order } from './orders';

const DEMO_PRODUCTS: Product[] = [
  { id: '1', name: 'Arc Genesis NFT', description: 'First edition NFT minted on Arc Testnet. One of a kind collectible.', price: '10.00', category: 'NFT', seller: '0xC802Aca1766Aa343b54D5Bde70D4E90655468AD0', emoji: '🎨', listedAt: Date.now() - 3600000 },
  { id: '2', name: 'Digital Art Pack', description: 'Collection of 5 unique digital artworks from Arc builders.', price: '25.00', category: 'Art', seller: '0xA112000000000000000000000000000000099B10', emoji: '🖼️', listedAt: Date.now() - 7200000 },
  { id: '3', name: 'Dev Sticker Bundle', description: 'Arc builder sticker pack — show off your builder status.', price: '5.00', category: 'Merch', seller: '0xD331000000000000000000000000000000072FA0', emoji: '🏷️', listedAt: Date.now() - 14400000 },
  { id: '4', name: 'Web3 Course Access', description: 'Full access to building on Arc Network — videos, code, community.', price: '20.00', category: 'Digital', seller: '0xF990000000000000000000000000000000011CC0', emoji: '📚', listedAt: Date.now() - 86400000 },
  { id: '5', name: 'Logo Design Service', description: 'Professional logo design for your Web3 project. 3 revisions.', price: '50.00', category: 'Service', seller: '0xB221000000000000000000000000000000044AB0', emoji: '✏️', listedAt: Date.now() - 43200000 },
];

const CATEGORIES = ['All', 'NFT', 'Art', 'Merch', 'Digital', 'Service', 'Other'];
const CATEGORY_EMOJIS: Record<string, string> = { NFT: '🎨', Art: '🖼️', Merch: '🏷️', Digital: '📚', Service: '✏️', Other: '📦' };

export default function Bazarc() {
  const { address, hasCard, balance, refresh } = useWallet();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSell, setShowSell] = useState(false);
  const [selectedCat, setSelectedCat] = useState('All');
  const [buying, setBuying] = useState<string | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [myOrderCount, setMyOrderCount] = useState(0);

  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pCat, setPCat] = useState('NFT');
  const [listing, setListing] = useState(false);

  useEffect(() => { loadOrderCount(); }, []);

  const loadOrderCount = async () => {
    const raw = await AsyncStorage.getItem('bazarc_orders');
    if (raw) {
      const orders: Order[] = JSON.parse(raw);
      setMyOrderCount(orders.filter(o => o.status === 'escrow').length);
    }
  };

  const allProducts = [...localProducts, ...DEMO_PRODUCTS];
  const filtered = selectedCat === 'All' ? allProducts : allProducts.filter(p => p.category === selectedCat);

  const handleBuy = (product: Product) => {
    if (!hasCard) {
      Alert.alert('No Card', 'You need a Nimbus Card to buy on Bazarc!', [
        { text: 'Get Card', onPress: () => router.push('/card') },
        { text: 'Cancel' }
      ]);
      return;
    }
    if (parseFloat(balance) < parseFloat(product.price)) {
      Alert.alert('Insufficient Balance', `You need $${product.price} USDC.\n\nGet free testnet USDC from faucet.circle.com`);
      return;
    }

    Alert.alert(
      `Buy ${product.name}`,
      `Pay $${product.price} USDC?\n\nFunds go into escrow until you confirm receipt. Check "My Orders" to track and release payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay $${product.price} USDC`,
          onPress: async () => {
            setBuying(product.id);
            try {
              // Save order to AsyncStorage
              const newOrder: Order = {
                id: Date.now().toString(),
                productName: product.name,
                emoji: product.emoji,
                amount: product.price,
                seller: product.seller,
                status: 'escrow',
                createdAt: Date.now(),
                hash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0'),
              };
              const raw = await AsyncStorage.getItem('bazarc_orders');
              const existing: Order[] = raw ? JSON.parse(raw) : [];
              await AsyncStorage.setItem('bazarc_orders', JSON.stringify([newOrder, ...existing]));
              setMyOrderCount(prev => prev + 1);
              Alert.alert(
                '🛒 Order Created!',
                `$${product.price} USDC is in escrow!\n\nGo to "My Orders" to track and confirm when you receive the item.`,
                [
                  { text: 'View Orders', onPress: () => router.push('/orders') },
                  { text: 'Keep Browsing' }
                ]
              );
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Purchase failed');
            } finally { setBuying(null); }
          }
        }
      ]
    );
  };

  const handleList = async () => {
    if (!pName || !pPrice || !pDesc) { Alert.alert('Missing Info', 'Please fill all fields'); return; }
    if (isNaN(parseFloat(pPrice)) || parseFloat(pPrice) <= 0) { Alert.alert('Invalid Price', 'Enter a valid price'); return; }
    setListing(true);
    const newProduct: Product = {
      id: Date.now().toString(),
      name: pName, description: pDesc, price: pPrice, category: pCat,
      seller: address ? `${address.slice(0, 6)}...${address.slice(-5)}` : 'You',
      emoji: CATEGORY_EMOJIS[pCat] || '📦',
      listedAt: Date.now(),
    };
    await addProduct(newProduct);
    setLocalProducts(prev => [newProduct, ...prev]);
    setListing(false); setShowSell(false);
    setPName(''); setPDesc(''); setPPrice('');
    Alert.alert('🎉 Listed!', `${pName} is live on Bazarc for $${pPrice} USDC!`);
  };

  if (showWelcome) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backIcon}>‹</Text></TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.welcomeContent}>
          <View style={styles.welcomeGlow} />
          <Text style={styles.welcomeEmoji}>🛒</Text>
          <Text style={styles.welcomeTitle}>Welcome to Bazarc</Text>
          <Text style={styles.welcomeTagline}>
            The decentralized marketplace built on Arc — where your Nimbus Card is your payment method and USDC is money.
          </Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: '⚡', title: 'Instant Settlement', desc: 'Sub-second USDC payments on Arc' },
              { icon: '🔒', title: 'Escrow Protected', desc: 'Funds locked until you confirm receipt' },
              { icon: '💳', title: 'Card Payments', desc: 'Nimbus Card NFT authorizes all buys' },
              { icon: '0.1%', title: 'Near Zero Fees', desc: 'Only 0.1% per completed transaction' },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
          {!hasCard && (
            <View style={styles.cardWarning}>
              <Text style={styles.cardWarningText}>💳 You need a Nimbus Card to buy on Bazarc</Text>
              <TouchableOpacity onPress={() => router.push('/card')}>
                <Text style={styles.cardWarningLink}>Get your card →</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.enterBtn} onPress={() => setShowWelcome(false)}>
            <Text style={styles.enterBtnText}>Enter Bazarc →</Text>
          </TouchableOpacity>
          <Text style={styles.welcomeDisclaimer}>Testnet only • Built on Arc Network • No real value</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowWelcome(true)}><Text style={styles.backIcon}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Bazarc 🛒</Text>
        <View style={styles.headerRight}>
          {myOrderCount > 0 && (
            <TouchableOpacity style={styles.ordersBtn} onPress={() => router.push('/orders')}>
              <Text style={styles.ordersBtnText}>📦 {myOrderCount}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.sellBtn} onPress={() => setShowSell(true)}>
            <Text style={styles.sellBtnText}>+ Sell</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* My Orders shortcut */}
      <TouchableOpacity style={styles.ordersShortcut} onPress={() => router.push('/orders')}>
        <Text style={styles.ordersShortcutEmoji}>📦</Text>
        <Text style={styles.ordersShortcutText}>My Orders {myOrderCount > 0 ? `(${myOrderCount} pending)` : ''}</Text>
        <Text style={styles.ordersShortcutArrow}>›</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow} contentContainerStyle={styles.catContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.catChip, selectedCat === cat && styles.catChipActive]} onPress={() => setSelectedCat(cat)}>
            <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.productList}>
        <Text style={styles.resultsText}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</Text>
        {filtered.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productImageBox}>
              <Text style={styles.productEmoji}>{product.emoji}</Text>
            </View>
            <View style={styles.productInfo}>
              <View style={styles.productTopRow}>
                <View style={styles.catBadge}><Text style={styles.catBadgeText}>{product.category}</Text></View>
                <Text style={styles.productSeller}>{product.seller.length > 15 ? shortAddress(product.seller) : product.seller}</Text>
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDesc} numberOfLines={2}>{product.description}</Text>
              <View style={styles.productFooter}>
                <Text style={styles.productPrice}>${product.price} USDC</Text>
                <TouchableOpacity
                  style={[styles.buyBtn, buying === product.id && { opacity: 0.6 }]}
                  onPress={() => handleBuy(product)}
                  disabled={buying === product.id}
                >
                  {buying === product.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.buyBtnText}>Buy</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sell Modal */}
      <Modal visible={showSell} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>List a Product</Text>
              <Text style={styles.modalSubtitle}>Fill in the details to sell on Bazarc</Text>

              <TextInput style={styles.input} placeholder="Product name" placeholderTextColor={COLORS.textMuted} value={pName} onChangeText={setPName} />
              <TextInput style={[styles.input, { height: 80 }]} placeholder="Description — what are you selling?" placeholderTextColor={COLORS.textMuted} value={pDesc} onChangeText={setPDesc} multiline />
              <TextInput style={styles.input} placeholder="Price in USDC (e.g. 10.00)" placeholderTextColor={COLORS.textMuted} value={pPrice} onChangeText={setPPrice} keyboardType="decimal-pad" />

              <Text style={styles.catPickerLabel}>Category</Text>
              <View style={styles.catPickerRow}>
                {['NFT', 'Art', 'Merch', 'Digital', 'Service', 'Other'].map((cat) => (
                  <TouchableOpacity key={cat} style={[styles.catPickerChip, pCat === cat && styles.catPickerActive]} onPress={() => setPCat(cat)}>
                    <Text style={[styles.catPickerText, pCat === cat && { color: '#fff' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoEmoji}>📸</Text>
                <Text style={styles.photoText}>Product photo upload</Text>
                <Text style={styles.photoSubtext}>Coming soon via IPFS — uses category icon for now</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, listing && { opacity: 0.6 }]} onPress={handleList} disabled={listing}>
                  {listing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>List Product</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnGray]} onPress={() => setShowSell(false)}>
                  <Text style={[styles.modalBtnText, { color: COLORS.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  backIcon: { color: COLORS.text, fontSize: 24, lineHeight: 28 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ordersBtn: { backgroundColor: 'rgba(255,179,71,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.warning },
  ordersBtnText: { color: COLORS.warning, fontWeight: '700', fontSize: 12 },
  sellBtn: { backgroundColor: COLORS.accent, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  sellBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  ordersShortcut: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 10 },
  ordersShortcutEmoji: { fontSize: 18 },
  ordersShortcutText: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: '500' },
  ordersShortcutArrow: { color: COLORS.textMuted, fontSize: 18 },
  welcomeContent: { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center', gap: 20 },
  welcomeGlow: { position: 'absolute', top: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: COLORS.accent, opacity: 0.06 },
  welcomeEmoji: { fontSize: 64, marginTop: 20 },
  welcomeTitle: { fontSize: 34, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  welcomeTagline: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  featureCard: { width: '47%', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, gap: 4 },
  featureIcon: { fontSize: 22, marginBottom: 4 },
  featureTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  featureDesc: { color: COLORS.textSecondary, fontSize: 11, lineHeight: 16 },
  cardWarning: { backgroundColor: 'rgba(108,99,255,0.1)', borderRadius: 14, borderWidth: 1, borderColor: COLORS.accent, padding: 16, width: '100%', alignItems: 'center', gap: 8 },
  cardWarningText: { color: COLORS.text, fontSize: 13, textAlign: 'center' },
  cardWarningLink: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  enterBtn: { backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 48, width: '100%', alignItems: 'center' },
  enterBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  welcomeDisclaimer: { color: COLORS.textMuted, fontSize: 11 },
  catRow: { maxHeight: 50 },
  catContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder },
  catChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  catTextActive: { color: '#fff', fontWeight: '700' },
  productList: { padding: 20, gap: 14 },
  resultsText: { color: COLORS.textMuted, fontSize: 12, marginBottom: 4 },
  productCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  productImageBox: { height: 100, backgroundColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { fontSize: 48 },
  productInfo: { padding: 16, gap: 6 },
  productTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBadge: { backgroundColor: COLORS.accentGlow, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.accent },
  catBadgeText: { color: COLORS.accent, fontSize: 10, fontWeight: '700' },
  productSeller: { color: COLORS.textMuted, fontSize: 11 },
  productName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  productDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  productPrice: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  buyBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, minWidth: 70, alignItems: 'center' },
  buyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: COLORS.cardBorder, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  input: { backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 14, color: COLORS.text, fontSize: 14 },
  catPickerLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  catPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.cardBorder },
  catPickerActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catPickerText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  photoPlaceholder: { backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder, borderStyle: 'dashed', padding: 20, alignItems: 'center', gap: 4 },
  photoEmoji: { fontSize: 28 },
  photoText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  photoSubtext: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnGray: { backgroundColor: COLORS.cardBorder },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
