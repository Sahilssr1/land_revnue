import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import * as d from '../services/demoData';
import { Badge, Button, Card, ConfirmDialog, DataTable, Field, Input, Loading, Modal, Select, useToast, fmtINR } from '../components/ui';
import MapView from '../components/MapView';

function Page({ title, children }: { title: string; children: React.ReactNode }) { return <div className="animate-page-in"><h1 className="mb-6 text-2xl font-bold tracking-tight text-navy md:text-[1.75rem]">{title}</h1>{children}</div>; }
function Stat({ label, value }: { label: string; value: string }) { return <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"><span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-teal-500 to-teal-400" /><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold tracking-tight text-navy">{value}</p></Card>; }
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="p-5"><h3 className="mb-4 font-bold tracking-tight text-navy">{title}</h3><div className="h-64">{children}</div></Card>; }
const COLORS = ['#F59E0B', '#3B82F6', '#0D9488', '#EF4444'];

export function AdminDashboard() {
  const [stats, setStats] = useState(d.adminStats); const [rev, setRev] = useState(d.revenueMonthly); const [mut, setMut] = useState(d.mutationStats);
  const [dist, setDist] = useState(d.districtRecords); const [trend, setTrend] = useState(d.approvalTrends); const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.adminStats(), api.revenueMonthly(), api.mutationStats(), api.districtRecords(), api.approvalTrends()])
      .then(([s, r, m, di, t]) => { setStats(s as typeof d.adminStats); setRev(r as never); setMut(m as never); setDist(di as never); setTrend(t as never); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  return (
    <Page title="Admin Dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Total registered citizens" value={stats.totalCitizens.toLocaleString()} />
        <Stat label="Total land records" value={stats.totalLandRecords.toLocaleString()} />
        <Stat label="Total mutation applications" value={stats.totalMutations.toLocaleString()} />
        <Stat label="Pending applications" value={String(stats.pending)} />
        <Stat label="Approved applications" value={String(stats.approved)} />
        <Stat label="Rejected applications" value={String(stats.rejected)} />
        <Stat label="Total revenue collected" value={fmtINR(stats.revenueCollected)} />
        <Stat label="Pending revenue payments" value={fmtINR(stats.pendingRevenue)} />
        <Stat label="Active land disputes" value={String(stats.activeDisputes)} />
        <Stat label="Recent activities" value={`${stats.recentActivities.length} items`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Revenue Collection"><ResponsiveContainer width="100%" height="100%"><BarChart data={rev}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v) => fmtINR(Number(v))} /><Bar dataKey="amount" fill="#0D9488" /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Mutation Application Statistics"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={mut} dataKey="value" nameKey="name" outerRadius={90} label>{mut.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></ChartCard>
        <ChartCard title="District-wise Land Records"><ResponsiveContainer width="100%" height="100%"><BarChart data={dist}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="district" /><YAxis /><Tooltip /><Bar dataKey="records" fill="#0B2447" /></BarChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Application Approval Trends"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="approved" stroke="#0D9488" /><Line type="monotone" dataKey="rejected" stroke="#EF4444" /></LineChart></ResponsiveContainer></ChartCard>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h3 className="mb-4 font-bold tracking-tight text-navy">Recent activities</h3>{stats.recentActivities.map((a) => <p key={a.id} className="border-b py-2 text-sm">{a.text} <span className="text-slate-400">· {a.time}</span></p>)}</Card>
        <Card className="p-5"><h3 className="mb-4 font-bold tracking-tight text-navy">Land locations (demo, Patna region)</h3><MapView points={d.landRecords.map((l) => ({ lat: l.lat, lng: l.lng, label: `${l.khata} / ${l.khesra} — ${l.owner}` }))} /></Card>
      </div>
    </Page>
  );
}

export function LandRecordsPage() {
  const toast = useToast();
  const [rows, setRows] = useState(d.landRecords); const [search, setSearch] = useState(''); const [district, setDistrict] = useState('');
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<typeof d.landRecords[number] | null>(null);
  const [history, setHistory] = useState<typeof d.landRecords[number] | null>(null); const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [form, setForm] = useState({ district: 'Patna', circle: '', mauza: '', village: '', khata: '', khesra: '', plot: '', owner: '', area: '', classification: 'Agricultural' });
  const filtered = useMemo(() => rows.filter((l) => (!district || l.district === district) && (!search || [l.owner, l.khata, l.khesra, l.mauza, l.village].join(' ').toLowerCase().includes(search.toLowerCase()))), [rows, search, district]);
  const openNew = () => { setEditing(null); setForm({ district: 'Patna', circle: '', mauza: '', village: '', khata: '', khesra: '', plot: '', owner: '', area: '', classification: 'Agricultural' }); setShowForm(true); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.khata || !form.khesra || !form.owner) { toast('Khata, Khesra and owner are required.', 'error'); return; }
    await api.action('/api/land-records', form);
    if (editing) setRows((r) => r.map((x) => x.id === editing.id ? { ...x, ...form, area: Number(form.area) || x.area } : x));
    else setRows((r) => [{ id: `LR-${100 + r.length}`, ...form, area: Number(form.area) || 0, status: 'Pending', lat: 25.5941, lng: 85.1376 }, ...r]);
    setShowForm(false); toast(editing ? 'Land record updated' : 'Land record created', 'success');
  };
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Page title="Land Records Management">
      <Card className="mb-4 flex flex-wrap gap-3 p-4">
        <Input placeholder="Search owner / khata / khesra / mauza…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={district} onChange={(e) => setDistrict(e.target.value)} className="max-w-[200px]"><option value="">All districts</option>{d.districts.map((x) => <option key={x}>{x}</option>)}</Select>
        <Button onClick={openNew}>Add land record</Button>
      </Card>
      <Card><DataTable columns={[
        { key: 'district', label: 'District' }, { key: 'circle', label: 'Circle' }, { key: 'mauza', label: 'Mauza' }, { key: 'khata', label: 'Khata' }, { key: 'khesra', label: 'Khesra' }, { key: 'owner', label: 'Owner' }, { key: 'area', label: 'Area' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'id', label: 'Actions', render: (r) => <span className="flex gap-2"><Button variant="secondary" onClick={() => { setEditing(r as never); setForm({ district: String(r.district), circle: String(r.circle), mauza: String(r.mauza), village: String(r.village), khata: String(r.khata), khesra: String(r.khesra), plot: String(r.plot), owner: String(r.owner), area: String(r.area), classification: String(r.classification) }); setShowForm(true); }}>Edit</Button><Button variant="secondary" onClick={() => setHistory(r as never)}>History</Button><Button variant="danger" onClick={() => setConfirmDel(String(r.id))}>Delete</Button></span> },
      ]} rows={filtered as never[]} /></Card>
      <Modal open={showForm} title={editing ? 'Edit land record' : 'Add land record'} onClose={() => setShowForm(false)}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-2">
          <Field label="District"><Select value={form.district} onChange={setF('district')}>{d.districts.map((x) => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Circle"><Input value={form.circle} onChange={setF('circle')} /></Field>
          <Field label="Mauza"><Input value={form.mauza} onChange={setF('mauza')} /></Field>
          <Field label="Village"><Input value={form.village} onChange={setF('village')} /></Field>
          <Field label="Khata number"><Input required value={form.khata} onChange={setF('khata')} /></Field>
          <Field label="Khesra number"><Input required value={form.khesra} onChange={setF('khesra')} /></Field>
          <Field label="Plot number"><Input value={form.plot} onChange={setF('plot')} /></Field>
          <Field label="Owner"><Input required value={form.owner} onChange={setF('owner')} /></Field>
          <Field label="Area (decimals)"><Input type="number" step="0.01" value={form.area} onChange={setF('area')} /></Field>
          <Field label="Classification"><Select value={form.classification} onChange={setF('classification')}><option>Agricultural</option><option>Residential</option><option>Commercial</option><option>Homestead</option><option>Other</option></Select></Field>
          <div className="md:col-span-2"><Button type="submit">Save record</Button></div>
        </form>
      </Modal>
      <Modal open={!!history} title="Land history & documents" onClose={() => setHistory(null)}>
        {history && <div className="space-y-2 text-sm">
          <p><b>{history.khata} / {history.khesra}</b> — {history.mauza}, {history.district}</p>
          <p>Ownership history (demo): Previous owner — Fictional Previous Owner (transferred 2024) → Current owner — {history.owner} (2024–present).</p>
          <p>Documents: Sale Deed (PDF), Jamabandi extract (PDF), ID proof (JPG) — demo list; downloads come from the live API in production.</p>
        </div>}
      </Modal>
      <ConfirmDialog open={!!confirmDel} title="Delete land record?" body="This deletes the record in this demo view. In production this is audited and reversible only via admin restore." onCancel={() => setConfirmDel(null)} onConfirm={async () => { await api.action('/api/land-records/delete', { id: confirmDel }); setRows((r) => r.filter((x) => x.id !== confirmDel)); setConfirmDel(null); toast('Land record deleted', 'success'); }} />
    </Page>
  );
}

export function MutationsPage() {
  const toast = useToast(); const [rows, setRows] = useState(d.mutations); const [filter, setFilter] = useState(''); const [selected, setSelected] = useState<typeof d.mutations[number] | null>(null); const [confirm, setConfirm] = useState<{ act: string; id: string } | null>(null);
  const doAction = async (act: string, id: string) => {
    const map: Record<string, string> = { approve: 'approve', reject: 'reject', 'request-documents': 'request-documents', assign: 'assign' };
    await api.action(`/api/mutations/${id}/${map[act]}`, { assignedTo: 'Revenue Employee — Patna Sadar' });
    setRows((r) => r.map((x) => x.id === id ? { ...x, status: act === 'approve' ? 'Approved' : act === 'reject' ? 'Rejected' : act === 'request-documents' ? 'UnderReview' : x.status, assignedTo: act === 'assign' ? 'Revenue Employee — Patna Sadar' : x.assignedTo, audit: [...x.audit, `${act} at ${new Date().toISOString().slice(0, 10)}`] } : x));
    toast(`Mutation ${act} recorded (audit trail updated)`, 'success'); setConfirm(null);
  };
  const filtered = rows.filter((r) => !filter || r.status === filter);
  return (
    <Page title="Mutation Management (Dakhil-Kharij)">
      <Card className="mb-4 flex gap-3 p-4"><Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[220px]"><option value="">All statuses</option><option>Pending</option><option>UnderReview</option><option>Approved</option><option>Rejected</option></Select></Card>
      <Card><DataTable columns={[
        { key: 'tracking', label: 'Tracking' }, { key: 'seller', label: 'Seller' }, { key: 'buyer', label: 'Buyer' }, { key: 'district', label: 'District' }, { key: 'assignedTo', label: 'Assigned to' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'id', label: 'Actions', render: (r) => <span className="flex flex-wrap gap-1"><Button variant="secondary" onClick={() => setSelected(r as never)}>View / Verify</Button><Button variant="secondary" onClick={() => doAction('assign', String(r.id))}>Assign</Button><Button onClick={() => setConfirm({ act: 'approve', id: String(r.id) })}>Approve</Button><Button variant="danger" onClick={() => setConfirm({ act: 'reject', id: String(r.id) })}>Reject</Button></span> },
      ]} rows={filtered as never[]} /></Card>
      <Modal open={!!selected} title="Verify documents & audit trail" onClose={() => setSelected(null)}>
        {selected && <div className="space-y-3 text-sm">
          <p><b>{selected.tracking}</b> — {selected.seller} → {selected.buyer} · Land {selected.landId}</p>
          <p className="font-semibold">Documents:</p><ul className="list-disc pl-5">{selected.docs.map((x) => <li key={x}>{x} <Button variant="secondary" onClick={() => toast('Demo: document preview would open from the live API.', 'info')}>View</Button></li>)}</ul>
          <p className="font-semibold">Audit trail:</p><ul className="list-disc pl-5">{selected.audit.map((x) => <li key={x}>{x}</li>)}</ul>
          <Button variant="secondary" onClick={() => { doAction('request-documents', selected.id); setSelected(null); }}>Request additional documents</Button>
        </div>}
      </Modal>
      <ConfirmDialog open={!!confirm} title={`${confirm?.act === 'approve' ? 'Approve' : 'Reject'} mutation?`} body="In production, approval runs in a DB transaction updating the land record owner, Jamabandi, ownership history and audit log atomically." onCancel={() => setConfirm(null)} onConfirm={() => confirm && doAction(confirm.act, confirm.id)} />
    </Page>
  );
}

export function JamabandiPage() {
  const [rows, setRows] = useState(d.jamabandi); const [search, setSearch] = useState('');
  const filtered = rows.filter((r) => !search || [r.khata, r.owner, r.mauza].join(' ').toLowerCase().includes(search.toLowerCase()));
  return (
    <Page title="Jamabandi Management">
      <Card className="mb-4 flex gap-3 p-4"><Input placeholder="Search khata / owner / mauza…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" /><Button variant="secondary" onClick={() => alert('Jamabandi report export calls /api/reports/ownership — requires the live API.')}>Generate report</Button></Card>
      <Card><DataTable columns={[
        { key: 'jamabandiNo', label: 'Jamabandi No.' }, { key: 'khata', label: 'Khata' }, { key: 'khesra', label: 'Khesra' }, { key: 'owner', label: 'Owner' }, { key: 'area', label: 'Area' }, { key: 'year', label: 'Year' },
        { key: 'id', label: 'Actions', render: (r) => <Button variant="secondary" onClick={() => setRows((x) => x.map((y) => y.id === r.id ? { ...y, remarks: 'Updated following authorised mutation (demo)' } : y))}>Update after mutation</Button> },
      ]} rows={filtered as never[]} /></Card>
      <p className="mt-3 text-sm text-slate-500">Historical Jamabandi versions are retained on every authorised mutation in production (LandOwnershipHistory + JamabandiRecords).</p>
    </Page>
  );
}

export function RevenuePage() {
  const toast = useToast(); const [rates, setRates] = useState(d.revenueRates);
  const saveRate = async (id: string, rate: number) => { await api.action('/api/revenue/rates', { id, rate }); setRates((r) => r.map((x) => x.id === id ? { ...x, rate } : x)); toast('Revenue rate updated', 'success'); };
  return (
    <Page title="Revenue / Bhu-Lagan Management">
      <Card className="mb-4 p-4"><h3 className="mb-3 font-bold">Revenue rates (per decimal / year)</h3><div className="grid gap-3 md:grid-cols-4">{rates.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-100 bg-white/70 p-3.5 shadow-sm transition-all duration-200 hover:shadow-soft"><p className="font-semibold">{r.classification}</p><p className="text-sm text-slate-500">{r.unit}</p>
          <div className="mt-2 flex gap-2"><Input type="number" defaultValue={r.rate} id={`rate-${r.id}`} /><Button variant="secondary" onClick={() => { const el = document.getElementById(`rate-${r.id}`) as HTMLInputElement; saveRate(r.id, Number(el.value)); }}>Save</Button></div></div>
      ))}</div></Card>
      <Card><h3 className="p-4 font-bold">Payment records & transaction history</h3><DataTable columns={[
        { key: 'khata', label: 'Khata' }, { key: 'amount', label: 'Amount', render: (r) => fmtINR(Number(r.amount)) }, { key: 'date', label: 'Date' }, { key: 'receipt', label: 'Receipt' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'id', label: 'Action', render: (r) => <Button variant="secondary" onClick={() => toast(`Receipt ${String(r.receipt)} — download comes from /api/revenue/${String(r.id)}/receipt on the live API.`, 'info')}>Receipt</Button> },
      ]} rows={d.payments as never[]} /></Card>
    </Page>
  );
}
