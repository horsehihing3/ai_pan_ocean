import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOpinionApi, getOpinionsApi, getMeProfileApi,
  OPINION_TYPE_LABEL, type OpinionType,
} from '../../api/opinions';

// [2026-04-23] 협력업체 근로자 의견조회 (PPT 슬라이드 16, 17)
// [2026-04-23] PPT 폼 레이아웃 반영 + 세션 초기값 자동 입력

type Opinion = {
  id: string;
  type: OpinionType;
  title: string;
  content: string;
  isAnonymous: boolean;
  writerName: string | null;
  writerEmail: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  company: { name: string };
  submittedBy: { name: string };
};

type UserProfile = {
  name: string;
  email: string;
  phone: string | null;
  company: { name: string; industry: string | null } | null;
};

const OPINION_TYPES: OpinionType[] = ['NEAR_MISS', 'ACCIDENT_REPORT', 'GENERAL'];

const CONSENT_TEXT = `(개인정보 수집 항목)
회사는 근로자의견조회 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.

* 수집항목 : 이름, 일반전화, 휴대전화번호, 이메일
* 개인정보 수집방법 : 홈페이지(근로자의견조회)
* 서비스 이용과정 : IP Address, 쿠키, 방문 일시, 서비스 이용 기록, 불량 이용 기록

(개인정보의 수집목적 및 이용목적)
회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.

* 회원 관리
팬오션은 회원가입을 운영하지 않으며, 단 홈페이지 의견조회로 통해서 접수된 근로자의 메일정보는 근로자의견에 대한 답변용으로만 이용하고 있습니다.

* 서비스 제공
홈페이지 근로자의견조회를 통해 접수된 근로자를 대상으로 제공되는 각종 콘텐츠 이용 및 이벤트 응모.`;

const TYPE_COLOR: Record<OpinionType, string> = {
  NEAR_MISS: 'bg-orange-100 text-orange-700',
  ACCIDENT_REPORT: 'bg-red-100 text-red-700',
  GENERAL: 'bg-blue-100 text-blue-700',
};

