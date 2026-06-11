/**
 * TNPA Investment OS — Unified Migration Runner
 *
 * Run with: npm run db:migrate
 *
 * Safe to run multiple times. Works on local SQLite and Turso Cloud.
 * Reads TURSO_DATABASE_URL / TURSO_AUTH_TOKEN from environment (or .env.local).
 * Falls back to file:tnpa-investment.db when those vars are absent.
 */

import { createClient } from '@libsql/client';
import { EFFECTIVE_DB_URL, EFFECTIVE_AUTH_TOKEN } from '@/lib/env';

const client = createClient({
  url: EFFECTIVE_DB_URL,
  authToken: EFFECTIVE_AUTH_TOKEN,
});

const displayUrl = EFFECTIVE_DB_URL.startsWith('file:')
  ? EFFECTIVE_DB_URL
  : (() => {
      try {
        const u = new URL(EFFECTIVE_DB_URL);
        return `${u.protocol}//${u.host}`;
      } catch {
        return EFFECTIVE_DB_URL.split('?')[0];
      }
    })();

async function exec(label: string, sql: string) {
  try {
    await client.execute(sql);
    console.log(`  ✓  ${label}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('duplicate column') || msg.includes('already exists') || msg.includes('table already exists')) {
      console.log(`  ·  ${label} (already applied)`);
    } else {
      console.error(`  ✗  ${label}`);
      throw e;
    }
  }
}

// ── Core tables ──────────────────────────────────────────────────────────────

async function createCoreTables() {
  console.log('\n[1/5] Core tables');

  await exec('assets', `
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT,
      asset_class TEXT NOT NULL,
      purpose TEXT NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      include_in_investment_net_worth INTEGER NOT NULL DEFAULT 1,
      include_in_total_net_worth INTEGER NOT NULL DEFAULT 1,
      quantity REAL,
      cost_basis REAL,
      notes TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('target_allocations', `
    CREATE TABLE IF NOT EXISTS target_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_class TEXT NOT NULL UNIQUE,
      target_weight REAL NOT NULL,
      lower_band REAL NOT NULL,
      upper_band REAL NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('opportunities', `
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT,
      asset_class TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      raw_note TEXT,
      parsed_thesis TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      watchlist_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('watchlist_items', `
    CREATE TABLE IF NOT EXISTS watchlist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      symbol TEXT,
      asset_class TEXT,
      note TEXT,
      alert_flag INTEGER NOT NULL DEFAULT 0,
      review_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      opportunity_id INTEGER REFERENCES opportunities(id),
      asset_id INTEGER REFERENCES assets(id),
      conviction_score INTEGER,
      conviction_rationale TEXT,
      target_entry TEXT,
      thesis TEXT,
      next_action TEXT,
      priority TEXT,
      fair_value TEXT,
      current_price TEXT,
      currency TEXT DEFAULT 'USD',
      review_cadence TEXT
    )
  `);

  await exec('rebalance_alerts', `
    CREATE TABLE IF NOT EXISTS rebalance_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_class TEXT NOT NULL,
      actual_weight REAL NOT NULL,
      target_weight REAL NOT NULL,
      lower_band REAL NOT NULL,
      upper_band REAL NOT NULL,
      deviation REAL NOT NULL,
      severity TEXT NOT NULL,
      direction TEXT NOT NULL,
      detected_at TEXT NOT NULL,
      resolved_at TEXT,
      status TEXT NOT NULL DEFAULT 'open'
    )
  `);

  await exec('net_worth_snapshots', `
    CREATE TABLE IF NOT EXISTS net_worth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      as_of_date TEXT NOT NULL,
      investment_net_worth REAL NOT NULL,
      total_net_worth REAL NOT NULL,
      breakdown_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  await exec('research_theses', `
    CREATE TABLE IF NOT EXISTS research_theses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER REFERENCES assets(id),
      asset_name TEXT NOT NULL,
      stance TEXT NOT NULL,
      summary TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('decision_logs', `
    CREATE TABLE IF NOT EXISTS decision_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER REFERENCES assets(id),
      asset_name TEXT NOT NULL,
      asset_class TEXT,
      decision_type TEXT NOT NULL,
      rationale TEXT NOT NULL,
      amount REAL,
      thesis_id INTEGER REFERENCES research_theses(id),
      decision_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      title TEXT,
      purpose TEXT,
      expected_return TEXT,
      time_horizon TEXT,
      risks TEXT,
      invalidation_conditions TEXT,
      confidence INTEGER,
      extended_notes TEXT,
      transaction_id INTEGER,
      is_reviewed INTEGER NOT NULL DEFAULT 0,
      next_review_date TEXT,
      review_cadence TEXT
    )
  `);

  await exec('decision_reviews', `
    CREATE TABLE IF NOT EXISTS decision_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      decision_id INTEGER NOT NULL REFERENCES decision_logs(id),
      review_date TEXT NOT NULL,
      outcome TEXT NOT NULL,
      current_result TEXT,
      thesis_still_valid INTEGER,
      lessons_learned TEXT,
      next_action TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('asset_intelligence', `
    CREATE TABLE IF NOT EXISTS asset_intelligence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL UNIQUE REFERENCES assets(id),
      investment_thesis TEXT,
      risk_notes TEXT,
      buy_zone TEXT,
      sell_zone TEXT,
      accumulation_plan TEXT,
      exit_plan TEXT,
      review_cadence TEXT,
      next_review_date TEXT,
      dividend_notes TEXT,
      valuation_notes TEXT,
      cycle_thesis TEXT,
      dca_plan TEXT,
      legal_status TEXT,
      yield_notes TEXT,
      loan_terms TEXT,
      counterparty_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('research_notes', `
    CREATE TABLE IF NOT EXISTS research_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER REFERENCES assets(id),
      opportunity_id INTEGER REFERENCES opportunities(id),
      title TEXT,
      symbol TEXT,
      asset_class TEXT,
      thesis TEXT,
      valuation_notes TEXT,
      risk_notes TEXT,
      action_plan TEXT,
      conviction TEXT,
      research_status TEXT DEFAULT 'active',
      note_type TEXT NOT NULL DEFAULT 'research',
      body TEXT NOT NULL,
      source_url TEXT,
      source_label TEXT,
      attachment_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('app_settings', `
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('transactions', `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER REFERENCES assets(id),
      type TEXT NOT NULL,
      transaction_date TEXT NOT NULL,
      quantity REAL,
      price REAL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      fees REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('wealth_snapshots', `
    CREATE TABLE IF NOT EXISTS wealth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date TEXT NOT NULL,
      total_net_worth_usd REAL NOT NULL,
      investable_net_worth_usd REAL NOT NULL,
      total_cost_basis_usd REAL,
      total_gain_loss_usd REAL,
      usd_vnd_rate REAL NOT NULL,
      asset_allocation_json TEXT NOT NULL,
      purpose_allocation_json TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('bank_accounts', `
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT,
      currency TEXT NOT NULL DEFAULT 'VND',
      balance REAL NOT NULL DEFAULT 0,
      purpose TEXT NOT NULL DEFAULT 'liquidity_reserve',
      vip_tier TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('bank_savings_deposits', `
    CREATE TABLE IF NOT EXISTS bank_savings_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_account_id INTEGER REFERENCES bank_accounts(id),
      bank_name TEXT,
      deposit_name TEXT NOT NULL,
      principal REAL NOT NULL DEFAULT 0,
      interest_rate REAL NOT NULL DEFAULT 0,
      term_months INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      maturity_date TEXT,
      interest_payout_type TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('bank_credit_cards', `
    CREATE TABLE IF NOT EXISTS bank_credit_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      card_name TEXT NOT NULL,
      card_network TEXT,
      credit_limit REAL NOT NULL DEFAULT 0,
      current_used REAL NOT NULL DEFAULT 0,
      available_limit REAL NOT NULL DEFAULT 0,
      statement_date TEXT,
      due_date TEXT,
      annual_fee REAL,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await exec('bank_credit_facilities', `
    CREATE TABLE IF NOT EXISTS bank_credit_facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      facility_name TEXT NOT NULL,
      facility_type TEXT NOT NULL DEFAULT 'Other',
      limit_amount REAL NOT NULL DEFAULT 0,
      current_used REAL NOT NULL DEFAULT 0,
      available_amount REAL NOT NULL DEFAULT 0,
      interest_rate REAL,
      fee_rule TEXT,
      due_rule TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

// ── Column backfills for existing databases ──────────────────────────────────

async function addMissingColumns() {
  console.log('\n[2/5] Column additions (existing databases)');

  // assets — is_archived (v1.x)
  await exec('assets.is_archived', `ALTER TABLE assets ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0`);

  // decision_logs — v1.5 structured fields
  const decisionV15 = [
    `ALTER TABLE decision_logs ADD COLUMN title TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN purpose TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN expected_return TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN time_horizon TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN risks TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN invalidation_conditions TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN confidence INTEGER`,
    `ALTER TABLE decision_logs ADD COLUMN extended_notes TEXT`,
    `ALTER TABLE decision_logs ADD COLUMN transaction_id INTEGER`,
    `ALTER TABLE decision_logs ADD COLUMN is_reviewed INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const sql of decisionV15) {
    const col = sql.match(/ADD COLUMN (\S+)/)?.[1] ?? sql;
    await exec(`decision_logs.${col}`, sql);
  }

  // decision_logs — v1.8 calendar
  await exec('decision_logs.next_review_date', `ALTER TABLE decision_logs ADD COLUMN next_review_date TEXT`);
  await exec('decision_logs.review_cadence', `ALTER TABLE decision_logs ADD COLUMN review_cadence TEXT`);

  // watchlist_items — v1.0
  const watchlistV10 = [
    `ALTER TABLE watchlist_items ADD COLUMN opportunity_id INTEGER REFERENCES opportunities(id)`,
    `ALTER TABLE watchlist_items ADD COLUMN asset_id INTEGER REFERENCES assets(id)`,
    `ALTER TABLE watchlist_items ADD COLUMN conviction_score INTEGER`,
    `ALTER TABLE watchlist_items ADD COLUMN conviction_rationale TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN target_entry TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN thesis TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN next_action TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN priority TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN fair_value TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN current_price TEXT`,
    `ALTER TABLE watchlist_items ADD COLUMN currency TEXT DEFAULT 'USD'`,
  ];
  for (const sql of watchlistV10) {
    const col = sql.match(/ADD COLUMN (\S+)/)?.[1] ?? sql;
    await exec(`watchlist_items.${col}`, sql);
  }

  // watchlist_items — v1.8 calendar
  await exec('watchlist_items.review_cadence', `ALTER TABLE watchlist_items ADD COLUMN review_cadence TEXT`);

  // research_notes — v1.0
  const researchV10 = [
    `ALTER TABLE research_notes ADD COLUMN title TEXT`,
    `ALTER TABLE research_notes ADD COLUMN symbol TEXT`,
    `ALTER TABLE research_notes ADD COLUMN asset_class TEXT`,
    `ALTER TABLE research_notes ADD COLUMN thesis TEXT`,
    `ALTER TABLE research_notes ADD COLUMN valuation_notes TEXT`,
    `ALTER TABLE research_notes ADD COLUMN risk_notes TEXT`,
    `ALTER TABLE research_notes ADD COLUMN action_plan TEXT`,
    `ALTER TABLE research_notes ADD COLUMN conviction TEXT`,
    `ALTER TABLE research_notes ADD COLUMN research_status TEXT DEFAULT 'active'`,
  ];
  for (const sql of researchV10) {
    const col = sql.match(/ADD COLUMN (\S+)/)?.[1] ?? sql;
    await exec(`research_notes.${col}`, sql);
  }
}

// ── Default seed rows ────────────────────────────────────────────────────────

async function seedDefaults() {
  console.log('\n[3/5] Default settings');
  await exec('app_settings: usd_vnd_rate default', `
    INSERT OR IGNORE INTO app_settings (key, value, updated_at)
    VALUES ('usd_vnd_rate', '25500', datetime('now'))
  `);

  await exec('bank_credit_facilities: Techcombank ShopCash seed', `
    INSERT INTO bank_credit_facilities (
      bank_name, facility_name, facility_type, limit_amount, current_used,
      available_amount, interest_rate, fee_rule, due_rule, status, notes,
      created_at, updated_at
    )
    SELECT
      'Techcombank', 'Techcombank ShopCash', 'ShopCash', 100000000, 0,
      100000000, NULL, NULL, NULL, 'active',
      'Seed facility for Banking v2.2. Limit is liquidity capacity, not an asset.',
      datetime('now'), datetime('now')
    WHERE NOT EXISTS (
      SELECT 1 FROM bank_credit_facilities
      WHERE bank_name = 'Techcombank' AND facility_name = 'Techcombank ShopCash'
    )
  `);
}

// ── Verification ─────────────────────────────────────────────────────────────

async function verify() {
  console.log('\n[4/5] Verification');
  const tables = [
    'assets', 'app_settings', 'target_allocations', 'opportunities',
    'watchlist_items', 'rebalance_alerts', 'net_worth_snapshots',
    'research_theses', 'decision_logs', 'decision_reviews',
    'asset_intelligence', 'research_notes', 'transactions', 'wealth_snapshots',
    'bank_accounts', 'bank_savings_deposits', 'bank_credit_cards', 'bank_credit_facilities',
  ];
  for (const table of tables) {
    try {
      await client.execute(`SELECT 1 FROM ${table} LIMIT 1`);
      console.log(`  ✓  ${table}`);
    } catch {
      console.error(`  ✗  ${table} — table missing or inaccessible`);
    }
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

async function migrate() {
  console.log('════════════════════════════════════════════');
  console.log('  TNPA Investment OS — Migration Runner v2.0');
  console.log('════════════════════════════════════════════');
  console.log(`  DB: ${displayUrl}`);

  await createCoreTables();
  await addMissingColumns();
  await seedDefaults();
  await verify();

  console.log('\n[5/5] Done — all migrations applied.\n');
}

migrate().catch((err) => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});
