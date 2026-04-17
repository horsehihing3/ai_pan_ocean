import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Partner Pages
import PartnerHome from '../pages/partner/PartnerHome';
import PartnerVisitRequests from '../pages/partner/PartnerVisitRequests';
import PartnerEvaluations from '../pages/partner/PartnerEvaluations';
import PartnerSemiAnnual from '../pages/partner/PartnerSemiAnnual';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminCompanies from '../pages/admin/AdminCompanies';
import AdminVisitRequests from '../pages/admin/AdminVisitRequests';
import AdminEvaluations from '../pages/admin/AdminEvaluations';
import AdminRegistrations from '../pages/admin/AdminRegistrations';
import AdminNotices from '../pages/admin/AdminNotices';
import AdminSemiAnnual from '../pages/admin/AdminSemiAnnual';
import AdminAccidents from '../pages/admin/AdminAccidents';

// Partner Pages (additional)
import PartnerAccidents from '../pages/partner/PartnerAccidents';

// Contract Pages
import ContractEvaluations from '../pages/contract/ContractEvaluations';

// Layout
import AppLayout from '../components/layout/AppLayout';

// [2026-04-17] 역할 기반 라우터 가드 컴포넌트
function RequireAuth({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function RequireGuest({ children }: { children: React.ReactElement }) {
  const { user } = useAuthStore();
  if (user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'CONTRACT_DEPT') return <Navigate to="/contract/evaluations" replace />;
    return <Navigate to="/partner/home" replace />;
  }
  return children;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <RequireGuest><LoginPage /></RequireGuest>,
  },
  {
    path: '/register',
    element: <RequireGuest><RegisterPage /></RequireGuest>,
  },
  {
    path: '/',
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <RoleRedirect /> },
      // Partner
      { path: 'partner/home', element: <RequireAuth roles={['PARTNER']}><PartnerHome /></RequireAuth> },
      { path: 'partner/visit-requests', element: <RequireAuth roles={['PARTNER']}><PartnerVisitRequests /></RequireAuth> },
      { path: 'partner/evaluations', element: <RequireAuth roles={['PARTNER']}><PartnerEvaluations /></RequireAuth> },
      { path: 'partner/semi-annual', element: <RequireAuth roles={['PARTNER']}><PartnerSemiAnnual /></RequireAuth> },
      { path: 'partner/accidents', element: <RequireAuth roles={['PARTNER']}><PartnerAccidents /></RequireAuth> },
      // Admin
      { path: 'admin/dashboard', element: <RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth> },
      { path: 'admin/companies', element: <RequireAuth roles={['ADMIN']}><AdminCompanies /></RequireAuth> },
      { path: 'admin/visit-requests', element: <RequireAuth roles={['ADMIN']}><AdminVisitRequests /></RequireAuth> },
      { path: 'admin/evaluations', element: <RequireAuth roles={['ADMIN']}><AdminEvaluations /></RequireAuth> },
      { path: 'admin/registrations', element: <RequireAuth roles={['ADMIN']}><AdminRegistrations /></RequireAuth> },
      { path: 'admin/notices', element: <RequireAuth roles={['ADMIN']}><AdminNotices /></RequireAuth> },
      { path: 'admin/semi-annual', element: <RequireAuth roles={['ADMIN']}><AdminSemiAnnual /></RequireAuth> },
      { path: 'admin/accidents', element: <RequireAuth roles={['ADMIN']}><AdminAccidents /></RequireAuth> },
      // Contract
      { path: 'contract/evaluations', element: <RequireAuth roles={['CONTRACT_DEPT']}><ContractEvaluations /></RequireAuth> },
    ],
  },
  { path: '/unauthorized', element: <div className="p-8 text-center text-red-500">접근 권한이 없습니다.</div> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

function RoleRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'CONTRACT_DEPT') return <Navigate to="/contract/evaluations" replace />;
  return <Navigate to="/partner/home" replace />;
}

export default router;
