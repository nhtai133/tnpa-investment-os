import { Card, CardHeader } from '@/components/ui/Card';
import type { Transaction } from '@/db/schema';
import { formatDate, formatValue } from '@/lib/formatters';

interface LifecycleDashboardProps {
  cashByAccount: Array<{ account: { id: number; name: string; currency: string }; balance: number }>;
  assetsByCustody: Array<{
    account?: { id: number; name: string } | null;
    asset?: { id: number; name: string; symbol: string | null; currency: string } | null;
    quantity: number;
    costBasis: number;
  }>;
  cryptoColdStoragePct: number;
  idleCash: number;
  investedCapital: number;
  recentMoneyFlows: Transaction[];
  recentTransfers: Transaction[];
  lifetimePnl: number;
}

export function LifecycleDashboard({
  cashByAccount,
  assetsByCustody,
  cryptoColdStoragePct,
  idleCash,
  investedCapital,
  recentMoneyFlows,
  recentTransfers,
  lifetimePnl,
}: LifecycleDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Crypto Cold Storage" value={`${cryptoColdStoragePct.toFixed(1)}%`} />
        <Stat label="Idle Cash" value={formatValue(idleCash, 'VND')} />
        <Stat label="Invested Capital" value={formatValue(investedCapital)} />
        <Stat label="Lifetime P&L" value={formatValue(lifetimePnl)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader label="Cash by Account" />
          <List>
            {cashByAccount.slice(0, 6).map((row) => (
              <Row
                key={row.account.id}
                label={row.account.name}
                value={formatValue(row.balance, row.account.currency)}
              />
            ))}
          </List>
        </Card>

        <Card>
          <CardHeader label="Assets by Custody" />
          <List>
            {assetsByCustody.slice(0, 6).map((row) => (
              <Row
                key={`${row.account?.id}-${row.asset?.id}`}
                label={`${row.asset?.symbol ?? row.asset?.name ?? '-'} at ${row.account?.name ?? '-'}`}
                value={row.quantity.toLocaleString()}
              />
            ))}
          </List>
        </Card>

        <Card>
          <CardHeader label="Recent Money Flows" />
          <List>
            {recentMoneyFlows.map((txn) => (
              <Row
                key={txn.id}
                label={`${txn.type.toUpperCase()} - ${formatDate(txn.transaction_date)}`}
                value={formatValue(txn.amount, txn.currency)}
              />
            ))}
          </List>
        </Card>

        <Card>
          <CardHeader label="Recent Transfers" />
          <List>
            {recentTransfers.map((txn) => (
              <Row
                key={txn.id}
                label={formatDate(txn.transaction_date)}
                value={`${txn.quantity?.toLocaleString() ?? '-'} units`}
              />
            ))}
          </List>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-3">
        {label}
      </p>
      <p className="text-2xl font-light text-zinc-50 tracking-tight tabular-nums">{value}</p>
    </Card>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-[#1A1A1F]">{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <p className="text-sm text-zinc-300 truncate">{label}</p>
      <p className="text-sm text-zinc-500 tabular-nums whitespace-nowrap">{value}</p>
    </div>
  );
}
