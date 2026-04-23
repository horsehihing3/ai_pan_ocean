import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOpinionApi, getMyOpinionsApi,
  OPINION_TYPE_LABEL, type OpinionType,
} from '../../api/opinions';

// [2026-04-23] 협력업체 근로자 의견조회 (PPT 슬라이드 16, 17)

type Opinion = {
  id: string;
  type: OpinionType;
  title: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  submittedBy: { name: string };
};

const OPINION_TYPES: OpinionType[] = ['NEAR_MISS', 'ACCIDENT_REPORT', 'GENERAL'];

const CONSENT_TEXT = `[개인정보 수집·이용 동의]

1. 수집·이용 목적: 근로자 의견 접수 및 처리, 산업재해 예방
2. 수집 항목: 성명(선택), 의견 내용, 제출 일시
3. 보유·이용 기간: 접수일로부터 5년
4. 동의를 거부할 권리가 있으며, 거부 시 의견 접수가 제한됩니다.

위 개인정보 수집·이용에 동의하십니까?`;

const EMPTY_FORM = { type: 'GENERAL' as OpinionType, title: '', content: '', isAnonymous: false };

export default function PartnerOpinions() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [detailTarget, setDetailTarget] = useState<Opinion | null>(null);

  const { data: opinions = [], isLoading } = useQuery<Opinion[]>({
    queryKey: ['opinions-my'],
    queryFn: () => getMyOpinionsApi().then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createOpinionApi>[0]) => createOpinionApi(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opinions-my'] });
      closeForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '등록에 실패했습니다.'),
  });

  const openForm = () => {
    setForm(EMPTY_FORM);
    setConsentAgreed(false);
    setFormError('');
    setShowConsent(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setShowConsent(false);
    setConsentAgreed(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleConsentAgree = () => {
    setConsentAgreed(true);
    setShowConsent(false);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('제목을 입력해 주세요.'); return; }
    if (!form.content.trim()) { setFormError('내용을 입력해 주세요.'); return; }
    createMutation.mutate({ ...form, consentAgreed: true });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const TYPE_COLOR: Record<OpinionType, string> = {
    NEAR_MISS: 'bg-orange-100 text-orange-700',
    ACCIDENT_REPORT: 'bg-red-100 text-red-700',
    GENERAL: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">근로자 의견조회</h1>
          <p className="text-sm text-gray-500 mt-1">아차사고, 산업재해조사표, 일반문의를 접수할 수 있습니다.</p>
        </div>
        <button
          onClick={openForm}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          + 의견 등록
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {OPINION_TYPES.map((t) => (
          <div key={t} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">{OPINION_TYPE_LABEL[t]}</div>
            <div className="text-2xl font-bold mt-1 text-gray-700">
              {opinions.filter((o) => o.type === t).length}
            </div>
          </div>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !opinions.length ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-2">접수된 의견이 없습니다.</p>
            <p className="text-sm text-gray-400">아차사고·재해·건의사항 등을 등록해 주세요.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['구분', '제목', '제출자', '익명', '접수일', ''].map((h) => (
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

      {/* 개인정보 동의 모달 */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">개인정보 수집·이용 동의</h2>
            <pre className="text-sm text-gray-700 bg-gray-50 rounded p-4 whitespace-pre-wrap leading-relaxed mb-5">
              {CONSENT_TEXT}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={closeForm}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                동의 안 함
              </button>
              <button
                onClick={handleConsentAgree}
                className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
              >
                동의하고 계속
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">근로자 의견 등록</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  구분 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {OPINION_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, type: t }))}
                      className={`flex-1 py-2 text-sm rounded border transition-colors ${
                        form.type === t
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {OPINION_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="제목을 입력해 주세요"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={5}
                  placeholder="발생 상황, 장소, 경위 등을 상세히 작성해 주세요."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isAnonymous"
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm((p) => ({ ...p, isAnonymous: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isAnonymous" className="text-sm text-gray-700">
                  익명으로 제출 (이름 비공개)
                </label>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? '등록 중...' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
