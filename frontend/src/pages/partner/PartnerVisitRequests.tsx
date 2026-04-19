import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVisitRequestsApi,
  createVisitRequestApi,
  updateVisitRequestApi,
  uploadDocumentApi,
  getDocumentUrlApi,
  deleteDocumentApi,
} from '../../api/visitRequests';

// [2026-04-17] 협력업체 사업장 출입신청 페이지

type VisitDocument = { id: string; type: string; fileName: string; s3Key: string; uploadedAt: string };
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
  documents: VisitDocument[];
};

const DOC_TYPES = ['위험성평가서', '안전보건서약서', '작업계획서', '기타'];

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

  // 신청 폼 서류 파일 상태 (3종)
  const FORM_DOC_TYPES = ['위험성평가서', '안전보건서약서', '작업계획서'] as const;
  const [formFiles, setFormFiles] = useState<Record<string, File | null>>({
    '위험성평가서': null, '안전보건서약서': null, '작업계획서': null,
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['visit-requests'],
    queryFn: () => getVisitRequestsApi().then((r) => r.data.data as VisitRequest[]),
  });

  // 상세 모달 최신 데이터 동기화 (IIFE 대신 컴포넌트 레벨에서 계산)
  const currentDetail = detailTarget
    ? (requests.find((r) => r.id === detailTarget.id) ?? detailTarget)
    : null;

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createVisitRequestApi>[0]) => createVisitRequestApi(d),
    onSuccess: async (res) => {
      const requestId = res.data.data.id;
      // 선택된 파일 순차 업로드
      for (const type of FORM_DOC_TYPES) {
        const file = formFiles[type];
        if (file) {
          try { await uploadDocumentApi(requestId, type, file); } catch {}
        }
      }
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '신청에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateVisitRequestApi>[1] }) =>
      updateVisitRequestApi(id, data),
    onSuccess: async (_, variables) => {
      // 새로 선택한 파일 업로드
      for (const type of FORM_DOC_TYPES) {
        const file = formFiles[type];
        if (file) {
          try { await uploadDocumentApi(variables.id, type, file); } catch {}
        }
      }
      queryClient.invalidateQueries({ queryKey: ['visit-requests'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '수정에 실패했습니다.'),
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ requestId, docId }: { requestId: string; docId: string }) =>
      deleteDocumentApi(requestId, docId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['visit-requests'] }),
    onError: () => alert('삭제에 실패했습니다.'),
  });

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
    setFormFiles({ '위험성평가서': null, '안전보건서약서': null, '작업계획서': null });
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

      {/* 상세 모달 — 조회·다운로드 전용 */}
      {currentDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">출입신청 상세</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {currentDetail.status === 'IMPROVEMENT_REQUESTED' && currentDetail.improvementNote && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs font-semibold text-orange-700 mb-1">개선요청 사유</p>
                <p className="text-sm text-orange-800">{currentDetail.improvementNote}</p>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              {[
                { label: '신청 제목', value: currentDetail.title },
                { label: '선박명', value: currentDetail.vesselName || '-' },
                { label: '작업 지역', value: currentDetail.location || '-' },
                { label: '작업 시작일', value: fmt(currentDetail.workStartDate) },
                { label: '작업 종료일', value: fmt(currentDetail.workEndDate) },
                { label: '작업 인원', value: `${currentDetail.workerCount}명` },
                { label: '신청일', value: fmt(currentDetail.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">{label}</dt>
                  <dd className="text-gray-800 font-medium">{value}</dd>
                </div>
              ))}
              {currentDetail.workerList && currentDetail.workerList.length > 0 && (
                <div className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">인원 명단</dt>
                  <dd className="text-gray-800">{currentDetail.workerList.join(', ')}</dd>
                </div>
              )}
              <div className="flex">
                <dt className="w-28 text-gray-500 shrink-0">상태</dt>
                <dd>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[currentDetail.status].className}`}>
                    {STATUS_MAP[currentDetail.status].label}
                  </span>
                </dd>
              </div>
            </dl>

            {/* 첨부 서류 — 다운로드 전용 */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">첨부 서류</p>
              {(currentDetail.documents ?? []).length === 0 ? (
                <p className="text-xs text-gray-400">첨부된 서류가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {(currentDetail.documents ?? []).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <div>
                        <span className="text-xs font-semibold text-blue-700 mr-2">[{doc.type}]</span>
                        <span className="text-xs text-gray-700">{doc.fileName}</span>
                      </div>
                      <button
                        onClick={() => handleDownload(currentDetail.id, doc.id, doc.fileName)}
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5">
              <button
                onClick={() => setDetailTarget(null)}
                className="w-full py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
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

              {/* 서류 첨부 */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">서류 첨부</label>

                {/* 수정 시: 기존 첨부 서류 목록 (최신 데이터 사용) */}
                {editTarget && (() => {
                  const currentDocs = (requests.find((r) => r.id === editTarget.id) ?? editTarget).documents ?? [];
                  return currentDocs.length > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      <p className="text-xs text-gray-400 mb-1">현재 첨부된 서류</p>
                      {currentDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                          <div>
                            <span className="text-xs font-semibold text-blue-700 mr-2">[{doc.type}]</span>
                            <span className="text-xs text-gray-600">{doc.fileName}</span>
                          </div>
                          <div className="flex gap-3 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDownload(editTarget.id, doc.id, doc.fileName)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              다운로드
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (confirm('서류를 삭제하시겠습니까?')) deleteDocMutation.mutate({ requestId: editTarget.id, docId: doc.id }); }}
                              className="text-xs text-red-400 hover:text-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* 새 파일 추가 */}
                <div className="space-y-2">
                  {FORM_DOC_TYPES.map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-28 shrink-0">{type}</span>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.hwp,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => setFormFiles((prev) => ({ ...prev, [type]: e.target.files?.[0] ?? null }))}
                        />
                        <span className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                          파일 선택
                        </span>
                      </label>
                      {formFiles[type] ? (
                        <span className="text-xs text-blue-700 truncate flex-1 min-w-0">{formFiles[type]!.name}</span>
                      ) : (
                        <span className="text-xs text-gray-300 flex-1">-</span>
                      )}
                    </div>
                  ))}
                </div>
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
