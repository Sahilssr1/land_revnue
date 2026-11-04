import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, Database, FileText, IndianRupee, Landmark, Lock, LogIn, Search, ShieldCheck, Users } from 'lucide-react';
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
  // NOTE (screenshot fix, 2026-11-04): the left panel looked washed-out white
  // in the user's screenshot even though the Tailwind gradient classes were
  // present in the built CSS. So the dark background is now ALSO set with an
  // explicit inline gradient + a solid fallback colour, so it can never
  // render as white text on a white panel again.
  const panelStyle = { background: 'linear-gradient(135deg, #040f1e 0%, #0b2447 52%, #0f766e 100%)' } as React.CSSProperties;
  const features = [
    { icon: Search, label: 'Search land records', tile: 'bg-teal-400' },
    { icon: FileText, label: 'Mutation & certificates', tile: 'bg-amber-400' },
    { icon: IndianRupee, label: 'Pay land revenue', tile: 'bg-emerald-400' },
    { icon: Award, label: 'Track every application', tile: 'bg-sky-400' },
  ];
  return (
    <div className="min-h-screen bg-[#eef4f1] lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="flex items-center gap-3 bg-[#0b2447] px-5 py-4 text-white lg:hidden" style={{ background: 'linear-gradient(90deg, #040f1e, #0b2447 60%, #0f766e)' }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft"><Landmark size={19} className="text-white" aria-hidden="true" /></span>
        <div><p className="font-bold tracking-tight text-white">LRMS</p><p className="text-xs text-teal-100">Land records, mutations & revenue — in one place</p></div>
      </div>
      <div className="relative hidden overflow-hidden bg-[#040f1e] p-10 text-white lg:flex lg:flex-col lg:justify-between" style={panelStyle}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal-400/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft ring-1 ring-white/30"><Landmark size={20} className="text-white" aria-hidden="true" /></span><span className="text-xl font-bold tracking-tight text-white">LRMS</span><span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-navy">DEMO</span></div>
          <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight tracking-tight text-white">Land records, mutations, revenue <span className="text-teal-300">&amp; certificates</span> — in one clear workspace.</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-teal-100">Search records, apply for mutation, pay revenue and track certificates from a single dashboard.</p>
          <ul className="mt-6 grid max-w-md grid-cols-2 gap-2">
            {features.map(({ icon: Icon, label, tile }) => (
              <li key={label} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-inset ring-white/20"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${tile} text-navy`}><Icon size={14} aria-hidden="true" /></span>{label}</li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <LandArt className="w-full max-w-md drop-shadow-xl" />
          <div className="mt-8 flex flex-wrap gap-2">
            {chips.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/30"><Icon size={14} className="text-teal-300" aria-hidden="true" />{label}</span>
            ))}
          </div>
          <p className="mt-5 text-xs font-medium text-white/80">Independent demo project — not an official Bihar Government system.</p>
        </div>
      </div>
      <div className="relative flex items-center justify-center overflow-hidden p-4 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-teal-300/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-10 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl" />
        <Card className="animate-modal-in relative w-full max-w-md overflow-hidden p-6 shadow-lift ring-1 ring-teal-100 sm:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal-400 via-navy to-amber-400" />
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
        {/* Explicit inline gradient + white text: the button must never
            render as a dark bar with no visible label (as in the screenshot). */}
        <Button className="w-full py-3 text-base font-bold text-white shadow-lift hover:brightness-110" type="submit" style={{ background: 'linear-gradient(90deg, #0b2447, #0f766e)', color: '#ffffff' }}><LogIn size={18} aria-hidden="true" />Sign in</Button>
      </form>
      <div className="mt-4 rounded-xl bg-gradient-to-br from-teal-50 via-white to-amber-50 p-3.5 text-sm shadow-sm ring-1 ring-inset ring-teal-100">
        <p className="flex items-center gap-1.5 font-semibold text-navy"><Users size={15} className="text-teal-600" aria-hidden="true" />Demo accounts (click to fill):</p>
        <button className="mt-1.5 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-teal-50" onClick={() => fill('admin@lrms.demo')}><span className="font-medium text-teal-800 underline">admin@lrms.demo / Demo@123</span><span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[11px] font-bold text-white">SuperAdmin</span></button>
        <button className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-teal-50" onClick={() => fill('officer@lrms.demo')}><span className="font-medium text-teal-800 underline">officer@lrms.demo / Demo@123</span><span className="shrink-0 rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-bold text-white">CircleOfficer</span></button>
        <button className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-teal-50" onClick={() => fill('citizen@lrms.demo')}><span className="font-medium text-teal-800 underline">citizen@lrms.demo / Demo@123</span><span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">Citizen</span></button>
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
