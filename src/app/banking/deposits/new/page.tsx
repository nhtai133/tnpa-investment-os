import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { createBankSavingsDeposit } from '@/app/banking/actions';
import { SavingsDepositForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function NewSavingsDepositPage() {
  const accounts = await db.select().from(bankAccounts).orderBy(asc(bankAccounts.bank_name));
  return (
    <FormPageShell title="Add Savings Deposit">
      <SavingsDepositForm action={createBankSavingsDeposit} accounts={accounts} />
    </FormPageShell>
  );
}
