# CLAUDE.md

> **이 파일은 불변 규칙만 담습니다. 100줄 이내를 목표로 유지합니다.**
> 세션 진행 상황 → `PROJECT_CONTEXT.md` / 상세 규칙 → `docs/` 하위 파일 (필요할 때만 읽을 것)

---

## 프로젝트 개요

팬오션 협력업체 안전보건관리 디지털 전환(Dx) 웹 포털.
안전경영팀이 협력업체의 출입·평가·재해·실적을 통합 관리합니다.

| 항목 | 내용 |
|------|------|
| Backend | Node.js + Express + Prisma / `http://localhost:4000/api` |
| Frontend | React 18 + Vite + TypeScript + Tailwind / `http://localhost:5173` |
| DB | PostgreSQL `localhost:5432/pan_ocean_safety` |
| 역할 | `PARTNER`(협력업체) / `ADMIN`(안전경영팀) / `CONTRACT_DEPT`(계약부서) |

---

## 명령어

```bash
# Backend
cd backend && npm run dev       # port 4000
npx prisma migrate dev          # 스키마 마이그레이션
npx prisma studio               # DB GUI

# Frontend
cd frontend && npm run dev      # port 5173
```

---

## 아키텍처

```
Router → Controller → Service → Prisma ORM → PostgreSQL

frontend/src/pages/{partner,admin,contract,auth,common}/
frontend/src/store/    (Zustand)
frontend/src/api/      (axios instance)
```

- API 응답: `{ success, data, message }` 구조 통일
- 예외: `AppError(message, statusCode)` + `errorHandler` 미들웨어
- 인증: Access Token 15분 / Refresh Token 7일 HttpOnly Cookie
- 라우터 가드: `frontend/src/router/index.tsx` 역할별 리다이렉트

---

## 절대 규칙

- DB 스키마 변경은 반드시 `prisma migrate dev` 경유 — 직접 수정 금지
- `.env` 커밋 금지 / 시크릿 하드코딩 금지
- 기존 API 응답 구조 무단 변경 금지 (하위 호환 깨짐 방지)
- 백엔드 파일 변경 후 서버 재시작 필수

## 보안 규칙

- bcrypt rounds 12 이상 / 평문 비밀번호 저장·로그 절대 금지
- S3 Presigned URL 15분 / 버킷 퍼블릭 설정 금지
- 모든 API에 `requireRole` 미들웨어 적용 필수
- 민감정보(비밀번호 해시 등) API 응답 포함 금지

---

## 코딩 컨벤션

- 컴포넌트 파일명 PascalCase (`VisitRequestForm.tsx`)
- 신규 페이지 추가 시 `router/index.tsx` 역할 가드 필수
- 코드 변경 시 날짜 주석: `// [YYYY-MM-DD] 변경 이유`

---

## 세션 루틴

**시작:**
1. `PROJECT_CONTEXT.md` 첨부 후 "다음 작업 확인해줘"
2. `git status` 로 현재 브랜치·변경 파일 확인

**종료:**
1. `PROJECT_CONTEXT.md` 업데이트 — 완료 `[x]`, 신규 이슈 추가
2. 완료 항목 10개 이상 누적 시 → `docs/ARCHIVE.md` 로 이동 후 삭제
3. `git add . && git commit -m "{feat|fix|refactor|docs|chore}: {요약}" && git push origin dev`
4. `/clear`

---

## 참조 문서 (필요할 때만 읽을 것)

| 파일 | 내용 |
|------|------|
| `PROJECT_CONTEXT.md` | 현재 TODO · 완료 이력 · 진척도 · 이슈 |
| `팬오션 안전보건Dx_최종안.pptx` | **원본 기획서** — 전체 화면 설계·기능 요구사항 (30슬라이드) |
| `docs/domain.md` | 도메인 용어 · 업무 흐름 상세 |
| `docs/api-rules.md` | API 설계 규칙 · 엔드포인트 목록 |
| `docs/errors.md` | 반복 에러 & 해결책 모음 |
| `backend/prisma/schema.prisma` | DB 스키마 전체 |
