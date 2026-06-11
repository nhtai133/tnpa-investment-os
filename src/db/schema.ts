import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const ASSET_CLASSES = ['stock', 'crypto', 'real_estate', 'gold', 'cash', 'funds', 'private_loan', 'other'] as const;
export const ASSET_PURPOSES = [
  'wealth_compounder',
  'income_generator',
  'liquidity_reserve',
  'opportunity_capital',
  'store_of_value',
  'strategic_asset',
] as const;

export const OPPORTUNITY_SOURCES = ['manual', 'telegram', 'ai', 'other'] as const;
export const OPPORTUNITY_STATUSES = ['new', 'reviewing', 'promoted', 'rejected'] as const;
export const RESEARCH_NOTE_TYPES = ['research', 'observation', 'earnings', 'news', 'source', 'review'] as const;
export type ResearchNoteType = (typeof RESEARCH_NOTE_TYPES)[number];

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
  // v0.7 additions — all nullable, additive only
  opportunity_id: integer('opportunity_id').references(() => opportunities.id),
  asset_id: integer('asset_id').references(() => assets.id),
  conviction_score: integer('conviction_score'),
  conviction_rationale: text('conviction_rationale'),
  target_entry: text('target_entry'),
  thesis: text('thesis'),
  next_action: text('next_action'),
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

export const decisionLogs = sqliteTable('decision_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').references(() => assets.id),
  asset_name: text('asset_name').notNull(),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }),
  decision_type: text('decision_type', {
    enum: ['buy', 'sell', 'hold', 'trim', 'add', 'reject', 'monitor', 'reduce', 'review'],
  }).notNull(),
  rationale: text('rationale').notNull(),
  amount: real('amount'),
  thesis_id: integer('thesis_id').references(() => researchTheses.id),
  decision_date: text('decision_date').notNull(),
  created_at: text('created_at').notNull(),
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

export const TRANSACTION_TYPES = [
  'buy', 'sell', 'deposit', 'withdraw', 'dividend', 'interest', 'fee', 'transfer',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  asset_id: integer('asset_id').references(() => assets.id),
  type: text('type', { enum: TRANSACTION_TYPES }).notNull(),
  transaction_date: text('transaction_date').notNull(),
  quantity: real('quantity'),
  price: real('price'),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  fees: real('fees'),
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
export type AssetIntelligence = typeof assetIntelligence.$inferSelect;
export type ResearchNote = typeof researchNotes.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
