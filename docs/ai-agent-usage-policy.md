# AI 에이전트 사용 및 원격 작업 안전 규칙

## 1. 목적

- 이 문서는 AI 에이전트를 활용한 작업 중 원격 저장소 사고를 방지하기 위한 팀 규칙임.
- 대상 AI 에이전트는 Codex, Claude, Gemini, Cursor, GitHub Copilot 등 코드 작성이나 Git/GitHub 작업을 보조할 수 있는 모든 도구임.
- main 브랜치, 원격 브랜치, Pull Request, Issue를 안전하게 관리하기 위한 기준임.

---

## 2. 적용 대상

아래 도구를 포함한 모든 AI 에이전트에 적용함.

- Codex
- Claude
- Gemini
- Cursor
- GitHub Copilot
- 기타 코드 생성, 파일 수정, Git 명령 실행, GitHub 조작이 가능한 AI 도구

특정 도구가 아니라, 원격 저장소에 영향을 줄 수 있는 모든 AI 작업에 적용함.

---

## 3. 기본 원칙

- main 직접 push 금지
- 작업은 브랜치에서 진행
- 변경 사항은 PR로 반영
- 원격 작업은 정이량 확인 후 진행
- AI 에이전트는 분석, 코드 수정, 문서 수정, 테스트 보조로 사용
- AI 에이전트에게 위험 명령어를 단독 실행시키지 않음
- AI가 제안한 명령어는 실행 전 사람이 검토함
- AI가 생성한 코드나 문서는 PR에서 사람이 다시 확인함

---

## 4. AI 에이전트에게 허용하는 작업

아래 작업은 허용 가능함.

- 파일 분석
- 코드/문서 수정 초안 작성
- 로컬 테스트 실행
- git status 확인
- 현재 브랜치 확인
- 변경 파일 목록 확인
- 커밋 메시지 제안
- PR 본문 제안
- Issue 본문 제안
- 로컬에서 기능 구현 보조
- 로컬에서 문서 작성 보조

단, 원격 저장소에 영향을 주는 작업은 별도 승인 기준을 따름.

---

## 5. AI 에이전트에게 금지하는 작업

아래 작업은 승인 없이 금지함.

- git reset
- git rebase
- git push --force
- git push --force-with-lease
- git branch -D
- git push origin --delete
- 원격 브랜치 삭제
- main 직접 push
- merge되지 않은 브랜치 삭제
- .env 업로드
- node_modules 업로드
- dist, .expo, coverage 업로드
- npm audit fix --force
- 의존성 major update
- GitHub token, API key, DB URL 같은 민감정보 처리
- 히스토리를 다시 쓰는 작업

---

## 6. 원격 작업 규칙

AI 에이전트가 아래 작업을 수행하려면 작업 담당자가 먼저 확인해야 함.

- git push
- PR 생성
- PR merge
- Issue 생성
- Issue close
- label 수정
- assignee 지정
- reviewer 지정

원칙:

- push 전 변경 파일 확인
- PR 생성 전 diff 확인
- merge 전 테스트 결과 확인
- merge 전 관련 이슈 확인
- 원격 브랜치 삭제 전 merged 여부 확인
- open PR 브랜치는 삭제하지 않음

---

## 7. 관리자 예외

정이량은 조장 및 저장소 관리 역할로 원격 작업을 관리할 수 있음.

허용 범위:

- git push
- Pull Request 생성
- Pull Request merge
- Issue 생성/수정/close
- label, assignee, reviewer 정리
- merge 완료 브랜치 정리
- main 최신화 및 상태 점검

단, 아래 작업은 정이량도 실행 전 목적과 위험성을 확인한 뒤 진행함.

- git reset
- git rebase
- git push --force
- git push --force-with-lease
- git branch -D
- git push origin --delete
- rm -rf
- npm audit fix --force
- 의존성 major update
- 실제 `.env` 값 수정
- 민감정보 처리

