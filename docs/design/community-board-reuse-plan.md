문서 연결:
- 상위 문서: [2단계 구현 계획 문서](./implementation-plan.md)
- 관련 문서:
  - [설계 문서](./design-document.md)
  - [요구사항 문서](../requirements/requirements-document.md)

---

# 커뮤니티 게시판 기존 구현 분석 및 이식 계획

## 1. 문서 목적

- 기존 DB개론 과제 `DatabaseLanguage_NodeJS_CWNU-Community` 구현을 분석함.
- 기존 커뮤니티 게시판 기능을 Smart Edu Platform에 어떻게 재사용/이식할지 정리함.
- 기존 코드를 그대로 복사하지 않고, 현재 프로젝트 구조에 맞게 재설계하기 위한 계획 문서임.
- 이 문서는 Issue #73의 결과물임.

---

## 2. 참고 대상

- 참고 레포명: `DatabaseLanguage_NodeJS_CWNU-Community`
- 기존 커뮤니티 GitHub 저장소: `https://github.com/jeongiryang/DatabaseLanguage_NodeJS_CWNU-Community`
- 기존 커뮤니티 Vercel 배포 링크: `https://cwnu-community.vercel.app/`
- 참고 방식: 로컬 sibling repo read-only 분석
- 참고 범위:
  - 게시글 목록/상세/작성/수정/삭제
  - 댓글/답글 작성, 수정, 삭제
  - 좋아요, 싫어요, 북마크
  - 조회수, 검색, 정렬, 페이징
  - 카테고리, 공지사항, 인기글
  - 사용자 인증/권한 처리
  - 개발용 seed 데이터 구성
  - 기능 설명서와 스크린샷 기반 문서화 방식
  - 정적 HTML/CSS/Vanilla JS 기반 UI/UX 화면 구성

주의:

- 참고 레포의 코드는 직접 복사하지 않음.
- `.env` 또는 실제 비밀값은 확인/기록하지 않음.
- 참고 레포는 읽기 전용으로만 다룸.
- GitHub 저장소는 기존 구현 구조와 코드 흐름을 분석하기 위한 참고 대상임.
- Vercel 배포 링크는 기존 게시판의 실제 화면 흐름과 UI/UX를 확인하기 위한 참고 대상임.
- 두 링크는 그대로 이식한다는 의미가 아니라, 현재 Smart Edu Platform 구조에 맞게 재설계하기 위한 참고 자료임.

---

## 3. 기존 커뮤니티 프로젝트 구조 요약

기존 `DatabaseLanguage_NodeJS_CWNU-Community`는 Node.js, Express, PostgreSQL, Prisma를 사용하는 정적 웹 기반 커뮤니티 게시판 프로젝트임.

| 구분 | 확인 내용 |
|---|---|
| 기술 스택 | Node.js, Express, PostgreSQL, Prisma ORM, HTML/CSS/Vanilla JS |
| 인증 방식 | JWT + httpOnly cookie 기반 인증 |
| 백엔드 구조 | `server/app.js`, `server/routes/`, `server/controllers/`, `server/middlewares/`, `server/utils/`, `server/prisma.js` |
| 프론트 구조 | `public/index.html`, `public/post-detail.html`, `public/post-write.html`, `public/mypage.html`, `public/js/`, `public/css/` |
| Prisma/DB 구조 | `prisma/schema.prisma`, `prisma/migrations/` |
| 주요 문서 | `README.md`, `docs/feature-guide.md`, `docs/ai-usage.md`, `docs/ui-ux-roadmap.md`, `docs/screenshots/` |
| seed 구조 | `scripts/seed-dev.js`에서 개발용 사용자, 게시글, 댓글, 반응 데이터 생성 |
| 배포 구조 | `api/index.js`, `vercel.json`을 통한 Vercel 배포 고려 |

기존 레포는 `routes → controllers → Prisma Client / DB`에 가까운 구조이며, 별도 service/repository 계층은 분리되어 있지 않음. 반면 현재 Smart Edu Platform은 `routes → controllers → services → repositories → Prisma Client / DB` 구조를 기준으로 하므로, 기존 구현 흐름을 그대로 가져오지 않고 계층을 재분리해야 함.

---

## 4. 기존 구현 핵심 기능

| 기능 | 기존 구현 여부 | 관련 파일/흐름 | Smart Edu 이식 판단 |
|---|---|---|---|
| 게시글 목록 | 있음 | `GET /api/posts`, `server/controllers/post.controller.js`, `public/js/posts.js` | 목록 조회, 카테고리, 정렬, 페이징 흐름 참고 가능 |
| 게시글 상세 | 있음 | `GET /api/posts/:id`, 조회수 증가, 좋아요/북마크 상태 포함 | 상세 화면 정보 구조와 조회수 흐름 참고 가능 |
| 게시글 작성 | 있음 | `POST /api/posts`, 로그인 사용자만 가능 | 인증 사용자 작성 흐름 참고 가능 |
| 게시글 수정 | 있음 | `PUT /api/posts/:id`, 작성자 본인 확인 | 권한 검증 흐름 참고 가능 |
| 게시글 삭제 | 있음 | `DELETE /api/posts/:id`, 작성자 본인 확인, cascade 삭제 | 삭제 정책은 현재 schema와 별도 검토 필요 |
| 댓글 작성 | 있음 | `POST /api/posts/:postId/comments` | 댓글 작성 흐름 참고 가능 |
| 댓글 수정/삭제 | 있음 | `PUT /api/comments/:id`, `DELETE /api/comments/:id` | 작성자 본인 권한 검증 참고 가능 |
| 답글 | 있음 | `parentId` 기반 1단계 답글 | 현재 프로젝트에 도입할지는 별도 schema 설계 필요 |
| 좋아요/취소 | 있음 | `POST/DELETE /api/posts/:postId/like` | 중복 방지 unique 제약과 upsert 흐름 참고 가능 |
| 싫어요/취소 | 있음 | `POST/DELETE /api/posts/:postId/dislike` | 학습 플랫폼 성격상 도입 여부 별도 판단 필요 |
| 북마크/취소 | 있음 | `POST/DELETE /api/posts/:postId/bookmark` | 저장/관심글 기능으로 이식 가능 |
| 조회수 | 있음 | 게시글 상세 조회 시 `viewCount` 증가 | 중복 조회 제한 없이 단순 증가 구조는 보완 필요 |
| 검색 | 있음 | 제목/내용/작성자 검색 | 현재 검색 요구사항에 맞게 재설계 가능 |
| 정렬 | 있음 | 최신순, 좋아요순, 조회수순, 댓글순 | 목록 API query 정책으로 참고 가능 |
| 페이징 | 있음 | `page`, `pageSize`와 허용 page size | 현재 validators 기준으로 재설계 가능 |
| 카테고리 | 있음 | notice/free/study/question/info/market/lost | Smart Edu의 `QUESTION`, `FREE`, `STUDY_PROOF`와 조정 필요 |
| 공지사항/인기글 | 있음 | `board=notice`, `board=hot`, hot score 계산 | 인기글 기준은 후속 요구사항 검토 필요 |
| 사용자 인증/권한 | 있음 | `requireAuth`, `req.user`, 작성자 검증 | 개념은 참고 가능하지만 현재 `authMiddleware`로 재작성 필요 |
| 관리자 기능 | 직접적인 관리자 화면은 제한적 | 신고/관리 확장 여지를 문서에 언급 | 현재 Admin API와 연동하는 방식으로 새로 설계 필요 |
| seed 데이터 | 있음 | 사용자, 게시글, 댓글, 좋아요/싫어요/북마크 생성 | 기능 시연용 seed 구성 방식 참고 가능 |
| 문서화 | 있음 | 기능 설명서, 스크린샷, UI/UX 로드맵 | 제출용 문서 구성 방식 참고 가능 |

