import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvaluationsApi, getEvaluationItemsApi, createEvaluationApi } from '../../api/evaluations';
import { getCompaniesApi } from '../../api/companies';

// [2026-04-17] 계약부서 안전보건평가 수행 페이지

type EvaluationItem = {
  id: string; category: string; name: string; description: string | null; maxScore: number;
};
type Company = { id: string; name: string; bizNo: string; };
type Evaluation = {
  id: string; year: number; half: number; overallResult: string | null;
  status: 'REVIEWING' | 'IMPROVEMENT_REQUESTED' | 'COMPLETED';
  improvementNote: string | null; completedAt: string | null; createdAt: string;
  company: { name: string; bizNo: string };
  evaluator: { name: string };
  scores: { score: number; note?: string; item: EvaluationItem }[];
};

const STATUS_MAP = {
  REVIEWING:             { label: '검토중',   className: 'bg-blue-100 text-blue-800' },
  IMPROVEMENT_REQUESTED: { label: '개선요청', className: 'bg-orange-100 text-orange-800' },
  COMPLETED:             { label: '완료',     className: 'bg-green-100 text-green-800' },
};

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_HALF = new Date().getMonth() < 6 ? 1 : 2;

export default function ContractEvaluations() {
  const [showForm, setShowForm] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Evaluation | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [half, setHalf] = useState(CURRENT_HALF);
  const [overallResult, setOverallResult] = useState('적격');
  const [scores, setScores] = useState<Record<string, { score: string; note: string }>>({});
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => getEvaluationsApi().then((r) => r.data.data as Evaluation[]),
  });
  const { data: items = [] } = useQuery({
    queryKey: ['evaluation-items'],
    queryFn: () => getEvaluationItemsApi().then((r) => r.data.data as EvaluationItem[]),
  });
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => getCompaniesApi().then((r) => r.data.data as Company[]),
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createEvaluationApi>[0]) => createEvaluationApi(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '평가 저장에 실패했습니다.'),
  });

  // 항목을 카테고리별로 그룹핑
  const grouped = items.reduce<Record<string, EvaluationItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const openForm = () => {
    setSelectedCompany('');
    setYear(CURRENT_YEAR);
    setHalf(CURRENT_HALF);
    setOverallResult('적격');
    const initial: Record<string, { score: string; note: string }> = {};
    items.forEach((item) => { initial[item.id] = { score: '', note: '' }; });
    setScores(initial);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError('');
  };

  const handleScoreChange = (itemId: string, field: 'score' | 'note', value: string) => {
    setScores((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  // 총점 계산
  const totalScore = items.reduce((sum, item) => {
    const s = parseInt(scores[item.id]?.score || '0');
    return sum + (isNaN(s) ? 0 : s);
  }, 0);
  const maxTotal = items.reduce((sum, item) => sum + item.maxScore, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCompany) { setFormError('협력업체를 선택해 주세요.'); return; }

    // 점수 유효성 검사
    for (const item of items) {
      const s = parseInt(scores[item.id]?.score || '');
      if (isNaN(s) || s < 0 || s > item.maxScore) {
        setFormError(`"${item.name}" 점수는 0~${item.maxScore} 사이여야 합니다.`);
        return;
      }
    }

    createMutation.mutate({
      companyId: selectedCompany,
      year, half, overallResult,
      scores: items.map((item) => ({
        itemId: item.id,
        score: parseInt(scores[item.id]?.score || '0'),
        note: scores[item.id]?.note || undefined,
      })),
    });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">안전보건평가</h1>
        <button
          onClick={openForm}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          + 평가 수행
        </button>
      </div>

      {/* 평가 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {!evaluations.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">수행한 평가가 없습니다.</p>
            <button onClick={openForm} className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800">
              첫 번째 평가 수행
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['협력업체', '평가 기간', '종합결과', '총점', '평가일', '상태', ''].map((h) => (
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
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailTarget(ev)} className="font-medium text-blue-700 hover:underline">
                        {ev.company.name}
                      </button>
                      <div className="text-xs text-gray-400">{ev.company.bizNo}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ev.year}년 {ev.half === 1 ? '상반기' : '하반기'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${ev.overallResult === '적격' ? 'text-green-600' : 'text-red-600'}`}>
                        {ev.overallResult || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {max > 0 ? `${total}/${max}점` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmt(ev.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[ev.status].className}`}>
                        {STATUS_MAP[ev.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailTarget(ev)} className="text-xs text-gray-400 hover:text-gray-600">
                        상세
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

            <div className="space-y-2 text-sm mb-4">
              {[
                { label: '협력업체', value: `${detailTarget.company.name} (${detailTarget.company.bizNo})` },
                { label: '평가 기간', value: `${detailTarget.year}년 ${detailTarget.half === 1 ? '상반기' : '하반기'}` },
                { label: '종합 결과', value: detailTarget.overallResult || '-' },
                { label: '평가자', value: detailTarget.evaluator.name },
                { label: '평가일', value: fmt(detailTarget.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">{label}</dt>
                  <dd className={`font-medium ${label === '종합 결과' ? (value === '적격' ? 'text-green-600' : 'text-red-600') : 'text-gray-800'}`}>{value}</dd>
                </div>
              ))}
            </div>

            {/* 항목별 점수 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
                항목별 평가 점수
              </div>
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
                      <span className="font-semibold text-gray-800 w-16 text-right">
                        {sc.score}/{sc.item.maxScore}점
                      </span>
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

            <button onClick={() => setDetailTarget(null)} className="w-full mt-4 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 평가 수행 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">안전보건평가 수행</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 기본 정보 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    협력업체 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">평가 연도</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[CURRENT_YEAR, CURRENT_YEAR - 1].map((y) => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">평가 기간</label>
                  <select
                    value={half}
                    onChange={(e) => setHalf(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>상반기</option>
                    <option value={2}>하반기</option>
                  </select>
                </div>
              </div>

              {/* 항목별 점수 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">항목별 평가</label>
                  <span className="text-sm font-semibold text-blue-700">
                    총점: {totalScore}/{maxTotal}점
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {Object.entries(grouped).map(([category, catItems]) => (
                    <div key={category}>
                      <div className="px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {category}
                      </div>
                      {catItems.map((item) => (
                        <div key={item.id} className="border-t border-gray-100 px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                value={scores[item.id]?.score || ''}
                                onChange={(e) => handleScoreChange(item.id, 'score', e.target.value)}
                                min={0}
                                max={item.maxScore}
                                placeholder="0"
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-400 whitespace-nowrap">/ {item.maxScore}점</span>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={scores[item.id]?.note || ''}
                            onChange={(e) => handleScoreChange(item.id, 'note', e.target.value)}
                            placeholder="비고 (선택)"
                            className="mt-2 w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* 종합 결과 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종합 결과</label>
                <div className="flex gap-4">
                  {['적격', '부적격'].map((result) => (
                    <label
                      key={result}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border cursor-pointer transition-colors ${
                        overallResult === result
                          ? result === '적격'
                            ? 'border-green-400 bg-green-50 text-green-700'
                            : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="overallResult"
                        value={result}
                        checked={overallResult === result}
                        onChange={() => setOverallResult(result)}
                        className="hidden"
                      />
                      <span className="text-sm font-semibold">{result}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeForm}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">
                  취소
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors">
                  {createMutation.isPending ? '저장 중...' : '평가 제출'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
