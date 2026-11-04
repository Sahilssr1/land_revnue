import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Award, Bell, Clock, Download, FileText, LayoutDashboard, Map, Ruler, Search, User, Wallet, type LucideIcon } from 'lucide-react';
import { api, isDemo } from '../services/api';
import * as d from '../services/demoData';
import { Badge, Button, Card, DataTable, Empty, Field, Input, Loading, PageHeader, Select, TrustStrip, useToast, validateFile, fmtINR } from '../components/ui';
import { useAuth } from '../auth';

function useLoad<T>(fn: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { fn().then((r) => setData(r as T)).catch((e) => setError((e as Error).message)).finally(() => setLoading(false)); }, []); // eslint-disable-line
  return { data, loading, error };
}
function Page({ title, icon, subtitle, children }: { title: string; icon?: LucideIcon; subtitle?: string; children: React.ReactNode }) {
  return <div className="animate-page-in"><PageHeader icon={icon} title={title} subtitle={subtitle} />{children}</div>;
}
// Icon is a presentational prop only — label/value come from existing data.
function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-6"><span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-teal-500 to-teal-400" /><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-navy">{value}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-teal-600 text-white shadow-soft transition-transform duration-300 group-hover:scale-105"><Icon size={19} aria-hidden="true" /></span></div></Card>;
}
// Keyword icon for an activity line — text unchanged; only decorates rows
// whose wording already states what happened.
function activityIcon(text: string): LucideIcon {
  if (/submitted/i.test(text)) return FileText;
  if (/due/i.test(text)) return Wallet;
  if (/approved/i.test(text)) return Award;
  return Activity;
}
export function CitizenDashboard() {
  const { data, loading } = useLoad(() => api.citizenStats(), d.citizenStats);
  if (loading) return <Loading />;
  const s = data as typeof d.citizenStats;
  return (
    <Page title="Citizen Dashboard" icon={LayoutDashboard} subtitle="Your land, applications, revenue and certificates at a glance.">
      <TrustStrip />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="My registered land" value={String(s.myLand)} icon={Map} /><Stat label="Total land area (decimals)" value={String(s.totalArea)} icon={Ruler} />
        <Stat label="Mutation applications" value={String(s.mutations)} icon={FileText} /><Stat label="Pending requests" value={String(s.pending)} icon={Clock} />
        <Stat label="Revenue status" value={s.revenueStatus} icon={Wallet} /><Stat label="Certificates" value={String(s.certificates)} icon={Award} />
      </div>
      <Card className="mt-6 p-5 sm:p-6"><h2 className="mb-4 flex items-center gap-2 font-bold tracking-tight text-navy"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100"><Activity size={15} aria-hidden="true" /></span>Recent activity</h2>{s.recent.map((a) => { const Icon = activityIcon(a.text); return <p key={a.id} className="flex items-start gap-2 border-b py-2 text-sm last:border-0"><Icon size={16} className="mt-0.5 shrink-0 text-teal-600" aria-hidden="true" /><span>{a.text} <span className="text-slate-400">· {a.time}</span></span></p>; })}</Card>
    </Page>
  );
}
export function MyLand() {
  const { data, loading } = useLoad(() => api.landRecords(), d.paginate(d.landRecords, 1, 50));
  if (loading) return <Loading />;
  const items = (Array.isArray(data) ? data : (data as { items: typeof d.landRecords }).items || []).filter((l) => l.owner === 'Demo Citizen' || l.id === 'LR-008' || l.id === 'LR-001');
  return (
    <Page title="My Land Records" icon={Map} subtitle="Land registered to your account, with Jamabandi details.">
      {items.length === 0 ? <Empty text="No land records linked to your account in demo data." /> : (
        <div className="grid gap-4 md:grid-cols-2">{items.map((l) => (
          <Card key={l.id} className="p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-6">
            <p className="font-bold">{l.mauza}, {l.village} — {l.district}</p>
            <p className="mt-2 text-sm text-slate-600">Khata {l.khata} · Khesra {l.khesra} · Plot {l.plot} · Circle {l.circle}</p>
            <p className="text-sm">Area: {l.area} decimals · {l.classification} · <Badge status={l.status} /></p>
            <p className="mt-2 text-sm text-slate-500">Jamabandi JB-{l.khata} · Ownership history available on request where legally permitted.</p>
            <Button variant="secondary" className="mt-3" onClick={() => alert('Demo: document download would come from the live API.')}><Download size={16} aria-hidden="true" />Download record document</Button>
          </Card>
        ))}</div>
      )}
    </Page>
  );
}
export function SearchRecords() {
  const [f, setF] = useState({ district: '', circle: '', mauza: '', village: '', khata: '', khesra: '', owner: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const results = useMemo(() => d.landRecords.filter((l) =>
    (!f.district || l.district === f.district) && (!f.circle || l.circle.toLowerCase().includes(f.circle.toLowerCase())) &&
    (!f.mauza || l.mauza.toLowerCase().includes(f.mauza.toLowerCase())) && (!f.village || l.village.toLowerCase().includes(f.village.toLowerCase())) &&
    (!f.khata || l.khata.toLowerCase().includes(f.khata.toLowerCase())) && (!f.khesra || l.khesra.toLowerCase().includes(f.khesra.toLowerCase())) &&
    (!f.owner || l.owner.toLowerCase().includes(f.owner.toLowerCase()))), [f]);
  return (
    <Page title="Search Land Records" icon={Search} subtitle="Search by district, circle, mauza, khata, khesra or owner name.">
      <Card className="mb-4 p-4"><div className="grid gap-3 md:grid-cols-4">
        <Field label="District"><Select value={f.district} onChange={set('district')}><option value="">All</option>{d.districts.map((x) => <option key={x}>{x}</option>)}</Select></Field>
        <Field label="Circle"><Input value={f.circle} onChange={set('circle')} /></Field>
        <Field label="Mauza / Village"><Input value={f.mauza} onChange={set('mauza')} /></Field>
        <Field label="Village"><Input value={f.village} onChange={set('village')} /></Field>
        <Field label="Khata number"><Input value={f.khata} onChange={set('khata')} /></Field>
        <Field label="Khesra number"><Input value={f.khesra} onChange={set('khesra')} /></Field>
        <Field label="Owner name"><Input value={f.owner} onChange={set('owner')} /></Field>
      </div><p className="mt-3 text-xs text-slate-500">Public search shows limited ownership details only; full records require an authenticated, authorised request.</p></Card>
      <Card><DataTable columns={[
        { key: 'district', label: 'District' }, { key: 'circle', label: 'Circle' }, { key: 'mauza', label: 'Mauza' },
        { key: 'khata', label: 'Khata' }, { key: 'khesra', label: 'Khesra' }, { key: 'owner', label: 'Owner' }, { key: 'area', label: 'Area (dec.)' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
      ]} rows={results as never[]} /></Card>
    </Page>
  );
}
export function MutationApply() {
  const toast = useToast();
  const [landId, setLandId] = useState(d.landRecords[0].id); const [seller, setSeller] = useState(''); const [buyer, setBuyer] = useState('');
  const [files, setFiles] = useState<File[]>([]); const [err, setErr] = useState(''); const [tracking, setTracking] = useState('');
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []); for (const f of list) { const v = validateFile(f); if (v) { setErr(v); return; } }
    setFiles(list); setErr('');
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!seller || !buyer) { setErr('Seller and buyer names are required.'); return; }
    await api.action('/api/mutations', { landId, seller, buyer });
    const t = d.newTracking(); setTracking(t); toast(`Mutation submitted — tracking ${t}`, 'success');
  };
  if (tracking) return <Page title="Apply for Mutation" icon={FileText} subtitle="Submit a Dakhil-Kharij application and track its progress."><Card className="p-6 text-center"><p className="text-lg font-bold text-emerald-700">Application submitted!</p><p className="mt-2">Your tracking number: <b>{tracking}</b></p><p className="text-sm text-slate-500">Track it under Complaints/Notifications or re-visit this page after an officer updates it. {isDemo() ? '(Demo — no live submission.)' : ''}</p><Button className="mt-4" onClick={() => setTracking('')}>Submit another</Button></Card></Page>;
  return (
    <Page title="Apply for Mutation (Dakhil-Kharij)" icon={FileText} subtitle="Submit a Dakhil-Kharij application and track its progress.">
      <Card className="max-w-2xl p-4"><form onSubmit={submit} className="space-y-3">
        <Field label="Select land record"><Select value={landId} onChange={(e) => setLandId(e.target.value)}>{d.landRecords.map((l) => <option key={l.id} value={l.id}>{l.khata} / {l.khesra} — {l.mauza}, {l.district}</option>)}</Select></Field>
        <Field label="Seller name"><Input required value={seller} onChange={(e) => setSeller(e.target.value)} /></Field>
        <Field label="Buyer name"><Input required value={buyer} onChange={(e) => setBuyer(e.target.value)} /></Field>
        <Field label="Upload documents (PDF/JPG/PNG, max 5 MB each)"><Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={onFiles} /></Field>
        {files.length > 0 && <ul className="text-sm text-slate-600">{files.map((f) => <li key={f.name}>{f.name} — {(f.size / 1024).toFixed(0)} KB</li>)}</ul>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button type="submit">Submit application</Button>
      </form></Card>
    </Page>
  );
}
export function RevenuePay() {
  const toast = useToast(); const [paid, setPaid] = useState(false); const [paying, setPaying] = useState(false);
  const unpaid = d.payments.filter((p) => p.status === 'Unpaid');
  const pay = async (p: typeof d.payments[number]) => {
    setPaying(true);
    if (isDemo()) { toast('Demo — no real payment. In production this opens Razorpay test checkout and only marks Paid after webhook verification.', 'info'); setPaying(false); return; }
    try { await api.action(`/api/revenue/${p.id}/pay`, {}); toast('Payment initiated — awaiting gateway confirmation. Do not treat as Paid until confirmed.', 'info'); }
    catch (e) { toast((e as Error).message, 'error'); } finally { setPaying(false); }
  };
  return (
    <Page title="Pay Land Revenue (Bhu-Lagan)" icon={Wallet} subtitle="Outstanding revenue, payments and receipts.">
      <div className="mb-4 rounded-lg border border-teal-300 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">Razorpay TEST MODE — no real money. A payment is never marked successful without verified payment confirmation.</div>
      {paid && <Card className="mb-4 p-4 text-emerald-700">Demo receipt noted — in production a receipt appears only after verified confirmation.</Card>}
      <Card><DataTable columns={[
        { key: 'khata', label: 'Khata' }, { key: 'amount', label: 'Amount', render: (r) => fmtINR(Number(r.amount)) },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> }, { key: 'receipt', label: 'Receipt' },
        { key: 'id', label: 'Action', render: (r) => r.status === 'Unpaid' ? <Button disabled={paying} onClick={() => pay(r as never)}>Pay now</Button> : <Button variant="secondary" onClick={() => setPaid(true)}><Download size={16} aria-hidden="true" />Download receipt</Button> },
      ]} rows={d.payments as never[]} /></Card>
      {unpaid.length === 0 && <Empty text="No outstanding revenue." />}
    </Page>
  );
}
export function CertificatesPage() {
  const toast = useToast(); const [type, setType] = useState('LPC'); const [landId, setLandId] = useState(d.landRecords[0].id); const [fileErr, setFileErr] = useState(''); const [submitted, setSubmitted] = useState('');
  const submit = async (e: React.FormEvent) => { e.preventDefault(); await api.action('/api/certificates', { type, landId }); const t = d.newTracking(); setSubmitted(t); toast(`Certificate application submitted — ${t}`, 'success'); };
  return (
    <Page title="Certificate Applications (LPC)" icon={Award} subtitle="Apply for LPC and download approved certificates.">
      <Card className="mb-4 p-4"><form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
        <Field label="Certificate type"><Select value={type} onChange={(e) => setType(e.target.value)}><option>LPC</option></Select></Field>
        <Field label="Land record"><Select value={landId} onChange={(e) => setLandId(e.target.value)}>{d.landRecords.map((l) => <option key={l.id} value={l.id}>{l.khata} / {l.khesra}</option>)}</Select></Field>
        <Field label="Supporting document"><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFileErr(validateFile(f) || ''); }} /></Field>
        <div className="md:col-span-3">{fileErr && <p className="text-sm text-red-600">{fileErr}</p>}<Button type="submit">Apply</Button>{submitted && <span className="ml-3 text-sm text-emerald-700">Submitted: {submitted}</span>}</div>
      </form></Card>
      <Card><DataTable columns={[
        { key: 'type', label: 'Type' }, { key: 'landId', label: 'Land' }, { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> }, { key: 'ref', label: 'Reference' },
        { key: 'id', label: 'Action', render: (r) => r.status === 'Approved' ? <Button variant="secondary" onClick={() => toast('Demo: certificate download would come from the live API.', 'info')}>Download</Button> : <span className="text-slate-400">—</span> },
      ]} rows={d.certificates as never[]} /></Card>
    </Page>
  );
}
export function SurveysPage() {
  const toast = useToast(); const [landId, setLandId] = useState(d.landRecords[0].id); const [done, setDone] = useState(false);
  return (
    <Page title="Land Survey Requests" icon={Ruler} subtitle="Request measurement and track your assigned officer.">
      <Card className="mb-4 p-4"><form className="flex flex-wrap items-end gap-3" onSubmit={async (e) => { e.preventDefault(); await api.action('/api/surveys', { landId }); setDone(true); toast('Survey request submitted', 'success'); }}>
        <Field label="Land record"><Select value={landId} onChange={(e) => setLandId(e.target.value)}>{d.landRecords.map((l) => <option key={l.id} value={l.id}>{l.khata} / {l.khesra} — {l.district}</option>)}</Select></Field>
        <Button type="submit">Request measurement</Button>{done && <span className="text-sm text-emerald-700">Request recorded (demo).</span>}
      </form></Card>
      <Card><DataTable columns={[
        { key: 'landId', label: 'Land' }, { key: 'khesra', label: 'Khesra' }, { key: 'officer', label: 'Assigned officer' }, { key: 'appointment', label: 'Appointment' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
      ]} rows={d.surveys as never[]} /></Card>
    </Page>
  );
}
export function ComplaintsPage() {
  const toast = useToast(); const [subject, setSubject] = useState(''); const [detail, setDetail] = useState(''); const [done, setDone] = useState(false);
  return (
    <Page title="Complaints" icon={AlertTriangle} subtitle="Register a complaint and follow officer remarks.">
      <Card className="mb-4 p-4"><form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if (!subject) return; await api.action('/api/complaints', { subject, detail }); setDone(true); setSubject(''); setDetail(''); toast('Complaint registered', 'success'); }}>
        <Field label="Subject"><Input required value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field label="Details"><Input value={detail} onChange={(e) => setDetail(e.target.value)} /></Field>
        <Field label="Supporting evidence (PDF/JPG/PNG, max 5 MB)"><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const v = validateFile(f); if (v) toast(v, 'error'); } }} /></Field>
        <Button type="submit">Register complaint</Button>{done && <span className="ml-3 text-sm text-emerald-700">Registered (demo).</span>}
      </form></Card>
      <Card><DataTable columns={[
        { key: 'subject', label: 'Subject' }, { key: 'officer', label: 'Officer' }, { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'remarks', label: 'Officer remarks', render: (r) => (r.remarks as string[]).join(' · ') || '—' },
      ]} rows={d.complaints as never[]} /></Card>
    </Page>
  );
}
export function NotificationsPage() {
  const { data, loading } = useLoad(() => api.notifications(), d.notifications);
  if (loading) return <Loading />;
  const items = Array.isArray(data) ? data : [];
  return <Page title="Notifications" icon={Bell} subtitle="Updates on your applications, payments and certificates.">{items.length === 0 ? <Empty /> : <Card className="p-4">{items.map((n: { id: string; title: string; body: string; date?: string }) => <div key={n.id} className="border-b py-3"><p className="font-semibold">{n.title}</p><p className="text-sm text-slate-600">{n.body}</p><p className="text-xs text-slate-400">{n.date || ''}</p></div>)}</Card>}</Page>;
}
export function ProfilePage() {
  const { user } = useAuth(); const toast = useToast();
  const [name, setName] = useState(user?.name || ''); const [mobile, setMobile] = useState('9876543210'); const [address, setAddress] = useState('Patna, Bihar (demo)');
  return (
    <Page title="My Profile" icon={User} subtitle="Your citizen account details.">
      <Card className="max-w-xl p-4"><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast('Profile saved (demo)', 'success'); }}>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Email"><Input value={user?.email || ''} disabled /></Field>
        <Field label="Role"><Input value={user?.role || ''} disabled /></Field>
        <Field label="Mobile"><Input value={mobile} onChange={(e) => setMobile(e.target.value)} /></Field>
        <Field label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
        <Button type="submit">Save profile</Button>
      </form>
      <div className="mt-6 border-t pt-4"><p className="mb-2 font-semibold">Forgot password</p><p className="text-sm text-slate-500">In production, use the emailed reset link. In this demo, contact the administrator.</p></div></Card>
    </Page>
  );
}
