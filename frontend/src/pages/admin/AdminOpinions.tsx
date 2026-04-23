import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllOpinionsApi, replyOpinionApi,
  OPINION_TYPE_LABEL, type OpinionType,
} from '../../api/opinions';

// [2026-04-23] 관리자 근로자 의견조회 + 답변 작성

type Opinion = {
  id: string;
  type: OpinionType;
  title: string;
  content: string;
  isAnonymous: boolean;
  adminReply: string | null;
  repliedAt: string | null;
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
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<OpinionType | ''>('');
  const [detailTarget, setDetailTarget] = useState<Opinion | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');

  const { data: opinions = [], isLoading } = useQuery<Opinion[]>({
    queryKey: ['opinions-admin', filterType],
    queryFn: () => getAllOpinionsApi(filterType || undefined).then((r) => r.data.data),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => replyOpinionApi(id, text),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['opinions-admin'] });
      setDetailTarget(res.data.data);
      setReplyText('');
      setReplyError('');
    },
    onError: (err: any) => setReplyError(err.response?.data?.message || '답변 저장에 실패했습니다.'),
  });

  const openDetail = (o: Opinion) => {
    setDetailTarget(o);
    setReplyText(o.adminReply || '');
    setReplyError('');
  };

  const closeDetail = () => {
    setDetailTarget(null);
    setReplyText('');
    setReplyError('');
  };

  const handleReply = () => {
    if (!replyText.trim()) { setReplyError('답변 내용을 입력해 주세요.'); return; }
    if (!detailTarget) return;
    replyMutation.mutate({ id: detailTarget.id, text: replyText });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const answeredCount = opinions.filter((o) => o.adminReply).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">근로자 의견조회 관리</h1>
        <p className="text-sm text-gray-500 mt-1">협력업체 근로자 의견을 조회하고 답변을 작성합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
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
        <div className="bg-white rounded-lg border border-green-200 p-4">
          <div className="text-sm text-gray-500">답변완료</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{answeredCount}</div>
        </div>
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
                {['구분', '업체명', '제목', '제출자', '답변', '접수일', ''].map((h) => (
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
                  <td className="px-4 py-3">
                    {o.adminReply ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        답변완료
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                        미답변
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(o)}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      {o.adminReply ? '상세' : '답변'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 + 답변 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">의견 상세 및 답변</h2>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* 의견 내용 */}
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

            {/* 답변 작성/수정 */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                안전경영팀 답변
                {detailTarget.adminReply && detailTarget.repliedAt && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    (최종 답변: {fmt(detailTarget.repliedAt)})
                  </span>
                )}
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="답변 내용을 입력해 주세요."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              />
              {replyError && <p className="text-xs text-red-500 mb-2">{replyError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={closeDetail}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={handleReply}
                  disabled={replyMutation.isPending}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {replyMutation.isPending ? '저장 중...' : detailTarget.adminReply ? '답변 수정' : '답변 등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