---

## 5. 재사용 가능한 부분

기존 구현에서 그대로 가져올 대상은 코드가 아니라 기능 흐름과 설계 관점임.

- 게시글 CRUD 흐름
  - 목록, 상세, 작성, 수정, 삭제를 REST API로 나누는 방식은 참고 가능함.
  - 작성자 본인만 수정/삭제할 수 있도록 서버에서 검증하는 방향은 유지할 가치가 있음.
- 댓글 처리 흐름
  - 게시글별 댓글 조회, 댓글 작성, 본인 댓글 수정/삭제 흐름을 참고할 수 있음.
  - 1단계 답글 구조는 기능 확장 후보로 검토할 수 있음.
- 좋아요/싫어요/북마크 처리 흐름
  - `postId + userId` unique 제약으로 중복 반응을 막는 설계 아이디어를 참고할 수 있음.
  - 좋아요와 싫어요를 상호 배타적으로 처리하는 transaction 흐름은 반응 기능 설계에 참고 가능함.
- 목록 검색/정렬/페이징 설계
  - `page`, `pageSize`, `sort`, `q`, `category` query를 활용한 목록 API 설계 관점은 재사용 가능함.
  - 허용 가능한 page size와 sort 값을 validators에서 검증하는 방식으로 재설계하면 안정적임.
- 게시글 목록/상세 화면 정보 구조
  - 목록에서 제목, 작성자, 카테고리, 작성일, 댓글 수, 반응 수를 요약 표시하는 흐름은 참고 가능함.
  - 상세 화면에서 본문, 댓글, 반응, 작성자 액션을 분리하는 화면 구조는 참고 가능함.
- seed 데이터 구성 방식
  - 사용자, 게시글, 댓글, 반응 데이터를 함께 넣어 시연 가능한 상태를 만드는 방식은 참고 가능함.
  - 단, 실제 값과 운영 DB 위험을 피하기 위해 현재 프로젝트의 production guard 기준으로 재작성해야 함.
- 테스트 케이스 관점
  - 게시글 작성자 권한, 댓글 작성자 권한, 잘못된 id, 존재하지 않는 대상, 중복 반응 방지, cascade 영향 등을 테스트 후보로 삼을 수 있음.
- 기능 설명서 작성 방식
  - 기능별 설명, 관련 API/DB, 화면 캡처, 검증 결과를 묶어 제출용 문서로 정리하는 방식은 참고 가능함.

---

## 6. 그대로 가져오면 안 되는 부분

- 인증/JWT 구조 차이
  - 기존 프로젝트는 JWT httpOnly cookie 중심임.
  - 현재 Smart Edu Platform 프론트는 Bearer token 기반 API 호출 흐름을 사용하므로 인증 로직을 그대로 복사하면 안 됨.
- API 응답 형식 차이
  - 기존 프로젝트는 컨트롤러에서 `res.json({ message, ... })`를 직접 반환함.
  - 현재 프로젝트는 `apiResponse`, `AppError`, error middleware 기준의 응답/에러 구조를 사용해야 함.
- 에러 처리 구조 차이
  - 기존 프로젝트는 컨트롤러 내부에서 status code를 직접 반환하는 부분이 많음.
  - 현재 프로젝트는 service에서 `AppError` 계열 에러를 던지고 middleware에서 처리하는 흐름을 유지해야 함.
- Prisma schema 직접 복사 위험
  - 기존 모델 `Post`, `Comment`, `Like`, `Dislike`, `Bookmark`를 그대로 복사하면 현재 `BoardPost`, `Comment`, `AdminAction` 등과 충돌할 수 있음.
  - 현재 schema에는 이미 `BoardPost`, `Comment`, `PostCategory`, `reported` 필드가 있으므로 확장 방향부터 먼저 정해야 함.
- 현재 공통 구조와 맞지 않는 부분
  - 기존 프로젝트에는 service/repository 계층이 없음.
  - 현재 프로젝트에서는 `routes`, `controllers`, `services`, `repositories`, `utils/prisma.js` 공용 Prisma Client 구조로 재설계해야 함.
- 기존 웹 게시판 전용 UI/CSS
  - 기존 `public/` 기반 HTML/CSS/Vanilla JS UI는 현재 Expo Web/React Native 기반 프론트 구조와 맞지 않음.
  - 정보 구조와 사용 흐름만 참고하고, 화면은 현재 `src/frontend/src/screens/` 구조에 맞게 새로 작성해야 함.
- 기존 프로젝트 전용 문구/도메인
  - CWNU 학내 커뮤니티, 중고장터, 분실물 등 기존 프로젝트 도메인 문구는 Smart Edu Platform의 학습 관리 목적과 다름.
  - Smart Edu에서는 질문, 자유, 학습 인증 중심으로 재정리해야 함.
- 모바일 앱 대응 문제
  - 기존 UI는 정적 웹 중심이며, 현재 프로젝트는 Web/App 출시 품질을 목표로 함.
  - 모바일 가독성, 터치 영역, 스크롤, 입력 UX를 별도로 설계해야 함.
- 관리자 기능과 중복/충돌 가능성
  - 현재 main에는 관리자 API와 관리자 화면이 이미 있음.
  - 게시글/댓글 신고와 관리 처리는 기존 `AdminAction`, `/api/admin/reports`, moderation API와 충돌하지 않게 연결해야 함.

---

## 7. Smart Edu Platform 이식 방향

### 7.1 백엔드 구조

커뮤니티 API는 현재 백엔드 기준 구조를 따른다.

```text
routes
→ controllers
→ services
→ repositories
→ Prisma Client / DB
```

제안 구조:

- `community.routes.js`
  - `/community/posts`, `/community/comments`, `/community/categories` 등 API 경로 연결
  - 인증 필요 endpoint에는 `authMiddleware` 적용
