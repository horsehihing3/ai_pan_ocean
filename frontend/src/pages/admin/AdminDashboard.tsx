import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCompaniesApi } from '../../api/companies';
import { getEvaluationsApi } from '../../api/evaluations';
import { getNoticesApi } from '../../api/notices';

// [2026-04-17] 관리자 대시보드

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-admin'],
    queryFn: () => getCompaniesApi().then((r) => r.data.data as any[]),
  });
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-admin'],
    queryFn: () => getEvaluationsApi().then((r) => r.data.data as any[]),
  });
  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => getNoticesApi().then((r) => r.data.data as any[]),
  });

  const watchlistCount = companies.filter((c: any) => c.isWatchlist).length;
  const reviewingEvals = evaluations.filter((e: any) => e.status === 'REVIEWING').length;
  const improvementEvals = evaluations.filter((e: any) => e.status === 'IMPROVEMENT_REQUESTED').length;
  const pinnedNotices = notices.filter((n: any) => n.isPinned);
  const recentNotices = notices.slice(0, 3);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">관리자 대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 협력업체', value: companies.length, sub: `요주의 ${watchlistCount}건`, color: 'text-gray-800', link: '/admin/companies' },
          { label: '평가 검토중', value: reviewingEvals, sub: '계약부서 제출 대기', color: 'text-blue-700', link: '/admin/evaluations' },
          { label: '평가 개선요청', value: improvementEvals, sub: '수정 재제출 대기', color: 'text-orange-600', link: '/admin/evaluations' },
          { label: '공지사항', value: notices.length, sub: `고정 ${pinnedNotices.length}건`, color: 'text-gray-800', link: '/admin/notices' },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => navigate(card.link)}
            className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className="text-sm text-gray-500 mb-1">{card.label}</div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 요주의 업체 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">요주의 업체</h2>
            <button onClick={() => navigate('/admin/companies')} className="text-xs text-blue-600 hover:underline">전체보기</button>
          </div>
          {watchlistCount === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">요주의 업체가 없습니다.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {companies.filter((c: any) => c.isWatchlist).slice(0, 5).map((c: any) => (
                <li key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{c.bizNo}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded font-medium">요주의</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 최근 공지사항 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">최근 공지사항</h2>
            <button onClick={() => navigate('/admin/notices')} className="text-xs text-blue-600 hover:underline">관리</button>
          </div>
          {recentNotices.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">공지사항이 없습니다.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentNotices.map((n: any) => (
                <li key={n.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {n.isPinned && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium shrink-0">고정</span>}
                    <span className="text-sm text-gray-800 truncate">{n.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-3 shrink-0">{fmt(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 검토 대기 평가 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">검토 대기 평가</h2>
            <button onClick={() => navigate('/admin/evaluations')} className="text-xs text-blue-600 hover:underline">전체보기</button>
          </div>
          {reviewingEvals === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">검토 대기 평가가 없습니다.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {evaluations.filter((e: any) => e.status === 'REVIEWING').slice(0, 5).map((ev: any) => (
                <li key={ev.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{ev.company.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{ev.year}년 {ev.half === 1 ? '상반기' : '하반기'}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">검토중</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 빠른 이동 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">빠른 이동</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '가입신청 관리', path: '/admin/registrations', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { label: '출입신청 관리', path: '/admin/visit-requests', color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: '평가 관리', path: '/admin/evaluations', color: 'bg-green-50 text-green-700 border-green-200' },
              { label: '협력업체 관리', path: '/admin/companies', color: 'bg-gray-50 text-gray-700 border-gray-200' },
              { label: '안전수칙 관리', path: '/admin/safety-rules', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { label: '안전보건실적', path: '/admin/performance', color: 'bg-teal-50 text-teal-700 border-teal-200' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`py-3 rounded-lg border text-sm font-medium transition-colors hover:opacity-80 ${item.color}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
