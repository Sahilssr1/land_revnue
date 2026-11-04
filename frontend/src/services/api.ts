// Single API client. Contract: docs/ARCHITECTURE.md. Falls back to demoData when API unreachable.
import * as demo from './demoData';

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
let demoMode = !BASE;
const listeners = new Set<() => void>();
export function isDemo() { return demoMode; }
export function onDemoChange(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }
function setDemo(v: boolean) { if (demoMode !== v) { demoMode = v; listeners.forEach((f) => f()); } }
function getToken() { return localStorage.getItem('lrms_token') || ''; }
function getRefresh() { return localStorage.getItem('lrms_refresh') || ''; }

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: getToken() ? `Bearer ${getToken()}` : '', ...(opts.headers || {}) },
  });
  if (res.status === 401 && getRefresh()) {
    const r = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: getRefresh() }) });
    if (r.ok) {
      const d = await r.json();
      localStorage.setItem('lrms_token', d.accessToken); localStorage.setItem('lrms_refresh', d.refreshToken);
      return req<T>(path, opts);
    }
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); msg = j?.error?.message || msg; } catch { /* keep */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
// Wrap: live call, else demo fallback (labelled in UI via isDemo()).
async function withFallback<T>(live: Promise<T> | (() => Promise<T>), fallback: T): Promise<T> {
  if (!BASE) { setDemo(true); return fallback; }
  try { const r = typeof live === 'function' ? await live() : await live; setDemo(false); return r as T; } catch { setDemo(true); return fallback; }
}
export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };
export const api = {
  login: async (email: string, password: string) => {
    if (!BASE) {
      const u = demo.DEMO_USERS[email.toLowerCase()];
      if (u && password === 'Demo@123') { setDemo(true); return { accessToken: 'demo-token', refreshToken: 'demo-refresh', user: { name: u.name, email, role: u.role } }; }
      throw new Error('Invalid demo credentials. Use a demo account shown on the login page.');
    }
    try { const r = await req<{ accessToken: string; refreshToken: string; user: { name: string; email: string; role: string } }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setDemo(false); return r; }
    catch { const u = demo.DEMO_USERS[email.toLowerCase()]; if (u && password === 'Demo@123') { setDemo(true); return { accessToken: 'demo-token', refreshToken: 'demo-refresh', user: { name: u.name, email, role: u.role } }; } throw new Error('Login failed — API unreachable and credentials do not match a demo account.'); }
  },
  register: async (payload: Record<string, string>) => withFallback(req('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }), { ok: true }),
  adminStats: () => withFallback(req('/api/dashboard/admin-stats'), demo.adminStats),
  citizenStats: () => withFallback(req('/api/dashboard/citizen-stats'), demo.citizenStats),
  revenueMonthly: () => withFallback(req('/api/dashboard/revenue-monthly'), demo.revenueMonthly),
  mutationStats: () => withFallback(req('/api/dashboard/mutation-stats'), demo.mutationStats),
  districtRecords: () => withFallback(req('/api/dashboard/district-records'), demo.districtRecords),
  approvalTrends: () => withFallback(req('/api/dashboard/approval-trends'), demo.approvalTrends),
  landRecords: (q = '') => withFallback(req<Paged<typeof demo.landRecords[number]>>(`/api/land-records${q}`), demo.paginate(demo.landRecords, 1, 50)),
  jamabandi: () => withFallback(req('/api/jamabandi'), demo.jamabandi),
  mutations: () => withFallback(req('/api/mutations'), demo.mutations),
  revenueRates: () => withFallback(req('/api/revenue/rates'), demo.revenueRates),
  payments: () => withFallback(req('/api/revenue'), demo.payments),
  surveys: () => withFallback(req('/api/surveys'), demo.surveys),
  certificates: () => withFallback(req('/api/certificates'), demo.certificates),
  complaints: () => withFallback(req('/api/complaints'), demo.complaints),
  disputes: () => withFallback(req('/api/complaints/disputes'), demo.disputes),
  users: () => withFallback(req('/api/admin/users'), demo.users),
  masters: () => withFallback(req('/api/admin/masters'), demo.masters),
  notifications: () => withFallback(req('/api/notifications'), demo.notifications),
  auditLogs: () => withFallback(req('/api/audit-logs'), demo.auditLogs),
  action: async (path: string, body: Record<string, unknown> = {}) => {
    if (!BASE) { setDemo(true); return { ok: true, demo: true }; }
    try { const r = await req(path, { method: 'POST', body: JSON.stringify(body) }); setDemo(false); return r; } catch { setDemo(true); return { ok: true, demo: true }; }
  },
  exportReport: async (kind: string, format: 'pdf' | 'xlsx') => {
    if (!BASE) throw new Error('Export requires the live API — it is offline, so no file was generated. Connect the backend (VITE_API_URL) and retry.');
    const res = await fetch(`${BASE}/api/reports/${kind}?format=${format}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `lrms-${kind}.${format}`; a.click(); URL.revokeObjectURL(url);
  },
};
