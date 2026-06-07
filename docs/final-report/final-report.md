# 사각사각 Smart Edu Platform 최종 프로젝트 보고서

## 표지

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 사각사각 Smart Edu Platform |
| 과목명 | 소프트웨어공학 |
| 팀 | Team 15 |
| 팀원 | 정이량, 황대겸, 박지환 |
| 주제 | 개인 맞춤형 학습 관리 웹/모바일 앱 |
| 제출 단계 | 3단계 최종 프로젝트 보고서 |
| GitHub Repository | [SoftwareEngineering_team15_project_-Smart-Edu-Platform](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform) |
| Commit history | [commits/main](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/commits/main) |
| Pull Request history | [pull requests](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pulls?q=is%3Apr) |
| 문서 인덱스 | [docs/README.md](../README.md) |
| 배포 자료 | [설치 및 사용 가이드](../deployment/install-and-usage-guide.md), [배포 smoke test](../deployment/vercel-smoke-test.md) |

> 이 문서는 3단계 최종 제출용 보고서로, 요구사항, 설계, 구현, 테스트, 배포, AI 활용, 협업 운영, 한계와 확장 방향을 하나의 흐름으로 통합해 정리한다. 원문 요구사항과 설계 문서는 부록으로 연결하고, 본문은 제출용 요약과 해석 중심으로 작성한다.

---

## 초록

사각사각 Smart Edu Platform은 학습 계획, 일정, 노트, 퀴즈, AI 학습 보조, 집중 시간, 커뮤니티, 친구 소통, 보상형 동기부여를 하나의 서비스 흐름으로 연결하는 개인 맞춤형 학습 관리 플랫폼이다. 기존 학습자는 일정 관리 도구, 노트 앱, 질문 도구, 커뮤니티, 타이머, 보상 시스템을 분리해서 사용해야 하는 경우가 많다. 이 프로젝트는 이러한 분절된 학습 활동을 하나의 웹/모바일 앱에서 이어 주는 것을 목표로 했다.

프로젝트는 1단계 요구사항 분석과 설계, 2단계 구현 및 테스트, 3단계 배포 자료와 최종 보고서 작성 순서로 진행되었다. 요구사항 분석 단계에서는 사용자 등록/로그인, 학습 일정 관리, 노트 및 퀴즈 생성/관리, AI 기반 학습 추천, 데이터 시각화, 보안 및 프라이버시 고려를 핵심 기능으로 정리했다. 설계 단계에서는 frontend, backend, database, AI system, WebSocket, external calendar system의 역할을 나누고 REST API와 실시간 이벤트 흐름을 설계했다.

구현 단계에서는 Expo/React Native Web 기반 프론트엔드, Node.js/Express 기반 백엔드, Prisma 기반 관계형 데이터 접근 구조를 사용했다. 인증, 대시보드, 일정/칸반, 집중 시간과 통계, AI 학습 보조, 커뮤니티, 친구/쪽지, 포인트 상점, 협동 퀘스트, 보스 레이드, 접근성, 관리자/점검 모드까지 주요 화면과 API를 구현했다. 최신 확인 기준 백엔드 Jest/Supertest 테스트는 `29 suites / 548 tests` 통과 상태이며, backend Jest coverage는 statements 68.63%, branches 60.70%, functions 68.27%, lines 68.72%로 측정했다.

