import { tr } from '@/i18n';
import { createBankCreditFacility } from '@/app/banking/actions';
import { CreditFacilityForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';

export default function NewCreditFacilityPage() {
  return (
    <FormPageShell title={tr("Add Credit Facility")}>
      <CreditFacilityForm action={createBankCreditFacility} />
    </FormPageShell>
  );
}
