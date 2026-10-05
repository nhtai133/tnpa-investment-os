'use server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { isLocalRequest } from '@/lib/local-request';
import { TNPA_ENV } from '@/lib/local-paths';
import { resetPolicyTemplate, saveCapitalAssignments, savePurpose } from '@/lib/capital-store';
import type { AssignmentInput, PolicyInput } from '@/lib/capital-allocation';
function guard() { if (!isLocalRequest(new Headers(headers()), true, TNPA_ENV)) throw new Error('Local same-origin access only.'); }
function refresh() { for (const p of ['/', '/capital-allocation', '/buckets']) revalidatePath(p); }
export async function updatePurpose(id: number | null, input: PolicyInput & { description: string }) {
  guard(); try { await savePurpose(id, input); refresh(); return { ok: true, message: 'Đã lưu chính sách.' }; } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Không thể lưu.' }; }
}
export async function applyTemplate() { guard(); await resetPolicyTemplate(); refresh(); }
export async function updateAssignments(key: string, rows: AssignmentInput[]) {
  guard(); try { await saveCapitalAssignments(key, rows); refresh(); return { ok: true, message: 'Đã lưu phân loại. Giá trị tài sản không thay đổi.' }; } catch (e) { return { ok: false, message: e instanceof Error ? e.message : 'Không thể lưu.' }; }
}
