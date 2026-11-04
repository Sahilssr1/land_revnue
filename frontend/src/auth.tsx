import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from './services/api';

export type User = { name: string; email: string; role: string };
type Ctx = { user: User | null; login: (e: string, p: string) => Promise<void>; logout: () => void };
const C = createContext<Ctx>({ user: null, login: async () => {}, logout: () => {} });
export const useAuth = () => useContext(C);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('lrms_user') || 'null'); } catch { return null; } });
  const login = async (email: string, password: string) => {
    const r = await api.login(email, password);
    localStorage.setItem('lrms_token', r.accessToken); localStorage.setItem('lrms_refresh', r.refreshToken); localStorage.setItem('lrms_user', JSON.stringify(r.user));
    setUser(r.user);
  };
  const logout = () => { localStorage.removeItem('lrms_token'); localStorage.removeItem('lrms_refresh'); localStorage.removeItem('lrms_user'); setUser(null); };
  useEffect(() => { const h = () => setUser((u) => u); window.addEventListener('storage', h); return () => window.removeEventListener('storage', h); }, []);
  return <C.Provider value={{ user, login, logout }}>{children}</C.Provider>;
}
const ADMIN_ROLES = ['SuperAdmin', 'DistrictOfficer', 'CircleOfficer', 'RevenueEmployee', 'Amin'];
export function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'Citizen' ? '/citizen/dashboard' : '/admin/dashboard'} replace />;
  return <>{children}</>;
}
export { ADMIN_ROLES };
