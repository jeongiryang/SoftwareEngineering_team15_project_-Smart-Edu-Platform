# Vercel 배포 Smoke Test 체크리스트

## 1. 목적

Vercel 배포 전후에 Smart Edu Platform의 핵심 기능이 정상 동작하는지 빠르게 확인하기 위한 체크리스트이다. 실제 배포 실행 절차가 아니라, 배포 환경과 주요 화면을 검증하는 기준으로 사용한다.

## 2. 사전 조건

- 최신 `main` 기준으로 배포한다.
- Vercel 환경변수에 프론트엔드 API 주소를 설정한다.
- 실제 DB URL, JWT secret, token, API key 원문은 화면, 로그, 문서에 노출하지 않는다.
- Prisma migration 적용 상태를 확인한다.
- seed 데이터는 로컬/개발 DB에서만 실행하고, 운영/공유 DB에는 임의 실행하지 않는다.

## 3. 환경변수

| 항목 | 확인 내용 |
| --- | --- |
| Frontend API URL | Vercel에 `EXPO_PUBLIC_API_BASE_URL` 설정 여부 확인 |
| Backend DB | 백엔드 런타임 DB 연결 환경변수 설정 여부 확인 |
| JWT secret | 인증용 secret 설정 여부 확인 |
| AI API key | 실제 AI 연동이 필요한 경우에만 설정하고, Mock 모드 fallback 확인 |
| CORS | 배포된 프론트 도메인이 백엔드 CORS 허용 대상인지 확인 |

로컬 개발 기본값은 `http://localhost:4000/api`이며, 배포 환경에서는 `EXPO_PUBLIC_API_BASE_URL`로 API 서버 주소를 지정한다.

## 4. 배포 전 확인

- [ ] `git pull --ff-only origin main`
- [ ] `npm run validate:prisma`
- [ ] `npm --prefix src/backend run prisma:generate`
- [ ] `npm test`
- [ ] `npm run check`
- [ ] `npm run check:frontend`
- [ ] `npm run check:frontend:web`
- [ ] `cd src/backend && npx prisma migrate status`
- [ ] pending migration이 있으면 운영 기준을 확인한 뒤 `npx prisma migrate deploy` 사용

## 5. 기본 접속 Smoke Test

- [ ] 랜딩 화면이 정상 표시된다.
- [ ] 서비스 소개 footer와 GitHub 아이콘/tooltip이 정상 표시된다.
- [ ] 로그인 화면으로 이동할 수 있다.
- [ ] 회원가입 화면으로 이동할 수 있다.
- [ ] 브라우저 새로고침 후 현재 route가 유지된다.
- [ ] 뒤로가기/앞으로가기가 화면 상태와 충돌하지 않는다.
- [ ] 존재하지 않는 route에서 앱이 비정상 종료되지 않는다.

## 6. 인증/계정

- [ ] 회원가입 성공
- [ ] 로그인 성공
- [ ] 로그인 실패 메시지 확인
- [ ] 현재 사용자 세션 복원 확인
- [ ] 로그아웃 성공
- [ ] 프로필 대시보드 진입
- [ ] 닉네임 변경 성공/실패 메시지 확인
- [ ] 비밀번호 변경 성공/실패 메시지 확인

## 7. 학습 관리

- [ ] Dashboard 요약 카드 로딩/빈 상태/데이터 표시 확인
- [ ] Schedule 일정 생성, 수정, 삭제 확인
- [ ] Schedule 복습 알림 만들기 패널 확인
- [ ] TaskBoard 태스크 생성, 상태 변경, 삭제 확인
- [ ] D-Day 계획 생성 후 TODO 태스크 생성 확인
- [ ] Focus session 저장 흐름 확인
- [ ] 네트워크 실패 시 offline queue 안내가 깨지지 않는지 확인

## 8. 통계/프로필

