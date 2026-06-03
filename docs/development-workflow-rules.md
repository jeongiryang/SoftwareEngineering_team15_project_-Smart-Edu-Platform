# 개발 및 협업 작업 규칙

> 이 문서는 이전 README에 포함되어 있던 개발·협업 운영 규칙을 docs 부록으로 분리해 보존한 문서다.
> 현재 README는 최종 제출과 프로젝트 소개 중심으로 유지하며, 본 문서는 과거 README 기준 운영 규칙과 팀 협업 기준을 확인하기 위한 부록이다.
>
> 기준 원문: README.md `f01eb23` 커밋 기준. 현재 AGENTS.md, 최신 README, AI 활용 정책과 충돌하는 경우에는 AGENTS.md와 최신 프로젝트 운영 기준을 우선한다.

## 1. 기본 협업 원칙

### 1.1 작업 전 원격 저장소 최신화

작업을 시작하기 전에는 항상 원격 저장소 상태를 먼저 확인한다.

권장 흐름:

```bash
git fetch --all --prune
git checkout main
git pull --ff-only origin main
```

| 명령어 | 의미 |
|---|---|
| `git fetch --all --prune` | 원격 브랜치 정보를 최신화하고 삭제된 원격 브랜치 정보를 로컬에서도 정리 |
| `git checkout main` | 기준 브랜치인 `main`으로 이동 |
| `git pull --ff-only origin main` | 원격 `main`의 최신 내용을 fast-forward 방식으로만 반영 |

원격 저장소에 조원이 올린 새 작업이 있을 수 있으므로 최신 상태를 받아온 뒤 새 브랜치를 생성한다. `--ff-only`는 불필요한 merge commit 생성을 막기 위한 안전 기준이다.

### 1.2 main 브랜치 직접 작업 금지

`main` 브랜치는 제출 가능한 안정본으로 유지한다.

문서 작성, 회의록 추가, 코드 구현, 오류 수정은 별도 작업 브랜치에서 진행한다. 작업 완료 후 Pull Request로 `main`에 병합한다.

| 좋은 흐름 | 나쁜 흐름 | 판단 기준 |
|---|---|---|
| 작업 브랜치 생성 → 파일 수정 → commit → push → Pull Request 생성 → 조원 확인 → main에 merge | main에서 README 바로 수정, main에서 회의록 바로 commit, main에 기능 코드 바로 push | 작업 이력과 검토 과정 확보 |
| `docs/requirements-document` 브랜치에서 요구사항 문서 작업 후 PR 생성 | `main`에서 요구사항 문서 작성하다가 중간 저장 | main 브랜치 안정성 유지 |

### 1.3 한 작업은 한 브랜치에서 진행

하나의 브랜치에는 하나의 목적만 포함한다.

| 좋은 예시 | 나쁜 예시 | 판단 기준 |
|---|---|---|
| `docs/meeting-minutes-2026-05-11` | `docs/meeting` | 날짜와 작업 목적 명확 |
| `docs/requirements-document` | `docs/final-report-and-requirements` | 요구사항 문서 작업만 포함 |
| `feature/login` | `feature/login-calendar-community` | 하나의 기능 단위로 작업 |
| `fix/readme-typo` | `fix/readme-and-folder-and-login` | 수정 범위가 작고 명확 |

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

### 2.3 브랜치 이름 예시

| 좋은 브랜치 이름 | 나쁜 브랜치 이름 | 판단 기준 |
|---|---|---|
| `docs/meeting-minutes-2026-05-11` | `meeting-minutes` | 문서 작업과 날짜 정보 포함 |
| `docs/user-survey-interview` | `docs/survey` | 사용자 설문/인터뷰 문서로 구체화 |
| `docs/persona` | `docs/user` | 페르소나 문서 작업임을 명확히 표시 |
| `docs/functional-requirements` | `docs/requirements` | 요구사항 중 기능 요구사항으로 구분 |
| `docs/design-document` | `docs/design` | 설계 문서 작업으로 구체화 |
| `feature/schedule-management` | `feature/schedule` | 일정 관리 기능 구현으로 구체화 |
| `feature/community` | `feature/page` | 커뮤니티 기능 작업임을 표시 |
| `fix/readme-typo` | `fix/readme` | README 오타 수정으로 범위 명확 |
| `chore/folder-structure` | `chore/setting` | 폴더 구조 정리 작업으로 구체화 |

