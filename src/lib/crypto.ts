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

export const CRYPTO_CHAINS: CryptoChain[] = ['BTC', 'ETH', 'SOL', 'BNB', 'Polygon', 'Other'];

export function shortenAddress(address: string): string {
  const trimmed = address.trim();
  if (trimmed.length <= 14) return trimmed;
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-6)}`;
}
