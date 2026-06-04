# Vercel 배포 Smoke Test 체크리스트

## 1. 목적

Vercel 배포 후 Smart Edu Platform의 주요 화면과 API 연결이 정상 동작하는지 빠르게 확인하기 위한 체크리스트이다. 실제 배포 절차 전체가 아니라, 배포 결과를 사용자 흐름 기준으로 검증하는 문서이다.

## 2. 사전 조건

- 최신 `main` 기준으로 배포되어 있음
- 프론트엔드 공개 API base URL이 배포 백엔드와 연결되어 있음
- 백엔드 DB, JWT secret, CORS, WebSocket endpoint가 배포 환경에 설정되어 있음
- DB URL, token, password, API key, secret 원문을 화면·로그·문서에 출력하지 않음
- migration 적용은 별도 승인된 배포 절차에서만 수행함
- seed 데이터는 local/dev/demo/deployment-demo 환경에서만 실행하며, 공유 DB에는 명시적 승인 없이 실행하지 않음

### 2.1 최근 DB migration 적용 기록

2026년 06월 04일 기준 사용자가 현재 DB를 deployment/demo DB로 확인하고 migration 적용을 승인했다. 이에 따라 `20260604000000_add_boss_raid_participant_visibility` migration을 `prisma migrate deploy` 방식으로 확인했으며, deploy 결과 pending migration은 없었다. DB URL, host, DB 이름, password, token, secret 원문은 기록하지 않았다.

보스 레이드 smoke test는 배포/demo DB 데이터를 임의로 변경하지 않기 위해 비파괴 Prisma 조회로 수행했다. `BossRaidPartyMember`의 `hiddenAt`, `archivedAt`, `leftAt` column select와 active member filter query가 column error 없이 성공했다. 실제 `leave`/`archive`/`restore` POST API는 참여자 상태를 변경하는 쓰기 요청이므로, 자동 smoke에서는 실행하지 않고 backend repository mock 기반 테스트로 정책을 검증한다.

## 3. 환경 변수 확인

| 항목 | 확인 내용 |
|---|---|
| Frontend API URL | Vercel 환경 변수의 `EXPO_PUBLIC_API_BASE_URL` 설정 여부 |
| Backend DB | 백엔드 서버의 DB 연결 환경 변수 설정 여부 |
| JWT secret | 인증 secret 설정 여부 |
| AI API key | 실제 AI provider 사용이 필요한 경우에만 설정, 미설정 시 fallback 확인 |
| CORS | Vercel 프론트 도메인이 백엔드 CORS 허용 대상인지 확인 |
| WebSocket | 브라우저가 백엔드 `/ws` endpoint에 연결 가능한지 확인 |

## 4. 배포 전 검증

- [ ] `git pull --ff-only origin main`
- [ ] `npm run validate:prisma`
- [ ] `npm --prefix src/backend run prisma:generate`
- [ ] `npm test`
- [ ] `npm run check`
- [ ] `npm run check:frontend`
- [ ] `npm run check:frontend:web`
- [ ] pending migration 여부 확인
- [ ] secret 원문이 로그나 문서에 남지 않았는지 확인

## 5. 기본 접속

- [ ] 소개페이지 인트로가 첫 진입에서 정상 표시됨
- [ ] 인트로 종료 후 랜딩 화면이 정상 표시됨
- [ ] 서비스 소개 섹션이 깨지지 않음
- [ ] 로그인 화면으로 이동 가능
- [ ] 회원가입 화면으로 이동 가능
- [ ] 존재하지 않는 route에서 앱이 비정상 종료되지 않음

## 6. 인증/계정

- [ ] 회원가입 성공
- [ ] 로그인 성공
- [ ] 로그인 실패 메시지 표시
- [ ] 현재 사용자 세션 복원
- [ ] 로그아웃 성공
- [ ] 프로필/마이페이지 진입
- [ ] 비밀번호 변경 성공/실패 메시지 확인
- [ ] 정지/비활성 계정 제한 화면 확인

## 7. 학습 관리

- [ ] 대시보드 요약 카드 표시
- [ ] 일정 생성/수정/삭제
- [ ] 칸반 태스크 생성/상태 변경/삭제
- [ ] D-Day 일정 표시
- [ ] 복습 알림 설정 흐름 확인
- [ ] 진행 중 퀘스트 더보기/숨기기 확인

