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
- [x] **개인정보 동의서 페이지** — `/privacy-consent` 가입 전 동의 단계
- [x] **상단 메뉴 구조** — 좌측 사이드바 → 상단 헤더 네비게이션으로 전환 (PPT 슬라이드 4,5 반영)
- [x] **소개 페이지** — 안전보건 경영방침·목표·인증 (`/intro/*`) (PPT 슬라이드 10 반영)

### 🟡 2단계 — 핵심 업무 모듈
- [x] **사업장 출입신청** — CRUD, 관리자 검토, S3 서류 업로드·다운로드·삭제, 개선요청 이메일 발송
- [x] **협력업체 안전보건평가** — 계약부서 평가 수행, 관리자 검토, 평가항목 관리(CRUD), 협력업체 결과 조회
- [x] **반기평가** — 협력업체 설문 작성·임시저장·제출, 관리자 기간별 집계·항목별 평균·근로자 의견 조회
- [ ] **출입신청 엑셀 일괄 등록** — 엑셀 양식 다운로드, 엑셀 업로드로 명단 일괄 등록 (PPT 슬라이드 13,14)
- [x] **근로자 의견조회** — 아차사고/산업재해조사표/일반문의 접수, 개인정보 동의, 등록 완료 시 팀메일 발송, 관리자 전체 조회 (PPT 슬라이드 16,17)
- [ ] **카카오 비즈메시지 연동** — 정보수집 서류 요청·웹훅 수신·출입기록 자동 매칭 (API 심사 중)

### 🔵 3단계 — 관리·집계 기능
- [x] **안전보건실적** — 부서별 입력, 종합 조회, 엑셀 다운로드
- [x] **산업재해 LIST** — 협력업체 신고·수정·삭제, 관리자 전체 목록(필터)+연도별 통계(월별·유형별)
- [x] **보건파트** — 건강기록 CRUD, 3개년 수치 팝업, 상담이력, 병원자료 S3 업로드·다운로드·삭제
- [x] **관리자 대시보드** — 공지사항, 안전수칙(업종별), 요주의 업체 플래그
- [ ] **안전보건실적 — 해상직원 질병·부상사고 엑셀 업로드** (PPT 슬라이드 30) ← **미구현**
- [ ] **보건파트 — 고혈압/당뇨/고지혈증 FOAM** (PPT 슬라이드 31) ← 예정
- [ ] **평가 수정 History** — 개선요청 후 협력업체 재제출 이력 관리 (PPT 슬라이드 26) ← **미구현**
- [ ] **절차서 PDF 등록/다운로드** — 도급업체 안전보건관리 절차서, 위험성평가 절차서 (PPT 슬라이드 11) ← **미구현**
- [ ] **업종·계약팀 목록 관리자 수정** — 가입 시 선택하는 업종/계약팀을 관리자가 편집 가능 (PPT 슬라이드 7) ← **미구현**

---

## 📊 PPT 기준 전체 진척도 (2026-04-23)

| 카테고리 | PPT 슬라이드 | 구현 상태 |
|---------|-------------|---------|
| 포털 구성 (메뉴 구조) | 3,4,5 | ✅ 완료 (상단메뉴 반영) |
| 가입·로그인·이메일 | 6,7,8,9 | ✅ 완료 |
| 소개 (경영방침·목표·인증) | 10 | ✅ 완료 |
| 절차서 PDF (도급·위험성평가) | 11 | ❌ 미구현 |
| 항운노조 처리 | 12 | ⏸ 미확정 |
| 출입신청 (기본 CRUD·S3) | 13 | ✅ 완료 |
| 출입신청 엑셀 일괄 등록 | 14 | ❌ 미구현 |
| 방문 허가서 출력 | 15 | ⚠ 부분구현 (허가 상태 반영, 인쇄 미구현) |
| 근로자 의견조회 | 16,17 | ✅ 완료 |
| 계약부서 절차·평가 흐름 | 18,19 | ✅ 완료 |
| 계약부서 반기평가 | 20 | ✅ 완료 |
| 공지사항 | 21 | ✅ 완료 |
| 가입신청 LIST & 업체관리 | 22 | ✅ 완료 |
| 카카오 정보수집·자동매칭 | 23 | ❌ API 심사 중 |
| 출입신청 허가 (관리자) | 24 | ✅ 완료 |
| 안전보건평가 검토 (관리자) | 25 | ✅ 완료 |
| 평가 항목관리·수정History | 26 | ⚠ 항목관리만 구현, History 미구현 |
| 안전수칙 관리 | 27 | ✅ 완료 |
| 산업재해 LIST | 28 | ✅ 완료 |
| 안전보건실적 (FCM/VBP 제외) | 29,30 | ⚠ 기본구현, 해상직원 엑셀 업로드 미구현 |
| 보건파트 (FOAM 제외) | 31 | ⚠ 기본구현, FOAM 미구현 |

