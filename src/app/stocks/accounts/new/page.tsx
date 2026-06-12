import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { BrokerAccountForm } from '@/components/stocks/BrokerAccountForm';
import { createBrokerAccount } from '@/app/stocks/accounts/actions';

export default function NewBrokerAccountPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href="/stocks/accounts"
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← Broker Accounts
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Broker Account
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label="New Broker Account" />
            <div className="p-5">
              <BrokerAccountForm action={createBrokerAccount} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
