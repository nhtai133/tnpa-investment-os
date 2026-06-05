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

export type AssetClass = (typeof ASSET_CLASSES)[number];
export type AssetPurpose = (typeof ASSET_PURPOSES)[number];

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

export const watchlistItems = sqliteTable('watchlist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  symbol: text('symbol'),
  asset_class: text('asset_class', { enum: ASSET_CLASSES }),
  note: text('note'),
  alert_flag: integer('alert_flag', { mode: 'boolean' }).notNull().default(false),
  review_date: text('review_date'),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
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
    enum: ['buy', 'sell', 'hold', 'trim', 'add', 'reject', 'monitor'],
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
  // Core Thesis
  investment_thesis: text('investment_thesis'),
  risk_notes: text('risk_notes'),
  // Strategy Zones
  buy_zone: text('buy_zone'),
  sell_zone: text('sell_zone'),
  accumulation_plan: text('accumulation_plan'),
  exit_plan: text('exit_plan'),
  // Review System
  review_cadence: text('review_cadence'),
  next_review_date: text('next_review_date'),
  // Asset-Class Specific
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

export type Asset = typeof assets.$inferSelect;
export type TargetAllocation = typeof targetAllocations.$inferSelect;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type RebalanceAlert = typeof rebalanceAlerts.$inferSelect;
export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect;
export type ResearchThesis = typeof researchTheses.$inferSelect;
export type DecisionLog = typeof decisionLogs.$inferSelect;
export type AssetIntelligence = typeof assetIntelligence.$inferSelect;