정리:

- 팀원은 AI 에이전트로 원격 작업을 단독 수행하지 않음
- 정이량은 저장소 관리자로 원격 작업을 조정할 수 있음
- 히스토리 변경이나 복구 위험이 있는 작업은 정이량도 신중하게 확인 후 진행함

---

## 8. 위험 명령어 승인 규칙

아래 명령어는 반드시 정이량 승인 후 실행함.

- git reset
- git reset --hard
- git reset --soft
- git rebase
- git push --force
- git push --force-with-lease
- git branch -D
- git push origin --delete
- rm -rf
- npm audit fix --force
- 의존성 major update

위험 명령어가 필요하면 AI 에이전트는 실행하지 말고 아래 내용을 먼저 보고해야 함.

- 필요한 명령어
- 필요한 이유
- 예상 결과
- 위험 요소
- 대체 방법
- 사용자가 승인해야 할 내용

---

## 9. GitHub 계정/권한 사용 주의

- AI 에이전트에게 GitHub 원격 조작 권한을 줄 때는 작업 범위를 명확히 제한함.
- GitHub token, API key, DB URL, 배포 secret은 AI 프롬프트에 직접 붙여넣지 않음.
- AI 에이전트가 원격 저장소에 접근 가능한 상태라면 push, merge, branch delete 명령을 특히 주의함.
- 개인 계정이나 팀원의 GitHub 권한으로 AI가 원격 작업을 수행할 때는 반드시 작업 전후 로그를 확인함.
- 원격 저장소 작업은 가능하면 PR 기반으로 진행함.

---

## 10. 브랜치 작업 규칙

브랜치 이름은 작업 목적이 보이게 작성함.

- 기능 작업: feat/...
- 문서 작업: docs/...
- 설정 작업: chore/...
- 테스트 작업: test/...
- 버그 수정: fix/...
- 검토 작업: review/...

예시:

- feat/backend-auth
- docs/phase1-submission-check
- chore/db-prisma-setup
- test/test-report
- fix/frontend-login-error

---

## 11. PR 작성 규칙

- 제목만 보고 작업 내용을 알 수 있게 작성
- 변경 파일과 검증 결과를 본문에 명시
- 관련 이슈를 연결
- 기능 구현 PR에는 테스트 결과 포함
- 문서 PR에는 변경 범위와 링크 확인 결과 포함
- src 수정 여부, README 수정 여부, screenshots 수정 여부를 명확히 적음
- 변경 파일이 4개 이상이거나 여러 폴더에 걸치면 폴더 기준 중첩 리스트로 작성함
- 변경 파일이 1~3개이고 한 폴더에만 있으면 단순 리스트를 허용함
- 삭제/추가/이동 파일은 변경 파일 목록에 상태를 명확히 표시함
- 변경 파일 목록은 실제 PR diff와 일치해야 함
- merge 전 최소 1명 이상 확인을 권장함

---

## 12. Issue 작성 규칙

- 작업 목적이 보이게 제목 작성
- 큰 작업은 여러 이슈로 분리
- 이슈 본문에는 목표, 작업 범위, 완료 기준을 적음
- 파일 목록이 4개 이상이거나 여러 폴더에 걸치면 폴더 기준 중첩 리스트로 정리함
- 파일이 1~3개이고 한 폴더에만 있으면 단순 리스트를 허용함
- 작업이 끝나면 PR과 연결
- 필요 시 open/closed 이슈 모두 참고

Markdown 문서 작성 기준:

