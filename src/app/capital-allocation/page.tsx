import Link from 'next/link';
import { getCapitalData } from '@/lib/capital-store';
import { CapitalSummary } from '@/components/capital/CapitalSummary';
import { PolicyEditor, AssignmentEditor } from '@/components/capital/CapitalEditor';
import { formatValue, ASSET_CLASS_LABELS } from '@/lib/formatters';
export const dynamic = 'force-dynamic';
export default async function CapitalPage({ searchParams }: { searchParams: { source?: string } }) {
  const { portfolio, purposes, assignments, allocation } = await getCapitalData();
  const classes = new Map<string, number>();
  for (const p of portfolio.positions.filter(p=>p.includeInTotalNetWorth)) classes.set(p.isLiability?'Nợ phải trả':p.assetClass,(classes.get(p.isLiability?'Nợ phải trả':p.assetClass)??0)+p.valueUsd*portfolio.usdVndRate);
  return <main className="max-w-screen-xl mx-auto p-6 space-y-8"><h1 className="text-2xl font-semibold">Phân bổ tài sản & mục đích vốn</h1>
    <Link href="/rebalancing" className="text-indigo-400">Chính sách lớp tài sản hiện có →</Link><section className="border border-zinc-800 rounded-xl p-5"><h2 className="text-xl mb-3">Phân bổ theo lớp tài sản</h2><p className="text-sm text-zinc-400">Tôi đang sở hữu gì? Giá trị kinh tế gốc, nợ trình bày riêng.</p><div className="grid md:grid-cols-3 gap-3 mt-3">{Array.from(classes).map(([name,value])=><p key={name}>{ASSET_CLASS_LABELS[name as keyof typeof ASSET_CLASS_LABELS] ?? name}: {formatValue(value,'VND')}</p>)}</div><p className="mt-3">Tổng tài sản ròng: {formatValue(portfolio.totalNetWorth*portfolio.usdVndRate,'VND')}</p></section>
    <CapitalSummary data={allocation}/>
    {allocation.excluded.length>0&&<details><summary>Tài sản ngoài mẫu số đầu tư ({allocation.excluded.length})</summary>{allocation.excluded.map(p=><p key={p.id}>{p.name}: {formatValue(p.valueUsd*portfolio.usdVndRate,'VND')}</p>)}</details>}
    <AssignmentEditor sources={allocation.sources} purposes={purposes} assignments={assignments} selected={searchParams.source}/><PolicyEditor purposes={purposes}/>
  </main>;
}
