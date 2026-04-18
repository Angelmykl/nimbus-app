import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { loadWallet, getUSDCBalance, hasNimbusCard, getTransactions, getProducts } from '../utils/wallet';
import { Transaction, Product } from '../constants';

interface WalletState {
  address: string | null;
  privateKey: string | null;
  balance: string;
  hasCard: boolean;
  transactions: Transaction[];
  products: Product[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  setWallet: (address: string, privateKey: string) => void;
  markNotificationsRead: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null, privateKey: null, balance: '0.00', hasCard: false,
  transactions: [], products: [], unreadCount: 0, loading: true,
  refresh: async () => {}, setWallet: () => {}, markNotificationsRead: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
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

  const setWallet = (addr: string, pk: string) => { setAddress(addr); setPrivateKey(pk); };
  const markNotificationsRead = () => { setLastRead(Date.now()); setUnreadCount(0); };

  useEffect(() => {
    (async () => {
      const wallet = await loadWallet();
      if (wallet) {
        setAddress(wallet.address); setPrivateKey(wallet.privateKey);
        const [bal, card, txs, prods] = await Promise.all([
          getUSDCBalance(wallet.address), hasNimbusCard(wallet.address), getTransactions(), getProducts(),
        ]);
        setBalance(bal); setHasCard(card); setTransactions(txs); setProducts(prods);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (address) refresh(); }, [address]);

  return (
    <WalletContext.Provider value={{
      address, privateKey, balance, hasCard, transactions, products,
      unreadCount, loading, refresh, setWallet, markNotificationsRead,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
