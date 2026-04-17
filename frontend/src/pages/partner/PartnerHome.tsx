import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { getNoticesApi } from '../../api/notices';
import { getEvaluationsApi } from '../../api/evaluations';

// [2026-04-17] 협력업체 홈 (대시보드)

export default function PartnerHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: notices = [] } = useQuery({
    queryKey: ['notices'],
    queryFn: () => getNoticesApi().then((r) => r.data.data as any[]),
  });
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-partner'],
    queryFn: () => getEvaluationsApi().then((r) => r.data.data as any[]),
  });

  const pinnedNotices = notices.filter((n: any) => n.isPinned);
  const recentNotices = notices.slice(0, 5);
  const latestEval = evaluations[0];
  const improvementEvals = evaluations.filter((e: any) => e.status === 'IMPROVEMENT_REQUESTED');

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">안녕하세요, {user?.name || ''}님</h1>
        <p className="text-gray-500 mt-1">팬오션 협력업체 안전보건 포털에 오신 것을 환영합니다.</p>
      </div>

      {/* 알림 배너 */}
      {improvementEvals.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-orange-500 text-xl">!</span>
            <p className="text-sm text-orange-800">
              <span className="font-semibold">안전보건평가 개선요청</span>이 {improvementEvals.length}건 있습니다.
            </p>
          </div>
          <button onClick={() => navigate('/partner/evaluations')} className="text-xs text-orange-700 font-semibold hover:underline">
            확인하기
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '출입신청', sub: '서류 제출 및 현황 확인', path: '/partner/visit-requests', color: 'bg-blue-600' },
          { label: '안전보건평가', sub: latestEval ? `최근: ${latestEval.year}년 ${latestEval.half === 1 ? '상반기' : '하반기'}` : '평가 결과 조회', path: '/partner/evaluations', color: 'bg-green-600' },
          { label: '반기평가', sub: '근로자 의견 제출', path: '/partner/semi-annual', color: 'bg-purple-600' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:shadow-md transition-shadow group"
          >
            <div className={`w-8 h-1 rounded ${item.color} mb-3 group-hover:w-12 transition-all`} />
            <div className="text-base font-semibold text-gray-800">{item.label}</div>
            <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
          </button>
        ))}
      </div>

      {/* 공지사항 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">공지사항</h2>
        </div>
        {recentNotices.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">공지사항이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentNotices.map((n: any) => (
              <li key={n.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {n.isPinned && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium shrink-0">고정</span>
                  )}
                  <span className="text-sm text-gray-800 truncate">{n.title}</span>
                </div>
                <span className="text-xs text-gray-400 ml-3 shrink-0">{fmt(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
