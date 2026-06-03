# Smart Edu Platform

## 중요: AI 에이전트 사용 안전 규칙

Codex, Claude, Gemini, Cursor, GitHub Copilot 등 AI 코드 에이전트를 사용할 때는 먼저 [AI 에이전트 사용 및 원격 작업 안전 규칙](./docs/ai-agent-usage-policy.md)을 확인해야 함.

특히 `main` 직접 push, force push, reset/rebase, 원격 브랜치 삭제, `.env` 업로드 같은 위험 작업은 금지함.

---

## **소프트웨어공학 15조 GitHub 협업 규칙**

1. **핵심 원칙: `main` 브랜치는 제출 가능한 안정본으로 유지.**

2. **작업 시작 전 반드시 원격 저장소 상태를 먼저 최신화.**

3. **모든 작업은 원격 상태 확인 → 브랜치 생성 → commit → push → Pull Request → merge 흐름으로 진행.**

> **▼ 작업 시작 전 터미널 권장 명령어!**
>
> ```bash
> git fetch --all --prune
> git checkout main
> git pull --ff-only origin main
> ```
>
> _원격 저장소에 조원이 올린 새 브랜치나 삭제된 브랜치가 있을 수 있으므로, 작업 전 최신 상태 확인 필수. `--ff-only`는 불필요한 merge commit 생성을 막기 위한 안전 기준임._

---

### 목차

