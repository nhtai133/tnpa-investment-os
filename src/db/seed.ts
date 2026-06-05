import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import {
  assets,
  targetAllocations,
  watchlistItems,
  rebalanceAlerts,
  netWorthSnapshots,
  researchTheses,
  decisionLogs,
} from './schema';

const client = createClient({ url: 'file:tnpa-investment.db' });
const db = drizzle(client);

const now = new Date().toISOString();
const today = new Date().toISOString().split('T')[0];

async function seed() {
  console.log('Seeding TNPA Investment OS database...');

  // Clear existing data in dependency order
  await db.delete(decisionLogs);
  await db.delete(researchTheses);
  await db.delete(rebalanceAlerts);
  await db.delete(netWorthSnapshots);
  await db.delete(watchlistItems);
  await db.delete(targetAllocations);
  await db.delete(assets);

  // ── Assets ─────────────────────────────────────────────────────────────────
  const insertedAssets = await db
    .insert(assets)
    .values([
      // Stocks — include_in_investment_net_worth: true
      {
        name: 'Apple Inc.',
        symbol: 'AAPL',
        asset_class: 'stock',
        purpose: 'wealth_compounder',
        current_value: 18500,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 95.5,
        cost_basis: 14200,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Microsoft Corp.',
        symbol: 'MSFT',
        asset_class: 'stock',
        purpose: 'wealth_compounder',
        current_value: 14200,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 32.0,
        cost_basis: 11800,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Berkshire Hathaway B',
        symbol: 'BRK.B',
        asset_class: 'stock',
        purpose: 'wealth_compounder',
        current_value: 12800,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 28.0,
        cost_basis: 10500,
        created_at: now,
        updated_at: now,
      },
      // Crypto
      {
        name: 'Bitcoin',
        symbol: 'BTC',
        asset_class: 'crypto',
        purpose: 'wealth_compounder',
        current_value: 28500,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 0.312,
        cost_basis: 19800,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'USD Coin',
        symbol: 'USDC',
        asset_class: 'crypto',
        purpose: 'liquidity_reserve',
        current_value: 8000,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 8000,
        cost_basis: 8000,
        created_at: now,
        updated_at: now,
      },
      // Cash
      {
        name: 'Primary Savings',
        symbol: null,
        asset_class: 'cash',
        purpose: 'liquidity_reserve',
        current_value: 42000,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: null,
        cost_basis: null,
        notes: 'High-yield savings account',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Emergency Fund',
        symbol: null,
        asset_class: 'cash',
        purpose: 'liquidity_reserve',
        current_value: 18000,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: null,
        cost_basis: null,
        notes: '6-month expense buffer',
        created_at: now,
        updated_at: now,
      },
      // Funds
      {
        name: 'Vanguard FTSE All-World ETF',
        symbol: 'VWRA',
        asset_class: 'funds',
        purpose: 'wealth_compounder',
        current_value: 35000,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 420.5,
        cost_basis: 28000,
        created_at: now,
        updated_at: now,
      },
      {
        name: 'iShares Asia 50 ETF',
        symbol: 'AIA',
        asset_class: 'funds',
        purpose: 'wealth_compounder',
        current_value: 15500,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: 310.0,
        cost_basis: 13200,
        created_at: now,
        updated_at: now,
      },
      // Private Loan
      {
        name: 'Business Loan — Partner A',
        symbol: null,
        asset_class: 'private_loan',
        purpose: 'income_generator',
        current_value: 22000,
        currency: 'USD',
        include_in_investment_net_worth: true,
        include_in_total_net_worth: true,
        quantity: null,
        cost_basis: 20000,
        notes: '8% p.a. interest. Principal repayment due 2027-06.',
        created_at: now,
        updated_at: now,
      },
      // Real Estate — include_in_investment_net_worth: false
      {
        name: 'Residential Apartment',
        symbol: null,
        asset_class: 'real_estate',
        purpose: 'store_of_value',
        current_value: 185000,
        currency: 'USD',
        include_in_investment_net_worth: false,
        include_in_total_net_worth: true,
        quantity: null,
        cost_basis: 140000,
        notes: 'Primary residence. Valued at purchase price + estimated appreciation.',
        created_at: now,
        updated_at: now,
      },
      // Gold — include_in_investment_net_worth: false
      {
        name: 'Physical Gold (50g)',
        symbol: 'XAU',
        asset_class: 'gold',
        purpose: 'store_of_value',
        current_value: 14500,
        currency: 'USD',
        include_in_investment_net_worth: false,
        include_in_total_net_worth: true,
        quantity: 50,
        cost_basis: 10500,
        notes: 'Stored in safety deposit box.',
        created_at: now,
        updated_at: now,
      },
    ])
    .returning();

  // ── Net Worth calculation ──────────────────────────────────────────────────
  // Investment NW: all except Real Estate + Gold (include_in_investment_net_worth: false)
  // Stock: 18500 + 14200 + 12800 = 45500
  // Crypto: 28500 + 8000 = 36500
  // Cash: 42000 + 18000 = 60000
  // Funds: 35000 + 15500 = 50500
  // Private Loan: 22000
  // Total investable: 214500
  //
  // Real Estate: 185000, Gold: 14500 — in TNW only
  // Total NW: 414000

  const investmentNW = 214500;
  const totalNW = 414000;

  // Breakdown by class
  const breakdown = {
    stock: { value: 45500, weight: (45500 / investmentNW) * 100, count: 3 },
    crypto: { value: 36500, weight: (36500 / investmentNW) * 100, count: 2 },
    cash: { value: 60000, weight: (60000 / investmentNW) * 100, count: 2 },
    funds: { value: 50500, weight: (50500 / investmentNW) * 100, count: 2 },
    private_loan: { value: 22000, weight: (22000 / investmentNW) * 100, count: 1 },
    real_estate: { value: 185000, weight: (185000 / totalNW) * 100, count: 1 },
    gold: { value: 14500, weight: (14500 / totalNW) * 100, count: 1 },
  };

  await db.insert(netWorthSnapshots).values({
    as_of_date: today,
    investment_net_worth: investmentNW,
    total_net_worth: totalNW,
    breakdown_json: JSON.stringify(breakdown),
    created_at: now,
  });

  // ── Target Allocations (% of Investment Net Worth) ─────────────────────────
  // Stock actual: 45500/214500 = 21.2% — target 30%, lower 25% → UNDERWEIGHT ALERT
  // Crypto actual: 36500/214500 = 17.0% — target 15%, bands 10-22% → OK
  // Cash actual: 60000/214500 = 28.0% — target 22%, upper 27% → OVERWEIGHT ALERT
  // Funds actual: 50500/214500 = 23.5% — target 22%, bands 15-28% → OK
  // Private Loan: 22000/214500 = 10.3% — target 10%, bands 5-15% → OK

  await db.insert(targetAllocations).values([
    {
      asset_class: 'stock',
      target_weight: 30,
      lower_band: 25,
      upper_band: 38,
      updated_at: now,
    },
    {
      asset_class: 'crypto',
      target_weight: 15,
      lower_band: 10,
      upper_band: 22,
      updated_at: now,
    },
    {
      asset_class: 'cash',
      target_weight: 22,
      lower_band: 15,
      upper_band: 27,
      updated_at: now,
    },
    {
      asset_class: 'funds',
      target_weight: 22,
      lower_band: 15,
      upper_band: 28,
      updated_at: now,
    },
    {
      asset_class: 'private_loan',
      target_weight: 10,
      lower_band: 5,
      upper_band: 15,
      updated_at: now,
    },
  ]);

  // ── Rebalance Alerts ───────────────────────────────────────────────────────
  await db.insert(rebalanceAlerts).values([
    {
      asset_class: 'stock',
      actual_weight: 21.21,
      target_weight: 30,
      lower_band: 25,
      upper_band: 38,
      deviation: -8.79,
      severity: 'major',
      direction: 'underweight',
      detected_at: now,
      status: 'open',
    },
    {
      asset_class: 'cash',
      actual_weight: 27.97,
      target_weight: 22,
      lower_band: 15,
      upper_band: 27,
      deviation: 0.97,
      severity: 'minor',
      direction: 'overweight',
      detected_at: now,
      status: 'open',
    },
  ]);

  // ── Watchlist ──────────────────────────────────────────────────────────────
  await db.insert(watchlistItems).values([
    {
      name: 'Ethereum',
      symbol: 'ETH',
      asset_class: 'crypto',
      note: 'Staking yield at 4.2%. Monitor upgrade schedule and institutional inflows.',
      alert_flag: false,
      review_date: '2026-07-01',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      name: 'Brookfield Asset Management',
      symbol: 'BAM',
      asset_class: 'stock',
      note: 'High-quality alternative asset manager. Target entry $42–45. Currently trading above range.',
      alert_flag: true,
      review_date: '2026-06-20',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      name: 'Nvidia Corp.',
      symbol: 'NVDA',
      asset_class: 'stock',
      note: 'AI infrastructure play. Valuation stretched. Monitor Q2 results for rerating signal.',
      alert_flag: true,
      review_date: '2026-06-15',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
    {
      name: 'Vietnam MSCI ETF',
      symbol: 'MVNM',
      asset_class: 'funds',
      note: 'EM allocation opportunity. Watching for macro entry conditions and USD/VND stability.',
      alert_flag: false,
      review_date: '2026-08-01',
      status: 'active',
      created_at: now,
      updated_at: now,
    },
  ]);

  // ── Research Theses ────────────────────────────────────────────────────────
  const btcAsset = insertedAssets.find((a) => a.symbol === 'BTC');
  const aaplAsset = insertedAssets.find((a) => a.symbol === 'AAPL');
  const loanAsset = insertedAssets.find((a) => a.name === 'Business Loan — Partner A');

  const theses = await db
    .insert(researchTheses)
    .values([
      {
        asset_id: btcAsset?.id ?? null,
        asset_name: 'Bitcoin',
        stance: 'bullish',
        summary:
          'BTC functions as a digital store of value and long-term inflation hedge. Institutional adoption continues. On-chain accumulation metrics strong. Core holding for wealth compounding across cycles.',
        version: 2,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        asset_id: aaplAsset?.id ?? null,
        asset_name: 'Apple Inc.',
        stance: 'bullish',
        summary:
          'Services segment driving margin expansion. Ecosystem lock-in durable. Capital return program active. Thesis intact at current valuation given quality premium.',
        version: 1,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
      {
        asset_id: loanAsset?.id ?? null,
        asset_name: 'Business Loan — Partner A',
        stance: 'neutral',
        summary:
          'Structured at 8% p.a. fixed. Principal secured against business assets. Risk: counterparty concentration. Income generator allocation, not growth vehicle.',
        version: 1,
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    ])
    .returning();

  const btcThesis = theses.find((t) => t.asset_name === 'Bitcoin');
  const aaplThesis = theses.find((t) => t.asset_name === 'Apple Inc.');

  // ── Decision Log ───────────────────────────────────────────────────────────
  await db.insert(decisionLogs).values([
    {
      asset_id: btcAsset?.id ?? null,
      asset_name: 'Bitcoin',
      asset_class: 'crypto',
      decision_type: 'add',
      rationale:
        'Increased BTC position by $3,000. On-chain accumulation metrics strong. Dollar-cost averaging into Q3.',
      amount: 3000,
      thesis_id: btcThesis?.id ?? null,
      decision_date: '2026-06-01',
      created_at: now,
    },
    {
      asset_id: aaplAsset?.id ?? null,
      asset_name: 'Apple Inc.',
      asset_class: 'stock',
      decision_type: 'hold',
      rationale:
        'Services revenue growth trajectory intact. No action at current price. Re-review at next earnings.',
      amount: null,
      thesis_id: aaplThesis?.id ?? null,
      decision_date: '2026-05-22',
      created_at: now,
    },
    {
      asset_id: loanAsset?.id ?? null,
      asset_name: 'Business Loan — Partner A',
      asset_class: 'private_loan',
      decision_type: 'monitor',
      rationale: 'Q1 interest received on schedule. Principal intact. No changes warranted.',
      amount: null,
      thesis_id: null,
      decision_date: '2026-05-15',
      created_at: now,
    },
    {
      asset_id: insertedAssets.find((a) => a.symbol === 'VWRA')?.id ?? null,
      asset_name: 'Vanguard FTSE All-World ETF',
      asset_class: 'funds',
      decision_type: 'buy',
      rationale: 'Regular monthly DCA contribution. $2,000 added at current NAV.',
      amount: 2000,
      thesis_id: null,
      decision_date: '2026-05-08',
      created_at: now,
    },
    {
      asset_id: insertedAssets.find((a) => a.symbol === 'USDC')?.id ?? null,
      asset_name: 'USD Coin',
      asset_class: 'crypto',
      decision_type: 'trim',
      rationale:
        'Reduced USDC by $2,000. Redeployed to BTC. On-chain cash position normalised to target.',
      amount: -2000,
      thesis_id: null,
      decision_date: '2026-04-28',
      created_at: now,
    },
  ]);

  console.log('Seed complete.');
  console.log(`  Assets:             ${insertedAssets.length}`);
  console.log(`  Theses:             ${theses.length}`);
  console.log(`  Decision entries:   5`);
  console.log(`  Watchlist items:    4`);
  console.log(`  Rebalance alerts:   2`);
  console.log(`  Net worth snapshot: 1`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
