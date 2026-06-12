import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { CryptoAccountForm } from '@/components/crypto/CryptoAccountForm';
import { createCryptoAccount } from '@/app/crypto/accounts/actions';

interface Props {
  searchParams: { return?: string };
}

export default function NewCryptoAccountPage({ searchParams }: Props) {
  const returnUrl = searchParams.return ?? undefined;

  return (
    <div className="min-h-screen bg-[#0C0C0E]">
      <header className="border-b border-[#26262B] px-6 py-4 bg-[#0C0C0E]">
        <div className="max-w-screen-xl mx-auto">
          <Link
            href={returnUrl ?? '/crypto/accounts'}
            className="text-[11px] tracking-widest uppercase text-zinc-600 hover:text-zinc-400 transition-colors font-semibold"
          >
            ← {returnUrl ? 'Back' : 'Exchanges & Wallets'}
          </Link>
          <h1 className="text-base font-semibold text-zinc-100 leading-tight mt-0.5">
            Add Exchange or Wallet
          </h1>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="max-w-lg">
          <Card>
            <CardHeader label="New Crypto Account" />
            <div className="p-5">
              <CryptoAccountForm action={createCryptoAccount} returnUrl={returnUrl} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
