# Smart Edu Platform 문서 부록 인덱스

> 최종 제출 문서: [최종 프로젝트 보고서](./final-report/final-report.md) · [발표자료 구성안](./final-report/presentation-outline.md) · [발표 대본](./final-report/presentation-script.md) · [데모 영상 시나리오](./final-report/demo-video-scenario.md) · [설치 및 사용 가이드](./deployment/install-and-usage-guide.md)

## 1. 목적

이 문서는 `docs/`에 흩어진 요구사항, 설계, 테스트, API, 배포, 회의록, AI 활용 정책, 최종보고서 관련 파일을 하나의 부록 구조로 연결한다. 최종 제출 시에는 최종보고서를 상위 문서로 두고, 나머지 문서를 근거 자료와 부록으로 참조한다.

## 2. 단계별 제출물 연결

| 단계 | 제출 기준 | 연결 문서 |
|---|---|---|
| Phase 1 | 요구사항 문서, AI simulation log, use case diagram, 설계 문서, UML/시퀀스 다이어그램 | [요구사항 문서](./requirements/requirements-document.md), [AI simulation log](./requirements/ai-simulation-log.md), [사용자 인터뷰 시뮬레이션](./requirements/ai-user-interview-simulation.md), [클라이언트 인터뷰 시뮬레이션](./requirements/ai-client-interview-simulation.md), [설계 문서](./design/design-document.md), [아키텍처 개요](./design/architecture-overview.md), [클래스 다이어그램](./design/class-diagram.md), [시퀀스 다이어그램](./design/sequence-diagram.md) |
| Phase 2 | 테스트 보고서, 유닛/통합 테스트 목록, 버그 로그, AI 보조 테스트 설계, GitHub repository 업데이트, commit/PR history | [테스트 보고서](./test-report/test-report.md), [API 명세](./api/api-spec.md), [AI 활용 정책](./ai-agent-usage-policy.md), [GitHub Repository](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform), [Commit history](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/commits/main), [Pull Request history](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pulls?q=is%3Apr) |
| Phase 3 | 최종 프로젝트 보고서, 배포 자료, 설치/사용 가이드, 데모 영상 시나리오, 발표자료 구성안, 발표 대본, 발표 동영상 링크 | [최종 프로젝트 보고서](./final-report/final-report.md), [설치 및 사용 가이드](./deployment/install-and-usage-guide.md), [배포 smoke test](./deployment/vercel-smoke-test.md), [데모 영상 시나리오](./final-report/demo-video-scenario.md), [발표자료 구성안](./final-report/presentation-outline.md), [발표 대본](./final-report/presentation-script.md), 발표 동영상은 제출 시 비공개 YouTube 링크 첨부 |

## 3. 최종보고서 부록

- [최종 프로젝트 보고서](./final-report/final-report.md): 전체 프로세스, 구현 기능, 테스트/배포, 한계와 확장성 정리
- [발표자료 구성안](./final-report/presentation-outline.md): 10~15슬라이드 발표 흐름과 팀 발표 구성
- [발표 대본](./final-report/presentation-script.md): 최종 발표 영상 녹화용 대본
- [데모 영상 시나리오](./final-report/demo-video-scenario.md): 5~10분 데모 촬영 순서와 대체 시나리오
- [설치 및 사용 가이드](./deployment/install-and-usage-guide.md): 로컬 실행, Prisma 검증, seed, 테스트, smoke test 절차
- [배포 smoke test](./deployment/vercel-smoke-test.md): 배포 후 수동 확인 체크리스트

## 4. 요구사항 부록

- [요구사항 문서](./requirements/requirements-document.md): persona, user requirement, functional/non-functional requirement, traceability의 기준 문서
- [AI simulation log](./requirements/ai-simulation-log.md): AI 기반 요구사항 도출 보조 기록
- [AI 사용자 인터뷰 시뮬레이션](./requirements/ai-user-interview-simulation.md): 사용자 관점의 가상 인터뷰 근거
- [AI 클라이언트 인터뷰 시뮬레이션](./requirements/ai-client-interview-simulation.md): 클라이언트 관점의 가상 인터뷰 근거
- [Use case diagram PlantUML](./requirements/usecase-diagram.puml): 요구사항 use case diagram 원본