- `community.controller.js`
  - request parameter/body/query를 읽고 service 호출
  - 응답은 `sendSuccess`, `sendCreated` 등 `apiResponse` 기준 사용
- `community.service.js`
  - 작성자 권한, 신고 가능 여부, 좋아요/북마크 중복 처리, 검색/정렬 정책 등 비즈니스 로직 담당
  - 잘못된 입력은 `validationError`, 존재하지 않는 대상은 `notFoundError`, 권한 문제는 `forbiddenError` 사용
- `community.repository.js`
  - Prisma query 전담
  - Prisma Client는 `src/backend/src/utils/prisma.js` 공용 인스턴스 사용
- 인증/권한
  - 현재 사용자는 `req.user` 기준으로 식별
  - body/query의 `userId`를 신뢰하지 않음
  - 게시글/댓글 수정/삭제는 작성자 본인 또는 관리자 정책에 따라 처리
- 관리자 연동
  - 신고된 게시글/댓글은 기존 관리자 API의 신고 목록과 이어질 수 있게 설계
  - 관리자 조치 시 `AdminAction` 기록과 정책 일관성 유지

### 7.2 API 초안

아래 API는 구현 완료가 아니라 초안/제안임. 커뮤니티 사용자용 API namespace는 `/api/community` 기준으로 확정하며, 관리자 운영 API는 기존 `/api/admin/...` 기준을 유지함.

