import { notFound } from 'next/navigation';
import { db } from '@/db';
import { bankAccounts, bankSavingsDeposits } from '@/db/schema';
import { updateBankSavingsDeposit } from '@/app/banking/actions';
import { SavingsDepositForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';
import { asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function EditSavingsDepositPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const [deposit, accounts] = await Promise.all([
    db.select().from(bankSavingsDeposits).where(eq(bankSavingsDeposits.id, id)).limit(1).then((rows) => rows[0]),
    db.select().from(bankAccounts).orderBy(asc(bankAccounts.bank_name)),
  ]);
  if (!deposit) notFound();
  return (
    <FormPageShell title="Edit Savings Deposit">
      <SavingsDepositForm action={updateBankSavingsDeposit.bind(null, deposit.id)} accounts={accounts} defaultValues={deposit} />
    </FormPageShell>
  );
}