## 5. 설계 부록

- [설계 문서](./design/design-document.md): 요구사항에서 구현 구조로 이어지는 설계 요약
- [아키텍처 개요](./design/architecture-overview.md): frontend/backend/DB/AI/외부 시스템 구조
- [구현 계획](./design/implementation-plan.md): Phase 2 구현 우선순위와 API/DB 초안
- [클래스 다이어그램 문서](./design/class-diagram.md): 모델과 주요 클래스 구조
- [시퀀스 다이어그램 문서](./design/sequence-diagram.md): 주요 사용자 흐름과 API 흐름
- [커뮤니티 게시판 재사용 계획](./design/community-board-reuse-plan.md): 커뮤니티 구조 설계 근거
- [PlantUML 원본 폴더](./design/plantuml/): 클래스/시퀀스 다이어그램 원본 파일

## 6. 구현·테스트·API 부록

- [API 명세](./api/api-spec.md): REST API, WebSocket, seed, 구현 범위, 검증 명령 정리
- [테스트 보고서](./test-report/test-report.md): 유닛/통합 테스트 목록, 최신 Jest 결과, 버그 로그, AI 보조 테스트 설계 기록
- [AI 활용 정책](./ai-agent-usage-policy.md): AI agent 사용 범위, 금지 작업, 민감정보 처리 기준
- [개발 및 협업 작업 규칙](./development-workflow-rules.md): 이전 README에 포함되어 있던 branch, commit, PR, review, merge, seed/migration 주의사항 보존 문서
- [screenshots manifest](../screenshots/manifest.md): 제출·데모용 화면 자료의 원본명과 최종 경로 매핑

## 7. 회의록 부록

회의록은 요구사항 도출, 설계 결정, 역할 분담, PR 검증, AI 활용 근거를 남기는 협업 증빙이다.

- [2026-05-06 회의록](./meeting-minutes/meeting-2026-05-06.md)
- [2026-05-11 회의록](./meeting-minutes/meeting-2026-05-11.md)
- [2026-05-13 회의록](./meeting-minutes/meeting-2026-05-13.md)
- [2026-05-14 회의록](./meeting-minutes/meeting-2026-05-14.md)
- [2026-05-15 회의록](./meeting-minutes/meeting-2026-05-15.md)
- [2026-05-18 회의록](./meeting-minutes/meeting-2026-05-18.md)
- [2026-05-19~20 회의록](./meeting-minutes/meeting-2026-05-19-20.md)
- [2026-05-20 회의록](./meeting-minutes/meeting-2026-05-20.md)
- [2026-05-21 회의록](./meeting-minutes/meeting-2026-05-21.md)
- [2026-05-22 회의록](./meeting-minutes/meeting-2026-05-22.md)
- [2026-05-23 회의록](./meeting-minutes/meeting-2026-05-23.md)
- [2026-05-25 회의록](./meeting-minutes/meeting-2026-05-25.md)
- [2026-05-26 회의록](./meeting-minutes/meeting-2026-05-26.md)
- [2026-05-27 회의록](./meeting-minutes/meeting-2026-05-27.md)
- [2026-05-28 회의록](./meeting-minutes/meeting-2026-05-28.md)
- [2026-05-29 회의록](./meeting-minutes/meeting-2026-05-29.md)
- [2026-05-30 회의록](./meeting-minutes/meeting-2026-05-30.md)
- [2026-06-01 회의록](./meeting-minutes/meeting-2026-06-01.md)
- [2026-06-18 최종 발표 준비 회의록](./meeting-minutes/2026-06-18-final-presentation-prep.md)

## 8. 코드 리포지토리 제출 기준

- Repository: [SoftwareEngineering_team15_project_-Smart-Edu-Platform](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform)
- 최신 main commit history: [commits/main](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/commits/main)
- PR review history: [pull requests](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pulls?q=is%3Apr)
- 최신 Release/tag: [GitHub Releases](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/releases/latest)
- 발표 동영상 링크: 제출 시 e캠퍼스 설명란에 비공개 YouTube 링크를 첨부한다.

