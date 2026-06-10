export type CryptoChain = 'BTC' | 'ETH' | 'SOL' | 'BNB' | 'Polygon' | 'Other';

export interface CryptoWallet {
  id: string;
  name: string;
  chain: CryptoChain;
  address: string;
  notes: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CryptoHolding {
  symbol: 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'USDC';
  name: string;
  quantity: number;
  valueUsd: number;
}

export const CRYPTO_CHAINS: CryptoChain[] = [
  'BTC',
  'ETH',
  'SOL',
  'BNB',
  'Polygon',
  'Other',
];

export const MOCK_CRYPTO_HOLDINGS: CryptoHolding[] = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 0.42, valueUsd: 44100 },
  { symbol: 'ETH', name: 'Ethereum', quantity: 8.75, valueUsd: 30625 },
  { symbol: 'SOL', name: 'Solana', quantity: 120, valueUsd: 18000 },
  { symbol: 'USDT', name: 'Tether USD', quantity: 15000, valueUsd: 15000 },
  { symbol: 'USDC', name: 'USD Coin', quantity: 12500, valueUsd: 12500 },
];

export function shortenAddress(address: string): string {
  const trimmed = address.trim();

  if (trimmed.length <= 14) {
    return trimmed;
  }

  return `${trimmed.slice(0, 6)}...${trimmed.slice(-6)}`;
}
