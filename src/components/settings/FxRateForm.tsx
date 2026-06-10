'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { saveFxRate } from '@/app/settings/actions';

type FormState = { error?: string; success?: boolean } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : 'Save Rate'}
    </button>
  );
}

export function FxRateForm({ currentRate }: { currentRate: number }) {
  const [state, formAction] = useFormState<FormState, FormData>(saveFxRate, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="usd_vnd_rate"
          className="block text-xs font-medium text-zinc-400 mb-1.5"
        >
          USD / VND Exchange Rate
        </label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600 pointer-events-none">
              1 USD =
            </span>
            <input
              id="usd_vnd_rate"
              name="usd_vnd_rate"
              type="number"
              defaultValue={currentRate}
              step="1"
              min="1000"
              max="1000000"
              required
              className="w-44 pl-14 pr-4 py-2.5 bg-[#1C1C21] border border-[#26262B] hover:border-zinc-600 focus:border-indigo-500 focus:outline-none rounded-lg text-sm text-zinc-100 tabular-nums transition-colors"
            />
          </div>
          <span className="text-xs text-zinc-600">VND</span>
          <SubmitButton />
        </div>
      </div>

      {state?.error && (
        <p className="text-xs text-red-400">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-emerald-400">Rate saved — all calculations updated.</p>
      )}

      <p className="text-xs text-zinc-700">
        Used to normalize VND-denominated assets to USD for portfolio reporting. Does not modify stored asset values.
      </p>
    </form>
  );
}
