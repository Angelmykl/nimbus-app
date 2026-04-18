import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Alert, ActivityIndicator, Linking, Platform
} from 'react-native';
import { useState } from 'react';
import { COLORS, ARC_TESTNET } from '../constants';

interface ConnectWalletModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected: (address: string, privateKey?: string) => void;
}

// Arc Testnet chain params for MetaMask
const ARC_CHAIN_PARAMS = {
  chainId: '0x53A', // 1338 in hex
  chainName: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

export default function ConnectWalletModal({ visible, onClose, onConnected }: ConnectWalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  // Connect MetaMask (web only)
  const connectMetaMask = async () => {
    setConnecting('metamask');
    try {
      // Check if MetaMask is available
      const { ethereum } = window as any;
      if (!ethereum || !ethereum.isMetaMask) {
        Alert.alert(
          'MetaMask Not Found',
          'Please install MetaMask browser extension first.',
          [
            { text: 'Install MetaMask', onPress: () => Linking.openURL('https://metamask.io') },
            { text: 'Cancel' }
          ]
        );
        setConnecting(null);
        return;
      }

      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts found');

      // Try to switch to Arc Testnet
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ARC_CHAIN_PARAMS.chainId }],
        });
      } catch (switchError: any) {
        // Chain not added yet — add it
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ARC_CHAIN_PARAMS],
          });
        }
      }

      const address = accounts[0];
      onConnected(address);
      onClose();
      Alert.alert('✅ Connected!', `MetaMask connected:\n${address.slice(0,6)}...${address.slice(-4)}\n\nArc Testnet is active.`);
    } catch (e: any) {
      if (e.code === 4001) {
        Alert.alert('Cancelled', 'Connection was rejected in MetaMask.');
      } else {
        Alert.alert('Error', e.message || 'Failed to connect MetaMask');
      }
    } finally {
      setConnecting(null);
    }
  };

  // Connect Coinbase Wallet (web)
  const connectCoinbase = async () => {
    setConnecting('coinbase');
    try {
      const { ethereum } = window as any;
      if (!ethereum) {
        Alert.alert('No Wallet', 'Please install Coinbase Wallet or MetaMask.');
        setConnecting(null);
        return;
      }
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      onConnected(address);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using browser extension',
      emoji: '🦊',
      onPress: connectMetaMask,
      available: true,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'Connect Coinbase Wallet',
      emoji: '🔵',
      onPress: connectCoinbase,
      available: true,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan QR with any mobile wallet',
      emoji: '📱',
      onPress: () => Alert.alert('Coming Soon', 'WalletConnect QR scanning coming in the next update!'),
      available: false,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Connect your wallet to use Nimbus on Arc Testnet
          </Text>

          {/* Arc Network Badge */}
          <View style={styles.networkBadge}>
            <Text style={styles.networkDot}>⚡</Text>
            <Text style={styles.networkText}>Arc Testnet • Chain ID 1338</Text>
          </View>

          {/* Wallet Options */}
          <View style={styles.walletList}>
            {walletOptions.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={[
                  styles.walletOption,
                  !wallet.available && styles.walletOptionDisabled,
                  connecting === wallet.id && styles.walletOptionActive,
                ]}
                onPress={wallet.onPress}
                disabled={connecting !== null}
              >
                <View style={styles.walletIcon}>
                  <Text style={styles.walletEmoji}>{wallet.emoji}</Text>
                </View>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletDesc}>{wallet.description}</Text>
                </View>
                {connecting === wallet.id ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : !wallet.available ? (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                  </View>
                ) : (
                  <Text style={styles.walletArrow}>›</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Import option */}
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => { onClose(); }}
          >
            <Text style={styles.importBtnText}>🔑 Use Private Key Instead</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Arc Testnet only • Funds have no real value
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentGlow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  networkDot: { fontSize: 16 },
  networkText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  walletList: { gap: 10 },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    gap: 14,
  },
  walletOptionDisabled: {
    opacity: 0.5,
  },
  walletOptionActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentGlow,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  walletEmoji: { fontSize: 22 },
  walletInfo: { flex: 1 },
  walletName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  walletDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  walletArrow: {
    color: COLORS.textMuted,
    fontSize: 22,
  },
  soonBadge: {
    backgroundColor: COLORS.accentGlow,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  soonText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  importBtn: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 14,
    alignItems: 'center',
  },
  importBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
