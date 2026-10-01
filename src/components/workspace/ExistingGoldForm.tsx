'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { tr } from '@/i18n';
import { createGoldAsset, type PhysicalAssetActionState } from '@/app/gold/actions';

const input = 'w-full rounded-lg border border-[#303037] bg-[#0C0C0E] px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none';
const label = 'space-y-1.5 text-[11px] text-zinc-500';

export function ExistingGoldForm({ openingDate }: { openingDate: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PhysicalAssetActionState | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const response = await createGoldAsset(data);
      setResult(response);
      if (response.success) { form.reset(); router.refresh(); }
    });
  }
  return <section id="opening-gold" className="rounded-xl border border-[#303037] bg-[#131316] p-5 space-y-4">
    <div><h2 className="text-sm font-semibold text-zinc-100">+ {tr('Add existing gold')}</h2><p className="mt-1 text-xs text-zinc-500">{tr('Enter physical gold already owned by the household. This is existing wealth, not a purchase or income.')}</p></div>
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Field label="Asset name"><input name="name" required placeholder={tr('Asset name')} className={input} /></Field>
      <Field label="Purity"><select name="gold_purity" className={input}><option value="9999 / 24K">9999 / 24K</option><option value="18K">18K</option><option value="other">{tr('Other / custom')}</option></select></Field>
      <Field label="Custom purity"><input name="gold_purity_custom" placeholder="Ví dụ: 14K" className={input} /></Field>
      <Field label="Form"><select name="gold_form" className={input}><option value="ring">{tr('Ring')}</option><option value="necklace">{tr('Necklace')}</option><option value="bracelet">{tr('Bracelet')}</option><option value="bar">{tr('Gold bar')}</option><option value="other">{tr('Other / custom')}</option></select></Field>
      <Field label="Custom form"><input name="gold_form_custom" placeholder={tr('Other form')} className={input} /></Field>
      <Field label="Number of items (optional)"><input name="gold_item_count" type="number" min="0.01" step="any" className={input} /></Field>
      <Field label="Weight"><input name="gold_weight" type="number" min="0.0001" step="any" required className={input} /></Field>
      <Field label="Weight unit"><select name="gold_weight_unit" className={input}><option value="lượng">lượng</option><option value="chỉ">chỉ</option><option value="gram">gram</option></select></Field>
      <Field label="Storage location"><select name="storage_location" className={input}><option value="safe">{tr('Safe')}</option><option value="home">{tr('At home')}</option><option value="other">{tr('Other / custom')}</option></select></Field>
      <Field label="Custom storage"><input name="storage_location_custom" placeholder={tr('Storage location')} className={input} /></Field>
      <Field label="Ownership label"><select name="ownership_label" className={input}><option value="Gia đình">{tr('Household')}</option><option value="Cá nhân">Cá nhân</option><option value="Đồng sở hữu">Đồng sở hữu</option><option value="other">{tr('Other / custom')}</option></select></Field>
      <Field label="Custom ownership label"><input name="ownership_custom" placeholder={tr('Ownership label')} className={input} /></Field>
      <Field label="Cost basis method"><select name="cost_basis_mode" className={input}><option value="total">{tr('Total cost basis')}</option><option value="average">{tr('Average cost per weight unit')}</option><option value="unknown">{tr('Unknown cost basis')}</option></select></Field>
      <Field label="Cost basis amount (VND)"><input name="cost_basis_value" type="number" min="0" step="any" className={input} /></Field>
      <Field label="Current valuation method"><select name="valuation_mode" className={input}><option value="total">{tr('Estimated total current value')}</option><option value="unit">{tr('Estimated price per weight unit')}</option></select></Field>
      <Field label="Estimated total current value (VND)"><input name="current_value" type="number" min="0.01" step="any" className={input} /></Field>
      <Field label="Estimated price per weight unit (VND)"><input name="price_per_weight_unit" type="number" min="0.01" step="any" className={input} /></Field>
      <Field label="Date tracking started"><input name="opening_date" type="date" defaultValue={openingDate} required className={input} /></Field>
      <Field label="Original / acquisition date (optional)"><input name="acquisition_date" type="date" className={input} /></Field>
      <label className={`${label} md:col-span-2`}><span>{tr('Notes')}</span><textarea name="notes" rows={2} className={input} /></label>
      <div className="md:col-span-2"><button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{pending ? tr('Saving...') : tr('Add existing gold')}</button></div>
    </form>
    {result?.error && <p role="alert" className="text-xs text-red-400">{tr(result.error)}</p>}{result?.success && <p role="status" className="text-xs text-emerald-400">{tr(result.success)}</p>}
  </section>;
}

function Field({ label: labelText, children }: { label: string; children: React.ReactNode }) { return <label className={label}><span>{tr(labelText)}</span>{children}</label>; }