- 긴 Markdown 문서는 목차 추가를 검토함.
- 모든 문서에 무조건 목차를 넣지 않음.
- 문서가 짧거나 섹션 수가 적어 목차가 가독성을 해치면 생략함.
- 목차를 추가할 경우 실제 섹션 구조와 맞춤.
- 목차 항목이 많으면 중첩 리스트로 정리함.
- 목차 anchor가 GitHub Markdown 렌더링 기준으로 이동 가능한지 확인함.
- 부록, 관련 문서, 산출물 링크 목록은 링크 중심 중첩 리스트로 정리함.
- 파일, 폴더, PR 변경 목록도 4개 이상이거나 여러 폴더에 걸치면 중첩 리스트로 작성함.
- 제출용 문서 본문에는 프롬프트성 문장, 작업지시문, 내부 제한 조건을 그대로 넣지 않음.
- `이번 작업에서는`, `하지 마세요`, `새 기능을 추가하지 않음`, `새 FR/UC/NFR을 추가하지 않음`, `다이어그램을 수정하지 않음`, `프롬프트에 따라` 같은 표현은 제출 문서 본문에서 자연스러운 설명으로 바꿈.
- 요구사항 문서, 설계 문서, 인터뷰 문서에는 `본 문서는 기존 요구사항의 근거와 우선순위를 보강하기 위한 자료임`, `인터뷰 결과는 요구사항 도출 근거로 활용함`, `서비스 의뢰자와 이해관계자 관점은 요구사항의 필요성과 우선순위를 설명하는 보조 근거로 활용함`처럼 문서 목적 중심으로 작성함.
- 내부 작업 제한 조건은 제출 문서 본문이 아니라 PR 본문, 작업 로그, AI 시뮬레이션 로그, 운영 규칙에만 작성함.
- 문서 작성 후 프롬프트성 문장 잔존 여부를 검색하여 확인함.

---

## 13. 사고 방지 체크리스트

작업 전 확인:

- 현재 브랜치 확인
- git status 확인
- main에서 직접 작업 중인지 확인
- 작업 범위 확인
- 관련 이슈 확인

push 전 확인:

- 변경 파일 목록 확인
- .env가 포함되지 않았는지 확인
- node_modules가 포함되지 않았는지 확인
- dist, .expo, coverage가 포함되지 않았는지 확인
- 의도하지 않은 파일이 수정되지 않았는지 확인

merge 전 확인:

- PR diff 확인
- 테스트 결과 확인
- 관련 이슈 확인
- 충돌 여부 확인
- open PR 브랜치 삭제 여부 확인

---

## 14. 사고 발생 시 대응

사고가 의심되면 아래 순서로 대응함.

1. 추가 push 중지
2. 현재 상태 공유
3. git status 공유
4. git log --oneline --graph 최근 기록 공유
5. 어떤 명령을 실행했는지 공유
6. 정이량 확인 후 복구 진행
7. reset, rebase, force push는 단독 실행하지 않음

---

## 15. 팀 운영 기준

- AI 에이전트는 작업 보조 도구임.
- 최종 판단은 팀원이 직접 함.
- 원격 저장소에 영향을 주는 작업은 신중하게 처리함.
- 작업 흐름은 Issue와 PR에 남김.
- 팀원이 같은 구조를 이해할 수 있도록 문서와 댓글을 남김.

---

## 16. GitHub Actions CI 기반 방어선

- PR은 GitHub Actions CI 검증 대상임.
- CI는 PR 생성/업데이트와 main 반영 시 자동 실행되는 것을 기본으로 함.
- 현재 자동 검증 명령은 다음 기준을 사용함.
  - `npm run validate:prisma`
  - `npm --prefix src/backend run prisma:generate`
  - `npm test`
  - `npm run check`
- CI에서는 실제 DB에 영향을 줄 수 있는 명령을 실행하지 않음.
  - `npx prisma migrate dev`
  - `prisma migrate deploy`
  - `npm run test:db`
  - seed 실행
- CI가 실패하면 실패 원인을 확인하고 수정 commit을 추가한 뒤 다시 검증함.
- CI 실패를 무시하고 merge하지 않음.
- PR 검토자는 GitHub PR의 Checks 탭 또는 Actions 탭에서 실패 step과 로그를 확인함.

---

## 17. GitHub Actions workflow 파일 관리

