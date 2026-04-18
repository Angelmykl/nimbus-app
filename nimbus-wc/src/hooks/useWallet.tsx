import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadWallet, getUSDCBalance, hasNimbusCard, getTransactions, getProducts } from '../utils/wallet';
import { Transaction, Product, ARC_TESTNET } from '../constants';

const CONNECTED_ADDRESS_KEY = 'nimbus_connected_address';
const WALLET_TYPE_KEY = 'nimbus_wallet_type'; // 'internal' | 'external'

interface WalletState {
  address: string | null;
  privateKey: string | null;
  walletType: 'internal' | 'external' | null; // internal = private key, external = MetaMask
  balance: string;
  hasCard: boolean;
  transactions: Transaction[];
  products: Product[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  setWallet: (address: string, privateKey: string) => void;
  setExternalWallet: (address: string) => void; // for MetaMask
  disconnectWallet: () => void;
  markNotificationsRead: () => void;
  sendWithMetaMask: (to: string, amount: string) => Promise<{ hash: string }>;
}

const WalletContext = createContext<WalletState>({
  address: null, privateKey: null, walletType: null,
  balance: '0.00', hasCard: false, transactions: [], products: [],
  unreadCount: 0, loading: true,
  refresh: async () => {}, setWallet: () => {}, setExternalWallet: () => {},
  disconnectWallet: () => {}, markNotificationsRead: () => {},
  sendWithMetaMask: async () => ({ hash: '' }),
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'internal' | 'external' | null>(null);
  const [balance, setBalance] = useState('0.00');
  const [hasCard, setHasCard] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRead, setLastRead] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!address) return;
    const [bal, card, txs, prods] = await Promise.all([
      getUSDCBalance(address), hasNimbusCard(address), getTransactions(), getProducts(),
    ]);
    setBalance(bal); setHasCard(card); setTransactions(txs); setProducts(prods);
    setUnreadCount(txs.filter(t => t.timestamp > lastRead).length);
  };

  // Set internal wallet (private key)
  const setWallet = (addr: string, pk: string) => {
    setAddress(addr);
    setPrivateKey(pk);
    setWalletType('internal');
    AsyncStorage.setItem(WALLET_TYPE_KEY, 'internal');
  };

  // Set external wallet (MetaMask/WalletConnect)
  const setExternalWallet = (addr: string) => {
    setAddress(addr);
    setPrivateKey(null);
    setWalletType('external');
    AsyncStorage.setItem(CONNECTED_ADDRESS_KEY, addr);
    AsyncStorage.setItem(WALLET_TYPE_KEY, 'external');
  };

  const disconnectWallet = async () => {
    await AsyncStorage.multiRemove([CONNECTED_ADDRESS_KEY, WALLET_TYPE_KEY]);
    setAddress(null);
    setPrivateKey(null);
    setWalletType(null);
    setBalance('0.00');
    setHasCard(false);
  };

  const markNotificationsRead = () => { setLastRead(Date.now()); setUnreadCount(0); };

  // Send via MetaMask (external wallet)
  const sendWithMetaMask = async (to: string, amount: string): Promise<{ hash: string }> => {
    if (Platform.OS !== 'web') throw new Error('MetaMask only available on web');
    const { ethereum } = window as any;
    if (!ethereum) throw new Error('MetaMask not found');

    // Convert USDC amount to hex (6 decimals)
    const amountInUnits = BigInt(Math.round(parseFloat(amount) * 1_000_000));
    const amountHex = '0x' + amountInUnits.toString(16);

    // USDC transfer function call data
    const transferABI = '0xa9059cbb'; // transfer(address,uint256)
    const paddedTo = to.slice(2).padStart(64, '0');
    const paddedAmount = amountInUnits.toString(16).padStart(64, '0');
    const data = transferABI + paddedTo + paddedAmount;

    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: address,
        to: '0x3600000000000000000000000000000000000000', // USDC contract
        data,
        gas: '0x30D40', // 200000
      }],
    });

    return { hash: txHash };
  };

  useEffect(() => {
    (async () => {
      const savedType = await AsyncStorage.getItem(WALLET_TYPE_KEY);

      if (savedType === 'external') {
        // Restore external wallet connection
        const savedAddr = await AsyncStorage.getItem(CONNECTED_ADDRESS_KEY);
        if (savedAddr) {
          setAddress(savedAddr);
          setWalletType('external');
          const [bal, card, txs, prods] = await Promise.all([
            getUSDCBalance(savedAddr), hasNimbusCard(savedAddr), getTransactions(), getProducts(),
          ]);
          setBalance(bal); setHasCard(card); setTransactions(txs); setProducts(prods);
        }
      } else {
        // Load internal wallet
        const wallet = await loadWallet();
        if (wallet) {
          setAddress(wallet.address);
          setPrivateKey(wallet.privateKey);
          setWalletType('internal');
          const [bal, card, txs, prods] = await Promise.all([
            getUSDCBalance(wallet.address), hasNimbusCard(wallet.address), getTransactions(), getProducts(),
          ]);
          setBalance(bal); setHasCard(card); setTransactions(txs); setProducts(prods);
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (address) refresh(); }, [address]);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const { ethereum } = window as any;
    if (!ethereum) return;

    const handleAccountChange = (accounts: string[]) => {
      if (accounts.length > 0 && walletType === 'external') {
        setAddress(accounts[0]);
        AsyncStorage.setItem(CONNECTED_ADDRESS_KEY, accounts[0]);
      }
    };

    ethereum.on?.('accountsChanged', handleAccountChange);
    return () => ethereum.removeListener?.('accountsChanged', handleAccountChange);
  }, [walletType]);

  return (
    <WalletContext.Provider value={{
      address, privateKey, walletType, balance, hasCard,
      transactions, products, unreadCount, loading,
      refresh, setWallet, setExternalWallet, disconnectWallet,
      markNotificationsRead, sendWithMetaMask,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
