import { Card, CardHeader } from '@/components/ui/Card';
import { AccountForm } from '@/components/accounts/AccountForm';
import { createAccount } from '@/app/accounts/actions';

export default function NewAccountPage() {
  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <a href="/accounts" className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold">
            Back to Accounts
          </a>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Account
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label="Account Registry" />
            <div className="p-5">
              <AccountForm action={createAccount} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
