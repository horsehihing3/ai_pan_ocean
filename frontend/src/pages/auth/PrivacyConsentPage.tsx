import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// [2026-04-21] 개인정보 수집이용 동의서 - 가입신청 전 필수 동의 (PPT 가입 및 로그인 1/4 참고)

export default function PrivacyConsentPage() {
  const [agree, setAgree] = useState<'agree' | 'disagree' | null>(null);
  const [ageCheck, setAgeCheck] = useState(false);
  const [bottomCheck, setBottomCheck] = useState(false);
  const navigate = useNavigate();

  const canProceed = agree === 'agree' && ageCheck && bottomCheck;

  const handleNext = () => {
    if (canProceed) navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-3xl">

        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-[#002060]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">개인정보 수집이용 동의서</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* 안내 문구 */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-700 text-center leading-relaxed">
              주식회사 팬오션은 안전보건포털 서비스 제공을 위하여 아래와 같이 개인정보를 수집 및 이용합니다.<br />
              아래의 내용을 자세히 읽어 보시고 동의 여부를 결정해 주시기 바랍니다.
            </p>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* 수집 목적 안내 */}
            <p className="text-sm text-gray-600 leading-relaxed">
              귀하가 제공한 정보는 다음의 목적을 위해 활용하며, 개인정보 제공자가 동의한 내용 외의 다른 목적으로는
              사용되지 않습니다.
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">[개인정보의 수집 및 이용]</span><br />
              또한 수집한 정보를 제3자에게 제공하거나 공유하지 않습니다.
            </p>

            {/* 필수 동의 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-[#002060]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold text-gray-800">[필수] 개인정보 수집·이용 동의</span>
              </div>

              {/* 동의 테이블 */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-700 w-[34%]">이용목적</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-700 w-[24%]">수집 항목</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-700 w-[24%]">보유 기간</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-700 w-[18%]">동의여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-4 text-xs text-gray-700 leading-relaxed align-top border-r border-gray-100">
                        안전보건 관련 업무처리, 회원(업체)가 신청한 회원(업체)소속 직원 대상
                        안전보건교육, 회원(업체)소속 직원이 신청한 안전보건교육, 당사 사업장
                        출입통제, 안전보건관련 기록 보존,{' '}
                        <span className="text-red-600 font-medium">안전보건관련 유관기관 자료 제출</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-700 leading-relaxed align-top border-r border-gray-100">
                        회사명, 성명, 직책, 업체전화번호, 휴대폰 번호, 생년월일
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-700 leading-relaxed align-top text-center border-r border-gray-100">
                        서비스 탈퇴 후 또는<br />업체도급계약 종료 후 3년
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-col gap-2 items-start">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="consent"
                              value="agree"
                              checked={agree === 'agree'}
                              onChange={() => setAgree('agree')}
                              className="accent-[#002060]"
                            />
                            <span className="text-xs text-gray-700">동의</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="consent"
                              value="disagree"
                              checked={agree === 'disagree'}
                              onChange={() => setAgree('disagree')}
                              className="accent-gray-400"
                            />
                            <span className="text-xs text-gray-700">동의안함</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="text-gray-700 font-medium">*</span>{' '}
                귀하는 상기 개인정보 수집 및 이용과 관련하여 동의를 거부하실 권리가 있습니다.
                그러나 동의를 거부할 경우 회원가입이 불가하며 안전보건포털 서비스를 제공 받으실 수 없습니다.
                본 동의서는 개인정보 수집 및 이용과 관련된 법령과 당사 지침을 준수합니다.
              </p>
              <p className="text-xs text-red-500 leading-relaxed">
                <span className="font-medium">*</span>{' '}
                수집된 정보는 유관기관 자료 제출을 고려하여 3년동안 보관하며, 이후 자동 삭제됩니다.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageCheck}
                  onChange={(e) => setAgeCheck(e.target.checked)}
                  className="w-4 h-4 accent-[#002060]"
                />
                <span className="text-xs text-gray-700 font-medium">만 14세 이상입니다.</span>
              </label>
            </div>

            {/* 최종 동의 문구 */}
            <div className="bg-gray-50 rounded-lg px-5 py-4 text-center border border-gray-200">
              <p className="text-sm text-gray-800 font-medium">
                본인은 위의 동의서 내용을 충분히 숙지하였으며,<br />
                개인정보의 수집 및 이용에 동의합니다.
              </p>
            </div>
          </div>

          {/* 하단 액션 바 */}
          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bottomCheck}
                onChange={(e) => setBottomCheck(e.target.checked)}
                className="w-4 h-4 accent-[#002060]"
              />
              <span className="text-sm text-gray-700 font-medium">개인정보 수집 활용 동의</span>
            </label>

            <div className="flex gap-2">
              <Link
                to="/login"
                className="px-5 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                취소
              </Link>
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="px-6 py-2 bg-[#002060] text-white text-sm font-semibold rounded-lg hover:bg-[#001a50] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
