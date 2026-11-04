import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AlertTriangle, Award, BarChart3, Bell, BookOpen, Database, FileText, Landmark, LayoutDashboard, Map, Menu, Moon, Ruler, ScrollText, Search, Sun, User, Users, Wallet, X, type LucideIcon } from 'lucide-react';
import { useAuth, ADMIN_ROLES } from '../auth';
import { api, isDemo, onDemoChange } from '../services/api';
import { TrustStrip } from './ui';
import { useTheme } from '../theme';

// Paths unchanged — only an icon was added to each existing nav item.
const adminNav: [string, string, LucideIcon][] = [
  ['Dashboard', '/admin/dashboard', LayoutDashboard], ['Land Records', '/admin/land-records', Map], ['Mutations', '/admin/mutations', FileText],
  ['Jamabandi', '/admin/jamabandi', BookOpen], ['Revenue', '/admin/revenue', Wallet], ['Surveys', '/admin/surveys', Ruler],
  ['Certificates', '/admin/certificates', Award], ['Complaints', '/admin/complaints', AlertTriangle], ['Users & Employees', '/admin/users', Users],
  ['Masters', '/admin/masters', Database], ['Reports', '/admin/reports', BarChart3], ['Audit Logs', '/admin/audit-logs', ScrollText],
];
const citizenNav: [string, string, LucideIcon][] = [
  ['Dashboard', '/citizen/dashboard', LayoutDashboard], ['My Land', '/citizen/my-land', Map], ['Search Records', '/citizen/search', Search],
  ['Apply Mutation', '/citizen/mutation-apply', FileText], ['Pay Revenue', '/citizen/revenue', Wallet], ['Certificates', '/citizen/certificates', Award],
  ['Surveys', '/citizen/surveys', Ruler], ['Complaints', '/citizen/complaints', AlertTriangle], ['Notifications', '/citizen/notifications', Bell], ['Profile', '/citizen/profile', User],
];
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [demo, setDemo] = useState(isDemo());
  const [notifs, setNotifs] = useState<{ id: string; title: string; body: string }[]>([]);
  useEffect(() => onDemoChange(() => setDemo(isDemo())), []);
  useEffect(() => { api.notifications().then((d: unknown) => { const arr = Array.isArray(d) ? d : (d as { items?: unknown[] }).items || []; setNotifs(arr as never[]); }).catch(() => {}); }, []);
  const items = user && ADMIN_ROLES.includes(user.role) ? adminNav : citizenNav;
  const linkCls = ({ isActive }: { isActive: boolean }) => `relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-soft' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`;
  return (
    <div className="min-h-screen bg-[#f7f9fc] dark:bg-[#070b14]">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-gradient-to-r from-navy-900 via-navy to-navy-700 px-3 text-white shadow-glass sm:h-16 sm:gap-3 sm:px-5">
        <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-white/10 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        <Link to="/" className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-tight sm:gap-2.5 sm:text-base"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft sm:h-9 sm:w-9 sm:rounded-xl"><Landmark size={16} className="text-white" /></span><span className="truncate">LRMS</span><span className="hidden text-xs font-normal text-slate-300 sm:inline">Land Revenue Management · Demo</span></Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button className="flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10" onClick={toggle} aria-label="Toggle dark theme" title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          <div className="relative">
            <button className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 hover:bg-white/10" onClick={() => setShowNotif(!showNotif)} aria-label="Notifications"><Bell size={20} />{notifs.length > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-navy" />}</button>
            {showNotif && (
              <div className="glass-card animate-modal-in absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl p-4 text-slate-800 dark:text-slate-200">
                <p className="mb-2 font-semibold tracking-tight text-navy dark:text-white">Notifications</p>
                {notifs.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">No notifications.</p> : notifs.slice(0, 5).map((n) => <div key={n.id} className="border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-white/10"><p className="font-medium">{n.title}</p><p className="text-slate-500 dark:text-slate-400">{n.body}</p></div>)}
                <Link to="/citizen/notifications" className="mt-2 block text-sm font-medium text-teal-600 transition-colors duration-200 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300" onClick={() => setShowNotif(false)}>View all</Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button className="flex h-11 items-center gap-2 rounded-full p-1 pr-2.5 transition-colors duration-200 hover:bg-white/10" onClick={() => setShowProfile(!showProfile)}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-soft"><User size={18} /></span><span className="hidden text-sm font-medium md:inline">{user?.name}</span></button>
            {showProfile && (
              <div className="glass-card animate-modal-in absolute right-0 mt-2 w-56 rounded-2xl p-2 text-slate-800 dark:text-slate-200">
                <p className="px-3 py-2 text-sm"><span className="font-semibold">{user?.name}</span><br /><span className="text-slate-500 dark:text-slate-400">{user?.email} · {user?.role}</span></p>
                <Link to="/citizen/profile" className="block rounded-xl px-3 py-2 text-sm transition-colors duration-200 hover:bg-teal-50 dark:hover:bg-white/10" onClick={() => setShowProfile(false)}>Profile</Link>
                <button className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => { logout(); nav('/login'); }}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="flex">
        {open && <button aria-label="Close menu" className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
        <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-14 left-0 z-30 w-64 max-w-[85vw] overflow-y-auto bg-gradient-to-b from-navy-900 via-navy to-navy-800 p-3 shadow-glass sm:inset-y-16 lg:static lg:block lg:h-[calc(100vh-4rem)]`}>
          <nav className="space-y-1">{items.map(([label, to, Icon]) => <NavLink key={to} to={to} className={linkCls} onClick={() => setOpen(false)}><Icon size={18} strokeWidth={2.1} className="shrink-0" aria-hidden="true" />{label}</NavLink>)}</nav>
          <p className="mt-6 rounded-xl bg-white/5 px-3 py-3 text-xs leading-relaxed text-slate-400">Demo project inspired by Bihar land administration. Not an official Bihar Government system.</p>
        </aside>
        <main className="animate-page-in min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          {demo && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Demo data — API offline. Showing fictional demo data; connect the backend via VITE_API_URL for live data.</div>}
          {children}
          <footer className="mt-10 border-t border-slate-200 pt-4 dark:border-white/10"><div className="flex justify-center"><TrustStrip /></div><p className="text-center text-xs text-slate-500 dark:text-slate-400">LRMS — independent demo/educational project inspired by Bihar land administration. Not an official Bihar Government system. No real citizen data.</p></footer>
        </main>
      </div>
    </div>
  );
}
