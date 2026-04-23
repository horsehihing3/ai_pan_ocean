import { useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { logoutApi } from '../../api/auth';

// [2026-04-21] PPT 포털 구성안(2/3, 3/3) 기반 상단 드롭다운 메뉴

type SubItem = {
  label: string;
  to: string | null; // null = 개발 준비중
};

type NavItemDef = {
  label: string;
  to?: string | null;
  children?: SubItem[];
};

// ─── PPT 슬라이드 4 (관리자 모드) ───────────────────────────────────────────
const ADMIN_NAV: NavItemDef[] = [
  {
    label: '소개',
    children: [
      { label: '안전보건경영방침', to: '/intro/safety-policy' },
      { label: '안전보건 목표', to: '/intro/safety-goals' },
      { label: '안전보건 인증 (ISO 45001)', to: '/intro/certification' },
    ],
  },
  {
    label: '사업장(선박) 안전보건',
    children: [
      { label: '사업장(선박) 출입절차', to: null },
      { label: '사업장(선박) 출입신청', to: null },
      { label: '반기평가', to: '/admin/semi-annual' },
      { label: '근로자 의견조회', to: '/admin/opinions' },
    ],
  },
  {
    label: '협력업체 안전보건',
    children: [
      { label: '협력업체 안전보건절차', to: null },
      { label: '업체평가 및 반기평가', to: null },
    ],
  },
  {
    label: '공지사항',
    children: [
      { label: '공지사항', to: '/admin/notices' },
      { label: '양식함', to: null },
    ],
  },
  {
    label: '관리자',
    children: [
      { label: '대시보드', to: '/admin/dashboard' },
      { label: '가입신청 LIST & 업체 관리', to: '/admin/registrations' },
      { label: '협력업체 관리', to: '/admin/companies' },
      { label: '사업장 출입신청 허가', to: '/admin/visit-requests' },
      { label: '협력업체 안전보건평가 검토', to: '/admin/evaluations' },
      { label: '협력업체 안전보건평가 항목관리', to: null },
      { label: '안전수칙 등록', to: '/admin/safety-rules' },
      { label: '협력업체 산업재해 발생 LIST', to: '/admin/accidents' },
      { label: '안전보건실적', to: '/admin/performance' },
      { label: '보건파트', to: '/admin/health' },
      { label: '정보수집', to: null },
    ],
  },
];

// ─── PPT 슬라이드 5 (협력업체 모드) ─────────────────────────────────────────
const PARTNER_NAV: NavItemDef[] = [
  { label: '초기화면', to: '/partner/home' },
  {
    label: '소개',
    children: [
      { label: '안전보건경영방침', to: '/intro/safety-policy' },
      { label: '안전보건 목표', to: '/intro/safety-goals' },
      { label: '안전보건 인증 (ISO 45001)', to: '/intro/certification' },
    ],
  },
  {
    label: '사업장(선박) 안전보건',
    children: [
      { label: '사업장(선박) 출입절차', to: null },
      { label: '사업장(선박) 출입신청', to: '/partner/visit-requests' },
      { label: '반기평가', to: '/partner/semi-annual' },
      { label: '근로자 의견조회', to: '/partner/opinions' },
      { label: '산업재해 신고', to: '/partner/accidents' },
    ],
  },
  {
    label: '협력업체 안전보건',
    children: [
      { label: '협력업체 안전보건절차', to: null },
      { label: '업체평가 및 반기평가', to: '/partner/evaluations' },
    ],
  },
  {
    label: '공지사항',
    children: [
      { label: '공지사항', to: null },
      { label: '양식함', to: null },
    ],
  },
];

// ─── PPT 슬라이드 5 (계약부서 모드) ─────────────────────────────────────────
const CONTRACT_NAV: NavItemDef[] = [
  { label: '초기화면', to: '/contract/evaluations' },
  {
    label: '소개',
    children: [
      { label: '안전보건경영방침', to: '/intro/safety-policy' },
      { label: '안전보건 목표', to: '/intro/safety-goals' },
      { label: '안전보건 인증 (ISO 45001)', to: '/intro/certification' },
    ],
  },
  {
    label: '사업장(선박) 안전보건',
    children: [
      { label: '사업장(선박) 출입절차', to: null },
      { label: '사업장(선박) 출입신청', to: null },
      { label: '반기평가', to: null },
      { label: '근로자 의견조회', to: null },
    ],
  },
  {
    label: '협력업체 안전보건',
    children: [
      { label: '협력업체 안전보건절차', to: null },
      { label: '업체평가 및 반기평가', to: '/contract/evaluations' },
      { label: '안전보건실적', to: '/contract/performance' },
    ],
  },
  {
    label: '공지사항',
    children: [
      { label: '공지사항', to: null },
      { label: '양식함', to: null },
    ],
  },
];

const navConfig: Record<string, NavItemDef[]> = {
  ADMIN: ADMIN_NAV,
  PARTNER: PARTNER_NAV,
  CONTRACT_DEPT: CONTRACT_NAV,
};

// ─── 토스트 ───────────────────────────────────────────────────────────────────
function Toast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
      <span>개발 준비중입니다.</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white leading-none">✕</button>
    </div>
  );
}

