# 개발 및 협업 작업 규칙

> 이 문서는 기존 root `README.md`에 포함되어 있던 개발·협업·작업 운영 규칙을 `docs/` 부록으로 이관한 문서이다. root README는 프로젝트 소개와 주요 문서/Issue/PR 바로가기 허브로 재작성되었다.
>
> 현재 작업 기준은 `AGENTS.md`, 최신 README, [AI 활용 정책](./ai-agent-usage-policy.md), 본 문서를 함께 따른다. 충돌이 있을 경우 사용자의 최신 지시와 `AGENTS.md`를 우선한다.

## 1. 기본 원칙

- `main`은 항상 제출 가능한 안정 브랜치로 유지한다.
- `main`에서 직접 기능 구현, 문서 수정, commit, push를 하지 않는다.
- 모든 작업은 최신 `main`에서 별도 branch를 만든 뒤 진행한다.
- 작업 완료 후 Pull Request를 생성하고 검증 후 일반 Merge commit 방식으로 `main`에 병합한다.
- Squash merge와 Rebase merge는 사용하지 않는다.
- 위험 명령은 단독으로 실행하지 않는다.
- `.env`, DB URL, token, password, API key, Render hook 등 민감정보 원문을 출력하거나 커밋하지 않는다.

작업 시작 권장 명령:

```bash
git fetch --all --prune
git checkout main
git pull --ff-only origin main
git status --short --branch
```

`--ff-only`는 불필요한 merge commit 생성을 막기 위한 안전 기준이다.

## 2. Branch 운영 규칙

브랜치 이름은 작업 유형과 내용을 구체적으로 나타낸다.

```text
<작업유형>/<작업내용>
```

예시:

```text
docs/final-report-draft
feature/schedule-management
fix/login-validation
test/backend-auth
chore/folder-cleanup
```

| 유형 | 용도 |
|---|---|
| `docs` | 문서 작성과 정리 |
| `feature` 또는 `feat` | 새 기능 구현 |
| `fix` | 오류 수정 |
| `refactor` | 기능 변경 없는 구조 개선 |
| `test` | 테스트 코드 또는 테스트 문서 작업 |
| `design` | UI, 화면 구성, 다이어그램 작업 |
| `chore` | 폴더 정리, 설정 파일, 기타 관리 작업 |

한 브랜치에는 하나의 목적만 담는다. 기능 구현, 문서 정리, seed 수정, schema 변경처럼 성격이 다른 작업은 별도 branch와 PR로 분리한다.

## 3. Commit 규칙

커밋 메시지는 작업 유형과 내용을 짧고 명확하게 적는다.

```text
[docs] 최종보고서 초안 작성
[feat] 로그인 화면 구현
[fix] 회원가입 validation 문구 수정
[test] 보스 레이드 탈퇴 정책 테스트 추가
```

원칙:

- 한 commit에는 하나의 의미 있는 작업 단위를 담는다.
- 제목은 가능하면 50자 안팎으로 작성한다.
- `수정`, `업데이트`, `최종`처럼 범위가 불분명한 제목만 쓰지 않는다.
- 여러 기능을 한 commit에 섞지 않는다.

## 4. Pull Request 규칙

PR은 `main` 병합 전 변경 범위와 검증 결과를 공유하는 절차이다.

PR 제목 예시:

```text
[docs] 최종 제출 문서 부록화 및 상호 링크 정리
[fix] 회원가입·설정·점검 화면 등 소규모 UX 수정
[feat] 보스 레이드 참여자별 숨김 및 중도 탈퇴 정책 구현
```

PR 본문에는 다음 정보를 포함한다.

- 작업 요약
- 변경 파일
- 관련 Issue
- 구현 또는 문서 정리 내용
- 범위 제외 확인
- 검증 결과
- 수동 확인 포인트
- 남은 위험 요소

Issue를 해결하는 PR에는 `Closes #이슈번호`를 포함한다.

## 5. Merge 규칙

