'use client';
import { useState, useTransition } from 'react';
import type { CapitalPurpose, CapitalAllocation } from '@/db/schema';
import { applyTemplate, updatePurpose, updateAssignments } from '@/app/capital-allocation/actions';
import { type computeCapitalAllocation } from '@/lib/capital-allocation';
import { formatValue, ASSET_CLASS_LABELS } from '@/lib/formatters';
const inputClass = 'bg-zinc-900 border border-zinc-700 rounded p-2 w-full';
export function PolicyEditor({ purposes }: { purposes: CapitalPurpose[] }) {
  const [message, setMessage] = useState(''); const [pending, start] = useTransition();
  return <section id="policy" className="space-y-4"><h2 className="text-xl">Chính sách phân bổ vốn</h2>
    <p className="text-sm text-zinc-400">Tổng mục tiêu đang hoạt động: {purposes.filter(p => p.is_active).reduce((s,p) => s+p.target_percent,0)}%. Lưu từng mục; tổng khác 100% sẽ cảnh báo và tạm ngừng chấm điểm.</p>
    <button disabled={pending} className="border border-zinc-600 rounded p-2" onClick={() => { if (confirm('Khôi phục mẫu chính sách? Không thay đổi tài sản hay phân loại đã lưu. Mục đích tùy chỉnh sẽ được lưu trữ.')) start(async () => { await applyTemplate(); }); }}>Khôi phục mẫu chính sách 10/30/35/10/10/5</button>
    {[...purposes, null].map((p) => <form key={p?.id ?? 'new'} className="border border-zinc-800 rounded-xl p-4 space-y-3" action={form => start(async () => {
      const result = await updatePurpose(p?.id ?? null, { name: String(form.get('name')), description: String(form.get('description')), target_percent: Number(form.get('target')), min_percent: Number(form.get('min')), max_percent: Number(form.get('max')), sort_order: Number(form.get('order')), is_active: form.get('active') === 'on' }); setMessage(result.message);
    })}><h3>{p ? p.name : 'Thêm mục đích tùy chỉnh'}</h3><div className="grid md:grid-cols-3 gap-3">
      <label>Tên<input className={inputClass} name="name" required maxLength={120} defaultValue={p?.name ?? ''}/></label>
      <label>Mô tả<input className={inputClass} name="description" maxLength={1000} defaultValue={p?.description ?? ''}/></label>
      <label>Thứ tự<input className={inputClass} name="order" type="number" step="1" required defaultValue={p?.sort_order ?? purposes.length}/></label>
      {(['target', 'min', 'max'] as const).map((k,i) => <label key={k}>{['Mục tiêu %','Tối thiểu %','Tối đa %'][i]}<input className={inputClass} name={k} type="number" min="0" max="100" step="0.01" required defaultValue={p ? p[`${k}_percent` as 'target_percent'|'min_percent'|'max_percent'] : k==='max'?100:0}/></label>)}
      </div><label className="block"><input name="active" type="checkbox" defaultChecked={p?.is_active ?? true}/> Đang hoạt động (bỏ chọn để lưu trữ, không xóa lịch sử)</label><button disabled={pending} className="bg-indigo-600 rounded px-4 py-2">Lưu mục đích</button></form>)}<p role="status">{message}</p></section>;
}
export function AssignmentEditor({ sources, purposes, assignments, selected }: { sources: ReturnType<typeof computeCapitalAllocation>['sources']; purposes: CapitalPurpose[]; assignments: CapitalAllocation[]; selected?: string }) {
  const [key,setKey]=useState(selected ?? sources[0]?.key ?? ''); const [onlyUnassigned,setOnly]=useState(false); const [message,setMessage]=useState('');const [pending,start]=useTransition();
  const source=sources.find(s=>s.key===key);const relevant=assignments.filter(a=>`${a.source_type}:${a.source_id}`===key);
  return <section id="unassigned" className="space-y-4"><h2 className="text-xl">Phân loại vốn · Chưa phân loại</h2><p className="text-sm text-zinc-400">Chọn nguồn kinh tế gốc. Các nơi lưu ký dùng chung phân loại của tài sản; chuyển lưu ký không tạo phân loại mới.</p>
    <label className="block"><input type="checkbox" checked={onlyUnassigned} onChange={e=>setOnly(e.target.checked)}/> Chỉ hiện vốn chưa phân loại đủ 100%</label>
    <label className="block">Nguồn vốn<select className={inputClass} value={key} onChange={e=>{setKey(e.target.value);setMessage('');}}><option value="">Chọn nguồn</option>{sources.filter(s=>!onlyUnassigned||s.assignedPercent<100).map(s=><option key={s.key} value={s.key}>{s.name} · {ASSET_CLASS_LABELS[s.assetClass]} · {s.assignedPercent}% đã phân loại</option>)}</select></label>
    {!purposes.some(p=>p.is_active) && <p className="text-amber-300">Thiết lập mục đích đang hoạt động ở phần Chính sách bên dưới trước khi phân loại.</p>}
    {!sources.length && <p>Chưa có nguồn vốn dương có thể đầu tư. Thêm tài sản hoặc số dư ở workspace tương ứng trước.</p>}
    {source && <form key={key + JSON.stringify(relevant)} className="space-y-3" action={form=>start(async()=>{
      const rows=purposes.filter(p=>p.is_active).map(p=>({purpose_id:p.id,allocation_percent:Number(form.get(`pct-${p.id}`)),note:String(form.get(`note-${p.id}`)??'')})).filter(r=>r.allocation_percent!==0);
      const result=await updateAssignments(key,rows);setMessage(result.message);
    })}><p>{source.name} · Giá trị gộp {formatValue(source.grossValue,'VND')} · Vốn ròng phân bổ {formatValue(source.value,'VND')}</p>
      {relevant.some(a=>purposes.some(p=>p.id===a.purpose_id&&!p.is_active))&&<p className="text-amber-300">Có phân loại thuộc mục đích đã lưu trữ. Lưu lại sẽ thay thế bằng lựa chọn đang hoạt động bên dưới.</p>}
      {purposes.filter(p=>p.is_active).map(p=><div key={p.id} className="grid md:grid-cols-3 gap-3"><label>{p.name}<input className={inputClass} type="number" min="0" max="100" step="0.01" name={`pct-${p.id}`} defaultValue={relevant.find(a=>a.purpose_id===p.id)?.allocation_percent??0}/></label><label>Ghi chú<input className={inputClass} maxLength={1000} name={`note-${p.id}`} defaultValue={relevant.find(a=>a.purpose_id===p.id)?.note??''}/></label></div>)}
      <p className="text-sm text-zinc-400">Tổng tối đa 100%. Phần còn lại là Chưa phân loại. Đặt tất cả về 0 để bỏ phân loại; không xóa tài sản.</p><button className="bg-indigo-600 rounded px-4 py-2" disabled={pending}>Lưu phân loại</button></form>}<p role="status">{message}</p></section>;
}
