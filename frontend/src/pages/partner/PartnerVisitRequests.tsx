import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVisitRequestsApi,
  createVisitRequestApi,
  updateVisitRequestApi,
} from '../../api/visitRequests';

// [2026-04-17] 협력업체 사업장 출입신청 페이지

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
};

const STATUS_MAP = {
  REVIEWING:             { label: '검토중',     className: 'bg-blue-100 text-blue-800' },
  IMPROVEMENT_REQUESTED: { label: '개선요청',   className: 'bg-orange-100 text-orange-800' },
  COMPLETED:             { label: '완료',        className: 'bg-green-100 text-green-800' },
};

const EMPTY_FORM = {
  title: '',
  vesselName: '',
  location: '',
  workStartDate: '',
  workEndDate: '',
  workerCount: '',
  workerList: '',
};

export default function PartnerVisitRequests() {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<VisitRequest | null>(null);
  const [detailTarget, setDetailTarget] = useState<VisitRequest | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['visit-requests'],
    queryFn: () => getVisitRequestsApi().then((r) => r.data.data as VisitRequest[]),
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createVisitRequestApi>[0]) => createVisitRequestApi(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '신청에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateVisitRequestApi>[1] }) =>
      updateVisitRequestApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '수정에 실패했습니다.'),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (req: VisitRequest) => {
    setEditTarget(req);
    setForm({
      title: req.title,
      vesselName: req.vesselName || '',
      location: req.location || '',
      workStartDate: req.workStartDate.slice(0, 10),
      workEndDate: req.workEndDate.slice(0, 10),
      workerCount: String(req.workerCount),
      workerList: req.workerList ? req.workerList.join('\n') : '',
    });
    setFormError('');
    setDetailTarget(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const workerCount = parseInt(form.workerCount);
    if (!form.title || !form.workStartDate || !form.workEndDate || !form.workerCount) {
      setFormError('필수 항목을 모두 입력해 주세요.');
      return;
    }
    if (isNaN(workerCount) || workerCount < 1) {
      setFormError('인원수는 1명 이상이어야 합니다.');
      return;
    }
    if (new Date(form.workEndDate) < new Date(form.workStartDate)) {
      setFormError('작업 종료일은 시작일 이후여야 합니다.');
      return;
    }

    const workerList = form.workerList
      ? form.workerList.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      title: form.title,
      vesselName: form.vesselName || undefined,
      location: form.location || undefined,
      workStartDate: form.workStartDate,
      workEndDate: form.workEndDate,
      workerCount,
      workerList: workerList.length ? workerList : undefined,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">사업장 출입신청</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          + 신규 신청
        </button>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !requests.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">출입신청 내역이 없습니다.</p>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800"
            >
              첫 번째 신청하기
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">신청 제목</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">선박/지역</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">작업 기간</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">인원</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">신청일</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
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
                        개선요청: {req.improvementNote}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {[req.vesselName, req.location].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {fmt(req.workStartDate)} ~ {fmt(req.workEndDate)}
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
                        onClick={() => openEdit(req)}
                        className="text-xs text-gray-500 hover:text-blue-700 border border-gray-200 px-2 py-1 rounded hover:border-blue-300 transition-colors"
                      >
                        수정
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
                  <dd className="text-gray-800">
                    {detailTarget.workerList.join(', ')}
                  </dd>
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
            </dl>

            <div className="flex gap-2 mt-6">
              {detailTarget.status !== 'COMPLETED' && (
                <button
                  onClick={() => openEdit(detailTarget)}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                >
                  수정하기
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

      {/* 신청 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                {editTarget ? '출입신청 수정' : '사업장 출입신청'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {editTarget?.status === 'IMPROVEMENT_REQUESTED' && editTarget.improvementNote && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs font-semibold text-orange-700 mb-1">개선요청 사유 (수정 후 재제출)</p>
                <p className="text-sm text-orange-800">{editTarget.improvementNote}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  신청 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="예: 00호선 도장 작업 출입신청"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">선박명</label>
                  <input
                    name="vesselName"
                    value={form.vesselName}
                    onChange={handleChange}
                    placeholder="예: PAN OCEAN 101호"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">작업 지역</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="예: 부산 신항"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작업 시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="workStartDate"
                    value={form.workStartDate}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작업 종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="workEndDate"
                    value={form.workEndDate}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작업 인원 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="workerCount"
                  value={form.workerCount}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  인원 명단{' '}
                  <span className="text-xs text-gray-400 font-normal">(한 줄에 한 명씩 입력)</span>
                </label>
                <textarea
                  name="workerList"
                  value={form.workerList}
                  onChange={handleChange}
                  rows={4}
                  placeholder={'홍길동\n김철수\n이영희'}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {isPending ? '처리 중...' : editTarget ? '수정 제출' : '신청하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