- 병합은 일반 Merge commit 방식을 사용한다.
- Squash merge와 Rebase merge는 사용하지 않는다.
- PR 상태, 변경 파일, 테스트 결과, CI/Vercel 상태, 관련 Issue를 확인한 뒤 병합한다.
- 검증 실패, 예상 밖 파일 변경, 민감정보 노출, schema 위험 변경, dependency 변경 사유 불명확, conflict가 있으면 병합하지 않는다.
- PR 병합 후에는 `git fetch --all --prune`으로 삭제된 원격 branch 정보를 정리한다.
- remote branch는 GitHub 자동 삭제 설정에 맡기며, 수동 삭제하지 않는다.
- local merged branch는 필요 시 `git branch -d <branch>`로만 삭제한다.

## 6. 조원 PR 검증 원칙

조원이 만든 PR도 바로 merge하지 않는다. Codex 검증 또는 팀 검토를 통해 변경 범위를 확인한 뒤 main에 반영한다.

검증 항목:

- 담당 기능 범위와 일치하는지
- 예상 밖 파일 변경이 없는지
- `.env`, build output, cache, local file이 포함되지 않았는지
- 인증/권한 우회가 없는지
- schema/migration 변경이 안전한지
- production DB 위험 작업이 없는지
- 테스트가 통과하는지
- 문서 반영 필요 여부가 확인되었는지
- backend 구조가 `routes → controllers → services → repositories → Prisma` 흐름을 지키는지
- frontend가 기존 API service, token 흐름, 로딩/에러 상태를 깨지 않는지

검증 후 판단:

- 바로 merge 가능
- 수정 후 merge
- merge 금지

## 7. 문서와 폴더 관리

기본 구조:

```text
README.md
docs/
  api/
  deployment/
  design/
  final-report/
  meeting-minutes/
  requirements/
  test-report/
screenshots/
src/
  backend/
  frontend/
```

문서 관리 원칙:

- 최종 제출 문서는 `docs/`에 둔다.
- 요구사항, 설계, 테스트, API, 배포, 최종보고서 문서는 서로 링크로 연결한다.
- PlantUML 원본은 별도 파일로 보관하고, 렌더링 결과는 `screenshots/` 또는 문서에서 지정한 위치에 둔다.
- raw prompt나 채팅 로그를 문서에 그대로 붙이지 않는다.
- 제출 문서는 한국어, 과제 제출 문체, 확인 가능한 사실 중심으로 작성한다.
- coverage가 미측정이면 미측정이라고 명시한다.
- mock/local/fallback 기능을 실제 상용 외부 서비스처럼 과장하지 않는다.

## 8. screenshots 관리

`screenshots/`는 보고서, 발표자료, 다이어그램, 테스트 결과 등 시각 자료를 보관하는 폴더이다.

파일명은 자료 성격이 드러나게 작성한다.

```text
usecase-diagram.png
class-diagram.png
intro-demo-frame.png
vercel-smoke-test-home.png
```

주의:

- raw 영상·스크린샷 분석과 이름 매핑은 별도 작업으로 진행한다.
- 제출용 문서에 연결하지 않은 임시 파일을 무분별하게 추가하지 않는다.
- 로컬 PDF export, dist, coverage, cache 산출물은 커밋하지 않는다.

## 9. 코드 작성과 보안 기준

Backend:

- API는 `routes → controllers → services → repositories → Prisma Client / DB` 흐름을 따른다.
- controller는 request/response와 service 호출 중심으로 유지한다.
- service는 비즈니스 로직을 담당한다.
- repository는 DB 접근을 담당한다.
- 인증이 필요한 API는 auth middleware를 적용한다.
- 관리자 기능은 role 기반 권한 검사를 적용한다.
- userId를 body에서 받아 신뢰하지 않고, 인증된 사용자 정보 기준으로 처리한다.

Frontend:

- 기존 API service 구조를 재사용한다.
- token 원문을 화면이나 로그에 노출하지 않는다.
- 로딩, 에러, 빈 상태를 처리한다.
- Web, mobile, dark/high contrast/large text 구조를 가능한 범위에서 확인한다.
- 새 dependency는 필요한 경우에만 추가하고, package 변경 사유를 PR 본문에 적는다.

민감정보 금지:

- `.env` 실제 값
- `DATABASE_URL`, `DIRECT_URL`
- DB host, DB password
- JWT token 원문
- `JWT_SECRET`
- API key
- Render hook
- plain password

## 10. DB, Prisma, migration, seed 주의사항