## 8. 집중/통계

- [ ] 집중 세션 저장
- [ ] 주간 집중 통계 표시
- [ ] 히트맵 표시 강도 확인
- [ ] 데이터가 없을 때 빈 상태 안내 표시
- [ ] 다크모드/고대비에서도 통계 카드가 읽힘

## 9. AI 학습

- [ ] AI 학습 화면 진입
- [ ] 질문 입력 후 응답 또는 fallback 표시
- [ ] 요약/추천/오답 분석 흐름 확인
- [ ] quota 또는 provider 오류 안내 확인
- [ ] 프론트엔드에서 외부 AI API key가 노출되지 않음

## 10. 커뮤니티/친구/쪽지

- [ ] 게시글 목록 조회
- [ ] 게시글 상세 overlay 진입/닫기
- [ ] 댓글 작성/조회
- [ ] 좋아요/싫어요 버튼과 숫자 표시
- [ ] 북마크 추가/해제
- [ ] 신고 생성
- [ ] 친구 검색
- [ ] 친구 요청 보내기
- [ ] 받은 요청 수락/거절
- [ ] 친구 목록 조회
- [ ] 쪽지 thread 조회/전송/읽음 처리
- [ ] WebSocket 실패 시 HTTP fallback으로 상태 확인 가능

## 11. 보상/협동

- [ ] 포인트 상점 목록 표시
- [ ] 아이템 구매/적용/해제
- [ ] 칭호가 마이페이지와 학습 흐름에 반영됨
- [ ] 협동 퀘스트 목록/참여/기여도/보상 확인
- [ ] 협동 퀘스트 숨김/보관/복원 흐름 확인
- [ ] 보스 레이드 파티 목록/상세/진행률 확인
- [ ] 보스 레이드 보상 중복 수령 방지 확인

## 12. 접근성/UI

- [ ] 고대비 모드 on/off
- [ ] 텍스트 크기 설정
- [ ] 모션 감소 설정
- [ ] 초등학생 친화 UI 설정
- [ ] 돋보기 기능
- [ ] 전체 읽기 버튼
- [ ] 모바일 360px 폭에서 주요 버튼과 텍스트가 겹치지 않음

## 13. 관리자/점검

- [ ] 관리자 계정으로 Admin 화면 진입
- [ ] 일반 사용자에게 관리자 메뉴가 노출되지 않음
- [ ] 커뮤니티 신고 목록/처리 확인
- [ ] 사용자 계정 상태 변경 확인
- [ ] 점검 모드 ON/OFF 확인
- [ ] 관리자 공지 broadcast 확인
- [ ] 점검 화면의 로그인 버튼 동작 확인

## 14. Seed 데이터 확인

- [ ] demo 계정으로 주요 화면 데이터가 비어 보이지 않음
- [ ] 일정/칸반/집중/통계 데이터 표시
- [ ] 커뮤니티/친구/쪽지 데이터 표시
- [ ] 보상/상점/협동 퀘스트 데이터 표시
- [ ] AI 학습 관련 demo 데이터 표시
- [ ] seed 데이터에 실제 개인정보, token, API key, secret이 포함되지 않음

## 15. 실패 기록 항목

| 항목 | 기록 내용 |
|---|---|
| 발생 화면 | 예: `/statistics`, `/community` |
| 재현 단계 | 클릭/입력 순서 |
| 기대 결과 | 정상 동작 기준 |
| 실제 결과 | 오류 메시지 또는 화면 상태 |
| 브라우저/viewport | Chrome, mobile width 등 |
| 로그 | 민감정보를 제거한 요약만 작성 |

## 16. 배포 판정 기준

- 핵심 사용자 흐름에 진입 가능하면 demo 가능한 상태로 판단한다.
- schema/migration pending이 있으면 배포 전 적용 여부를 별도 판단한다.
- API base URL, CORS, WebSocket 문제가 있으면 배포 blocker로 처리한다.
- 실제 외부 AI/OCR API가 연결되지 않은 기능은 발표와 문서에서 mock/fallback 범위를 명확히 설명한다.

---

## 관련 산출물

- [문서 부록 인덱스](../README.md)
- [최종보고서](../final-report/final-report.md)
- [데모 영상 시나리오](../final-report/demo-video-scenario.md)
- [테스트 보고서](../test-report/test-report.md)
- [API 명세](../api/api-spec.md)
