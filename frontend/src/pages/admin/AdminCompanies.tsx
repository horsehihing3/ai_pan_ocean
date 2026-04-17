import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompaniesApi, toggleWatchlistApi } from '../../api/companies';

// [2026-04-17] 관리자 협력업체 관리 페이지

type Company = {
  id: string; name: string; bizNo: string; ceoName: string; address: string;
  bizType: string; mainContact: string | null; isWatchlist: boolean; createdAt: string;
  _count: { visitRequests: number; evaluations: number; accidents: number };
};

export default function AdminCompanies() {
  const [search, setSearch] = useState('');
  const [watchOnly, setWatchOnly] = useState(false);
  const [detail, setDetail] = useState<Company | null>(null);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-admin'],
    queryFn: () => getCompaniesApi().then((r) => r.data.data as Company[]),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleWatchlistApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies-admin'] }),
    onError: () => alert('처리에 실패했습니다.'),
  });

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.bizNo.includes(q);
    const matchWatch = !watchOnly || c.isWatchlist;
    return matchSearch && matchWatch;
  });

  const watchCount = companies.filter((c) => c.isWatchlist).length;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">협력업체 관리</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '전체 업체', value: companies.length, color: 'text-gray-700', bg: 'bg-white' },
          { label: '요주의 업체', value: watchCount, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '검색 결과', value: filtered.length, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-lg border border-gray-200 p-4`}>
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 검색/필터 */}
      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="업체명 또는 사업자번호 검색"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setWatchOnly((v) => !v)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${watchOnly ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          요주의만 보기
        </button>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !filtered.length ? (
          <div className="p-8 text-center text-gray-400">
            {search || watchOnly ? '검색 결과가 없습니다.' : '등록된 협력업체가 없습니다.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['업체명', '사업자번호', '대표자', '업종', '출입신청', '평가', '등록일', '요주의', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((co) => (
                <tr key={co.id} className={`hover:bg-gray-50 transition-colors ${co.isWatchlist ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(co)} className="font-medium text-blue-700 hover:underline">
                      {co.name}
                    </button>
                    {co.isWatchlist && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">요주의</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{co.bizNo}</td>
                  <td className="px-4 py-3 text-gray-600">{co.ceoName}</td>
                  <td className="px-4 py-3 text-gray-500">{co.bizType || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{co._count.visitRequests}건</td>
                  <td className="px-4 py-3 text-gray-700">{co._count.evaluations}건</td>
                  <td className="px-4 py-3 text-gray-500">{fmt(co.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMutation.mutate(co.id)}
                      disabled={toggleMutation.isPending}
                      className={`w-9 h-5 rounded-full transition-colors relative ${co.isWatchlist ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${co.isWatchlist ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(co)} className="text-xs text-gray-400 hover:text-gray-600">상세</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 모달 */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">{detail.name}</h2>
                {detail.isWatchlist && (
                  <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">요주의</span>
                )}
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-2 text-sm mb-5">
              {[
                { label: '사업자번호', value: detail.bizNo },
                { label: '대표자', value: detail.ceoName },
                { label: '업종', value: detail.bizType || '-' },
                { label: '주소', value: detail.address || '-' },
                { label: '주담당자', value: detail.mainContact || '-' },
                { label: '등록일', value: fmt(detail.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-28 text-gray-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-gray-800">{value}</dd>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: '출입신청', value: detail._count.visitRequests },
                { label: '평가', value: detail._count.evaluations },
                { label: '재해', value: detail._count.accidents },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">{s.label}</div>
                  <div className="text-lg font-bold text-gray-800 mt-1">{s.value}건</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { toggleMutation.mutate(detail.id); setDetail(null); }}
                className={`flex-1 py-2 text-sm rounded transition-colors ${
                  detail.isWatchlist
                    ? 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {detail.isWatchlist ? '요주의 해제' : '요주의 지정'}
              </button>
              <button onClick={() => setDetail(null)} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
