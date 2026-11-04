import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { useAuth } from '../auth';
import { Button, Card, Field, Input, useToast } from '../components/ui';
import { api } from '../services/api';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-4 flex items-center gap-2 text-navy"><Landmark className="text-teal-600" /><h1 className="text-xl font-bold">LRMS</h1></div>
        <p className="mb-4 text-sm text-slate-500">Land Revenue Management System — demo project inspired by Bihar land administration. <b>Not an official Bihar Government system.</b></p>
        <h2 className="mb-4 text-lg font-bold">{title}</h2>
        {children}
      </Card>
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
        <Button className="w-full" type="submit">Sign in</Button>
      </form>
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
        <p className="font-semibold">Demo accounts (click to fill):</p>
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
