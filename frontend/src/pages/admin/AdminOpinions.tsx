import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllOpinionsApi, OPINION_TYPE_LABEL, type OpinionType,
} from '../../api/opinions';

// [2026-04-23] 관리자 근로자 의견조회 전체 목록

type Opinion = {
  id: string;
  type: OpinionType;
  title: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  company: { name: string; bizNo: string };
  submittedBy: { name: string };
};

const OPINION_TYPES: OpinionType[] = ['NEAR_MISS', 'ACCIDENT_REPORT', 'GENERAL'];

const TYPE_COLOR: Record<OpinionType, string> = {
  NEAR_MISS: 'bg-orange-100 text-orange-700',
  ACCIDENT_REPORT: 'bg-red-100 text-red-700',
  GENERAL: 'bg-blue-100 text-blue-700',
};

export default function AdminOpinions() {
  const [filterType, setFilterType] = useState<OpinionType | ''>('');
  const [detailTarget, setDetailTarget] = useState<Opinion | null>(null);

  const { data: opinions = [], isLoading } = useQuery<Opinion[]>({
    queryKey: ['opinions-admin', filterType],
    queryFn: () => getAllOpinionsApi(filterType || undefined).then((r) => r.data.data),
  });

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">근로자 의견조회 관리</h1>
        <p className="text-sm text-gray-500 mt-1">협력업체 근로자가 접수한 의견 전체를 조회합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">전체</div>
          <div className="text-2xl font-bold mt-1 text-gray-700">{opinions.length}</div>
        </div>
        {OPINION_TYPES.map((t) => (
          <div key={t} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">{OPINION_TYPE_LABEL[t]}</div>
            <div className="text-2xl font-bold mt-1 text-gray-700">
              {opinions.filter((o) => o.type === t).length}
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            filterType === '' ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          전체
        </button>
        {OPINION_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              filterType === t ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {OPINION_TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !opinions.length ? (
          <div className="p-12 text-center text-gray-400">접수된 의견이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['구분', '업체명', '제목', '제출자', '익명', '접수일', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opinions.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[o.type]}`}>
                      {OPINION_TYPE_LABEL[o.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{o.company.name}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.isAnonymous ? <span className="text-gray-400">익명</span> : o.submittedBy.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.isAnonymous ? 'Y' : 'N'}</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailTarget(o)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      상세
                    </button>
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
              <h2 className="text-lg font-bold text-gray-800">의견 상세</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3 text-sm mb-5">
              <div className="flex">
                <dt className="w-16 text-gray-500 shrink-0">구분</dt>
                <dd>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[detailTarget.type]}`}>
                    {OPINION_TYPE_LABEL[detailTarget.type]}
                  </span>
                </dd>
              </div>
              <div className="flex">
                <dt className="w-16 text-gray-500 shrink-0">업체명</dt>
                <dd className="text-gray-700">{detailTarget.company.name}</dd>
              </div>
              <div className="flex">
                <dt className="w-16 text-gray-500 shrink-0">제목</dt>
                <dd className="font-medium text-gray-800">{detailTarget.title}</dd>
              </div>
              <div className="flex">
                <dt className="w-16 text-gray-500 shrink-0">제출자</dt>
                <dd className="text-gray-700">
                  {detailTarget.isAnonymous ? '익명' : detailTarget.submittedBy.name}
                </dd>
              </div>
              <div className="flex">
                <dt className="w-16 text-gray-500 shrink-0">접수일</dt>
                <dd className="text-gray-700">{fmt(detailTarget.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 mb-1">내용</dt>
                <dd className="text-gray-800 bg-gray-50 rounded p-3 whitespace-pre-wrap">{detailTarget.content}</dd>
              </div>
            </div>
            <button
              onClick={() => setDetailTarget(null)}
              className="w-full py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
