import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllOpinionsApi, replyOpinionApi, getOpinionFileUrlApi,
  OPINION_TYPE_LABEL, type OpinionType,
} from '../../api/opinions';

// [2026-04-23] 관리자 근로자 의견조회 — PPT 슬라이드 16 레이아웃

type Opinion = {
  id: string;
  type: OpinionType;
  title: string;
  content: string;
  isAnonymous: boolean;
  writerName: string | null;
  writerEmail: string | null;
  writerPhone: string | null;
  companyName: string | null;
  industry: string | null;
  fileName: string | null;
  fileKey: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  company: { name: string; bizNo: string };
  submittedBy: { name: string };
};

const OPINION_TYPES: OpinionType[] = ['NEAR_MISS', 'ACCIDENT_REPORT', 'GENERAL'];

const TYPE_COLOR: Record<OpinionType, string> = {
  NEAR_MISS: 'text-red-600',
  ACCIDENT_REPORT: 'text-gray-600',
  GENERAL: 'text-gray-600',
};

export default function AdminOpinions() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<OpinionType | ''>('');
  const [selected, setSelected] = useState<Opinion | null>(null);
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
      setSelected(res.data.data);
      setReplyText('');
      setReplyError('');
    },
    onError: (err: any) => setReplyError(err.response?.data?.message || '답변 저장에 실패했습니다.'),
  });

  const handleSelectRow = (o: Opinion) => {
    if (selected?.id === o.id) {
      setSelected(null);
      setReplyText('');
      setReplyError('');
    } else {
      setSelected(o);
      setReplyText(o.adminReply || '');
      setReplyError('');
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) { setReplyError('답변 내용을 입력해 주세요.'); return; }
    if (!selected) return;
    replyMutation.mutate({ id: selected.id, text: replyText });
  };

  const handleFileDownload = async (id: string) => {
    const res = await getOpinionFileUrlApi(id);
    window.open(res.data.data.url, '_blank');
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\. /g, '-').replace('.', '');

  const fmtDatetime = (d: string) =>
    new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const answeredCount = opinions.filter((o) => o.adminReply).length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">근로자 의견조회 관리</h1>
        <div className="flex gap-3 text-sm text-gray-500">
          <span>전체 <strong className="text-gray-800">{opinions.length}</strong>건</span>
          <span>미답변 <strong className="text-yellow-600">{opinions.length - answeredCount}</strong>건</span>
          <span>답변완료 <strong className="text-green-600">{answeredCount}</strong>건</span>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-3">
        {[{ label: '전체', value: '' }, ...OPINION_TYPES.map((t) => ({ label: OPINION_TYPE_LABEL[t], value: t }))].map(({ label, value }) => (
          <button key={value} onClick={() => { setFilterType(value as OpinionType | ''); setSelected(null); setReplyText(''); }}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${filterType === value ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ■ 전체 게시글 목록 */}
      <div className="mb-1 flex items-center gap-2">
        <span className="font-semibold text-gray-800 text-sm">■ 전체 게시글 목록</span>
      </div>
      <div className="bg-white border border-gray-300 overflow-hidden mb-6">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !opinions.length ? (
          <div className="p-8 text-center text-gray-400">접수된 의견이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-12">No</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-32">분류</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">제목</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-28">업체명</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-12">댓글</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 w-28">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {opinions.map((o, i) => (
                <tr
                  key={o.id}
                  onClick={() => handleSelectRow(o)}
                  className={`cursor-pointer transition-colors ${selected?.id === o.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-2.5 text-center text-gray-500">{opinions.length - i}</td>
                  <td className={`px-4 py-2.5 text-center text-sm font-medium ${TYPE_COLOR[o.type]}`}>[{OPINION_TYPE_LABEL[o.type]}]</td>
                  <td className="px-4 py-2.5 text-gray-800">
                    <span>{o.title}</span>
                    {o.adminReply && <span className="ml-2 text-xs text-green-600">A: 답변완료</span>}
                    {!o.adminReply && <span className="ml-2 text-xs text-yellow-500">미답변</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-500 text-xs">{o.company.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={o.adminReply ? 'text-red-500 font-bold' : 'text-gray-400'}>{o.adminReply ? 1 : 0}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-500">{fmt(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ■ 상세 내용 */}
      {selected && (
        <div>
          <div className="mb-1 font-semibold text-gray-800 text-sm">■ 상세 내용</div>
          <div className="bg-white border border-gray-300 mb-6">
            {/* 제목 */}
            <div className="px-5 py-4 border-b border-gray-200">
              <p className="text-base font-medium text-gray-900">{selected.title}</p>
            </div>
            {/* 메타 */}
            <div className="grid grid-cols-4 border-b border-gray-200 text-sm text-gray-600">
              <div className="px-5 py-2.5 border-r border-gray-200">
                작성자: {selected.isAnonymous ? '익명' : (selected.writerName || selected.submittedBy.name)}
              </div>
              <div className="px-5 py-2.5 border-r border-gray-200">분류: {OPINION_TYPE_LABEL[selected.type]}</div>
              <div className="px-5 py-2.5 border-r border-gray-200">업체: {selected.company.name}</div>
              <div className="px-5 py-2.5">등록일: {fmt(selected.createdAt)}</div>
            </div>
            {/* 본문 */}
            <div className="px-5 py-5 min-h-[120px]">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selected.content}</p>
              {selected.fileName && (
                <p className="mt-4 text-sm text-gray-500">
                  첨부파일 :{' '}
                  <button onClick={() => handleFileDownload(selected.id)} className="text-blue-600 hover:underline">
                    {selected.fileName}
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* ■ 의견 및 답변 */}
          <div className="mb-1 font-semibold text-gray-800 text-sm">
            ■ 의견 및 답변 ({selected.adminReply ? 1 : 0})
          </div>
          <div className="bg-white border border-gray-300">
            {selected.adminReply && (
              <>
                <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
                  <span className="text-sm font-medium text-green-600">
                    ↳ 안전경영팀 | {selected.repliedAt ? fmtDatetime(selected.repliedAt) : ''}
                  </span>
                </div>
                <div className="px-5 py-4 border-b border-gray-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selected.adminReply}</p>
                </div>
              </>
            )}
            {/* 답변 입력창 */}
            <div className="px-5 py-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {selected.adminReply ? '답변 수정' : '답변 작성'}
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="답변 내용을 입력해 주세요."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              />
              {replyError && <p className="text-xs text-red-500 mb-2">{replyError}</p>}
              <div className="flex justify-end">
                <button
                  onClick={handleReply}
                  disabled={replyMutation.isPending}
                  className="px-6 py-2 bg-blue-700 text-white text-sm font-medium rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {replyMutation.isPending ? '저장 중...' : selected.adminReply ? '수정 등록' : '답변 등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
