import { db } from '@/db';
import { accountRegistry, assets, bankAccounts, bankSavingsDeposits, bankCreditCards, bankCreditFacilities, capitalPurposes, capitalAllocations } from '@/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { POLICY_TEMPLATE, parseSource, validateAssignments, validatePolicy, computeCapitalAllocation, type AssignmentInput, type PolicyInput } from './capital-allocation';
import { getPortfolioSummary } from './portfolio-aggregation';
import { buildPortfolioSummary } from './portfolio-model';

type Store = typeof db;
export async function getCapitalData(portfolio?: Awaited<ReturnType<typeof getPortfolioSummary>>) {
  const [summary, purposes, assignments] = await Promise.all([portfolio ?? getPortfolioSummary(), db.select().from(capitalPurposes).orderBy(asc(capitalPurposes.sort_order), asc(capitalPurposes.id)), db.select().from(capitalAllocations)]);
  return { portfolio: summary, purposes, assignments, allocation: computeCapitalAllocation(summary, purposes, assignments) };
}
export async function savePurpose(id: number | null, input: PolicyInput & { description: string }, database: Store = db) {
  validatePolicy(input);
  if (input.description.length > 1000) throw new Error('Mô tả tối đa 1000 ký tự.');
  const now = new Date().toISOString();
  if (id) {
    const result = await database.update(capitalPurposes).set({ ...input, updated_at: now }).where(eq(capitalPurposes.id, id)).returning();
    if (!result.length) throw new Error('Không tìm thấy mục đích.');
  } else await database.insert(capitalPurposes).values({ ...input, slug: `custom-${crypto.randomUUID()}`, created_at: now, updated_at: now });
}
export async function resetPolicyTemplate(database: Store = db) {
  await database.transaction(async tx => {
    const now = new Date().toISOString();
    // Archive rather than delete: assignments and IDs survive template reset.
    await tx.update(capitalPurposes).set({ is_active: false, updated_at: now });
    for (const [i, [slug, name, target]] of POLICY_TEMPLATE.entries()) {
      const values = { name, description: 'Mẫu chính sách có thể chỉnh sửa; không phải khuyến nghị đầu tư.', target_percent: target, min_percent: Math.max(0, target - 5), max_percent: target + 5, sort_order: i, is_active: true, updated_at: now };
      await tx.insert(capitalPurposes).values({ ...values, slug, created_at: now }).onConflictDoUpdate({ target: capitalPurposes.slug, set: values });
    }
  });
}
export async function saveCapitalAssignments(key: string, rows: AssignmentInput[], database: Store = db) {
  const source = parseSource(key);
  await database.transaction(async tx => {
    const purposes = await tx.select().from(capitalPurposes);
    validateAssignments(rows, purposes);
    const [legacyAssets, accounts, deposits, creditCards, creditFacilities, registry] = await Promise.all([tx.select().from(assets), tx.select().from(bankAccounts), tx.select().from(bankSavingsDeposits), tx.select().from(bankCreditCards), tx.select().from(bankCreditFacilities), tx.select().from(accountRegistry)]);
    const portfolio = buildPortfolioSummary({ usdVndRate: 1, legacyAssets, accounts, deposits, creditCards, creditFacilities, registry });
    if (!portfolio.positions.some(p => p.id === key && !p.isLiability && p.valueUsd > 0 && p.includeInInvestmentNetWorth)) throw new Error('Nguồn không còn là vốn có thể đầu tư.');
    await tx.delete(capitalAllocations).where(and(eq(capitalAllocations.source_type, source.source_type), eq(capitalAllocations.source_id, source.source_id)));
    const now = new Date().toISOString();
    if (rows.length) await tx.insert(capitalAllocations).values(rows.map(r => ({ ...source, ...r, created_at: now, updated_at: now })));
  });
}
export async function setBrokerArchived(id: number, archived: boolean, database: Store = db) {
  const result = await database.update(accountRegistry).set({ archived_at: archived ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).where(and(eq(accountRegistry.id, id), eq(accountRegistry.type, 'broker_account'))).returning();
  if (!result.length) throw new Error('Không tìm thấy tài khoản môi giới.');
}
export function visibleBrokers<T extends { archived_at: string | null }>(rows: T[], archived = false) { return rows.filter(r => Boolean(r.archived_at) === archived); }
