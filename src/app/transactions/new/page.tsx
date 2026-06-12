import { db } from '@/db';
import { accountRegistry, assets } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { Card, CardHeader } from '@/components/ui/Card';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { createTransaction } from '@/app/transactions/actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { asset_id?: string };
}

export default async function NewTransactionPage({ searchParams }: Props) {
  const [activeAssets, accounts] = await Promise.all([
    db
      .select()
      .from(assets)
      .where(eq(assets.is_archived, false))
      .orderBy(asc(assets.name)),
    db
      .select()
      .from(accountRegistry)
      .where(eq(accountRegistry.status, 'active'))
      .orderBy(asc(accountRegistry.type), asc(accountRegistry.name)),
  ]);

  const preselectedAssetId = searchParams.asset_id ? Number(searchParams.asset_id) : undefined;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <a
            href="/transactions"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Transactions
          </a>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Transaction
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label="New Transaction" />
            <div className="p-5">
              <TransactionForm
                action={createTransaction}
                assets={activeAssets}
                accounts={accounts}
                preselectedAssetId={preselectedAssetId}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
