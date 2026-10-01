'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { tr } from '@/i18n';
import { saveWealthTrackingStartDate } from '@/app/settings/actions';

type FormState = { error?: string; success?: boolean } | null;
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg">{pending ? tr('Saving…') : tr('Save start date')}</button>;
}

export function WealthTrackingStartDateForm({ currentDate }: { currentDate: string }) {
  const [state, formAction] = useFormState<FormState, FormData>(saveWealthTrackingStartDate, null);
  return <form action={formAction} className="space-y-3">
    <label htmlFor="wealth_tracking_start_date" className="block text-sm font-medium text-zinc-100">{tr('Ngày bắt đầu theo dõi gia sản')}</label>
    <p className="text-xs text-zinc-500">{tr('These are the assets and balances already owned when tracking begins. Opening wealth is not income or investment profit.')}</p>
    <div className="flex flex-wrap items-center gap-3">
      <input id="wealth_tracking_start_date" name="wealth_tracking_start_date" type="date" required defaultValue={currentDate} className="bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100" />
      <SubmitButton />
    </div>
    {state?.error && <p className="text-xs text-red-400">{tr(state.error)}</p>}
    {state?.success && <p className="text-xs text-emerald-400">{tr('Start date saved.')}</p>}
  </form>;
}