- `.github/workflows/*.yml` 파일은 CI 동작에 직접 영향을 주므로 팀원이 임의로 수정하지 않음.
- workflow 수정이 필요한 경우 별도 Issue 또는 PR에서 목적과 영향 범위를 명확히 한 뒤 진행함.
- workflow 변경 PR은 실행 명령, 제외 명령, DB 영향 여부, 검증 결과를 본문에 남김.
- AI 에이전트에게도 workflow 파일을 임의로 수정하지 않도록 작업 범위를 명확히 지정함.
- 기존 작업 브랜치가 workflow 도입 이전에 생성된 경우, 최신 main 반영 여부를 확인한 뒤 PR을 갱신함.

---

## 18. schema/migration 변경 고지 기준

- Prisma schema 변경 또는 migration 추가가 있으면 PR 본문에 반드시 명시함.
- migration 포함 PR은 추가된 모델, enum, relation, index, constraint, onDelete 정책을 요약함.
- 실제 DB에 migration을 적용했는지 여부와 실행하지 않은 DB 영향 명령을 본문에 남김.
- schema/migration 변경은 팀 카카오톡에도 공유하여 팀원이 최신 main 반영과 로컬 migration 적용 필요 여부를 알 수 있게 함.
- 운영 DB 또는 공유 DB에는 임의로 migration을 적용하지 않음.
- 팀원은 최신 main을 받은 뒤 개인 로컬/개발 DB 기준으로 migration 적용 여부를 확인함.
- 실제 DB URL, API key, JWT secret, token 원문 등 민감정보는 PR, Issue, 문서, CI 로그에 작성하지 않음.

---

## 19. 레포 운영 4중 방어선

레포 안정성을 위해 아래 네 단계를 기본 방어선으로 둠.

1. AI 에이전트 폭주 방지 규칙
   - AGENTS.md와 본 문서의 금지 명령, 작업 범위, 민감정보 처리 기준을 우선 적용함.
   - AI 에이전트는 사용자가 명시한 범위 밖의 파일을 수정하지 않음.
2. 최소 2명 리뷰 및 PR 검토
   - 기능 PR은 리뷰어 확인과 Codex 검토를 거쳐 main 반영 여부를 판단함.
   - PR 본문에는 변경 파일, 테스트 결과, 제외 범위, schema/migration 여부를 명시함.
3. GitHub Actions CI check
   - Prisma 검증, Prisma Client 생성, Jest 테스트, 프로젝트 check를 자동으로 실행함.
   - CI 실패 PR은 원인 확인과 수정 commit 후 다시 검증함.
4. 주기적 백업
   - 팀원은 중요한 작업 전후로 로컬 사본, 압축본, 별도 브랜치 등 관리 가능한 방식으로 백업을 남김.
   - 백업은 AI 에이전트 오작동, 잘못된 merge, 예기치 않은 대규모 변경에 대한 복구 기준으로 활용함.

---

## 20. 백업 권장 기준

- 대규모 AI 에이전트 작업 전에는 현재 작업물 백업을 권장함.
- schema/migration, workflow, 주요 프론트 화면, 대규모 API 변경 전후에는 백업 상태를 확인함.
- 백업은 로컬 사본, 압축본, 별도 브랜치 등 팀원이 관리 가능한 방식으로 수행할 수 있음.
- 백업 파일에는 `.env`, 실제 DB URL, API key, JWT secret, token 원문 등 민감정보를 포함하지 않음.
- 잘못된 변경이 발생하면 추가 push를 중단하고 현재 상태와 실행한 명령을 공유한 뒤 복구 방향을 정함.

---

## 관련 산출물

- [문서 부록 인덱스](./README.md)
- [최종보고서](./final-report/final-report-draft.md)
- [테스트 보고서](./test-report/test-report.md)
- [발표자료 구성안](./final-report/presentation-outline.md)
- [회의록 부록](./README.md#7-회의록-부록)
