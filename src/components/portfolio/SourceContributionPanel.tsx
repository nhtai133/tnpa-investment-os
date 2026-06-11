import { Card, CardHeader } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/formatters';
import type { SourceContribution } from '@/lib/portfolio-aggregation';

const REQUIRED_ROWS = [
  { key: 'legacy_holdings', label: 'Legacy Holdings' },
  { key: 'banking_accounts', label: 'Banking Accounts' },
  { key: 'savings_deposits', label: 'Savings Deposits' },
  { key: 'credit_used', label: 'Credit Used' },
  { key: 'stocks', label: 'Stocks' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'real_estate', label: 'Real Estate' },
  { key: 'gold', label: 'Gold' },
  { key: 'funds', label: 'Funds' },
  { key: 'loans', label: 'Loans' },
];

export function SourceContributionPanel({ rows }: { rows: SourceContribution[] }) {
  const map = new Map(rows.map((row) => [row.key, row]));

  return (
    <Card className="overflow-hidden">
      <CardHeader label="Portfolio Aggregation Debug" action="source contribution" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-[#1C1C21]">
        {REQUIRED_ROWS.map((required) => {
          const row = map.get(required.key);
          const value = row?.valueUsd ?? 0;
          return (
            <div key={required.key} className="px-4 py-3 border-r border-b border-[#1C1C21] last:border-r-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600">{required.label}</p>
              <p className={`mt-1 text-sm tabular-nums ${value < 0 ? 'text-red-300' : 'text-zinc-200'}`}>
                {formatCurrency(value)}
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-700">{row?.count ?? 0} rows</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
