# PROJECT_CONTEXT.md
팬오션 안전보건 포털 — 세션 컨텍스트

> **Claude에게:** 새 세션 시작 시 이 파일을 첨부하고 "다음 작업 확인해줘"라고 하면 바로 이어받을 수 있습니다.
> 완료 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동하고 이 파일에서는 삭제하세요.

---

## ⚡ 다음 세션 작업 (우선순위 순)

### 🔴 1단계 — 프로젝트 초기 셋업
- [x] **프로젝트 구조 생성** — backend(Express/Prisma), frontend(React/Vite/TS/Tailwind) 폴더 scaffold
- [x] **DB 스키마 설계** — `schema.prisma` 작성 및 `prisma migrate dev` 초기 마이그레이션
- [x] **인증 구현** — JWT 로그인/로그아웃/refresh, `requireRole` 미들웨어
- [x] **가입·승인 플로우** — 협력업체 가입신청 → 이메일 알림(안전경영팀) → 승인/반려 이메일, 2일 미승인 리마인드

### 🟡 2단계 — 핵심 업무 모듈
- [x] **사업장 출입신청** — CRUD, 관리자 검토(검토중/개선요청/완료) (S3 업로드·개선요청 이메일 미구현)
- [x] **협력업체 안전보건평가** — 계약부서 평가 수행, 관리자 검토, 평가항목 관리(CRUD), 협력업체 결과 조회
- [x] **반기평가** — 협력업체 설문 작성·임시저장·제출, 관리자 기간별 집계·항목별 평균·근로자 의견 조회
- [ ] **카카오 비즈메시지 연동** — 정보수집 서류 요청·웹훅 수신·출입기록 자동 매칭

### 🔵 3단계 — 관리·집계 기능
- [ ] **안전보건실적** — 부서별 입력, 종합 조회, 엑셀 다운로드
- [x] **산업재해 LIST** — 협력업체 신고·수정·삭제, 관리자 전체 목록(필터)+연도별 통계(월별·유형별)
- [ ] **보건파트** — 병원자료 업로드, 3개년 수치 팝업, 상담이력
- [ ] **관리자 대시보드** — 공지사항, 안전수칙(업종별), 요주의 업체 플래그

---

## ✅ 완료된 작업

> 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동 후 여기서 삭제

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

---

## 🐛 알려진 에러 & 해결책

> 반복 마주치는 에러를 여기에 기록해두면 다음 세션에서 헤매지 않습니다.

| 에러 | 원인 | 해결 |
|------|------|------|
| Prisma 7 `PrismaClientInitializationError` | Prisma 7은 engine type "client" - adapter 필수 | `@prisma/adapter-pg` 설치 후 `new PrismaClient({ adapter })` |
| Prisma 7 datasource url 오류 | schema.prisma에서 `url` 속성 제거됨 | `prisma.config.ts`에서 설정, schema.prisma datasource에서 url 삭제 |
| Prisma generate TypeScript only | `prisma-client` provider는 TS 전용 | generator를 `prisma-client-js`로 변경 |

---

## ⚠️ 결정 보류 사항

- **카카오 비즈메시지 API 심사** — 사업자 등록 후 신청 필요 (1~2주 소요 예상)
- **FCM/VBP 연동** — 안전보건실적 예산내역 자동 연동 범위 미확정
- **요주의 업체 기준** — 재해율·개선요청 미이행 기준값 향후 설정 예정
- **이메일 리마인드 추가 발송** — 2일 후 1회 외 추가 여부 미결

---

## 환경 & 스택

| 항목 | 내용 |
|------|------|
| OS / IDE | Windows · VS Code + Claude Code CLI |
| 프로젝트 경로 | `C:\claude\ai_pan_ocean` (Git Bash: `/c/claude/ai_pan_ocean`) |
| Git 브랜치 | `dev` 개발 / `main` 배포 |
| DB | PostgreSQL `localhost:5432/pan_ocean_safety` |
| 파일 스토리지 | AWS S3 `pan-ocean-safety` / `ap-northeast-2` |
| 이메일 | Nodemailer + Gmail SMTP (SES 전환 예정) |

### 명령어 규칙
- 파일 탐색·수정·git → **bash** 문법
- Windows 환경변수 설정 → **PowerShell** 문법 (`&&` 대신 `;` 사용)

### 새 PC 세팅 체크리스트
```powershell
# 관리자 PowerShell에서 1회 실행
[System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://...", "Machine")
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "...", "Machine")
[System.Environment]::SetEnvironmentVariable("JWT_REFRESH_SECRET", "...", "Machine")
[System.Environment]::SetEnvironmentVariable("AWS_ACCESS_KEY", "...", "Machine")
[System.Environment]::SetEnvironmentVariable("AWS_SECRET_KEY", "...", "Machine")
[System.Environment]::SetEnvironmentVariable("KAKAO_API_KEY", "...", "Machine")
# 등록 후 VS Code 완전 재시작 필수
```

---

## 프론트엔드 페이지 현황

| 역할 | 경로 | 상태 |
|------|------|------|
| 공통 | `/login`, `/register` | ✅ 완료 |
| 협력업체 | `/partner/home` | ✅ 완료 |
| 협력업체 | `/partner/visit-requests` | ✅ 완료 |
| 협력업체 | `/partner/evaluations` | ✅ 완료 |
| 협력업체 | `/partner/semi-annual` | ✅ 완료 |
| 관리자 | `/admin/dashboard` | ✅ 완료 |
| 관리자 | `/admin/companies` | ✅ 완료 |
| 관리자 | `/admin/registrations` | ✅ 완료 |
| 관리자 | `/admin/visit-requests` | ✅ 완료 |
| 관리자 | `/admin/evaluations` | ✅ 완료 |
| 관리자 | `/admin/notices` | ✅ 완료 |
| 관리자 | `/admin/semi-annual` | ✅ 완료 |
| 협력업체 | `/partner/accidents` | ✅ 완료 |
| 관리자 | `/admin/accidents` | ✅ 완료 |
| 관리자 | `/admin/performance` | 🔵 미구현 |
| 관리자 | `/admin/health` | 🔵 미구현 |
| 관리자 | `/admin/safety-rules` | 🔵 미구현 |
| 계약부서 | `/contract/evaluations` | ✅ 완료 |
| 계약부서 | `/contract/performance` | 🔵 미구현 |

---

## 세션 종료 체크리스트

- [ ] 완료 항목 `[x]` 처리 후 `✅ 완료된 작업` 섹션으로 이동
- [ ] 신규 에러·해결책 `🐛 에러 & 해결책` 테이블에 추가
- [ ] 새 API / 페이지 현황 테이블 갱신
- [ ] 완료 항목 10개 이상이면 → `docs/ARCHIVE.md` 이동 후 삭제
- [ ] `git add . && git commit -m "..." && git push origin dev`
- [ ] `/clear`
