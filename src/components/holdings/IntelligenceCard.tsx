import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { formatDate } from '@/lib/formatters';
import type { AssetIntelligence, AssetClass } from '@/db/schema';

function IntelField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-[#1C1C21] last:border-0">
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-600 mb-1">{label}</p>
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-widest uppercase text-zinc-500 mb-0 pb-2 border-b border-[#26262B]">
        {title}
      </p>
      <div>{children}</div>
    </div>
  );
}

interface IntelligenceCardProps {
  intel: AssetIntelligence;
  assetId: number;
  assetClass: AssetClass;
}

export function IntelligenceCard({ intel, assetId, assetClass }: IntelligenceCardProps) {
  const isStock = assetClass === 'stock';
  const isCrypto = assetClass === 'crypto';
  const isRealEstate = assetClass === 'real_estate';
  const isGold = assetClass === 'gold';
  const isCash = assetClass === 'cash' || assetClass === 'funds';
  const isPrivateLoan = assetClass === 'private_loan';

  const hasThesis = intel.investment_thesis || intel.risk_notes;
  const hasZones = intel.buy_zone || intel.sell_zone || intel.accumulation_plan || intel.exit_plan;
  const hasReview = intel.review_cadence || intel.next_review_date;
  const hasClassSpecific =
    intel.dividend_notes || intel.valuation_notes ||
    intel.cycle_thesis || intel.dca_plan ||
    intel.legal_status || intel.yield_notes ||
    intel.loan_terms || intel.counterparty_notes;

  return (
    <Card>
      <CardHeader
        label="Asset Intelligence"
        action={
          <Link
            href={`/holdings/${assetId}/intelligence/edit`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Edit →
          </Link>
        }
      />
      <div className="p-5 space-y-6">
        {hasThesis && (
          <Section title="A · Core Thesis">
            <IntelField label="Investment Thesis" value={intel.investment_thesis} />
            <IntelField label="Risk Notes" value={intel.risk_notes} />
          </Section>
        )}

        {hasZones && (
          <Section title="B · Strategy Zones">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <IntelField label="Buy Zone" value={intel.buy_zone} />
                <IntelField label="Accumulation Plan" value={intel.accumulation_plan} />
              </div>
              <div>
                <IntelField label="Sell Zone" value={intel.sell_zone} />
                <IntelField label="Exit Plan" value={intel.exit_plan} />
              </div>
            </div>
          </Section>
        )}

        {hasReview && (
          <Section title="C · Review System">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <IntelField label="Review Cadence" value={intel.review_cadence} />
              <IntelField label="Next Review Date" value={intel.next_review_date} />
            </div>
          </Section>
        )}

        {hasClassSpecific && (
          <Section title="D · Asset-Class Notes">
            {isStock && (
              <>
                <IntelField label="Dividend / Income Notes" value={intel.dividend_notes} />
                <IntelField label="Valuation Notes" value={intel.valuation_notes} />
              </>
            )}
            {isCrypto && (
              <>
                <IntelField label="Cycle Thesis" value={intel.cycle_thesis} />
                <IntelField label="DCA Plan" value={intel.dca_plan} />
              </>
            )}
            {isRealEstate && (
              <>
                <IntelField label="Legal Status" value={intel.legal_status} />
                <IntelField label="Yield Notes" value={intel.yield_notes} />
              </>
            )}
            {isGold && <IntelField label="Accumulation Plan" value={intel.accumulation_plan} />}
            {isCash && <IntelField label="Yield Notes" value={intel.yield_notes} />}
            {isPrivateLoan && (
              <>
                <IntelField label="Loan Terms" value={intel.loan_terms} />
                <IntelField label="Counterparty Notes" value={intel.counterparty_notes} />
              </>
            )}
          </Section>
        )}

        <p className="text-[11px] text-zinc-700 pt-2 border-t border-[#1C1C21]">
          Last updated {formatDate(intel.updated_at)}
        </p>
      </div>
    </Card>
  );
}
