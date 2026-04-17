# docs/ARCHIVE.md
완료 작업 아카이브

> PROJECT_CONTEXT.md의 완료 항목이 10개 이상 쌓이면 여기로 이동합니다.
> 이 파일은 `.claudeignore`에 등록되어 Claude가 읽지 않습니다 — 참고용 기록 전용.

---

## 2026-04-17 아카이브 (세션 1 — 초기 구축 전체)

- [x] **프로젝트 구조 생성** (2026-04-17) — backend/frontend scaffold 완성
- [x] **DB 스키마 설계 + 마이그레이션** (2026-04-17) — Prisma 7 + pg 어댑터, 12개 모델, `pan_ocean_safety` DB 생성
- [x] **인증 구현** (2026-04-17) — JWT 15분/7일, bcrypt 12, requireAuth/requireRole 미들웨어
- [x] **가입·승인 플로우** (2026-04-17) — 가입신청 CRUD, 이메일 알림, 2일 리마인드 스케줄러
- [x] **프론트엔드 기본 구조** (2026-04-17) — React Router 역할 가드, Zustand, Axios interceptor, 로그인/가입 페이지
- [x] **가입신청 관리 화면** (2026-04-17) — AdminRegistrations: 목록 테이블, 상태 필터, 요약 카드, 상세 모달, 승인/반려 처리
- [x] **사업장 출입신청 화면** (2026-04-17) — PartnerVisitRequests(신청 폼·수정·목록) + AdminVisitRequests(검토·개선요청·완료 처리)
- [x] **안전보건평가 화면** (2026-04-17) — ContractEvaluations(평가 수행) + AdminEvaluations(검토·평가항목 관리) + PartnerEvaluations(결과 조회)
- [x] **관리자 대시보드** (2026-04-17) — AdminDashboard(요약 카드·요주의 업체·검토 대기·최근 공지)
- [x] **협력업체 관리** (2026-04-17) — AdminCompanies(목록·요주의 토글·상세)
- [x] **공지사항 관리** (2026-04-17) — AdminNotices(CRUD·고정 기능)
- [x] **협력업체 홈** (2026-04-17) — PartnerHome(공지사항·빠른 이동·개선요청 알림)
- [x] **반기평가** (2026-04-17) — PartnerSemiAnnual(설문 작성·임시저장·제출) + AdminSemiAnnual(기간별 집계·항목별 평균·근로자 의견)
- [x] **산업재해 LIST** (2026-04-17) — schema 마이그레이션(location·lostDays 추가), PartnerAccidents(신고·수정·삭제) + AdminAccidents(필터 목록·월별/유형별 통계)