AI는 요구사항 정리, 테스트 케이스 후보 도출, 코드 리팩터링 검토, 문서 구조화, PR 검토 보조에 활용했다. 다만 AI 결과는 자동으로 신뢰하지 않고 팀원이 검토한 뒤 반영했다. 외부 AI API는 비용과 quota 제한이 있으므로 자동 테스트에서는 mock/fallback 중심으로 검증했고, 실제 외부 AI 연동은 제한된 환경에서 확인하는 범위로 다뤘다. 프로젝트의 한계로는 무료 AI API 한도, frontend E2E와 정량 coverage 보강 필요, 실사용 운영 모니터링 보강 필요가 있다.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [주제 선정 배경](#2-주제-선정-배경)
3. [요구사항 분석](#3-요구사항-분석)
4. [설계 문서 요약](#4-설계-문서-요약)
5. [기술 스택](#5-기술-스택)
6. [전체 시스템 아키텍처](#6-전체-시스템-아키텍처)
7. [핵심 기능 구현](#7-핵심-기능-구현)
8. [AI 활용 분석](#8-ai-활용-분석)
9. [테스트 및 품질 보증](#9-테스트-및-품질-보증)
10. [배포 및 운영](#10-배포-및-운영)
11. [협업 방식과 GitHub 운영](#11-협업-방식과-github-운영)
12. [문제 해결 사례](#12-문제-해결-사례)
13. [한계점](#13-한계점)
14. [향후 확장성](#14-향후-확장성)
15. [팀원별 소감](#15-팀원별-소감)
16. [결론](#16-결론)
17. [부록](#17-부록)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목표

사각사각 Smart Edu Platform은 개인별 학습 목표와 접근성 요구가 다른 사용자를 위해 학습 활동을 한 흐름으로 관리하는 서비스를 목표로 한다. 사용자는 계획을 세우고, 오늘 해야 할 일을 확인하고, 집중 시간을 기록하고, 질문과 요약을 통해 이해를 보완하고, 커뮤니티와 친구 소통으로 학습 동기를 유지할 수 있다. 또한 포인트, 상점, 협동 퀘스트, 보스 레이드 같은 보상형 구조를 통해 장기 학습을 지속하도록 돕는다.

프로젝트의 핵심 방향은 단순한 일정 앱이나 커뮤니티 앱이 아니라, 학습 전 과정을 연결하는 개인화 학습 관리 플랫폼이다. 교수님 제시 주제 1에서 요구한 사용자 등록/로그인, 학습 일정 관리, 노트 및 퀴즈 생성/관리, AI 기반 학습 추천, 데이터 시각화, 보안 및 프라이버시 고려를 우선 구현 대상으로 삼았다. 이후 팀 논의와 요구사항 문서를 바탕으로 친구/쪽지, 커뮤니티, 접근성, 보상, 협동 기능을 확장 구현했다.

### 1.2 서비스명과 브랜드 방향

서비스명 `사각사각`은 연필로 학습 기록을 남기는 소리와 느낌에서 출발했다. 랜딩 인트로와 서비스 소개 화면도 이 브랜드 이미지를 반영한다. 소개페이지 인트로는 수학 기호와 학습 용어 입자가 모여 민트색 연필과 `사각사각` 텍스트를 형성하는 방식으로 구성했다. 서비스 소개 화면은 `PLAN`, `FOCUS`, `AI`, `SUMMARY`, `REVIEW`, `MESSAGE`, `COMMUNITY`, `COOP`, `REWARD`, `LANG`, `TRUST` 흐름을 통해 학습 관리 기능을 순차적으로 보여준다.

브랜드 방향은 지나치게 게임스럽거나 과장된 UI가 아니라, 크림/민트/딥블루 톤의 차분한 학습 서비스 경험이다. 다만 학습 동기 유지가 필요한 영역에서는 카드 내부 마이크로 애니메이션과 포인트/퀘스트 시각화를 사용해 서비스가 살아 있는 느낌을 제공했다.

### 1.3 단계별 진행 요약

| 단계 | 주요 산출물 | 현재 보고서 반영 방식 |
|---|---|---|
| 1단계 | 요구사항 문서, AI simulation log, use case diagram, 설계 문서, UML/시퀀스 다이어그램 | 요구사항 분석과 설계 요약으로 통합하고 원문은 부록 링크로 연결 |
| 2단계 | 구현 코드, 테스트 보고서, GitHub repository, PR/commit history | 핵심 기능 구현, 테스트 및 품질 보증, GitHub 운영 섹션으로 통합 |
| 3단계 | 최종보고서, 배포 자료, 설치/사용 가이드, 데모 영상, 발표자료 | 배포 및 운영, 데모/발표 부록, 결론과 향후 확장성으로 정리 |

### 1.4 최종 구현 범위 요약

최종 구현 범위는 교수님 제시 주제 1의 필수 기능을 우선 충족하고, 학습 지속성과 발표 완성도를 높이기 위한 확장 기능을 추가하는 방식으로 정리한다. 핵심 기능은 학습 관리 플랫폼으로서 반드시 필요한 기능이며, 확장 기능은 사용자 경험, 협업 학습, 접근성, 데모 완성도를 보강하는 기능이다.

| 구분 | 기능 | 최종 구현 상태 |
|---|---|---|
| 핵심 기능 | 회원가입/로그인/계정 상태 | 사용자 등록, 로그인, JWT 인증, 계정 상태 제한, 비밀번호 변경, 회원 탈퇴 구현 |
| 핵심 기능 | 학습 일정 관리 | 일정, 알림 시간, D-Day, 대시보드 연동 구현 |
| 핵심 기능 | 칸반/태스크 관리 | 상태별 태스크, 진행률, 대시보드 요약 구현 |
| 핵심 기능 | 학습 노트 | 학습 노트 CRUD와 AI 학습 흐름 연결 구현 |
| 핵심 기능 | AI 학습 추천/요약/오답 분석 | 질문, 맞춤 추천, 긴 글 요약, 오답 원인 분석, quota/fallback 처리 구현 |
| 핵심 기능 | 텍스트 기반 PDF 분석 | 텍스트 기반 PDF 추출 후 요약·노트·퀴즈·키워드 초안 생성 구현 |
| 핵심 기능 | 집중 시간/통계/히트맵 | 스톱워치/타이머, 집중 세션, 통계, 히트맵 intensity 표시 구현 |
| 핵심 기능 | 보안/프라이버시/권한 | 인증 middleware, 관리자 권한, passwordHash 미노출, 민감정보 문서화 금지 적용 |
| 확장 기능 | 소개페이지 인트로 | 수학 기호·학습 용어 입자, 민트 연필, `사각사각` 텍스트 형성 구현 |
| 확장 기능 | 서비스 소개 화면 | 서비스 카드 micro animation, 다국어 ko/en/ja/zh 문구 정리 구현 |
| 확장 기능 | 커뮤니티 | 게시글, 댓글, 반응, 북마크, 신고, 중앙 상세 overlay, 공유 popup 구현 |
| 확장 기능 | 친구/쪽지/WebSocket | 친구 요청 실시간 반영, 쪽지, unread badge, typing/read event 구현 |
| 확장 기능 | 포인트/보상/상점 | 포인트 거래, 상점 구매, 배지, 칭호, 프로필 꾸미기 구현 |
| 확장 기능 | 보스 레이드/협동 퀘스트 | 참여자별 숨김/보관/복원/나가기, 진행률, 보상, 기여도 보존 구현 |
| 확장 기능 | 접근성 | 돋보기, 전체 읽기 on/off, 고대비, 큰 글씨, 모션 감소, 도움말 투어 구현 |
| 확장 기능 | 관리자/점검 모드 | 사용자 상태 변경, 정지 사유, 신고 처리, maintenance mode 구현 |
| 확장 기능 | 웹 전역 연필 커서 | 앱 아이콘 톤의 연필 커서와 입력 영역 기본 커서 유지 구현 |
| 확장 기능 | demo seed와 screenshots | 최신 seed 적용, screenshots/manifest 기반 데모 자료 정리 반영 |

### 1.5 교수님 제시 주제 1 필수 기능 매핑

| 필수 요구 | 구현 화면/API | 검증 근거 |
|---|---|---|
| 사용자 등록 및 로그인 | Register/Login/Auth API, account status 제한 | `auth.test.js`, `user-profile.test.js`, 점검 화면/회원가입 UX 보정 |
| 학습 일정 관리 | Schedule, TaskBoard, Dashboard D-Day/알림 시간 | `schedule-task.test.js`, 대시보드/일정/칸반 수동 QA |
| 노트 및 퀴즈 생성/관리 | Study Note API, AI 학습 추천, 텍스트 기반 PDF 학습자료 초안 | `note.test.js`, `ai.test.js`, API 명세 9.2 |
| AI 기반 학습 추천 | AI 질문, 맞춤 추천, 긴 글 요약, 오답 분석, fallback | `ai.test.js`, AI quota/fallback PR 검증 |
| 데이터 시각화 | FocusTimer, Statistics, Heatmap | `focus-statistics.test.js`, 히트맵 intensity 보정 검증 |
| 보안 및 프라이버시 | JWT, bcrypt, role guard, secret 미기록, 파일 영구 저장 금지 | Auth/Admin/API 테스트, 문서 보안 규칙, 첨부 파일 memory 처리 |

---

## 2. 주제 선정 배경

### 2.1 문제의식

학습자는 학습 계획을 세우고, 일정과 마감일을 관리하고, 노트를 작성하고, 모르는 내용을 질문하고, 복습하고, 집중 시간을 기록해야 한다. 그러나 실제 사용 환경에서는 이러한 활동이 여러 도구에 흩어져 있다. 일정은 캘린더 앱에 있고, 노트는 별도 문서 앱에 있으며, 질문은 검색이나 AI 챗봇에서 처리하고, 공부 인증이나 소통은 커뮤니티 또는 메신저에서 이루어진다. 이 분산은 학습 흐름을 끊고, 사용자가 자신의 학습 상태를 한눈에 파악하기 어렵게 만든다.

사각사각은 이러한 문제를 하나의 서비스 안에서 연결하는 데 초점을 둔다. 학습자는 대시보드에서 오늘 해야 할 일정과 태스크를 확인하고, 학습 노트와 AI 보조 기능으로 이해를 정리하고, 집중 시간과 히트맵으로 자신의 학습 패턴을 확인한다. 커뮤니티와 친구/쪽지는 학습 동기를 유지하는 사회적 장치가 되고, 포인트 상점과 협동 퀘스트는 반복 학습을 보상 구조와 연결한다.

### 2.2 사용자 관점

요구사항 문서의 persona와 사용자 요구사항은 학습 수준, 연령, 목표, 접근성 요구가 다양한 사용자를 대상으로 한다. 초등학생 또는 학습 습관이 약한 사용자는 복잡한 설정보다 큰 글씨, 쉬운 버튼, 직관적인 진행률이 필요하다. 시험을 준비하는 학생은 D-Day, 칸반, 오답 분석, 집중 시간 기록을 중요하게 본다. 장기 학습자는 히트맵과 주간 통계를 통해 학습 지속성을 확인하고, 친구와의 소통이나 협동 퀘스트를 통해 동기를 유지할 수 있다.

이 관점에서 사각사각은 단일 기능의 완성도뿐 아니라 기능 간 이동의 자연스러움을 중요하게 다뤘다. 예를 들어 일정과 칸반은 대시보드와 연결되고, 집중 시간은 통계와 히트맵으로 이어지며, AI 질문과 요약은 노트와 복습 흐름으로 연결된다. 커뮤니티와 쪽지는 단순 게시판이 아니라 학습 기록을 공유하고 친구와 계속 공부하도록 유도하는 공간으로 설계했다.

### 2.3 서비스 의뢰자 관점

서비스 의뢰자 관점에서는 단순한 과제용 화면 나열이 아니라 실제 사용 가능한 학습 관리 서비스의 구조가 필요했다. 따라서 요구사항과 설계 문서에서는 API, 데이터 모델, 인증, 권한, 테스트, 배포 가능성을 함께 고려했다. 최종 구현에서도 API 명세, 테스트 보고서, 설치 및 사용 가이드, 배포 smoke test 문서를 함께 정리해 구현물이 단순 데모가 아니라 검증 가능한 산출물이 되도록 했다.

### 2.4 회의와 문서화 흐름

팀은 회의록을 통해 요구사항 도출, 설계 결정, 역할 분담, PR 검증, AI 활용 기준을 남겼다. 회의록은 단순 작업 기록이 아니라 요구사항과 구현의 근거 역할을 한다. 특히 2026년 6월 회의록은 인트로, 서비스 소개, 발표자료, 후속 QA 논의를 정리하며 최종 제출 방향을 잡는 근거가 되었다. 회의록 목록은 [문서 부록 인덱스](../README.md#7-회의록-부록)에 연결되어 있다.

---

## 3. 요구사항 분석

### 3.1 요구사항 문서와 추적성

요구사항의 기준 문서는 [요구사항 문서](../requirements/requirements-document.md)이다. 이 문서는 사용자 설문/인터뷰 결과, persona, user requirement, functional requirement, non-functional requirement, use case, traceability를 포함한다. AI 기반 가상 인터뷰와 simulation log는 요구사항 도출의 보조 근거로 사용되었다.

프로젝트의 요구사항 ID는 `P`, `UR`, `FR`, `NFR`, `UC` prefix를 사용한다. 구현과 설계에서는 요구사항 문서의 ID 체계를 기준으로 용어를 맞췄다. 특히 `UC-07`은 학습 추천, `UC-19`는 AI 기반 퀴즈 생성, `UC-20`은 사용자 계정 관리와 제재, `UC-21`은 학습 챌린지 관리로 유지했다.

### 3.2 핵심 기능 요구사항 요약

| 기능 영역 | 요구사항 요약 | 구현 반영 |
|---|---|---|
| 사용자 등록/로그인 | 계정 생성, 로그인, 현재 사용자 조회, 계정 상태 제한 | Auth API, JWT 인증, 계정 상태 제한, bcrypt hash 저장 |
| 학습 일정 관리 | 일정, D-Day, 칸반 태스크, 오늘 학습 계획 관리 | Schedule/Task API와 대시보드/칸반 화면 |
| 노트 및 퀴즈 생성/관리 | 학습 노트, 복습 기록, 퀴즈 생성/관리 | Study Note API 구현, AI 기반 퀴즈 생성은 후속 고도화 범위 |
| AI 기반 학습 추천 | 질문, 요약, 오답 분석, 추천 흐름 | AI API와 AI 학습 화면, mock/fallback 기반 테스트 |
| 데이터 시각화 | 집중 시간, 통계, 히트맵, 진행률 | Focus/Statistics API와 frontend 통계/히트맵 표시 |
| 보안 및 프라이버시 | 인증, 권한, 계정 상태, 민감정보 미노출 | auth middleware, role guard, passwordHash 미노출, secret 문서화 금지 |

### 3.3 확장 기능 요구사항 요약

핵심 요구사항 외에 팀은 학습 지속성을 높이는 확장 기능을 추가했다. 커뮤니티는 게시글, 댓글, 반응, 북마크, 신고를 포함한다. 친구/쪽지는 친구 요청, 접속 상태, thread, 읽음 상태, typing event를 포함한다. 보상/포인트 상점은 활동 보상, 아이템 구매, 프로필 꾸미기, 칭호 반영을 지원한다. 협동 퀘스트와 보스 레이드는 팀 목표와 진행률을 통해 학습을 공동 활동으로 확장한다. 접근성 기능은 고대비, 텍스트 크기, 모션 감소, 초등학생 친화 UI, 돋보기, 전체 읽기 흐름을 제공한다.

### 3.4 비기능 요구사항 요약

| 비기능 영역 | 적용 방향 |
|---|---|
| 접근성 | 텍스트 크기, 고대비, 모션 감소, 돋보기, 전체 읽기, 초등학생 친화 UI |
| 반응형 | 웹/모바일 공통 UI와 Expo Web export 기준 확인 |
| 보안 | JWT 인증, bcrypt hash, 민감정보 미노출, 권한 분리, 계정 상태 제한 |
| 테스트 가능성 | Jest/Supertest, repository mock, provider mock, Prisma validate/generate |
| 배포 가능성 | Vercel frontend, Render 계열 backend, Neon/Prisma 기반 DB, smoke test |
| 유지보수성 | API 계층 분리, 문서 인덱스, PR 기반 검증, Issue 기반 추적 |

### 3.5 요구사항 원문 부록

요구사항의 상세 내용은 아래 문서를 기준으로 확인한다.

- [요구사항 문서](../requirements/requirements-document.md)
- [AI simulation log](../requirements/ai-simulation-log.md)
- [AI 사용자 인터뷰 시뮬레이션](../requirements/ai-user-interview-simulation.md)
- [AI 클라이언트 인터뷰 시뮬레이션](../requirements/ai-client-interview-simulation.md)
- [Use case diagram PlantUML](../requirements/usecase-diagram.puml)

---

## 4. 설계 문서 요약

### 4.1 설계 접근

설계 단계에서는 요구사항을 화면, API, 데이터 모델, 실시간 이벤트, 테스트 가능성으로 나누어 정리했다. 프론트엔드는 학습 흐름을 보여 주는 화면과 사용자 상호작용을 담당하고, 백엔드는 인증, 데이터 저장, 권한, 비즈니스 규칙, WebSocket 이벤트를 담당한다. Prisma는 데이터 모델과 DB 접근을 일관되게 관리하며, 테스트에서는 repository와 provider mock을 활용해 실제 외부 서비스 의존도를 줄였다.

### 4.2 아키텍처 개요

시스템은 크게 frontend, backend, database, AI provider, WebSocket, deployment environment로 구성된다. 사용자는 브라우저 또는 모바일 Web 환경에서 frontend에 접속한다. frontend는 REST API를 통해 backend와 통신하고, 실시간 이벤트가 필요한 영역에서는 WebSocket `/ws` endpoint에 연결한다. backend는 인증 middleware와 role middleware를 거쳐 controller, service, repository 계층으로 요청을 처리한다. repository는 Prisma Client를 통해 DB에 접근한다.

아키텍처 상세는 [아키텍처 개요](../design/architecture-overview.md)에 정리되어 있다.

### 4.3 클래스 다이어그램 요약

클래스 다이어그램은 사용자, 프로필, 일정, 태스크, 학습 노트, AI 학습, 집중 세션, 통계, 커뮤니티, 보상, 협동 기능, 관리자 기능의 관계를 설명한다. 특히 User와 UserProfile, Schedule/Task, BoardPost/Comment/Reaction/Bookmark/Report, RewardAccount/PointTransaction/ShopItem, CollaborativeQuest/CollaborativeQuestParticipant, BossRaid/BossRaidParty 구조가 구현의 핵심 데이터 모델로 연결된다.

상세 문서는 [클래스 다이어그램](../design/class-diagram.md)과 [PlantUML 원본](../design/plantuml/class-diagram.puml)을 기준으로 확인한다.

### 4.4 시퀀스 다이어그램 요약

시퀀스 다이어그램은 회원가입/로그인, 일정 생성, AI 학습 질의, 커뮤니티 게시글/댓글, 보상 수령, 관리자 제재와 같은 주요 흐름을 사용자 요청에서 API 응답까지 설명한다. 구현 과정에서는 이 흐름을 backend route, controller, service, repository 계층으로 나누어 반영했다. 실시간 기능은 HTTP 요청 성공 후 WebSocket event를 발행하는 방식으로 설계했다.

상세 문서는 [시퀀스 다이어그램](../design/sequence-diagram.md)과 [PlantUML 원본](../design/plantuml/sequence-diagrams.puml)을 기준으로 확인한다.

### 4.5 Use case diagram 요약

Use case diagram은 사용자와 관리자 actor를 기준으로 학습 계획, AI 학습, 커뮤니티, 보상, 접근성, 관리자 기능을 구분한다. 요구사항 단계에서 use case는 기능 범위와 actor 책임을 정리하는 역할을 했고, 구현 단계에서는 API와 화면 우선순위를 결정하는 기준으로 사용되었다.

Use case 원본은 [usecase-diagram.puml](../requirements/usecase-diagram.puml)에 저장되어 있다.

### 4.6 커뮤니티 게시판 재사용 계획

커뮤니티 기능은 게시글, 댓글, 반응, 북마크, 신고, 공개 프로필 이동 흐름을 포함한다. 설계 단계에서는 커뮤니티 게시판 구조를 다른 학습 공유 흐름에도 재사용할 수 있도록 category, search, sort, reaction summary, bookmark status를 함께 다루는 방향을 정했다. 이후 frontend에서는 오른쪽 빈 상세 패널을 제거하고 중앙 overlay 방식으로 상세를 보여 주는 UI 개선을 진행했다.

관련 설계는 [커뮤니티 게시판 재사용 계획](../design/community-board-reuse-plan.md)에 정리되어 있다.

### 4.7 설계 원문 부록

- [설계 문서](../design/design-document.md)
- [아키텍처 개요](../design/architecture-overview.md)
- [구현 계획](../design/implementation-plan.md)
- [클래스 다이어그램](../design/class-diagram.md)
- [시퀀스 다이어그램](../design/sequence-diagram.md)
- [커뮤니티 게시판 재사용 계획](../design/community-board-reuse-plan.md)
- [PlantUML 원본 폴더](../design/plantuml/)

---

## 5. 기술 스택

### 5.1 기술 스택 표

| 영역 | 기술 | 선택 이유 | 한계 또는 주의점 |
|---|---|---|---|
| Frontend | Expo, React Native Web | 웹/모바일 공통 UI 구현, 빠른 Web export 검증 | 플랫폼별 세부 UI 차이 확인 필요 |
| Backend | Node.js, Express | REST API와 WebSocket을 단순하고 빠르게 구현 | 계층 분리와 테스트 구조 관리 필요 |
| Database | PostgreSQL 계열 DB | 관계형 데이터 모델과 사용자별 권한/상태 관리에 적합 | production DB 작업 시 migration/seed 주의 필요 |
| ORM | Prisma | schema 기반 모델 관리, validate/generate 지원 | schema 변경 시 migration 영향 검토 필요 |
| Test | Jest, Supertest | API 단위/통합 테스트, repository/provider mock 검증 | frontend 화면 자동 테스트는 추가 보강 필요 |
| Realtime | WebSocket | 친구, 쪽지, 계정 상태, 레이드/협동 진행률 실시간 반영 | 배포 환경에서 fallback과 연결 안정성 확인 필요 |
| Deployment | Vercel, Render 계열, Neon 계열 | frontend/backend/DB 분리 배포와 smoke test 가능 | 환경 변수, CORS, WebSocket endpoint 관리 필요 |
| AI | 외부 AI provider + fallback/mock | 질문, 요약, 추천, 오답 분석 기능 제공 | 무료 quota와 API key 관리 제약 |

### 5.2 Frontend 선택 이유

Expo와 React Native Web은 모바일 앱 구조를 유지하면서 웹 화면을 빠르게 검증할 수 있다는 장점이 있다. 프로젝트는 과제 제출과 데모를 위해 Web 기준 동작이 중요했지만, 주제 자체는 웹/모바일 학습 관리 앱이다. 따라서 React Native 기반 컴포넌트 구조를 사용해 모바일 확장 가능성을 남기고, Expo Web export로 배포 검증을 수행했다.

### 5.3 Backend 선택 이유

Express는 REST API 구현과 테스트 구성이 단순하고, Jest/Supertest와의 조합이 좋다. 백엔드는 routes, controllers, services, repositories 구조로 분리했다. routes는 경로와 middleware 연결을 담당하고, controllers는 request/response 처리를 담당하며, services는 비즈니스 규칙을 담당한다. repositories는 Prisma Client를 통한 DB 접근을 담당한다.

### 5.4 Database와 Prisma 선택 이유

사용자, 일정, 태스크, 커뮤니티, 보상, 협동 기능은 관계가 많은 데이터 구조를 가진다. PostgreSQL 계열 DB와 Prisma는 이러한 관계를 schema로 관리하고, 테스트와 배포 전 `validate`/`generate`를 통해 구조를 확인하기에 적합하다. 다만 schema 변경과 migration은 운영 데이터에 영향을 줄 수 있으므로 PR 본문과 검증에서 별도로 확인한다.

### 5.5 테스트와 CI/CD 선택 이유

Jest와 Supertest는 Express API의 request/response 흐름을 검증하기 좋다. 프로젝트는 실제 외부 AI API나 production DB에 의존하지 않도록 mock/fallback 테스트를 중심으로 구성했다. CI는 Prisma validate, Prisma Client generate, backend tests, frontend config/export 검증을 통해 PR 단위 회귀 위험을 줄이는 역할을 한다.

---

## 6. 전체 시스템 아키텍처

### 6.1 전체 흐름

사용자는 frontend 화면에서 로그인하고, JWT 기반 인증 상태로 대시보드와 학습 기능에 접근한다. frontend는 API service를 통해 backend REST API를 호출한다. backend는 요청마다 인증과 권한을 확인하고, service 계층에서 비즈니스 규칙을 적용한 뒤 repository 계층을 통해 DB 데이터를 조회하거나 변경한다.

실시간성이 필요한 기능은 WebSocket으로 보조한다. 친구 요청 상태, 친구 접속 상태, 쪽지 생성/읽음/typing, 계정 상태 변경, 보스 레이드 진행률, 협동 퀘스트 진행률 등은 서버가 관련 사용자에게만 이벤트를 발행한다. WebSocket 연결이 실패해도 핵심 기능은 HTTP API fallback으로 확인할 수 있게 했다.

### 6.2 인증과 권한

인증은 JWT 기반으로 처리한다. 회원가입과 로그인 성공 시 token을 발급하고, 보호 API는 Bearer token을 확인한다. 계정이 `SUSPENDED` 또는 `DEACTIVATED` 상태이면 로그인 또는 보호 API 접근을 제한한다. 비밀번호는 bcrypt hash로 저장하며, API 응답에는 `passwordHash`를 포함하지 않는다.

관리자 기능은 ADMIN role 기준으로 제한한다. 관리자 화면에서는 사용자 상태 변경, 신고 처리, 점검 모드, 관리자 공지 등을 처리한다. 일반 사용자가 관리자 API에 접근하면 권한 없음으로 차단한다.

### 6.3 API 구조

API는 기능별 route로 나뉜다. Auth API는 회원가입, 로그인, 현재 사용자 조회를 담당한다. User/Profile API는 사용자 정보, 프로필, 비밀번호 변경, 탈퇴를 담당한다. Schedule/Task API는 일정과 칸반을 처리한다. AI API는 질문, 추천, 요약, 오답 분석, 대화방을 담당한다. Community API는 게시글, 댓글, 반응, 북마크, 신고를 처리한다. Reward/Shop API는 포인트, 배지, 퀘스트, 상점, 프로필 꾸미기를 처리한다. Boss Raid와 Collaborative Quest API는 협동 학습 기능을 담당한다.

상세 endpoint와 payload는 [API 명세](../api/api-spec.md)를 기준으로 한다.

### 6.4 WebSocket 이벤트 구조

WebSocket은 `/ws` endpoint를 사용한다. 연결 후 친구 접속 상태를 받기 위해 `presence.authenticate` 메시지로 인증한다. 서버는 `friends.request.updated`, `directMessage.created`, `directMessage.read`, `account.status.updated`, `bossRaid.progress.updated`, `collabQuest.progress.updated` 같은 이벤트를 관련 사용자에게만 전송한다. URL query로 token을 보내지 않고, payload에도 DB URL, secret, passwordHash 같은 민감정보를 포함하지 않는다.

### 6.5 배포 구조

프론트엔드는 Expo Web export 결과를 Vercel에서 서비스하는 구조를 기준으로 한다. 백엔드는 별도 Node.js 서버에서 REST API와 WebSocket을 제공한다. DB는 Prisma가 연결하는 관계형 DB이며, 환경 변수로 DB URL, JWT secret, AI key, frontend API base URL 등을 관리한다. 문서에는 실제 secret 값을 기록하지 않는다.

배포 검증은 [설치 및 사용 가이드](../deployment/install-and-usage-guide.md)와 [Vercel smoke test](../deployment/vercel-smoke-test.md)를 기준으로 수행한다.

---

## 7. 핵심 기능 구현

### 7.1 인증/회원가입/로그인

인증 기능은 사용자 등록, 로그인, 현재 사용자 조회, 비밀번호 변경, 회원 탈퇴, 계정 상태 제한을 포함한다. 회원가입은 아이디, 닉네임, 비밀번호를 검증한 뒤 사용자를 생성한다. 로그인은 아이디와 비밀번호를 검증하고 JWT를 발급한다. API 응답에는 사용자 기본 정보와 token이 포함되지만, `passwordHash`는 반환하지 않는다.

사용자 계정은 `ACTIVE`, `SUSPENDED`, `DEACTIVATED` 상태를 가진다. 정지 또는 비활성 계정은 로그인과 보호 API 접근이 제한된다. 관리자 상태 변경 또는 회원 탈퇴 흐름에서는 WebSocket `account.status.updated` 이벤트를 통해 사용자 화면이 제한 상태로 전환될 수 있다. 이 구조는 보안과 사용자 상태 관리를 함께 처리하기 위한 기반이다.

### 7.2 대시보드

대시보드는 사용자가 로그인 후 가장 먼저 학습 상태를 확인하는 화면이다. 오늘 일정, D-Day, 칸반 태스크, 집중 기록, 진행 중 퀘스트, 보상 요약을 한 화면에 제공한다. 진행 중 퀘스트 영역은 더보기/숨기기 문구를 상태에 맞게 바꾸도록 수정해 펼침 상태를 명확히 했다.

대시보드의 역할은 개별 기능으로 가는 입구가 아니라, 사용자가 오늘 해야 할 일을 판단하는 요약 화면이다. 따라서 정보량은 많지만 각 카드가 짧고 명확하게 읽히도록 구성했다.

### 7.3 일정/칸반

일정 기능은 학습 계획과 D-Day를 관리한다. 사용자는 시험, 과제, 복습 일정 등을 등록하고, 대시보드와 일정 화면에서 마감 정보를 확인할 수 있다. 칸반 태스크는 해야 할 일, 진행 중, 완료 같은 상태를 통해 오늘 학습 작업을 시각적으로 관리한다.

Schedule/Task API는 사용자별 데이터 접근 제한을 검증한다. 다른 사용자의 일정이나 태스크를 조회하거나 수정할 수 없도록 인증 사용자 기준으로 처리한다. 테스트에서는 일정 CRUD, 태스크 CRUD, 상태 변경, 사용자별 접근 제한을 확인했다.

### 7.4 학습 노트와 퀴즈 흐름

학습 노트 API는 노트 생성, 목록 조회, 상세 조회, 수정, 삭제를 지원한다. 노트는 AI 추천, 요약, 오답 분석과 연결될 수 있는 학습 기록의 기반이다. 현재 학습 노트 CRUD는 구현되어 있으며, AI 학습 화면에서는 사용자가 입력한 학습 텍스트나 텍스트 기반 PDF에서 추출한 내용을 바탕으로 요약, 학습 노트 초안, 복습 퀴즈 초안, 주요 키워드를 생성한다.

다만 현재 퀴즈 초안은 AI 학습 화면에서 확인하는 보조 결과이며, 별도의 정식 퀴즈 은행, 채점 이력, 장기 복습 스케줄과 완전히 통합된 형태는 아니다. 따라서 이 보고서에서는 노트 및 퀴즈 생성/관리를 교수님 제시 주제 1의 핵심 요구사항으로 정리하되, 구현 상태는 학습 노트 CRUD와 AI 보조 초안 생성 흐름으로 구분해 설명한다.

### 7.5 집중 시간/통계/히트맵

집중 시간 기능은 사용자가 공부한 시간을 세션 단위로 기록하고, 통계와 히트맵으로 학습 리듬을 확인하게 한다. Focus API는 집중 세션 저장과 조회를 처리하고, Statistics API는 학습 시간, 완료율, 히트맵 데이터를 제공한다.

히트맵은 학습 기록을 시각적으로 보여 주는 기능이다. 1분 기록이 지나치게 진하게 표시되는 혼동을 줄이기 위해 표시 intensity 기준을 점검했고, 짧은 기록은 연한 단계, 긴 기록은 더 진한 단계로 구분하는 방향을 사용했다. 데이터 계산 자체를 왜곡하지 않고 표시 강도만 사용자 경험에 맞게 조정했다.

### 7.6 AI 학습

AI 학습 기능은 사용자가 질문을 입력하면 AI 응답 또는 fallback 응답을 보여 주고, 학습 노트와 연결된 추천, 요약, 오답 분석을 제공한다. API는 noteId 소유권, 입력 validation, provider 실패, quota 제한, fallback 흐름을 처리한다.

첨부 검토 도구는 이미지와 PDF 파일을 실제 파일 선택, 형식/용량 검증, 서버 memory upload 처리 흐름으로 연결했다. 이미지 첨부는 파일을 영구 저장하지 않고 형식, 크기, 이미지 메타데이터를 1차 검토한다. 현재 버전은 이미지 OCR과 AI Vision 분석을 지원하지 않으며, 사용자가 이를 학습자료 자동 생성 기능으로 오해하지 않도록 화면 문구를 명확히 정리했다. 텍스트 기반 PDF 노트·퀴즈 생성은 PDF에서 추출 가능한 학습 텍스트를 읽고, 충분한 텍스트가 있을 때 요약, 학습 노트 초안, 복습 퀴즈, 키워드를 생성한다. 스캔 PDF나 이미지 OCR처럼 안정적으로 텍스트를 추출할 수 없는 경우에는 가짜 결과를 만들지 않고 텍스트 기반 PDF 사용을 안내한다.

자동 테스트는 실제 외부 AI API를 호출하지 않는다. 비용과 quota 제한이 있고, key 노출 위험이 있으므로 provider mock과 fallback을 사용해 기능 흐름을 검증한다. 따라서 본 프로젝트의 AI 기능은 실제 외부 상용 AI 서비스와 동일한 품질을 보장한다고 표현하지 않는다. 현재 단계에서는 학습 흐름 안에서 AI 보조 기능을 사용할 수 있는 구조와 fallback 안정성을 구현한 것으로 정리한다.

### 7.7 커뮤니티

커뮤니티는 질문, 학습 기록, 피드백을 공유하는 공간이다. 게시글 목록과 상세, 댓글과 대답글, 좋아요/싫어요, 북마크, 신고, 공개 프로필 이동 흐름을 제공한다. API 테스트에서는 게시글 CRUD, 댓글 CRUD, 반응 전환/취소, 북마크 생성/취소, 내 북마크 목록, 사용자 신고, 관리자 신고 처리 흐름을 확인했다.

프론트엔드 UI는 목록 화면의 오른쪽 빈 상세 패널을 제거하고, 게시글을 클릭하면 중앙 overlay 형태로 상세를 띄우도록 개선했다. 좋아요/싫어요 수는 별도 중복 표시를 없애고 버튼 옆 숫자로만 표시했다. 이 변경은 목록 화면의 공간 활용과 상세 집중도를 높이기 위한 UX 개선이다.

### 7.8 친구/쪽지

친구 기능은 사용자 검색, 친구 요청, 수락/거절, 친구 목록, 친구 삭제 흐름을 포함한다. 쪽지는 친구 간 thread를 기반으로 메시지를 주고받고, 읽지 않은 메시지 수와 읽음 상태를 표시한다. WebSocket 이벤트를 통해 친구 요청 상태, 접속 상태, 메시지 생성, 읽음 상태, typing 상태를 반영한다.

이 기능은 학습 커뮤니티의 확장으로 설계되었다. 커뮤니티가 공개적인 게시판이라면, 쪽지는 1:1 학습 소통 공간이다. 사용자는 친구와 학습 계획을 확인하고, 과제나 복습 상황을 공유하며, 동기 부여를 받을 수 있다.

### 7.9 보상/포인트 상점

보상 시스템은 학습 활동을 포인트, 배지, 칭호, 상점 아이템과 연결한다. 사용자는 포인트 상점에서 아이템을 구매하고 프로필에 적용할 수 있다. 칭호와 프로필 꾸미기 상태는 마이페이지와 공개 프로필에서 일관되게 표시되도록 데이터 매핑을 점검했다.

포인트와 보상은 실제 학습 데이터를 왜곡하지 않고 동기부여 장치로 사용된다. 보상 수령은 중복 수령을 방지하고, 포인트 거래 내역은 source type을 통해 추적할 수 있도록 설계했다.

### 7.10 보스 레이드

보스 레이드는 여러 사용자가 집중 시간과 완료 태스크를 통해 보스 HP를 줄이는 협동형 학습 기능이다. 파티 생성, 공개 모집, 참여 코드, 초대, 상세 조회, 진행률, 보상 수령 흐름을 제공한다. 진행률 변경과 완료 상태는 WebSocket 이벤트로 파티 멤버에게 전달된다.

보스 레이드는 참여자별 서버 저장형 숨김/보관/복원과 진행 중 나가기 정책까지 확장했다. `BossRaidParticipant`에는 `hiddenAt`, `archivedAt`, `leftAt` 상태가 추가되었고, 일반 참여자는 진행 중 파티에서 나갈 수 있으며 파티장은 다른 active member가 남아 있으면 나갈 수 없도록 제한했다. 기존 기여도와 보상 claim 기록은 삭제하지 않고 보존하며, 완료/종료 파티는 사용자별 보관과 복원이 가능하다. 이 정책은 Issue [#389](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/389)와 PR #411에서 구현되었고, `20260604000000_add_boss_raid_participant_visibility` migration은 user-approved deployment/demo DB 기준 `prisma migrate deploy`로 적용 상태를 확인했다.

### 7.11 협동 퀘스트

협동 퀘스트는 여러 사용자가 같은 목표에 기여하고, 목표 달성 후 각자 보상을 수령하는 기능이다. 사용자는 퀘스트에 참여하고, 집중 시간 또는 기여도를 추가하며, 진행률을 확인할 수 있다. 완료된 퀘스트는 보상을 수령할 수 있고, 사용자별 숨김/보관/복원 상태를 관리할 수 있다.

협동 퀘스트의 숨김/보관은 퀘스트 자체를 삭제하지 않고 `CollaborativeQuestParticipant` 기준의 사용자별 상태로 처리한다. 이 방식은 다른 참여자, 전체 진행률, 보상 claim 기록에 영향을 주지 않는다. 따라서 진행 중 나가기 또는 완료 항목 정리는 데이터 보존과 사용자 UX를 함께 고려한 처리 방식이다.

### 7.12 프로필/마이페이지

프로필과 마이페이지는 사용자의 학습 목표, 선호 과목, 프로필 꾸미기, 칭호, 학습 흐름 요약을 보여 준다. 포인트 상점에서 적용한 칭호가 마이페이지 학습 흐름에서도 같은 기준으로 표시되도록 데이터 source를 점검했다. 적용 칭호가 없으면 기존 `칭호 없음`에 해당하는 i18n 문구를 유지하고, 적용된 칭호가 있으면 미리보기와 마이페이지에서 같은 값이 보이도록 했다.

### 7.13 접근성/전체 읽기/돋보기

접근성 기능은 다양한 연령과 학습 환경을 고려해 설계했다. 사용자는 텍스트 크기, 고대비, 모션 감소, 초등학생 친화 UI 설정을 사용할 수 있다. 돋보기 기능은 화면 일부를 확대해 보여 주고, 전체 읽기 기능은 주요 텍스트를 읽는 흐름을 제공한다.

돋보기는 DOM clone 기반으로 구현되어 빠르게 변하는 화면의 실시간 갱신에는 한계가 있다. 이 한계는 후속 접근성 고도화 범위로 남겨 두고, 현재 단계에서는 주요 화면의 텍스트와 카드 가독성을 보조하는 기능으로 다룬다.

### 7.14 관리자/점검 모드/정지 사유

관리자 기능은 사용자 계정 상태 변경, 커뮤니티 신고 처리, 보상 데이터 관리, 점검 모드, 관리자 공지를 포함한다. 점검 모드가 활성화되면 일반 사용자는 점검 화면을 보며, 관리자는 로그인 후 관리 화면에 접근할 수 있다. 사용자 정지 또는 비활성 상태는 제한 화면과 로그인 차단 흐름으로 반영된다.

관리자 기능은 role 기반 권한 검사를 사용한다. 일반 사용자가 관리자 API에 접근할 수 없도록 401/403 응답을 구분하고, 관리자 자기 자신의 정지/비활성화 같은 위험 동작은 차단한다.

---

## 8. AI 활용 분석

### 8.1 활용 범위

AI는 프로젝트 전 과정에서 보조 도구로 활용되었다. 요구사항 단계에서는 persona, 사용자 인터뷰 질문, 요구사항 누락 가능성을 검토하는 데 사용했다. 설계 단계에서는 기능 흐름과 다이어그램 초안, API 분리 기준, 테스트 범위 후보를 정리하는 데 활용했다. 구현 단계에서는 코드 초안, 리팩터링 방향, 테스트 케이스 후보, PR 검토 체크리스트, 문서 정리 보조에 활용했다.

중요한 원칙은 AI 결과를 그대로 반영하지 않는 것이다. AI가 제안한 코드나 문서라도 팀원이 현재 main, 요구사항 문서, 설계 문서, 테스트 결과와 대조한 뒤 반영했다. 잘못된 방향의 인트로/서비스 소개 애니메이션, 다국어 문구 누락, UI 구조 문제 등은 수동 QA와 반복 PR을 통해 수정했다.

### 8.2 코드 생성과 리팩터링 보조

AI는 반복적인 frontend UI 보정, backend 테스트 케이스 작성, API validation 후보 점검, i18n 문구 매핑, 문서 링크 검증에 유용했다. 특히 여러 언어의 서비스 소개 문구와 카드 내부 micro animation 보정처럼 반복적이고 세밀한 작업은 AI 보조로 속도를 높였다.

반면 AI가 제안한 결과가 항상 적절하지는 않았다. 예를 들어 인트로 애니메이션에서는 글자 형성과 입자 target이 어긋나는 문제가 있었고, 여러 차례 실패 기준을 확인한 뒤 canvas text target 기반으로 `사각사각` 입자와 최종 텍스트 싱크를 맞췄다. 이 사례는 AI 보조 결과도 실제 화면 검증과 사용자 판단이 필요하다는 점을 보여 준다.

### 8.3 테스트 설계 보조

테스트 설계에서는 AI를 통해 경계값, 인증/권한 실패 케이스, 민감정보 미노출, userId spoofing 차단, provider fallback, rate limit 같은 테스트 후보를 도출했다. 그러나 실제 테스트 완료 여부는 Jest/Supertest 실행 결과를 기준으로 기록했다. 실행되지 않은 테스트나 아직 자동화되지 않은 UI 테스트는 완료로 표시하지 않는다.

### 8.4 문서화 보조

AI는 요구사항, 설계, 테스트 보고서, API 명세, 설치 가이드, 최종 프로젝트 보고서의 구조를 정리하는 데 사용되었다. 최종 제출 문서에서는 raw chat log나 내부 요청 원문을 그대로 남기지 않고, 결정 사항과 결과 중심으로 요약했다. AI 사용 정책은 [AI 에이전트 사용 및 원격 작업 안전 규칙](../ai-agent-usage-policy.md)에 별도 정리되어 있다.

### 8.5 AI 활용의 장점

| 장점 | 프로젝트 적용 예 |
|---|---|
| 반복 작업 속도 향상 | 다국어 문구 매핑, PR body 작성, 문서 링크 정리 |
| 테스트 케이스 확장 | 인증/권한, fallback, userId spoofing, 민감정보 미노출 검증 후보 도출 |
| 문서 구조화 | 단계별 제출물, 부록 인덱스, 최종보고서 목차 정리 |
| PR 검토 보조 | 변경 범위, schema/migration/package 변경 여부, 위험 작업 확인 |
| UI 품질 개선 | 서비스 소개 micro animation, 인트로 flicker, 커뮤니티 overlay 개선 반복 |

### 8.6 AI 활용의 한계

AI는 최신 main 상태를 자동으로 완벽히 이해하지 못한다. 따라서 작업 전 `git fetch`, `git pull`, `git status`, 변경 파일 확인이 필요했다. 또한 AI가 생성한 UI/애니메이션은 사용자가 원하는 감성과 다를 수 있다. 인트로 작업에서는 여러 번 실패 기준을 확인했고, 최종적으로 입자 target과 실제 텍스트 위치를 같은 좌표계로 맞추는 방식으로 개선했다.

외부 AI API는 무료 quota와 key 관리 제약이 있다. 프로젝트는 AI 기능을 구현했지만 자동 테스트에서 실제 외부 AI 호출을 하지 않는다. 따라서 AI 기능 품질은 mock/fallback 흐름과 제한된 수동 확인을 기준으로 설명한다.

---

## 9. 테스트 및 품질 보증

### 9.1 테스트 전략

테스트는 backend API와 service 흐름을 중심으로 구성했다. Jest와 Supertest를 사용해 인증, 사용자/프로필, 일정/태스크, 학습 노트, AI, 집중/통계, 커뮤니티, 친구, 보상, 상점, 관리자, 보스 레이드, 협동 퀘스트, 점검 모드, WebSocket helper를 검증했다. 외부 AI와 실제 production DB에 의존하지 않도록 repository mock과 provider mock을 활용했다.

### 9.2 최신 테스트 결과

최신 확인 기준 백엔드 테스트 결과는 다음과 같다.

| 항목 | 결과 |
|---|---|
| Jest/Supertest 전체 테스트 | `29 suites / 548 tests` 통과 |
| Prisma validate | 통과 기준으로 운영 |
| Prisma Client generate | 통과 기준으로 운영 |
| Frontend config check | 통과 기준으로 운영 |
| Expo Web export | 통과 기준으로 운영 |
| Backend coverage 정량 측정 | Statements 68.63%, Branches 60.70%, Functions 68.27%, Lines 68.72% |
| Frontend coverage 정량 측정 | 미측정. Expo config/export 중심 검증 |

정량 coverage는 backend Jest 기준으로 측정했다. frontend는 별도 화면/컴포넌트 coverage 도구를 도입하지 않았으므로 수치를 작성하지 않고, `npm run check:frontend`와 `npm run check:frontend:web`를 통한 설정 확인 및 Web export 검증으로 분리해 기록한다.

### 9.3 검증 명령

프로젝트에서 사용하는 주요 검증 명령은 다음과 같다.

```bash
git diff --check
npm test
npm run check
npm run check:frontend
npm run check:frontend:web
npm run validate:prisma
npm --prefix src/backend run prisma:generate
npm --prefix src/frontend run expo:export:web
```

문서 변경 PR에서도 최소 `git diff --check`와 markdown 내부 링크 확인을 수행한다. 기능 코드 변경 PR에서는 backend/frontend 검증과 PR CI 결과를 함께 확인한다.

### 9.4 테스트 범위

테스트는 다음 영역을 포함한다.

- Health API
- Auth API
- User/Profile API
- Schedule/Task API
- Study Note API
- AI API와 AI Chat Room
- Focus/Statistics API
- Reward/Shop API
- Friend API
- Community Post/Comment/Reaction/Bookmark/Report API
- Admin Community Report/Admin Reward/Admin API
- System Maintenance API
- Realtime WebSocket helper
- Boss Raid API
- Collaborative Quest API
- Direct Message API
- Seed script guard와 demo seed 구성

### 9.5 수동 QA와 smoke test

자동 테스트만으로 frontend 화면, 반응형, 다크모드, 접근성, WebSocket 연결, 배포 환경 차이를 모두 검증하기 어렵다. 따라서 [Vercel smoke test](../deployment/vercel-smoke-test.md)를 통해 인트로, 로그인, 대시보드, 일정, AI, 집중/통계, 커뮤니티, 친구/쪽지, 보상, 협동 기능, 접근성, 관리자/점검 모드를 수동 확인하도록 정리했다.

### 9.6 테스트 보고서 부록

테스트의 상세 케이스와 버그 로그, AI 보조 테스트 설계 기록은 [테스트 보고서](../test-report/test-report.md)에 정리되어 있다.

---

## 10. 배포 및 운영

### 10.1 배포 구조

배포 구조는 frontend와 backend를 분리한다. frontend는 Expo Web export 결과를 Vercel에서 제공하는 구조를 기준으로 한다. backend는 별도 Node.js 서버에서 REST API와 WebSocket endpoint를 제공한다. DB는 Prisma를 통해 접근하는 관계형 DB를 사용한다. 실제 배포 환경의 API base URL, DB URL, JWT secret, AI key는 환경 변수로 관리하며 문서에 원문을 기록하지 않는다.

### 10.2 설치와 실행

설치 및 실행은 [설치 및 사용 가이드](../deployment/install-and-usage-guide.md)를 기준으로 한다. 기본 흐름은 의존성 설치, backend 실행, frontend 실행, Prisma validate/generate, seed 실행, 테스트 실행 순서다. seed는 local/dev/demo/deployment-demo 또는 사용자가 승인한 DB에만 실행해야 하며, `NODE_ENV=production` 환경에서는 실행하지 않는다.

### 10.3 seed 적용

최종 정리 기준으로 사용자가 승인한 deployment/demo DB에 최신 seed를 1회 적용했다. seed 실행 결과에는 실제 DB URL, host, password, token, secret, API key를 기록하지 않는다. seed 데이터는 데모 화면이 비어 보이지 않도록 일정, 칸반, 집중/통계, 커뮤니티, 친구/쪽지, 보상, 상점, 협동 퀘스트, AI 관련 기본 데이터를 제공한다.

### 10.4 smoke test

배포 후에는 [Vercel smoke test](../deployment/vercel-smoke-test.md)를 기준으로 핵심 화면과 API 연결을 확인한다. 특히 API base URL, CORS, WebSocket endpoint, 인증, demo seed 데이터, 관리자 점검 모드, 접근성 화면을 확인한다. 외부 AI provider가 연결되지 않거나 quota가 부족한 경우 fallback 응답이 표시되는지 확인한다.

### 10.5 운영 주의사항

운영 단계에서는 다음 사항을 주의해야 한다.

- 실제 secret 원문을 문서, 로그, PR, Issue에 기록하지 않는다.
- production DB에서는 `test:db`, `migrate dev`, 임의 seed를 실행하지 않는다.
- migration 적용은 별도 승인된 배포 절차에서만 수행한다.
- WebSocket 연결 실패 시 HTTP fallback 동작을 확인한다.
- demo seed와 실제 운영 데이터의 차이를 문서와 발표에서 명확히 설명한다.

### 10.6 배포·운영 상태 요약

| 항목 | 최종 정리 상태 | 확인 근거 |
|---|---|---|
| 최신 seed 적용 | 사용자가 승인한 deployment/demo DB에 최신 seed 1회 적용 | seed 실행 결과와 테스트 보고서 반영 |
| 보스 레이드 migration | `20260604000000_add_boss_raid_participant_visibility` 적용 상태 확인 | PR #411, Prisma validate/generate, deployment/demo DB 적용 기록 |
| 배포 smoke test | Vercel/Render/DB 연결, 주요 화면, 관리자/점검 모드 점검 항목 문서화 | [배포 smoke test](../deployment/vercel-smoke-test.md) |
| coverage 측정 | backend Jest coverage 정량 측정, frontend 정량 coverage 미측정 명시 | [테스트 보고서](../test-report/test-report.md) |
| 데모 자료 | screenshots 기능별 폴더와 `screenshots/manifest.md`로 원본명-새 경로 매핑 정리 | [screenshots manifest](../../screenshots/manifest.md) |
| 운영 보안 | env/secret 원문 미기록, seed/migration 실행 조건 분리 | [설치 및 사용 가이드](../deployment/install-and-usage-guide.md) |

---

## 11. 협업 방식과 GitHub 운영

### 11.1 Issue 기반 작업

팀은 기능, 문서, 테스트, QA를 Issue 단위로 관리했다. Issue에는 작업 범위, 제외 범위, 검증 기준을 명확히 적고, 작업 브랜치와 PR을 연결했다. 이 방식은 요구사항과 구현, 검증 결과가 GitHub history에 남도록 하는 데 도움이 되었다.

### 11.2 Branch 규칙

작업은 `main`에서 직접 수행하지 않고, 목적별 branch에서 진행했다. 문서 작업은 `docs/...`, 기능 작업은 `feature/...`, 오류 수정은 `fix/...`, frontend UI 작업은 `frontend/...` 형식으로 구분했다. 작업 시작 전에는 `git fetch --all --prune`, `git checkout main`, `git pull --ff-only origin main`으로 최신 main을 기준으로 branch를 생성했다.

### 11.3 PR 검토와 merge 방식

PR은 변경 범위, 테스트 결과, schema/migration 여부, package/workflow 변경 여부, 민감정보 노출 여부를 확인한 뒤 병합했다. merge 방식은 일반 Merge commit을 사용했고, Squash/Rebase merge는 사용하지 않았다. Merge commit을 사용하는 이유는 브랜치 단위 작업 이력과 조별과제 기여도를 추적하기 쉽기 때문이다.

### 11.4 Reviewer와 assignee

가능한 경우 task owner를 assignee로 지정하고, 팀원 reviewer를 요청했다. reviewer가 비어 있거나 조원 reviewer가 빠진 PR은 GitHub 상태를 확인해 reviewer를 보강했다. 다만 closed/merged PR에 reviewer 추가가 제한되는 경우에는 GitHub 제한으로 보고하고 PR 상태를 강제로 바꾸지 않았다.

### 11.5 회의록과 문서 부록화

회의록은 요구사항 도출, 설계 결정, 역할 분담, PR 검증, AI 활용, 최종 제출 준비의 근거로 남겼다. 문서 부록 인덱스는 요구사항, 설계, 테스트, API, 배포, 최종보고서, 발표자료, 데모 시나리오, AI 활용 정책, 개발 작업 규칙을 하나로 연결한다.

### 11.6 개발 작업 규칙 부록

이전 README에 포함되어 있던 branch, commit, PR, merge, AI/Codex 사용, seed/migration/secret 주의사항은 [개발 및 협업 작업 규칙](../development-workflow-rules.md)으로 분리해 보존했다. 현재 README는 최종 제출과 프로젝트 소개 중심으로 유지하고, 운영 규칙은 docs 부록으로 관리한다.

### 11.7 주요 PR 기반 개발 흐름

| 구분 | PR | 반영 내용 | 최종보고서 연결 |
|---|---|---|---|
| 소개페이지/인트로 | #379 | 입자 기반 인트로, 민트 연필, `사각사각` 텍스트 형성, 첫 진입 flicker 보정 | 1.2, 12.1~12.3 |
| 소규모 UX | #381 | 회원가입 입력 안내/validation, 비밀번호 변경 문구, 점검 화면 문구, 설정 아이콘 | 7.1, 7.14 |
| 프로필/통계 | #383 | 칭호 표시 일관성, 히트맵 intensity 표시 기준 점검 | 7.5, 7.12 |
| 커뮤니티 | #385 | 오른쪽 빈 패널 제거, 중앙 상세 overlay, 반응 수 중복 제거 | 7.7, 12.4 |
| AI 안정화 | #387 | AI quota/fallback 사용자 메시지와 provider 실패 대응 | 7.6, 12.5 |
| 레이드/협동 UX | #390 | 협동 퀘스트 나가기/보관, 보스 레이드 임시 숨김과 토글 UX 정리 | 7.10, 7.11 |
| 실시간/계정 상태 | #392 | 친구 요청 실시간 반영, 정지 사유 payload 정리 | 7.8, 7.14 |
| 접근성 | #394 | 돋보기와 전체 읽기 흐름 보강 | 7.13, 13.4 |
| 도움말 | #398 | 주요 화면 도움말 tour 연결 | 1.4, 7.13 |
| Seed | #402 | 최종 demo seed 최신화 | 10.3 |
| 보스 레이드 정책 | #411 | `hiddenAt`/`archivedAt`/`leftAt` 기반 서버 저장형 숨김/탈퇴 정책 | 7.10, 13.3 |
| Screenshots | #417 | raw 자료 기능별 분류와 manifest 정리 | 10.6, 17.7 |
| AI 첨부 도구 | #419 | 이미지/PDF 첨부, 텍스트 기반 PDF 추출, 요약/노트/퀴즈 초안 생성 | 7.4, 7.6 |
| AI 문구/커서 | #421 | 이미지 OCR/Vision 미지원 문구 명확화, 도움말 보강, 웹 연필 커서 | 1.4, 7.6 |
| 헤더 UX | #423 | 도움말 버튼 attention ring, 설정 아이콘 시각 보정 | 1.4, 7.13 |

### 11.8 주요 Issue 기반 정리

| 구분 | Issue | 처리 결과 | 비고 |
|---|---|---|---|
| 보스 레이드 정책 | #389 | PR #411에서 서버 저장형 숨김/보관/복원/나가기 정책 구현 | 파티장 탈퇴 제한과 기록 보존 포함 |
| 실시간 로드맵 | #273 | 친구 요청, 쪽지, 계정 상태, 레이드/협동 이벤트 중심으로 반영 | 남은 세부 확장은 향후 운영 고도화 |
| 다국어 QA | #228 | ko/en/ja/zh 문구 보강과 주요 화면 i18n 점검 반영 | 자동 검증과 수동 QA 병행 |
| 전체 화면 QA | #220 | 소규모 UX, 커뮤니티, AI, 접근성, 도움말, 레이드/협동 보정 PR로 분산 처리 | 최종 smoke test는 배포 문서 기준 |
| 실제 서비스화 로드맵 | #201 | 최종보고서 한계점과 향후 확장성에 반영 | 외부 AI 비용, 운영 모니터링, 모바일 최적화 |
| UI/UX 로드맵 | #172 | 소개페이지, 커뮤니티, 접근성, 도움말, 헤더 polish로 주요 항목 반영 | 장기 개선은 향후 확장성으로 유지 |
| Windows/Prisma Studio notice | #78 | 설치/사용 가이드와 작업 규칙 문서에서 참고 항목으로 유지 | notice 성격으로 open 유지 가능 |

---

## 12. 문제 해결 사례

### 12.1 PR #264 인트로/서비스 소개 방향 재정리

초기 PR #264에는 인트로와 서비스 소개 변경이 섞여 있었다. 사용자는 서비스 소개 결과는 만족했지만 인트로 결과는 만족하지 않았다. 따라서 main 기준 clean branch를 만들고, 서비스 소개 관련 변경만 선별 이식했다. 이후 서비스 소개 정적 화면, FOCUS 섹션, 카드 micro animation, 다국어 문구 정리, 인트로 개선을 별도 PR로 분리했다. 이 과정은 변경 범위를 분리하고 실패한 방향을 그대로 병합하지 않는 협업 운영 사례다.

### 12.2 `사각사각` 인트로 입자와 텍스트 싱크 해결

소개페이지 인트로에서는 수학 기호와 학습 용어 입자가 민트 연필과 `사각사각` 텍스트를 형성하는 연출을 구현했다. 초기에는 입자가 글자 주변에 모일 뿐 실제 텍스트와 맞지 않는 문제가 있었다. 이를 해결하기 위해 canvas text shape 기반 target을 생성하고, 최종 텍스트와 particle target이 같은 좌표계를 사용하도록 보정했다. 결과적으로 입자 실루엣과 최종 `사각사각` 텍스트가 같은 위치에서 굳어지는 느낌을 만들었다.

### 12.3 첫 진입 flicker 수정

새 탭 첫 진입 시 랜딩/서비스 소개 화면이 1프레임 먼저 보였다가 인트로가 덮이는 문제가 있었다. 원인은 intro 표시 여부 판정이 화면 shell 렌더보다 늦는 구조였다. 상위 App/Header 렌더링 전에 intro 필요 여부를 동기적으로 판단하고, intro 중에는 app chrome과 landing body를 렌더링하지 않도록 수정했다. 이로써 첫 프레임부터 인트로가 표시되고, 인트로 종료/건너뛰기/다시 보기 흐름은 유지되었다.

### 12.4 커뮤니티 상세 오른쪽 패널 제거와 중앙 overlay 전환

커뮤니티 목록 화면 오른쪽에 `게시글을 선택해 주세요` 빈 패널이 공간을 차지해 목록 화면 활용도가 떨어졌다. 이를 제거하고, 게시글을 클릭하면 중앙 overlay로 상세를 보여 주도록 변경했다. 좋아요/싫어요 수는 버튼 옆 숫자로만 표시해 중복을 줄였다. 댓글, 반응, 북마크, 신고, 공개 프로필 이동 흐름은 유지했다.

### 12.5 AI quota fallback 사용자 메시지 처리

AI 기능은 외부 provider quota와 key 상태에 따라 실패할 수 있다. 이 경우 사용자에게 내부 오류나 secret을 노출하지 않고 fallback 응답과 안내 메시지를 제공하도록 구성했다. 자동 테스트에서도 실제 외부 AI API를 호출하지 않고 provider mock과 fallback 중심으로 검증했다.

### 12.6 친구 요청 WebSocket 실시간 반영

친구 요청 생성, 수락, 거절, 삭제 흐름은 `friends.request.updated` 이벤트로 관련 사용자에게 전달된다. 이 이벤트는 요청자와 대상자에게만 전달되며, 친구 관계가 없는 사용자의 상태를 노출하지 않는다. WebSocket 실패 시에는 HTTP fallback으로 목록을 새로고침해 상태를 확인할 수 있다.

### 12.7 접근성 돋보기 DOM clone 기반 구현

돋보기 기능은 사용자가 화면 일부를 확대해 볼 수 있도록 DOM clone 기반으로 구현했다. 이 방식은 구현 난이도와 성능을 균형 있게 맞출 수 있었지만, 빠르게 변하는 화면을 완전히 실시간으로 반영하는 데는 한계가 있다. 따라서 현재 단계에서는 주요 텍스트와 카드 가독성을 보조하는 기능으로 설명하고, 고도화는 향후 확장성에 남겼다.

### 12.8 협동 퀘스트 hiddenAt 기반 진행 중 나가기 처리

협동 퀘스트는 퀘스트 자체를 hard delete하지 않고 참여자별 `hiddenAt`/`archivedAt` 상태로 목록 표시를 제어했다. 이 방식은 보상, 기여도, 참여 기록을 보존하면서 사용자별 목록 정리를 가능하게 한다. 보스 레이드도 PR #411에서 참여자별 `hiddenAt`/`archivedAt`/`leftAt` 상태를 추가해 서버 저장형 숨김/보관/복원과 진행 중 나가기 정책을 구현했다. 완료/종료 파티는 보관/복원이 가능하고, 진행 중 파티는 일반 참여자 나가기를 허용하되 파티장 탈퇴는 다른 active member가 남아 있으면 제한한다.

### 12.9 seed 적용 시 DB target 안전 분류

seed는 DB write 작업이므로 실행 전 DB target을 안전하게 분류해야 한다. 문서와 로그에는 DB URL, host, password, token, secret 원문을 출력하지 않는다. 사용자가 deployment/demo DB seed 적용을 승인한 경우에도 seed는 정확히 1회만 실행하고, 실행 결과는 민감정보 없이 요약했다.

---

## 13. 한계점

### 13.1 무료 AI API 한도

AI 학습 기능은 외부 AI provider를 사용할 수 있지만, 무료 quota와 API key 관리 문제가 있다. 자동 테스트는 실제 외부 API를 호출하지 않고 mock/fallback 중심으로 수행한다. 첨부 검토 도구도 파일 검증, 이미지 메타데이터 검토, 텍스트 기반 PDF 추출, fallback 응답은 검증했지만, 이미지 OCR과 스캔 PDF OCR은 현재 안정 지원 범위에 포함하지 않는다. 따라서 AI 기능의 품질과 OCR 확장성은 실제 운영 환경에서 추가 검증이 필요하다.

### 13.2 coverage 정량 측정 범위 제한

Jest/Supertest 테스트는 `29 suites / 548 tests` 통과 기준으로 정리되어 있으며, backend Jest coverage는 statements 68.63%, branches 60.70%, functions 68.27%, lines 68.72%로 측정했다. 다만 이 수치는 backend 테스트에 한정된다. frontend 화면/컴포넌트 coverage와 E2E coverage는 아직 정량 측정하지 않았고, 현재는 Expo config와 Web export 검증을 통해 빌드 가능성을 확인한다.

### 13.3 보스 레이드 visibility와 탈퇴 정책

보스 레이드 참여자별 서버 저장형 숨김과 진행 중 탈퇴는 보상/기여도 보존, 파티장 권한, 공개 모집 상태, 완료 상태, 중복 보상 방지와 연결된다. PR #411에서는 참여자 row를 삭제하지 않고 `hiddenAt`, `archivedAt`, `leftAt` 상태로 사용자별 표시와 참여 상태를 제어하는 방식으로 구현했다. 이번 migration 적용 확인에서는 user-approved deployment/demo DB 기준 `20260604000000_add_boss_raid_participant_visibility` migration이 pending 없이 반영된 상태임을 확인했고, 비파괴 Prisma 조회로 새 column query가 오류 없이 동작함을 확인했다.

### 13.4 DOM clone 기반 돋보기 한계

돋보기는 화면 확대 보조 기능으로 유용하지만, DOM clone 방식은 빠르게 변하는 화면이나 복잡한 canvas/animation 영역의 갱신에 한계가 있다. 현재는 접근성 보조 기능으로 충분히 설명할 수 있으나, 실사용 서비스 수준에서는 브라우저 호환성과 갱신 성능을 추가 검증해야 한다.

### 13.5 demo seed와 실제 운영 데이터 차이

demo seed는 발표와 시연을 위해 화면이 비어 보이지 않도록 구성한 데이터이다. 실제 운영 데이터와는 양, 품질, 사용자 행동 패턴이 다르다. 따라서 발표에서는 seed 기반 demo와 실제 운영 데이터의 차이를 명확히 설명해야 한다.

### 13.6 수동 QA 필요 영역

frontend 반응형, 다크모드, 고대비, large text, WebSocket 연결, 배포 환경 CORS, AI quota fallback은 자동 테스트만으로 완전히 검증하기 어렵다. smoke test와 데모 시나리오를 통해 수동 QA를 병행해야 한다.

---

## 14. 향후 확장성

### 14.1 보스 레이드 운영 정책 고도화

보스 레이드 참여자별 숨김, 중도 탈퇴, 파티장 권한, 보상/기여도 보존 정책은 PR #411에서 서버 저장형 정책으로 반영했다. 향후에는 운영 데이터가 누적된 상황에서 파티장 위임, 대규모 파티의 진행률 재계산 성능, 보관 목록 UX, 복원 정책을 추가로 고도화할 수 있다.

### 14.2 WebSocket 기능 확장

현재 WebSocket은 친구 요청, 접속 상태, 쪽지, 계정 상태, 레이드/협동 진행률을 지원한다. 향후에는 알림, 커뮤니티 실시간 반응, 협동 퀘스트 채팅, 관리자 broadcast 상태를 더 세분화할 수 있다. 관련 로드맵은 [#273](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/273)에 연결되어 있다.

### 14.3 실사용 서비스화

현재 프로젝트는 과제 제출과 demo 목적의 구현이다. 실사용 서비스로 확장하려면 외부 AI provider 비용 관리, 사용자 데이터 보안 정책, 운영 모니터링, 장애 대응, 알림 채널, 개인정보 처리 기준, 장기 학습 데이터 분석이 필요하다. Mock/local 기반 기능의 실제 서비스화는 [#201](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/201)과 연결된다.

### 14.4 모바일 최적화

Expo/React Native Web 구조는 모바일 확장 가능성을 남긴다. 향후 실제 모바일 앱으로 확장하려면 터치 인터랙션, 작은 화면 레이아웃, 키보드 입력, 권한, push notification, 성능 최적화를 추가 검증해야 한다.

### 14.5 AI 기능 고도화

AI 기능은 장기 학습 이력, 과목별 약점, 오답 패턴, 반복 질문, 노트 품질을 반영하도록 고도화할 수 있다. 현재는 질문/요약/추천/오답 분석의 구조와 fallback 안정성 중심이며, 실제 개인화 품질은 운영 데이터와 비용 정책을 함께 고려해야 한다.

### 14.6 접근성 추가 개선

접근성 기능은 텍스트 크기, 고대비, 모션 감소, 돋보기, 전체 읽기를 제공하지만 자동 접근성 테스트와 스크린리더 호환성 검증은 보강이 필요하다. 향후 WCAG 기준 점검, 키보드 탐색, 초등학생 친화 UI의 실제 사용자 검증을 확장할 수 있다.

### 14.7 테스트 coverage 도입

backend Jest coverage는 text summary 기준으로 측정했다. 향후에는 frontend 화면 테스트와 E2E 테스트를 Playwright 또는 React Native Testing Library 기반으로 검토하고, backend coverage도 service/controller/repository별 사각지대를 줄이는 방향으로 보강할 수 있다.

### 14.8 운영 모니터링

배포 환경에서는 API 오류, WebSocket 연결 실패, AI provider quota, DB latency, 사용자 계정 상태 변경, seed 적용 이력 등을 모니터링할 필요가 있다. 현재 smoke test는 수동 점검 중심이므로, 운영 모니터링과 알림 체계는 향후 확장 범위이다.

---

## 15. 팀원별 소감

### 15.1 정이량

#### 1. 어려웠던 점

코드를 직접 짜는 부분 자체는 AI 에이전트를 적극적으로 활용했기 때문에 생각보다 큰 어려움은 없었습니다. 오히려 조장으로서 전체 협업 흐름을 관리하고, 브랜치 전략을 정리하고, 팀원들이 같은 환경에서 작업할 수 있도록 개발 환경을 맞추는 과정이 가장 힘들었습니다. 기능 구현 중에서는 백엔드 API나 기본 로직보다 UI/UX를 원하는 형태로 만드는 과정이 가장 어려웠습니다. AI의 성능이 좋은 만큼, 내가 머릿속으로 생각한 화면과 연출을 정확히 구현하게 하려면 프롬프트를 아주 구체적으로 작성해야 했기 때문입니다. 특히 인트로와 서비스 소개 화면은 원하는 느낌이 나오기까지 수많은 시행착오를 거쳤고, “어떻게 설명해야 AI가 내가 원하는 결과를 만들 수 있을까”를 계속 고민해야 했습니다.

#### 2. 성장한 점

이번 프로젝트를 통해 AI 에이전트를 활용한 개발, 이른바 바이브 코딩에 많이 익숙해졌습니다. 단순히 “만들어줘”라고 지시하는 것이 아니라, 요구사항을 쪼개고, 제약 조건을 명확히 정하고, 검증 기준까지 함께 제시해야 원하는 결과물에 가까워진다는 것을 배웠습니다. 또한 조장으로서 기능 구현만 보는 것이 아니라, 브랜치 관리, PR 검토, 테스트 통과 여부, 문서 정리, 배포 상태까지 전체 개발 흐름을 관리하는 경험을 했습니다. 이 과정에서 개발은 코드만 잘 짜는 것이 아니라, 팀원들이 같은 방향으로 움직일 수 있게 기준을 세우고 유지하는 일이라는 점을 크게 느꼈습니다.

#### 3. 극복/협업 경험

문서 작업부터 기능 구현, 테스트, 배포까지 해야 할 일이 많아서 부담이 컸지만, 목표를 단순히 “기말 대체 과제”로 두지 않고 실제 출시를 목표로 하는 서비스처럼 만들어보자는 마음으로 접근했습니다. 물론 실제 출시 서비스라고 하기에는 아직 부족한 부분이 많지만, 그런 목표를 잡으니 생각보다 더 몰입해서 작업하게 되었습니다. 요구사항 문서와 설계 문서를 먼저 정리하고, 그 내용을 바탕으로 기능을 구현하고, 이후 테스트 기록과 회의록, 최종보고서까지 연결해 나가면서 프로젝트가 점점 하나의 서비스 형태를 갖춰가는 과정을 경험했습니다. 팀원들이 각자 만든 기능과 문서를 바탕으로 피드백을 주고받았고, 저는 그 흐름을 최신 main 기준으로 검토하고 통합하면서 협업의 중요성을 배웠습니다.

#### 4. 간단한 소감 정리

사실 중간고사 전까지는 소프트웨어공학 수업이 이론 중심이라 크게 와닿지 않았습니다. 하지만 이번 프로젝트를 진행하면서 요구사항 분석, 설계, 구현, 테스트, 배포, 문서화 과정을 직접 연결해 보니 소프트웨어공학이 실제 개발 과정에서 왜 필요한지 조금씩 이해하게 되었습니다. 특히 “사용자는 무엇을 불편해할까?”, “내가 사용자라면 어떤 기능이 더 필요할까?”를 계속 생각하면서 작은 UI 문구나 버튼 위치, 화면 흐름 같은 디테일에도 끈질기게 매달리게 되었습니다. 그 과정이 힘들기도 했지만, 동시에 실제 서비스를 출시하기 직전의 개발자가 된 것 같은 느낌이 들어 재미있었습니다.

마지막으로, 제가 프로젝트를 더 좋은 방향으로 만들고 싶다는 마음이 커서 몇몇 부분에서는 욕심을 과하게 낸 것도 사실입니다. 인트로, 서비스 소개 화면, UI/UX 디테일처럼 제가 끝까지 붙잡고 싶어 했던 부분 때문에 조원들이 피로했을 수도 있다고 생각합니다. 그 점에 대해서는 미안하게 생각하고, 그래도 끝까지 같이 맞춰주고 피드백해준 팀원들에게 고맙습니다. 이번 프로젝트는 기능 구현뿐만 아니라, 협업에서 기준을 세우는 것과 동시에 팀원들의 부담도 함께 고려해야 한다는 점을 배운 경험이었습니다.

### 15.2 황대겸

#### 1. 어려웠던 점

조원마다 작업 속도, 작업 방식, AI를 활용하는 방법, 보고서를 작성하는 방식이 달라 처음에는 그 흐름을 따라가는 것이 어려웠습니다. 특히 기존에 혼자 작업하던 방식과는 다르게, 팀의 방식에 맞춰 소통하고 작업해야 했기 때문에 익숙해지는 과정이 필요했습니다.

#### 2. 성장한 점

좋은 작업 방식이 있다면 조원에게 직접 물어보고 따라 하려고 노력하면서, 기존의 작업 방식을 개선할 수 있었습니다. 특히 Agent.md 파일을 활용해 AI에게 작업 수칙을 정리해 주고, 프롬프트를 넣기 전에 AI로 지시사항을 정제한 뒤 Code Agent에게 전달하는 방식을 배우며 작업 의도를 더 명확하게 전달하는 방법을 익혔습니다.

#### 3. 극복 / 협업 경험

기존에는 Git을 터미널에서만 사용해 보았지만, 이번 과제를 통해 VSCode에서 Git Graph를 확인하며 변경 사항을 파악하는 방법을 배웠습니다. 또한 커밋 메시지를 한 줄로 작성하는 것이 아니라, 작업 태그를 붙이고 하위 항목을 계층적으로 정리하는 방식도 알게 되었습니다. 이를 통해 단순히 코드를 작성하는 것뿐만 아니라, 협업을 위한 기록과 소통 방식의 중요성을 배울 수 있었습니다.

#### 4. 간단한 소감

이번 프로젝트를 통해 혼자 작업할 때는 알기 어려웠던 협업 과정과 작업 방식들을 경험할 수 있었습니다. 특히 일반적인 대화가 아니라, 작업을 효율적으로 진행하기 위한 소통 방식이 중요하다는 것을 느꼈고, 앞으로 프로젝트를 진행할 때 더 명확하게 의도를 전달하고 팀원들과 맞춰가는 태도를 가지게 되었습니다.

### 15.3 박지환

#### 1. 어려웠던 점

제작 전 과정에서 AI를 적극적으로 활용했기 때문에 전체적인 작업 속도는 매우 빨랐습니다. 하지만 그만큼 하루가 지날 때마다 PR과 Issue가 빠르게 쌓였고, 작업을 시작하기 전에 최신 흐름을 모두 읽고 이해하는 데 많은 시간이 필요했습니다. 실제 협업에서는 단순히 내 작업만 보는 것이 아니라, 다른 사람이 어떤 맥락에서 무엇을 바꾸었는지까지 계속 따라가야 한다는 점을 크게 느꼈고, 앞으로는 이런 흐름을 더 빠르게 파악하는 능력도 중요하다고 생각했습니다.

#### 2. 성장한 점

AI에게 단순히 “만들어 달라”라고 요청하는 것만으로는 원하는 결과를 얻기 어렵다는 점을 배웠습니다. 팀 내 규칙, 현재 진행 상황, 내가 맡은 부분의 구현 방향과 범위를 최대한 구체적으로 설명해야 훨씬 더 정확한 결과를 얻을 수 있었습니다. 특히 보상 시스템과 보스 레이드를 구현하면서, 막연히 “있으면 좋겠다”라고 생각한 기능과 실제로 구현하기 위해 필요한 MVP 범위, 스키마 설계, 데이터 흐름 사이에는 큰 차이가 있다는 점을 알게 되었고, 이를 통해 기능을 더 구조적으로 생각하는 습관이 생겼습니다.

#### 3. 극복 / 협업 경험

협업 과정에서는 내가 작업한 내용을 다른 사람이 바로 이해할 수 있도록 정리하는 것이 매우 중요하다는 점을 많이 느꼈습니다. 실제로는 카카오톡으로 추가 설명을 하며 이해 여부를 확인했지만, 실제 협업에서는 이런 방식만으로는 한계가 있을 수 있다고 생각했습니다. 그래서 기능 단위로 커밋을 나누고, PR 본문도 단순 요약이 아니라 변경 이유와 검증 내용을 자세히 적으려고 노력했습니다. 이러한 과정을 통해 코드를 작성하는 것만큼이나, 다른 사람이 내 작업을 쉽게 따라올 수 있도록 기록하고 공유하는 방식도 협업의 중요한 부분이라는 것을 배웠습니다.

#### 4. 간단한 소감

이번 프로젝트를 통해 단순히 기능을 만드는 것만으로는 프로젝트가 완성되지 않는다는 점을 배울 수 있었습니다. 다른 사람의 작업과 자연스럽게 연결하고, 작업 내용을 기록하고, 검증하고, 공유하는 과정까지 모두 포함되어야 하나의 결과물이 완성된다는 것을 느꼈습니다. 앞으로는 코드를 구현하는 능력뿐 아니라, 협업 흐름 안에서 내 작업을 정리하고 조율하는 능력도 더 중요하게 생각하게 될 것 같습니다.

---

## 16. 결론

사각사각 Smart Edu Platform은 개인화 학습 관리 앱이라는 주제 아래 요구사항 분석, 설계, 구현, 테스트, 배포 자료 정리까지 단계적으로 진행한 프로젝트이다. 핵심 요구사항인 사용자 등록/로그인, 학습 일정 관리, 노트 및 AI 학습 보조, 데이터 시각화, 보안/프라이버시 고려를 중심으로 구현했고, 커뮤니티, 친구/쪽지, 포인트 상점, 협동 퀘스트, 보스 레이드, 접근성, 관리자 기능을 확장했다.

프로젝트의 성과는 기능 구현 자체뿐 아니라, GitHub Issue/branch/PR 기반 협업, 일반 Merge commit 방식의 이력 관리, 테스트 보고서와 API 명세, 설치/사용 가이드, 배포 smoke test, AI 활용 정책을 함께 정리했다는 점이다. 최신 기준 backend 테스트는 `29 suites / 548 tests` 통과 상태이며, backend coverage 수치와 배포/demo DB migration 적용 상태까지 문서화해 제출 가능한 구조를 갖췄다.

동시에 한계도 명확하다. 외부 AI API quota, frontend 정량 coverage 미측정, DOM clone 기반 돋보기의 한계, 실사용 운영 모니터링 부족은 향후 보강이 필요하다. 이 한계를 숨기지 않고 후속 확장 방향으로 연결하는 것이 최종 제출물의 신뢰도를 높인다.

최종적으로 본 프로젝트는 요구사항에서 배포까지 이어지는 소프트웨어공학 과정을 실제 GitHub 협업과 구현 검증으로 경험한 결과물이다. 사각사각은 학습자가 흩어진 학습 흐름을 하나의 기록으로 정리하고, AI와 커뮤니티, 보상, 접근성을 통해 지속 가능한 학습 경험을 제공하는 플랫폼으로 확장될 수 있다.

---

## 17. 부록

### 17.1 요구사항 문서

- [요구사항 문서](../requirements/requirements-document.md)
- [AI simulation log](../requirements/ai-simulation-log.md)
- [AI 사용자 인터뷰 시뮬레이션](../requirements/ai-user-interview-simulation.md)
- [AI 클라이언트 인터뷰 시뮬레이션](../requirements/ai-client-interview-simulation.md)
- [Use case diagram PlantUML](../requirements/usecase-diagram.puml)

### 17.2 설계 문서

- [설계 문서](../design/design-document.md)
- [아키텍처 개요](../design/architecture-overview.md)
- [구현 계획](../design/implementation-plan.md)
- [클래스 다이어그램](../design/class-diagram.md)
- [시퀀스 다이어그램](../design/sequence-diagram.md)
- [커뮤니티 게시판 재사용 계획](../design/community-board-reuse-plan.md)
- [PlantUML 원본 폴더](../design/plantuml/)

### 17.3 구현·API·테스트 문서

- [API 명세](../api/api-spec.md)
- [테스트 보고서](../test-report/test-report.md)
- [AI 활용 정책](../ai-agent-usage-policy.md)
- [개발 및 협업 작업 규칙](../development-workflow-rules.md)

### 17.4 배포와 발표 자료

- [설치 및 사용 가이드](../deployment/install-and-usage-guide.md)
- [배포 smoke test](../deployment/vercel-smoke-test.md)
- [데모 영상 시나리오](./demo-video-scenario.md)
- [발표자료 구성안](./presentation-outline.md)

### 17.5 회의록

- [문서 부록 인덱스의 회의록 목록](../README.md#7-회의록-부록)
- [2026-06-01 회의록](../meeting-minutes/meeting-2026-06-01.md)

### 17.6 GitHub 산출물

- [GitHub Repository](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform)
- [Commit history](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/commits/main)
- [Pull Request history](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/pulls?q=is%3Apr)
- [Issue #389 보스 레이드 참여자별 숨김 및 중도 탈퇴 정책 설계](https://github.com/jeongiryang/SoftwareEngineering_team15_project_-Smart-Edu-Platform/issues/389)

### 17.7 문서 인덱스

- [docs/README.md](../README.md)