## 3. 커밋 메시지 규칙

### 3.1 커밋 메시지 형식

```text
[<타입>] <작업 내용 요약>
```

본문 설명이 필요할 때만 작업 내용을 추가한다.

예시:

```text
[docs] 요구사항 문서 초안 작성

- 사용자 설문 및 인터뷰 결과 추가
- 페르소나 7개 그룹 정리
- 기능적 요구사항과 비기능적 요구사항 초안 작성
```

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

파일명 변경, 파일 삭제, 폴더 정리처럼 애매한 작업은 보통 `[chore]`를 사용한다. UI 화면 구성이나 다이어그램 이미지는 `[design]`을 사용한다.

### 3.3 커밋 작성 규칙

- 한 커밋에는 하나의 작업만 포함한다.
- 제목은 50자 이내를 권장한다.
- 제목 끝 마침표는 생략한다.
- 작업 내용이 명확하게 보이도록 작성한다.
- `수정`, `업데이트`, `최종`처럼 의미가 불명확한 표현은 피한다.

## 4. Pull Request 규칙

### 4.1 Pull Request 생성 기준

작업 브랜치에서 작업 완료 후 바로 `main`에 병합하지 않는다. Pull Request를 생성한 뒤 조원 확인을 받는다.

### 4.2 Pull Request 제목 형식

```text
[타입] 작업 내용 요약
```

예시:

| 좋은 PR 제목 | 나쁜 PR 제목 | 판단 기준 |
|---|---|---|
| `[docs] 5월 11일 회의록 추가` | `[docs] 회의록` | 날짜와 회의록 작업 명시 |
| `[docs] 요구사항 문서 초안 작성` | `[docs] 문서 정리` | 요구사항 문서 작업으로 구체화 |
| `[design] 유스케이스 다이어그램 추가` | `[design] 이미지 추가` | 다이어그램 종류 명시 |
| `[feature] 로그인 화면 구현` | `[feature] 화면 작업` | 구현한 기능 화면 명시 |
| `[fix] README 폴더 구조 설명 수정` | `[fix] README 수정` | README 수정 범위 구체화 |

### 4.3 Pull Request 본문 형식

이전 README 기준 기본 PR 본문은 아래 3가지를 간단히 작성하는 형식이었다.

```markdown
## 작업 내용

- 작업한 내용

## 변경 파일

- 변경된 파일 경로

## 확인할 점

- 조원이 확인해야 할 부분
```

현재 프로젝트에서는 여기에 Issue 연결, 검증 결과, 제외 범위, schema/migration 여부, CI/Vercel 결과를 함께 적는 방식으로 확장해 사용한다.

### 4.4 Merge 규칙

- Pull Request는 최소 1명의 조원이 확인한 뒤 merge한다.
- 마감 직전 긴급 수정은 조원에게 공유 후 조장이 merge할 수 있다.
- 기본 merge 방식은 Merge commit이다.
- Squash merge를 사용하지 않는다.
- Rebase merge를 사용하지 않는다.

Merge commit 사용 이유:

- 브랜치 단위 작업 이력 보존
- 개인별 작업 내용 확인 용이
- 조별과제 기여도 확인에 유리
- 문서, 설계, 구현 과정 추적 가능

## 5. 문서 및 폴더 관리 규칙

### 5.1 기본 폴더 구조