| Method | Endpoint 초안 | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/community/posts` | 게시글 목록 조회, 검색/정렬/페이징/카테고리 필터 | 선택 또는 필요 여부 검토 |
| `POST` | `/api/community/posts` | 게시글 작성 | 필요 |
| `GET` | `/api/community/posts/:postId` | 게시글 상세 조회 | 선택 또는 필요 여부 검토 |
| `PATCH` | `/api/community/posts/:postId` | 게시글 수정 | 필요, 작성자 본인 |
| `DELETE` | `/api/community/posts/:postId` | 게시글 삭제 | 필요, 작성자 본인 |
| `POST` | `/api/community/posts/:postId/comments` | 댓글 작성 | 후속 |
| `PATCH` | `/api/community/comments/:commentId` | 댓글 수정 | 후속, 작성자 본인 |
| `DELETE` | `/api/community/comments/:commentId` | 댓글 삭제 | 후속, 작성자 본인 |
| `POST` | `/api/community/posts/:postId/likes` | 좋아요 | 후속 |
| `DELETE` | `/api/community/posts/:postId/likes` | 좋아요 취소 | 후속 |
| `POST` | `/api/community/posts/:postId/bookmarks` | 북마크 | 후속 |
| `DELETE` | `/api/community/posts/:postId/bookmarks` | 북마크 취소 | 후속 |
| `GET` | `/api/community/categories` | 게시판 카테고리 조회 | 선택 |
| `POST` | `/api/community/posts/:postId/reports` | 게시글 신고 | 후속 후보 |
| `POST` | `/api/community/comments/:commentId/reports` | 댓글 신고 | 후속 후보 |

기존 `docs/design/implementation-plan.md`의 `/api/posts` 계열 초안은 `/api/community/posts` 기준으로 정리함. 1차 구현은 게시글 CRUD API로 제한하고, 댓글/반응/북마크/신고/관리자 연동/프론트 화면은 후속 Issue/PR에서 분리함.

1차 구현 범위:

- 게시글 목록 조회
- 게시글 상세 조회
- 게시글 작성
- 게시글 수정
- 게시글 삭제
- 카테고리 필터
- 검색/정렬/페이징은 게시글 CRUD PR에 포함할 수 있으나, 구현 복잡도에 따라 후속 PR로 분리 가능

후속 구현 범위:

- 댓글 API
- 좋아요/싫어요/북마크
- 신고 API 및 신고 이력 모델
- 관리자 신고 처리 연동
- 커뮤니티 프론트 화면
- seed 데이터
- API 명세/test-report 구현 결과 갱신

신고 API는 `CommunityReport` 모델 도입 여부와 함께 후속 설계에서 확정함. 후보 경로는 `/api/community/reports` 또는 `/api/community/posts/:postId/reports`이며, 현재 문서에서는 구현 완료로 표현하지 않음.

### 7.3 DB / Prisma 모델 초안

현재 schema를 수정하지 않음. 아래는 별도 schema/migration PR에서 검토할 모델/필드 초안임.

현재 main에는 이미 `BoardPost`, `Comment`, `PostCategory`, `AdminAction`이 존재함. 따라서 완전히 새로운 `CommunityPost` 계열 모델을 추가할지, 기존 `BoardPost`/`Comment`를 확장할지는 먼저 결정해야 함.

| 모델 초안 | 주요 필드 후보 | 검토 내용 |
|---|---|---|
| `BoardPost` 또는 `CommunityPost` | `id`, `userId`, `category`, `title`, `content`, `reported`, `createdAt`, `updatedAt`, `viewCount` | 현재 `BoardPost` 확장 우선 검토. 조회수, 검색 인덱스, 익명 여부는 별도 판단 |
| `Comment` 또는 `CommunityComment` | `id`, `postId`, `userId`, `parentId`, `content`, `reported`, `createdAt`, `updatedAt` | 현재 `Comment` 확장 가능. 답글 도입 시 `parentId` 필요 |
| `CommunityLike` | `id`, `postId`, `userId`, `createdAt` | `postId + userId` unique 필요 |
| `CommunityBookmark` | `id`, `postId`, `userId`, `createdAt` | 사용자별 저장 게시글 기능 |
| `CommunityReport` | `id`, `targetType`, `targetId`, `reporterId`, `reason`, `status`, `createdAt`, `resolvedAt` | 현재 단순 `reported` boolean보다 신고 이력 관리에 유리 |
| `CommunityCategory` | `id`, `code`, `name`, `orderNo`, `enabled` | enum으로 충분한지 별도 테이블이 필요한지 검토 |

주의:

- 실제 `schema.prisma` 수정 금지.
- migration 생성 금지.
- 기존 `comments` table은 현재 `BoardPost`와 연결되어 있으므로 이름 충돌과 확장 가능성을 먼저 검토해야 함.
- 좋아요/북마크/신고 이력은 관리자 기능과 연결되므로 schema/migration을 별도 PR로 분리하는 것이 안전함.

### 7.4 프론트 화면 이식 방향

화면 후보:

- 커뮤니티 게시글 목록
- 게시글 상세
- 게시글 작성/수정
- 댓글 영역
- 좋아요/북마크 버튼
- 검색/정렬/카테고리 필터
- 게시글/댓글 신고 버튼
- 관리자 신고 처리 화면과 연계

UI/UX 방향:

- 기존 DB개론 게시판 UI를 그대로 사용하지 않음.
- 기존 화면의 정보 구조만 참고함.
- Smart Edu Platform의 Dashboard/학습 관리 앱 톤에 맞춤.
- 모바일 앱에서도 읽기 쉬운 카드형 목록을 우선 검토함.
- 긴 게시글/댓글은 스크롤 UX와 입력창 고정 여부를 고려함.
- 버튼, 입력창, 카드 스타일은 마지막 전체 UI/UX 정리 때 통일함.
- 프론트는 `src/frontend/src/services/api.js`의 request helper 흐름을 재사용함.
- token 원문을 화면, console, 문서에 노출하지 않음.

---

## 8. 관리자 기능과 연동 가능성

현재 main에는 관리자 API와 관리자 화면이 이미 반영되어 있음. 커뮤니티 기능은 이 흐름과 충돌하지 않게 연결해야 함.

현재 구현된 관리자 기능:

- 관리자 권한 검증
- 사용자 목록 조회
- 사용자 상태 변경
- 신고된 게시글/댓글 조회
- 게시글 삭제 또는 신고 기각
- 댓글 삭제 또는 신고 기각
- 챌린지 강제 종료
- 관리자 조치 로그 기록

커뮤니티 기능 구현 시 필요한 확장:

- 사용자가 게시글을 신고할 수 있는 API
- 사용자가 댓글을 신고할 수 있는 API
- 신고 사유와 신고자 정보를 저장하는 구조
- 신고 누적 기준 또는 단순 신고 여부 정책
- 관리자 화면에서 신고 목록을 확인하고 삭제/기각 처리하는 흐름
- 게시글 숨김과 실제 삭제의 정책 구분
- 댓글 숨김과 실제 삭제의 정책 구분
- 사용자 제재와 게시글/댓글 신고 이력의 연결
- 관리자 조치 로그와 신고 처리 상태의 일관성 유지

주의할 점:

- 현재 `HIDE` action은 schema상 숨김 필드가 없어서 실제 게시글 삭제로 처리됨.
- 커뮤니티 기능에서 “숨김”을 지원하려면 별도 status 필드 또는 deleted/hidden 정책이 필요함.
- 관리자 화면에 이미 있는 신고 처리 UX와 새 커뮤니티 신고 모델이 중복되지 않게 설계해야 함.

---

## 9. 구현 단계 제안

커뮤니티 기능은 API, DB, 프론트, 관리자 연동 범위가 크므로 한 번에 구현하지 않고 단계별 Issue/PR로 나누는 것이 안전함.

1. 커뮤니티 게시판 API 설계 확정
   - endpoint prefix, category 정책, 응답 형식, 에러 형식 확정
2. Prisma schema/migration 별도 PR
   - 현재 `BoardPost`/`Comment` 확장 여부와 좋아요/북마크/신고 모델 결정
3. 커뮤니티 게시글 CRUD API 구현
   - 목록/상세/작성/수정/삭제, 작성자 권한, invalid id, not found 테스트
4. 댓글 API 구현
   - 댓글 작성/수정/삭제, 작성자 권한, 필요 시 답글
5. 좋아요/북마크 API 구현
   - 중복 방지, 취소, 카운트 반영
6. 커뮤니티 프론트 목록/상세/작성 화면 구현
   - Dashboard 진입, 목록/상세/작성/수정/삭제 흐름
7. 신고/관리자 연동
   - 게시글/댓글 신고 API, 관리자 신고 목록과 moderation 연결
8. 전체 UI/UX 정리
   - 모바일 가독성, 입력 UX, 카드/버튼/상태 표시 통일
9. 테스트 보고서/API 명세 갱신
   - 각 PR 검증 후 `docs/api/api-spec.md`, `docs/test-report/test-report.md` 최종 반영

---

## 10. 후속 Issue 제안

- `[Design] 커뮤니티 게시판 DB 모델 및 API 설계 확정`
- `[Feature] 커뮤니티 게시판 API 구현`
- `[Feature] 커뮤니티 댓글 API 구현`
- `[Feature] 커뮤니티 좋아요/북마크 API 구현`
- `[Feature] 커뮤니티 게시판 프론트 화면 연결`
- `[Feature] 커뮤니티 신고/관리자 처리 연동`
- `[Docs] 커뮤니티 API 명세 및 테스트 보고서 반영`

---

## 11. 리스크 및 주의사항

- schema/migration은 별도 PR로 신중히 처리해야 함.
- 기존 코드 복붙 금지.
- 인증/권한 구조는 현재 `authMiddleware`, `req.user`, Bearer token 흐름에 맞게 재설계해야 함.
- 현재 `BoardPost`, `Comment` 모델과 기존 커뮤니티 프로젝트의 `Post`, `Comment` 모델이 다르므로 필드 매핑이 필요함.
- 모바일 앱 대응이 필요하므로 기존 정적 웹 UI를 그대로 사용하면 안 됨.
- 관리자 신고 처리와 중복/충돌하지 않게 신고 모델과 상태 정책을 먼저 확정해야 함.
- 좋아요, 북마크, 신고, 검색, 정렬, 페이징까지 포함하면 테스트 범위가 크게 늘어남.
- #58 보안 취약점은 기능 구현 완료 후 별도 검토함.
- 출시 품질 목표이므로 마지막 전체 UI/UX 정리 단계에서 커뮤니티 화면도 반드시 함께 정리해야 함.
- 실제 `.env` 값, DB URL, JWT secret, API key, token 원문은 문서와 테스트 출력에 포함하지 않음.

---

## 12. 상세 분석 보강

### 12.1 기존 레포 구조 상세 요약

기존 `DatabaseLanguage_NodeJS_CWNU-Community`는 데이터베이스 과제 제출 목적에 맞춰 Express REST API와 정적 HTML/CSS/Vanilla JS 프론트를 한 레포에 구성한 프로젝트임. 기능 설명서와 스크린샷도 함께 관리되어 있어 기능 흐름과 제출 문서 구성 방식을 참고하기 좋음.

| 영역 | 기존 구조 | 확인 내용 | Smart Edu 적용 판단 |
|---|---|---|---|
| 실행 진입점 | `server.js`, `server/app.js` | 로컬 Express 서버 실행과 정적 파일 제공 | 현재 백엔드 `src/backend/src/app.js`, `server.js` 구조와 직접 호환되지 않음 |
| Vercel 진입점 | `api/index.js`, `vercel.json` | `/api`, `/api/*` 요청을 Express app으로 rewrite | 현재 프로젝트 배포 방식과 다를 수 있으므로 참고만 함 |
| 백엔드 라우트 | `server/routes/*.routes.js` | auth, post, comment, like, dislike, bookmark 라우트 분리 | 라우트 분리 방식은 참고 가능하나 service/repository 계층 재설계 필요 |
| 백엔드 컨트롤러 | `server/controllers/*.controller.js` | 요청 검증, Prisma query, 응답 반환을 컨트롤러에서 직접 처리 | 현재 프로젝트에서는 controller와 service/repository 역할 분리 필요 |
| 인증 middleware | `server/middlewares/auth.middleware.js` | JWT cookie 확인 후 `req.user` 설정 | 개념은 참고하되 현재 `authMiddleware`와 Bearer token 흐름으로 재작성 |
| Prisma 연결 | `server/prisma.js` | PrismaClient 단일 인스턴스 export | 현재는 `src/backend/src/utils/prisma.js` 공용 인스턴스 사용 |
| DB schema | `prisma/schema.prisma` | User, Post, Comment, Like, Dislike, Bookmark 모델 | 기존 schema 직접 복사 금지, 현재 BoardPost/Comment 구조와 비교 후 설계 |
| migration | `prisma/migrations/` | 초기 모델, 싫어요, 카테고리, 북마크, 익명, 답글, loginId 변경 이력 | 기능 단위 migration 관리 방식은 참고 가능 |
| seed | `scripts/seed-dev.js` | 개발용 사용자, 게시글, 댓글, 반응, 북마크 데이터 생성 | 시연용 seed 구성 방식은 참고 가능하나 값과 구조는 새로 작성 |
| 프론트 화면 | `public/*.html` | 목록, 상세, 작성, 로그인, 회원가입, 마이페이지 화면 | 현재 Expo Web/React Native 화면으로 재구현 필요 |
| 프론트 JS | `public/js/api.js`, `auth.js`, `posts.js`, `mypage.js` | fetch helper, 인증 UI, 게시판 UI, 마이페이지 활동 렌더링 | 코드 복사 금지, 정보 구조와 이벤트 흐름만 참고 |
| CSS | `public/css/style.css` | 반응형, 다크모드, 카드/테이블 보기, 토스트/모달 스타일 | 현재 디자인 시스템에 맞게 별도 구현 필요 |
| 문서 | `README.md`, `docs/feature-guide.md`, `docs/ui-ux-roadmap.md`, `docs/ai-usage.md` | 기능 설명, UI/UX 개선, AI 사용 명시, 캡처 기반 증빙 | 과제 제출용 문서 구성 방식 참고 가능 |
| 스크린샷 | `docs/screenshots/` | 기능별 캡처, 최종 화면, 모바일 화면, DB 검증 캡처 | Smart Edu 문서화 시 증빙 구조 참고 가능 |

주요 실행 script는 `dev`, `start`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `db:seed:dev`, `postinstall`로 구성되어 있음. 현재 Smart Edu Platform과 script 이름 및 작업 범위가 다르므로 명령을 그대로 가져오지 않음.

### 12.2 기존 Prisma 모델 분석

기존 DB개론 커뮤니티 레포의 Prisma 모델은 게시판 과제에 집중되어 있음. 현재 Smart Edu Platform에는 이미 `BoardPost`, `Comment`, `AdminAction`이 존재하므로 모델명과 관계를 그대로 가져오면 충돌 위험이 있음.

| 기존 모델 | 역할 | 주요 필드 요약 | Smart Edu 이식 판단 |
|---|---|---|---|
| `User` | 게시판 사용자 계정 | `loginId`, `nickname`, `passwordHash`, posts/comments/reactions/bookmarks 관계 | 현재 Smart Edu `User`는 email/name/role/status/userType 기반이므로 직접 이식 불가 |
| `Post` | 게시글 | `userId`, `title`, `content`, `category`, `isAnonymous`, `viewCount`, timestamps | 현재 `BoardPost` 확장 또는 새 `CommunityPost` 도입 여부 검토 |
| `Comment` | 댓글/답글 | `postId`, `userId`, `parentId`, `content`, `isAnonymous`, self relation | 현재 `Comment`에는 `parentId`와 익명 여부가 없으므로 답글 도입 시 schema 검토 필요 |
| `Like` | 게시글 좋아요 | `postId`, `userId`, `createdAt`, `postId + userId` unique | `CommunityLike` 또는 통합 reaction 모델로 재설계 가능 |
| `Dislike` | 게시글 싫어요 | `postId`, `userId`, `createdAt`, `postId + userId` unique | 학습 플랫폼 톤에 맞는지 검토 필요. 필요하면 reaction type으로 통합 가능 |
| `Bookmark` | 게시글 북마크 | `postId`, `userId`, `createdAt`, `postId + userId` unique | 학습 자료 저장/관심글 기능으로 활용 가능 |
| 카테고리 | 별도 모델 없음 | `Post.category` string과 허용 값 목록으로 관리 | Smart Edu는 enum 또는 별도 category table 중 선택 필요 |
| 신고 모델 | 별도 모델 없음 | 기존 구조에는 신고 이력 모델이 없음 | Smart Edu 관리자 연동을 위해 `CommunityReport` 설계 필요 |

기존 모델에서 참고할 핵심은 relation과 unique 제약임. 다만 기존 프로젝트는 게시글 삭제 시 댓글/반응/북마크가 cascade로 정리되는 구조이고, 현재 Smart Edu는 관리자 신고/조치 이력과 연결해야 하므로 soft delete 또는 moderation status가 필요한지 별도로 검토해야 함.

### 12.3 기존 API/라우팅 흐름 분석

기존 API는 Express route별로 기능을 나누고, controller에서 Prisma query와 응답을 직접 처리함. 현재 프로젝트로 이식할 때는 endpoint 목적만 참고하고 구현 구조는 새로 작성해야 함.

| 기존 기능 | 기존 API/흐름 | 현재 프로젝트 이식 방향 | 주의사항 |
|---|---|---|---|
| Health check | `GET /api/health` | 현재 Health API와 별개로 추가 필요 없음 | 기존 service 이름은 사용하지 않음 |
| 회원가입 | `POST /api/auth/register` | 현재 Auth API가 이미 있으므로 재사용하지 않음 | 기존 loginId 기반 구조와 현재 email 기반 구조가 다름 |
| 로그인/로그아웃 | `POST /api/auth/login`, `POST /api/auth/logout` | 현재 token 저장/전달 흐름 유지 | httpOnly cookie 방식 그대로 이식 금지 |
| 현재 사용자 | `GET /api/auth/me` | 현재 `/api/auth/me`, `/api/users/me` 흐름 유지 | 응답 필드와 인증 실패 처리 다름 |
| 닉네임/비밀번호 변경 | `PATCH /api/auth/me`, `PATCH /api/auth/password` | 현재 사용자/프로필 정책과 별도 검토 | 커뮤니티 이식 범위 밖 |
| 회원 탈퇴 | `DELETE /api/auth/me` | 현재 프로젝트 계정 정책과 별도 검토 | cascade 삭제 정책 그대로 복사 금지 |
| 마이페이지 활동 | `GET /api/auth/me/activity` | 커뮤니티 활동 요약 후보로 참고 가능 | 현재 User/Profile API와 중복 여부 확인 필요 |
| 게시글 목록 | `GET /api/posts` | `GET /api/community/posts` 기준으로 정리 | 기존 `/api/posts`는 Smart Edu 확정 namespace와 다름 |
| 게시글 상세 | `GET /api/posts/:id` | `GET /api/community/posts/:postId` 기준으로 정리 | 조회수 증가 정책, 현재 사용자 반응 상태 포함 여부 결정 필요 |
| 게시글 작성 | `POST /api/posts` | `POST /api/community/posts` 기준으로 정리 | `authMiddleware`, `req.user` 기준 작성자 저장 |
| 게시글 수정 | `PUT /api/posts/:id` | `PATCH /api/community/posts/:postId` 기준으로 정리 | HTTP method와 에러 응답 규칙 현재 기준으로 조정 |
| 게시글 삭제 | `DELETE /api/posts/:id` | `DELETE /api/community/posts/:postId` 기준으로 정리 | hard delete, soft delete, hidden status 정책 결정 필요 |
| 댓글 조회 | `GET /api/posts/:postId/comments` | 상세 API에 포함 또는 별도 endpoint 검토 | 댓글 수와 정렬 정책 명시 필요 |
| 댓글 작성 | `POST /api/posts/:postId/comments` | `POST /api/community/posts/:postId/comments` 초안 | 작성자 `req.user` 기준 |
| 댓글 수정/삭제 | `PUT/DELETE /api/comments/:id` | `/api/community/comments/:commentId` 초안 | 작성자 권한과 관리자 조치 분리 필요 |
| 좋아요 | `POST/DELETE /api/posts/:postId/like` | `/api/community/posts/:postId/likes` 초안 | 중복 방지와 카운트 반환 방식 설계 |
| 싫어요 | `POST/DELETE /api/posts/:postId/dislike` | 통합 reaction 또는 제외 검토 | 학습 서비스 분위기에 맞는지 확인 필요 |
| 북마크 | `POST/DELETE /api/posts/:postId/bookmark` | `/api/community/posts/:postId/bookmarks` 초안 | 마이페이지/저장글 화면과 연결 가능 |
| 검색/정렬/페이징 | `GET /api/posts?page=&pageSize=&sort=&q=&category=&board=` | 목록 query 정책으로 재설계 가능 | validators에서 허용 값 검증 필요 |
| 공지/인기글 | `board=notice`, `board=hot` | 공지/인기글 기능은 후속 검토 | 관리자 공지 작성 권한과 hot score 기준 필요 |
| 관리자 API | 별도 관리자 route는 없음 | 현재 Smart Edu Admin API와 연동 | 기존 레포에는 신고 이력/관리자 제재 모델이 없음 |

기존 API는 응답이 `{ message, post, posts, pagination }`처럼 기능별로 직접 구성되어 있음. Smart Edu에서는 `apiResponse`와 현재 문서화된 응답 구조에 맞춰 통일해야 함.

### 12.4 기존 프론트 JS 흐름 분석

기존 프론트는 `public/js/`의 Vanilla JS가 DOM을 직접 조작하는 방식임.

| 파일 | 주요 역할 | 참고 가능한 점 | 그대로 쓰면 안 되는 이유 |
|---|---|---|---|
| `public/js/api.js` | `fetch` 공통 helper, `credentials: include` 사용 | API 호출 공통화 관점 | 현재 프론트는 Bearer token 기반 `src/frontend/src/services/api.js` 사용 |
| `public/js/auth.js` | 로그인/회원가입/로그아웃, 인증 헤더 UI, 토스트, confirm modal, 다크모드 | 로딩/에러/토스트/확인 모달 UX 참고 | DOM 직접 조작 구조라 React Native/Expo와 맞지 않음 |
| `public/js/posts.js` | 게시글 목록/상세/작성/수정/삭제, 댓글, 답글, 좋아요/싫어요/북마크, 검색/정렬/페이징, 작성 임시저장 | 게시판 사용자 흐름과 상태 전환 참고 | 3000줄 이상 규모의 DOM 중심 코드라 그대로 이식하면 유지보수 어려움 |
| `public/js/mypage.js` | 작성 글, 댓글, 좋아요/싫어요/북마크, 활동 타임라인, 활동 통계 렌더링 | 커뮤니티 활동 요약 화면 설계 참고 | 현재 User/Profile, Dashboard 구조와 통합 설계 필요 |

프론트 흐름 상세:

- 게시글 목록
  - URL query에서 `board`, `category`, `page`, `pageSize`, `sort`, `q`를 읽어 목록 상태를 구성함.
  - table view와 card view를 전환하고, 검색어 하이라이트와 최근 검색어를 localStorage에 저장함.
- 게시글 상세
  - 상세 조회 시 게시글 본문, 작성자, 조회수, 댓글 수, 좋아요/싫어요/북마크 수를 렌더링함.
  - 로그인 사용자의 liked/disliked/bookmarked 상태를 반영해 버튼 상태를 바꿈.
- 작성/수정
  - 작성 가이드, 글자 수 카운터, 미리보기, localStorage 임시저장, 작성 중 이탈 경고를 제공함.
  - 수정 모드는 query의 post id를 기준으로 기존 내용을 불러와 폼에 채움.
- 댓글/답글
  - 댓글 목록을 불러오고, 작성자 본인에게 수정/삭제 버튼을 노출함.
  - 답글은 1단계로 제한하고 `parentId`를 전달함.
- 반응
  - 좋아요/싫어요는 상호 배타적으로 처리되고, 북마크는 독립적으로 동작함.
  - 처리 후 count와 버튼 상태를 즉시 갱신함.
- 마이페이지
  - 작성 글, 댓글, 좋아요, 싫어요, 북마크를 묶어 활동 타임라인과 요약 통계로 보여줌.

Smart Edu 이식 시에는 기존 JS를 그대로 쓰지 않고, `src/frontend/src/screens/CommunityScreen.js`와 같은 React Native/Expo 화면 후보 및 `src/frontend/src/services/api.js`의 API 함수로 새로 작성해야 함.

### 12.5 기존 UI/UX 재사용 판단

기존 Vercel 배포 화면은 실제 게시판 흐름을 확인하는 참고 자료로 유용하지만, Smart Edu Platform에 그대로 적용할 디자인은 아님.

재사용 가능한 정보 구조:

- 메인 게시판에서 인기글, 공지, 최신글을 요약하는 구조
- 게시글 목록에서 카테고리, 제목, 작성자, 댓글 수, 반응 수를 함께 보여주는 구조
- 게시글 상세에서 본문, 반응, 댓글 영역을 분리하는 구조
- 글쓰기 화면에서 카테고리 안내, 글자 수, 미리보기를 제공하는 구조
- 마이페이지에서 사용자의 작성 글과 반응 활동을 요약하는 구조

그대로 쓰면 안 되는 요소:

- `public/css/style.css` 기반 정적 웹 레이아웃
- 기존 CWNU 학내 커뮤니티 전용 문구와 카테고리
- 중고장터, 분실물처럼 현재 학습 플랫폼 핵심과 거리가 있는 게시판 범주
- table 중심 목록을 모바일에 그대로 노출하는 방식
- Vanilla JS localStorage 상태 관리와 DOM 조작 방식

Smart Edu에 맞게 바꿔야 할 방향:

- 커뮤니티 톤은 학습 질문, 학습 인증, 자료 공유, 자유 토론 중심으로 조정함.
- 모바일 앱에서는 카드형 목록, 충분한 터치 영역, 긴 글/댓글 스크롤 UX를 우선함.
- Web에서는 검색/정렬/필터를 유지하되 화면 밀도를 과하게 높이지 않음.
- 상세 화면은 글, 댓글, 반응, 신고 버튼을 명확히 분리함.
- 최종 UI/UX 정리 단계에서 Dashboard, Admin, AI 화면과 버튼/카드/색상 체계를 통일함.

### 12.6 Smart Edu용 API 초안 구체화

아래 API는 구현 완료가 아니라 제안/초안임. 실제 구현은 별도 Issue/PR에서 확정함.

| 제안 API | 목적 | 인증 | 권한/소유권 | 후속 여부 |
|---|---|---|---|---|
| `GET /api/community/posts` | 게시글 목록, 검색, 정렬, 페이징, 카테고리 필터 | 선택 또는 필요 여부 검토 | 공개 읽기 여부 정책 필요 | 1차 게시글 API |
| `POST /api/community/posts` | 게시글 작성 | 필요 | `req.user.id`를 작성자로 저장 | 1차 게시글 API |
| `GET /api/community/posts/:postId` | 게시글 상세 조회 | 선택 또는 필요 여부 검토 | invalid id 400, not found 404 | 1차 게시글 API |
| `PATCH /api/community/posts/:postId` | 게시글 수정 | 필요 | 작성자 본인만 가능, ADMIN은 별도 moderation API 사용 | 1차 게시글 API |
| `DELETE /api/community/posts/:postId` | 게시글 삭제 | 필요 | 작성자 본인만 가능, 삭제 정책 확정 필요 | 1차 게시글 API |
| `POST /api/community/posts/:postId/comments` | 댓글 작성 | 필요 | 현재 사용자 기준 작성 | 후속 댓글 API |
| `PATCH /api/community/comments/:commentId` | 댓글 수정 | 필요 | 작성자 본인만 가능 | 후속 댓글 API |
| `DELETE /api/community/comments/:commentId` | 댓글 삭제 | 필요 | 작성자 본인만 가능 | 후속 댓글 API |
| `POST /api/community/posts/:postId/likes` | 좋아요 생성 | 필요 | 사용자별 중복 방지 | 후속 반응 API |
| `DELETE /api/community/posts/:postId/likes` | 좋아요 취소 | 필요 | 본인 반응만 취소 | 후속 반응 API |
| `POST /api/community/posts/:postId/bookmarks` | 북마크 생성 | 필요 | 사용자별 중복 방지 | 후속 북마크 API |
| `DELETE /api/community/posts/:postId/bookmarks` | 북마크 취소 | 필요 | 본인 북마크만 취소 | 후속 북마크 API |
| `POST /api/community/posts/:postId/reports` | 게시글 신고 | 필요 | 본인 게시글 신고 허용 여부 검토 | 후속 신고 API 후보 |
| `POST /api/community/comments/:commentId/reports` | 댓글 신고 | 필요 | 중복 신고 정책 검토 | 후속 신고 API 후보 |
| `GET /api/community/categories` | 카테고리 목록 조회 | 불필요 또는 선택 | enum/table 정책에 따라 결정 | 선택 |

공통 처리 기준:

- id path parameter는 숫자가 아니거나 0 이하이면 `400 VALIDATION_ERROR`.
- 존재하지 않는 게시글/댓글/카테고리는 `404 NOT_FOUND`.
- 작성자 권한이 없으면 `403 FORBIDDEN`.
- 인증이 필요한 API에서 token이 없거나 유효하지 않으면 `401 UNAUTHORIZED`.
- body의 `userId`는 받지 않거나 무시하고 항상 `req.user` 기준으로 처리.

### 12.7 Smart Edu용 DB 모델 초안 구체화

현재 schema는 수정하지 않음. 아래 모델은 문서상 초안임.

| 제안 모델 | 역할 | 핵심 필드 초안 | 관계 | 비고 |
|---|---|---|---|---|
| `CommunityPost` 또는 기존 `BoardPost` 확장 | 커뮤니티 게시글 | `id`, `userId`, `category`, `title`, `content`, `status`, `viewCount`, `createdAt`, `updatedAt` | User 1:N, Comment 1:N | 현재 `BoardPost` 재사용 가능성 우선 검토 |
| `CommunityComment` 또는 기존 `Comment` 확장 | 게시글 댓글/답글 | `id`, `postId`, `userId`, `parentId`, `content`, `status`, `createdAt`, `updatedAt` | Post 1:N, User 1:N, self relation 선택 | 답글 도입 시 `parentId` 필요 |
| `CommunityReaction` | 좋아요/싫어요 통합 반응 | `id`, `postId`, `userId`, `type`, `createdAt` | Post/User와 N:1 | 좋아요/싫어요를 하나로 묶을 경우 사용 |
| `CommunityLike` | 좋아요 전용 | `id`, `postId`, `userId`, `createdAt` | Post/User와 N:1 | 싫어요를 제외하면 단순 구조 가능 |
| `CommunityBookmark` | 북마크 | `id`, `postId`, `userId`, `createdAt` | Post/User와 N:1 | 마이페이지 저장글과 연결 가능 |
| `CommunityReport` | 신고 이력 | `id`, `targetType`, `targetId`, `reporterId`, `reason`, `status`, `createdAt`, `resolvedAt` | User/AdminAction과 연결 가능 | 관리자 신고 처리와 연결 핵심 |
| `CommunityCategory` | 카테고리 | `id`, `code`, `name`, `orderNo`, `enabled` | Post와 N:1 또는 code 참조 | enum으로 충분한지 검토 |

설계 판단 후보:

- 좋아요/싫어요
  - 학습 플랫폼에서는 싫어요가 부정적 분위기를 만들 수 있으므로 좋아요만 먼저 구현하는 방안이 안전함.
  - 싫어요가 필요하면 `CommunityReaction(type)`으로 통합하는 것이 확장성 있음.
- 북마크
  - 학습 자료 저장 관점과 잘 맞으므로 별도 모델 후보가 적절함.
- 신고
  - 단순 `reported: Boolean`만으로는 신고자, 사유, 처리 이력을 남기기 어려움.
  - 관리자 기능과 연결하려면 `CommunityReport`와 `AdminAction`의 관계를 설계하는 것이 좋음.
- 카테고리
  - `QUESTION`, `FREE`, `STUDY_PROOF` 정도면 enum으로 충분할 수 있음.
  - 관리자 설정으로 카테고리를 늘릴 계획이면 별도 table이 필요함.
- 숨김/삭제
  - 현재 관리자 API의 `HIDE`는 실제 삭제로 처리됨.
  - 커뮤니티에서는 `ACTIVE`, `HIDDEN`, `DELETED` 같은 status를 두는 soft delete 정책을 검토할 수 있음.

### 12.8 관리자 기능 연동 계획 구체화

커뮤니티 기능은 현재 관리자 API/화면과 자연스럽게 이어져야 함. 아래 내용은 구현 완료가 아니라 연동 계획임.

| 연동 항목 | 계획 | 현재 기능과의 관계 |
|---|---|---|
| 게시글 신고 | 사용자가 게시글 신고 API로 사유 제출 | 기존 `/api/admin/reports`가 신고 게시글을 조회하는 흐름과 연결 |
| 댓글 신고 | 사용자가 댓글 신고 API로 사유 제출 | 기존 신고 댓글 조회/처리 흐름과 연결 |
| 신고 상태 | 단순 `reported` 또는 `CommunityReport.status`로 관리 | 신고 이력 모델 도입 여부에 따라 변경 |
| 관리자 신고 목록 | 관리자 화면에서 신고 게시글/댓글 목록 확인 | PR #75 관리자 화면 확장 가능 |
| 게시글 숨김/삭제 | 관리자 moderation에서 숨김 또는 삭제 처리 | 현재는 `HIDE`가 실제 삭제이므로 정책 재정의 필요 |
| 댓글 숨김/삭제 | 댓글도 숨김/삭제 정책 선택 | 현재 댓글 moderation은 삭제 또는 신고 기각 |
| 사용자 제재 | 반복 신고 사용자 상태 변경 | 기존 사용자 status 변경 API와 연결 가능 |
| AdminAction 로그 | 관리자 조치 기록 저장 | 기존 `AdminAction`을 확장 또는 재사용 |

구체화가 필요한 정책:

- 신고가 1회라도 들어오면 관리자 목록에 노출할지, 일정 횟수 이상만 노출할지 확인 필요.
- 신고 기각 시 신고 이력을 남길지, 단순 reported 상태만 해제할지 확인 필요.
- 게시글/댓글 숨김 상태를 사용자에게 어떻게 표시할지 확인 필요.
- 관리자가 조치한 게시글/댓글이 작성자 마이페이지에 어떻게 보일지 확인 필요.

### 12.9 구현 단계 재정리

후속 구현은 아래처럼 분리하는 것이 안전함. 각 단계는 별도 Issue/PR로 진행하는 것이 적절함.

1. 커뮤니티 API 경로 및 1차 구현 범위 확정
   - 사용자용 커뮤니티 API namespace는 `/api/community` 기준으로 정리
   - 1차 구현은 게시글 CRUD API로 제한
2. 게시글 CRUD API 구현
   - 목록/상세/작성/수정/삭제, 카테고리 필터, 작성자 권한 테스트
   - 검색/정렬/페이징은 복잡도에 따라 같은 PR 또는 후속 PR로 분리
3. 커뮤니티 DB 모델 확장 검토 및 schema/migration 별도 PR
   - reaction/bookmark/report, 답글, 조회수, status 필드 도입 여부 결정
4. 댓글 API 구현
   - 댓글 작성/수정/삭제, 답글 여부 결정, 댓글 수 검증
5. 좋아요/북마크 API 구현
   - 중복 방지, 취소, count 반환, 마이페이지 연결 후보 검토
6. 신고 API 구현
   - 게시글/댓글 신고, 중복 신고 정책, 신고 사유 저장
7. 커뮤니티 목록/상세/작성 프론트 구현
   - Web/App 기준 화면, 로딩/에러/빈 상태, token 미노출 확인
8. 관리자 신고 처리 연동
   - 관리자 화면에서 신고 목록/조치/상태 갱신 확인
9. 모바일/Web UI/UX 정리
   - 카드형 목록, 긴 댓글 UX, 입력창, 반응 버튼, 신고 버튼 디자인 통일
10. API 명세/테스트 보고서 갱신
    - 구현된 endpoint, 수동 확인, 자동 테스트 결과를 조장이 최종 반영

### 12.10 기존 레포에서 제외할 기능/코드 구체화

아래 항목은 그대로 가져오지 않음.

- 기존 auth/cookie/JWT 구현
  - Smart Edu는 현재 Bearer token 기반 프론트 흐름과 `authMiddleware`를 사용함.
- 기존 static HTML/CSS/Vanilla JS 코드
  - 현재 프론트는 Expo Web/React Native 구조이므로 화면과 API service를 새로 작성함.
- 기존 API response format
  - 현재 `apiResponse`, `AppError`, error middleware 기준으로 통일해야 함.
- 기존 DB schema 그대로 복사
  - 현재 `User`, `BoardPost`, `Comment`, `AdminAction`과 충돌 가능성이 있음.
- 기존 프로젝트 전용 문구
  - CWNU 학내 커뮤니티, 중고장터, 분실물 등은 현재 학습 플랫폼 목적에 맞게 재해석 필요.
- 기존 배포 설정
  - `vercel.json`, `api/index.js` 구조는 기존 프로젝트 전용이므로 현재 배포 구조 확인 후 별도 결정.
- 기존 과제용 seed 데이터
  - 기존 사용자/게시글/댓글/반응 데이터는 그대로 사용하지 않고 Smart Edu 시나리오에 맞춰 새로 작성.
- 현재 프로젝트와 맞지 않는 UI 구조
  - table 중심 화면, DOM 직접 조작, localStorage 중심 게시판 상태 관리는 그대로 사용하지 않음.

---

## 13. 결론

기존 DB개론 커뮤니티 프로젝트는 게시글, 댓글, 반응, 북마크, 검색, 정렬, 페이징, seed 데이터, 기능 설명서 작성 방식 측면에서 참고 가치가 높음.

다만 기존 코드는 Express 컨트롤러와 Prisma query가 직접 결합된 구조이고, 정적 HTML/CSS/Vanilla JS 기반 UI이므로 현재 Smart Edu Platform에 그대로 복사하면 안 됨. 현재 프로젝트의 `routes → controllers → services → repositories → Prisma Client / DB` 구조, `authMiddleware`, `req.user`, `AppError`, `validators`, `apiResponse` 기준으로 재설계해야 함.

커뮤니티 기능은 API, DB, 프론트, 관리자 연동 범위가 넓기 때문에 단계별 PR로 나누는 것이 안전함. 다음 작업은 커뮤니티 DB 모델과 API 설계를 확정하는 별도 설계 Issue로 진행하는 것이 적절함.
