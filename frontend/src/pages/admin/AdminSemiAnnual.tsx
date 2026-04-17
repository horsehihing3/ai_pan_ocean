import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQuestionsApi, getSummaryApi, getSemiAnnualsApi } from '../../api/semiAnnual';

// [2026-04-17] 관리자 반기평가 집계 페이지

type Question = { id: string; category: string; text: string; avg: number | null; count: number };
type SemiAnnual = {
  id: string; year: number; half: number;
  content: Record<string, string> | null;
  workerOpinion: string | null;
  submittedAt: string | null;
  company: { name: string; bizNo: string };
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

const avgColor = (avg: number | null) => {
  if (!avg) return 'text-gray-400';
  if (avg >= 4) return 'text-green-600';
  if (avg >= 3) return 'text-blue-600';
  if (avg >= 2) return 'text-yellow-600';
  return 'text-red-600';
};

const avgBar = (avg: number | null) => {
  if (!avg) return 0;
  return Math.round((avg / 5) * 100);
};

export default function AdminSemiAnnual() {
  const [tab, setTab] = useState<'summary' | 'list'>('summary');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [half, setHalf] = useState(CURRENT_HALF);
  const [detailTarget, setDetailTarget] = useState<SemiAnnual | null>(null);

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ['semi-annual-questions'],
    queryFn: () => getQuestionsApi().then((r) => r.data.data),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['semi-annual-summary', year, half],
    queryFn: () => getSummaryApi(year, half).then((r) => r.data.data as {
      submissions: SemiAnnual[];
      averages: Question[];
      total: number;
    }),
  });

  const { data: allList = [], isLoading: listLoading } = useQuery<SemiAnnual[]>({
    queryKey: ['semi-annual-all'],
    queryFn: () => getSemiAnnualsApi().then((r) => r.data.data),
    enabled: tab === 'list',
  });

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // 카테고리별 그룹 (평균 데이터)
  const grouped = (summary?.averages || []).reduce<Record<string, Question[]>>((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {});

  const yearOptions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">반기평가 관리</h1>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'summary', label: '기간별 집계' },
          { key: 'list', label: '전체 제출 현황' },
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

      {/* ── 기간별 집계 탭 ── */}
      {tab === 'summary' && (
        <>
          {/* 기간 선택 */}
          <div className="flex gap-3 mb-6">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select
              value={half}
              onChange={(e) => setHalf(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>상반기</option>
              <option value={2}>하반기</option>
            </select>
          </div>

          {summaryLoading ? (
            <div className="p-8 text-center text-gray-400">불러오는 중...</div>
          ) : !summary || summary.total === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-400">{year}년 {half === 1 ? '상반기' : '하반기'} 제출된 반기평가가 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 요약 카드 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">제출 업체 수</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">{summary.total}개사</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">전체 평균점수</div>
                  <div className={`text-2xl font-bold mt-1 ${avgColor(
                    summary.averages.reduce((s, q) => s + (q.avg || 0), 0) / summary.averages.filter((q) => q.avg).length
                  )}`}>
                    {(summary.averages.reduce((s, q) => s + (q.avg || 0), 0) / summary.averages.filter((q) => q.avg).length).toFixed(1)}점
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-500">근로자 의견 작성</div>
                  <div className="text-2xl font-bold text-gray-700 mt-1">
                    {summary.submissions.filter((s) => s.workerOpinion).length}건
                  </div>
                </div>
              </div>

              {/* 항목별 평균 */}
              <div className="space-y-4 mb-6">
                {Object.entries(grouped).map(([category, qs]) => (
                  <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-700">
                      {category}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {qs.map((q, i) => (
                        <div key={q.id} className="px-5 py-4 flex items-center gap-4">
                          <span className="text-xs text-gray-400 w-6 shrink-0">Q{questions.findIndex((x) => x.id === q.id) + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{q.text}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${q.avg && q.avg >= 4 ? 'bg-green-500' : q.avg && q.avg >= 3 ? 'bg-blue-500' : q.avg && q.avg >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${avgBar(q.avg)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{q.count}개사 응답</span>
                            </div>
                          </div>
                          <div className={`text-lg font-bold shrink-0 ${avgColor(q.avg)}`}>
                            {q.avg !== null ? `${q.avg}` : '-'}
                            <span className="text-xs font-normal text-gray-400">/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 제출 업체 목록 */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">제출 업체 목록</h2>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['업체명', '평균점수', '근로자 의견', '제출일', ''].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.submissions.map((s) => {
                      const scores = questions.map((q) => Number(s.content?.[q.id] || 0)).filter((v) => v > 0);
                      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <button onClick={() => setDetailTarget(s)} className="font-medium text-blue-700 hover:underline">
                              {s.company.name}
                            </button>
                            <div className="text-xs text-gray-400">{s.company.bizNo}</div>
                          </td>
                          <td className={`px-4 py-3 font-semibold ${avgColor(typeof avg === 'string' && avg !== '-' ? Number(avg) : null)}`}>
                            {avg !== '-' ? `${avg}점` : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-xs">
                            <span className="truncate block">{s.workerOpinion || <span className="text-gray-300">없음</span>}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{s.submittedAt ? fmt(s.submittedAt) : '-'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setDetailTarget(s)} className="text-xs text-gray-400 hover:text-gray-600">상세</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ── 전체 제출 현황 탭 ── */}
      {tab === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {listLoading ? (
            <div className="p-8 text-center text-gray-400">불러오는 중...</div>
          ) : !allList.length ? (
            <div className="p-8 text-center text-gray-400">제출된 반기평가가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['업체명', '평가 기간', '상태', '제출일', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allList.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailTarget(s)} className="font-medium text-blue-700 hover:underline">
                        {s.company.name}
                      </button>
                      <div className="text-xs text-gray-400">{s.company.bizNo}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.year}년 {s.half === 1 ? '상반기' : '하반기'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.submittedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {s.submittedAt ? '제출완료' : '작성중'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.submittedAt ? fmt(s.submittedAt) : '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailTarget(s)} className="text-xs text-gray-400 hover:text-gray-600">상세</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{detailTarget.company.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {detailTarget.year}년 {detailTarget.half === 1 ? '상반기' : '하반기'} 반기평가
                </p>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-5">
              {/* 항목별 응답 */}
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const answer = detailTarget.content?.[q.id];
                  return (
                    <div key={q.id} className="flex items-start gap-3">
                      <span className="text-xs text-gray-400 mt-0.5 w-6 shrink-0">Q{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">{q.text}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${Number(answer) >= 4 ? 'bg-green-500' : Number(answer) >= 3 ? 'bg-blue-500' : Number(answer) >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: answer ? `${(Number(answer) / 5) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ${avgColor(answer ? Number(answer) : null)}`}>
                            {answer ? `${answer}점 (${SCORE_LABELS[answer]})` : '미응답'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 근로자 의견 */}
              {detailTarget.workerOpinion && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">근로자 의견</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailTarget.workerOpinion}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button onClick={() => setDetailTarget(null)} className="w-full py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
