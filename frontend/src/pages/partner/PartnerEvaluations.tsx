import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvaluationsApi } from '../../api/evaluations';

// [2026-04-17] 협력업체 안전보건평가 결과 조회

type EvaluationItem = {
  id: string; category: string; name: string; description: string | null; maxScore: number;
};
type Evaluation = {
  id: string; year: number; half: number; overallResult: string | null;
  status: 'REVIEWING' | 'IMPROVEMENT_REQUESTED' | 'COMPLETED';
  improvementNote: string | null; completedAt: string | null; createdAt: string;
  company: { name: string; bizNo: string };
  evaluator: { name: string };
  scores: { score: number; item: EvaluationItem }[];
};

const STATUS_MAP = {
  REVIEWING:             { label: '검토중',   className: 'bg-blue-100 text-blue-800' },
  IMPROVEMENT_REQUESTED: { label: '개선요청', className: 'bg-orange-100 text-orange-800' },
  COMPLETED:             { label: '완료',     className: 'bg-green-100 text-green-800' },
};

export default function PartnerEvaluations() {
  const [detailTarget, setDetailTarget] = useState<Evaluation | null>(null);

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['evaluations-partner'],
    queryFn: () => getEvaluationsApi().then((r) => r.data.data as Evaluation[]),
  });

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const latest = evaluations[0];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">안전보건평가</h1>

      {/* 최신 평가 요약 카드 */}
      {latest && (
        <div className={`mb-6 p-4 rounded-lg border-2 flex items-center justify-between ${
          latest.status === 'IMPROVEMENT_REQUESTED'
            ? 'border-orange-300 bg-orange-50'
            : latest.status === 'COMPLETED'
            ? 'border-green-300 bg-green-50'
            : 'border-blue-300 bg-blue-50'
        }`}>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">최근 평가</p>
            <p className="text-lg font-bold text-gray-800">
              {latest.year}년 {latest.half === 1 ? '상반기' : '하반기'}
            </p>
            {latest.status === 'IMPROVEMENT_REQUESTED' && latest.improvementNote && (
              <p className="text-sm text-orange-700 mt-1">
                개선요청: {latest.improvementNote}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_MAP[latest.status].className}`}>
              {STATUS_MAP[latest.status].label}
            </span>
            {latest.overallResult && (
              <p className={`mt-2 text-lg font-bold ${latest.overallResult === '적격' ? 'text-green-600' : 'text-red-600'}`}>
                {latest.overallResult}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 평가 이력 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !evaluations.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">아직 수행된 평가가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">계약부서에서 평가를 수행하면 여기서 결과를 확인하실 수 있습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['평가 기간', '종합결과', '총점', '평가일', '상태', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {evaluations.map((ev) => {
                const total = ev.scores.reduce((s, sc) => s + sc.score, 0);
                const max = ev.scores.reduce((s, sc) => s + sc.item.maxScore, 0);
                return (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {ev.year}년 {ev.half === 1 ? '상반기' : '하반기'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${ev.overallResult === '적격' ? 'text-green-600' : ev.overallResult ? 'text-red-600' : 'text-gray-400'}`}>
                        {ev.overallResult || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{max > 0 ? `${total}/${max}점` : '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(ev.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[ev.status].className}`}>
                        {STATUS_MAP[ev.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailTarget(ev)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">평가 상세</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {detailTarget.status === 'IMPROVEMENT_REQUESTED' && detailTarget.improvementNote && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs font-semibold text-orange-700 mb-1">개선요청 사유</p>
                <p className="text-sm text-orange-800">{detailTarget.improvementNote}</p>
              </div>
            )}

            <div className="space-y-2 text-sm mb-5">
              {[
                { label: '평가 기간', value: `${detailTarget.year}년 ${detailTarget.half === 1 ? '상반기' : '하반기'}` },
                { label: '종합 결과', value: detailTarget.overallResult || '-' },
                { label: '평가자', value: detailTarget.evaluator.name },
                { label: '평가일', value: fmt(detailTarget.createdAt) },
                { label: '검토 상태', value: STATUS_MAP[detailTarget.status].label },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">{label}</dt>
                  <dd className={`font-medium ${label === '종합 결과' ? (value === '적격' ? 'text-green-600' : value === '부적격' ? 'text-red-600' : 'text-gray-800') : 'text-gray-800'}`}>{value}</dd>
                </div>
              ))}
            </div>

            {/* 항목별 점수 */}
            {detailTarget.scores.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">항목별 점수</div>
                {Object.entries(
                  detailTarget.scores.reduce<Record<string, typeof detailTarget.scores>>((acc, sc) => {
                    const cat = sc.item.category;
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(sc);
                    return acc;
                  }, {})
                ).map(([category, catScores]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 bg-gray-100 text-xs font-medium text-gray-600">{category}</div>
                    {catScores.map((sc) => (
                      <div key={sc.item.id} className="flex items-center px-3 py-2 border-t border-gray-100 text-sm">
                        <span className="flex-1 text-gray-700">{sc.item.name}</span>
                        <span className="font-semibold text-gray-800 w-16 text-right">{sc.score}/{sc.item.maxScore}점</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex items-center px-3 py-2 border-t border-gray-200 bg-gray-50 text-sm font-semibold">
                  <span className="flex-1 text-gray-700">총점</span>
                  <span className="text-blue-700">
                    {detailTarget.scores.reduce((s, sc) => s + sc.score, 0)}/
                    {detailTarget.scores.reduce((s, sc) => s + sc.item.maxScore, 0)}점
                  </span>
                </div>
              </div>
            )}

            <button onClick={() => setDetailTarget(null)} className="w-full py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
