import type { AssetClass, AssetPurpose } from '@/db/schema';

export interface WorkspaceFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date';
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
  { value: 'retirement', label: 'Retirement' },
];

export const BANKING_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'cash',
  route: '/banking',
  pageTitle: 'Banking',
  pageCategory: 'Markets',
  addButtonLabel: '+ Add Bank Asset',
  defaultPurpose: 'liquidity_reserve',
  currency: 'VND',
  fields: [
    {
      name: 'name',
      label: 'Account Name',
      type: 'text',
      required: true,
      placeholder: 'Emergency Fund, Main Savings…',
      colSpan: 2,
    },
    {
      name: 'institution',
      label: 'Bank / Institution',
      type: 'text',
      placeholder: 'Vietcombank, Techcombank…',
    },
    {
      name: 'account_type',
      label: 'Account Type',
      type: 'select',
      defaultValue: 'Cash',
      options: [
        { value: 'Cash', label: 'Cash' },
        { value: 'Savings', label: 'Savings' },
        { value: 'Term Deposit', label: 'Term Deposit' },
      ],
    },
    {
      name: 'current_value',
      label: 'Balance / Current Value',
      type: 'number',
      required: true,
      placeholder: '50000000',
    },
    {
      name: 'interest_rate',
      label: 'Interest Rate (% p.a.)',
      type: 'number',
      placeholder: '5.5',
    },
    {
      name: 'maturity_date',
      label: 'Maturity Date',
      type: 'date',
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'select',
      defaultValue: 'VND',
      options: [
        { value: 'VND', label: 'VND' },
        { value: 'USD', label: 'USD' },
      ],
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
      placeholder: 'Account details, renewal strategy, withdrawal conditions…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Bank Accounts', status: 'active' },
  ],
};

export const FUNDS_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'funds',
  route: '/funds',
  pageTitle: 'Funds & ETFs',
  pageCategory: 'Markets',
  addButtonLabel: '+ Add Fund',
  defaultPurpose: 'wealth_compounder',
  currency: 'VND',
  fields: [
    {
      name: 'name',
      label: 'Fund Name',
      type: 'text',
      required: true,
      placeholder: 'VFMVF4, DCDS, VinaCapital…',
      colSpan: 2,
    },
    {
      name: 'symbol',
      label: 'Ticker / Code',
      type: 'text',
      placeholder: 'VFMVF4',
      uppercase: true,
    },
    {
      name: 'fund_type',
      label: 'Type',
      type: 'select',
      defaultValue: 'ETF',
      options: [
        { value: 'ETF', label: 'ETF' },
        { value: 'Mutual Fund', label: 'Mutual Fund' },
        { value: 'Certificate', label: 'Certificate' },
      ],
    },
    {
      name: 'institution',
      label: 'Broker / Platform',
      type: 'text',
      placeholder: 'VCBS, SSI, Mirae Asset…',
    },
    {
      name: 'quantity',
      label: 'Units / Certificates',
      type: 'number',
      placeholder: '1000',
    },
    {
      name: 'avg_cost',
      label: 'Average Cost Per Unit',
      type: 'number',
      placeholder: '12500',
    },
    {
      name: 'current_value',
      label: 'Current NAV / Value',
      type: 'number',
      required: true,
      placeholder: '13000000',
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'select',
      defaultValue: 'VND',
      options: [
        { value: 'VND', label: 'VND' },
        { value: 'USD', label: 'USD' },
      ],
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
      placeholder: 'Fund strategy, distribution policy, exit thesis…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Funds & ETFs', status: 'active' },
  ],
};

