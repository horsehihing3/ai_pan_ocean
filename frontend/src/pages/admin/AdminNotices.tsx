import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNoticesApi, createNoticeApi, updateNoticeApi, deleteNoticeApi } from '../../api/notices';

// [2026-04-17] 관리자 공지사항 관리 페이지

type Notice = {
  id: string; title: string; content: string; isPinned: boolean; createdAt: string; updatedAt: string;
};

const EMPTY_FORM = { title: '', content: '', isPinned: false };

export default function AdminNotices() {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Notice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [detailTarget, setDetailTarget] = useState<Notice | null>(null);
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => getNoticesApi().then((r) => r.data.data as Notice[]),
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof EMPTY_FORM) => createNoticeApi(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); closeForm(); },
    onError: (err: any) => setFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) => updateNoticeApi(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); closeForm(); },
    onError: (err: any) => setFormError(err.response?.data?.message || '저장에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNoticeApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
    onError: () => alert('삭제에 실패했습니다.'),
  });

  const openCreate = () => {
    setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true);
  };
  const openEdit = (n: Notice) => {
    setEditTarget(n); setForm({ title: n.title, content: n.content, isPinned: n.isPinned }); setFormError(''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditTarget(null); setForm(EMPTY_FORM); setFormError(''); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.title.trim() || !form.content.trim()) { setFormError('제목과 내용을 입력해 주세요.'); return; }
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: form });
    else createMutation.mutate(form);
  };

  const handleDelete = (n: Notice) => {
    if (confirm(`"${n.title}" 공지사항을 삭제하시겠습니까?`)) deleteMutation.mutate(n.id);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">공지사항 관리</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">
          + 공지 작성
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !notices.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">등록된 공지사항이 없습니다.</p>
            <button onClick={openCreate} className="px-4 py-2 bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-800">
              첫 번째 공지 작성
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['제목', '작성일', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notices.map((n) => (
                <tr key={n.id} className={`hover:bg-gray-50 transition-colors ${n.isPinned ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {n.isPinned && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">고정</span>
                      )}
                      <button onClick={() => setDetailTarget(n)} className="font-medium text-gray-800 hover:text-blue-700">
                        {n.title}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(n.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(n)} className="text-xs text-gray-500 hover:text-blue-700 border border-gray-200 px-2 py-1 rounded hover:border-blue-300 transition-colors">수정</button>
                      <button onClick={() => handleDelete(n)} className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-2 py-1 rounded hover:border-red-300 transition-colors">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 내용 상세 모달 */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {detailTarget.isPinned && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">고정</span>}
                <h2 className="text-lg font-bold text-gray-800">{detailTarget.title}</h2>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">{fmt(detailTarget.createdAt)}</p>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-4">
              {detailTarget.content}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { openEdit(detailTarget); setDetailTarget(null); }} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">수정</button>
              <button onClick={() => setDetailTarget(null)} className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 작성/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{editTarget ? '공지사항 수정' : '공지사항 작성'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="공지사항 제목"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 <span className="text-red-500">*</span></label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={6}
                  placeholder="공지사항 내용을 입력해 주세요."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm((p) => ({ ...p, isPinned: e.target.checked }))}
                  className="w-4 h-4 text-blue-700 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">상단 고정</span>
              </label>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">취소</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors">
                  {(createMutation.isPending || updateMutation.isPending) ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
