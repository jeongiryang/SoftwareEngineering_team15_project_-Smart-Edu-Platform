# AI 시뮬레이션 로그

## 목차

1. [문서 목적](#1-문서-목적)
2. [AI 활용 범위](#2-ai-활용-범위)
3. [요구사항 도출 과정에서의 AI 활용](#3-요구사항-도출-과정에서의-ai-활용)
4. [유스케이스 다이어그램 개선 과정](#4-유스케이스-다이어그램-개선-과정)
5. [설계 문서 작성 과정에서의 AI 활용](#5-설계-문서-작성-과정에서의-ai-활용)
6. [API 및 ERD 초안 작성 과정에서의 AI 활용](#6-api-및-erd-초안-작성-과정에서의-ai-활용)
7. [조원 검토 및 수정 반영](#7-조원-검토-및-수정-반영)
8. [AI 활용 시 주의한 점](#8-ai-활용-시-주의한-점)
9. [관련 문서](#9-관련-문서)

---

## 1. 문서 목적

- 본 문서는 Smart Edu Platform 프로젝트에서 AI 도구를 활용한 과정을 정리한 부록 문서임.
- AI 도구는 요구사항 도출, 페르소나 정리, 유스케이스 다이어그램 개선, UML 다이어그램 생성, 아키텍처/DB/API 설계 검토에 활용함.
- 본 문서는 AI 활용 결과를 그대로 제출하는 것이 아니라, 조원 검토와 수정 과정을 거쳐 산출물에 반영한 내용을 요약함.

---

## 2. AI 활용 범위

| 활용 영역 | 활용 내용 | 관련 산출물 |
|---|---|---|
| 사용자 그룹 및 페르소나 도출 | 다양한 연령대와 학습 목적을 가진 사용자 그룹을 설정하고 대표 페르소나를 정리함 | `requirements-document.md`, `ai-interview-simulation.md` |
| AI 기반 가상 인터뷰/설문 시뮬레이션 | 사용자 그룹별 가상 응답을 바탕으로 학습 상황, 불편사항, 요구 기능을 정리함 | `ai-interview-simulation.md` |
| 사용자 요구사항, 기능 요구사항, 비기능 요구사항 정리 | 인터뷰 결과와 조원 회의를 바탕으로 UR, FR, NFR 항목을 분류함 | `requirements-document.md` |
| 유스케이스 다이어그램 초안 생성 및 수정 | PlantUML 기반 유스케이스 다이어그램 초안을 만들고 액터, 관계, 표현 방식을 수정함 | `requirements-document.md`, `usecase-diagram.puml` |
| 아키텍처 개요 검토 | 클라이언트-서버 구조, 외부 시스템 연동, DBMS 후보를 검토함 | `architecture-overview.md`, `design-document.md` |
| 클래스 다이어그램 PlantUML 초안 생성 및 수정 | 요구사항의 FR과 주요 도메인 객체를 기준으로 클래스 다이어그램 초안을 정리함 | `class-diagram.md`, `class-diagram.puml` |
| 시퀀스 다이어그램 PlantUML 초안 생성 및 수정 | 주요 UC 흐름을 기준으로 시퀀스 다이어그램 초안을 정리함 | `sequence-diagram.md`, `sequence-diagrams.puml` |
| API 목록 및 ERD 초안 작성 | 2단계 구현 전 REST API, DB 테이블, ERD 관계, Prisma schema 방향을 정리함 | `implementation-plan.md` |
| 2단계 초기 프로젝트 세팅 검토 | 프론트엔드, 백엔드, 테스트, Prisma 검증 구조를 점검함 | `README.md`, `src/frontend/`, `src/backend/` |

---

## 3. 요구사항 도출 과정에서의 AI 활용

다양한 사용자 그룹을 설정하고, AI 기반 가상 인터뷰/설문을 수행함.

초등학생, 중학생, 고등학생, 대학생/취준생, 공시생/고시생, 직장인, 시니어 학습자를 대상으로 페르소나를 구성함. 각 그룹의 학습 목적, 불편사항, 기대 기능을 정리하고 이를 사용자 요구사항과 기능 요구사항으로 확장함.

AI 응답은 요구사항 도출을 위한 초안 자료로 사용하였으며, 최종 요구사항은 조원 회의와 검토를 거쳐 정리함.

---

## 4. 유스케이스 다이어그램 개선 과정

AI를 활용해 유스케이스 다이어그램 PlantUML 초안을 작성함.

조원 피드백을 통해 다이어그램 안의 UC 번호 제거, 주액터/부액터 위치 조정, AI 시스템/외부 캘린더 시스템의 component 표현, 액터별 연결선 색상 구분 등을 수정함.

include 관계는 사용하지 않고, 필요한 extend 관계만 남기는 방향으로 정리함. 최종 원본은 `docs/requirements/usecase-diagram.puml`에 보관함.

---

## 5. 설계 문서 작성 과정에서의 AI 활용

AI를 활용해 아키텍처 개요, 클래스 다이어그램, 시퀀스 다이어그램 초안을 정리함.

PlantUML 코드는 조원 검토 후 수정하고 PNG로 렌더링함. 최종 설계 문서는 `docs/design/design-document.md`로 통합함.

클래스 다이어그램과 시퀀스 다이어그램 원본은 `docs/design/plantuml/`에 보관하며, 렌더링된 이미지는 `screenshots/`에 보관함.

---

## 6. API 및 ERD 초안 작성 과정에서의 AI 활용

2단계 구현 전 API 목록과 DB 테이블 후보를 AI로 정리함.

PostgreSQL + Prisma 기준으로 DB 스키마 초안을 검토함. ERD 관계는 Mermaid ERD 코드와 표로 정리함.

해당 내용은 `docs/design/implementation-plan.md`에 정리함.

---

## 7. 조원 검토 및 수정 반영

AI가 제안한 내용을 그대로 사용하지 않고 조원 피드백을 반영함.

주요 수정 예시는 다음과 같음.

- 유스케이스 다이어그램에서 UC 번호 제거
- AI 시스템/외부 캘린더 시스템을 component로 표현
- 집중 시간 측정 API를 start/stop 분리 방식에서 최종 기록 저장 방식으로 수정
- 집중 시간 저장 단위를 `durationMs` 기준으로 정리
- PostgreSQL 단일 DB 사용 방향 확정

최종 산출물은 조원 검토와 PR 리뷰를 거쳐 main에 병합함.

---

## 8. AI 활용 시 주의한 점

- AI 응답은 초안과 검토 보조 자료로 사용함.
- 과제 요구사항과 조원 회의 내용을 기준으로 최종 판단함.
- 잘못된 관계, 과도한 기능 범위, 구현 난이도가 높은 항목은 조정함.
- 문서와 다이어그램은 제출 전 직접 검토함.

---

## 9. 관련 문서

- [요구사항 문서](./requirements-document.md)
- [AI 인터뷰 시뮬레이션 문서](./ai-interview-simulation.md)
- [유스케이스 다이어그램 PlantUML](./usecase-diagram.puml)
- [통합 설계 문서](../design/design-document.md)
- [2단계 구현 계획 문서](../design/implementation-plan.md)