**전체 완료율: 약 70%**

---

## ✅ 완료된 작업

> 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동 후 여기서 삭제
> 세션 1(2026-04-17) 14개, 세션 2(2026-04-18) 5개, 세션 3(2026-04-19) 4개 → `docs/ARCHIVE.md` 이동 완료

---

## 🐛 알려진 에러 & 해결책

> 반복 마주치는 에러를 여기에 기록해두면 다음 세션에서 헤매지 않습니다.

| 에러 | 원인 | 해결 |
|------|------|------|
| Prisma 7 `PrismaClientInitializationError` | Prisma 7은 engine type "client" - adapter 필수 | `@prisma/adapter-pg` 설치 후 `new PrismaClient({ adapter })` |
| Prisma 7 datasource url 오류 | schema.prisma에서 `url` 속성 제거됨 | `prisma.config.ts`에서 설정, schema.prisma datasource에서 url 삭제 |
| Prisma generate TypeScript only | `prisma-client` provider는 TS 전용 | generator를 `prisma-client-js`로 변경 |
| 스키마 변경 후 `Unknown argument` 오류 | `prisma migrate dev` 후 서버 재시작해도 구 클라이언트 유지 | `npx prisma generate` 실행 후 **서버 완전 재시작** 필수 (nodemon만으론 부족) |
| 페이지 새로고침 시 로그인 풀림 | Zustand 인메모리 스토어 — 새로고침 시 `user: null` | `App.tsx`에서 마운트 시 `/api/auth/refresh` 호출해 세션 복원 (`initialized` 플래그로 RouterProvider 지연 렌더) |
| 한글 파일명 깨짐 (multer) | multer가 multipart 파일명을 latin1로 디코딩 | `Buffer.from(req.file.originalname, 'latin1').toString('utf8')` |
| S3 다운로드 시 파일명 UUID로 저장 | 브라우저 CORS로 `a.download` 무시됨 | `GetObjectCommand`에 `ResponseContentDisposition` 헤더 설정 |

---

## ⚠️ 결정 보류 사항

- **카카오 비즈메시지 API 심사** — 사업자 등록 후 신청 필요 (1~2주 소요 예상)
- **FCM/VBP 연동** — 안전보건실적 예산내역 자동 연동 범위 미확정
- **요주의 업체 기준** — 재해율·개선요청 미이행 기준값 향후 설정 예정
- **항운노조 처리 방식** — 일반 협력업체와 다른 흐름인지 별도 논의 필요
- **포스에스엠 접근** — 안전보건실적 포스에스엠 접근 허용 여부 미확정
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
| 공통 | `/login` | ✅ 완료 |
| 공통 | `/register` | ✅ 완료 |
| 공통 | `/privacy-consent` | ✅ 완료 |
| 공통 | `/intro/safety-policy` | ✅ 완료 |
| 공통 | `/intro/safety-goals` | ✅ 완료 |
| 공통 | `/intro/certification` | ✅ 완료 |
| 협력업체 | `/partner/home` | ✅ 완료 |
| 협력업체 | `/partner/visit-requests` | ✅ 완료 |
| 협력업체 | `/partner/evaluations` | ✅ 완료 |
| 협력업체 | `/partner/semi-annual` | ✅ 완료 |
| 협력업체 | `/partner/accidents` | ✅ 완료 |
| 협력업체 | `/partner/opinions` | ✅ 완료 |
| 관리자 | `/admin/dashboard` | ✅ 완료 |
| 관리자 | `/admin/companies` | ✅ 완료 |
| 관리자 | `/admin/registrations` | ✅ 완료 |
| 관리자 | `/admin/visit-requests` | ✅ 완료 |
| 관리자 | `/admin/evaluations` | ✅ 완료 |
| 관리자 | `/admin/notices` | ✅ 완료 |
| 관리자 | `/admin/semi-annual` | ✅ 완료 |
| 관리자 | `/admin/accidents` | ✅ 완료 |
| 관리자 | `/admin/performance` | ✅ 완료 |
| 관리자 | `/admin/health` | ✅ 완료 |
| 관리자 | `/admin/safety-rules` | ✅ 완료 |
| 관리자 | `/admin/opinions` | ✅ 완료 |
| 계약부서 | `/contract/evaluations` | ✅ 완료 |
| 계약부서 | `/contract/performance` | ✅ 완료 |

---

## 세션 종료 체크리스트

- [ ] 완료 항목 `[x]` 처리 후 `✅ 완료된 작업` 섹션으로 이동
- [ ] 신규 에러·해결책 `🐛 에러 & 해결책` 테이블에 추가
- [ ] 새 API / 페이지 현황 테이블 갱신
- [ ] 완료 항목 10개 이상이면 → `docs/ARCHIVE.md` 이동 후 삭제
- [ ] `git add . && git commit -m "..." && git push origin dev`
- [ ] `/clear`
