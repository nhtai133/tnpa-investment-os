'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { tr } from '@/i18n';
import { createRealEstateAsset } from '@/app/real-estate/actions';
import type { PhysicalAssetActionState } from '@/app/gold/actions';

const input = 'w-full rounded-lg border border-[#303037] bg-[#0C0C0E] px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none';
const label = 'space-y-1.5 text-[11px] text-zinc-500';

export function ExistingLandForm({ openingDate }: { openingDate: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PhysicalAssetActionState | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const response = await createRealEstateAsset(data);
      setResult(response);
      if (response.success) { form.reset(); router.refresh(); }
    });
  }
  return <section id="opening-land" className="rounded-xl border border-[#303037] bg-[#131316] p-5 space-y-4">
    <div><h2 className="text-sm font-semibold text-zinc-100">+ {tr('Add existing property')}</h2><p className="mt-1 text-xs text-zinc-500">{tr('Enter land already owned. Purchase history is not required; ownership is applied once to household value.')}</p></div>
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Field label="Property name"><input name="name" required placeholder={tr('Land property')} className={input} /></Field>
      <Field label="Property type"><select name="property_type" className={input}><option value="land">{tr('Land')}</option></select></Field>
      <Field label="Location / address"><input name="property_location" placeholder={tr('Location or address')} className={input} /></Field>
      <Field label="Legal status"><select name="property_legal_status" className={input}><option value="land_certificate">{tr('Land use certificate')}</option><option value="purchase_contract">{tr('Purchase contract')}</option><option value="no_certificate">{tr('No certificate')}</option><option value="other">{tr('Other')}</option></select></Field>
      <Field label="Area (m²)"><input name="property_area_sqm" type="number" min="0.01" step="any" required className={input} /></Field>
      <Field label="Width (m)"><input name="property_width_m" type="number" min="0.01" step="any" required className={input} /></Field>
      <Field label="Length (m)"><input name="property_length_m" type="number" min="0.01" step="any" required className={input} /></Field>
      <Field label="Ownership percentage"><input name="ownership_percentage" type="number" min="0" max="100" step="any" required className={input} /></Field>
      <Field label="Cost basis status"><select name="cost_basis_mode" className={input}><option value="known">{tr('Known cost basis')}</option><option value="unknown">{tr('Unknown cost basis')}</option></select></Field>
      <Field label="Whole-property purchase price (VND)"><input name="purchase_price" type="number" min="0" step="any" className={input} /></Field>
      <Field label="Whole-property acquisition costs (VND)"><input name="acquisition_costs" type="number" min="0" step="any" defaultValue="0" className={input} /></Field>
      <Field label="Current valuation method"><select name="valuation_mode" className={input}><option value="total">{tr('Estimated whole-property value')}</option><option value="sqm">{tr('Estimated price per m²')}</option></select></Field>
      <Field label="Estimated whole-property value (VND)"><input name="current_value" type="number" min="0.01" step="any" className={input} /></Field>
      <Field label="Estimated price per m² (VND)"><input name="property_value_per_sqm" type="number" min="0.01" step="any" className={input} /></Field>
      <Field label="Date tracking started"><input name="opening_date" type="date" defaultValue={openingDate} required className={input} /></Field>
      <Field label="Acquisition date (optional)"><input name="acquisition_date" type="date" className={input} /></Field>
      <label className={`${label} md:col-span-2`}><span>{tr('Notes')}</span><textarea name="notes" rows={2} className={input} /></label>
      <div className="md:col-span-2"><button disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{pending ? tr('Saving...') : tr('Add existing property')}</button></div>
    </form>
    {result?.error && <p role="alert" className="text-xs text-red-400">{tr(result.error)}</p>}{result?.success && <p role="status" className="text-xs text-emerald-400">{tr(result.success)}</p>}
  </section>;
}

function Field({ label: labelText, children }: { label: string; children: React.ReactNode }) { return <label className={label}><span>{tr(labelText)}</span>{children}</label>; }
