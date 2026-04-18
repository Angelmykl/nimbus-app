export const ARC_TESTNET = {
  id: 1338,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.network',
  explorerUrl: 'https://testnet.arcscan.app',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
};

export const CONTRACTS = {
  USDC: '0x3600000000000000000000000000000000000000',
  NIMBUS_CARD: '0x8C6Adc731dCE434F8e3CA15fc77044FAf5b05EAa',
  BAZARC_ESCROW: '0x84ad5530aDCe451d13f66eBFAF253b6eb91DCA4c',
};

export const NIMBUS_CARD_ABI = [
  { name: 'issueCard', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }], outputs: [] },
  { name: 'isCardholder', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'hasCard', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
];

export const USDC_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
];

export const ESCROW_ABI = [
  { name: 'createOrder', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'seller', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'releaseOrder', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'orderId', type: 'uint256' }], outputs: [] },
  { name: 'orders', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'uint256' }], outputs: [{ name: 'buyer', type: 'address' }, { name: 'seller', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'released', type: 'bool' }, { name: 'refunded', type: 'bool' }] },
];

export interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'card_minted' | 'purchase';
  amount: string;
  address: string;
  hash: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  label?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  seller: string;
  emoji: string;
  listedAt: number;
}

export const COLORS = {
  bg: '#0A0A0F',
  card: '#13131A',
  cardBorder: '#1E1E2E',
  accent: '#6C63FF',
  accentLight: '#8B85FF',
  accentGlow: 'rgba(108, 99, 255, 0.15)',
  success: '#00D4AA',
  warning: '#FFB347',
  danger: '#FF6B6B',
  text: '#FFFFFF',
  textSecondary: '#8888AA',
  textMuted: '#44445A',
};
