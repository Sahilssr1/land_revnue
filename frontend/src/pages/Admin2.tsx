import { useState } from 'react';
import { api } from '../services/api';
import * as d from '../services/demoData';
import { Badge, Button, Card, ConfirmDialog, DataTable, Field, Input, Modal, Select, useToast, fmtINR } from '../components/ui';

function Page({ title, children }: { title: string; children: React.ReactNode }) { return <div><h1 className="mb-4 text-2xl font-bold text-navy">{title}</h1>{children}</div>; }

export function SurveysAdmin() {
  const toast = useToast(); const [rows, setRows] = useState(d.surveys); const [officer, setOfficer] = useState('Amin — Patna Sadar');
  return (
    <Page title="Land Survey Management">
      <Card><DataTable columns={[
        { key: 'landId', label: 'Land' }, { key: 'khesra', label: 'Khesra' }, { key: 'officer', label: 'Officer' }, { key: 'appointment', label: 'Appointment' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'id', label: 'Actions', render: (r) => <span className="flex gap-2"><Select value={officer} onChange={(e) => setOfficer(e.target.value)} className="max-w-[180px]"><option>Amin — Patna Sadar</option><option>Amin — Gaya Sadar</option><option>Amin — Muzaffarpur East</option></Select><Button onClick={async () => { await api.action(`/api/surveys/${String(r.id)}/assign`, { officer }); setRows((x) => x.map((y) => y.id === r.id ? { ...y, officer, status: 'Assigned' } : y)); toast('Amin assigned', 'success'); }}>Assign Amin</Button><Button variant="secondary" onClick={() => toast('Demo: survey map upload (PDF/JPG/PNG, max 5 MB) would go to the live API.', 'info')}>Upload map</Button></span> },
      ]} rows={rows as never[]} /></Card>
    </Page>
  );
}
export function CertificatesAdmin() {
  const toast = useToast(); const [rows, setRows] = useState(d.certificates); const [confirm, setConfirm] = useState<{ act: string; id: string } | null>(null);
  const act = async (a: string, id: string) => {
    if (a === 'issue') await api.action(`/api/certificates/${id}/issue`, {});
    setRows((r) => r.map((x) => x.id === id ? { ...x, status: a === 'issue' ? 'Approved' : 'Rejected', ref: a === 'issue' ? d.newTracking() : x.ref } : x));
    toast(`Certificate ${a === 'issue' ? 'issued with unique reference number' : 'rejected'}`, 'success'); setConfirm(null);
  };
  return (
    <Page title="Certificate Management (LPC)">
      <Card><DataTable columns={[
        { key: 'type', label: 'Type' }, { key: 'applicant', label: 'Applicant' }, { key: 'landId', label: 'Land' }, { key: 'ref', label: 'Reference' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'id', label: 'Actions', render: (r) => <span className="flex gap-2"><Button variant="secondary" onClick={() => toast('Demo: documents verified against the live API in production.', 'info')}>Verify docs</Button><Button onClick={() => setConfirm({ act: 'issue', id: String(r.id) })}>Approve / Issue</Button><Button variant="danger" onClick={() => setConfirm({ act: 'reject', id: String(r.id) })}>Reject</Button></span> },
      ]} rows={rows as never[]} /></Card>
      <ConfirmDialog open={!!confirm} title={`${confirm?.act === 'issue' ? 'Issue' : 'Reject'} certificate?`} body="Issued certificates carry a unique reference number (LRMS-YYYY-XXXXXX) and become downloadable by the citizen." onCancel={() => setConfirm(null)} onConfirm={() => confirm && act(confirm.act, confirm.id)} />
    </Page>
  );
}
export function ComplaintsAdmin() {
  const toast = useToast(); const [rows, setRows] = useState(d.complaints); const [remark, setRemark] = useState(''); const [selected, setSelected] = useState<typeof d.complaints[number] | null>(null);
  return (
    <Page title="Complaint & Dispute Management">
      <Card className="mb-4 p-4"><h3 className="mb-2 font-bold">Land disputes</h3>{d.disputes.map((x) => <p key={x.id} className="text-sm">{x.caseNo} — {x.parties} · Land {x.landId} · <Badge status={x.status} /></p>)}</Card>
      <Card><DataTable columns={[
        { key: 'subject', label: 'Subject' }, { key: 'citizen', label: 'Citizen' }, { key: 'officer', label: 'Officer' },
        { key: 'status', label: 'Status', render: (r) => <Badge status={String(r.status)} /> },
        { key: 'id', label: 'Actions', render: (r) => <span className="flex gap-2"><Button variant="secondary" onClick={() => setSelected(r as never)}>Remarks</Button><Button onClick={async () => { await api.action('/api/complaints/assign', { id: r.id }); setRows((x) => x.map((y) => y.id === r.id ? { ...y, officer: 'Circle Officer, Patna Sadar', status: 'InProgress' } : y)); toast('Complaint assigned', 'success'); }}>Assign officer</Button></span> },
      ]} rows={rows as never[]} /></Card>
      <Modal open={!!selected} title="Remarks & resolution history" onClose={() => setSelected(null)}>
        {selected && <div className="space-y-3 text-sm">
          <p><b>{selected.subject}</b></p><ul className="list-disc pl-5">{selected.remarks.map((x) => <li key={x}>{x}</li>)}</ul>
          <Field label="Add remark"><Input value={remark} onChange={(e) => setRemark(e.target.value)} /></Field>
          <Button onClick={() => { setRows((x) => x.map((y) => y.id === selected.id ? { ...y, remarks: [...y.remarks, remark || 'Remark added'] } : y)); setRemark(''); toast('Remark saved', 'success'); }}>Save remark</Button>
          <Button variant="secondary" onClick={() => { setRows((x) => x.map((y) => y.id === selected.id ? { ...y, status: 'Resolved' } : y)); toast('Complaint marked resolved', 'success'); setSelected(null); }}>Mark resolved</Button>
        </div>}
      </Modal>
    </Page>
  );
}
export function UsersAdmin() {
  const toast = useToast(); const [rows, setRows] = useState(d.users); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'RevenueEmployee', district: 'Patna' });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Page title="User & Employee Management">
      <Button className="mb-4" onClick={() => setShow(true)}>Create employee account</Button>
      <Card><DataTable columns={[
        { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'district', label: 'District' },
        { key: 'active', label: 'Status', render: (r) => <Badge status={r.active ? 'Approved' : 'Rejected'} /> },
        { key: 'id', label: 'Actions', render: (r) => <Button variant={r.active ? 'danger' : 'primary'} onClick={async () => { await api.action(`/api/admin/users/${String(r.id)}/${r.active ? 'deactivate' : 'activate'}`, {}); setRows((x) => x.map((y) => y.id === r.id ? { ...y, active: !y.active } : y)); toast(`Account ${r.active ? 'deactivated' : 'activated'}`, 'success'); }}>{r.active ? 'Deactivate' : 'Activate'}</Button> },
      ]} rows={rows as never[]} /></Card>
      <p className="mt-3 text-sm text-slate-500">Roles: SuperAdmin, DistrictOfficer, CircleOfficer, RevenueEmployee, Amin, Citizen — enforced server-side via role checks on every endpoint.</p>
      <Modal open={show} title="Create employee account" onClose={() => setShow(false)}>
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); await api.action('/api/admin/users', form); setRows((r) => [...r, { id: `U-${r.length + 1}`, ...form, active: true }]); setShow(false); toast('Employee account created', 'success'); }}>
          <Field label="Name"><Input required value={form.name} onChange={setF('name')} /></Field>
          <Field label="Email"><Input type="email" required value={form.email} onChange={setF('email')} /></Field>
          <Field label="Role"><Select value={form.role} onChange={setF('role')}><option>SuperAdmin</option><option>DistrictOfficer</option><option>CircleOfficer</option><option>RevenueEmployee</option><option>Amin</option><option>Citizen</option></Select></Field>
          <Field label="District"><Select value={form.district} onChange={setF('district')}>{d.districts.map((x) => <option key={x}>{x}</option>)}<option>All</option></Select></Field>
          <Button type="submit">Create account</Button>
        </form>
      </Modal>
    </Page>
  );
}
export function MastersAdmin() {
  return (
    <Page title="Masters — Districts, Circles, Blocks & Villages">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4"><h3 className="mb-2 font-bold">Districts</h3>{d.masters.districts.map((x) => <p key={x} className="border-b py-1 text-sm">{x}</p>)}</Card>
        <Card className="p-4"><h3 className="mb-2 font-bold">Circles</h3>{Object.entries(d.masters.circles).map(([k, v]) => <p key={k} className="border-b py-1 text-sm">{k}: {(v as string[]).join(', ')}</p>)}</Card>
        <Card className="p-4"><h3 className="mb-2 font-bold">Mauzas</h3>{d.masters.mauzas.map((x) => <p key={x} className="border-b py-1 text-sm">{x}</p>)}</Card>
        <Card className="p-4"><h3 className="mb-2 font-bold">Villages</h3>{d.masters.villages.map((x) => <p key={x} className="border-b py-1 text-sm">{x}</p>)}</Card>
      </div>
      <p className="mt-3 text-sm text-slate-500">Master CRUD calls /api/admin/masters on the live API; demo view is read-only seed data.</p>
    </Page>
  );
}
export function ReportsAdmin() {
  const toast = useToast(); const [err, setErr] = useState('');
  const kinds = [['district', 'District-wise report'], ['revenue', 'Circle-wise revenue collection'], ['mutation', 'Mutation pending report'], ['ownership', 'Land ownership report'], ['survey', 'Survey report'], ['employee', 'Employee performance report']];
  const run = async (kind: string, format: 'pdf' | 'xlsx') => {
    setErr('');
    try { await api.exportReport(kind, format); toast(`Export started: ${kind}.${format}`, 'success'); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <Page title="Reports & Analytics">
      {err && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      <div className="grid gap-4 md:grid-cols-2">{kinds.map(([k, label]) => (
        <Card key={k} className="flex items-center justify-between p-4"><p className="font-semibold">{label}</p><span className="flex gap-2"><Button variant="secondary" onClick={() => run(k, 'pdf')}>Export PDF</Button><Button variant="secondary" onClick={() => run(k, 'xlsx')}>Export Excel</Button></span></Card>
      ))}</div>
      <p className="mt-4 text-sm text-slate-500">Exports call /api/reports/&lt;kind&gt;?format=pdf|xlsx. If the API is offline, exports fail gracefully with the message above and no fake file is produced. Total revenue (demo): {fmtINR(d.adminStats.revenueCollected)}.</p>
    </Page>
  );
}
export function AuditLogsAdmin() {
  return (
    <Page title="Audit Logs">
      <Card><DataTable columns={[
        { key: 'user', label: 'User' }, { key: 'action', label: 'Action' }, { key: 'target', label: 'Target' }, { key: 'date', label: 'Date & time' },
      ]} rows={d.auditLogs as never[]} /></Card>
      <p className="mt-3 text-sm text-slate-500">Every admin action is audit-logged server-side in production (AuditLogs table).</p>
    </Page>
  );
}