```text
SoftwareEngineering_team15_project_-Smart-Edu-Platform/
├── README.md
├── .gitignore
├── docs/
│   ├── meeting-minutes/
│   ├── requirements/
│   ├── design/
│   ├── test-report/
│   └── final-report/
├── screenshots/
└── src/
    ├── frontend/
    └── backend/
```

- 문서는 `docs/`에서 관리한다.
- 이미지, 캡처, 다이어그램은 `screenshots/`에서 관리한다.
- 실제 구현 코드는 `src/frontend/`, `src/backend/`에서 관리한다.

### 5.2 문서 파일명 규칙

파일명은 영어 소문자와 하이픈을 사용한다.

| 좋은 파일명 | 나쁜 파일명 | 판단 기준 |
|---|---|---|
| `meeting-minutes-2026-05-11.md` | `meeting.md` | 날짜와 문서 종류 표시 |
| `requirements-document.md` | `requirements_final.md` | 공식 문서명 사용 |
| `ai-simulation-log.md` | `ai-result.md` | AI 시뮬레이션 로그 문서 표시 |
| `design-document.md` | `design-final.md` | 설계 문서 표시 |
| `test-report.md` | `test-result.md` | 테스트 보고서 표시 |
| `final-report.md` | `final-real.md` | 공식 최종 보고서 파일명 사용 |

### 5.3 큰 문서는 작업용 파일과 최종 통합 파일 분리

요구사항 문서처럼 내용이 큰 문서는 처음부터 한 파일에 여러 명이 동시에 작성하지 않는다. 작업용 파일을 나누어 작성한 뒤 최종 통합 파일에 합친다.

### 5.4 같은 파일 동시 수정 금지

여러 명이 같은 파일을 동시에 수정하면 Git 충돌 가능성이 높다. 작업 전 담당 파일을 먼저 결정한다.

## 6. screenshots 폴더 관리 규칙

`screenshots/` 폴더에는 프로젝트에 필요한 이미지 자료를 저장한다.

저장 대상:

- 앱 실행 화면 캡처
- 발표 자료용 캡처
- 오류 화면 캡처
- 유스케이스 다이어그램
- UML 다이어그램
- ERD
- 테스트 결과 캡처
- 보고서에 삽입할 이미지

스크린샷 파일명은 자료의 성격을 바로 알 수 있게 작성한다.

| 좋은 파일명 | 나쁜 파일명 | 판단 기준 |
|---|---|---|
| `login-page.png` | `screenshot1.png` | 화면 이름 표시 |
| `usecase-diagram.png` | `diagram.png` | 다이어그램 종류 표시 |
| `class-diagram.png` | `uml.png` | UML 중 어떤 다이어그램인지 표시 |
| `login-error-message.png` | `error.png` | 오류 화면 종류 구체화 |

## 7. 코드 작성 원칙

- 기능별로 파일을 분리한다.
- 불필요한 파일, 임시 파일, 테스트용 파일을 커밋하지 않는다.
- 기능 구현 후 실행 화면 또는 동작 결과를 확인한다.
- 기능 구현과 단순 코드 정리는 가능하면 커밋을 분리한다.

## 8. Notion, HackMD, GitHub 사용 기준

| 도구 | 역할 | 이유 |
|---|---|---|
| Notion | 일정 관리, 할 일 분담, 회의 전후 메모 정리 | 팀 전체 진행 상황 관리 |
| HackMD | 요구사항 문서, 설계 문서 등 공동 문서 초안 작성 | 여러 명이 동시에 긴 문서를 편집하기 쉬움 |
| GitHub | 최종 문서, 코드, 회의록, 캡처 관리 | 최종 결과물과 작업 이력을 공식적으로 관리 |

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

## 9. AI/Codex 보조 작업 검증 기준

이전 README는 AI 에이전트 사용 시 별도 안전 규칙 문서를 먼저 확인하도록 안내했다. 현재 기준에서는 [AI 에이전트 사용 및 원격 작업 안전 규칙](./ai-agent-usage-policy.md)과 AGENTS.md를 함께 적용한다.

기본 검증 기준:

- 작업 전 브랜치와 `git status` 확인
- 요청 범위 밖 파일 수정 금지
- 변경 파일 목록 확인
- 민감정보 원문 출력 및 커밋 금지
- `.env`, DB URL, token, API key, JWT secret 원문 포함 금지
- schema/migration 변경 여부 확인
- workflow/package 변경 여부 확인
- 테스트와 `npm run check` 가능한 범위에서 실행
- CI 실패를 무시하고 merge하지 않음

## 10. seed, migration, secret 주의사항

- `.env`는 로컬 전용 파일이며 Git에 올리지 않는다.
- `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, API key, token, DB host/password 원문을 문서, PR, Issue, 로그에 남기지 않는다.
- production DB에서는 `test:db`, `migrate dev`, 임의 seed를 실행하지 않는다.
- `npm run seed:dev`는 본인 개발 DB 또는 승인된 demo/dev DB가 확실할 때만 실행한다.
- seed 계정 비밀번호는 개발용 기본값이며 운영 비밀번호로 사용하지 않는다.
- DB에는 plain password가 아니라 bcrypt 기반 `passwordHash`만 저장한다.
- schema/migration 변경이 있으면 PR 본문에 반드시 명시한다.

## 11. 안정 버전 백업 및 태그 관리

이전 README는 원격 저장소 사고가 발생했을 때 복구 기준을 남기기 위한 절차를 별도 섹션으로 두었다.

핵심 원칙:

- 로컬 bundle 백업은 Git 커밋 기록과 추적 파일 복구용이다.
- 원격 tag는 특정 안정 커밋을 GitHub에 표시하는 기준점이다.
- bundle 파일은 레포 밖에 보관하고 Git에 올리지 않는다.
- tag 생성은 최종 제출본 확정 후 진행한다.
- tag 삭제, tag 재생성, force push, reset/rebase는 단독 실행하지 않는다.
- 문제가 생기면 추가 push를 중단하고 현재 상태를 먼저 공유한다.

## 12. 로컬 개발 환경 세팅 기준

이전 README 기준 로컬 세팅 흐름:

```bash
git checkout main
git pull origin main

cd src/backend
npm install
cp .env.example .env
npx prisma generate
npm run dev

cd ../frontend
npm install
npm start
```

루트 기준 검증 명령:

```bash
npm run validate:prisma
npm test
npm run check
```

DB 연결까지 확인할 때만 아래 명령을 실행한다.

```bash
npm run test:db
```

`npm run test:db`는 production DB가 아닌 개인 dev branch 또는 dev-main 환경이 확실할 때만 실행한다.

## 13. 협업 원칙 요약

1. 작업 시작 전 원격 저장소 최신화
2. `main` 브랜치 직접 작업 금지
3. 모든 작업은 작업 브랜치에서 진행
4. 브랜치 이름은 `<작업유형>/<작업내용>` 형식
5. 커밋 메시지는 `[타입] 작업 내용` 형식
6. Pull Request를 통해 `main` 브랜치에 병합
7. 최소 1명의 조원이 확인한 뒤 merge
8. 기본 merge 방식은 Merge commit
9. Squash merge, Rebase merge 사용 금지
10. 문서는 `docs/` 폴더에서 관리
11. 코드는 `src/frontend/`, `src/backend/` 폴더에서 관리
12. 이미지, 캡처, 다이어그램은 `screenshots/` 폴더에서 관리
13. 같은 파일을 여러 명이 동시에 수정 금지
14. 큰 문서는 작업용 파일과 최종 통합 파일 분리
15. Notion은 일정 관리용, HackMD는 초안 작성용, GitHub는 최종 정리본 관리용

## 관련 산출물

- [문서 부록 인덱스](./README.md)
- [AI 에이전트 사용 및 원격 작업 안전 규칙](./ai-agent-usage-policy.md)
- [최종보고서](./final-report/final-report-draft.md)
- [테스트 보고서](./test-report/test-report.md)
