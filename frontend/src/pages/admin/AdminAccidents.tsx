import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccidentsApi, getInjuryTypesApi, getAccidentStatsApi, deleteAccidentApi } from '../../api/accidents';
import { getCompaniesApi } from '../../api/companies';

// [2026-04-17] 관리자 산업재해 LIST 페이지

type Accident = {
  id: string; occurredAt: string; location: string | null; description: string;
  workerName: string | null; injuryType: string | null; lostDays: number | null;
  createdAt: string; company: { name: string; bizNo: string };
};
type Company = { id: string; name: string; bizNo: string };

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminAccidents() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'list' | 'stats'>('list');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [statsYear, setStatsYear] = useState(CURRENT_YEAR);
  const [detailTarget, setDetailTarget] = useState<Accident | null>(null);

  const { data: accidents = [], isLoading } = useQuery<Accident[]>({
    queryKey: ['accidents-admin', filterCompany, filterYear, filterType],
    queryFn: () => getAccidentsApi({
      companyId: filterCompany || undefined,
      year: filterYear ? Number(filterYear) : undefined,
      injuryType: filterType || undefined,
    }).then((r) => r.data.data),
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ['companies-admin'],
    queryFn: () => getCompaniesApi().then((r) => r.data.data),
  });

  const { data: injuryTypes = [] } = useQuery<string[]>({
    queryKey: ['injury-types'],
    queryFn: () => getInjuryTypesApi().then((r) => r.data.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['accident-stats', statsYear],
    queryFn: () => getAccidentStatsApi(statsYear).then((r) => r.data.data as {
      total: number; totalLostDays: number;
      byMonth: { month: number; count: number }[];
      byType: { type: string; count: number }[];
    }),
    enabled: tab === 'stats',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAccidentApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accidents-admin'] });
      setDetailTarget(null);
    },
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const fmtDatetime = (d: string) =>
    new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];

  const maxMonthCount = stats ? Math.max(...stats.byMonth.map((m) => m.count), 1) : 1;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">산업재해 LIST</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'list', label: '재해 목록' },
          { key: 'stats', label: '연도별 통계' },
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

      {/* ── 재해 목록 탭 ── */}
      {tab === 'list' && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: '전체 재해', value: accidents.length, color: 'text-gray-700' },
              { label: '사망', value: accidents.filter((a) => a.injuryType === '사망').length, color: 'text-red-700' },
              { label: '총 휴업일수', value: `${accidents.reduce((s, a) => s + (a.lostDays || 0), 0)}일`, color: 'text-orange-600' },
              { label: '해당 업체 수', value: new Set(accidents.map((a) => a.company.name)).size, color: 'text-blue-700' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-500">{c.label}</div>
                <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
              </div>
            ))}
          </div>

          {/* 필터 */}
          <div className="flex gap-3 mb-4">
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 업체</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 연도</option>
              {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 유형</option>
              {injuryTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {(filterCompany || filterYear || filterType) && (
              <button
                onClick={() => { setFilterCompany(''); setFilterYear(''); setFilterType(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                필터 초기화
              </button>
            )}
          </div>

          {/* 목록 테이블 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : !accidents.length ? (
              <div className="p-8 text-center text-gray-400">재해 기록이 없습니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['업체명', '발생일시', '발생 장소', '피재자', '재해 유형', '휴업일수', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accidents.map((a) => (
                    <tr key={a.id} className={`hover:bg-gray-50 transition-colors ${a.injuryType === '사망' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => setDetailTarget(a)} className="font-medium text-blue-700 hover:underline">
                          {a.company.name}
                        </button>
                        <div className="text-xs text-gray-400">{a.company.bizNo}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDatetime(a.occurredAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{a.location || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.workerName || '-'}</td>
                      <td className="px-4 py-3">
                        {a.injuryType ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${a.injuryType === '사망' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                            {a.injuryType}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{a.lostDays !== null ? `${a.lostDays}일` : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setDetailTarget(a)} className="text-xs text-gray-400 hover:text-gray-600">상세</button>
                          <button
                            onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMutation.mutate(a.id); }}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── 연도별 통계 탭 ── */}
      {tab === 'stats' && (
        <>
          <div className="flex gap-3 mb-6">
            <select
              value={statsYear}
              onChange={(e) => setStatsYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>

          {!stats ? (
            <div className="p-8 text-center text-gray-400">불러오는 중...</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: `${statsYear}년 총 재해`, value: `${stats.total}건`, color: 'text-red-600' },
                  { label: '총 휴업일수', value: `${stats.totalLostDays}일`, color: 'text-orange-600' },
                  { label: '발생 유형 수', value: `${stats.byType.length}종`, color: 'text-gray-700' },
                ].map((c) => (
                  <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-sm text-gray-500">{c.label}</div>
                    <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 월별 발생 현황 */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">월별 발생 현황</h2>
                  <div className="space-y-2">
                    {stats.byMonth.map((m) => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-6 text-right shrink-0">{m.month}월</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-red-500 h-5 rounded-full flex items-center justify-end pr-2 transition-all"
                            style={{ width: m.count > 0 ? `${Math.max((m.count / maxMonthCount) * 100, 10)}%` : '0%' }}
                          >
                            {m.count > 0 && <span className="text-white text-xs font-semibold">{m.count}</span>}
                          </div>
                        </div>
                        {m.count === 0 && <span className="text-xs text-gray-400">0</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 재해 유형별 */}
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <h2 className="text-sm font-semibold text-gray-700 mb-4">재해 유형별 현황</h2>
                  {stats.byType.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">데이터 없음</div>
                  ) : (
                    <div className="space-y-3">
                      {stats.byType
                        .sort((a, b) => b.count - a.count)
                        .map((t) => (
                          <div key={t.type} className="flex items-center gap-3">
                            <span className="text-sm text-gray-700 w-20 shrink-0">{t.type}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                              <div
                                className={`h-4 rounded-full ${t.type === '사망' ? 'bg-red-600' : 'bg-orange-400'}`}
                                style={{ width: `${(t.count / stats.total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                              {t.count}건 ({Math.round((t.count / stats.total) * 100)}%)
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">재해 상세</h2>
                <p className="text-xs text-gray-400 mt-0.5">{detailTarget.company.name}</p>
              </div>
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
                  <dd className={`font-medium ${label === '재해 유형' && detailTarget.injuryType === '사망' ? 'text-red-600' : 'text-gray-800'}`}>{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-gray-500 mb-1">재해 내용</dt>
                <dd className="text-gray-800 bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap">{detailTarget.description}</dd>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMutation.mutate(detailTarget.id); }}
                className="flex-1 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
              >
                삭제
              </button>
              <button onClick={() => setDetailTarget(null)} className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
