-- Schema only. No financial records or settings. Additive baseline.
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
    );

CREATE TABLE IF NOT EXISTS target_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_class TEXT NOT NULL UNIQUE,
      target_weight REAL NOT NULL,
      lower_band REAL NOT NULL,
      upper_band REAL NOT NULL,
      updated_at TEXT NOT NULL
    );

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
    );

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
    );

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
    );

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      as_of_date TEXT NOT NULL,
      investment_net_worth REAL NOT NULL,
      total_net_worth REAL NOT NULL,
      breakdown_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

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
    );

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
    );

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
    );

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
    );

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
    );

CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
      updated_at TEXT NOT NULL,
      settlement_date TEXT,
      total_amount REAL,
      gross_proceeds REAL,
      tax REAL,
      funding_account_id INTEGER REFERENCES account_registry(id),
      execution_account_id INTEGER REFERENCES account_registry(id),
      custody_account_id INTEGER REFERENCES account_registry(id),
      receive_account_id INTEGER REFERENCES account_registry(id),
      from_custody_account_id INTEGER REFERENCES account_registry(id),
      to_custody_account_id INTEGER REFERENCES account_registry(id),
      transfer_fee REAL,
      realized_pnl REAL
    );

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
    );

CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT,
      account_type TEXT NOT NULL DEFAULT 'Reserve',
      currency TEXT NOT NULL DEFAULT 'VND',
      balance REAL NOT NULL DEFAULT 0,
      purpose TEXT NOT NULL DEFAULT 'liquidity_reserve',
      custom_purpose TEXT,
      vip_tier TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
    );

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
    );

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
    );

CREATE TABLE IF NOT EXISTS account_registry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      institution TEXT,
      account_number_masked TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      current_balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      account_id INTEGER REFERENCES account_registry(id),
      asset_id INTEGER REFERENCES assets(id),
      entry_type TEXT NOT NULL,
      amount REAL,
      quantity REAL,
      currency TEXT NOT NULL DEFAULT 'USD',
      description TEXT,
      created_at TEXT NOT NULL
    );

CREATE TABLE IF NOT EXISTS asset_custody_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      custody_account_id INTEGER NOT NULL REFERENCES account_registry(id),
      quantity REAL NOT NULL DEFAULT 0,
      cost_basis REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
