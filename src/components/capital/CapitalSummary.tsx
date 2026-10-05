import Link from 'next/link';
import { CAPITAL_STATUS, type computeCapitalAllocation } from '@/lib/capital-allocation';
import { formatValue } from '@/lib/formatters';
export function CapitalSummary({ data }: { data: ReturnType<typeof computeCapitalAllocation> }) {
  return <section className="rounded-xl border border-zinc-800 bg-[#131316] p-5 space-y-4">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold">Phân bổ vốn theo mục đích</h2><Link className="text-indigo-400" href="/capital-allocation">Chính sách & phân loại vốn →</Link></div>
    <p className="text-sm text-zinc-400">Lớp tài sản cho biết bạn sở hữu gì. Mục đích vốn cho biết vốn đang làm nhiệm vụ gì. Mục tiêu tài chính (ví dụ nghỉ hưu) là khái niệm riêng.</p>
    <p className="text-sm">Mẫu số: vốn ròng có thể đầu tư · {formatValue(data.denominator, 'VND')}</p>
    <p className="text-xs text-zinc-400">Nợ được phân bổ theo tỷ trọng giá trị dương để trình bày vốn ròng; không thay đổi số dư. Tài sản ngoài phạm vi đầu tư: {data.excluded.length}. Điều chỉnh nợ: {formatValue(data.liabilityAdjustment, 'VND')}.</p>
    {!data.complete && <p role="status" className="text-amber-300">Chính sách chưa hoàn chỉnh: tổng mục tiêu {data.targetSum.toFixed(2)}% (cần 100%). Không tự chuẩn hóa.</p>}
    {data.nonPositive && <p className="text-amber-300">Vốn ròng không dương: chưa tính tỷ lệ hoặc điểm phân bổ.</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Mục đích', 'Hiện tại', 'Mục tiêu', 'Min / Max', 'Chênh lệch pp', 'Giá trị hiện tại', 'Giá trị mục tiêu', 'Thiếu (+) / Dư (−)', 'Trạng thái'].map(x => <th key={x} className="text-left p-2 whitespace-nowrap">{x}</th>)}</tr></thead>
    <tbody>{data.rows.map(r => <tr key={r.id} className="border-t border-zinc-800"><td className="p-2">{r.name}</td><td>{r.currentPercent.toFixed(2)}%</td><td>{r.is_active ? `${r.target_percent}%` : '—'}</td><td>{r.min_percent} / {r.max_percent}%</td><td>{r.gapPercent.toFixed(2)}</td><td>{formatValue(r.currentValue, 'VND')}</td><td>{formatValue(r.targetValue, 'VND')}</td><td>{formatValue(r.gapValue, 'VND')}</td><td className="p-2 text-zinc-400">{CAPITAL_STATUS[r.status]}</td></tr>)}</tbody></table></div>
    <p className="text-amber-200">Chưa phân loại: {formatValue(data.unassigned, 'VND')} · {data.unassignedPercent.toFixed(2)}%</p>
    {data.allocationScore === null ? <p className="text-sm text-zinc-400">Chưa chấm điểm: hoàn chỉnh chính sách và phân loại vốn trước. Đây là mức độ cấu hình, không phải đánh giá rủi ro tài chính.</p> : <p>Điểm trong biên chính sách: {data.allocationScore}/25. Sai lệch mục tiêu trong biên không bị phạt.</p>}
    <p className="text-xs text-zinc-500">Chỉ đối chiếu chính sách do bạn thiết lập; không đề xuất mua/bán tài sản.</p>
  </section>;
}
