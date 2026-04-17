# docs/api-rules.md
API 설계 규칙 & 엔드포인트 목록

> CLAUDE.md에서 레이지 로딩. API 작업 시에만 읽을 것.

---

## API 설계 규칙

### 응답 구조
```json
// 성공
{ "success": true, "data": {}, "message": "처리되었습니다" }

// 실패
{ "success": false, "data": null, "message": "에러 메시지" }
```

### HTTP 상태 코드
| 코드 | 용도 |
|------|------|
| 200 | 조회·수정 성공 |
| 201 | 생성 성공 |
| 400 | 입력값 오류 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 충돌 |
| 500 | 서버 오류 |

### 미들웨어 적용 순서
```
authMiddleware (토큰 검증) → requireRole('ADMIN') → controller
```

---

## 엔드포인트 목록

> 구현 완료 시 상태 업데이트

### 인증 `/api/auth`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/auth/register` | ALL | 미구현 |
| POST | `/auth/login` | ALL | 미구현 |
| POST | `/auth/logout` | ALL | 미구현 |
| POST | `/auth/refresh` | ALL | 미구현 |
| POST | `/auth/verify-email` | ALL | 미구현 |

### 가입 관리 `/api/admin/members`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| GET | `/admin/members/pending` | ADMIN | 미구현 |
| PUT | `/admin/members/:id/approve` | ADMIN | 미구현 |
| PUT | `/admin/members/:id/reject` | ADMIN | 미구현 |

### 사업장 출입신청 `/api/visit-requests`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/visit-requests` | PARTNER | 미구현 |
| GET | `/visit-requests` | PARTNER / ADMIN | 미구현 |
| GET | `/visit-requests/:id` | PARTNER / ADMIN | 미구현 |
| PUT | `/admin/visit-requests/:id/review` | ADMIN | 미구현 |

### 안전보건평가 `/api/evaluations`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/evaluations` | CONTRACT_DEPT | 미구현 |
| GET | `/evaluations` | ADMIN / CONTRACT_DEPT | 미구현 |
| PUT | `/admin/evaluations/:id/review` | ADMIN | 미구현 |
| GET | `/admin/evaluation-items` | ADMIN | 미구현 |
| PUT | `/admin/evaluation-items` | ADMIN | 미구현 |

### 반기평가 `/api/semi-annual`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/semi-annual` | PARTNER | 미구현 |
| GET | `/admin/semi-annual` | ADMIN | 미구현 |

### 안전보건실적 `/api/performance`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/performance` | CONTRACT_DEPT | 미구현 |
| GET | `/admin/performance` | ADMIN | 미구현 |
| GET | `/admin/performance/export` | ADMIN | 미구현 |

### 산업재해 `/api/accidents`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/accidents` | PARTNER / CONTRACT_DEPT | 미구현 |
| GET | `/admin/accidents` | ADMIN | 미구현 |

### 카카오 웹훅 `/api/kakao`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| POST | `/kakao/webhook` | 시스템 | 미구현 |

### 파일 업로드 `/api/files`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| GET | `/files/presign` | ALL | 미구현 |

### 공지사항 `/api/notices`
| 메서드 | 경로 | 역할 | 상태 |
|--------|------|------|------|
| GET | `/notices` | ALL | 미구현 |
| POST | `/admin/notices` | ADMIN | 미구현 |
| PUT | `/admin/notices/:id` | ADMIN | 미구현 |
| DELETE | `/admin/notices/:id` | ADMIN | 미구현 |