- schema 변경은 필요한 경우에만 수행한다.
- migration은 생성 전 영향 범위를 확인한다.
- production/shared DB에서 `migrate dev`, `test:db`, 임의 seed를 실행하지 않는다.
- migration 적용은 별도 승인 후 진행한다.
- seed script는 수정 목적과 DB target을 명확히 확인한 뒤 다룬다.
- `npm run seed:dev`는 local/dev/demo/remote-demo 등 안전한 대상이 확인된 경우에만 실행한다.
- seed 계정 비밀번호는 개발용이며 운영 비밀번호로 사용하지 않는다.
- DB에는 plain password가 아니라 hash를 저장해야 한다.
- seed 실행 로그에 민감정보가 나오면 보고에서 제거한다.

Prisma 검증 명령:

```bash
npm run validate:prisma
npm --prefix src/backend run prisma:generate
```

## 11. 로컬 개발 환경

Backend:

```bash
cd src/backend
npm install
cp .env.example .env
npx prisma generate
npm run dev
```

`.env`에는 키 이름만 공유하고 실제 값은 공유하지 않는다.

```env
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
PORT=4000
CORS_ORIGIN=http://localhost:8081
AI_API_KEY=
```

Frontend:

```bash
cd src/frontend
npm install
npm start
```

루트 검증:

```bash
npm run validate:prisma
npm test
npm run check
```

DB 연결 테스트:

```bash
npm run test:db
```

`npm run test:db`는 production DB가 아닌 개인 dev branch 또는 명확한 dev-main 환경에서만 실행한다.

## 12. 개발용 seed 데이터

개발 또는 데모 확인용 기본 계정이 필요할 때 프로젝트 루트에서 실행한다.

```bash
npm run seed:dev
```

주의:

- production/shared DB에서는 실행하지 않는다.
- DB target을 원문 출력 없이 분류한 뒤 실행한다.
- seed는 반복 실행 여부와 영향 범위를 확인한다.
- seed script 수정과 seed 실행은 별도 목적의 작업으로 분리한다.

## 13. AI agent 사용 기준

AI agent 사용 전 [AI 활용 정책](./ai-agent-usage-policy.md)을 확인한다.

금지 또는 승인 필요 작업:

- `git reset`, `git rebase`, force push
- remote branch 수동 삭제
- secret/env 원문 출력
- production/shared DB write
- migration 적용
- seed 실행
- dependency major update
- `npm audit fix --force`

AI agent는 파일 수정 전 branch와 status를 확인하고, 수정 후 변경 파일과 검증 결과를 보고한다.

## 14. 안정 버전 백업과 tag 기준

안정 버전 백업은 최종 제출본이 확정된 뒤 별도 승인으로 진행한다.

로컬 bundle 백업:

```bash
git status
mkdir -p ../repo-backups
git bundle create ../repo-backups/smart-edu-platform-stable-phase1-2026-05-18.bundle --all
git bundle verify ../repo-backups/smart-edu-platform-stable-phase1-2026-05-18.bundle
```

원격 tag 백업:

```bash
git tag -a stable-phase1-submission-2026-05-18 -m "1단계 제출 전 안정 버전"
git push origin stable-phase1-submission-2026-05-18
```

주의:

- bundle 파일은 레포 밖에 보관하고 Git에 올리지 않는다.
- tag 생성은 최종 제출본 확정 후 진행한다.
- tag 삭제, tag 재생성, force push, reset/rebase는 단독 실행하지 않는다.
- 문제가 생기면 추가 push를 중단하고 현재 상태를 먼저 공유한다.

## 15. 기본 검증 명령

작업 범위에 따라 아래 명령을 선택해 실행한다.

```bash
git diff --check
npm run validate:prisma
npm --prefix src/backend run prisma:generate
npm test
npm run check
npm run check:frontend
npm run check:frontend:web
npm --prefix src/frontend run expo:export:web
```

문서 작업이라도 최소 `git diff --check`와 Markdown 내부 링크 확인은 수행한다.

## 16. 병합 후 정리

PR 병합 후:

```bash
git checkout main
git fetch --all --prune
git pull --ff-only origin main
git status --short --branch
git branch --merged main
git branch -d <merged-local-branch>
```

원격 branch는 수동 삭제하지 않는다. GitHub 자동 삭제 설정과 `fetch --prune`으로 정리한다.
