import type { AssetClass } from '@/db/schema';

// ─── Symbol extraction ────────────────────────────────────────────────────────

const TICKER_PATTERN = /\$([A-Z]{1,5})\b/;
const CAPS_WORD_PATTERN = /\b([A-Z]{2,5})\b/g;

// Common English words to exclude from caps-word matching
const STOP_WORDS = new Set([
  'I', 'A', 'AN', 'THE', 'AND', 'OR', 'BUT', 'IN', 'ON', 'AT', 'TO', 'FOR',
  'OF', 'BY', 'AS', 'IS', 'IT', 'BE', 'MY', 'DO', 'UP', 'NO', 'GO', 'US',
  'AI', 'DCA', 'ROI', 'ATH', 'ATL', 'CEO', 'CFO', 'IPO', 'ETF', 'USD',
  'EUR', 'GBP', 'YOY', 'QOQ', 'EPS', 'PE', 'VC', 'M&A',
]);

export function extractSymbol(text: string): string | null {
  const dollarMatch = text.match(TICKER_PATTERN);
  if (dollarMatch) return dollarMatch[1];

  const capsMatches = [...text.matchAll(CAPS_WORD_PATTERN)]
    .map((m) => m[1])
    .filter((w) => !STOP_WORDS.has(w));
  return capsMatches[0] ?? null;
}

// ─── Asset class inference ────────────────────────────────────────────────────

const CLASS_KEYWORDS: Array<{ class: AssetClass; words: string[] }> = [
  {
    class: 'crypto',
    words: [
      'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'defi', 'nft', 'blockchain',
      'token', 'altcoin', 'solana', 'sol', 'bnb', 'usdt', 'stablecoin', 'web3',
      'on-chain', 'wallet', 'dex', 'protocol',
    ],
  },
  {
    class: 'stock',
    words: [
      'stock', 'shares', 'equity', 'earnings', 'revenue', 'buyback', 'dividend yield',
      'nasdaq', 'nyse', 's&p', 'ipo', 'market cap', 'pe ratio', 'eps', 'quarterly',
    ],
  },
  {
    class: 'real_estate',
    words: [
      'property', 'real estate', 'apartment', 'house', 'land', 'reit', 'rental',
      'mortgage', 'sq ft', 'sqm', 'tenant', 'yield on cost', 'cap rate',
    ],
  },
  {
    class: 'gold',
    words: ['gold', 'silver', 'precious metal', 'xau', 'bullion', 'xag'],
  },
  {
    class: 'cash',
    words: [
      'cash', 'savings', 'deposit', 'money market', 'treasury', 't-bill', 'fixed deposit',
      'fd', 'high yield savings',
    ],
  },
  {
    class: 'private_loan',
    words: [
      'loan', 'lending', 'private credit', 'private debt', 'promissory', 'mezzanine',
      'interest rate', 'borrower', 'collateral',
    ],
  },
];

export function inferAssetClass(text: string): AssetClass | null {
  const lower = text.toLowerCase();
  for (const { class: cls, words } of CLASS_KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return cls;
  }
  return null;
}

// ─── Thesis extraction ────────────────────────────────────────────────────────

function firstSentences(text: string, n: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  const first = sentences.slice(0, n).join(' ').trim();
  return first || text.slice(0, 200).trim();
}

// ─── Main parse entry point ───────────────────────────────────────────────────

export interface ParsedIntake {
  symbol: string | null;
  asset_class: AssetClass | null;
  parsed_thesis: string;
}

export function parseRawNote(
  raw_note: string,
  hints?: { symbol?: string | null; asset_class?: AssetClass | null },
): ParsedIntake {
  const symbol = hints?.symbol?.trim() || extractSymbol(raw_note);
  const asset_class = hints?.asset_class ?? inferAssetClass(raw_note);
  const parsed_thesis = firstSentences(raw_note, 2);

  return { symbol, asset_class, parsed_thesis };
}
