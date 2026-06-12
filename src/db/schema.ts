import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const ASSET_CLASSES = ['stock', 'crypto', 'real_estate', 'gold', 'cash', 'funds', 'private_loan', 'other'] as const;
export const ASSET_PURPOSES = [
  'wealth_compounder',
  'income_generator',
  'liquidity_reserve',
  'opportunity_capital',
  'store_of_value',
  'strategic_asset',
  'retirement',
] as const;

export const OPPORTUNITY_SOURCES = ['manual', 'telegram', 'ai', 'other'] as const;
export const OPPORTUNITY_STATUSES = ['new', 'reviewing', 'promoted', 'rejected'] as const;
export const RESEARCH_NOTE_TYPES = ['research', 'observation', 'earnings', 'news', 'source', 'review'] as const;
export type ResearchNoteType = (typeof RESEARCH_NOTE_TYPES)[number];

export const CONVICTION_LEVELS = ['low', 'medium', 'high'] as const;
export type ConvictionLevel = (typeof CONVICTION_LEVELS)[number];

export const RESEARCH_STATUSES = ['draft', 'active', 'archived'] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];

export type AssetClass = (typeof ASSET_CLASSES)[number];
export type AssetPurpose = (typeof ASSET_PURPOSES)[number];
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  symbol: text('symbol'),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }).notNull(),
  purpose: text('purpose', { enum: ASSET_PURPOSES }).notNull(),
  current_value: real('current_value').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  include_in_investment_net_worth: integer('include_in_investment_net_worth', { mode: 'boolean' })
    .notNull()
    .default(true),
  include_in_total_net_worth: integer('include_in_total_net_worth', { mode: 'boolean' })
    .notNull()
    .default(true),
  quantity: real('quantity'),
  cost_basis: real('cost_basis'),
  notes: text('notes'),
  is_archived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const targetAllocations = sqliteTable('target_allocations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }).notNull().unique(),
  target_weight: real('target_weight').notNull(),
  lower_band: real('lower_band').notNull(),
  upper_band: real('upper_band').notNull(),
  updated_at: text('updated_at').notNull(),
});

// opportunities must be defined before watchlist_items (FK dependency)
export const opportunities = sqliteTable('opportunities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  symbol: text('symbol'),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }),
  source: text('source', { enum: OPPORTUNITY_SOURCES }).notNull().default('manual'),
  raw_note: text('raw_note'),
  parsed_thesis: text('parsed_thesis'),
  status: text('status', { enum: OPPORTUNITY_STATUSES }).notNull().default('new'),
  // Plain integer — no .references() to avoid circular dependency with watchlist_items
  watchlist_id: integer('watchlist_id'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const watchlistItems = sqliteTable('watchlist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  symbol: text('symbol'),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }),
  note: text('note'),
  alert_flag: integer('alert_flag', { mode: 'boolean' }).notNull().default(false),
  review_date: text('review_date'),
  status: text('status', {
    enum: ['active', 'archived', 'promoted', 'rejected'],
  }).notNull().default('active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  // v0.7 additions
  opportunity_id: integer('opportunity_id').references(() => opportunities.id),
  asset_id: integer('asset_id').references(() => assets.id),
  conviction_score: integer('conviction_score'),
  conviction_rationale: text('conviction_rationale'),
  target_entry: text('target_entry'),
  thesis: text('thesis'),
  next_action: text('next_action'),
  // v1.0 additions
  priority: text('priority', { enum: CONVICTION_LEVELS }),
  fair_value: text('fair_value'),
  current_price: text('current_price'),
  currency: text('currency').default('USD'),
  // v1.8 calendar
  review_cadence: text('review_cadence'),
});

export const rebalanceAlerts = sqliteTable('rebalance_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }).notNull(),
  actual_weight: real('actual_weight').notNull(),
  target_weight: real('target_weight').notNull(),
  lower_band: real('lower_band').notNull(),
  upper_band: real('upper_band').notNull(),
  deviation: real('deviation').notNull(),
  severity: text('severity', { enum: ['minor', 'major'] }).notNull(),
  direction: text('direction', { enum: ['underweight', 'overweight'] }).notNull(),
  detected_at: text('detected_at').notNull(),
  resolved_at: text('resolved_at'),
  status: text('status', { enum: ['open', 'resolved'] }).notNull().default('open'),
});

export const netWorthSnapshots = sqliteTable('net_worth_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  as_of_date: text('as_of_date').notNull(),
  investment_net_worth: real('investment_net_worth').notNull(),
  total_net_worth: real('total_net_worth').notNull(),
  breakdown_json: text('breakdown_json').notNull(),
  created_at: text('created_at').notNull(),
});

