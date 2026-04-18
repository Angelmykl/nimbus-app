import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { createPublicClient, http, formatUnits } from 'viem';
import { ARC_TESTNET, CONTRACTS, USDC_ABI, NIMBUS_CARD_ABI, Transaction, Product } from '../constants';

const WALLET_KEY = 'nimbus_wallet_pk';
const TX_HISTORY_KEY = 'nimbus_tx_history';
const PRODUCTS_KEY = 'bazarc_products';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try { return await AsyncStorage.getItem(key); } catch { return null; }
  },
  async setItem(key: string, value: string): Promise<void> {
    try { await AsyncStorage.setItem(key, value); } catch {}
  },
};

const arcChain = {
  id: ARC_TESTNET.id,
  name: ARC_TESTNET.name,
  nativeCurrency: ARC_TESTNET.nativeCurrency,
  rpcUrls: { default: { http: [ARC_TESTNET.rpcUrl] } },
} as const;

export const publicClient = createPublicClient({
  chain: arcChain,
  transport: http(ARC_TESTNET.rpcUrl),
});

export async function getTransactions(): Promise<Transaction[]> {
  const raw = await storage.getItem(TX_HISTORY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const existing = await getTransactions();
  const updated = [tx, ...existing].slice(0, 50);
  await storage.setItem(TX_HISTORY_KEY, JSON.stringify(updated));
}

export async function getProducts(): Promise<Product[]> {
  const raw = await storage.getItem(PRODUCTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function addProduct(product: Product): Promise<void> {
  const existing = await getProducts();
  await storage.setItem(PRODUCTS_KEY, JSON.stringify([product, ...existing]));
}

export async function createWallet(): Promise<{ address: string; privateKey: string }> {
  const wallet = ethers.Wallet.createRandom();
  await storage.setItem(WALLET_KEY, wallet.privateKey);
  return { address: wallet.address, privateKey: wallet.privateKey };
}

export async function importWallet(privateKey: string): Promise<{ address: string }> {
  const wallet = new ethers.Wallet(privateKey);
  await storage.setItem(WALLET_KEY, privateKey);
  return { address: wallet.address };
}

export async function loadWallet(): Promise<{ address: string; privateKey: string } | null> {
  const pk = await storage.getItem(WALLET_KEY);
  if (!pk) return null;
  try {
    const wallet = new ethers.Wallet(pk);
    return { address: wallet.address, privateKey: pk };
  } catch { return null; }
}

export async function getUSDCBalance(address: string): Promise<string> {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.USDC as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return formatUnits(balance as bigint, 6);
  } catch { return '0.00'; }
}

export async function hasNimbusCard(address: string): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: CONTRACTS.NIMBUS_CARD as `0x${string}`,
      abi: NIMBUS_CARD_ABI,
      functionName: 'isCardholder',
      args: [address as `0x${string}`],
    });
    return result as boolean;
  } catch { return false; }
}

export async function sendUSDC(toAddress: string, amount: string): Promise<{ hash: string }> {
  const pk = await storage.getItem(WALLET_KEY);
  if (!pk) throw new Error('No wallet found');
  const provider = new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
  const signer = new ethers.Wallet(pk, provider);
  const usdc = new ethers.Contract(CONTRACTS.USDC, ['function transfer(address to, uint256 amount) returns (bool)'], signer);
  const parsedAmount = ethers.parseUnits(amount, 6);
  const tx = await usdc.transfer(toAddress, parsedAmount);
  await tx.wait();
  await addTransaction({ id: tx.hash, type: 'sent', amount, address: toAddress, hash: tx.hash, timestamp: Date.now(), status: 'success' });
  return { hash: tx.hash };
}

// NEW: Anyone can mint their own card - no owner required
export async function mintNimbusCard(userAddress: string): Promise<{ hash: string }> {
  const pk = await storage.getItem(WALLET_KEY);
  if (!pk) throw new Error('NO_INTERNAL_WALLET');
  const provider = new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
  const signer = new ethers.Wallet(pk, provider);
  const contract = new ethers.Contract(
    CONTRACTS.NIMBUS_CARD,
    ['function mintMyCard() external'],
    signer
  );
  const tx = await contract.mintMyCard();
  await tx.wait();
  await addTransaction({ id: tx.hash, type: 'card_minted', amount: '0', address: userAddress, hash: tx.hash, timestamp: Date.now(), status: 'success', label: 'Nimbus Card Minted' });
  return { hash: tx.hash };
}

// MetaMask mint - calls mintMyCard via MetaMask
export async function mintNimbusCardMetaMask(userAddress: string): Promise<{ hash: string }> {
  const { ethereum } = window as any;
  if (!ethereum) throw new Error('MetaMask not found');
  const iface = new ethers.Interface(['function mintMyCard() external']);
  const data = iface.encodeFunctionData('mintMyCard');
  const txHash = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [{ from: userAddress, to: CONTRACTS.NIMBUS_CARD, data, gas: '0x30D40' }],
  });
  await addTransaction({ id: txHash, type: 'card_minted', amount: '0', address: userAddress, hash: txHash, timestamp: Date.now(), status: 'success', label: 'Nimbus Card Minted' });
  return { hash: txHash };
}

export async function createEscrowOrder(sellerAddress: string, amount: string): Promise<{ hash: string; orderId: string }> {
  const pk = await storage.getItem(WALLET_KEY);
  if (!pk) throw new Error('No wallet found');
  const provider = new ethers.JsonRpcProvider(ARC_TESTNET.rpcUrl);
  const signer = new ethers.Wallet(pk, provider);
  const usdc = new ethers.Contract(CONTRACTS.USDC, ['function approve(address spender, uint256 amount) returns (bool)'], signer);
  const parsedAmount = ethers.parseUnits(amount, 6);
  const approveTx = await usdc.approve(CONTRACTS.BAZARC_ESCROW, parsedAmount);
  await approveTx.wait();
  const escrow = new ethers.Contract(CONTRACTS.BAZARC_ESCROW, ['function createOrder(address seller, uint256 amount) returns (uint256)'], signer);
  const tx = await escrow.createOrder(sellerAddress, parsedAmount);
  const receipt = await tx.wait();
  await addTransaction({ id: tx.hash, type: 'purchase', amount, address: sellerAddress, hash: tx.hash, timestamp: Date.now(), status: 'success', label: 'Bazarc Purchase' });
  return { hash: tx.hash, orderId: '0' };
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatUSDC(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
