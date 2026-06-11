import { createBankAccount } from '@/app/banking/actions';
import { BankAccountForm } from '@/components/banking/BankingForms';
import { FormPageShell } from '@/components/banking/FormPageShell';

export default function NewBankAccountPage() {
  return (
    <FormPageShell title="Add Bank Account">
      <BankAccountForm action={createBankAccount} />
    </FormPageShell>
  );
}