export const researchTheses = sqliteTable('research_theses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').references(() => assets.id),
  asset_name: text('asset_name').notNull(),
  stance: text('stance', { enum: ['bullish', 'bearish', 'neutral', 'watchlist'] }).notNull(),
  summary: text('summary').notNull(),
  version: integer('version').notNull().default(1),
  status: text('status', { enum: ['active', 'archived', 'superseded'] }).notNull().default('active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const REVIEW_CADENCES = ['monthly', 'quarterly', 'semi_annual', 'annual'] as const;
export type ReviewCadence = (typeof REVIEW_CADENCES)[number];

export const DECISION_TYPES = [
  'buy', 'sell', 'hold', 'trim', 'add', 'reduce', 'rebalance', 'review', 'reject', 'monitor',
] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const DECISION_OUTCOMES = ['positive', 'neutral', 'negative'] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export const decisionLogs = sqliteTable('decision_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').references(() => assets.id),
  asset_name: text('asset_name').notNull(),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }),
  decision_type: text('decision_type', { enum: DECISION_TYPES }).notNull(),
  rationale: text('rationale').notNull(),
  amount: real('amount'),
  thesis_id: integer('thesis_id').references(() => researchTheses.id),
  decision_date: text('decision_date').notNull(),
  created_at: text('created_at').notNull(),
  // v1.5 additions
  title: text('title'),
  purpose: text('purpose'),
  expected_return: text('expected_return'),
  time_horizon: text('time_horizon'),
  risks: text('risks'),
  invalidation_conditions: text('invalidation_conditions'),
  confidence: integer('confidence'),
  extended_notes: text('extended_notes'),
  transaction_id: integer('transaction_id'),
  is_reviewed: integer('is_reviewed', { mode: 'boolean' }).notNull().default(false),
  // v1.8 calendar
  next_review_date: text('next_review_date'),
  review_cadence: text('review_cadence'),
});

