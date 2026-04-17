import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEvaluationsApi, reviewEvaluationApi,
  getEvaluationItemsApi, createEvaluationItemApi, updateEvaluationItemApi,
} from '../../api/evaluations';

// [2026-04-17] 관리자 평가 관리 페이지 (검토 탭 + 평가항목 관리 탭)

type EvaluationItem = {
  id: string; category: string; name: string; description: string | null;
  maxScore: number; isActive: boolean; order: number;
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

const ITEM_EMPTY = { category: '', name: '', description: '', maxScore: '100', order: '0' };

export default function AdminEvaluations() {
  const [tab, setTab] = useState<'reviews' | 'items'>('reviews');
  const queryClient = useQueryClient();

  // ── 평가 검토 상태 ──
  const [statusFilter, setStatusFilter] = useState('');
  const [detailTarget, setDetailTarget] = useState<Evaluation | null>(null);
  const [reviewModal, setReviewModal] = useState<Evaluation | null>(null);
  const [reviewType, setReviewType] = useState<'IMPROVEMENT_REQUESTED' | 'COMPLETED'>('COMPLETED');
  const [improvementNote, setImprovementNote] = useState('');

  // ── 평가항목 관리 상태 ──
  const [itemForm, setItemForm] = useState(ITEM_EMPTY);
  const [editItem, setEditItem] = useState<EvaluationItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemFormError, setItemFormError] = useState('');

  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-admin'],
    queryFn: () => getEvaluationsApi().then((r) => r.data.data as Evaluation[]),
  });
  const { data: items = [] } = useQuery({
    queryKey: ['evaluation-items'],
    queryFn: () => getEvaluationItemsApi().then((r) => r.data.data as EvaluationItem[]),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: 'IMPROVEMENT_REQUESTED' | 'COMPLETED'; note?: string }) =>
      reviewEvaluationApi(id, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations-admin'] });
      setReviewModal(null);
      setImprovementNote('');
    },
    onError: (err: any) => alert(err.response?.data?.message || '처리에 실패했습니다.'),
  });

  const createItemMutation = useMutation({
    mutationFn: (d: Parameters<typeof createEvaluationItemApi>[0]) => createEvaluationItemApi(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['evaluation-items'] }); closeItemForm(); },
    onError: (err: any) => setItemFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateEvaluationItemApi>[1] }) =>
      updateEvaluationItemApi(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['evaluation-items'] }); closeItemForm(); },
    onError: (err: any) => setItemFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const openReview = (ev: Evaluation) => {
    setReviewModal(ev); setReviewType('COMPLETED'); setImprovementNote(''); setDetailTarget(null);
  };

  const handleReviewSubmit = () => {
    if (reviewType === 'IMPROVEMENT_REQUESTED' && !improvementNote.trim()) {
      alert('개선요청 사유를 입력해 주세요.'); return;
    }
    reviewMutation.mutate({ id: reviewModal!.id, status: reviewType, note: reviewType === 'IMPROVEMENT_REQUESTED' ? improvementNote : undefined });
  };

  const openItemCreate = () => {
    setEditItem(null); setItemForm(ITEM_EMPTY); setItemFormError(''); setShowItemForm(true);
  };
  const openItemEdit = (item: EvaluationItem) => {
    setEditItem(item);
    setItemForm({ category: item.category, name: item.name, description: item.description || '', maxScore: String(item.maxScore), order: String(item.order) });
    setItemFormError(''); setShowItemForm(true);
  };
  const closeItemForm = () => { setShowItemForm(false); setEditItem(null); setItemForm(ITEM_EMPTY); setItemFormError(''); };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setItemFormError('');
    if (!itemForm.category || !itemForm.name) { setItemFormError('카테고리와 항목명은 필수입니다.'); return; }
    const payload = { category: itemForm.category, name: itemForm.name, description: itemForm.description || undefined, maxScore: Number(itemForm.maxScore) || 100, order: Number(itemForm.order) || 0 };
    if (editItem) updateItemMutation.mutate({ id: editItem.id, data: payload });
    else createItemMutation.mutate(payload);
  };

  const toggleItemActive = (item: EvaluationItem) => {
    updateItemMutation.mutate({ id: item.id, data: { isActive: !item.isActive } });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const filtered = statusFilter ? evaluations.filter((r) => r.status === statusFilter) : evaluations;
  const counts = {
    all: evaluations.length,
    reviewing: evaluations.filter((r) => r.status === 'REVIEWING').length,
    improvement: evaluations.filter((r) => r.status === 'IMPROVEMENT_REQUESTED').length,
    completed: evaluations.filter((r) => r.status === 'COMPLETED').length,
  };

  // 평가항목 카테고리별 그룹
  const groupedItems = items.reduce<Record<string, EvaluationItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">평가 관리</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'reviews', label: '평가 검토' },
          { key: 'items', label: '평가항목 관리' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 평가 검토 탭 ── */}
      {tab === 'reviews' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '전체', value: counts.all, color: 'text-gray-700', bg: 'bg-white' },
              { label: '검토중', value: counts.reviewing, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: '개선요청', value: counts.improvement, color: 'text-orange-700', bg: 'bg-orange-50' },
              { label: '완료', value: counts.completed, color: 'text-green-700', bg: 'bg-green-50' },
            ].map((c) => (
              <div key={c.label} className={`${c.bg} rounded-lg border border-gray-200 p-4`}>
                <div className="text-sm text-gray-500">{c.label}</div>
                <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {[{ value: '', label: '전체' }, { value: 'REVIEWING', label: '검토중' }, { value: 'IMPROVEMENT_REQUESTED', label: '개선요청' }, { value: 'COMPLETED', label: '완료' }].map((t) => (
              <button key={t.value} onClick={() => setStatusFilter(t.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === t.value ? 'bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {!filtered.length ? (
              <div className="p-8 text-center text-gray-400">평가 내역이 없습니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['협력업체', '평가 기간', '종합결과', '총점', '평가자', '평가일', '상태', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((ev) => {
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
                        <td className="px-4 py-3 text-gray-700">{max > 0 ? `${total}/${max}점` : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{ev.evaluator.name}</td>
                        <td className="px-4 py-3 text-gray-500">{fmt(ev.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[ev.status].className}`}>
                            {STATUS_MAP[ev.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {ev.status !== 'COMPLETED' ? (
                            <button onClick={() => openReview(ev)} className="px-3 py-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-800 transition-colors">검토</button>
                          ) : (
                            <button onClick={() => setDetailTarget(ev)} className="text-xs text-gray-400 hover:text-gray-600">상세</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── 평가항목 관리 탭 ── */}
      {tab === 'items' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openItemCreate} className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">
              + 항목 추가
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                  {category}
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {catItems.map((item) => (
                      <tr key={item.id} className={`${!item.isActive ? 'opacity-40' : ''} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{item.description || '-'}</td>
                        <td className="px-4 py-3 text-gray-600 w-20">{item.maxScore}점</td>
                        <td className="px-4 py-3 w-24">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openItemEdit(item)} className="text-xs text-gray-500 hover:text-blue-700 border border-gray-200 px-2 py-1 rounded hover:border-blue-300 transition-colors">수정</button>
                            <button onClick={() => toggleItemActive(item)} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded transition-colors">
                              {item.isActive ? '비활성화' : '활성화'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {!items.length && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                평가항목이 없습니다.
              </div>
            )}
          </div>
        </>
      )}

      {/* 평가 상세 모달 */}
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
                  <dd className={`font-medium ${label === '종합 결과' ? (value === '적격' ? 'text-green-600' : value === '부적격' ? 'text-red-600' : 'text-gray-800') : 'text-gray-800'}`}>{value}</dd>
                </div>
              ))}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">항목별 점수</div>
              {detailTarget.scores.map((sc) => (
                <div key={sc.item.id} className="flex items-center px-3 py-2 border-t border-gray-100 text-sm">
                  <span className="flex-1 text-gray-700">{sc.item.name}</span>
                  <span className="font-semibold text-gray-800">{sc.score}/{sc.item.maxScore}점</span>
                </div>
              ))}
              <div className="flex items-center px-3 py-2 border-t border-gray-200 bg-gray-50 text-sm font-semibold">
                <span className="flex-1 text-gray-700">총점</span>
                <span className="text-blue-700">
                  {detailTarget.scores.reduce((s, sc) => s + sc.score, 0)}/{detailTarget.scores.reduce((s, sc) => s + sc.item.maxScore, 0)}점
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {detailTarget.status !== 'COMPLETED' && (
                <button onClick={() => openReview(detailTarget)} className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors">검토 처리</button>
              )}
              <button onClick={() => setDetailTarget(null)} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 검토 처리 모달 */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">평가 검토</h2>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{reviewModal.company.name}</span>{' '}
              — {reviewModal.year}년 {reviewModal.half === 1 ? '상반기' : '하반기'}
            </p>
            <div className="flex gap-3 mb-5">
              {(['COMPLETED', 'IMPROVEMENT_REQUESTED'] as const).map((type) => (
                <label key={type} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${reviewType === type ? (type === 'COMPLETED' ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50') : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="reviewType" value={type} checked={reviewType === type} onChange={() => setReviewType(type)} className="hidden" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{type === 'COMPLETED' ? '검토 완료' : '개선요청'}</div>
                    <div className="text-xs text-gray-400">{type === 'COMPLETED' ? '평가 검토 완료 처리' : '수정 후 재제출 요청'}</div>
                  </div>
                </label>
              ))}
            </div>
            {reviewType === 'IMPROVEMENT_REQUESTED' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">개선요청 사유 <span className="text-red-500">*</span></label>
                <textarea value={improvementNote} onChange={(e) => setImprovementNote(e.target.value)} rows={3}
                  placeholder="계약부서에 전달할 개선 요청 사유를 입력해 주세요."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
              </div>
            )}
            {reviewType === 'COMPLETED' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">검토 완료 처리됩니다.</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setReviewModal(null); setImprovementNote(''); }}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleReviewSubmit} disabled={reviewMutation.isPending}
                className={`flex-1 py-2 text-white text-sm rounded disabled:opacity-50 transition-colors ${reviewType === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {reviewMutation.isPending ? '처리 중...' : reviewType === 'COMPLETED' ? '완료 처리' : '개선요청 발송'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 평가항목 추가/수정 모달 */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editItem ? '평가항목 수정' : '평가항목 추가'}</h2>
              <button onClick={closeItemForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 <span className="text-red-500">*</span></label>
                <input value={itemForm.category} onChange={(e) => setItemForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="예: 안전관리"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">항목명 <span className="text-red-500">*</span></label>
                <input value={itemForm.name} onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 안전보건관리체계 구축"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input value={itemForm.description} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="평가 기준 설명 (선택)"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">배점</label>
                  <input type="number" min={1} value={itemForm.maxScore} onChange={(e) => setItemForm((p) => ({ ...p, maxScore: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">순서</label>
                  <input type="number" min={0} value={itemForm.order} onChange={(e) => setItemForm((p) => ({ ...p, order: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {itemFormError && <p className="text-sm text-red-500">{itemFormError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeItemForm} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">취소</button>
                <button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors">
                  {(createItemMutation.isPending || updateItemMutation.isPending) ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