export const GOLD_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'gold',
  route: '/gold',
  pageTitle: 'Gold',
  pageCategory: 'Markets',
  addButtonLabel: '+ Add Gold',
  defaultPurpose: 'store_of_value',
  currency: 'VND',
  fields: [
    {
      name: 'name',
      label: 'Gold Name / Type',
      type: 'text',
      required: true,
      placeholder: 'SJC Bullion',
      suggestions: ['SJC', 'PNJ', 'Jewelry', 'Other'],
      colSpan: 2,
    },
    {
      name: 'symbol',
      label: 'Symbol (optional)',
      type: 'text',
      placeholder: 'XAU',
      suggestions: ['XAU', 'SJC', 'PNJ'],
      uppercase: true,
    },
    {
      name: 'storage_location',
      label: 'Storage Location',
      type: 'text',
      placeholder: 'Home safe, bank vault…',
    },
    {
      name: 'weight_amount',
      label: 'Weight',
      type: 'number',
      placeholder: '1',
    },
    {
      name: 'weight_unit',
      label: 'Unit',
      type: 'select',
      defaultValue: 'lượng',
      options: [
        { value: 'lượng', label: 'Lượng' },
        { value: 'chỉ', label: 'Chỉ' },
        { value: 'gram', label: 'Gram' },
      ],
    },
    {
      name: 'current_value',
      label: 'Current Value (VND)',
      type: 'number',
      required: true,
      placeholder: '85000000',
    },
    {
      name: 'cost_basis',
      label: 'Cost Basis (VND)',
      type: 'number',
      placeholder: '78000000',
    },
    {
      name: 'purpose',
      label: 'Purpose',
      type: 'select',
      required: true,
      options: PURPOSE_OPTIONS,
      defaultValue: 'store_of_value',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Purchase notes, purity details, review triggers…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Gold Holdings', status: 'active' },
  ],
};

export const REAL_ESTATE_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'real_estate',
  route: '/real-estate',
  pageTitle: 'Real Estate',
  pageCategory: 'Markets',
  addButtonLabel: '+ Add Property',
  defaultPurpose: 'store_of_value',
  currency: 'VND',
  fields: [
    {
      name: 'name',
      label: 'Property Name',
      type: 'text',
      required: true,
      placeholder: 'Căn hộ Quận 7',
      colSpan: 2,
    },
    {
      name: 'property_location',
      label: 'Location',
      type: 'text',
      placeholder: 'District / City / Address',
      colSpan: 2,
    },
    {
      name: 'current_value',
      label: 'Current Market Value (VND)',
      type: 'number',
      required: true,
      placeholder: '3500000000',
    },
    {
      name: 'cost_basis',
      label: 'Purchase Price / Cost Basis (VND)',
      type: 'number',
      placeholder: '2800000000',
    },
    {
      name: 'ownership_pct',
      label: 'Ownership %',
      type: 'number',
      placeholder: '100',
    },
    {
      name: 'rental_income',
      label: 'Monthly Rental Income (VND)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'loan_balance',
      label: 'Outstanding Loan Balance (VND)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'purpose',
      label: 'Purpose',
      type: 'select',
      required: true,
      options: PURPOSE_OPTIONS,
      defaultValue: 'store_of_value',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Legal status, renovation plans, exit thesis…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Properties', status: 'active' },
  ],
};

export const PRIVATE_LOAN_WORKSPACE_CONFIG: WorkspaceConfig = {
  assetClass: 'private_loan',
  route: '/private-loans',
  pageTitle: 'Private Loans',
  pageCategory: 'Markets',
  addButtonLabel: '+ Add Loan',
  defaultPurpose: 'income_generator',
  currency: 'VND',
  fields: [
    {
      name: 'name',
      label: 'Borrower / Loan Name',
      type: 'text',
      required: true,
      placeholder: 'Nguyen Van A — Personal Loan',
      colSpan: 2,
    },
    {
      name: 'current_value',
      label: 'Outstanding Balance',
      type: 'number',
      required: true,
      placeholder: '100000000',
    },
    {
      name: 'cost_basis',
      label: 'Principal (Original)',
      type: 'number',
      placeholder: '100000000',
    },
    {
      name: 'interest_rate',
      label: 'Interest Rate (% p.a.)',
      type: 'number',
      placeholder: '12',
    },
    {
      name: 'start_date',
      label: 'Start Date',
      type: 'date',
    },
    {
      name: 'due_date',
      label: 'Due Date',
      type: 'date',
    },
    {
      name: 'currency',
      label: 'Currency',
      type: 'select',
      defaultValue: 'VND',
      options: [
        { value: 'VND', label: 'VND' },
        { value: 'USD', label: 'USD' },
      ],
    },
    {
      name: 'purpose',
      label: 'Purpose',
      type: 'select',
      required: true,
      options: PURPOSE_OPTIONS,
      defaultValue: 'income_generator',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      placeholder: 'Loan terms, collateral, counterparty notes…',
      colSpan: 2,
    },
  ],
  sections: [
    { id: 'holdings', label: 'Loans', status: 'active' },
  ],
};

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