export const decisionReviews = sqliteTable('decision_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  decision_id: integer('decision_id').notNull().references(() => decisionLogs.id),
  review_date: text('review_date').notNull(),
  outcome: text('outcome', { enum: DECISION_OUTCOMES }).notNull(),
  current_result: text('current_result'),
  thesis_still_valid: integer('thesis_still_valid', { mode: 'boolean' }),
  lessons_learned: text('lessons_learned'),
  next_action: text('next_action'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const assetIntelligence = sqliteTable('asset_intelligence', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').notNull().unique().references(() => assets.id),
  investment_thesis: text('investment_thesis'),
  risk_notes: text('risk_notes'),
  buy_zone: text('buy_zone'),
  sell_zone: text('sell_zone'),
  accumulation_plan: text('accumulation_plan'),
  exit_plan: text('exit_plan'),
  review_cadence: text('review_cadence'),
  next_review_date: text('next_review_date'),
  dividend_notes: text('dividend_notes'),
  valuation_notes: text('valuation_notes'),
  cycle_thesis: text('cycle_thesis'),
  dca_plan: text('dca_plan'),
  legal_status: text('legal_status'),
  yield_notes: text('yield_notes'),
  loan_terms: text('loan_terms'),
  counterparty_notes: text('counterparty_notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const researchNotes = sqliteTable('research_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Polymorphic — exactly one of these is set
  asset_id: integer('asset_id').references(() => assets.id),
  opportunity_id: integer('opportunity_id').references(() => opportunities.id),
  // v1.0 structured research fields
  title: text('title'),
  symbol: text('symbol'),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }),
  thesis: text('thesis'),
  valuation_notes: text('valuation_notes'),
  risk_notes: text('risk_notes'),
  action_plan: text('action_plan'),
  conviction: text('conviction', { enum: CONVICTION_LEVELS }),
  research_status: text('research_status', { enum: RESEARCH_STATUSES }).default('active'),
  // original fields
  note_type: text('note_type', { enum: RESEARCH_NOTE_TYPES }).notNull().default('research'),
  body: text('body').notNull(),
  source_url: text('source_url'),
  source_label: text('source_label'),
  attachment_path: text('attachment_path'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const ACCOUNT_TYPES = [
  'bank_account',
  'broker_account',
  'crypto_exchange',
  'crypto_wallet',
  'cash_location',
  'gold_storage',
  'real_estate_registry',
  'other_custody',
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_TYPES = [
  'buy', 'sell', 'transfer', 'deposit', 'withdraw', 'fee', 'dividend', 'interest', 'adjustment',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const BANK_ACCOUNT_STATUSES = ['active', 'inactive', 'closed'] as const;
export const BANK_DEPOSIT_STATUSES = ['active', 'matured', 'closed'] as const;
export const BANK_CREDIT_STATUSES = ['active', 'inactive', 'closed'] as const;
export const BANK_FACILITY_TYPES = ['ShopCash', 'Overdraft', 'Credit Line', 'BNPL', 'Other'] as const;
export const BANK_ACCOUNT_TYPES = [
  'Daily Spending',
  'Investment Cash',
  'Trading Funding',
  'Private Lending',
  'Travel Fund',
  'Business Cashflow',
  'Reserve',
  'Tax Fund',
  'Family Fund',
  'Other',
] as const;
export type BankAccountStatus = (typeof BANK_ACCOUNT_STATUSES)[number];
export type BankDepositStatus = (typeof BANK_DEPOSIT_STATUSES)[number];
export type BankCreditStatus = (typeof BANK_CREDIT_STATUSES)[number];
export type BankFacilityType = (typeof BANK_FACILITY_TYPES)[number];
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export const bankAccounts = sqliteTable('bank_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bank_name: text('bank_name').notNull(),
  account_name: text('account_name').notNull(),
  account_number: text('account_number'),
  account_type: text('account_type', { enum: BANK_ACCOUNT_TYPES }).notNull().default('Reserve'),
  currency: text('currency').notNull().default('VND'),
  balance: real('balance').notNull().default(0),
  purpose: text('purpose', { enum: ASSET_PURPOSES }).notNull().default('liquidity_reserve'),
  custom_purpose: text('custom_purpose'),
  vip_tier: text('vip_tier'),
  status: text('status', { enum: BANK_ACCOUNT_STATUSES }).notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const bankSavingsDeposits = sqliteTable('bank_savings_deposits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bank_account_id: integer('bank_account_id').references(() => bankAccounts.id),
  bank_name: text('bank_name'),
  deposit_name: text('deposit_name').notNull(),
  principal: real('principal').notNull().default(0),
  interest_rate: real('interest_rate').notNull().default(0),
  term_months: integer('term_months').notNull().default(0),
  start_date: text('start_date'),
  maturity_date: text('maturity_date'),
  interest_payout_type: text('interest_payout_type'),
  auto_renew: integer('auto_renew', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: BANK_DEPOSIT_STATUSES }).notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const bankCreditCards = sqliteTable('bank_credit_cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bank_name: text('bank_name').notNull(),
  card_name: text('card_name').notNull(),
  card_network: text('card_network'),
  credit_limit: real('credit_limit').notNull().default(0),
  current_used: real('current_used').notNull().default(0),
  available_limit: real('available_limit').notNull().default(0),
  statement_date: text('statement_date'),
  due_date: text('due_date'),
  annual_fee: real('annual_fee'),
  status: text('status', { enum: BANK_CREDIT_STATUSES }).notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const bankCreditFacilities = sqliteTable('bank_credit_facilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bank_name: text('bank_name').notNull(),
  facility_name: text('facility_name').notNull(),
  facility_type: text('facility_type', { enum: BANK_FACILITY_TYPES }).notNull().default('Other'),
  limit_amount: real('limit_amount').notNull().default(0),
  current_used: real('current_used').notNull().default(0),
  available_amount: real('available_amount').notNull().default(0),
  interest_rate: real('interest_rate'),
  fee_rule: text('fee_rule'),
  due_rule: text('due_rule'),
  status: text('status', { enum: BANK_CREDIT_STATUSES }).notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const accountRegistry = sqliteTable('account_registry', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ACCOUNT_TYPES }).notNull(),
  institution: text('institution'),
  account_number_masked: text('account_number_masked'),
  currency: text('currency').notNull().default('USD'),
  current_balance: real('current_balance').notNull().default(0),
  status: text('status', { enum: ['active', 'inactive', 'archived'] }).notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').references(() => assets.id),
  type: text('type', { enum: TRANSACTION_TYPES }).notNull(),
  transaction_date: text('transaction_date').notNull(),
  settlement_date: text('settlement_date'),
  quantity: real('quantity'),
  price: real('price'),
  amount: real('amount').notNull(),
  total_amount: real('total_amount'),
  gross_proceeds: real('gross_proceeds'),
  currency: text('currency').notNull().default('USD'),
  fees: real('fees'),
  tax: real('tax'),
  funding_account_id: integer('funding_account_id').references(() => accountRegistry.id),
  execution_account_id: integer('execution_account_id').references(() => accountRegistry.id),
  custody_account_id: integer('custody_account_id').references(() => accountRegistry.id),
  receive_account_id: integer('receive_account_id').references(() => accountRegistry.id),
  from_custody_account_id: integer('from_custody_account_id').references(() => accountRegistry.id),
  to_custody_account_id: integer('to_custody_account_id').references(() => accountRegistry.id),
  transfer_fee: real('transfer_fee'),
  realized_pnl: real('realized_pnl'),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export const ledgerEntries = sqliteTable('ledger_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transaction_id: integer('transaction_id').notNull().references(() => transactions.id),
  account_id: integer('account_id').references(() => accountRegistry.id),
  asset_id: integer('asset_id').references(() => assets.id),
  entry_type: text('entry_type', {
    enum: ['cash_debit', 'cash_credit', 'asset_debit', 'asset_credit', 'fee', 'tax', 'realized_pnl'],
  }).notNull(),
  amount: real('amount'),
  quantity: real('quantity'),
  currency: text('currency').notNull().default('USD'),
  description: text('description'),
  created_at: text('created_at').notNull(),
});

export const assetCustodyPositions = sqliteTable('asset_custody_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').notNull().references(() => assets.id),
  custody_account_id: integer('custody_account_id').notNull().references(() => accountRegistry.id),
  quantity: real('quantity').notNull().default(0),
  cost_basis: real('cost_basis').notNull().default(0),
  updated_at: text('updated_at').notNull(),
});

export const wealthSnapshots = sqliteTable('wealth_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  snapshot_date: text('snapshot_date').notNull(),
  total_net_worth_usd: real('total_net_worth_usd').notNull(),
  investable_net_worth_usd: real('investable_net_worth_usd').notNull(),
  total_cost_basis_usd: real('total_cost_basis_usd'),
  total_gain_loss_usd: real('total_gain_loss_usd'),
  usd_vnd_rate: real('usd_vnd_rate').notNull(),
  asset_allocation_json: text('asset_allocation_json').notNull(),
  purpose_allocation_json: text('purpose_allocation_json').notNull(),
  notes: text('notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type TargetAllocation = typeof targetAllocations.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type RebalanceAlert = typeof rebalanceAlerts.$inferSelect;
export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect;
export type ResearchThesis = typeof researchTheses.$inferSelect;
export type DecisionLog = typeof decisionLogs.$inferSelect;
export type DecisionReview = typeof decisionReviews.$inferSelect;
export type AssetIntelligence = typeof assetIntelligence.$inferSelect;
export type ResearchNote = typeof researchNotes.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type AccountRegistry = typeof accountRegistry.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type AssetCustodyPosition = typeof assetCustodyPositions.$inferSelect;
export type WealthSnapshot = typeof wealthSnapshots.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type BankSavingsDeposit = typeof bankSavingsDeposits.$inferSelect;
export type BankCreditCard = typeof bankCreditCards.$inferSelect;
export type BankCreditFacility = typeof bankCreditFacilities.$inferSelect;
