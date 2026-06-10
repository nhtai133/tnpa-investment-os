import type { AssetClass, AssetPurpose } from '@/db/schema';

export interface WorkspaceFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  suggestions?: string[];
  placeholder?: string;
  defaultValue?: string;
  colSpan?: 1 | 2;
  uppercase?: boolean;
}

export interface WorkspaceSectionConfig {
  id: string;
  label: string;
  status: 'active' | 'placeholder';
  placeholderNote?: string;
}

export interface WorkspaceConfig {
  assetClass: AssetClass;
  route: string;
  pageTitle: string;
  pageCategory: string;
  addButtonLabel: string;
  defaultPurpose: AssetPurpose;
  currency: string;
  fields: WorkspaceFieldDef[];
  sections: WorkspaceSectionConfig[];
}

const PURPOSE_OPTIONS = [
  { value: 'wealth_compounder', label: 'Wealth Compounder' },
  { value: 'income_generator', label: 'Income Generator' },
  { value: 'liquidity_reserve', label: 'Liquidity Reserve' },
  { value: 'opportunity_capital', label: 'Opportunity Capital' },
  { value: 'store_of_value', label: 'Store of Value' },
  { value: 'strategic_asset', label: 'Strategic Asset' },
];

export const CRYPTO_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'crypto',
  route: '/crypto',
  pageTitle: 'Crypto Portfolio',
  pageCategory: 'Portfolio',
  addButtonLabel: '+ Add Crypto Asset',
  defaultPurpose: 'wealth_compounder',
  currency: 'USD',
  fields: [
    {
      name: 'name',
      label: 'Asset Name',
      type: 'text',
      required: true,
      placeholder: 'Bitcoin',
      colSpan: 2,
    },
    {
      name: 'symbol',
      label: 'Symbol',
      type: 'text',
      required: true,
      placeholder: 'BTC',
      suggestions: ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'MATIC', 'AVAX', 'DOGE', 'ADA'],
      uppercase: true,
    },
    {
      name: 'quantity',
      label: 'Quantity',
      type: 'number',
      placeholder: '0.00000000',
    },
    {
      name: 'avg_cost',
      label: 'Avg Cost per Unit (USD)',
      type: 'number',
      placeholder: '0.00',
    },
    {
      name: 'current_value',
      label: 'Current Value (USD Total)',
      type: 'number',
      required: true,
      placeholder: '0.00',
    },
    {
      name: 'wallet_source',
      label: 'Wallet / Source',
      type: 'text',
      placeholder: 'e.g. Coinbase, Hardware Wallet, Binance',
      colSpan: 2,
    },
    {
      name: 'purpose',
      label: 'Purpose',
      type: 'select',
      required: true,
      options: PURPOSE_OPTIONS,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Thesis, custody notes, review triggers…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Crypto Holdings', status: 'active' },
    { id: 'wallets', label: 'Wallet Registry', status: 'active' },
    {
      id: 'allocation',
      label: 'Allocation Breakdown',
      status: 'placeholder',
      placeholderNote: 'Crypto allocation chart — coming in a future sprint.',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      status: 'placeholder',
      placeholderNote: 'Transaction log — coming in a future sprint.',
    },
  ],
};

export const STOCK_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'stock',
  route: '/stocks',
  pageTitle: 'Stocks',
  pageCategory: 'Portfolio',
  addButtonLabel: '+ Add Stock',
  defaultPurpose: 'wealth_compounder',
  currency: 'VND',
  fields: [
    {
      name: 'name',
      label: 'Tên doanh nghiệp',
      type: 'text',
      required: true,
      placeholder: 'Vietcombank',
      colSpan: 2,
    },
    {
      name: 'symbol',
      label: 'Mã cổ phiếu',
      type: 'text',
      placeholder: 'VCB',
      uppercase: true,
    },
    {
      name: 'quantity',
      label: 'Số lượng cổ phiếu',
      type: 'number',
      placeholder: '2000',
    },
    {
      name: 'avg_cost',
      label: 'Giá vốn / cổ phiếu (VND)',
      type: 'number',
      placeholder: '61000',
    },
    {
      name: 'current_value',
      label: 'Giá trị hiện tại (VND)',
      type: 'number',
      required: true,
      placeholder: '116000000',
    },
    {
      name: 'purpose',
      label: 'Mục tiêu đầu tư',
      type: 'select',
      required: true,
      options: PURPOSE_OPTIONS,
    },
    {
      name: 'notes',
      label: 'Ghi chú',
      type: 'textarea',
      placeholder: 'Luận điểm đầu tư, ghi chú cổ tức, điều kiện xem xét lại…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Stock Holdings', status: 'active' },
    {
      id: 'watchlist',
      label: 'Watchlist',
      status: 'placeholder',
      placeholderNote: 'Stock watchlist — coming in a future sprint.',
    },
    {
      id: 'research',
      label: 'Research Notes',
      status: 'placeholder',
      placeholderNote: 'Research notes — coming in a future sprint.',
    },
  ],
};
