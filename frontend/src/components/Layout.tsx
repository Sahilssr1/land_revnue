import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Landmark, Menu, User, X } from 'lucide-react';
import { useAuth, ADMIN_ROLES } from '../auth';
import { api, isDemo, onDemoChange } from '../services/api';

const adminNav = [
  ['Dashboard', '/admin/dashboard'], ['Land Records', '/admin/land-records'], ['Mutations', '/admin/mutations'],
  ['Jamabandi', '/admin/jamabandi'], ['Revenue', '/admin/revenue'], ['Surveys', '/admin/surveys'],
  ['Certificates', '/admin/certificates'], ['Complaints', '/admin/complaints'], ['Users & Employees', '/admin/users'],
  ['Masters', '/admin/masters'], ['Reports', '/admin/reports'], ['Audit Logs', '/admin/audit-logs'],
];
const citizenNav = [
  ['Dashboard', '/citizen/dashboard'], ['My Land', '/citizen/my-land'], ['Search Records', '/citizen/search'],
  ['Apply Mutation', '/citizen/mutation-apply'], ['Pay Revenue', '/citizen/revenue'], ['Certificates', '/citizen/certificates'],
  ['Surveys', '/citizen/surveys'], ['Complaints', '/citizen/complaints'], ['Notifications', '/citizen/notifications'], ['Profile', '/citizen/profile'],
];
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [demo, setDemo] = useState(isDemo());
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string }[]>([]);
  useEffect(() => onDemoChange(() => setDemo(isDemo())), []);
  useEffect(() => { api.notifications().then((d: unknown) => { const arr = Array.isArray(d) ? d : (d as { items?: unknown[] }).items || []; setNotifs(arr as never[]); }).catch(() => {}); }, []);
  const items = user && ADMIN_ROLES.includes(user.role) ? adminNav : citizenNav;
  const linkCls = ({ isActive }: { isActive: boolean }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-600 text-white' : 'text-slate-200 hover:bg-navy-700'}`;
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-navy px-4 text-white shadow">
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        <Link to="/" className="flex items-center gap-2 font-bold"><Landmark className="text-teal-500" /> LRMS <span className="hidden text-xs font-normal text-slate-300 sm:inline">Land Revenue Management · Demo</span></Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button className="relative rounded-full p-2 hover:bg-navy-700" onClick={() => setShowNotif(!showNotif)} aria-label="Notifications"><Bell size={20} />{notifs.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}</button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border bg-white p-3 text-slate-800 shadow-xl">
                <p className="mb-2 font-semibold">Notifications</p>
                {notifs.length === 0 ? <p className="text-sm text-slate-500">No notifications.</p> : notifs.slice(0, 5).map((n) => <div key={n.id} className="border-b py-2 text-sm"><p className="font-medium">{n.title}</p><p className="text-slate-500">{n.body}</p></div>)}
                <Link to="/citizen/notifications" className="mt-2 block text-sm text-teal-600" onClick={() => setShowNotif(false)}>View all</Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-navy-700" onClick={() => setShowProfile(!showProfile)}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600"><User size={18} /></span><span className="hidden text-sm md:inline">{user?.name}</span></button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white p-2 text-slate-800 shadow-xl">
                <p className="px-3 py-2 text-sm"><span className="font-semibold">{user?.name}</span><br /><span className="text-slate-500">{user?.email} · {user?.role}</span></p>
                <Link to="/citizen/profile" className="block rounded px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setShowProfile(false)}>Profile</Link>
                <button className="block w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-100" onClick={() => { logout(); nav('/login'); }}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-14 left-0 z-30 w-60 overflow-y-auto bg-navy p-3 lg:static lg:block lg:h-[calc(100vh-3.5rem)]`}>
          <nav className="space-y-1">{items.map(([label, to]) => <NavLink key={to} to={to} className={linkCls} onClick={() => setOpen(false)}>{label}</NavLink>)}</nav>
          <p className="mt-6 px-3 text-xs text-slate-400">Demo project inspired by Bihar land administration. Not an official Bihar Government system.</p>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          {demo && <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">Demo data — API offline. Showing fictional demo data; connect the backend via VITE_API_URL for live data.</div>}
          {children}
          <footer className="mt-8 border-t pt-4 text-center text-xs text-slate-500">LRMS — independent demo/educational project inspired by Bihar land administration. Not an official Bihar Government system. No real citizen data.</footer>
        </main>
      </div>
    </div>
  );
}
