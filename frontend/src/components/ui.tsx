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
          <div key={t.id} className={`animate-toast-in rounded-xl px-4 py-3 text-sm text-white shadow-lift backdrop-blur transition-all duration-200 ${t.kind === 'success' ? 'bg-teal-600/95' : t.kind === 'error' ? 'bg-red-600/95' : 'bg-navy-800/95'}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function Button({ children, variant = 'primary', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const cls = variant === 'primary' ? 'bg-gradient-to-r from-navy to-navy-700 text-white shadow-soft hover:shadow-lift hover:brightness-110 active:scale-[0.98]' : variant === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-soft hover:shadow-lift hover:brightness-110 active:scale-[0.98]' : variant === 'ghost' ? 'text-slate-700 hover:bg-teal-50 hover:text-navy active:scale-[0.98]' : 'bg-white/90 border border-slate-200 text-slate-800 shadow-sm hover:border-teal-300 hover:bg-teal-50/50 hover:text-navy active:scale-[0.98]';
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:active:scale-100 ${cls} ${p.className || ''}`} />;
}
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card rounded-2xl transition-shadow duration-300 ${className}`}>{children}</div>;
}
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-400 ${props.className || ''}`} />; }
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-400 ${props.className || ''}`} />; }
export function Label({ children }: { children: React.ReactNode }) { return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</label>; }
export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div>{/* label spacing handled by Label */}<Label>{label}</Label>{children}</div>; }
export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = { Pending: 'bg-amber-100 text-amber-800 ring-amber-200', UnderReview: 'bg-blue-100 text-blue-800 ring-blue-200', Approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200', Rejected: 'bg-red-100 text-red-800 ring-red-200', Paid: 'bg-emerald-100 text-emerald-800 ring-emerald-200', Unpaid: 'bg-amber-100 text-amber-800 ring-amber-200', Assigned: 'bg-blue-100 text-blue-800 ring-blue-200', Completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200', Resolved: 'bg-emerald-100 text-emerald-800 ring-emerald-200', InProgress: 'bg-violet-100 text-violet-800 ring-violet-200' };
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors duration-200 ${map[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{status}</span>;
}
export function Loading() { return <div className="animate-page-in space-y-3 py-6" aria-label="Loading"><div className="skeleton-bar w-2/3" /><div className="skeleton-bar w-full" /><div className="skeleton-bar w-5/6" /><p className="pt-2 text-center text-sm text-slate-500">Loading…</p></div>; }
export function Empty({ text = 'No records found.' }: { text?: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-500">{text}</div>; }
export function ErrorBox({ msg, retry }: { msg: string; retry?: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{msg} {retry && <button className="ml-2 font-semibold underline transition-colors duration-200 hover:text-red-900" onClick={retry}>Retry</button>}</div>;
}
export function ConfirmDialog({ open, title, body, onConfirm, onCancel }: { open: boolean; title: string; body: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm">
      <div className="glass-card animate-modal-in w-full max-w-sm p-6">
        <h3 className="text-base font-bold tracking-tight text-navy">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm">
      <div className="glass-card animate-modal-in max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between"><h3 className="text-base font-bold tracking-tight text-navy">{title}</h3><button onClick={onClose} aria-label="Close" className="rounded-full px-2.5 py-1 text-xl leading-none text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-navy">×</button></div>
        {children}
      </div>
    </div>
  );
}
export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
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
        <thead className="sticky top-0 z-10"><tr className="border-b border-slate-100 bg-slate-50/90">
          {columns.map((c) => (
            <th key={c.key} className="cursor-pointer whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-200 hover:text-navy" onClick={() => { setSortKey(c.key); setDir(sortKey === c.key ? (dir === 1 ? -1 : 1) : 1); }}>
              {c.label}{sortKey === c.key ? (dir === 1 ? ' ↑' : ' ↓') : ''}
            </th>
          ))}
        </tr></thead>
        <tbody>
          {slice.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 transition-colors duration-200 last:border-0 hover:bg-teal-50/40">
              {columns.map((c) => <td key={c.key} className="px-4 py-3 text-slate-700">{c.render ? c.render(r) : String(r[c.key] ?? '—')}</td>)}
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
