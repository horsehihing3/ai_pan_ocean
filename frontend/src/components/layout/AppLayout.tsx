import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutApi } from '../../api/auth';

// [2026-04-17] 공통 앱 레이아웃 (사이드바 + 컨텐츠)
const navItems = {
  PARTNER: [
    { to: '/partner/home', label: '홈' },
    { to: '/partner/visit-requests', label: '사업장 출입신청' },
    { to: '/partner/evaluations', label: '안전보건평가' },
    { to: '/partner/semi-annual', label: '반기평가' },
    { to: '/partner/accidents', label: '산업재해 신고' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: '대시보드' },
    { to: '/admin/registrations', label: '가입신청 관리' },
    { to: '/admin/companies', label: '협력업체 관리' },
    { to: '/admin/visit-requests', label: '출입신청 관리' },
    { to: '/admin/evaluations', label: '평가 관리' },
    { to: '/admin/semi-annual', label: '반기평가 관리' },
    { to: '/admin/accidents', label: '산업재해 LIST' },
    { to: '/admin/performance', label: '안전보건실적' },
    { to: '/admin/safety-rules', label: '안전수칙 관리' },
    { to: '/admin/notices', label: '공지사항' },
  ],
  CONTRACT_DEPT: [
    { to: '/contract/evaluations', label: '안전보건평가' },
    { to: '/contract/performance', label: '안전보건실적' },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logoutApi(); } catch {}
    logout();
    navigate('/login');
  };

  const items = user ? navItems[user.role] : [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside className="w-56 bg-blue-900 text-white flex flex-col">
        <div className="p-4 border-b border-blue-800">
          <div className="text-sm font-bold">팬오션</div>
          <div className="text-xs text-blue-300 mt-1">안전보건 포털</div>
        </div>
        <nav className="flex-1 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-blue-700 font-medium' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <div className="text-xs text-blue-300 mb-1">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="text-xs text-blue-400 hover:text-white transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
