import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitRegistrationApi } from '../../api/auth';

// [2026-04-17] 협력업체 가입신청 페이지
export default function RegisterPage() {
  const [form, setForm] = useState({
    companyName: '',
    bizNo: '',
    industry: '',
    contractDept: '',
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
        bizNo: form.bizNo,
        industry: form.industry,
        contractDept: form.contractDept,
        applicantName: form.applicantName,
        applicantEmail: form.applicantEmail,
        applicantPhone: form.applicantPhone,
        password: form.password,
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
        <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8 text-center">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">가입 신청 완료</h2>
          <p className="text-sm text-gray-500 mb-6">{success}</p>
          <Link to="/login" className="text-blue-600 hover:underline text-sm">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="bg-white rounded-lg shadow-md w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-blue-900">협력업체 가입신청</h1>
          <p className="text-sm text-gray-500 mt-1">팬오션 안전보건 포털</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">업체명 *</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">사업자번호 *</label>
              <input name="bizNo" value={form.bizNo} onChange={handleChange} required placeholder="000-00-00000"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">업종</label>
              <input name="industry" value={form.industry} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">담당 계약부서</label>
              <input name="contractDept" value={form.contractDept} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <hr className="my-2" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">담당자 이름 *</label>
              <input name="applicantName" value={form.applicantName} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">연락처</label>
              <input name="applicantPhone" value={form.applicantPhone} onChange={handleChange} type="tel"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">이메일 (로그인 ID) *</label>
            <input name="applicantEmail" value={form.applicantEmail} onChange={handleChange} required type="email"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">비밀번호 *</label>
              <input name="password" value={form.password} onChange={handleChange} required type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">비밀번호 확인 *</label>
              <input name="passwordConfirm" value={form.passwordConfirm} onChange={handleChange} required type="password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-700 text-white py-2 rounded text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {loading ? '신청 중...' : '가입 신청'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
