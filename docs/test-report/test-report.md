# Smart Edu Platform 테스트 보고서

## 문서 정보

| 항목 | 내용 |
|---|---|
| 과목 | 소프트웨어공학 |
| 조 | 15조 |
| 프로젝트명 | Smart Edu Platform |
| 서비스명 | 사각사각 |
| 조원 | 정이량, 황대겸, 박지환 |
| 작성일 | 2026년 05월 |
| 제출 단계 | 2단계 테스트 보고서 초안 |
| 최종 분량 목표 | 5~10페이지 |

## 목차

1. [문서 개요](#1-문서-개요)
   - [1.1 문서 목적](#11-문서-목적)
   - [1.2 테스트 보고서 작성 기준](#12-테스트-보고서-작성-기준)
   - [1.3 테스트 범위](#13-테스트-범위)
   - [1.4 테스트 제외 범위](#14-테스트-제외-범위)
   - [1.5 2단계/3단계 진행도 재점검](#15-2단계3단계-진행도-재점검)
2. [테스트 환경](#2-테스트-환경)
   - [2.1 개발 환경](#21-개발-환경)
   - [2.2 실행 환경](#22-실행-환경)
   - [2.3 데이터베이스 환경](#23-데이터베이스-환경)
   - [2.4 테스트 도구](#24-테스트-도구)
3. [테스트 전략](#3-테스트-전략)
   - [3.1 유닛 테스트 전략](#31-유닛-테스트-전략)
   - [3.2 통합 테스트 전략](#32-통합-테스트-전략)
   - [3.3 회귀 테스트 전략](#33-회귀-테스트-전략)
   - [3.4 AI 보조 테스트 스크립트 활용 전략](#34-ai-보조-테스트-스크립트-활용-전략)
4. [테스트 케이스 목록](#4-테스트-케이스-목록)
   - [4.1 유닛 테스트 케이스](#41-유닛-테스트-케이스)
   - [4.2 통합 테스트 케이스](#42-통합-테스트-케이스)
   - [4.3 환경 검증 테스트 케이스](#43-환경-검증-테스트-케이스)
5. [현재까지의 테스트 실행 결과](#5-현재까지의-테스트-실행-결과)
6. [커버리지 결과](#6-커버리지-결과)
7. [버그 로그](#7-버그-로그)
8. [AI 생성/보조 테스트 스크립트 기록](#8-ai-생성보조-테스트-스크립트-기록)
9. [향후 테스트 계획](#9-향후-테스트-계획)
10. [부록](#10-부록)

---

## 1. 문서 개요

### 1.1 문서 목적

본 문서는 Smart Edu Platform의 2단계 구현 과정에서 수행한 테스트 결과를 누적하기 위한 테스트 보고서 초안임.

교수님 안내 기준에 따라 최종 테스트 보고서에는 유닛 테스트 케이스 목록, 통합 테스트 케이스 목록, 커버리지 결과, 버그 로그, AI 생성/보조 테스트 스크립트 기록을 포함해야 함.

현재 문서는 최종 보고서 완성본이 아니라, 기능 구현과 테스트 진행에 따라 결과를 계속 추가하기 위한 공식 초안임.

### 1.2 테스트 보고서 작성 기준

테스트 보고서는 실제 실행한 테스트 결과와 확인 가능한 근거를 기준으로 작성함.

- 실제 수행한 테스트는 실행 명령과 결과를 함께 기록함.
- 아직 구현되지 않은 기능의 테스트는 `예정` 또는 `후속 작성`으로 표시함.
- 커버리지 수치는 실제 측정 전까지 작성하지 않음.
- 실제 DB 접속 정보, 환경변수 값, API key 등 비밀값은 문서에 기록하지 않음.
- 테스트 도구는 현재 프로젝트 구조에 맞춰 Jest, Supertest, Prisma CLI, Expo CLI 중심으로 정리함.

### 1.3 테스트 범위

현재 초안에서 다루는 테스트 범위는 다음과 같음.

- 백엔드 health check API 테스트
- Prisma schema 유효성 검증
- Prisma Client 생성 및 초기 migration 적용 결과 기록
- 프론트엔드 Expo 설정 확인 및 Web export 검증
- 루트 통합 검증 명령 실행 결과 기록
- 인증, 사용자/프로필, 학습 일정/칸반 태스크, 학습 노트, 관리자, AI 학습 지원 API 테스트 결과 기록
- 프론트엔드 인증 화면, 관리자 화면, AI 학습 지원 화면 수동 확인 결과 기록
- 향후 기능 구현 시 추가할 유닛/API/통합 테스트 계획

### 1.4 테스트 제외 범위

현재 미구현 기능 또는 자동화가 아직 준비되지 않은 항목은 후속 작성 범위로 둠.

- 학습 일정/태스크 프론트엔드 연동 및 알림 연계 테스트
- 학습 노트 프론트엔드 연동 테스트
- 집중 시간/통계 테스트
- 커뮤니티 기능 테스트
- 프론트엔드 화면 단위 테스트
- 관리자 화면과 AI 화면의 자동 UI 테스트
- 정량 커버리지 측정 결과
- 배포 환경 smoke test
- 최종보고서, 발표자료, 데모 영상은 3단계 산출물로 별도 작성

---

### 1.5 2단계/3단계 진행도 재점검

1단계 요구사항/설계 산출물은 완료 상태로 보고, 이 문서는 2단계 구현/테스트와 3단계 제출 준비 관점에서 남은 작업을 정리함. 요구사항 문서와 설계 문서에 포함된 기능은 계획된 기능으로 유지하며, 현재 main 구현 여부만 완료/부분 구현/미구현으로 구분함.

| 구분 | 현재 상태 | 남은 작업 |
|---|---|---|
| 1단계 요구사항/설계 | 완료 | 최종 제출 전 링크, 이미지, 문서 정합성 재검토 |
| 2단계 구현/테스트 | 진행 중 | 미구현 기능 API/화면 구현, coverage 결과, 프론트 자동 테스트, 배포 전 smoke test |
| 3단계 제출/발표 | 미착수 | 최종보고서, 배포 자료, 설치/사용 가이드, 5~10분 데모 영상, 발표자료, 데모 스크립트 |

| 기능 | docs상 계획 여부 | 현재 상태 | 근거 | 후속 작업 |
|---|---|---|---|---|
| 로그인/회원가입/사용자 인증 | 계획됨 | 완료 | Auth API, 프론트 인증 화면, 테스트 통과 | 화면 자동 테스트와 배포 smoke test |
| 사용자 프로필 | 계획됨 | 부분 구현 | User/Profile API 테스트 완료 | 프로필 화면 연결 |
| 학습 일정 API | 계획됨 | 완료 | Schedule API 테스트 완료 | 프론트 일정 화면 연결 |
| 태스크/칸반 API | 계획됨 | 완료 | Task API 테스트 완료 | 칸반 프론트 화면 연결 |
| 학습 노트 API | 계획됨 | 완료 | PR #81, 9 suites / 116 tests passed | 학습 노트 프론트 화면 연결 |
| AI 학습 지원 API/화면 | 계획됨 | 부분 구현 | AI MVP API, AI 화면 수동 확인 | 실제 질문 품질, 비용/한도, 개인화 고도화 |
| 관리자 API/화면 | 계획됨 | 완료 | 관리자 API 테스트, 관리자 화면 수동 확인 | 커뮤니티 신고/챌린지 확장 연동 |
| 집중 시간/통계/히트맵 | 계획됨 | 완료 | Focus/Statistics API 및 테스트 구현 완료 | 타이머/통계 프론트 화면 연결 |
| 커뮤니티 게시판 | 계획됨 | 미구현 | 이식 계획 문서와 schema 초안 존재 | `/api/community/posts` 기준 1차 게시글 CRUD API 구현 후 댓글/신고/화면 분리 |
| 랭킹/챌린지 | 계획됨 | 부분 구현 | schema와 관리자 챌린지 처리 API 존재 | 사용자 챌린지/랭킹 API와 화면 구현 |
| TTS/STT/접근성 UI/외부 캘린더/앱 차단 | 계획됨 | 미구현 | 요구사항/설계 문서에 계획됨 | 구현 가능 범위 확정 후 별도 Issue/PR |

---

## 2. 테스트 환경

### 2.1 개발 환경

| 구분 | 내용 |
|---|---|
| Frontend | React Native + Expo |
| Backend | Node.js + Express |
| DBMS | PostgreSQL |
| DB Hosting | Neon |
| ORM | Prisma |
| API 방식 | REST API |
| 인증 방향 | JWT + bcrypt |
| 테스트 도구 | Jest, Supertest |

### 2.2 실행 환경

현재 로컬 실행 검증은 다음 구조를 기준으로 수행함.

- 백엔드 실행 위치: `src/backend`
- 프론트엔드 실행 위치: `src/frontend`
- 루트 검증 명령 위치: 프로젝트 루트
- 백엔드 기본 포트: `4000`
- 프론트엔드 로컬 Web 기준 origin: `http://localhost:8081`

### 2.3 데이터베이스 환경

DB 환경은 PostgreSQL, Neon, Prisma 기준임.

현재까지 확인된 DB 관련 작업은 다음과 같음.

- `src/backend/.env.example`에 `DIRECT_URL` 예시 추가
- Prisma 7 기준 `src/backend/prisma.config.ts` 추가
- `src/backend/prisma/schema.prisma`의 datasource를 provider 중심 구조로 정리
- PostgreSQL/Neon adapter 기반 Prisma Client 생성 구조 추가
- `npx prisma validate` 통과
- `npx prisma generate` 통과
- `npx prisma migrate dev --name init` 통과
- 초기 migration 파일 생성
  - `src/backend/prisma/migrations/20260521201109_init/migration.sql`
  - `src/backend/prisma/migrations/migration_lock.toml`

개인 Neon branch migration 적용 여부는 조원별 확인 예정임.

### 2.4 테스트 도구

| 도구 | 용도 | 현재 사용 여부 |
|---|---|---|
| Jest | 백엔드 테스트 실행 | 사용 중 |
| Supertest | Express API 요청/응답 검증 | 사용 중 |
| Prisma CLI | schema validate, generate, migration 검증 | 사용 중 |
| Expo CLI | 프론트엔드 설정 및 Web export 검증 | 사용 중 |
| PostgreSQL adapter | Prisma Client DB smoke test | 별도 검증 명령으로 사용 |
| Coverage 도구 | 테스트 커버리지 측정 | 측정 예정 |

---

## 3. 테스트 전략

### 3.1 유닛 테스트 전략

유닛 테스트는 service 함수, validation, 인증 로직, 통계 계산 로직처럼 입력과 출력이 명확한 단위를 중심으로 작성함.

현재 백엔드 테스트는 health check, 인증, 사용자/프로필, 학습 일정/태스크, 학습 노트, 관리자, AI 학습 지원 API, 집중 시간/통계 API와 공통 helper 검증을 포함함. 커뮤니티 기능은 구현 시 테스트를 추가함. 커뮤니티 1차 구현은 `/api/community/posts` 게시글 CRUD API 테스트부터 작성함.

### 3.2 통합 테스트 전략

통합 테스트는 Express API 요청/응답, 인증 흐름, DB 연동, Prisma repository 흐름을 중심으로 작성할 예정임.

현재는 `GET /api/health`뿐 아니라 Auth, User/Profile, Schedule/Task, Study Note, Admin, AI, Focus/Statistics API를 Jest + Supertest와 repository/provider mock 기반으로 확인함. 이후 커뮤니티 API가 구현되면 API 단위 통합 테스트를 확장함. 커뮤니티는 먼저 게시글 목록/상세/작성/수정/삭제와 작성자 권한 검증을 확인하고, 댓글/반응/신고/관리자 연동 테스트는 후속 구현 범위에서 추가함.

### 3.3 회귀 테스트 전략

회귀 테스트는 기능 추가 또는 refactor 후 기존 health check, 인증, 주요 API 테스트가 계속 통과하는지 확인하는 방식으로 운영함.

루트의 `npm run check`는 백엔드 테스트, Prisma schema 검증, 프론트엔드 설정 확인, Expo Web export 검증을 한 번에 수행하는 기본 회귀 검증 명령으로 사용함.

### 3.4 AI 보조 테스트 스크립트 활용 전략

AI는 테스트 케이스 초안 작성, 테스트 누락 항목 검토, 실패 원인 정리, 경계값 테스트 후보 도출에 보조적으로 활용함.

AI 보조 결과는 팀원이 직접 검토한 뒤 테스트 코드와 보고서에 반영함. AI가 제안한 테스트라도 실제 실행 결과가 확인되지 않은 항목은 완료 상태로 기록하지 않음.

---

## 4. 테스트 케이스 목록

### 4.1 유닛 테스트 케이스

| 테스트 ID | 구분 | 대상 | 테스트 내용 | 명령어 | 기대 결과 | 현재 상태 |
|---|---|---|---|---|---|---|
| TC-BE-001 | 유닛/API 테스트 | `GET /api/health` | Health Check API 응답 확인 | `npm test` | `status`가 `ok`이고 service 이름 반환 | 통과 |
| TC-AUTH-001 | 유닛/API 테스트 | 인증 validation | 회원가입 필수값, 이메일 형식, 비밀번호 길이 검증 | `npm test` | 유효하지 않은 입력 차단 | 통과 |
| TC-BE-002 | 유닛 테스트 | 공통 validation helper | 필수값, 이메일 형식, 비밀번호 길이 검증 helper 확인 | `npm test` | 공통 validation error 처리 | 통과 |
| TC-BE-003 | 유닛 테스트 | 공통 error/response helper | AppError, 공통 응답 helper, async handler 동작 확인 | `npm test` | status code, error code, payload 처리 일관성 유지 | 통과 |
| TC-SCHEDULE-001 | 유닛/API 테스트 | 일정/태스크 API | 일정 생성, 수정, 삭제와 태스크 생성, 수정, 상태 변경 검증 | `npm test` | 입력값에 따른 정상 처리 및 사용자별 접근 제한 | 통과 |
| TC-FOCUS-001 | 유닛/API 테스트 | 집중 세션 기록 및 조회 | `durationMs` 기준 집중 세션 저장, 사용자별 목록 조회, 날짜 필터 검증 | `npm test`, `npm --prefix src/backend test -- --runTestsByPath tests/focus-statistics.test.js` | 본인 세션만 기록/조회되고 잘못된 날짜 필터는 차단됨 | 통과 |
| TC-STAT-001 | 유닛/API 테스트 | 통계 계산 | 학습 시간, 완료율, 히트맵 집계 검증 | `npm test`, `npm --prefix src/backend test -- --runTestsByPath tests/focus-statistics.test.js` | 통계 계산 결과와 히트맵 그룹핑이 일관되게 반환됨 | 통과 |

### 4.2 통합 테스트 케이스

| 테스트 ID | 구분 | 대상 | 테스트 내용 | 명령어 | 기대 결과 | 현재 상태 |
|---|---|---|---|---|---|---|
| TC-INT-001 | API 통합 테스트 | Health Check API | Express app 요청/응답 흐름 검증 | `npm test` | HTTP 200 및 JSON 응답 | 통과 |
| TC-INT-002 | API 통합 테스트 | 인증 API | 회원가입, 로그인, JWT 발급 흐름 검증 | `npm test` | 정상 계정 생성 및 인증 처리 | 통과 |
| TC-INT-006 | API 통합 테스트 | 현재 사용자 조회 API | JWT 없이 접근 실패, 유효한 JWT 접근 성공 검증 | `npm test` | 401/200 응답 및 현재 사용자 정보 반환 | 통과 |
| TC-INT-007 | 보안 검증 | 인증 API 응답 | 회원가입, 로그인, 현재 사용자 조회 응답의 `passwordHash` 미노출 확인 | `npm test` | 응답에 비밀번호 해시가 포함되지 않음 | 통과 |
| TC-INT-008 | API 통합 테스트 | 사용자/프로필 API | 현재 사용자 정보 조회, 프로필 조회/수정, 미인증 접근 차단 검증 | `npm test` | 401/200 응답, 프로필 수정 반영, `passwordHash` 미노출 | 통과 |
| TC-INT-003 | API 통합 테스트 | 일정/태스크 API | 일정 CRUD, 태스크 CRUD, 태스크 상태 변경, 다른 사용자 데이터 접근 차단 검증 | `npm test` | 401/200/201/404 응답 및 사용자별 데이터 접근 제한 | 통과 |
| TC-INT-004 | API 통합 테스트 | AI 학습 지원 API | AI 질의, 추천, 요약, 오답 분석, fallback, noteId 소유권, 400/401/404/429 예외 검증 | `npm test` | mock/fallback 중심으로 실제 외부 AI API 호출 없이 검증 | 통과 |
| TC-INT-005 | API 통합 테스트 | 관리자 API | 사용자 제재, 신고 조회, 게시글/댓글/챌린지 조치와 401/403/400/404 예외 검증 | `npm test` | ADMIN만 접근 가능, 잘못된 id/존재하지 않는 대상 차단, 민감정보 미노출 | 통과 |
| TC-INT-009 | API 통합 테스트 | 학습 노트 API | 노트 생성/목록/상세/수정/삭제, invalid noteId, 빈 수정 body, 필수값 누락, tags 타입, 타인 노트 접근 차단 검증 | `npm test` | 400/401/200/201/404 응답 및 본인 소유 데이터 접근 제한 | 통과 |

### 4.3 환경 검증 테스트 케이스

| 테스트 ID | 구분 | 대상 | 테스트 내용 | 명령어 | 기대 결과 | 현재 상태 |
|---|---|---|---|---|---|---|
| TC-ENV-001 | 환경 검증 | Prisma schema | Prisma schema 유효성 확인 | `npm run validate:prisma` | schema valid | 통과 |
| TC-ENV-002 | 환경 검증 | 전체 검증 | backend test, Prisma validate, frontend config/export 확인 | `npm run check` | 전체 통과 | 통과 |
| TC-ENV-003 | 환경 검증 | Expo config | Expo public config 확인 | `npm run check:frontend` | Expo config 출력 성공 | 통과 |
| TC-FE-001 | 환경 검증 | Expo Web | Expo Web export 확인 | `npm run check:frontend:web` | Web bundle export 성공 | 통과 |
| TC-FE-002 | 프론트엔드 수동/환경 검증 | 인증 화면 연결 | 로그인/회원가입 화면의 Auth API service 연결, token 저장, 현재 사용자 확인 흐름 검토 | `npm run check:frontend`, `npm run check:frontend:web` | Expo config 및 Web export 성공, token 원문 미노출 | 통과 |
| TC-FE-003 | 프론트엔드 수동/환경 검증 | 관리자 화면 연결 | ADMIN 관리자 화면 진입, 일반 USER 접근 차단, 로그아웃 후 접근 차단, 신고 처리 후 목록 갱신 확인 | `npm run check:frontend`, `npm run check:frontend:web`, 수동 확인 | 관리자 화면 접근 제어와 목록 갱신 흐름 정상, 민감정보 화면 미노출 | 통과 |
| TC-FE-004 | 프론트엔드 수동/환경 검증 | AI 학습 지원 화면 연결 | 로그인 후 AI 화면 진입, 질문 입력/응답 표시, 한국어 응답, 에러/fallback 표시 확인 | `npm run check:frontend`, `npm run check:frontend:web`, 수동 확인 | 백엔드 AI API 호출 흐름 정상, 프론트 외부 AI API 직접 호출 없음 | 통과 |
| TC-ENV-004 | 환경 검증 | 개발용 seed script | production guard와 seed 환경 검증 helper 확인 | `npm test` | production 실행 방지 및 개발용 seed 구성 확인 | 통과 |
| TC-ENV-005 | 환경 검증 | 개발용 seed 실행 | 개발용 일반 사용자, 관리자 사용자, 기본 UserProfile 생성/갱신 확인 | `npm run seed:dev` | 개발용 seed 완료 및 비밀값 미출력 | 통과 |
| TC-DB-001 | DB migration | Prisma migration | 초기 migration 적용 | `npx prisma migrate dev --name init` | migration 적용 및 schema sync | 통과 |
| TC-DB-002 | DB migration | 조원별 개인 branch | 각자 개인 Neon branch에 migration 적용 | `npx prisma migrate dev` | 개인 branch schema sync | 확인 예정 |
| TC-DB-003 | DB smoke test | Prisma Client | PostgreSQL adapter 기반 최소 DB query 확인 | `npm run test:db` | `SELECT 1` 정상 응답 | 조건부 실행 |

---

## 5. 현재까지의 테스트 실행 결과

현재까지 확인된 실행 결과는 다음과 같음.

| 구분 | 명령 또는 작업 | 결과 | 근거 |
|---|---|---|---|
| Backend install | backend `npm install` | 통과 | Issue #14 진행 코멘트 기준 |
| Backend dev server | backend `npm run dev` | 통과 | Issue #14 진행 코멘트 기준 |
| Health check | `GET /api/health` | 통과 | Issue #14 진행 코멘트 및 `health.test.js` |
| Frontend install | frontend `npm install` | 통과 | Issue #14 진행 코멘트 기준 |
| Frontend dev server | frontend `npm start` | 통과 | Issue #14 진행 코멘트 기준 |
| Backend test | `npm test` | 통과 | Jest + Supertest 전체 백엔드 테스트 통과(10 suites / 126 tests passed) |
| Auth API test | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | 통과 | `src/backend/tests/auth.test.js`의 repository mock 기반 API 테스트 |
| API foundation test | 공통 response/error/validation/async/test helper | 통과 | `src/backend/tests/api-foundation.test.js` |
| User profile API test | `GET /api/users/me`, `PATCH /api/users/me/profile` | 통과 | `src/backend/tests/user-profile.test.js`의 repository mock 기반 API 테스트 |
| Schedule/Task API test | `GET/POST/PATCH/DELETE /api/schedules`, `GET/POST/PATCH/DELETE /api/tasks` | 통과 | `src/backend/tests/schedule-task.test.js`의 repository mock 기반 API 테스트 |
| AI API test | `POST /api/ai/questions`, `POST /api/ai/recommendations`, `POST /api/ai/summary`, `POST /api/ai/wrong-answers` | 통과 | `src/backend/tests/ai.test.js`의 repository mock 및 provider mock/fallback 기반 API 테스트. 미인증 401, invalid noteId 400, noteId 소유권 404, provider 실패 fallback, rate limit 429 검증 포함 |
| Admin API test | `GET /api/admin/users`, `PATCH /api/admin/users/:userId/status`, `GET /api/admin/reports`, `PATCH /api/admin/posts/:postId/moderation`, `PATCH /api/admin/comments/:commentId/moderation`, `PATCH /api/admin/challenges/:challengeId/moderation` | 통과 | `src/backend/tests/admin.test.js`의 repository mock 기반 API 테스트. 미인증 401, 일반 USER 403, invalid id 400, not found 404, 관리자 자기 자신 status 변경 차단, `passwordHash` 미노출 검증 포함 |
| Study Note API test | `GET/POST/PATCH/DELETE /api/notes` | 통과 | `src/backend/tests/note.test.js`의 repository mock 기반 API 테스트. 미인증 접근, invalid noteId 400, 존재하지 않는 노트 404, 타인 소유 노트 접근 차단, 필수값/tags/빈 수정 body 검증 포함 |
| Study Note focused test | `npm --prefix src/backend test -- --runTestsByPath tests/note.test.js` | 통과 | 학습 노트 API 단일 테스트 파일 기준 1 suite / 13 tests passed |
| Focus/Statistics focused test | `npm --prefix src/backend test -- --runTestsByPath tests/focus-statistics.test.js` | 통과 | 집중 시간/통계 API 단일 테스트 파일 기준 1 suite / 10 tests passed |
| Documentation diff check | `git diff --check` | 통과 | API 명세와 테스트 보고서 최신화 작업 기준 whitespace 오류 없음 |
| Dev seed guard test | 개발용 seed script production guard 및 seed 구성 | 통과 | `src/backend/tests/seed-dev.test.js` |
| Dev seed execution | `npm run seed:dev` | 통과 | production이 아닌 개발용 branch 기준 일반 사용자, 관리자 사용자, 기본 UserProfile seed 완료 |
| Prisma validate | `npm run validate:prisma` | 통과 | Prisma schema valid |
| Frontend config | `npm run check:frontend` | 통과 | Expo public config 확인 |
| Frontend web export | `npm run check:frontend:web` | 통과 | Expo Web export 성공 |
| Frontend auth integration | 로그인/회원가입 화면 Auth API service 연결 | 통과 | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` 호출 흐름과 token 저장/삭제 흐름 반영, token 원문 미기록 |
| Admin screen integration | PR #75 관리자 화면 연결 | 통과 | ADMIN 계정 관리자 화면 진입, 일반 USER 접근 차단, 로그아웃 후 접근 차단, 신고 기각/취소 후 목록 갱신, 민감정보 화면 미노출 수동 확인 |
| AI screen integration | PR #76 AI 학습 지원 화면 연결 | 통과 | 로그인, Dashboard, 기존 관리자 화면 유지, AI 화면 진입, 질문/응답 표시, 한국어 응답, 에러/fallback 표시, 로그아웃, 프론트 외부 AI API 직접 호출 없음 수동 확인 |
| PR #75 자동 검증 | 관리자 화면 연결 PR 검증 | 통과 | `npm run check:frontend`, `npm run check:frontend:web`, `npm run check`, `npm test`(8 suites / 103 tests passed), `git diff --check origin/main...HEAD`, `npm run validate:prisma`, `npm --prefix src/backend run prisma:generate` 통과 |
| PR #76 자동 검증 | AI 학습 지원 화면 연결 PR 검증 | 통과 | 최신 main 반영 및 #75 변경 보존 후 `npm run check:frontend`, `npm run check:frontend:web`, `npm run check`, `npm test`(8 suites / 103 tests passed), `git diff --check origin/main...HEAD`, `npm run validate:prisma`, `npm --prefix src/backend run prisma:generate` 통과 |
| PR #81 자동 검증 | 학습 노트 CRUD API PR 검증 | 통과 | `git diff --check origin/main...origin/feature/study-note-api`, `npm run validate:prisma`, `npm test`(9 suites / 116 tests passed), `npm --prefix src/backend test -- --runTestsByPath tests/note.test.js`(1 suite / 13 tests passed), `npm run check` 통과 |
| Focus/Statistics API 검증 | 집중 시간/통계 API 구현 검증 | 통과 | `npm test`(10 suites / 126 tests passed), `npm --prefix src/backend test -- --runTestsByPath tests/focus-statistics.test.js`(1 suite / 10 tests passed) 통과 |
| 전체 검증 | `npm run check` | 통과 | backend test, Prisma validate, frontend config/export 통합 확인 |
| Prisma migration | `npx prisma migrate dev --name init` | 통과 | PR #41 기준 초기 migration 생성 |

현재 실제 테스트 파일은 다음과 같음.

- `src/backend/tests/health.test.js`
- `src/backend/tests/auth.test.js`
- `src/backend/tests/api-foundation.test.js`
- `src/backend/tests/user-profile.test.js`
- `src/backend/tests/schedule-task.test.js`
- `src/backend/tests/ai.test.js`
- `src/backend/tests/admin.test.js`
- `src/backend/tests/note.test.js`
- `src/backend/tests/focus-statistics.test.js`
- `src/backend/tests/seed-dev.test.js`

인증 API 테스트는 기본 `npm test`가 로컬 DB 권한 상태에 의존하지 않도록 repository mock 기반으로 HTTP 요청/응답, bcrypt 해싱, JWT 발급/검증, `passwordHash` 미노출을 확인함. 실제 DB 연결 가능 여부는 `npm run test:db`로 별도 확인함.

공통 API 기반 테스트는 이후 기능 구현에서 재사용할 response helper, AppError, validation helper, async handler, 테스트 helper의 동작을 확인함.

사용자/프로필 API 테스트는 repository mock 기반으로 로그인한 사용자 정보 조회, 프로필 조회/수정, 미인증 접근 차단, 허용되지 않은 프로필 필드 검증, `passwordHash` 미노출을 확인함. 프론트엔드 화면 연동은 후속 작업으로 둠.

학습 일정/칸반 태스크 API 테스트는 repository mock 기반으로 일정 CRUD, 태스크 CRUD, 태스크 상태 변경, 미인증 접근 차단, 다른 사용자 데이터 접근 차단, 잘못된 status 검증을 확인함. 프론트엔드 일정/칸반 화면 연동은 후속 작업으로 둠.

AI 학습 지원 API 테스트는 repository mock과 provider mock/fallback 기반으로 AI 질의, 학습 추천, 텍스트 요약, 오답 분석 API를 확인함. `AI_API_KEY`가 없는 경우와 provider 실패 시 fallback 응답을 사용하며, 자동 테스트에서는 실제 외부 AI API를 호출하지 않음. `noteId`는 현재 로그인 사용자 소유 학습 노트만 허용하고, invalid noteId는 400, 존재하지 않거나 다른 사용자 소유 noteId는 404로 처리되는지 검증함.

관리자 API 테스트는 repository mock 기반으로 관리자 권한 및 일반 사용자 권한 접근 제한(401/403)을 확인하고, 사용자 상태 변경(제재), 신고 목록 및 처리 기록 조회, 게시글 삭제(HIDE action), 댓글 삭제, 챌린지 강제 종료 등의 관리자 조치 기능이 정상 수행되는지 검증함. 잘못된 id는 400, 존재하지 않는 대상은 404로 처리되는지와 관리자 자기 자신의 정지/비활성화 차단, `passwordHash` 등 민감정보 미노출도 함께 확인함.

학습 노트 API 테스트는 repository mock 기반으로 실제 Express route, `authMiddleware`, service validation 흐름을 통과시키며 학습 노트 CRUD 기능과 본인 소유 데이터 접근 제한을 확인함. 미인증 요청은 401, invalid noteId와 잘못된 입력은 400, 존재하지 않거나 다른 사용자 소유 노트는 404로 처리되는지 검증함. 자동 테스트는 실제 DB 쓰기 없이 수행함.


개발용 seed script 테스트는 실제 DB 쓰기 없이 seed 대상 사용자 구성, production 실행 방지 guard, 필수 환경 키 검증을 확인함. 이후 production이 아닌 개발용 branch 기준으로 `npm run seed:dev`를 실행하여 개발용 일반 사용자, 개발용 관리자 사용자, 기본 UserProfile seed가 완료됨을 확인함. 실행 결과에는 실제 DB URL, host, password, API key를 기록하지 않음.

프론트엔드 인증 화면 연결은 LoginScreen/RegisterScreen/DashboardScreen과 frontend API service 기준으로 확인함. 로그인/회원가입 성공 시 token 저장, 앱 시작 시 `GET /api/auth/me` 현재 사용자 확인, 로그아웃 시 token 삭제 흐름을 반영함. 자동 화면 테스트는 아직 없으며, 이번 단계에서는 Expo config와 Web export 검증으로 빌드 가능성을 확인함. 실제 JWT token 원문은 기록하지 않음.

관리자 화면 연결은 PR #75에서 기존 관리자 API를 프론트 화면에 연결한 뒤 검증함. 자동 검증은 `npm run check:frontend`, `npm run check:frontend:web`, `npm run check`, `npm test`, `git diff --check origin/main...HEAD`, `npm run validate:prisma`, `npm --prefix src/backend run prisma:generate`가 모두 통과함. 수동 확인으로 ADMIN 계정의 관리자 화면 진입, 일반 USER 접근 차단, 로그아웃 후 접근 차단, 신고 기각/취소 후 목록 갱신, 민감정보 화면 미노출을 확인함. schema/migration/package 변경은 없음.

AI 학습 지원 화면 연결은 PR #76에서 최신 main을 반영하고 PR #75 관리자 화면 변경을 보존한 뒤 검증함. 자동 검증은 `npm run check:frontend`, `npm run check:frontend:web`, `npm run check`, `npm test`, `git diff --check origin/main...HEAD`, `npm run validate:prisma`, `npm --prefix src/backend run prisma:generate`가 모두 통과함. 수동 확인으로 로그인, Dashboard, 기존 관리자 화면 유지, AI 학습 지원 화면 진입, 질문 입력 및 응답 표시, AI 응답 한국어 출력, 에러/fallback 표시, 로그아웃, 화면/콘솔의 token/password/API key/DB URL 원문 미노출, 프론트에서 외부 AI API를 직접 호출하지 않음을 확인함. schema/migration/package 변경은 없음.

Network 탭의 Authorization Bearer token은 로그인된 API 요청 특성상 DevTools에서 보일 수 있는 정상 동작임. 단, 해당 token이 포함된 스크린샷은 PR, Issue, comment, 문서에 첨부하지 않으며 실제 token 값도 문서에 작성하지 않음.

---

## 6. 커버리지 결과

현재 상태는 coverage 정량 측정 전임.

유닛/통합 테스트가 기능별로 추가된 뒤 Jest coverage 설정 또는 `npm test -- --coverage` 방식으로 측정할 예정임.

| 구분 | 도구 | 측정 항목 | 현재 결과 | 비고 |
|---|---|---|---|---|
| Backend | Jest | Statements / Branches / Functions / Lines | 측정 예정 | 기능 테스트 추가 후 측정 |
| API Integration | Jest + Supertest | API 흐름별 통합 테스트 통과율 | 측정 예정 | 현재 구현 API 기준으로 측정하고, 집중 시간/통계 및 커뮤니티 API 구현 시 확장 |
| Frontend | 추후 결정 | 화면/컴포넌트 테스트 | 측정 예정 | 구현 범위 확정 후 결정 |

커버리지 수치는 실제 측정 전까지 작성하지 않음.

---

## 7. 버그 로그

현재 main 기준으로 문서에 등록된 미해결 기능 버그는 없음.

환경 검증 과정에서 확인한 주의 사항은 다음과 같이 누적함.

| 버그 ID | 발생 구분 | 내용 | 원인 | 처리 상태 | 재검증 |
|---|---|---|---|---|---|
| BUG-ENV-001 | 환경 검증 | `src/backend`에서 루트 전용 검증 명령을 실행하면 script 없음 오류가 발생할 수 있음 | 일부 검증 명령은 루트 `package.json` 기준으로 정의됨 | 루트에서 재실행하는 방식으로 정리 | 통과 |

추후 기능 구현 중 발견되는 오류는 `BUG-BE-*`, `BUG-FE-*`, `BUG-DB-*`, `BUG-AI-*` 형식으로 누적 예정임.

---

## 8. AI 생성/보조 테스트 스크립트 기록

교수님 요구사항에 따라 AI 생성/보조 테스트 스크립트 기록을 별도 섹션으로 관리함.

현재 `src/backend/tests/health.test.js`는 실제 존재하는 Jest + Supertest 기반 테스트 스크립트임. AI 생성 여부는 별도 커밋 또는 작업 로그 근거로 확정하지 않고, 현재 보고서에서는 AI 보조 테스트 설계/검토 항목으로 관리함.

| 항목 | 내용 |
|---|---|
| 대상 기능 | Health Check API |
| 테스트 파일 | `src/backend/tests/health.test.js` |
| 도구 | Jest, Supertest |
| AI 활용 방식 | AI를 활용해 테스트 케이스 초안 작성 또는 검토를 보조하고, 팀원이 응답 형식과 상태 코드를 검토한 뒤 반영하는 방식으로 운영 |
| 실행 명령 | `npm test` |
| 결과 | 통과 |

| 항목 | 내용 |
|---|---|
| 대상 기능 | 인증 API |
| 테스트 파일 | `src/backend/tests/auth.test.js` |
| 도구 | Jest, Supertest |
| AI 활용 방식 | AI를 활용해 인증 API 테스트 항목 누락 여부를 검토하고, 팀원이 회원가입, 로그인, JWT 인증, `passwordHash` 미노출 검증 기준을 확인한 뒤 반영 |
| 실행 명령 | `npm test` |
| 결과 | 통과 |

| 항목 | 내용 |
|---|---|
| 대상 기능 | 관리자 기능 API |
| 테스트 파일 | `src/backend/tests/admin.test.js` |
| 도구 | Jest, Supertest |
| AI 활용 방식 | AI를 활용해 관리자(ADMIN) 권한 제한 및 트랜잭션 예외 상황(잘못된 제재 상태 등)에 대한 테스트 케이스를 누락 없이 도출하고 Mock Repository를 설계함 |
| 실행 명령 | `npm test` |
| 결과 | 통과 |

| 항목 | 내용 |
|---|---|
| 대상 기능 | AI 학습 지원 API |
| 테스트 파일 | `src/backend/tests/ai.test.js` |
| 도구 | Jest, Supertest |
| AI 활용 방식 | AI 기능의 provider 실패, fallback, 입력값 검증, noteId 소유권 검증, rate limit 테스트 케이스를 검토하고 mock repository와 mock provider 기반 테스트로 반영 |
| 실행 명령 | `npm test` |
| 결과 | 통과 |
| 비고 | 자동 테스트는 실제 외부 AI API를 호출하지 않고 mock/fallback 중심으로 수행함 |

| 항목 | 내용 |
|---|---|
| 대상 기능 | 학습 노트 API |
| 테스트 파일 | `src/backend/tests/note.test.js` |
| 도구 | Jest, Supertest |
| AI 활용 방식 | AI를 활용해 학습 노트 CRUD 및 타인 데이터 접근 차단(권한 격리)에 대한 테스트 케이스를 설계함 |
| 실행 명령 | `npm test` |
| 결과 | 통과 |

향후 집중 시간/통계, 커뮤니티, 랭킹/챌린지, 프론트 화면 자동 테스트를 작성할 때 AI 보조 테스트 스크립트 기록을 항목별로 추가함.

---

## 9. 향후 테스트 계획

향후 테스트는 기능 구현 순서에 맞춰 다음 항목을 추가함.

| 영역 | 테스트 계획 | 상태 |
|---|---|---|
| 인증/회원가입/로그인 API | 백엔드 회원가입, 로그인, JWT 발급/검증 테스트 완료. 프론트엔드 로그인/회원가입 화면 연결과 token 저장/현재 사용자 확인 흐름 반영 완료. 세부 권한 분기와 화면 자동 테스트는 후속 작성 | 진행 중 |
| 백엔드 공통 API 기반 | 공통 응답, 에러, validation, async handler, 테스트 helper 구조를 기반으로 이후 API 테스트 확장 | 진행 중 |
| 사용자 프로필 | 백엔드 현재 사용자 조회와 프로필 조회/수정 API 테스트 완료. 프론트엔드 연동과 세부 프로필 확장은 후속 작성 | 진행 중 |
| 개발용 seed 데이터 | 개발용 일반 사용자, 관리자 사용자, 기본 UserProfile 생성 script 추가. 실제 seed 실행은 개발용 DB branch에서만 수행 | 진행 중 |
| 학습 일정/태스크 | 백엔드 일정 CRUD, 태스크 CRUD, 태스크 상태 변경, 사용자별 접근 제한 테스트 완료. 프론트엔드 연동과 알림 연계 테스트는 후속 작성 | 진행 중 |
| 학습 노트 | 노트 CRUD, 인증/권한, invalid noteId, 필수값/tags 검증, 삭제 후 재조회 404 테스트 완료. 학습 노트 프론트 화면과 오답노트/복습 알림 연계는 후속 기능과 함께 별도 검토 | 완료 |
| AI 학습 지원 | AI 질의, 추천, 요약, 오답 분석 API mock/fallback 테스트와 AI 학습 지원 화면 수동 확인 완료. 실제 외부 AI API 호출 검증은 비용/키 관리 이슈로 자동 테스트 범위에서 제외 | 완료 |
| 집중 시간/통계 | `durationMs` 저장, 세션 목록 조회, 통계 집계, 히트맵 데이터 테스트 | 완료 |
| 커뮤니티/게시판 | 1차 게시글 CRUD API 테스트, 후속 댓글/신고/관리자 연동 흐름 테스트 | 예정 |
| 관리자 기능 | 사용자 제재, 게시글 관리, 챌린지 관리 API 테스트와 관리자 화면 수동 확인 완료 | 완료 |
| 프론트엔드 | 인증 화면, 관리자 화면, AI 학습 지원 화면 API service 연동 및 Web export 검증 완료. 화면 자동 테스트와 일정/태스크 화면 연동은 후속 작성 | 진행 중 |
| 2단계 품질 보강 | coverage 결과, 프론트 자동 테스트, E2E 또는 수동 시나리오 테스트, 배포 전 smoke test | 예정 |
| 3단계 산출물 검증 | 최종보고서, 설치/사용 가이드, 데모 영상, 발표자료, 데모 스크립트 검토 | 예정 |
| 배포 후 smoke test | 배포 URL 접근, health check, 주요 화면 접근 확인 | 예정 |

---

## 10. 부록

- 테스트 관련 파일
  - `src/backend/tests/health.test.js`
  - `src/backend/tests/auth.test.js`
  - `src/backend/tests/api-foundation.test.js`
  - `src/backend/tests/user-profile.test.js`
  - `src/backend/tests/schedule-task.test.js`
  - `src/backend/tests/seed-dev.test.js`
  - `src/backend/tests/ai.test.js`
  - `src/backend/tests/admin.test.js`
  - `src/backend/tests/note.test.js`
  - `src/backend/tests/helpers/auth.helper.js`
  - `src/backend/tests/helpers/assert.helper.js`
  - `src/backend/package.json`
  - `src/frontend/package.json`
  - `package.json`

- Prisma/DB 관련 파일
  - `src/backend/prisma/schema.prisma`
  - `src/backend/prisma/migrations/20260521201109_init/migration.sql`
  - `src/backend/prisma/migrations/migration_lock.toml`
  - `src/backend/scripts/seed-dev.js`
  - `src/backend/src/repositories/admin.repository.js`
  - `src/backend/src/services/admin.service.js`
  - `src/backend/src/controllers/admin.controller.js`
  - `src/backend/src/routes/admin.routes.js`

- 관련 문서/이슈
  - `docs/design/design-document.md`
  - `docs/design/implementation-plan.md`
  - `docs/requirements/requirements-document.md`
  - Issue #14
  - Issue #40
  - PR #41
