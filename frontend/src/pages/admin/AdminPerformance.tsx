// [2026-04-18] 관리자 안전보건실적 종합 조회 + 엑셀 다운로드
// [2026-04-21] 디자인 표준화
import React, { useEffect, useState } from 'react';
import { getPerformancesApi, getSummaryApi, deletePerformanceApi } from '../../api/performance';

interface Performance {
  id: string;
  year: number;
  month: number;
  department: string;
  category: string;
  value: number;
  note: string | null;
}

interface Summary {
  year: number;
  departments: string[];
  categories: string[];
  byMonth: { month: number; count: number; entries: Performance[] }[];
  total: number;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const MONTHS = [0, ...Array.from({ length: 12 }, (_, i) => i + 1)];

type Tab = 'list' | 'summary';

export default function AdminPerformance() {
  const [tab, setTab] = useState<Tab>('list');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(0);
  const [department, setDepartment] = useState('');
  const [list, setList] = useState<Performance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'list') fetchList();
    else fetchSummary();
  }, [tab, year, month, department]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params: any = { year };
      if (month > 0) params.month = month;
      if (department) params.department = department;
      const r = await getPerformancesApi(params);
      setList(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const r = await getSummaryApi(year);
      setSummary(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await deletePerformanceApi(id);
    fetchList();
  };

  const downloadCsv = () => {
    const headers = ['연도', '월', '부서', '카테고리', '실적값', '비고'];
    const rows = list.map((p) => [p.year, p.month, p.department, p.category, p.value, p.note || '']);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `안전보건실적_${year}년${month > 0 ? `_${month}월` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">안전보건실적 조회</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['list', 'summary'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'list' ? '전체 목록' : '월별 집계'}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>

        {tab === 'list' && (
          <>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m === 0 ? '전체 월' : `${m}월`}</option>
              ))}
            </select>
            <input
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="부서 검색"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <button
              onClick={downloadCsv}
              className="ml-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              엑셀 다운로드
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
          불러오는 중...
        </div>
      ) : tab === 'list' ? (
        <ListTab list={list} onDelete={handleDelete} />
      ) : (
        <SummaryTab summary={summary} />
      )}
    </div>
  );
}

function ListTab({ list, onDelete }: { list: Performance[]; onDelete: (id: string) => void }) {
  if (list.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
        조회된 실적이 없습니다.
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
        총 <span className="font-semibold text-gray-800">{list.length}</span>건
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {['연도', '월', '부서', '카테고리', '실적값', '비고', ''].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {list.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600">{p.year}</td>
              <td className="px-4 py-3 text-gray-600">{p.month}월</td>
              <td className="px-4 py-3 font-medium text-gray-800">{p.department}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {p.category}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-700">{p.value.toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-500">{p.note || '-'}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onDelete(p.id)}
                  className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded hover:border-red-300 transition-colors"
                >삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTab({ summary }: { summary: Summary | null }) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  if (!summary) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 실적 건수', value: summary.total, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: '참여 부서 수', value: summary.departments.length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: '활용 카테고리 수', value: summary.categories.length, color: 'text-purple-700', bg: 'bg-purple-50' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-lg border border-gray-200 p-4 text-center`}>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* 월별 집계 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
          {summary.year}년 월별 현황
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['월', '입력 건수', '참여 부서', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summary.byMonth.filter((m) => m.count > 0).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">입력된 실적이 없습니다.</td>
              </tr>
            ) : (
              summary.byMonth.filter((m) => m.count > 0).map((m) => {
                const depts = [...new Set(m.entries.map((e) => e.department))];
                return (
                  <React.Fragment key={m.month}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{m.month}월</td>
                      <td className="px-4 py-3 text-gray-600">{m.count}건</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{depts.join(', ')}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                          className="text-xs text-blue-700 hover:underline"
                        >
                          {expandedMonth === m.month ? '접기' : '펼치기'}
                        </button>
                      </td>
                    </tr>
                    {expandedMonth === m.month && m.entries.map((e) => (
                      <tr key={e.id} className="bg-blue-50 transition-colors text-xs">
                        <td className="px-8 py-1.5 text-gray-500">{e.department}</td>
                        <td className="px-4 py-1.5 font-mono text-gray-700">{e.value.toLocaleString()}</td>
                        <td className="px-4 py-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-1.5 text-gray-500">{e.note || ''}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
