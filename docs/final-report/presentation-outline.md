# 최종 발표자료 구성안

## 1. 표지

- 프로젝트명: Smart Edu Platform
- 팀: Software Engineering Team 15
- 주제: 개인 맞춤형 학습 관리 웹/모바일 앱

## 2. 주제 선정 이유

- 학습 계획, 복습, 질문, 집중 기록, 소통, 보상이 여러 도구로 분리되는 문제
- 학습 흐름을 한 화면 흐름으로 연결해야 하는 필요성
- 다양한 연령과 접근성 요구를 고려한 학습 관리 서비스 목표

## 3. 작업 흐름과 협업 방식

- 요구사항 분석 → 설계 → 구현 → 테스트 → 배포/문서 정리
- GitHub Issue/branch/PR 기반 작업
- main 안정성 유지, 일반 merge commit 방식
- 조원 PR 검증 체크리스트 기반 리뷰

## 4. 요구사항 요약

- 사용자 등록/로그인
- 학습 일정 관리
- 노트 및 퀴즈 생성/관리
- AI 기반 학습 추천
- 데이터 시각화
- 보안 및 프라이버시 고려

## 5. 설계문서 요약

- 프론트엔드, 백엔드, DB, AI 시스템, 외부 연동 구조
- REST API와 WebSocket 이벤트 흐름
- Prisma 기반 데이터 모델
- 주요 use case와 sequence 흐름

## 6. 기술 스택 선정 이유

- Expo/React Native Web: 웹/모바일 공통 UI
- Express: REST API와 WebSocket 구현
- Prisma: schema 기반 DB 접근
- Jest/Supertest: API 단위/통합 테스트
- Vercel/Render 계열: 프론트/백엔드 분리 배포

## 7. README 작업 규칙

- main 직접 작업을 피하고 PR 기반으로 반영
- task branch 단위 작업
- PR 검증 후 merge
- 위험 명령, secret 노출, production DB write를 제한하는 안전 기준
- 문서와 구현 추적성 유지

## 8. AI 사용 규칙

- AI는 요구사항 정리, 테스트 케이스 검토, 코드 보조, 문서 초안 정리에 사용
- 실제 secret, DB URL, token 원문은 AI 입력과 문서에서 제외
- AI 생성 결과는 팀원이 검토하고 수정
- 제출 문서에는 작업 지시문이 아니라 결과 중심으로 정리

## 9. 핵심 기능

- 대시보드
- 일정/칸반
- AI 학습 지원
- 집중/통계/히트맵
- 커뮤니티
- 친구/쪽지
- 보상/포인트 상점
- 협동 퀘스트/보스 레이드
- 접근성
- 관리자/점검 모드

## 10. 교수님 제시 주제 1 필수 기능 우선 구현

- 사용자 등록/로그인
- 학습 일정 관리
- 노트 및 퀴즈 생성/관리
- AI 기반 학습 추천
- 데이터 시각화
- 보안 및 프라이버시 고려

## 11. 확장 구현

- 실시간 쪽지와 친구 접속 상태
- 커뮤니티 댓글/반응/북마크/신고
- 접근성 돋보기와 전체 읽기
- 포인트 상점과 프로필 꾸미기
- 협동 퀘스트와 보스 레이드
- WebSocket 기반 실시간 이벤트

## 12. 테스트와 배포

- 최신 기준 backend test 29 suites / 530 tests 통과
- Prisma validate/generate 통과
- Expo Web export 통과
- 배포 smoke test 항목 정리
- seed 데이터는 승인된 demo/deployment DB에 적용

## 13. 아쉬운 점

- 외부 AI API 한도 때문에 실서비스 수준의 AI 검증은 제한적
- 보스 레이드 참여자별 숨김/탈퇴 정책은 후속 설계 필요
- 프론트 E2E와 coverage 정량 측정은 보강 필요

## 14. 향후 확장성

- AI 개인화 고도화
- 외부 캘린더/알림 연동
- 운영 모니터링과 배포 자동화 강화
- 접근성 자동 테스트 확대

## 15. 팀원별 소감

- 정이량: 최종 발표 전 작성
- 황대겸: 최종 발표 전 작성
- 박지환: 최종 발표 전 작성

---

## 관련 산출물

- [문서 부록 인덱스](../README.md)
- [테스트 보고서](../test-report/test-report.md)
- [설치 및 사용 가이드](../deployment/install-and-usage-guide.md)
- [배포 smoke test](../deployment/vercel-smoke-test.md)
