import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHealthRecordsApi, getWorkerHistoryApi,
  createHealthRecordApi, deleteHealthRecordApi,
  addConsultationApi, deleteConsultationApi,
  uploadHealthFileApi, getHealthFileUrlApi, deleteHealthFileApi,
  type HealthData,
} from '../../api/health';

// [2026-04-19] 관리자 보건파트 페이지

type Consultation = { id: string; date: string; content: string; createdAt: string };
type HealthRecord = {
  id: string; workerName: string; bizNo: string; checkupYear: number;
  data: HealthData | null; s3Key: string | null; s3FileName: string | null; createdAt: string;
  consultations: Consultation[];
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3, CURRENT_YEAR - 4];

const DATA_FIELDS: { key: keyof HealthData; label: string; unit: string }[] = [
  { key: 'bloodPressureSystolic', label: '수축기혈압', unit: 'mmHg' },
  { key: 'bloodPressureDiastolic', label: '이완기혈압', unit: 'mmHg' },
  { key: 'bloodSugar', label: '혈당', unit: 'mg/dL' },
  { key: 'cholesterol', label: '콜레스테롤', unit: 'mg/dL' },
  { key: 'height', label: '신장', unit: 'cm' },
  { key: 'weight', label: '체중', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'result', label: '판정', unit: '' },
];

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

function emptyForm() {
  return { workerName: '', bizNo: '', checkupYear: CURRENT_YEAR, data: {} as HealthData };
}

