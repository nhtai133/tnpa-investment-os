'use client';
import { tr } from '@/i18n';


import { useFormStatus } from 'react-dom';
import type { AssetClass, AssetIntelligence } from '@/db/schema';

const inputClass =
  'w-full bg-[#1C1C21] border border-[#26262B] rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-colors';

const labelClass = 'block text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-1.5';

const sectionClass = 'space-y-4 pt-5 first:pt-0';
const sectionTitleClass = 'text-[11px] font-semibold tracking-widest uppercase text-zinc-600 pb-3 border-b border-[#26262B]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function TextArea({ name, defaultValue, placeholder, rows = 3 }: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      rows={rows}
      defaultValue={defaultValue ?? ''}
      placeholder={placeholder}
      className={`${inputClass} resize-none`}
    />
  );
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Intelligence'}
    </button>
  );
}

interface IntelligenceFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: AssetIntelligence | null;
  assetClass: AssetClass;
  cancelHref: string;
}

export function IntelligenceForm({ action, defaultValues, assetClass, cancelHref }: IntelligenceFormProps) {
  const isEdit = !!defaultValues;
  const d = defaultValues;

  const isStock = assetClass === 'stock';
  const isCrypto = assetClass === 'crypto';
  const isRealEstate = assetClass === 'real_estate';
  const isGold = assetClass === 'gold';
  const isCash = assetClass === 'cash' || assetClass === 'funds';
  const isPrivateLoan = assetClass === 'private_loan';

  const hasClassSpecific = isStock || isCrypto || isRealEstate || isGold || isCash || isPrivateLoan;

  return (
    <form action={action} className="space-y-5 divide-y divide-[#1C1C21]">
      {/* A. Core Thesis */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>{tr("A · Core Thesis")}</p>
        <Field label={tr("Investment Thesis")}>
          <TextArea
            name="investment_thesis"
            defaultValue={d?.investment_thesis}
            placeholder={tr("Why do you own this? What's the core belief?")}
            rows={4}
          />
        </Field>
        <Field label={tr("Risk Notes")}>
          <TextArea
            name="risk_notes"
            defaultValue={d?.risk_notes}
            placeholder={tr("Key risks, red flags, things to monitor…")}
          />
        </Field>
      </div>

      {/* B. Strategy Zones */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>{tr("B · Strategy Zones")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tr("Buy Zone")}>
            <TextArea
              name="buy_zone"
              defaultValue={d?.buy_zone}
              placeholder={tr("Price levels or conditions to add more…")}
              rows={2}
            />
          </Field>
          <Field label={tr("Sell Zone")}>
            <TextArea
              name="sell_zone"
              defaultValue={d?.sell_zone}
              placeholder={tr("Price levels or conditions to exit or trim…")}
              rows={2}
            />
          </Field>
        </div>
        <Field label={tr("Accumulation Plan")}>
          <TextArea
            name="accumulation_plan"
            defaultValue={d?.accumulation_plan}
            placeholder={tr("How and when to build up the position…")}
          />
        </Field>
        <Field label={tr("Exit Plan")}>
          <TextArea
            name="exit_plan"
            defaultValue={d?.exit_plan}
            placeholder={tr("Under what conditions would you fully exit?")}
          />
        </Field>
      </div>

      {/* C. Review System */}
      <div className={sectionClass}>
        <p className={sectionTitleClass}>{tr("C · Review System")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={tr("Review Cadence")}>
            <input
              type="text"
              name="review_cadence"
              defaultValue={d?.review_cadence ?? ''}
              placeholder={tr("e.g. Monthly, Quarterly, After earnings…")}
              className={inputClass}
            />
          </Field>
          <Field label={tr("Next Review Date")}>
            <input
              type="date"
              name="next_review_date"
              defaultValue={d?.next_review_date ?? ''}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* D. Asset-Class Specific */}
      {hasClassSpecific && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>{tr("D · Asset-Class Notes")}</p>

          {isStock && (
            <>
              <Field label={tr("Dividend / Income Notes")}>
                <TextArea
                  name="dividend_notes"
                  defaultValue={d?.dividend_notes}
                  placeholder={tr("Dividend yield, payout history, reinvestment plan…")}
                />
              </Field>
              <Field label={tr("Valuation Notes")}>
                <TextArea
                  name="valuation_notes"
                  defaultValue={d?.valuation_notes}
                  placeholder={tr("P/E, EV/EBITDA, DCF assumptions, comparable analysis…")}
                />
              </Field>
            </>
          )}

          {isCrypto && (
            <>
              <Field label={tr("Cycle Thesis")}>
                <TextArea
                  name="cycle_thesis"
                  defaultValue={d?.cycle_thesis}
                  placeholder={tr("Market cycle positioning, halving thesis, macro triggers…")}
                />
              </Field>
              <Field label={tr("DCA Plan")}>
                <TextArea
                  name="dca_plan"
                  defaultValue={d?.dca_plan}
                  placeholder={tr("Dollar-cost averaging schedule, frequency, amounts…")}
                />
              </Field>
            </>
          )}

          {isRealEstate && (
            <>
              <Field label={tr("Legal Status")}>
                <TextArea
                  name="legal_status"
                  defaultValue={d?.legal_status}
                  placeholder={tr("Ownership structure, title, encumbrances, tenant status…")}
                />
              </Field>
              <Field label={tr("Yield Notes")}>
                <TextArea
                  name="yield_notes"
                  defaultValue={d?.yield_notes}
                  placeholder={tr("Rental yield, cap rate, occupancy, cash-on-cash return…")}
                />
              </Field>
            </>
          )}

          {isGold && (
            <Field label={tr("Accumulation Plan (Gold)")}>
              <TextArea
                name="accumulation_plan"
                defaultValue={d?.accumulation_plan}
                placeholder={tr("Target grams/oz, storage location, buy triggers…")}
              />
            </Field>
          )}

          {isCash && (
            <Field label={tr("Yield Notes")}>
              <TextArea
                name="yield_notes"
                defaultValue={d?.yield_notes}
                placeholder={tr("Interest rate, maturity, fund yield, purpose allocation…")}
              />
            </Field>
          )}

          {isPrivateLoan && (
            <>
              <Field label={tr("Loan Terms")}>
                <TextArea
                  name="loan_terms"
                  defaultValue={d?.loan_terms}
                  placeholder={tr("Interest rate, duration, repayment schedule, collateral…")}
                />
              </Field>
              <Field label={tr("Counterparty Notes")}>
                <TextArea
                  name="counterparty_notes"
                  defaultValue={d?.counterparty_notes}
                  placeholder={tr("Borrower details, relationship, creditworthiness assessment…")}
                />
              </Field>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-5">
        <SubmitButton isEdit={isEdit} />
        <a
          href={cancelHref}
          className="px-4 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {tr("Cancel")}</a>
      </div>
    </form>
  );
}
