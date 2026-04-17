# docs/errors.md
반복 에러 & 해결책 모음

> CLAUDE.md에서 레이지 로딩. 에러 발생 시에만 읽을 것.
> 새 에러 해결 시 여기에 추가해두면 다음 세션에서 헤매지 않습니다.

---

## 기록 방법

```
### [에러명 또는 증상 요약]
- **발생 상황:** 언제/어디서 발생했는지
- **원인:** 왜 발생했는지
- **해결:** 어떻게 고쳤는지 (코드 스니펫 포함 가능)
- **발생일:** YYYY-MM-DD
```

---

## Prisma

### P1001 — DB 연결 실패
- **발생 상황:** `prisma migrate dev` 또는 서버 시작 시
- **원인:** `.env`의 `DATABASE_URL` 오타 또는 PostgreSQL 미실행
- **해결:** PostgreSQL 서비스 실행 확인 → `DATABASE_URL` 포트·비밀번호 재확인

### P2002 — Unique 제약 위반
- **발생 상황:** 중복 이메일/사업자번호로 가입 시도
- **원인:** unique 컬럼에 이미 동일 값 존재
- **해결:** `catch (e) { if (e.code === 'P2002') throw new AppError('이미 존재합니다', 409) }`

---

## 인증 / CORS

### 401 — Refresh Token 쿠키 미전송
- **발생 상황:** `/auth/refresh` 호출 시 쿠키가 서버에 안 옴
- **원인:** axios 인스턴스에 `withCredentials: true` 누락
- **해결:** `frontend/src/api/index.ts` axios 생성 시 `withCredentials: true` 추가

### CORS preflight 차단
- **발생 상황:** 프론트 → 백엔드 API 호출 시 CORS 에러
- **원인:** `cors()` 설정에 `http://localhost:5173` 누락
- **해결:**
  ```js
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
  ```

---

## Windows 개발 환경

### 환경변수 등록 후에도 백엔드에 미반영
- **발생 상황:** PowerShell에서 환경변수 등록 후 `npm run dev` 해도 `undefined`
- **원인:** VS Code 터미널이 등록 전에 열려 있어 구 환경변수 캐시
- **해결:** VS Code **완전 종료** 후 재시작 → 터미널 새로 열기

### `&&` 체이닝이 PowerShell에서 동작 안 함
- **발생 상황:** `cd backend && npm run dev` 실행 시 오류
- **원인:** PowerShell은 `&&` 미지원
- **해결:** `;` 사용 (`cd backend; npm run dev`) 또는 Git Bash 터미널 사용
