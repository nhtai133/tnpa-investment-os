import { notFound } from 'next/navigation';
import { db } from '@/db';
import { bankCreditFacilities } from '@/db/schema';
import { updateBankCreditFacility } from '@/app/banking/actions';
import { CreditFacilityForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function EditCreditFacilityPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const facility = await db.select().from(bankCreditFacilities).where(eq(bankCreditFacilities.id, id)).limit(1).then((rows) => rows[0]);
  if (!facility) notFound();
  return (
    <FormPageShell title="Edit Credit Facility">
      <CreditFacilityForm action={updateBankCreditFacility.bind(null, facility.id)} defaultValues={facility} />
    </FormPageShell>
  );
}
