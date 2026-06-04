# 설치 및 사용 가이드

## 1. 목적

이 문서는 Smart Edu Platform을 로컬 개발 환경에서 실행하고, demo/deployment 환경에서 smoke test를 수행하기 위한 기본 절차를 정리한다. 실제 secret 값, DB URL, token, password 원문은 문서에 포함하지 않는다.

## 2. 사전 준비

- Node.js와 npm 설치
- Git 저장소 clone
- 백엔드와 프론트엔드 의존성 설치
- 로컬 또는 승인된 demo/deployment DB 준비
- 필요한 환경 변수 파일 준비

## 3. 환경 변수 안내

환경 변수에는 다음 계열의 값이 필요할 수 있다.

| 구분 | 예시 key | 설명 |
|---|---|---|
| Backend DB | `DATABASE_URL` | Prisma가 사용할 DB 연결 문자열. 원문은 문서와 로그에 출력하지 않음 |
| Auth | `JWT_SECRET` | 인증 token 서명용 secret. 실제 값은 저장소에 커밋하지 않음 |
| Frontend API | `EXPO_PUBLIC_API_BASE_URL` | 프론트엔드가 호출할 백엔드 API base URL |
| AI | `AI_API_KEY` | 실제 AI provider 사용 시에만 설정. 미설정 또는 실패 시 fallback 흐름 유지 |

`.env` 파일은 Git에 커밋하지 않는다. 환경 값 확인 시에도 원문을 출력하지 않고 local/dev/demo/deployment 여부만 분류한다.

## 4. 의존성 설치

루트와 각 하위 프로젝트에서 의존성을 설치한다.

```bash
npm install
npm --prefix src/backend install
npm --prefix src/frontend install
```

이미 의존성이 설치되어 있으면 재설치하지 않고 다음 단계로 진행해도 된다.

## 5. Backend 실행

```bash
npm --prefix src/backend run dev
```

기본 개발 API는 로컬 환경에서 `http://localhost:4000/api` 기준으로 사용한다. 실제 포트와 API base URL은 환경 변수와 서버 로그 기준으로 확인한다.

## 6. Frontend 실행

```bash
npm --prefix src/frontend run web
```

프론트엔드는 `EXPO_PUBLIC_API_BASE_URL`에 설정된 백엔드 API를 호출한다. 배포 환경에서는 Vercel이 주입한 공개 API base URL을 사용한다.

## 7. Prisma 검증과 생성

```bash
npm run validate:prisma
npm --prefix src/backend run prisma:generate
```

배포 전 schema 검증과 Prisma Client 생성을 확인한다. migration 적용은 별도 승인된 배포 절차에서만 수행한다.

배포/demo DB에 migration을 적용할 때는 `prisma migrate dev`가 아니라 deploy 절차를 사용한다. backend package에 별도 deploy script가 없으면 backend 디렉터리 기준으로 다음 명령을 사용한다.

```bash
npx prisma migrate deploy
```

2026년 06월 04일 기준 사용자가 승인한 deployment/demo DB에 `20260604000000_add_boss_raid_participant_visibility` migration 적용 상태를 확인했다. 실행 결과 pending migration은 없었고, seed는 실행하지 않았다. DB URL, host, DB 이름, password, token, secret 원문은 문서에 기록하지 않는다.

## 8. Seed 실행

개발/demo 데이터가 필요한 경우 아래 명령을 사용한다.

```bash
npm run seed:dev
```

주의사항:

- production DB로 판단되는 환경에서는 실행하지 않는다.
- DB target이 local/dev/demo/deployment-demo로 명확하거나 사용자가 승인한 경우에만 실행한다.
- seed 실행 전 `NODE_ENV=production` 여부를 확인한다.
- 실제 DB URL, host, password, token, secret 원문은 출력하지 않는다.
- migration 적용과 seed 실행은 별개의 절차로 다룬다.

이번 최종 정리 기준으로 사용자가 승인한 deployment/demo DB에 최신 seed를 1회 적용했다.

## 9. 테스트 실행

```bash
npm test
npm run check
npm run check:frontend
npm run check:frontend:web
```

추가로 특정 seed 테스트를 확인할 때는 다음 명령을 사용할 수 있다.

```bash
npm --prefix src/backend test -- --runTestsByPath tests/seed-dev.test.js
```

## 10. 배포 Smoke Test

배포 후에는 다음 항목을 확인한다.

- 소개페이지 인트로와 랜딩 화면 표시
- 회원가입/로그인/로그아웃
- 대시보드, 일정, 칸반
- AI 학습 화면과 fallback 응답
- 집중 통계와 히트맵
- 커뮤니티 목록/상세/댓글/반응
- 친구 요청, 접속 상태, 쪽지
- 보상/상점/프로필 꾸미기
- 협동 퀘스트/보스 레이드
- 접근성 설정, 돋보기, 전체 읽기
- 관리자 점검 모드와 공지
- WebSocket 실패 시 HTTP fallback

상세 체크리스트는 [Vercel smoke test 문서](./vercel-smoke-test.md)를 참고한다.

## 11. Demo 계정 안내

최신 seed에는 여러 demo 사용자 alias가 포함되어 있다. 문서에는 실제 비밀번호를 기록하지 않는다. 시연 전에는 팀 내부에서 승인된 방식으로 demo 계정 정보를 공유한다.

## 12. 민감정보 관리

- `.env`, DB URL, JWT secret, API key, token 원문을 문서에 작성하지 않는다.
- 테스트 로그나 PR 본문에 secret이 포함되지 않게 확인한다.
- 배포 hook이나 Render/Vercel secret 값은 원문으로 출력하지 않는다.
- seed 계정의 실제 비밀번호는 공개 문서에 남기지 않는다.

---

## 관련 산출물

- [문서 부록 인덱스](../README.md)
- [최종보고서](../final-report/final-report-draft.md)
- [데모 영상 시나리오](../final-report/demo-video-scenario.md)
- [테스트 보고서](../test-report/test-report.md)
- [API 명세](../api/api-spec.md)
