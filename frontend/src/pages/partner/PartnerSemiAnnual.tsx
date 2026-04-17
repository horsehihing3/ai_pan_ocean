// [2026-04-17] 반기평가 - 향후 구현 예정 (반기 근로자 의견 제출 모듈)
export default function PartnerSemiAnnual() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">반기평가</h1>
      <p className="text-gray-500 mb-6">근로자 안전보건 의견을 제출하는 페이지입니다.</p>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 flex items-start gap-4">
        <span className="text-yellow-500 text-2xl mt-0.5">!</span>
        <div>
          <p className="text-sm font-semibold text-yellow-800 mb-1">준비 중인 기능</p>
          <p className="text-sm text-yellow-700">
            반기평가 기능은 현재 개발 중입니다.<br />
            해당 기간 내 제출 요청이 오면 이 화면에서 작성하실 수 있게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
