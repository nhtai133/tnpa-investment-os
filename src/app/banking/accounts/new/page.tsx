import { tr } from '@/i18n';
import { createBankAccount } from '@/app/banking/actions';
import { BankAccountForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';

export default function NewBankAccountPage() {
  return (
    <FormPageShell title={tr("Add Bank Account")}>
      <BankAccountForm action={createBankAccount} />
    </FormPageShell>
  );
}
