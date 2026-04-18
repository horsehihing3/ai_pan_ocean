// [2026-04-18] 관리자 안전보건실적 종합 조회 + 엑셀 다운로드
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
  const [month, setMonth] = useState(0); // 0 = 전체
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

  // CSV 다운로드
  const downloadCsv = () => {
    const headers = ['연도', '월', '부서', '카테고리', '실적값', '비고'];
    const rows = list.map((p) => [p.year, p.month, p.department, p.category, p.value, p.note || '']);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `안전보건실적_${year}년${month > 0 ? `_${month}월` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">안전보건실적 조회</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b">
        {(['list', 'summary'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'list' ? '전체 목록' : '월별 집계'}
          </button>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>

        {tab === 'list' && (
          <>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m === 0 ? '전체 월' : `${m}월`}</option>
              ))}
            </select>
            <input
              className="border rounded px-3 py-2 text-sm"
              placeholder="부서 검색"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <button
              onClick={downloadCsv}
              className="ml-auto bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
            >
              엑셀 다운로드
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
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
    return <div className="text-center py-12 text-gray-400">조회된 실적이 없습니다.</div>;
  }
  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 text-sm text-gray-600">
        총 <span className="font-semibold text-gray-800">{list.length}</span>건
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left text-gray-600">연도</th>
            <th className="px-4 py-2 text-left text-gray-600">월</th>
            <th className="px-4 py-2 text-left text-gray-600">부서</th>
            <th className="px-4 py-2 text-left text-gray-600">카테고리</th>
            <th className="px-4 py-2 text-right text-gray-600">실적값</th>
            <th className="px-4 py-2 text-left text-gray-600">비고</th>
            <th className="px-4 py-2 text-center text-gray-600">삭제</th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{p.year}</td>
              <td className="px-4 py-2">{p.month}월</td>
              <td className="px-4 py-2 font-medium text-gray-800">{p.department}</td>
              <td className="px-4 py-2">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{p.category}</span>
              </td>
              <td className="px-4 py-2 text-right font-mono">{p.value.toLocaleString()}</td>
              <td className="px-4 py-2 text-gray-500">{p.note || '-'}</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => onDelete(p.id)}
                  className="text-red-500 hover:underline text-xs"
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
  if (!summary) return <div className="text-center py-12 text-gray-400">데이터가 없습니다.</div>;

  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
          <div className="text-sm text-gray-500 mt-1">전체 실적 건수</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{summary.departments.length}</div>
          <div className="text-sm text-gray-500 mt-1">참여 부서 수</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-purple-600">{summary.categories.length}</div>
          <div className="text-sm text-gray-500 mt-1">활용 카테고리 수</div>
        </div>
      </div>

      {/* 월별 집계 */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-700">
          {summary.year}년 월별 현황
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600">월</th>
              <th className="px-4 py-2 text-right text-gray-600">입력 건수</th>
              <th className="px-4 py-2 text-left text-gray-600">참여 부서</th>
              <th className="px-4 py-2 text-center text-gray-600">상세</th>
            </tr>
          </thead>
          <tbody>
            {summary.byMonth.filter((m) => m.count > 0).map((m) => {
              const depts = [...new Set(m.entries.map((e) => e.department))];
              return (
                <React.Fragment key={m.month}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{m.month}월</td>
                    <td className="px-4 py-2 text-right">{m.count}건</td>
                    <td className="px-4 py-2 text-gray-600 text-xs">{depts.join(', ')}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {expandedMonth === m.month ? '접기' : '펼치기'}
                      </button>
                    </td>
                  </tr>
                  {expandedMonth === m.month && m.entries.map((e) => (
                    <tr key={e.id} className="bg-blue-50 border-b text-xs">
                      <td className="px-8 py-1.5 text-gray-500">{e.department}</td>
                      <td className="px-4 py-1.5 text-right font-mono text-gray-700">{e.value.toLocaleString()}</td>
                      <td className="px-4 py-1.5">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{e.category}</span>
                      </td>
                      <td className="px-4 py-1.5 text-gray-500">{e.note || ''}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
            {summary.byMonth.every((m) => m.count === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">입력된 실적이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
