import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRegistrationsApi, approveRegistrationApi, rejectRegistrationApi } from '../../api/registration';

// [2026-04-17] 가입신청 관리 페이지 (관리자)

type Registration = {
  id: string;
  companyName: string;
  bizNo: string;
  industry: string | null;
  contractDept: string | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
  approvedAt: string | null;
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING:  { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '승인됨', className: 'bg-green-100 text-green-800' },
  REJECTED: { label: '반려됨', className: 'bg-red-100 text-red-800' },
};

export default function AdminRegistrations() {
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModal, setDetailModal] = useState<Registration | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; companyName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['registrations', statusFilter],
    queryFn: () =>
      getRegistrationsApi(statusFilter || undefined).then((r) => r.data.data as Registration[]),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRegistrationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      alert('승인이 완료되었습니다. 협력업체에 이메일이 발송됩니다.');
    },
    onError: (err: any) => alert(err.response?.data?.message || '승인에 실패했습니다.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectRegistrationApi(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setRejectModal(null);
      setRejectReason('');
      alert('반려 처리되었습니다. 협력업체에 이메일이 발송됩니다.');
    },
    onError: (err: any) => alert(err.response?.data?.message || '반려에 실패했습니다.'),
  });

  const handleApprove = (reg: Registration) => {
    if (confirm(`"${reg.companyName}" 가입신청을 승인하시겠습니까?`)) {
      approveMutation.mutate(reg.id);
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해 주세요.');
      return;
    }
    rejectMutation.mutate({ id: rejectModal!.id, reason: rejectReason });
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const counts = {
    all: data?.length ?? 0,
    pending: data?.filter((r) => r.status === 'PENDING').length ?? 0,
    approved: data?.filter((r) => r.status === 'APPROVED').length ?? 0,
    rejected: data?.filter((r) => r.status === 'REJECTED').length ?? 0,
  };

  const FILTERS = [
    { value: '', label: '전체' },
    { value: 'PENDING', label: '대기중' },
    { value: 'APPROVED', label: '승인됨' },
    { value: 'REJECTED', label: '반려됨' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">가입신청 관리</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체', value: counts.all, color: 'text-gray-700', bg: 'bg-white' },
          { label: '대기중', value: counts.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: '승인됨', value: counts.approved, color: 'text-green-700', bg: 'bg-green-50' },
          { label: '반려됨', value: counts.rejected, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-lg border border-gray-200 p-4`}>
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 상태 필터 탭 */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-700 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : !data?.length ? (
          <div className="p-8 text-center text-gray-400">가입신청 내역이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">업체명</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">사업자번호</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">업종</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">계약부서</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">신청자</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">신청일</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDetailModal(reg)}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {reg.companyName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{reg.bizNo}</td>
                  <td className="px-4 py-3 text-gray-600">{reg.industry || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{reg.contractDept || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{reg.applicantName}</div>
                    <div className="text-xs text-gray-400">{reg.applicantEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(reg.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABEL[reg.status].className}`}
                    >
                      {STATUS_LABEL[reg.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {reg.status === 'PENDING' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(reg)}
                          disabled={approveMutation.isPending}
                          className="px-3 py-1 bg-blue-700 text-white text-xs rounded hover:bg-blue-800 disabled:opacity-50 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => {
                            setRejectModal({ id: reg.id, companyName: reg.companyName });
                            setRejectReason('');
                          }}
                          className="px-3 py-1 bg-white border border-red-300 text-red-600 text-xs rounded hover:bg-red-50 transition-colors"
                        >
                          반려
                        </button>
                      </div>
                    )}
                    {reg.status === 'APPROVED' && (
                      <span className="text-xs text-gray-400">
                        {reg.approvedAt ? fmt(reg.approvedAt) : ''} 승인
                      </span>
                    )}
                    {reg.status === 'REJECTED' && (
                      <span className="text-xs text-gray-400">반려됨</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 상세 모달 */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">가입신청 상세</h2>
              <button
                onClick={() => setDetailModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                { label: '업체명', value: detailModal.companyName },
                { label: '사업자번호', value: detailModal.bizNo },
                { label: '업종', value: detailModal.industry || '-' },
                { label: '담당 계약부서', value: detailModal.contractDept || '-' },
                { label: '신청자', value: detailModal.applicantName },
                { label: '이메일', value: detailModal.applicantEmail },
                { label: '연락처', value: detailModal.applicantPhone || '-' },
                { label: '신청일', value: fmt(detailModal.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex">
                  <dt className="w-32 text-gray-500 shrink-0">{label}</dt>
                  <dd className="text-gray-800 font-medium">{value}</dd>
                </div>
              ))}
              <div className="flex">
                <dt className="w-32 text-gray-500 shrink-0">상태</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABEL[detailModal.status].className}`}
                  >
                    {STATUS_LABEL[detailModal.status].label}
                  </span>
                </dd>
              </div>
              {detailModal.rejectReason && (
                <div className="flex">
                  <dt className="w-32 text-gray-500 shrink-0">반려 사유</dt>
                  <dd className="text-red-600">{detailModal.rejectReason}</dd>
                </div>
              )}
            </dl>
            {detailModal.status === 'PENDING' && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => { handleApprove(detailModal); setDetailModal(null); }}
                  className="flex-1 py-2 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                >
                  승인
                </button>
                <button
                  onClick={() => {
                    setRejectModal({ id: detailModal.id, companyName: detailModal.companyName });
                    setDetailModal(null);
                    setRejectReason('');
                  }}
                  className="flex-1 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
                >
                  반려
                </button>
              </div>
            )}
            <button
              onClick={() => setDetailModal(null)}
              className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">반려 처리</h2>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">{rejectModal.companyName}</span>의 가입신청을 반려합니다.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              반려 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="협력업체에 전달할 반려 사유를 입력해 주세요."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {rejectMutation.isPending ? '처리 중...' : '반려 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
