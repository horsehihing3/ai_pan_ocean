import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccidentsApi, getInjuryTypesApi, createAccidentApi, updateAccidentApi, deleteAccidentApi } from '../../api/accidents';

// [2026-04-17] 협력업체 산업재해 신고·조회

type Accident = {
  id: string; occurredAt: string; location: string | null; description: string;
  workerName: string | null; injuryType: string | null; lostDays: number | null;
  createdAt: string; company: { name: string; bizNo: string };
};

const EMPTY_FORM = {
  occurredAt: '', location: '', description: '', workerName: '', injuryType: '', lostDays: '',
};

export default function PartnerAccidents() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Accident | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [detailTarget, setDetailTarget] = useState<Accident | null>(null);

  const { data: accidents = [], isLoading } = useQuery<Accident[]>({
    queryKey: ['accidents-partner'],
    queryFn: () => getAccidentsApi().then((r) => r.data.data),
  });

  const { data: injuryTypes = [] } = useQuery<string[]>({
    queryKey: ['injury-types'],
    queryFn: () => getInjuryTypesApi().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createAccidentApi>[0]) => createAccidentApi(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accidents-partner'] }); closeForm(); },
    onError: (err: any) => setFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAccidentApi>[1] }) =>
      updateAccidentApi(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accidents-partner'] }); closeForm(); },
    onError: (err: any) => setFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAccidentApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accidents-partner'] }),
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, occurredAt: new Date().toISOString().slice(0, 16) });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (a: Accident) => {
    setEditTarget(a);
    setForm({
      occurredAt: new Date(a.occurredAt).toISOString().slice(0, 16),
      location: a.location || '',
      description: a.description,
      workerName: a.workerName || '',
      injuryType: a.injuryType || '',
      lostDays: a.lostDays !== null ? String(a.lostDays) : '',
    });
    setFormError('');
    setDetailTarget(null);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.occurredAt) { setFormError('발생일시를 입력해 주세요.'); return; }
    if (!form.description.trim()) { setFormError('재해 내용을 입력해 주세요.'); return; }

    const payload = {
      occurredAt: form.occurredAt,
      location: form.location || undefined,
      description: form.description,
      workerName: form.workerName || undefined,
      injuryType: form.injuryType || undefined,
      lostDays: form.lostDays ? Number(form.lostDays) : undefined,
    };

    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (a: Accident) => {
    if (confirm('이 재해 기록을 삭제하시겠습니까?')) deleteMutation.mutate(a.id);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const fmtDatetime = (d: string) =>
    new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const thisYear = accidents.filter((a) => new Date(a.occurredAt).getFullYear() === new Date().getFullYear());

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">산업재해 신고</h1>
          <p className="text-sm text-gray-500 mt-1">재해 발생 즉시 신고해 주세요.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
          + 재해 신고
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '전체 재해', value: accidents.length, color: 'text-gray-700' },
          { label: `${new Date().getFullYear()}년 발생`, value: thisYear.length, color: 'text-red-600' },
          { label: '총 휴업일수', value: `${accidents.reduce((s, a) => s + (a.lostDays || 0), 0)}일`, color: 'text-orange-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !accidents.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">신고된 재해가 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['발생일시', '발생 장소', '피재자', '재해 유형', '휴업일수', '신고일', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accidents.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{fmtDatetime(a.occurredAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{a.location || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{a.workerName || '-'}</td>
                  <td className="px-4 py-3">
                    {a.injuryType ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        {a.injuryType}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{a.lostDays !== null ? `${a.lostDays}일` : '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setDetailTarget(a)} className="text-xs text-gray-400 hover:text-gray-600">상세</button>
                      <button onClick={() => openEdit(a)} className="text-xs text-blue-500 hover:text-blue-700">수정</button>
                      <button onClick={() => handleDelete(a)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                    </div>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">재해 상세</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-2.5 text-sm mb-5">
              {[
                { label: '발생일시', value: fmtDatetime(detailTarget.occurredAt) },
                { label: '발생 장소', value: detailTarget.location || '-' },
                { label: '피재자', value: detailTarget.workerName || '-' },
                { label: '재해 유형', value: detailTarget.injuryType || '-' },
                { label: '휴업일수', value: detailTarget.lostDays !== null ? `${detailTarget.lostDays}일` : '-' },
                { label: '신고일', value: fmt(detailTarget.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-24 text-gray-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-800">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-gray-500 mb-1">재해 내용</dt>
                <dd className="text-gray-800 bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap">{detailTarget.description}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(detailTarget)} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">수정</button>
              <button onClick={() => setDetailTarget(null)} className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 신고/수정 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">{editTarget ? '재해 기록 수정' : '산업재해 신고'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발생일시 <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.occurredAt}
                    onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발생 장소</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="예: 3번 선석 갑판"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">피재자 성명</label>
                  <input
                    value={form.workerName}
                    onChange={(e) => setForm((p) => ({ ...p, workerName: e.target.value }))}
                    placeholder="홍길동"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">재해 유형</label>
                  <select
                    value={form.injuryType}
                    onChange={(e) => setForm((p) => ({ ...p, injuryType: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {injuryTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">휴업일수</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={form.lostDays}
                    onChange={(e) => setForm((p) => ({ ...p, lostDays: e.target.value }))}
                    placeholder="0"
                    className="w-32 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">일 (사망·무휴업 시 0)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">재해 내용 <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="재해 발생 경위, 원인, 피해 상황 등을 상세히 작성해 주세요."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">취소</button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? '저장 중...' : editTarget ? '수정 완료' : '재해 신고'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
