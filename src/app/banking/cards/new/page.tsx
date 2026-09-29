import { tr } from '@/i18n';
import { createBankCreditCard } from '@/app/banking/actions';
import { CreditCardForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';

export default function NewCreditCardPage() {
  return (
    <FormPageShell title={tr("Add Credit Card")}>
      <CreditCardForm action={createBankCreditCard} />
    </FormPageShell>
  );
}
