import { notFound } from 'next/navigation';
import { db } from '@/db';
import { bankAccounts } from '@/db/schema';
import { updateBankAccount } from '@/app/banking/actions';
import { BankAccountForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function EditBankAccountPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const account = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1).then((rows) => rows[0]);
  if (!account) notFound();
  return (
    <FormPageShell title="Edit Bank Account">
      <BankAccountForm action={updateBankAccount.bind(null, account.id)} defaultValues={account} />
    </FormPageShell>
  );
}
