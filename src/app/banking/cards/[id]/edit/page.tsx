import { notFound } from 'next/navigation';
import { db } from '@/db';
import { bankCreditCards } from '@/db/schema';
import { updateBankCreditCard } from '@/app/banking/actions';
import { CreditCardForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function EditCreditCardPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const card = await db.select().from(bankCreditCards).where(eq(bankCreditCards.id, id)).limit(1).then((rows) => rows[0]);
  if (!card) notFound();
  return (
    <FormPageShell title="Edit Credit Card">
      <CreditCardForm action={updateBankCreditCard.bind(null, card.id)} defaultValues={card} />
    </FormPageShell>
  );
}