// ─── 드롭다운 메뉴 아이템 ────────────────────────────────────────────────────
function DropdownMenu({
  item,
  onToast,
}: {
  item: NavItemDef;
  onToast: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startClose = () => {
    timer.current = setTimeout(() => setOpen(false), 150);
  };
  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const handleTopClick = () => {
    if (item.children) {
      setOpen((v) => !v);
    } else if (item.to) {
      navigate(item.to);
    } else {
      onToast();
    }
  };

  const handleSubClick = (to: string | null) => {
    setOpen(false);
    if (to) navigate(to);
    else onToast();
  };

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => { cancelClose(); if (item.children) setOpen(true); }}
      onMouseLeave={startClose}
    >
      <button
        onClick={handleTopClick}
        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 rounded transition-colors"
      >
        {item.label}
        {item.children && (
          <svg
            className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {item.children && open && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 min-w-52 z-40"
          onMouseEnter={cancelClose}
          onMouseLeave={startClose}
        >
          {item.children.map((sub) => (
            <button
              key={sub.label}
              onClick={() => handleSubClick(sub.to)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between gap-2
                ${sub.to
                  ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  : 'text-gray-400 hover:bg-gray-50'
                }`}
            >
              <span>{sub.label}</span>
              {!sub.to && (
                <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">준비중</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 앱 레이아웃 ─────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = async () => {
    try { await logoutApi(); } catch {}
    logout();
    navigate('/login');
  };

  const handleToast = () => {
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 2500);
  };

  const items = user ? (navConfig[user.role] ?? []) : [];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showToast && <Toast onClose={() => setShowToast(false)} />}

      {/* 상단 네비게이션 바 */}
      <header className="bg-blue-900 text-white h-14 flex items-center px-4 shrink-0 shadow-md z-30">
        {/* 로고 */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mr-4 shrink-0 hover:opacity-80 transition-opacity"
        >
          <div className="text-sm font-bold leading-tight text-left">
            <div>팬오션</div>
            <div className="text-xs text-blue-300 font-normal">안전보건 포털</div>
          </div>
        </button>
        <div className="w-px h-6 bg-blue-700 mr-3 shrink-0" />

        {/* 대메뉴 */}
        <nav className="flex items-center gap-0.5 flex-1 h-full">
          {items.map((item) => (
            <DropdownMenu key={item.label} item={item} onToast={handleToast} />
          ))}
        </nav>

        {/* 사용자 정보 + 로그아웃 */}
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <span className="text-xs text-blue-300">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-blue-400 hover:text-white border border-blue-700 hover:border-blue-400 px-2.5 py-1 rounded transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