export default function AdminHealth() {
  const queryClient = useQueryClient();

  // 필터
  const [filterName, setFilterName] = useState('');
  const [filterBizNo, setFilterBizNo] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // 모달 상태
  const [addOpen, setAddOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<HealthRecord | null>(null);
  const [consultTarget, setConsultTarget] = useState<HealthRecord | null>(null);
  const [newConsultDate, setNewConsultDate] = useState('');
  const [newConsultContent, setNewConsultContent] = useState('');

  // 추가 폼
  const [form, setForm] = useState(emptyForm());
  const [dataFields, setDataFields] = useState<Record<string, string>>({});

  // ── 쿼리 ──
  const { data: records = [], isLoading } = useQuery<HealthRecord[]>({
    queryKey: ['health', filterName, filterBizNo, filterYear],
    queryFn: () => getHealthRecordsApi({
      workerName: filterName || undefined,
      bizNo: filterBizNo || undefined,
      year: filterYear ? Number(filterYear) : undefined,
    }).then((r) => r.data.data),
  });

  const { data: history = [] } = useQuery<HealthRecord[]>({
    queryKey: ['health-history', historyTarget?.id],
    queryFn: () => getWorkerHistoryApi(historyTarget!.id).then((r) => r.data.data),
    enabled: !!historyTarget,
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: () => createHealthRecordApi({
      workerName: form.workerName,
      bizNo: form.bizNo,
      checkupYear: form.checkupYear,
      data: Object.fromEntries(
        Object.entries(dataFields)
          .filter(([, v]) => v !== '')
          .map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)])
      ) as HealthData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setAddOpen(false);
      setForm(emptyForm());
      setDataFields({});
    },
    onError: () => alert('저장에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHealthRecordApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health'] }),
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const addConsultMutation = useMutation({
    mutationFn: () => addConsultationApi(consultTarget!.id, { date: newConsultDate, content: newConsultContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      setNewConsultDate('');
      setNewConsultContent('');
      // 상담 모달 내 목록 갱신을 위해 consultTarget 갱신
      queryClient.invalidateQueries({ queryKey: ['health', filterName, filterBizNo, filterYear] });
    },
    onError: () => alert('상담 추가에 실패했습니다.'),
  });

  const deleteConsultMutation = useMutation({
    mutationFn: ({ recordId, consultId }: { recordId: string; consultId: string }) =>
      deleteConsultationApi(recordId, consultId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health'] }),
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadHealthFileApi(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health'] }),
    onError: () => alert('파일 업로드에 실패했습니다.'),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id: string) => deleteHealthFileApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health'] }),
    onError: () => alert('파일 삭제에 실패했습니다.'),
  });

  const handleDownload = async (id: string) => {
    try {
      const res = await getHealthFileUrlApi(id);
      const { url } = res.data.data;
      window.open(url, '_blank');
    } catch {
      alert('다운로드에 실패했습니다.');
    }
  };

  // consultTarget을 최신 데이터로 동기화
  const syncedConsultTarget = consultTarget
    ? records.find((r) => r.id === consultTarget.id) ?? consultTarget
    : null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">보건파트</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
        >
          + 건강기록 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '전체 기록', value: records.length, color: 'text-gray-700' },
          { label: '금년 검진', value: records.filter((r) => r.checkupYear === CURRENT_YEAR).length, color: 'text-blue-700' },
          { label: '총 근로자 수', value: new Set(records.map((r) => `${r.bizNo}|${r.workerName}`)).size, color: 'text-green-700' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="이름 검색"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="사업자번호"
          value={filterBizNo}
          onChange={(e) => setFilterBizNo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 연도</option>
          {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        {(filterName || filterBizNo || filterYear) && (
          <button
            onClick={() => { setFilterName(''); setFilterBizNo(''); setFilterYear(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            초기화
          </button>
        )}
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !records.length ? (
          <div className="p-8 text-center text-gray-400">건강기록이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['근로자명', '사업자번호', '검진연도', '판정', '상담이력', '병원자료', '등록일', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => {
                const result = (r.data as HealthData)?.result as string | undefined;
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setHistoryTarget(r)}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {r.workerName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.bizNo}</td>
                    <td className="px-4 py-3 text-gray-700">{r.checkupYear}년</td>
                    <td className="px-4 py-3">
                      {result ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          result === '정상' ? 'bg-green-100 text-green-700'
                          : result === '요주의' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {result}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConsultTarget(r)}
                        className="text-xs text-gray-500 hover:text-blue-700 underline"
                      >
                        {r.consultations.length}건
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {r.s3Key ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(r.id)}
                            className="text-xs text-blue-600 hover:underline truncate max-w-[120px]"
                            title={r.s3FileName ?? undefined}
                          >
                            {r.s3FileName ?? '파일'}
                          </button>
                          <button
                            onClick={() => { if (confirm('파일을 삭제하시겠습니까?')) deleteFileMutation.mutate(r.id); }}
                            className="text-xs text-red-400 hover:text-red-600 shrink-0"
                          >
                            삭제
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadFileMutation.mutate({ id: r.id, file });
                              e.target.value = '';
                            }}
                          />
                          <span className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                            업로드
                          </span>
                        </label>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{fmt(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMutation.mutate(r.id); }}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 건강기록 추가 모달 ── */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">건강기록 추가</h2>
              <button onClick={() => { setAddOpen(false); setForm(emptyForm()); setDataFields({}); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">근로자명 *</label>
                  <input
                    value={form.workerName}
                    onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">사업자번호 *</label>
                  <input
                    value={form.bizNo}
                    onChange={(e) => setForm({ ...form, bizNo: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000-00-00000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">검진연도 *</label>
                <select
                  value={form.checkupYear}
                  onChange={(e) => setForm({ ...form, checkupYear: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}년</option>)}
                </select>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 mb-3">검진 수치 (선택)</p>
                <div className="grid grid-cols-2 gap-3">
                  {DATA_FIELDS.map((f) => (
                    <div key={String(f.key)}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {f.label}{f.unit ? ` (${f.unit})` : ''}
                      </label>
                      <input
                        value={dataFields[String(f.key)] ?? ''}
                        onChange={(e) => setDataFields({ ...dataFields, [String(f.key)]: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={f.key === 'result' ? '정상 / 요주의 / 유소견' : ''}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setAddOpen(false); setForm(emptyForm()); setDataFields({}); }}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.workerName || !form.bizNo || createMutation.isPending}
                className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3개년 수치 팝업 ── */}
      {historyTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{historyTarget.workerName} — 연도별 수치</h2>
                <p className="text-xs text-gray-400 mt-0.5">사업자번호 {historyTarget.bizNo}</p>
              </div>
              <button onClick={() => setHistoryTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {history.length === 0 ? (
              <div className="text-center text-gray-400 py-8">불러오는 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200">항목</th>
                      {history.map((h) => (
                        <th key={h.id} className="px-4 py-2.5 text-center text-xs font-semibold text-gray-700 border border-gray-200">
                          {h.checkupYear}년
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DATA_FIELDS.map((f) => (
                      <tr key={String(f.key)} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-600 font-medium border border-gray-200">
                          {f.label}{f.unit ? ` (${f.unit})` : ''}
                        </td>
                        {history.map((h) => {
                          const val = (h.data as HealthData)?.[f.key];
                          const display = val !== undefined && val !== null && val !== '' ? String(val) : '-';
                          return (
                            <td key={h.id} className={`px-4 py-2.5 text-center border border-gray-200 ${
                              f.key === 'result' && display === '유소견' ? 'text-red-600 font-semibold'
                              : f.key === 'result' && display === '요주의' ? 'text-yellow-600 font-semibold'
                              : 'text-gray-700'
                            }`}>
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button onClick={() => setHistoryTarget(null)} className="px-5 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 상담이력 팝업 ── */}
      {syncedConsultTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">상담이력</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {syncedConsultTarget.workerName} · {syncedConsultTarget.checkupYear}년
                </p>
              </div>
              <button onClick={() => setConsultTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* 신규 상담 입력 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-3">새 상담 추가</p>
              <div className="space-y-2">
                <input
                  type="date"
                  value={newConsultDate}
                  onChange={(e) => setNewConsultDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={newConsultContent}
                  onChange={(e) => setNewConsultContent(e.target.value)}
                  rows={3}
                  placeholder="상담 내용을 입력하세요"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={() => addConsultMutation.mutate()}
                  disabled={!newConsultDate || !newConsultContent || addConsultMutation.isPending}
                  className="w-full py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {addConsultMutation.isPending ? '저장 중...' : '추가'}
                </button>
              </div>
            </div>

            {/* 기존 상담이력 목록 */}
            {syncedConsultTarget.consultations.length === 0 ? (
              <div className="text-center text-gray-400 py-6 text-sm">상담이력이 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {syncedConsultTarget.consultations.map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-500">{fmt(c.date)}</span>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{c.content}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('삭제하시겠습니까?'))
                            deleteConsultMutation.mutate({ recordId: syncedConsultTarget.id, consultId: c.id });
                        }}
                        className="text-xs text-red-400 hover:text-red-600 shrink-0"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button onClick={() => setConsultTarget(null)} className="px-5 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-800">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
