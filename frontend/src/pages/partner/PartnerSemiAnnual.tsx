import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQuestionsApi, getSemiAnnualsApi,
  createSemiAnnualApi, updateSemiAnnualApi, submitSemiAnnualApi,
} from '../../api/semiAnnual';

// [2026-04-17] 협력업체 반기평가 페이지

type Question = { id: string; category: string; text: string };
type SemiAnnual = {
  id: string; year: number; half: number;
  content: Record<string, string> | null;
  workerOpinion: string | null;
  submittedAt: string | null;
  createdAt: string;
};

const SCORE_LABELS: Record<string, string> = {
  '5': '매우 그렇다',
  '4': '그렇다',
  '3': '보통',
  '2': '그렇지 않다',
  '1': '전혀 그렇지 않다',
};

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_HALF = new Date().getMonth() < 6 ? 1 : 2;

export default function PartnerSemiAnnual() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<SemiAnnual | null>(null);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [half, setHalf] = useState(CURRENT_HALF);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [workerOpinion, setWorkerOpinion] = useState('');
  const [formError, setFormError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['semi-annual-questions'],
    queryFn: () => getQuestionsApi().then((r) => r.data.data),
  });

  const { data: list = [] } = useQuery<SemiAnnual[]>({
    queryKey: ['semi-annual-partner'],
    queryFn: () => getSemiAnnualsApi().then((r) => r.data.data),
  });

  // 해당 연도·반기 기존 데이터 확인
  const currentPeriodData = list.find((s) => s.year === CURRENT_YEAR && s.half === CURRENT_HALF);

  // 폼 열 때 기존 데이터 로드
  const openForm = (target?: SemiAnnual) => {
    if (target) {
      setEditTarget(target);
      setYear(target.year);
      setHalf(target.half);
      setAnswers(target.content || {});
      setWorkerOpinion(target.workerOpinion || '');
    } else {
      setEditTarget(currentPeriodData || null);
      setYear(CURRENT_YEAR);
      setHalf(CURRENT_HALF);
      setAnswers(currentPeriodData?.content || {});
      setWorkerOpinion(currentPeriodData?.workerOpinion || '');
    }
    setFormError('');
    setSaveMsg('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setAnswers({});
    setWorkerOpinion('');
    setFormError('');
    setSaveMsg('');
  };

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createSemiAnnualApi>[0]) => createSemiAnnualApi(d),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['semi-annual-partner'] });
      setEditTarget(res.data.data);
      setSaveMsg('임시저장 완료');
      setTimeout(() => setSaveMsg(''), 2000);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateSemiAnnualApi>[1] }) =>
      updateSemiAnnualApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semi-annual-partner'] });
      setSaveMsg('임시저장 완료');
      setTimeout(() => setSaveMsg(''), 2000);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitSemiAnnualApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semi-annual-partner'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '제출에 실패했습니다.'),
  });

  const handleSave = () => {
    setFormError('');
    const payload = { content: answers, workerOpinion };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate({ year, half, ...payload });
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    // 미응답 확인
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setFormError(`미응답 항목이 ${unanswered.length}개 있습니다. 모두 응답해 주세요.`);
      return;
    }

    // 저장 후 제출
    const saveAndSubmit = async () => {
      let id = editTarget?.id;
      if (!id) {
        const res = await createSemiAnnualApi({ year, half, content: answers, workerOpinion });
        id = res.data.data.id;
        setEditTarget(res.data.data);
      } else {
        await updateSemiAnnualApi(id, { content: answers, workerOpinion });
      }
      submitMutation.mutate(id!);
    };

    saveAndSubmit().catch((err) => {
      setFormError(err.response?.data?.message || '제출에 실패했습니다.');
    });
  };

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // 카테고리별 그룹
  const grouped = questions.reduce<Record<string, Question[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">반기평가</h1>
          <p className="text-sm text-gray-500 mt-1">안전보건 현황에 대한 반기 설문을 작성·제출합니다.</p>
        </div>
        {!currentPeriodData?.submittedAt && (
          <button
            onClick={() => openForm()}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
          >
            {currentPeriodData ? '이어서 작성' : `${CURRENT_YEAR}년 ${CURRENT_HALF === 1 ? '상반기' : '하반기'} 작성`}
          </button>
        )}
      </div>

      {/* 현재 기간 상태 카드 */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        currentPeriodData?.submittedAt
          ? 'border-green-300 bg-green-50'
          : currentPeriodData
          ? 'border-yellow-300 bg-yellow-50'
          : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">
              {CURRENT_YEAR}년 {CURRENT_HALF === 1 ? '상반기' : '하반기'} (현재 기간)
            </p>
            {currentPeriodData?.submittedAt ? (
              <p className="text-sm font-semibold text-green-700">제출 완료 — {fmt(currentPeriodData.submittedAt)}</p>
            ) : currentPeriodData ? (
              <p className="text-sm font-semibold text-yellow-700">임시저장됨 — 작성 중</p>
            ) : (
              <p className="text-sm text-gray-500">아직 작성하지 않았습니다.</p>
            )}
          </div>
          {currentPeriodData?.submittedAt && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">제출완료</span>
          )}
          {currentPeriodData && !currentPeriodData.submittedAt && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">작성중</span>
          )}
        </div>
      </div>

      {/* 제출 이력 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">제출 이력</h2>
        </div>
        {!list.length ? (
          <div className="p-8 text-center text-gray-400 text-sm">제출 이력이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['평가 기간', '응답 항목', '상태', '제출일', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((s) => {
                const answered = questions.filter((q) => s.content?.[q.id]).length;
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {s.year}년 {s.half === 1 ? '상반기' : '하반기'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {answered}/{questions.length}항목
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.submittedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.submittedAt ? '제출완료' : '작성중'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.submittedAt ? fmt(s.submittedAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {!s.submittedAt && (
                        <button onClick={() => openForm(s)} className="text-xs text-blue-600 hover:underline">이어 작성</button>
                      )}
                      {s.submittedAt && (
                        <button onClick={() => openForm(s)} className="text-xs text-gray-400 hover:text-gray-600">상세보기</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 작성 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {year}년 {half === 1 ? '상반기' : '하반기'} 반기평가
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">안전보건 현황을 정직하게 응답해 주세요.</p>
              </div>
              {!editTarget?.submittedAt && (
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              )}
              {editTarget?.submittedAt && (
                <button onClick={closeForm} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">닫기</button>
              )}
            </div>

            {/* 진행률 */}
            {!editTarget?.submittedAt && (
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>응답 진행률</span>
                  <span className="font-semibold text-blue-700">{answeredCount}/{questions.length} ({progressPct}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}

            <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* 설문 항목 */}
              {Object.entries(grouped).map(([category, qs]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    {category}
                  </h3>
                  <div className="space-y-4">
                    {qs.map((q, idx) => {
                      const globalIdx = questions.findIndex((x) => x.id === q.id) + 1;
                      return (
                        <div key={q.id} className={`p-4 rounded-lg border ${answers[q.id] ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                          <p className="text-sm font-medium text-gray-800 mb-3">
                            <span className="text-gray-400 mr-1.5">Q{globalIdx}.</span>
                            {q.text}
                          </p>
                          {editTarget?.submittedAt ? (
                            <div className="text-sm font-semibold text-blue-700">
                              {SCORE_LABELS[answers[q.id]] || '-'} ({answers[q.id]}점)
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              {['5', '4', '3', '2', '1'].map((score) => (
                                <button
                                  key={score}
                                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: score }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                    answers[q.id] === score
                                      ? 'bg-blue-700 text-white border-blue-700'
                                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {score} {SCORE_LABELS[score]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* 근로자 의견 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
                  근로자 의견 (선택)
                </h3>
                {editTarget?.submittedAt ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap min-h-[60px]">
                    {workerOpinion || '의견 없음'}
                  </div>
                ) : (
                  <textarea
                    value={workerOpinion}
                    onChange={(e) => setWorkerOpinion(e.target.value)}
                    rows={4}
                    placeholder="안전보건 개선이 필요한 사항, 건의사항 등을 자유롭게 작성해 주세요."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            {!editTarget?.submittedAt && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                {formError && <p className="text-sm text-red-500 mb-3">{formError}</p>}
                {saveMsg && <p className="text-sm text-green-600 mb-3">{saveMsg}</p>}
                <div className="flex gap-2">
                  <button onClick={closeForm} className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-white transition-colors">취소</button>
                  <button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2 border border-blue-300 text-blue-700 text-sm rounded hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? '저장 중...' : '임시저장'}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending || createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                  >
                    {submitMutation.isPending ? '제출 중...' : `제출 (${answeredCount}/${questions.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