1. [기본 협업 원칙](#1-기본-협업-원칙)
2. [브랜치 규칙](#2-브랜치-규칙)
3. [커밋 메시지 규칙](#3-커밋-메시지-규칙)
4. [Pull Request 규칙](#4-pull-request-규칙)
5. [문서 및 폴더 관리 규칙](#5-문서-및-폴더-관리-규칙)
6. [screenshots 폴더 관리 규칙](#6-screenshots-폴더-관리-규칙)
7. [코드 작성 원칙](#7-코드-작성-원칙)
8. [Notion, HackMD, GitHub 사용 기준](#8-notion-hackmd-github-사용-기준)
9. [협업 원칙 요약](#9-협업-원칙-요약)
10. [**중요: 안정 버전 백업 및 태그 관리**](#10-중요-안정-버전-백업-및-태그-관리)
11. [**필독: 로컬 개발 환경 세팅 방법**](#11-필독-로컬-개발-환경-세팅-방법)

---

## 1. 기본 협업 원칙

### 1.1 작업 전 원격 저장소 최신화

작업을 시작하기 전에는 항상 원격 저장소 상태를 먼저 확인.

권장 흐름:

```bash
git fetch --all --prune
git checkout main
git pull --ff-only origin main
```

| 명령어 | 의미 |
|---|---|
| `git fetch --all --prune` | 원격 브랜치 정보를 최신화하고, 삭제된 원격 브랜치 정보를 로컬에서도 정리 |
| `git checkout main` | 기준 브랜치인 `main`으로 이동 |
| `git pull --ff-only origin main` | 원격 `main`의 최신 내용을 fast-forward 방식으로만 반영 |

> 원격 저장소에 조원이 올린 새 작업이 있을 수 있으므로, 최신 상태를 받아온 뒤 새 브랜치 생성. `--ff-only`는 불필요한 merge commit 생성을 막기 위한 안전 기준임.

---

### 1.2 main 브랜치 직접 작업 금지

`main` 브랜치는 **제출 가능한 안정본**으로 유지.

문서 작성, 회의록 추가, 코드 구현, 오류 수정은 별도 작업 브랜치에서 진행.  
작업 완료 후 **Pull Request**로 `main`에 병합.

> `main`에서 바로 작업하지 않기.

| 좋은 흐름 | 나쁜 흐름 | 판단 기준 |
|---|---|---|
| 1. 작업 브랜치 생성<br>2. 파일 수정<br>3. commit<br>4. push<br>5. Pull Request 생성<br>6. 조원 확인<br>7. main에 merge | 1. main에서 README 바로 수정<br>2. main에서 회의록 바로 commit<br>3. main에 기능 코드 바로 push | 작업 이력과 검토 과정 확보 |
| `docs/requirements-document` 브랜치에서 요구사항 문서 작업 후 PR 생성 | `main`에서 요구사항 문서 작성하다가 중간 저장 | main 브랜치 안정성 유지 |

---

### 1.3 한 작업은 한 브랜치에서 진행

하나의 브랜치에는 **하나의 목적만 포함**.

| 좋은 예시 | 나쁜 예시 | 판단 기준 |
|---|---|---|
| `docs/meeting-minutes-2026-05-11` | `docs/meeting` | 날짜와 작업 목적 명확 |
| `docs/requirements-document` | `docs/final-report-and-requirements` | 요구사항 문서 작업만 포함 |
| `feature/login` | `feature/login-calendar-community` | 하나의 기능 단위로 작업 |
| `fix/readme-typo` | `fix/readme-and-folder-and-login` | 수정 범위가 작고 명확 |

---

## 2. 브랜치 규칙

### 2.1 브랜치 이름 형식

```text
<작업유형>/<작업내용>
```

예시:

```text
docs/requirements-document
feature/login
fix/readme-typo
chore/folder-structure
```

---

### 2.2 브랜치 타입

| 타입 | 의미 |
|---|---|
| `docs` | 문서 작성 및 수정 |
| `feature` | 새로운 기능 구현 |
| `fix` | 오류 수정 |
| `refactor` | 기능 변화 없이 코드 구조 개선 |
| `test` | 테스트 코드 또는 테스트 문서 작성 |
| `design` | UI, 화면 구성, 다이어그램 작업 |
| `chore` | 폴더 정리, 설정 파일 수정, 기타 작업 |

> 브랜치 타입은 작업 성격을 빠르게 파악하도록 작성.

---

### 2.3 브랜치 이름 예시

| 좋은 브랜치 이름 | 나쁜 브랜치 이름 | 판단 기준 |
|---|---|---|
| `docs/meeting-minutes-2026-05-11` | `meeting-minutes` | 문서 작업 + 날짜 정보 포함 |
| `docs/user-survey-interview` | `docs/survey` | 사용자 설문/인터뷰 문서로 구체화 |
| `docs/persona` | `docs/user` | 페르소나 문서 작업임을 명확히 표시 |
| `docs/functional-requirements` | `docs/requirements` | 요구사항 중 기능 요구사항으로 구분 |
| `docs/design-document` | `docs/design` | 설계 문서 작업으로 구체화 |
| `feature/schedule-management` | `feature/schedule` | 일정 관리 기능 구현으로 구체화 |
| `feature/community` | `feature/page` | 커뮤니티 기능 작업임을 표시 |
| `feature/ai-note` | `feature/ai` | AI 기능 중 AI 노트 기능으로 구체화 |
| `fix/readme-typo` | `fix/readme` | README 오타 수정으로 범위 명확 |
| `chore/folder-structure` | `chore/setting` | 폴더 구조 정리 작업으로 구체화 |

---

## 3. 커밋 메시지 규칙

### 3.1 커밋 메시지 형식

```text
[<타입>] <작업 내용 요약>
```

본문 설명이 필요할 때만 작업내용 추가.

**_예시:_**

```text
[docs] 요구사항 문서 초안 작성

- 사용자 설문 및 인터뷰 결과 추가
- 페르소나 7개 그룹 정리
- 기능적 요구사항과 비기능적 요구사항 초안 작성
```

---

### 3.2 커밋 타입

| 타입 | 의미 |
|---|---|
| `[feat]` | 새로운 기능 추가 |
| `[fix]` | 오류 수정 |
| `[docs]` | 문서 작성 및 수정 |
| `[style]` | 코드 의미 변화 없는 포맷 수정 |
| `[refactor]` | 기능 변화 없이 코드 구조 개선 |
| `[test]` | 테스트 코드 또는 테스트 문서 추가 |
| `[chore]` | 폴더 정리, 설정 파일 수정, 기타 작업 |
| `[design]` | UI 디자인, 화면 구성, 다이어그램 수정 |

> 파일명 변경, 파일 삭제, 폴더 정리처럼 애매한 작업은 보통 `[chore]` 사용.  
> UI 화면 구성이나 다이어그램 이미지는 `[design]` 사용.

---

### 3.3 커밋 작성 규칙

- **한 커밋에는 하나의 작업만 포함**
- 제목은 50자 이내 권장
- 제목 끝 마침표 생략
- 작업 내용이 명확하게 보이도록 작성
- `수정`, `업데이트`, `최종`처럼 의미 불명확한 표현 금지

---

### 3.4 커밋 메시지 예시

| 좋은 커밋 메시지 | 나쁜 커밋 메시지 | 판단 기준 |
|---|---|---|
| `[docs] 5월 11일 회의록 추가` | `[docs] 회의록 수정` | 날짜와 작업 내용 구체화 |
| `[docs] 요구사항 문서 초안 작성` | `[docs] 요구사항 정리` | 초안 작성, 수정, 최종 정리 구분 |
| `[docs] 사용자 설문 인터뷰 결과 정리` | `[docs] 설문조사 넣음` | 공식 문서에 맞는 표현 사용 |
| `[docs] 페르소나 문서 추가` | `[docs] 사람 설정 추가` | 과제 문서 용어 사용 |
| `[docs] 기능 및 비기능 요구사항 목록 추가` | `[docs] 요구사항 최종` | 추가한 요구사항 범위 명확 |
| `[design] 유스케이스 다이어그램 이미지 추가` | `[design] 그림 추가` | 추가한 다이어그램 종류 명시 |
| `[chore] docs 폴더 구조 생성` | `[chore] 폴더 만듦` | 생성한 폴더 구조 명시 |
| `[feat] 로그인 화면 구현` | `[feat] 로그인 작업` | 구현 완료 상태 표현 |
| `[fix] README 문서 링크 오류 수정` | `[fix] README 수정` | 수정 대상과 오류 내용 명확 |

---

### 3.5 커밋 단위 예시

| 좋은 예시 | 나쁜 예시 | 판단 기준 |
|---|---|---|
| `[docs] 회의록 추가`<br>`[docs] 요구사항 문서 초안 작성`<br>`[fix] README 오타 수정` | `[docs] 회의록이랑 요구사항이랑 README 수정` | 서로 다른 작업 분리 |
| `[feat] 로그인 화면 구현`<br>`[fix] 로그인 버튼 정렬 오류 수정` | `[feat] 로그인 화면 구현하고 버튼 오류도 수정` | 기능 구현과 오류 수정 분리 |

---

## 4. Pull Request 규칙

### 4.1 Pull Request 생성 기준

작업 브랜치에서 작업 완료 후 바로 `main`에 병합 금지.  
Pull Request 생성 후 조원 확인.

> PR은 코드나 문서를 합치기 전에 조원이 검토하는 단계.

---

### 4.2 Pull Request 제목 형식

```text
[타입] 작업 내용 요약
```

---

### 4.3 Pull Request 제목 예시

| 좋은 PR 제목 | 나쁜 PR 제목 | 판단 기준 |
|---|---|---|
| `[docs] 5월 11일 회의록 추가` | `[docs] 회의록` | 날짜와 회의록 작업 명시 |
| `[docs] 요구사항 문서 초안 작성` | `[docs] 문서 정리` | 요구사항 문서 작업으로 구체화 |
| `[docs] 사용자 설문 및 인터뷰 결과 정리` | `[docs] 설문 넣음` | 사용자 조사 결과 작업 명시 |
| `[design] 유스케이스 다이어그램 추가` | `[design] 이미지 추가` | 다이어그램 종류 명시 |
| `[feature] 로그인 화면 구현` | `[feature] 화면 작업` | 구현한 기능 화면 명시 |
| `[fix] README 폴더 구조 설명 수정` | `[fix] README 수정` | README 수정 범위 구체화 |
| `[chore] 프로젝트 폴더 구조 정리` | `[chore] 정리` | 관리 작업 내용 명시 |

---

### 4.4 Pull Request 본문 형식

PR 본문은 아래 3가지만 간단히 작성.

```markdown
## 작업 내용

- 작업한 내용

## 변경 파일

- 변경된 파일 경로

## 확인할 점

- 조원이 확인해야 할 부분
```

---

### 4.5 Pull Request 본문 예시

#### 예시 1. 회의록 추가

```markdown
## 작업 내용

- 2026년 5월 11일 회의록 정리
- 기능적 요구사항과 비기능적 요구사항 후보 정리

## 변경 파일

- docs/meeting-minutes/meeting-minutes-2026-05-11.md

## 확인할 점

- 회의 시간과 회의 내용이 맞는지 확인 필요
- 기능 요구사항 표현이 프로젝트 방향과 맞는지 확인 필요
```

#### 예시 2. 요구사항 문서 작성

```markdown
## 작업 내용

- 요구사항 문서 초안 작성
- 사용자 설문/인터뷰 결과 정리
- 페르소나와 AI 시뮬레이션 로그 삽입 공간 구성

## 변경 파일

- docs/requirements/requirements-document.md

## 확인할 점

- 요구사항 문서 흐름이 과제 안내와 맞는지 확인 필요
- 유스케이스 다이어그램 삽입 위치 확인 필요
```

#### 예시 3. README 수정

```markdown
## 작업 내용

- README 협업 가이드 수정
- 브랜치, 커밋, PR 규칙 정리
- 폴더 구조 설명 단순화

## 변경 파일

- README.md

## 확인할 점

- 조원들이 이해하기 쉬운 표현인지 확인 필요
- 실제 협업 방식과 맞지 않는 규칙이 있는지 확인 필요
```

#### 예시 4. 기능 구현

```markdown
## 작업 내용

- 로그인 화면 기본 UI 구현
- 아이디, 비밀번호 입력 폼 추가
- 로그인 버튼 추가

## 변경 파일

- src/frontend/login-page.js
- src/frontend/styles/login-page.css

## 확인할 점

- 로그인 화면 구성이 요구사항과 맞는지 확인 필요
- 버튼과 입력창이 정상적으로 표시되는지 확인 필요
```

---

### 4.6 Merge 규칙

- Pull Request는 최소 1명의 조원이 확인한 뒤 merge
- 마감 직전 긴급 수정은 조원에게 공유 후 조장이 merge 가능
- 기본 merge 방식은 **Merge commit**
- **Squash merge 사용 X**
- **Rebase merge 사용 X**

> `Squash merge`를 쓰면 PR 안의 여러 커밋이 하나로 합쳐져서 세부 작업 이력이 줄어듦.  
> 조별과제에서는 개인별 작업 과정과 기여도 확인이 중요하므로 `Merge commit` 사용.

**Merge commit 사용 이유**

- 브랜치 단위 작업 이력 보존
- 개인별 작업 내용 확인 쉬움
- 조별과제 기여도 확인에 유리
- 문서, 설계, 구현 과정 추적 가능

---

## 5. 문서 및 폴더 관리 규칙

최종 제출 산출물과 부록 연결 구조는 [docs 문서 부록 인덱스](./docs/README.md)를 기준으로 확인한다.

### 5.1 폴더 구조

```text
SoftwareEngineering_team15_project_-Smart-Edu-Platform/
├── README.md                         # 프로젝트 협업 가이드
├── .gitignore                        # Git 추적 제외 파일 설정
├── docs/                             # 문서 관리 폴더
│   ├── meeting-minutes/              # 회의록
│   ├── requirements/                 # 요구사항 문서
│   ├── design/                       # 설계 문서
│   ├── test-report/                  # 테스트 보고서 문서
│   └── final-report/                 # 최종 보고서
├── screenshots/                      # 이미지, 캡처, 다이어그램 관리 폴더
└── src/                              # 실제 구현 코드
    ├── frontend/                     # 프론트엔드 코드
    └── backend/                      # 백엔드 코드
```

> 문서는 `docs/`에서 관리.  
> 이미지, 캡처, 다이어그램은 `screenshots/`에서 관리.  
> 실제 구현 코드는 `src/frontend/`, `src/backend/`에서 관리.

---

### 5.2 문서 파일명 규칙

파일명은 **영어 소문자와 하이픈 사용**.

| 좋은 파일명 | 나쁜 파일명 | 판단 기준 |
|---|---|---|
| `meeting-minutes-2026-05-11.md` | `meeting.md` | 날짜와 문서 종류 표시 |
| `requirements-document.md` | `requirements_final.md` | 공식 문서명 사용 |
| `user-survey-interview.md` | `survey_result.md` | 설문과 인터뷰 포함 내용 표시 |
| `persona.md` | `user-setting.md` | 과제 용어인 페르소나 사용 |
| `ai-simulation-log.md` | `ai-result.md` | AI 시뮬레이션 로그 문서 표시 |
| `functional-nonfunctional-requirements.md` | `requirements-v2.md` | 기능/비기능 요구사항 구체화 |
| `design-document.md` | `design-final.md` | 설계 문서 표시 |
| `test-report.md` | `test-result.md` | 테스트 보고서 표시 |
| `final-report.md` | `final-real.md` | 공식 최종 보고서 파일명 사용 |

---

### 5.3 큰 문서는 작업용 파일과 최종 통합 파일 분리

요구사항 문서처럼 내용이 큰 문서는 처음부터 한 파일에 여러 명이 동시에 작성하지 않음.  
작업용 파일을 나누어 작성한 뒤 최종 통합 파일에 합치기.

| 작업용 파일 | 최종 통합 파일 | 판단 기준 |
|---|---|---|
| `docs/requirements/user-survey-interview.md`<br>`docs/requirements/persona.md`<br>`docs/requirements/ai-simulation-log.md`<br>`docs/requirements/functional-nonfunctional-requirements.md` | `docs/requirements/requirements-document.md` | 충돌 방지를 위한 작업 파일 분리와 최종본 통합 |

---

### 5.4 같은 파일 동시 수정 금지

여러 명이 같은 파일을 동시에 수정하면 Git 충돌 가능.  
작업 전 담당 파일 먼저 결정.

| 담당자 | 작업 파일 | 담당 내용 |
|---|---|---|
| 정이량 | `docs/requirements/user-survey-interview.md` | 사용자 설문 및 인터뷰 결과 정리 |
| 황대겸 | `docs/requirements/persona.md` | 페르소나 문서 정리 |
| 박지환 | `docs/requirements/functional-nonfunctional-requirements.md` | 기능적/비기능적 요구사항 목록 정리 |

---

## 6. screenshots 폴더 관리 규칙

### 6.1 screenshots 폴더 사용 기준

`screenshots/` 폴더에는 프로젝트에 필요한 이미지 자료를 저장.

저장 대상은 다음과 같음.

- 앱 실행 화면 캡처
- 발표 자료용 캡처
- 오류 화면 캡처
- 유스케이스 다이어그램
- UML 다이어그램
- ERD
- 테스트 결과 캡처
- 보고서에 삽입할 이미지

> 현재는 `screenshots/` 하위 폴더를 미리 나누지 않음.  
> 이미지가 많아지면 필요할 때 용도별 하위 폴더를 추가.

---

### 6.2 스크린샷 파일명 규칙

스크린샷 파일명은 **무슨 자료인지 바로 알 수 있게 작성**.

| 좋은 파일명 | 나쁜 파일명 | 판단 기준 |
|---|---|---|
| `login-page.png` | `screenshot1.png` | 화면 이름 표시 |
| `main-dashboard.png` | `capture.png` | 구체적인 화면명 사용 |
| `usecase-diagram.png` | `diagram.png` | 다이어그램 종류 표시 |
| `class-diagram.png` | `uml.png` | UML 중 어떤 다이어그램인지 표시 |
| `erd.png` | `db.png` | ERD 자료임을 명확히 표시 |
| `demo-schedule-management.png` | `presentation.png` | 발표용 화면과 기능 이름 표시 |
| `login-error-message.png` | `error.png` | 오류 화면 종류 구체화 |

---

## 7. 코드 작성 원칙

- 기능별로 파일 분리
- 불필요한 파일, 임시 파일, 테스트용 파일 커밋 금지
- 기능 구현 후 실행 화면 또는 동작 결과 확인
- 기능 구현과 단순 코드 정리는 가능하면 커밋 분리

---

## 8. Notion, HackMD, GitHub 사용 기준

| 도구 | 역할 | 이유 |
|---|---|---|
| **Notion** | 일정 관리, 할 일 분담, 회의 전후 메모 정리 | 팀 전체 진행 상황을 한눈에 관리하기 쉬움 |
| **HackMD** | 요구사항 문서, 설계 문서 등 공동 문서 초안 작성 | 여러 명이 동시에 긴 문서를 편집하기 쉬움 |
| **GitHub** | 최종 문서, 코드, 회의록, 캡처 관리 | 최종 결과물과 작업 이력을 공식적으로 관리 가능 |

작업 흐름:

```text
Notion에서 일정 및 역할 정리
→ HackMD에서 문서 초안 작성
→ 내용 정리
→ GitHub docs 폴더에 저장
→ 작업 브랜치 생성
→ commit
→ push
→ Pull Request
→ main에 merge
```

---

## 9. 협업 원칙 요약

1. 작업 시작 전 `git fetch --all --prune`, `git pull --ff-only origin main`으로 원격 저장소 최신화
2. `main` 브랜치에서 직접 작업 금지
3. 모든 작업은 작업 브랜치에서 진행
4. 브랜치 이름은 `<작업유형>/<작업내용>` 형식
5. 커밋 메시지는 `[타입] 작업 내용` 형식
6. Pull Request를 통해 `main` 브랜치에 병합
7. 최소 1명의 조원이 확인한 뒤 merge
8. 기본 merge 방식은 `Merge commit`
9. `Squash merge`, `Rebase merge` 사용 금지
10. 문서는 `docs/` 폴더에서 관리
11. 코드는 `src/frontend/`, `src/backend/` 폴더에서 관리
12. 이미지, 캡처, 다이어그램은 `screenshots/` 폴더에서 관리
13. 같은 파일을 여러 명이 동시에 수정 금지
14. 큰 문서는 작업용 파일과 최종 통합 파일 분리
15. Notion은 일정 관리용, HackMD는 초안 작성용, GitHub는 최종 정리본 관리용

---

## 10. 중요: 안정 버전 백업 및 태그 관리

이 섹션은 원격 저장소 사고가 발생했을 때 복구 기준을 남기기 위한 중요 절차임.

1단계 제출본이 최종 확정되고, 2단계 구현을 본격적으로 시작하기 전에 실행함. 로컬 bundle 백업과 원격 tag 백업은 목적이 다르므로 둘 다 사용하는 것을 권장함.

아래 명령어는 지금 즉시 실행하는 것이 아니라, 제출 전 최종 확인 후 실행하는 절차임.

### 10.1 로컬 bundle 백업

`git bundle`은 Git 저장소 기록을 하나의 파일로 저장하는 백업 방식임.

GitHub 원격이 꼬이거나 `main`이 잘못 변경되어도 로컬 bundle 파일로 복구 가능함. bundle 파일은 레포 안이 아니라 레포 바깥 폴더에 저장해야 하며, Git에 올리지 않음.

`git bundle`은 Git 저장소의 커밋 기록과 참조 정보를 하나의 파일로 저장함. `--all` 옵션은 로컬 저장소가 알고 있는 브랜치와 태그 참조를 포함함.

| 구분 | 포함 여부 | 설명 |
|---|---|---|
| Git 커밋 기록 | 포함 | main과 작업 브랜치의 커밋 기록을 복구할 수 있음 |
| Git 브랜치/태그 참조 | 포함 | `--all` 기준으로 로컬이 알고 있는 참조를 포함함 |
| Git이 추적하는 파일 | 포함 | 커밋에 포함된 코드와 문서 파일을 복구할 수 있음 |
| `.env` | 미포함 | Git 추적 제외 파일이므로 bundle에 포함되지 않음 |
| `node_modules`, `dist`, `.expo`, `coverage` | 미포함 | 로컬 생성 산출물이며 Git 추적 제외 대상임 |
| Issue, PR, 댓글, 라벨 | 미포함 | GitHub 메타데이터라 bundle에 포함되지 않음 |

bundle은 코드/문서 Git 히스토리 복구용임. Issue/PR 기록은 GitHub에 남는 별도 관리 대상임.

```bash
git checkout main
git pull --ff-only origin main
git status

mkdir -p ../repo-backups
git bundle create ../repo-backups/smart-edu-platform-stable-phase1-2026-05-18.bundle --all
git bundle verify ../repo-backups/smart-edu-platform-stable-phase1-2026-05-18.bundle
```

정상 기준:

- `git status`에서 작업 트리가 clean이어야 함
- `git bundle verify`가 성공해야 함
- 생성된 `.bundle` 파일은 레포 밖 `../repo-backups/`에 있어야 함

복구 확인 예시:

```bash
git clone ../repo-backups/smart-edu-platform-stable-phase1-2026-05-18.bundle smart-edu-platform-restore-test
```

### 10.2 원격 tag 백업

tag는 특정 커밋에 붙이는 이름표임.

원격 tag는 GitHub에 “이 커밋이 1단계 제출 전 안정 버전”이라는 기준점을 남기는 방식임. tag는 독립 백업 파일이 아니라 원격 기준점임.

따라서 로컬 bundle 백업을 먼저 만들고, 원격 tag는 보조 기준점으로 사용함.

```bash
git tag -a stable-phase1-submission-2026-05-18 -m "1단계 제출 전 안정 버전"
git push origin stable-phase1-submission-2026-05-18
```

확인 명령어:

```bash
git tag
git ls-remote --tags origin
```

주의사항:

- tag는 1단계 제출본이 확정된 뒤 생성함
- 이미 같은 이름의 tag가 있으면 임의로 삭제하거나 다시 만들지 않음
- tag 삭제나 재생성은 사용자 확인 후 진행함

| 구분 | 역할 | 저장 위치 | 특징 |
|---|---|---|---|
| 로컬 bundle 백업 | 실제 복구용 백업 파일 | 내 컴퓨터의 레포 밖 폴더 | GitHub 원격이 꼬여도 복구 가능 |
| 원격 tag 백업 | 안정 버전 기준점 표시 | GitHub 원격 저장소 | 팀원이 기준 커밋을 확인하기 쉬움 |

- bundle은 실제 복구용임
- tag는 GitHub에 남기는 기준점임
- 둘 다 만들면 복구 안정성이 높아짐

### 10.3 백업 실행 시점

- 1단계 요구사항 문서 최종 확인 완료
- 1단계 설계 문서 최종 확인 완료
- PDF 변환본 이미지/표/부록 링크 확인 완료
- main이 origin/main과 동기화됨
- 작업 트리가 clean 상태임
- 그 상태에서 로컬 bundle 백업 생성
- 그 다음 원격 tag 생성

### 10.4 주의사항

- bundle 파일은 Git에 올리지 않음
- bundle 파일은 레포 바깥에 보관함
- tag 생성은 최종 제출본 확정 후 진행함
- tag 삭제, tag 재생성, force push, reset/rebase는 단독 실행하지 않음
- 문제가 생기면 추가 push를 중단하고 현재 상태를 먼저 공유함

---

## 11. 필독: 로컬 개발 환경 세팅 방법

이 섹션은 팀원이 로컬에서 프로젝트를 실행하기 위한 최소 세팅 방법임.
Prisma 7 전환 이후의 자세한 설명은 Issue #45 로컬 세팅 가이드를 확인함.

---

### 11.1 main 최신화

```bash
git checkout main
git pull origin main
```

---

### 11.2 백엔드 세팅

```bash
cd src/backend
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

`.env`에는 아래 키가 필요함.

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
PORT=4000
CORS_ORIGIN=http://localhost:8081
AI_API_KEY=
```

주의:

- `.env`는 로컬 전용 파일이며 Git에 올리지 않음.
- `DATABASE_URL`은 애플리케이션 runtime DB 연결에 사용함.
- `DIRECT_URL`은 Prisma CLI/config 작업에 사용함.
- production DB에서는 `test:db`, `migrate dev`를 실행하지 않음.

---

### 11.3 프론트엔드 세팅

```bash
cd src/frontend
npm install
npm start
```

Expo가 실행되면 웹 확인은 터미널에서 `w`를 입력함.

---

### 11.4 루트 기준 검증 명령어

프로젝트 루트에서 실행함.

```bash
npm run validate:prisma
npm test
npm run check
```

DB 연결까지 확인할 때만 아래 명령을 실행함.

```bash
npm run test:db
```

`npm run test:db`는 본인 Neon 개인 dev branch 또는 dev-main 환경이 확실할 때만 실행함.

---

### 11.5 개발용 seed 데이터

개발/테스트용 기본 계정이 필요할 때만 프로젝트 루트에서 실행함.

```bash
npm run seed:dev
```

생성되는 데이터:

- 개발용 일반 사용자
- 개발용 관리자 사용자
- 각 사용자에 대한 기본 UserProfile

주의:

- seed 계정 비밀번호는 개발용 기본값이며 운영 비밀번호로 사용하지 않음.
- DB에는 plain password가 아니라 bcrypt 기반 `passwordHash`만 저장함.
- production DB에서는 `npm run seed:dev`를 실행하지 않음.
- `npm run seed:dev`는 본인 Neon 개인 dev branch 또는 dev-main 환경이 확실할 때만 실행함.

---

### 11.6 전체 요약

기존 세팅이 끝난 팀원은 아래 순서만 다시 확인하면 됨.

```bash
git checkout main
git pull origin main

cd src/backend
npm install
npx prisma generate

cd ../..
npm run check
npm run test:db
```

단, `npm run test:db`는 production DB가 아닌 개발용 DB branch에서만 실행함.