function generateCaptcha() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function PartnerOpinions() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<OpinionType | ''>('');
  const [step, setStep] = useState<'list' | 'consent' | 'form'>('list');
  const [consentChecked, setConsentChecked] = useState(false);
  const [formError, setFormError] = useState('');
  const [detailTarget, setDetailTarget] = useState<Opinion | null>(null);
  const [captcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['me-profile'],
    queryFn: () => getMeProfileApi().then((r) => r.data.data),
  });

  const emptyForm = useMemo(() => ({
    type: 'GENERAL' as OpinionType,
    writerName: profile?.name || '',
    writerEmail: profile?.email || '',
    writerPhone: profile?.phone || '',
    companyName: profile?.company?.name || '',
    industry: profile?.company?.industry || '',
    title: '',
    content: '',
    isAnonymous: false,
  }), [profile]);

  const [form, setForm] = useState(emptyForm);

  const { data: opinions = [], isLoading } = useQuery<Opinion[]>({
    queryKey: ['opinions-partner', filterType],
    queryFn: () => getOpinionsApi(filterType || undefined).then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: Parameters<typeof createOpinionApi>[0]) => createOpinionApi(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opinions-partner'] });
      setStep('list');
      setCaptchaInput('');
      setFile(null);
      setFormError('');
    },
    onError: (err: any) => setFormError(err.response?.data?.message || '등록에 실패했습니다.'),
  });

  const openConsent = () => {
    setConsentChecked(false);
    setFormError('');
    setStep('consent');
  };

  const handleConsentNext = () => {
    if (!consentChecked) { setFormError('동의 체크박스를 선택해 주세요.'); return; }
    setForm({ ...emptyForm });
    setCaptchaInput('');
    setFile(null);
    setFormError('');
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.writerName.trim()) { setFormError('이름을 입력해 주세요.'); return; }
    if (!form.writerEmail.trim()) { setFormError('이메일을 입력해 주세요.'); return; }
    if (!form.title.trim()) { setFormError('제목을 입력해 주세요.'); return; }
    if (!form.content.trim()) { setFormError('내용을 입력해 주세요.'); return; }
    if (captchaInput !== captcha) { setFormError('보안문자가 일치하지 않습니다.'); return; }
    createMutation.mutate({ ...form, consentAgreed: true, file });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const field = (label: string, child: React.ReactNode, required = false) => (
    <div className="grid grid-cols-[120px_1fr] border-b border-gray-200 items-center">
      <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </div>
      <div className="px-4 py-2.5">{child}</div>
    </div>
  );

  const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  // ─── 동의 화면 ────────────────────────────────────────────────────────────
  if (step === 'consent') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">근로자의견조회</h1>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">개인정보 수집 및 이용 등에 대한 동의</span>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => { setConsentChecked(e.target.checked); setFormError(''); }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              위 사항에 동의합니다.
            </label>
          </div>
          <pre className="px-5 py-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white h-64 overflow-y-auto">
            {CONSENT_TEXT}
          </pre>
          <p className="px-5 py-2 text-xs text-right text-gray-400 border-t border-gray-100">* 표시는 필수입력 항목입니다.</p>
        </div>
        {formError && <p className="text-sm text-red-500 mt-2">{formError}</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={() => setStep('list')} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button onClick={handleConsentNext} className="flex-1 py-2.5 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors">
            다음
          </button>
        </div>
      </div>
    );
  }

  // ─── 등록 폼 ─────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">근로자의견조회</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 구분 */}
          {field('구분', (
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as OpinionType }))}
              className={inputCls}
            >
              <option value="">구분을 선택해주세요</option>
              {OPINION_TYPES.map((t) => (
                <option key={t} value={t}>{OPINION_TYPE_LABEL[t]}</option>
              ))}
            </select>
          ), true)}

          {/* 이름 + 이메일 */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="grid grid-cols-[100px_1fr] items-center border-r border-gray-200">
              <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">
                이름<span className="text-red-500 ml-0.5">*</span>
              </div>
              <div className="px-4 py-2.5">
                <input value={form.writerName} onChange={(e) => setForm((p) => ({ ...p, writerName: e.target.value }))} placeholder="이름을 입력해주세요" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">
                이메일<span className="text-red-500 ml-0.5">*</span>
              </div>
              <div className="px-4 py-2.5">
                <input value={form.writerEmail} onChange={(e) => setForm((p) => ({ ...p, writerEmail: e.target.value }))} placeholder="이메일을 입력해주세요" className={inputCls} />
              </div>
            </div>
          </div>

          {/* 회사명 + 업종 */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="grid grid-cols-[100px_1fr] items-center border-r border-gray-200">
              <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">회사명</div>
              <div className="px-4 py-2.5">
                <input value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="회사명을 입력해주세요" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">업종</div>
              <div className="px-4 py-2.5">
                <input value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} placeholder="업종을 입력해주세요" className={inputCls} />
              </div>
            </div>
          </div>

          {/* 연락처 + 보안문자 */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="grid grid-cols-[100px_1fr] items-center border-r border-gray-200">
              <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">연락처</div>
              <div className="px-4 py-2.5">
                <input value={form.writerPhone} onChange={(e) => setForm((p) => ({ ...p, writerPhone: e.target.value }))} placeholder="연락처를 입력해주세요" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-[100px_1fr] items-center">
              <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">보안문자<span className="text-red-500 ml-0.5">*</span></div>
              <div className="px-4 py-2.5 flex items-center gap-3">
                <span className="inline-block bg-blue-700 text-white font-bold text-lg px-4 py-1.5 rounded select-none tracking-widest min-w-[72px] text-center">
                  {captcha}
                </span>
                <input
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="보안문자를 입력해주세요"
                  className={inputCls}
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* 제목 */}
          {field('제목', (
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="제목을 입력해주세요" className={inputCls} />
          ), true)}

          {/* 내용 + 파일 */}
          <div className="grid grid-cols-[120px_1fr] border-b border-gray-200">
            <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 self-stretch flex items-center">내용</div>
            <div className="px-4 py-2.5 space-y-2">
              <textarea
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={5}
                placeholder="내용을 입력해주세요"
                className={`${inputCls} resize-none`}
              />
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 rounded hover:bg-gray-50 transition-colors">
                  <span>파일 선택</span>
                  <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
                <span className="text-sm text-gray-500">{file ? file.name : '선택된 파일 없음'}</span>
              </div>
            </div>
          </div>

          <p className="px-5 py-2 text-xs text-right text-gray-400">* 표시는 필수입력 항목입니다.</p>

          {formError && <p className="px-5 pb-2 text-sm text-red-500">{formError}</p>}

          <div className="flex gap-3 px-5 pb-5">
            <button type="button" onClick={() => setStep('list')} className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors">
              취소
            </button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-900 disabled:opacity-50 transition-colors">
              {createMutation.isPending ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── 목록 화면 ────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">근로자 의견조회</h1>
          <p className="text-sm text-gray-500 mt-1">아차사고, 산업재해조사표, 일반문의를 접수할 수 있습니다.</p>
        </div>
        <button onClick={openConsent} className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors">
          + 의견 등록
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">전체 접수</div>
          <div className="text-2xl font-bold mt-1 text-gray-700">{opinions.length}</div>
        </div>
        {OPINION_TYPES.map((t) => (
          <div key={t} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">{OPINION_TYPE_LABEL[t]}</div>
            <div className="text-2xl font-bold mt-1 text-gray-700">{opinions.filter((o) => o.type === t).length}</div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {[{ label: '전체', value: '' }, ...OPINION_TYPES.map((t) => ({ label: OPINION_TYPE_LABEL[t], value: t }))].map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilterType(value as OpinionType | '')}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${filterType === value ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 self-center">
          답변 완료 {opinions.filter((o) => o.adminReply).length}건
        </span>
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
                  <td className="px-4 py-3 text-gray-600 text-xs">{o.company.name}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.isAnonymous ? <span className="text-gray-400">익명</span> : (o.writerName || o.submittedBy.name)}
                  </td>
                  <td className="px-4 py-3">
                    {o.adminReply
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">답변완료</span>
                      : <span className="text-xs text-gray-400">대기중</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailTarget(o)} className="text-xs text-blue-500 hover:text-blue-700">상세</button>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">의견 상세</h2>
              <button onClick={() => setDetailTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3 text-sm mb-5">
              {[
                { label: '구분', value: <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[detailTarget.type]}`}>{OPINION_TYPE_LABEL[detailTarget.type]}</span> },
                { label: '업체명', value: detailTarget.company.name },
                { label: '제목', value: <span className="font-medium">{detailTarget.title}</span> },
                { label: '제출자', value: detailTarget.isAnonymous ? '익명' : (detailTarget.writerName || detailTarget.submittedBy.name) },
                { label: '접수일', value: fmt(detailTarget.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-16 text-gray-500 shrink-0">{label}</dt>
                  <dd className="text-gray-800">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-gray-500 mb-1">내용</dt>
                <dd className="text-gray-800 bg-gray-50 rounded p-3 whitespace-pre-wrap">{detailTarget.content}</dd>
              </div>
              {detailTarget.adminReply ? (
                <div className="border-t border-gray-100 pt-3">
                  <dt className="text-gray-500 mb-1 flex items-center gap-2">
                    안전경영팀 답변
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">답변완료</span>
                    {detailTarget.repliedAt && <span className="text-xs text-gray-400">{fmt(detailTarget.repliedAt)}</span>}
                  </dt>
                  <dd className="text-gray-800 bg-blue-50 rounded p-3 whitespace-pre-wrap border border-blue-100">{detailTarget.adminReply}</dd>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-400">아직 답변이 등록되지 않았습니다.</p>
                </div>
              )}
            </div>
            <button onClick={() => setDetailTarget(null)} className="w-full py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
