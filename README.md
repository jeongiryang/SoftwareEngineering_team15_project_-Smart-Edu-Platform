# 사각사각 Smart Edu Platform

사각사각 Smart Edu Platform은 일정, 칸반, 노트, 퀴즈, AI 학습 보조, 집중 기록, 커뮤니티, 보상, 협동 학습을 한 흐름으로 묶은 개인화 학습 관리 플랫폼이다.

이 README는 레포 첫 화면용 허브 문서이다. 긴 개발·협업 규칙은 [개발 및 협업 작업 규칙](./docs/development-workflow-rules.md)으로 이관해 관리한다.

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 과목 | Software Engineering |
| 팀 | Team 15 |
| 팀원 | 정이량, 황대겸, 박지환 |
| 주제 | Web/Mobile 기반 개인화 학습 관리 앱 |
| Repository | [SoftwareEngineering_team15_project_-Smart-Edu-Platform](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform) |
| 문서 인덱스 | [docs/README.md](./docs/README.md) |

## 주요 기능

- 개인화 학습 대시보드
- 일정 관리와 칸반 태스크
- 학습 노트, 퀴즈, AI 추천·요약·오답 분석
- 집중 시간 기록, 통계, 히트맵
- 커뮤니티 게시판, 댓글, 반응, 북마크, 신고
- 친구 요청, 쪽지, 실시간 상태 반영
- 보상 계정, 포인트 상점, 프로필 꾸미기
- 보스 레이드와 협동 퀘스트
- 접근성 돋보기, 전체 읽기, 도움말 투어
- 관리자 사용자 상태 관리, 공지, 점검 모드

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Expo, React Native Web |
| Backend | Node.js, Express |
| Database / ORM | PostgreSQL, Prisma |
| Test | Jest, Supertest, Expo config/export 검증 |
| Realtime | WebSocket 기반 이벤트 |
| Deployment | Vercel, Render, Neon 기반 배포 구조 |
| Collaboration | GitHub Issue, Pull Request, Merge commit 중심 운영 |

## 배포·실행·문서 바로가기

| 구분 | 문서 | 설명 |
|---|---|---|
| 문서 인덱스 | [docs/README.md](./docs/README.md) | 요구사항, 설계, 테스트, API, 배포, 최종보고서 부록 연결 |
| 최종보고서 | [docs/final-report/final-report-draft.md](./docs/final-report/final-report-draft.md) | 요구사항부터 배포까지 통합한 최종 프로젝트 보고서 초안 |
| 발표자료 | [docs/final-report/presentation-outline.md](./docs/final-report/presentation-outline.md) | 10~15슬라이드 발표 구성안 |
| 데모 시나리오 | [docs/final-report/demo-video-scenario.md](./docs/final-report/demo-video-scenario.md) | 5~10분 데모 영상 흐름과 대체 시나리오 |
| 설치/사용 | [docs/deployment/install-and-usage-guide.md](./docs/deployment/install-and-usage-guide.md) | 로컬 실행, 환경 변수, seed, 테스트, 배포 확인 절차 |
| 배포 확인 | [docs/deployment/vercel-smoke-test.md](./docs/deployment/vercel-smoke-test.md) | Vercel 배포 후 smoke test 체크리스트 |
| 테스트 보고서 | [docs/test-report/test-report.md](./docs/test-report/test-report.md) | Jest 결과, 테스트 목록, 버그 로그, AI 보조 테스트 설계 |
| API 명세 | [docs/api/api-spec.md](./docs/api/api-spec.md) | REST API, WebSocket event, seed, 검증 명령 |
| AI 활용 정책 | [docs/ai-agent-usage-policy.md](./docs/ai-agent-usage-policy.md) | AI agent 사용 범위와 금지 작업 |
| 개발 규칙 | [docs/development-workflow-rules.md](./docs/development-workflow-rules.md) | branch, commit, PR, merge, seed/migration/secret 주의사항 |

## 최종 제출 산출물