- [ ] Statistics 요약 카드 표시
- [ ] 주간 집중 bar chart 표시
- [ ] heatmap-like grid 표시
- [ ] 데이터가 없는 경우 빈 상태 안내 표시
- [ ] Profile Dashboard에서 학습/보상/커뮤니티/친구 요약 표시
- [ ] 통계 API 오류 시 사용자 친화 메시지 표시

## 9. 커뮤니티/친구

- [ ] 게시글 목록 조회
- [ ] 게시글 작성/상세 진입
- [ ] 댓글 작성
- [ ] 좋아요/싫어요 반응
- [ ] 북마크 추가/해제
- [ ] 신고 생성
- [ ] 친구 검색
- [ ] 친구 요청 보내기
- [ ] 받은 요청 수락/거절
- [ ] 친구 목록 조회
- [ ] 친구 삭제

## 10. 보상/관리자

- [ ] 보상 대시보드 포인트/배지/퀘스트 표시
- [ ] 퀘스트 수령 가능/완료 상태 표시
- [ ] 관리자 계정으로 Admin 화면 진입
- [ ] 커뮤니티 신고 목록/처리 화면 확인
- [ ] 관리자 보상 API 연동 화면 확인
- [ ] 일반 사용자에게 관리자 메뉴가 노출되지 않는지 확인

## 11. AI/Mock/파일 첨부

- [ ] AI 학습 화면 진입
- [ ] AI Mock 모드 응답 표시
- [ ] token/quota/API key 오류 안내 문구 확인
- [ ] AI 채팅방 localStorage 흐름 확인
- [ ] AI 이미지 첨부 미리보기/삭제 확인
- [ ] 이미지 첨부가 실제 Vision 분석으로 오해되지 않게 표시되는지 확인
- [ ] OCR/PDF mock 노트·퀴즈 예시 표시
- [ ] 실제 외부 AI/OCR/Vision API 호출이 발생하지 않는지 확인

## 12. 접근성/음성/UI

- [ ] 고대비 모드 on/off
- [ ] 큰 글씨 설정 on/off
- [ ] 초등학생 친화 UI on/off
- [ ] 음성 입력 테스트 영역 동작
- [ ] 읽어주기 설정과 전체 읽기 버튼 동작
- [ ] 버튼/링크/입력칸 클릭 시 의도치 않은 읽어주기 중복이 없는지 확인
- [ ] inline feedback 메시지가 입력창 아래에 자연스럽게 표시
- [ ] hover/active/focus 피드백 유지
- [ ] 모바일 360px 폭에서 주요 버튼과 텍스트가 겹치지 않음

## 13. 데이터/seed 확인

- [ ] 데모 계정으로 주요 화면 데이터가 비어 보이지 않는다.
- [ ] 일정/칸반/집중/통계 데이터가 표시된다.
- [ ] 커뮤니티/보상/친구 데이터가 표시된다.
- [ ] AI 학습 관련 데모 데이터가 표시된다.
- [ ] seed 데이터에 실제 개인정보, token, API key가 포함되지 않는다.

## 14. 실패 시 기록할 항목

| 항목 | 기록 내용 |
| --- | --- |
| 발생 화면 | 예: `/statistics`, `/schedule` |
| 재현 단계 | 클릭/입력 순서 |
| 기대 결과 | 정상 동작 기준 |
| 실제 결과 | 에러 메시지 또는 화면 상태 |
| 브라우저/viewport | Chrome, mobile width 등 |
| 로그 | 민감정보를 제거한 요약만 작성 |

## 15. 배포 판정 기준

- 핵심 로그인/학습/커뮤니티/보상/AI Mock/접근성 흐름이 모두 진입 가능하면 데모 가능 상태로 본다.
- schema/migration pending이 있으면 배포 전 반드시 적용 여부를 별도 판단한다.
- API base URL 또는 CORS 문제가 있으면 배포 blocker로 처리한다.
- 실제 외부 AI/OCR API가 연결되지 않은 기능은 발표/문서에서 mock/demo 범위임을 명확히 설명한다.
