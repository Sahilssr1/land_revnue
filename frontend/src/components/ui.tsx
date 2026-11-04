import React, { createContext, useContext, useState } from 'react';

// Toasts
type Toast = { id: number; msg: string; kind: 'success' | 'error' | 'info' };
const ToastCtx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (msg: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-3 text-sm text-white shadow-lg ${t.kind === 'success' ? 'bg-teal-600' : t.kind === 'error' ? 'bg-red-600' : 'bg-slate-800'}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function Button({ children, variant = 'primary', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const cls = variant === 'primary' ? 'bg-navy text-white hover:bg-navy-700' : variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : variant === 'ghost' ? 'text-slate-700 hover:bg-slate-100' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50';
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${cls} ${p.className || ''}`} />;
}
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none ${props.className || ''}`} />; }
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-teal-600 focus:outline-none ${props.className || ''}`} />; }
export function Label({ children }: { children: React.ReactNode }) { return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{children}</label>; }
export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><Label>{label}</Label>{children}</div>; }
export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = { Pending: 'bg-amber-100 text-amber-800', UnderReview: 'bg-blue-100 text-blue-800', Approved: 'bg-emerald-100 text-emerald-800', Rejected: 'bg-red-100 text-red-800', Paid: 'bg-emerald-100 text-emerald-800', Unpaid: 'bg-amber-100 text-amber-800', Assigned: 'bg-blue-100 text-blue-800', Completed: 'bg-emerald-100 text-emerald-800', Resolved: 'bg-emerald-100 text-emerald-800', InProgress: 'bg-violet-100 text-violet-800' };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-700'}`}>{status}</span>;
}
export function Loading() { return <div className="py-10 text-center text-sm text-slate-500">Loading…</div>; }
export function Empty({ text = 'No records found.' }: { text?: string }) { return <div className="py-10 text-center text-sm text-slate-500">{text}</div>; }
export function ErrorBox({ msg, retry }: { msg: string; retry?: () => void }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{msg} {retry && <button className="ml-2 font-semibold underline" onClick={retry}>Retry</button>}</div>;
}
export function ConfirmDialog({ open, title, body, onConfirm, onCancel }: { open: boolean; title: string; body: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-base font-bold">{title}</h3><button onClick={onClose} className="text-xl leading-none text-slate-500">×</button></div>
        {children}
      </div>
    </div>
  );
}
export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-slate-500">Page {page} of {pages} · {total} records</span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
// Generic sortable + paginated table. Presentation only; data comes from props.
export function DataTable({ columns, rows, pageSize = 10 }: { columns: { key: string; label: string; render?: (r: any) => React.ReactNode }[]; rows: any[]; pageSize?: number }) {
  const [sortKey, setSortKey] = useState<string>('');
  const [dir, setDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const av = String(a[sortKey] ?? ''); const bv = String(b[sortKey] ?? '');
    return av.localeCompare(bv, undefined, { numeric: true }) * dir;
  });
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = sorted.slice((cur - 1) * pageSize, cur * pageSize);
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead><tr className="border-b bg-slate-50">
          {columns.map((c) => (
            <th key={c.key} className="cursor-pointer px-4 py-2 font-semibold text-slate-600" onClick={() => { setSortKey(c.key); setDir(sortKey === c.key ? (dir === 1 ? -1 : 1) : 1); }}>
              {c.label}{sortKey === c.key ? (dir === 1 ? ' ↑' : ' ↓') : ''}
            </th>
          ))}
        </tr></thead>
        <tbody>
          {slice.map((r, i) => (
            <tr key={i} className="border-b hover:bg-slate-50">
              {columns.map((c) => <td key={c.key} className="px-4 py-2">{c.render ? c.render(r) : String(r[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={cur} total={sorted.length} pageSize={pageSize} onPage={setPage} />
    </div>
  );
}
export function validateFile(f: File): string | null {
  const ok = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (!ok.includes(f.type) && !/\.(pdf|jpg|jpeg|png)$/i.test(f.name)) return 'Only PDF, JPG or PNG files are allowed.';
  if (f.size > 5 * 1024 * 1024) return 'File must be 5 MB or smaller.';
  return null;
}
export function fmtINR(n: number) { return '₹' + n.toLocaleString('en-IN'); }
