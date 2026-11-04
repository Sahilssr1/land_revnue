import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Landmark, Lock, LogIn, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../auth';
import { Button, Card, Field, Input, useToast } from '../components/ui';
import { LandArt } from '../components/illustrations';
import { api } from '../services/api';

// Split auth layout (presentation only — fields, flow and copy unchanged).
// Desktop: gradient illustration panel + sign-in card. Mobile: the panel
// collapses to a compact banner above the card.
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const chips = [
    { icon: ShieldCheck, label: 'Secure sign-in' },
    { icon: Lock, label: 'JWT-protected sessions' },
    { icon: Database, label: 'Role-based access' },
  ];
  return (
    <div className="min-h-screen bg-[#f7f9fc] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="flex items-center gap-3 bg-gradient-to-r from-navy-900 via-navy to-teal-700 px-5 py-4 text-white lg:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft"><Landmark size={19} className="text-white" aria-hidden="true" /></span>
        <div><p className="font-bold tracking-tight">LRMS</p><p className="text-xs text-teal-100">Land records, mutations & revenue — in one place</p></div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy-950 via-navy to-teal-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/20 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft"><Landmark size={20} className="text-white" aria-hidden="true" /></span><span className="text-xl font-bold tracking-tight">LRMS</span></div>
          <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight tracking-tight">Land records, mutations, revenue & certificates — in one clear workspace.</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-teal-100/90">Search records, apply for mutation, pay revenue and track certificates from a single dashboard.</p>
        </div>
        <div className="relative">
          <LandArt className="w-full max-w-md drop-shadow-xl" />
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-white/20"><Icon size={14} className="text-teal-300" aria-hidden="true" />{label}</span>
            ))}
          </div>
          <p className="mt-5 text-xs text-teal-100/70">Independent demo project — not an official Bihar Government system.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-4 sm:p-8">
        <Card className="animate-modal-in w-full max-w-md p-6 shadow-lift sm:p-8">
          <div className="mb-4 flex items-center gap-2.5 text-navy"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft"><Landmark size={19} className="text-white" aria-hidden="true" /></span><h1 className="text-xl font-bold tracking-tight">LRMS</h1></div>
          <p className="mb-4 text-sm text-slate-500">Land Revenue Management System — demo project inspired by Bihar land administration. <b>Not an official Bihar Government system.</b></p>
          <h2 className="mb-4 text-lg font-bold">{title}</h2>
          {children}
        </Card>
      </div>
    </div>
  );
}
export function LoginPage() {
  const { login } = useAuth(); const nav = useNavigate(); const toast = useToast();
  const [email, setEmail] = useState('citizen@lrms.demo'); const [password, setPassword] = useState('Demo@123'); const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    try { await login(email, password); const u = JSON.parse(localStorage.getItem('lrms_user') || '{}'); toast('Signed in successfully', 'success'); nav(u.role === 'Citizen' ? '/citizen/dashboard' : '/admin/dashboard'); }
    catch (er) { setErr((er as Error).message); }
  };
  const fill = (e: string) => { setEmail(e); setPassword('Demo@123'); };
  return (
    <Shell title="Sign in">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Button className="w-full" type="submit"><LogIn size={17} aria-hidden="true" />Sign in</Button>
      </form>
      <div className="mt-4 rounded-xl bg-gradient-to-br from-teal-50 to-white p-3.5 text-sm shadow-sm ring-1 ring-inset ring-teal-100">
        <p className="flex items-center gap-1.5 font-semibold text-navy"><Users size={15} className="text-teal-600" aria-hidden="true" />Demo accounts (click to fill):</p>
        <button className="block text-teal-700 underline" onClick={() => fill('admin@lrms.demo')}>admin@lrms.demo / Demo@123 (SuperAdmin)</button>
        <button className="block text-teal-700 underline" onClick={() => fill('officer@lrms.demo')}>officer@lrms.demo / Demo@123 (CircleOfficer)</button>
        <button className="block text-teal-700 underline" onClick={() => fill('citizen@lrms.demo')}>citizen@lrms.demo / Demo@123 (Citizen)</button>
      </div>
      <p className="mt-3 text-sm text-center"><Link to="/register" className="text-teal-700 underline">Create a citizen account</Link> · <Link to="/login" className="text-teal-700 underline">Forgot password? (demo: contact admin)</Link></p>
    </Shell>
  );
}
export function RegisterPage() {
  const nav = useNavigate(); const toast = useToast();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '', password: '' });
  const [otp, setOtp] = useState(''); const [step, setStep] = useState(1); const [err, setErr] = useState('');
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(form.mobile)) { setErr('Enter a valid 10-digit Indian mobile number.'); return; }
    await api.register(form); setStep(2); toast('Registration received — enter the mock OTP', 'info');
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) { setErr('Enter the 6-digit OTP. In this demo any 6-digit code verifies.'); return; }
    toast('Mobile verified (mock OTP — demo only)', 'success'); nav('/login');
  };
  return (
    <Shell title="Citizen registration">
      {step === 1 ? (
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name"><Input required value={form.name} onChange={set('name')} /></Field>
          <Field label="Mobile number"><Input required value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile" /></Field>
          <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
          <Field label="Address"><Input required value={form.address} onChange={set('address')} /></Field>
          <Field label="Password"><Input type="password" required minLength={8} value={form.password} onChange={set('password')} /></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button className="w-full" type="submit">Register & send OTP</Button>
          <p className="text-center text-sm"><Link to="/login" className="text-teal-700 underline">Back to sign in</Link></p>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-sm text-slate-600">Mock OTP step (demo only — never use in production). Enter any 6-digit code.</p>
          <Field label="OTP (6 digits)"><Input required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" /></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button className="w-full" type="submit">Verify & finish</Button>
        </form>
      )}
    </Shell>
  );
}