| 단계 | 산출물 | 링크 |
|---|---|---|
| Phase 1 | 요구사항 문서, AI simulation log, use case diagram, 설계 문서 | [요구사항 문서](./docs/requirements/requirements-document.md), [AI simulation log](./docs/requirements/ai-simulation-log.md), [설계 문서](./docs/design/design-document.md) |
| Phase 2 | 테스트 보고서, GitHub repository, commit/PR history | [테스트 보고서](./docs/test-report/test-report.md), [Commit history](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/commits/main), [PR history](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pulls?q=is%3Apr) |
| Phase 3 | 최종보고서, 배포 자료, 발표자료, 데모 시나리오 | [최종보고서](./docs/final-report/final-report-draft.md), [설치 및 사용 가이드](./docs/deployment/install-and-usage-guide.md), [발표자료 구성안](./docs/final-report/presentation-outline.md), [데모 영상 시나리오](./docs/final-report/demo-video-scenario.md) |

## 주요 PR

| 구분 | PR | 내용 | 상태 |
|---|---|---|---|
| 소개페이지 | [#379](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/379) | 소개페이지 인트로 입자 연필 연출 개선 | merged |
| 서비스 소개 | [#373](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/373) | 서비스 소개 카드 마이크로 애니메이션 및 다국어 문구 보강 | merged |
| 커뮤니티 | [#385](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/385) | 커뮤니티 목록·상세 화면 구조 개선 | merged |
| AI 학습 | [#387](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/387) | AI 추천 안정화 및 한도 메시지 처리 | merged |
| 레이드/협동 | [#390](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/390) | 레이드·협동 퀘스트 삭제 및 중도 취소 UX 개선 | merged |
| 보스 레이드 | [#411](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/411) | 보스 레이드 참여자별 숨김 및 중도 탈퇴 정책 구현 | merged |
| 실시간/관리 | [#392](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/392) | 친구 요청 실시간 반영 및 정지 사유 표시 | merged |
| 접근성 | [#394](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/394) | 접근성 돋보기 모드 추가 | merged |
| 도움말/QA | [#398](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/398) | 핵심 화면 도움말 투어 모달 구현 | merged |
| seed | [#402](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/402) | 최신 기능 체험용 seed 데이터 최신화 | merged |
| 문서 부록 | [#406](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/406) | 최종 제출 문서 부록화 및 상호 링크 정리 | merged |
| 작업 규칙 | [#408](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/408) | 이전 README 작업 규칙 문서화 | merged |
| 최종보고서 | [#410](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/410) | 최종 프로젝트 보고서 본문 확장 | merged |

## 주요 Issue

| 구분 | Issue | 내용 | 상태 |
|---|---|---|---|
| README/규칙 | [#412](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/412) | README 허브화 및 작업 규칙 문서 이관 | 이번 PR에서 처리 |
| 최종보고서 | [#409](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/409) | 최종 프로젝트 보고서 본문 확장 | closed |
| 문서 부록화 | [#405](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/405) | 최종 제출 문서 부록화 및 상호 링크 정리 | closed |
| seed | [#401](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/401) | 최신 기능 체험용 seed 데이터 최신화 | closed |
| 협동 퀘스트 | [#399](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/399) | 협동 퀘스트 진행 중 나가기 흐름 정리 | closed |
| 커뮤니티 | [#384](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/384) | 커뮤니티 목록·상세 화면 구조 개선 | closed |
| AI 학습 | [#386](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/386) | AI 추천 안정화 및 한도 메시지 처리 | closed |
| 접근성 | [#393](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/393) | 접근성 돋보기 모드 추가 | closed |
| 도움말 | [#397](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/397) | 핵심 화면 도움말 투어 모달 구현 | closed |
| 개발 환경 참고 | [#78](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/78) | Windows 개발 환경 warning 및 Prisma Studio 참고 | open notice |

## 개발 및 협업 규칙

- 긴 작업 규칙 본문은 [docs/development-workflow-rules.md](./docs/development-workflow-rules.md)에서 관리한다.
- AI agent 사용 시 [AI 활용 정책](./docs/ai-agent-usage-policy.md)을 먼저 확인한다.
- `main` 직접 commit, force push, reset/rebase, 원격 브랜치 수동 삭제, secret 출력, production/shared DB write는 금지한다.

## 팀 정보

- Team 15: 정이량, 황대겸, 박지환
- Course: Software Engineering
- Project: Smart Edu Platform
