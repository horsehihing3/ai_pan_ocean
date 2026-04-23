import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitRegistrationApi } from '../../api/auth';

// [2026-04-17] 협력업체 가입신청 페이지
// [2026-04-21] PPT 가입 및 로그인(2/4) 디자인 반영

const INDUSTRIES = [
  '검수업 (Tally)',
  '검정업 (Surveyor)',
  '고박업 (Lashing)',
  '하역업 (Stevedore)',
  '예선업 (Tug boat)',
  '줄잡이업 (Line handling)',
  '대리점업',
  '선박관리업 (Ship Management)',
  '기타업종 (선박관련 업무)',
  '기타업종 (사무실관련 업무)',
  '선체청소업 (Hull Cleaning)',
  '선창청소업 (Hold Cleaning)',
];

const CONTRACT_DEPTS = [
  '운항물류팀',
  '운항지원팀',
  '해사환경팀',
  '해사관리팀',
];

const inputCls = 'w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-colors';
const selectCls = 'border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-colors bg-white';

// 라벨 셀
function LabelCell({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="w-44 shrink-0 bg-blue-50/60 px-4 py-3 flex items-center border-r border-gray-200">
      <span className="text-sm text-gray-700 font-medium">
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
    </div>
  );
}

// 행
function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex border-b border-gray-200 last:border-b-0">
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    applicantEmail: '',
    password: '',
    passwordConfirm: '',
    companyName: '',
    companyNameEn: '',
    bizNo: '',
    companyPhone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    industry: '',
    industryEtc: '',
    contractDept: '',
    applicantTitle: '',
    applicantName: '',
    applicantPhone: '',
    applicantContactEmail: '',
  });
  const [bizFile, setBizFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await submitRegistrationApi({
        companyName: form.companyName,
        companyNameEn: form.companyNameEn,
        bizNo: form.bizNo,
        companyPhone: form.companyPhone,
        zipCode: form.zipCode,
        address: form.address,
        addressDetail: form.addressDetail,
        industry: form.industry,
        industryEtc: form.industryEtc,
        contractDept: form.contractDept,
        applicantName: form.applicantName,
        applicantTitle: form.applicantTitle,
        applicantEmail: form.applicantEmail,
        applicantPhone: form.applicantPhone,
        applicantContactEmail: form.applicantContactEmail,
        password: form.password,
        bizFile,
      });
      setSuccess('가입 신청이 완료되었습니다. 안전경영팀 승인 후 로그인하실 수 있습니다.');
    } catch (err: any) {
      setError(err.response?.data?.message || '가입 신청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md p-10 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">가입 신청 완료</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{success}</p>
          <Link to="/login" className="text-[#002060] font-semibold hover:underline text-sm">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="w-full max-w-3xl mx-auto">

        {/* 타이틀 */}
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-[#002060]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">회원가입</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">

            {/* 아이디 */}
            <FormRow>
              <LabelCell required>아이디</LabelCell>
              <div className="flex-1 px-4 py-3 flex items-center gap-2">
                <input
                  type="email"
                  value={form.applicantEmail}
                  onChange={(e) => set('applicantEmail', e.target.value)}
                  required
                  placeholder="이메일 형식으로 입력하세요"
                  className={inputCls}
                />
                <button type="button"
                  className="shrink-0 px-4 py-1.5 border border-gray-400 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors whitespace-nowrap">
                  중복확인
                </button>
              </div>
            </FormRow>

            {/* 비밀번호 */}
            <FormRow>
              <LabelCell required>비밀번호</LabelCell>
              <div className="flex-1 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      required
                      className={inputCls}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-1.5">
                  * 비밀번호는 8~20자리, 영문/숫자/특수문자[@$!%*#?&] 각각 1개 이상이 포함되어야 합니다.
                </p>
              </div>
            </FormRow>

            {/* 비밀번호 확인 */}
            <FormRow>
              <LabelCell required>비밀번호 확인</LabelCell>
              <div className="flex-1 px-4 py-3">
                <div className="relative">
                  <input
                    type="password"
                    value={form.passwordConfirm}
                    onChange={(e) => set('passwordConfirm', e.target.value)}
                    required
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                </div>
                {form.passwordConfirm && form.password !== form.passwordConfirm && (
                  <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            </FormRow>

            {/* 업체명 + 영문명 */}
            <FormRow>
              <LabelCell required>업체명</LabelCell>
              <div className="flex-1 px-4 py-3 flex items-center gap-2">
                <input
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  required
                  className={inputCls}
                />
                <span className="shrink-0 text-sm text-gray-500 whitespace-nowrap">업체 영문명</span>
                <input
                  value={form.companyNameEn}
                  onChange={(e) => set('companyNameEn', e.target.value)}
                  placeholder="영문 업체명"
                  className={inputCls}
                />
              </div>
            </FormRow>

            {/* 사업자 등록번호 */}
            <FormRow>
              <LabelCell required>사업자 등록번호</LabelCell>
              <div className="flex-1 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={form.bizNo}
                    onChange={(e) => set('bizNo', e.target.value)}
                    required
                    placeholder="000-00-00000"
                    className={inputCls}
                  />
                  <button type="button"
                    className="shrink-0 px-4 py-1.5 border border-gray-400 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors whitespace-nowrap">
                    중복확인
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-xs text-gray-500">
                    {bizFile ? bizFile.name : '사업자 등록증 파일을 선택하세요.'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setBizFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </FormRow>

            {/* 회사전화번호 */}
            <FormRow>
              <LabelCell required>회사전화번호</LabelCell>
              <div className="flex-1 px-4 py-3">
                <input
                  type="tel"
                  value={form.companyPhone}
                  onChange={(e) => set('companyPhone', e.target.value)}
                  placeholder="02-0000-0000"
                  className={`${inputCls} max-w-xs`}
                />
              </div>
            </FormRow>

            {/* 주소 */}
            <FormRow>
              <LabelCell>주소</LabelCell>
              <div className="flex-1 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={form.zipCode}
                    onChange={(e) => set('zipCode', e.target.value)}
                    placeholder="우편번호"
                    className={`${inputCls} max-w-[140px]`}
                  />
                  <button type="button"
                    className="shrink-0 px-4 py-1.5 border border-gray-400 text-sm text-gray-700 rounded hover:bg-gray-50 transition-colors whitespace-nowrap">
                    우편번호
                  </button>
                </div>
                <input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="주소"
                  className={inputCls}
                />
                <input
                  value={form.addressDetail}
                  onChange={(e) => set('addressDetail', e.target.value)}
                  placeholder="상세주소"
                  className={inputCls}
                />
              </div>
            </FormRow>

            {/* 업종 */}
            <FormRow>
              <LabelCell required>업종</LabelCell>
              <div className="flex-1 px-4 py-3">
                <select
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                  required
                  className={`${selectCls} max-w-xs`}
                >
                  <option value="">업종을 선택하세요</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </FormRow>

            {/* 기타업종 */}
            <FormRow>
              <LabelCell>기타업종</LabelCell>
              <div className="flex-1 px-4 py-3">
                <input
                  value={form.industryEtc}
                  onChange={(e) => set('industryEtc', e.target.value)}
                  placeholder="위 목록에 없는 경우 직접 입력"
                  className={`${inputCls} max-w-xs`}
                />
              </div>
            </FormRow>

            {/* 팬오션 계약팀 */}
            <FormRow>
              <LabelCell required>팬오션계약팀</LabelCell>
              <div className="flex-1 px-4 py-3">
                <select
                  value={form.contractDept}
                  onChange={(e) => set('contractDept', e.target.value)}
                  required
                  className={`${selectCls} max-w-xs`}
                >
                  <option value="">계약팀을 선택하세요</option>
                  {CONTRACT_DEPTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </FormRow>

            {/* 안전담당자 직책 + 성명 */}
            <FormRow>
              <LabelCell required>안전담당자직책</LabelCell>
              <div className="flex-1 px-4 py-3 flex items-center gap-4">
                <input
                  value={form.applicantTitle}
                  onChange={(e) => set('applicantTitle', e.target.value)}
                  className={inputCls}
                />
                <span className="shrink-0 text-sm text-gray-700 font-medium whitespace-nowrap">
                  안전담당자 성명 <span className="text-red-500">*</span>
                </span>
                <input
                  value={form.applicantName}
                  onChange={(e) => set('applicantName', e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
            </FormRow>

            {/* 안전담당자 휴대전화 + 이메일 */}
            <FormRow>
              <LabelCell required>안전담당자 휴대전화</LabelCell>
              <div className="flex-1 px-4 py-3 flex items-center gap-4">
                <input
                  type="tel"
                  value={form.applicantPhone}
                  onChange={(e) => set('applicantPhone', e.target.value)}
                  required
                  placeholder="010-0000-0000"
                  className={inputCls}
                />
                <span className="shrink-0 text-sm text-gray-700 font-medium whitespace-nowrap">
                  안전담당자 E-mail <span className="text-red-500">*</span>
                </span>
                <input
                  type="email"
                  value={form.applicantContactEmail}
                  onChange={(e) => set('applicantContactEmail', e.target.value)}
                  className={inputCls}
                />
              </div>
            </FormRow>

          </div>

          {error && (
            <p className="text-sm text-red-500 mb-3 flex items-center gap-1">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="px-10 py-2.5 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-2.5 bg-[#002060] text-white text-sm font-semibold rounded hover:bg-[#001a50] disabled:opacity-50 transition-colors"
            >
              {loading ? '신청 중...' : '가입하기'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
