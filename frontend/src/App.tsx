import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth, ADMIN_ROLES } from './auth';
import { ToastProvider } from './components/ui';
import { ThemeProvider } from './theme';
import Layout from './components/Layout';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { CitizenDashboard, MyLand, SearchRecords, MutationApply, RevenuePay, CertificatesPage, SurveysPage, ComplaintsPage, NotificationsPage, ProfilePage } from './pages/Citizen';
import { AdminDashboard, LandRecordsPage, MutationsPage, JamabandiPage, RevenuePage } from './pages/Admin';
import { SurveysAdmin, CertificatesAdmin, ComplaintsAdmin, UsersAdmin, MastersAdmin, ReportsAdmin, AuditLogsAdmin } from './pages/Admin2';

function Shell({ children }: { children: React.ReactNode }) { return <Layout>{children}</Layout>; }
export default function App() {
  return (
    <ThemeProvider><ToastProvider><AuthProvider><BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/citizen/dashboard" element={<RequireAuth roles={['Citizen']}><Shell><CitizenDashboard /></Shell></RequireAuth>} />
        <Route path="/citizen/my-land" element={<RequireAuth roles={['Citizen']}><Shell><MyLand /></Shell></RequireAuth>} />
        <Route path="/citizen/search" element={<RequireAuth roles={['Citizen']}><Shell><SearchRecords /></Shell></RequireAuth>} />
        <Route path="/citizen/mutation-apply" element={<RequireAuth roles={['Citizen']}><Shell><MutationApply /></Shell></RequireAuth>} />
        <Route path="/citizen/revenue" element={<RequireAuth roles={['Citizen']}><Shell><RevenuePay /></Shell></RequireAuth>} />
        <Route path="/citizen/certificates" element={<RequireAuth roles={['Citizen']}><Shell><CertificatesPage /></Shell></RequireAuth>} />
        <Route path="/citizen/surveys" element={<RequireAuth roles={['Citizen']}><Shell><SurveysPage /></Shell></RequireAuth>} />
        <Route path="/citizen/complaints" element={<RequireAuth roles={['Citizen']}><Shell><ComplaintsPage /></Shell></RequireAuth>} />
        <Route path="/citizen/notifications" element={<RequireAuth roles={['Citizen']}><Shell><NotificationsPage /></Shell></RequireAuth>} />
        <Route path="/citizen/profile" element={<RequireAuth><Shell><ProfilePage /></Shell></RequireAuth>} />
        <Route path="/admin/dashboard" element={<RequireAuth roles={ADMIN_ROLES}><Shell><AdminDashboard /></Shell></RequireAuth>} />
        <Route path="/admin/land-records" element={<RequireAuth roles={ADMIN_ROLES}><Shell><LandRecordsPage /></Shell></RequireAuth>} />
        <Route path="/admin/mutations" element={<RequireAuth roles={ADMIN_ROLES}><Shell><MutationsPage /></Shell></RequireAuth>} />
        <Route path="/admin/jamabandi" element={<RequireAuth roles={ADMIN_ROLES}><Shell><JamabandiPage /></Shell></RequireAuth>} />
        <Route path="/admin/revenue" element={<RequireAuth roles={ADMIN_ROLES}><Shell><RevenuePage /></Shell></RequireAuth>} />
        <Route path="/admin/surveys" element={<RequireAuth roles={ADMIN_ROLES}><Shell><SurveysAdmin /></Shell></RequireAuth>} />
        <Route path="/admin/certificates" element={<RequireAuth roles={ADMIN_ROLES}><Shell><CertificatesAdmin /></Shell></RequireAuth>} />
        <Route path="/admin/complaints" element={<RequireAuth roles={ADMIN_ROLES}><Shell><ComplaintsAdmin /></Shell></RequireAuth>} />
        <Route path="/admin/users" element={<RequireAuth roles={['SuperAdmin', 'DistrictOfficer']}><Shell><UsersAdmin /></Shell></RequireAuth>} />
        <Route path="/admin/masters" element={<RequireAuth roles={ADMIN_ROLES}><Shell><MastersAdmin /></Shell></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth roles={ADMIN_ROLES}><Shell><ReportsAdmin /></Shell></RequireAuth>} />
        <Route path="/admin/audit-logs" element={<RequireAuth roles={ADMIN_ROLES}><Shell><AuditLogsAdmin /></Shell></RequireAuth>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter></AuthProvider></ToastProvider></ThemeProvider>
  );
}
