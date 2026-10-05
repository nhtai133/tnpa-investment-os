import type { CapitalPurpose, CapitalAllocation } from '@/db/schema';
import type { PortfolioSummary } from './portfolio-model';

export const POLICY_TEMPLATE = [
  ['safety', 'An toàn & dự phòng gia đình', 10], ['dry-powder', 'Vốn sẵn sàng giải ngân', 30],
  ['core', 'Tăng trưởng cốt lõi', 35], ['hedge', 'Lưu giữ giá trị / phòng vệ', 10],
  ['opportunity', 'Vốn cơ hội', 10], ['experimental', 'Rủi ro cao / thử nghiệm', 5],
] as const;
export type PolicyInput = Pick<CapitalPurpose, 'name' | 'target_percent' | 'min_percent' | 'max_percent' | 'sort_order' | 'is_active'>;
export function validatePolicy(row: PolicyInput) {
  if (!row.name.trim() || row.name.length > 120) throw new Error('Tên mục đích không hợp lệ.');
  const { min_percent: min, target_percent: target, max_percent: max } = row;
  if (![min, target, max, row.sort_order].every(Number.isFinite) || min < 0 || max > 100 || min > target || target > max || !Number.isSafeInteger(row.sort_order)) throw new Error('Cần 0 ≤ tối thiểu ≤ mục tiêu ≤ tối đa ≤ 100.');
}
export function policyState(purposes: PolicyInput[]) {
  purposes.forEach(validatePolicy);
  const active = purposes.filter(p => p.is_active);
  const targetSum = active.reduce((s, p) => s + p.target_percent, 0);
  return { targetSum, complete: active.length > 0 && Math.abs(targetSum - 100) < 1e-7 };
}
export type AssignmentInput = { purpose_id: number; allocation_percent: number; note?: string | null };
export function validateAssignments(rows: AssignmentInput[], purposes: Pick<CapitalPurpose, 'id' | 'is_active'>[]) {
  const seen = new Set<number>();
  for (const r of rows) {
    if (!purposes.some(p => p.id === r.purpose_id && p.is_active) || seen.has(r.purpose_id)) throw new Error('Mục đích phải đang hoạt động và không trùng lặp.');
    if (!Number.isFinite(r.allocation_percent) || r.allocation_percent <= 0 || r.allocation_percent > 100) throw new Error('Tỷ lệ phải lớn hơn 0 và không vượt 100%.');
    if ((r.note?.length ?? 0) > 1000) throw new Error('Ghi chú tối đa 1000 ký tự.');
    seen.add(r.purpose_id);
  }
  if (rows.reduce((s, r) => s + r.allocation_percent, 0) > 100 + 1e-7) throw new Error('Tổng phân loại không được vượt 100%.');
}
export function parseSource(key: string) {
  const m = /^(asset|registry|bank-account|savings-deposit):([1-9]\d*)$/.exec(key);
  if (!m || !Number.isSafeInteger(Number(m[2]))) throw new Error('Nguồn vốn không hợp lệ.');
  return { source_type: m[1], source_id: Number(m[2]) };
}
export const CAPITAL_STATUS = {
  incomplete: 'Chính sách chưa hoàn chỉnh', below_min: 'Dưới tối thiểu', above_max: 'Trên tối đa',
  below_target: 'Trong biên · dưới mục tiêu', above_target: 'Trong biên · trên mục tiêu', in_range: 'Trong biên · đạt mục tiêu',
  inactive: 'Đã lưu trữ',
};
/** Net investable wealth, with liabilities proportionately attributed across positive investable
 * sources for analytics only. No debt payment or economic record mutation. Non-investable sources
 * are explicitly listed as excluded. Non-positive net wealth has no meaningful percentage/score. */
export function computeCapitalAllocation(portfolio: PortfolioSummary, purposes: CapitalPurpose[], assignments: CapitalAllocation[]) {
  const policy = policyState(purposes);
  const denominator = portfolio.investmentNetWorth * portfolio.usdVndRate;
  const positive = portfolio.positions.filter(p => p.includeInInvestmentNetWorth && !p.isLiability && p.valueUsd > 0);
  const gross = positive.reduce((s, p) => s + p.valueUsd * portfolio.usdVndRate, 0);
  const factor = gross > 0 && denominator > 0 ? denominator / gross : 0;
  const bySource = new Map<string, CapitalAllocation[]>();
  for (const a of assignments) { const key = `${a.source_type}:${a.source_id}`; bySource.set(key, [...(bySource.get(key) ?? []), a]); }
  const values = new Map<number, number>();
  let unassigned = 0;
  const sources = positive.map(p => {
    const current = bySource.get(p.id) ?? [];
    const total = current.reduce((sum, r) => sum + r.allocation_percent, 0);
    if (total > 100 + 1e-7 || current.some(r => r.allocation_percent <= 0 || !Number.isFinite(r.allocation_percent) || !purposes.some(x => x.id === r.purpose_id))) throw new Error('Phân loại vốn không nhất quán.');
    const value = p.valueUsd * portfolio.usdVndRate * factor;
    for (const r of current) values.set(r.purpose_id, (values.get(r.purpose_id) ?? 0) + value * r.allocation_percent / 100);
    unassigned += value * Math.max(0, 100 - total) / 100;
    return { key: p.id, name: p.name, assetClass: p.assetClass, grossValue: p.valueUsd * portfolio.usdVndRate, value, assignedPercent: total };
  });
  const rows = purposes.map(p => {
    const currentValue = values.get(p.id) ?? 0;
    const currentPercent = denominator > 0 ? currentValue / denominator * 100 : 0;
    const targetValue = denominator > 0 && p.is_active ? denominator * p.target_percent / 100 : 0;
    const status: keyof typeof CAPITAL_STATUS = !p.is_active ? 'inactive' : !policy.complete || denominator <= 0 ? 'incomplete' : currentPercent < p.min_percent - 1e-7 ? 'below_min' : currentPercent > p.max_percent + 1e-7 ? 'above_max' : currentPercent < p.target_percent - 1e-7 ? 'below_target' : currentPercent > p.target_percent + 1e-7 ? 'above_target' : 'in_range';
    return { ...p, currentValue, currentPercent, targetValue, gapValue: targetValue - currentValue, gapPercent: (p.is_active ? p.target_percent : 0) - currentPercent, status };
  });
  const archivedValue = rows.filter(r => !r.is_active).reduce((s, r) => s + r.currentValue, 0);
  // Score bands, not distance from target; incomplete classification is configuration, not financial risk.
  const scoreReady = policy.complete && denominator > 0 && unassigned < Math.max(1e-6, denominator * 1e-9) && archivedValue === 0;
  const active = rows.filter(r => r.is_active);
  const allocationScore = scoreReady ? Math.round(25 * active.filter(r => !['below_min', 'above_max'].includes(r.status)).length / active.length) : null;
  return { ...policy, denominator, gross, liabilityAdjustment: gross - denominator, sources, rows, unassigned,
    unassignedPercent: denominator > 0 ? unassigned / denominator * 100 : 0, allocationScore,
    excluded: portfolio.positions.filter(p => !p.includeInInvestmentNetWorth), nonPositive: denominator <= 0 };
}