## 9. 주요 PR

| 구분 | PR | 내용 | 상태 |
|---|---|---|---|
| 소개페이지 | [#379](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/379) | 소개페이지 인트로 입자 연필 연출 개선 | merged |
| 서비스 소개 | [#373](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/373) | 서비스 소개 카드 마이크로 애니메이션 및 다국어 문구 보강 | merged |
| 커뮤니티 | [#385](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/385) | 커뮤니티 목록·상세 화면 구조 개선 | merged |
| AI 학습 | [#387](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/387) | AI 추천 안정화 및 한도 메시지 처리 | merged |
| 레이드/협동 | [#390](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/390) | 레이드·협동 퀘스트 삭제 및 중도 취소 UX 개선 | merged |
| 협동 퀘스트 | [#400](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/400) | 협동 퀘스트 진행 중 나가기 흐름 정리 | merged |
| 실시간/관리 | [#392](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/392) | 친구 요청 실시간 반영 및 정지 사유 표시 | merged |
| 접근성 | [#394](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/394) | 접근성 돋보기 모드 추가 | merged |
| 도움말/QA | [#398](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/398) | 핵심 화면 도움말 투어 모달 구현 | merged |
| seed | [#402](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/402) | 최신 기능 체험용 seed 데이터 최신화 | merged |
| 문서 | [#406](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/406) | 최종 제출 문서 부록화 및 상호 링크 정리 | merged |
| 최종보고서 | [#410](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/410) | 최종 프로젝트 보고서 본문 확장 | merged |
| README/문서 허브 | [#413](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/413) | README 허브화 및 작업 규칙 이관 | merged |
| 스크린샷 | [#417](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/417) | raw 스크린샷 및 영상 자료 기능별 분류와 manifest 정리 | merged |
| AI 첨부 도구 | [#419](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/419) | AI 첨부·검토 도구 실제 분석 흐름 구현 | merged |
| AI 문구/도움말 | [#421](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/421) | AI 첨부 문구 정리, 도움말 보강, 웹 연필 커서 적용 | merged |
| 최종보고서 완성 | [#425](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/425) | 최종 프로젝트 보고서 완성 및 링크 매핑 정리 | merged |
| 발표자료/대본 | [#434](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/434) | 최종 발표자료 구성안 및 데모 영상 계획 최신화 | merged |
| 발표 대본 | [#436](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pull/436) | 영상 길이에 맞춘 발표 대본 분량 수정 | merged |

## 10. 주요 Issue

| 구분 | Issue | 내용 | 상태 |
|---|---|---|---|
| 보스 레이드 정책 | [#389](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/389) | 보스 레이드 참여자별 숨김 및 중도 탈퇴 정책 | closed, PR #411 |
| 최종보고서 | [#409](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/409) | 최종 프로젝트 보고서 본문 확장 | closed |
| 문서 부록화 | [#405](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/405) | 최종 제출 문서 부록화 및 상호 링크 정리 | closed |
| seed | [#401](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/401) | 최신 기능 체험용 seed 데이터 최신화 | closed |
| 협동 퀘스트 | [#399](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/399) | 협동 퀘스트 진행 중 나가기 흐름 정리 | closed |
| 커뮤니티 | [#384](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/384) | 커뮤니티 목록·상세 화면 구조 개선 | closed |
| AI 학습 | [#386](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/386) | AI 추천 안정화 및 한도 메시지 처리 | closed |
| 접근성 | [#393](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/393) | 접근성 돋보기 모드 추가 | closed |
| 도움말 | [#397](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/397) | 핵심 화면 도움말 투어 모달 구현 | closed |
| 주요 화면 QA | [#395](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/395) | 주요 화면 QA 보정 및 접근성 버튼 개선 | closed |

## 11. 문서 검증 기준

- Markdown 상대 링크가 실제 파일을 가리키는지 확인한다.
- 문서에는 실제 DB URL, host, password, token, API key, secret 원문을 포함하지 않는다.
- coverage 정량 측정 전에는 coverage 수치를 과장해서 작성하지 않는다.
- mock/fallback 기능은 실제 외부 서비스 완성 기능처럼 표현하지 않는다.
