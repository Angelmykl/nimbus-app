import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useWallet } from '../src/hooks/useWallet';
import { COLORS } from '../src/constants';
import { timeAgo, shortAddress } from '../src/utils/wallet';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Order {
  id: string;
  productName: string;
  emoji: string;
  amount: string;
  seller: string;
  status: 'escrow' | 'released' | 'refunded';
  createdAt: number;
  hash: string;
}

const STATUS_CONFIG = {
  escrow: { label: 'In Escrow', color: COLORS.warning, emoji: '🔒', desc: 'Funds locked — confirm when received' },
  released: { label: 'Completed', color: COLORS.success, emoji: '✅', desc: 'Payment released to seller' },
  refunded: { label: 'Refunded', color: COLORS.danger, emoji: '↩️', desc: 'Funds returned to you' },
};

export default function Orders() {
  const { refresh } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const raw = await AsyncStorage.getItem('bazarc_orders');
      if (raw) setOrders(JSON.parse(raw));
    } catch {}
    setLoading(false);
  };

  const confirmReceived = async (order: Order) => {
    Alert.alert(
      '✅ Confirm Receipt',
      `Confirm you received "${order.productName}"?\n\nThis releases $${order.amount} USDC to the seller. Cannot be undone.`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Release Payment',
          onPress: async () => {
            setReleasing(order.id);
            try {
              const updated = orders.map(o =>
                o.id === order.id ? { ...o, status: 'released' as const } : o
              );
              setOrders(updated);
              await AsyncStorage.setItem('bazarc_orders', JSON.stringify(updated));
              await refresh();
              Alert.alert('🎉 Done!', `$${order.amount} USDC released to seller!`);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed');
            } finally { setReleasing(null); }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyText}>Your Bazarc purchases will appear here</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/bazarc')}>
            <Text style={styles.shopBtnText}>Browse Bazarc →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.summaryRow}>
            {[
              { label: 'Total', value: orders.length.toString() },
              { label: 'Pending', value: orders.filter(o => o.status === 'escrow').length.toString() },
              { label: 'Done', value: orders.filter(o => o.status === 'released').length.toString() },
            ].map((s, i) => (
              <View key={i} style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={styles.orderImg}>
                    <Text style={styles.orderEmoji}>{order.emoji}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderName}>{order.productName}</Text>
                    <Text style={styles.orderSeller}>{shortAddress(order.seller)}</Text>
                    <Text style={styles.orderTime}>{timeAgo(order.createdAt)}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderPrice}>${order.amount}</Text>
                    <Text style={styles.orderCurrency}>USDC</Text>
                  </View>
                </View>

                <View style={[styles.statusBar, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '40' }]}>
                  <Text style={styles.statusEmoji}>{cfg.emoji}</Text>
                  <View>
                    <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    <Text style={styles.statusDesc}>{cfg.desc}</Text>
                  </View>
                </View>

                {order.status === 'escrow' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, releasing === order.id && { opacity: 0.6 }]}
                      onPress={() => confirmReceived(order)}
                      disabled={releasing === order.id}
                    >
                      {releasing === order.id
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.confirmBtnText}>✓ Confirm Received</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.refundBtn}
                      onPress={() => Alert.alert('Refund', 'Contact the seller first. Admin can issue refund if needed.')}
                    >
                      <Text style={styles.refundBtnText}>Request Refund</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.txHash}>Tx: {order.hash.slice(0, 22)}...</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingBox: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  backIcon: { color: COLORS.text, fontSize: 24, lineHeight: 28 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
  shopBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { padding: 20, gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  summaryCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 12, alignItems: 'center', gap: 2 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary },
  orderCard: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 16, gap: 12 },
  orderTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  orderImg: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.accentGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent },
  orderEmoji: { fontSize: 26 },
  orderInfo: { flex: 1, gap: 2 },
  orderName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  orderSeller: { color: COLORS.textSecondary, fontSize: 12 },
  orderTime: { color: COLORS.textMuted, fontSize: 11 },
  orderRight: { alignItems: 'flex-end' },
  orderPrice: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  orderCurrency: { color: COLORS.textSecondary, fontSize: 11 },
  statusBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1, gap: 10 },
  statusEmoji: { fontSize: 20 },
  statusLabel: { fontSize: 13, fontWeight: '700' },
  statusDesc: { color: COLORS.textSecondary, fontSize: 11, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 2, backgroundColor: COLORS.success, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  refundBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.cardBorder },
  refundBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  txHash: { color: COLORS.textMuted, fontSize: 10 },
});
