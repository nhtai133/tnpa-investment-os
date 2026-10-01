import { tr } from '@/i18n';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { createBankSavingsDeposit } from '@/app/banking/actions';
import { SavingsDepositForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';
import { asc } from 'drizzle-orm';
import { getAppSetting } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function NewSavingsDepositPage() {
  const [accounts, trackingStartDate] = await Promise.all([
    db.select().from(bankAccounts).orderBy(asc(bankAccounts.bank_name)),
    getAppSetting('wealth_tracking_start_date'),
  ]);
  return (
    <FormPageShell title={tr("Add Savings Deposit")}>
      <SavingsDepositForm action={createBankSavingsDeposit} accounts={accounts} trackingStartDate={trackingStartDate ?? new Date().toISOString().slice(0, 10)} />
    </FormPageShell>
  );
}
