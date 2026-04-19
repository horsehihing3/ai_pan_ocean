import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVisitRequestsApi, reviewVisitRequestApi, getDocumentUrlApi } from '../../api/visitRequests';

// [2026-04-17] 관리자 출입신청 검토 페이지

type VisitDocument = { id: string; type: string; fileName: string; uploadedAt: string };
type VisitRequest = {
  id: string;
  title: string;
  vesselName: string | null;
  location: string | null;
  workStartDate: string;
  workEndDate: string;
  workerCount: number;
  workerList: string[] | null;
  status: 'REVIEWING' | 'IMPROVEMENT_REQUESTED' | 'COMPLETED';
  improvementNote: string | null;
  completedAt: string | null;
  createdAt: string;
  company: { name: string };
  submittedBy: { name: string };
  documents: VisitDocument[];
};

const STATUS_MAP = {
  REVIEWING:             { label: '검토중',   className: 'bg-blue-100 text-blue-800' },
  IMPROVEMENT_REQUESTED: { label: '개선요청', className: 'bg-orange-100 text-orange-800' },
  COMPLETED:             { label: '완료',     className: 'bg-green-100 text-green-800' },
};

export default function AdminVisitRequests() {
  const [statusFilter, setStatusFilter] = useState('');
  const [detailTarget, setDetailTarget] = useState<VisitRequest | null>(null);
  const [reviewModal, setReviewModal] = useState<VisitRequest | null>(null);
  const [reviewType, setReviewType] = useState<'IMPROVEMENT_REQUESTED' | 'COMPLETED'>('COMPLETED');
  const [improvementNote, setImprovementNote] = useState('');
  const queryClient = useQueryClient();

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['visit-requests-admin'],
    queryFn: () => getVisitRequestsApi().then((r) => r.data.data as VisitRequest[]),
  });

  const filtered = statusFilter ? all.filter((r) => r.status === statusFilter) : all;

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: 'IMPROVEMENT_REQUESTED' | 'COMPLETED'; note?: string }) =>
      reviewVisitRequestApi(id, { status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests-admin'] });
      setReviewModal(null);
      setImprovementNote('');
    },
    onError: (err: any) => alert(err.response?.data?.message || '처리에 실패했습니다.'),
  });

  const handleReviewSubmit = () => {
    if (reviewType === 'IMPROVEMENT_REQUESTED' && !improvementNote.trim()) {
      alert('개선요청 사유를 입력해 주세요.');
      return;
    }
    reviewMutation.mutate({
      id: reviewModal!.id,
      status: reviewType,
      note: reviewType === 'IMPROVEMENT_REQUESTED' ? improvementNote : undefined,
    });
  };

  const openReview = (req: VisitRequest) => {
    setReviewModal(req);
    setReviewType('COMPLETED');
    setImprovementNote('');
    setDetailTarget(null);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const handleDownload = async (requestId: string, docId: string, fileName: string) => {
    try {
      const res = await getDocumentUrlApi(requestId, docId);
      const a = document.createElement('a');
      a.href = res.data.data.url;
      a.download = fileName;
      a.click();
    } catch {
      alert('다운로드에 실패했습니다.');
    }
  };

  const counts = {
    all: all.length,
    reviewing: all.filter((r) => r.status === 'REVIEWING').length,
    improvement: all.filter((r) => r.status === 'IMPROVEMENT_REQUESTED').length,
    completed: all.filter((r) => r.status === 'COMPLETED').length,
  };

  const FILTERS = [
    { value: '', label: '전체' },
    { value: 'REVIEWING', label: '검토중' },
    { value: 'IMPROVEMENT_REQUESTED', label: '개선요청' },
    { value: 'COMPLETED', label: '완료' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">출입신청 관리</h1>

      {/* 요약 카드 */}
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

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !filtered.length ? (
          <div className="p-8 text-center text-gray-400">출입신청 내역이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">신청 제목</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">협력업체</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">선박/지역</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">작업 기간</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">인원</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">신청일</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailTarget(req)}
                      className="font-medium text-blue-700 hover:underline text-left"
                    >
                      {req.title}
                    </button>
                    {req.status === 'IMPROVEMENT_REQUESTED' && req.improvementNote && (
                      <p className="text-xs text-orange-600 mt-0.5 truncate max-w-xs">
                        {req.improvementNote}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{req.company.name}</div>
                    <div className="text-xs text-gray-400">{req.submittedBy.name}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[req.vesselName, req.location].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {fmt(req.workStartDate)} ~<br />{fmt(req.workEndDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{req.workerCount}명</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(req.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[req.status].className}`}
                    >
                      {STATUS_MAP[req.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.status !== 'COMPLETED' && (
                      <button
                        onClick={() => openReview(req)}
                        className="px-3 py-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-800 transition-colors"
                      >
                        검토
                      </button>
                    )}
                    {req.status === 'COMPLETED' && (
                      <button
                        onClick={() => setDetailTarget(req)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        상세
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">출입신청 상세</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {detailTarget.status === 'IMPROVEMENT_REQUESTED' && detailTarget.improvementNote && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs font-semibold text-orange-700 mb-1">개선요청 사유</p>
                <p className="text-sm text-orange-800">{detailTarget.improvementNote}</p>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              {[
                { label: '신청 제목', value: detailTarget.title },
                { label: '협력업체', value: detailTarget.company.name },
                { label: '신청자', value: detailTarget.submittedBy.name },
                { label: '선박명', value: detailTarget.vesselName || '-' },
                { label: '작업 지역', value: detailTarget.location || '-' },
                { label: '작업 시작일', value: fmt(detailTarget.workStartDate) },
                { label: '작업 종료일', value: fmt(detailTarget.workEndDate) },
                { label: '작업 인원', value: `${detailTarget.workerCount}명` },
                { label: '신청일', value: fmt(detailTarget.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">{label}</dt>
                  <dd className="text-gray-800 font-medium">{value}</dd>
                </div>
              ))}
              {detailTarget.workerList && detailTarget.workerList.length > 0 && (
                <div className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">인원 명단</dt>
                  <dd className="text-gray-800">{detailTarget.workerList.join(', ')}</dd>
                </div>
              )}
              <div className="flex">
                <dt className="w-28 text-gray-500 shrink-0">상태</dt>
                <dd>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[detailTarget.status].className}`}>
                    {STATUS_MAP[detailTarget.status].label}
                  </span>
                </dd>
              </div>
              {detailTarget.completedAt && (
                <div className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">완료일</dt>
                  <dd className="text-gray-800 font-medium">{fmt(detailTarget.completedAt)}</dd>
                </div>
              )}
            </dl>

            {/* 첨부 서류 */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">첨부 서류</p>
              {!detailTarget.documents || detailTarget.documents.length === 0 ? (
                <p className="text-xs text-gray-400">첨부된 서류가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {detailTarget.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <div>
                        <span className="text-xs font-semibold text-blue-700 mr-2">[{doc.type}]</span>
                        <span className="text-xs text-gray-700">{doc.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(detailTarget.id, doc.id, doc.fileName)}
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              {detailTarget.status !== 'COMPLETED' && (
                <button
                  onClick={() => openReview(detailTarget)}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                >
                  검토 처리
                </button>
              )}
              <button
                onClick={() => setDetailTarget(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 검토 처리 모달 */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">출입신청 검토</h2>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">{reviewModal.company.name}</span>{' '}
              — {reviewModal.title}
            </p>

            {/* 처리 유형 선택 */}
            <div className="flex gap-3 mb-5">
              <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${reviewType === 'COMPLETED' ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="reviewType"
                  value="COMPLETED"
                  checked={reviewType === 'COMPLETED'}
                  onChange={() => setReviewType('COMPLETED')}
                  className="accent-green-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">검토 완료</div>
                  <div className="text-xs text-gray-400">서류 검토 완료 처리</div>
                </div>
              </label>
              <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${reviewType === 'IMPROVEMENT_REQUESTED' ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name="reviewType"
                  value="IMPROVEMENT_REQUESTED"
                  checked={reviewType === 'IMPROVEMENT_REQUESTED'}
                  onChange={() => setReviewType('IMPROVEMENT_REQUESTED')}
                  className="accent-orange-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">개선요청</div>
                  <div className="text-xs text-gray-400">수정 후 재제출 요청</div>
                </div>
              </label>
            </div>

            {/* 개선요청 사유 */}
            {reviewType === 'IMPROVEMENT_REQUESTED' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  개선요청 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={improvementNote}
                  onChange={(e) => setImprovementNote(e.target.value)}
                  rows={4}
                  placeholder="협력업체에 전달할 개선 요청 사유를 입력해 주세요."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">입력한 사유가 이메일로 협력업체에 발송됩니다.</p>
              </div>
            )}

            {reviewType === 'COMPLETED' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">검토 완료 처리 후에는 협력업체에서 수정할 수 없습니다.</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setReviewModal(null); setImprovementNote(''); }}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={reviewMutation.isPending}
                className={`flex-1 py-2 text-white text-sm rounded disabled:opacity-50 transition-colors ${
                  reviewType === 'COMPLETED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {reviewMutation.isPending
                  ? '처리 중...'
                  : reviewType === 'COMPLETED'
                  ? '완료 처리'
                  : '개선요청 발송'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
