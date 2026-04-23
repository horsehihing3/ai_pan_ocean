import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi } from '../../api/auth';
import useAuthStore from '../../store/authStore';

// [2026-04-17] 로그인 페이지
// [2026-04-21] PPT 가입 및 로그인(1/4) 참고 - PAN OCEAN 브랜딩 + 네이버 스타일 적용

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAccessToken, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      const { accessToken, user } = res.data.data;
      setAccessToken(accessToken);
      setUser(user);
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'CONTRACT_DEPT') navigate('/contract/evaluations');
      else navigate('/partner/home');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── 좌측 브랜드 패널 ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#002060] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* 배경 장식 원 */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/5 rounded-full" />

        {/* PAN OCEAN 로고 */}
        <div className="relative z-10 text-center">
          <div className="mb-6 inline-flex items-baseline gap-1">
            <span className="text-5xl font-black tracking-tight text-red-500">PAN</span>
            <span className="text-5xl font-black tracking-tight text-white">OCEAN</span>
          </div>

          <div className="w-16 h-0.5 bg-white/30 mx-auto mb-6" />

          <h2 className="text-xl font-semibold mb-3 text-white">
            협력업체 안전보건관리 포털
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            팬오션 협력업체의 출입·평가·재해·실적을<br />
            통합 관리하는 안전보건 디지털 포털입니다.
          </p>

          {/* 하단 특징 뱃지 */}
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            {['출입 신청', '안전보건 평가', '산업재해 관리', '실적 관리'].map((item) => (
              <span
                key={item}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-blue-100 border border-white/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 우측 로그인 폼 ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">

          {/* 모바일 로고 */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-3xl font-black tracking-tight">
              <span className="text-red-500">PAN</span>
              <span className="text-[#002060]"> OCEAN</span>
            </span>
            <p className="text-xs text-gray-400 mt-1">협력업체 안전보건관리 포털</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">로그인</h1>
            <p className="text-sm text-gray-400 mb-8">안전보건 포털에 오신 것을 환영합니다</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* 이메일 */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="이메일"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-colors"
                />
              </div>

              {/* 비밀번호 */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="비밀번호"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-[#002060] focus:ring-1 focus:ring-[#002060] transition-colors"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#002060] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#001a50] disabled:opacity-50 transition-colors mt-1"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-400">
              처음 이용하시나요?{' '}
              <Link to="/privacy-consent" className="text-[#002060] font-semibold hover:underline">
                가입신청
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-6">
            © 2026 Pan Ocean Co., Ltd. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}
