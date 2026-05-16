# Smart Edu Platform 클래스 다이어그램

---

## 1. 문서 개요

본 문서는 Smart Edu Platform의 주요 도메인 객체와 객체 간 관계를 UML 클래스 다이어그램으로 정의한 설계 문서이다.

요구사항 문서의 기능 요구사항 `FR-01`부터 `FR-29`까지를 기준으로, 실제 구현 시 핵심이 되는 사용자, 학습 일정, 태스크, 노트, AI 학습 지원, 커뮤니티, 학습 통계, 보상, 접근성, 관리자 기능을 중심으로 클래스를 구성하였다.

다이어그램 작성 도구는 **PlantUML**을 기준으로 한다.

- 다이어그램 구현 코드: [plantuml/class-diagram.puml](plantuml/class-diagram.puml)
- 렌더링 이미지: [../../screenshots/class-diagram.png](../../screenshots/class-diagram.png)

본 다이어그램은 AI 도구를 활용하여 PlantUML 코드 초안을 생성한 뒤, 조원 검토를 거쳐 수정하고 PNG 이미지로 렌더링하였다. PlantUML 원본은 `docs/design/plantuml/`에 보관하며, 렌더링된 이미지는 `screenshots/`에 보관한다.

---

## 2. 설계 범위

본 클래스 다이어그램은 다음 기능 영역을 포함한다.

| 기능 영역 | 관련 요구사항 |
|---|---|
| 사용자 인증 및 프로필 | `FR-01`, `FR-02`, `FR-28` |
| 학습 일정 및 태스크 관리 | `FR-03`, `FR-04`, `FR-05`, `FR-22` |
| 학습 노트 및 AI 학습 지원 | `FR-06`, `FR-07`, `FR-08`, `FR-09`, `FR-10` |
| 커뮤니티 및 소셜 학습 | `FR-11`, `FR-12`, `FR-13`, `FR-27`, `FR-29` |
| 집중 및 시간 관리 | `FR-14`, `FR-15`, `FR-16`, `FR-17` |
| 음성 학습 및 접근성 | `FR-18`, `FR-19`, `FR-20`, `FR-21`, `FR-26` |
| 보상 및 사용자 유형별 UI | `FR-23`, `FR-24`, `FR-25` |

---

## 3. 클래스 다이어그램

![Smart Edu Platform Class Diagram](../../screenshots/class-diagram.png)

다이어그램 구현 코드는 [plantuml/class-diagram.puml](plantuml/class-diagram.puml)에 보관한다.

---

## 4. 주요 클래스 설명

| 클래스 | 설명 | 관련 요구사항 |
|---|---|---|
| `User` | 회원가입, 로그인, 계정 상태 및 제재 여부를 관리하는 사용자 핵심 클래스 | `FR-01`, `FR-02`, `FR-28` |
| `UserProfile` | 학습 목표, 프로필 이미지, 선호 과목 등 사용자 부가 정보를 관리 | `FR-02`, `FR-23` |
| `StudySchedule` | 캘린더 기반 학습 일정을 표현 | `FR-03`, `FR-22` |
| `StudyTask` | 칸반 보드의 할 일, 진행 중, 완료 상태를 표현 | `FR-04` |
| `Notification` | 마감일, 복습, 챌린지 등 알림을 표현 | `FR-05`, `FR-26` |
| `StudyNote` | 학습 노트 작성, 수정, 요약의 기준 객체 | `FR-06`, `FR-19` |
| `Quiz`, `QuizQuestion` | AI 또는 노트 기반으로 생성되는 복습 퀴즈와 문제 | `FR-10` |
| `WrongAnswerNote` | 오답 문제, 사용자 답변, 해설, 취약 유형을 관리 | `FR-08` |
| `AIService` | AI 질의, 오답노트 생성, 추천, 퀴즈 생성, 요약을 담당하는 서비스 | `FR-07`, `FR-08`, `FR-09`, `FR-10`, `FR-19` |
| `FocusSession` | 스톱워치와 타이머를 통해 기록되는 순공 시간 | `FR-15` |
| `AppBlockRule` | 공부 시간 동안 차단할 앱과 예외 조건을 관리 | `FR-14` |
| `StudyStatistics`, `Heatmap` | 학습 시간, 진척도, 히트맵 데이터를 계산하고 표현 | `FR-16`, `FR-17` |
| `StudyGroup`, `StudyChallenge`, `Ranking` | 그룹 학습, 챌린지, 주간 랭킹을 관리 | `FR-11`, `FR-12`, `FR-29` |
| `BoardPost`, `Comment`, `Admin` | 게시판과 전반적인 운영 관리(사용자, 챌린지 제재 등) 기능을 표현 | `FR-13`, `FR-27`, `FR-28`, `FR-29` |
| `AccessibilitySetting` | 큰 글씨, 고대비, 글자 크기 설정을 관리 | `FR-20` |
| `RewardAccount`, `Badge`, `UserBadge` | 포인트, 뱃지, 보상 기능을 표현 | `FR-24` |

---

## 5. 설계 의도

- 사용자 기능은 `User`를 중심으로 구성하고, 프로필, 접근성 설정, 보상 계정은 1:1 관계로 분리하였다.
- 학습 일정과 태스크는 서로 독립적으로 사용할 수 있지만, 필요하면 일정에 태스크를 연결할 수 있도록 설계하였다.
- AI 관련 기능은 `AIService`에 집중시키고, 생성 결과는 `AIQuestion`, `WrongAnswerNote`, `AIRecommendation`, `Quiz`, `Summary` 같은 도메인 객체로 저장되도록 설계하였다.
- 커뮤니티 기능은 게시글과 댓글을 분리하고, 관리자 기능은 신고된 게시글과 댓글을 관리하는 방식으로 표현하였다.
- 학습 시간 기록과 통계는 `FocusSession`을 원천 데이터로 사용하고, `StudyStatistics`와 `Heatmap`이 분석 결과를 제공하는 구조로 설계하였다.
- 확장성을 고려하여 사용자 유형, 태스크 상태, 게시판 카테고리, 알림 유형 등은 열거형으로 분리하였다.
