# Smart Edu Platform API 명세서

## 목차

1. [문서 개요](#1-문서-개요)
2. [공통 규칙](#2-공통-규칙)
3. [공통 응답/에러 형식](#3-공통-응답에러-형식)
4. [Health API](#4-health-api)
5. [Auth API](#5-auth-api)
6. [User/Profile API](#6-userprofile-api)
7. [Schedule/Task API](#7-scheduletask-api)
8. [개발용 seed 데이터](#8-개발용-seed-데이터)
9. [구현 및 예정 API](#9-구현-및-예정-api)
10. [테스트 및 검증 기준](#10-테스트-및-검증-기준)
11. [변경 이력](#11-변경-이력)

---

## 1. 문서 개요

이 문서는 Smart Edu Platform의 프론트엔드/백엔드 기능 구현을 위한 API 기준 문서임.

현재 실제로 구현된 API와 앞으로 구현할 예정 API를 구분하여 정리함. 구현 완료로 표시된 API는 현재 Express 라우트와 controller 기준으로 작성했으며, 예정 API는 후속 구현을 위한 초안 수준임.

API 경로는 백엔드 Express 서버 기준임. 실제 DB URL, API key, JWT secret, JWT token 원문, seed 계정의 실제 비밀번호는 문서에 포함하지 않음.

---

## 2. 공통 규칙

### 2.1 Base URL

로컬 개발 기준 Base URL은 다음과 같음.

```text
http://localhost:4000
```

API prefix는 `/api`임.

예시:

```text
GET http://localhost:4000/api/health
```

### 2.2 요청/응답 형식

- 요청과 응답은 JSON을 기준으로 함.
- JSON 요청이 필요한 API는 `Content-Type: application/json`을 사용함.
- 응답에는 실제 비밀값을 포함하지 않음.
- `passwordHash`는 사용자 응답에 포함하지 않음.

### 2.3 인증 헤더

인증이 필요한 API는 Bearer token을 사용함.

```http
Authorization: Bearer <JWT_TOKEN>
```

주의:

- 실제 JWT token 원문은 문서, Issue, PR, 회의록에 작성하지 않음.
- `<JWT_TOKEN>`은 예시용 placeholder임.

---

## 3. 공통 응답/에러 형식

### 3.1 성공 응답

현재 구현된 Auth API와 User/Profile API는 성공 payload를 그대로 JSON 응답으로 반환함.

예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "홍길동",
    "role": "USER",
    "status": "ACTIVE"
  },
  "token": "<JWT_TOKEN>"
}
```

새 API 구현 시에는 공통 응답 helper를 사용할 수 있음. 다만 기존 구현 API의 응답 구조를 무리하게 `{ data, message }` 형태로 바꾸지 않음.

### 3.2 에러 응답

현재 공통 에러 응답은 다음 구조를 기준으로 함.

```json
{
  "message": "인증이 필요함",
  "code": "UNAUTHORIZED"
}
```

검증 상세 정보가 필요한 경우 `details`가 추가될 수 있음.

```json
{
  "message": "Profile update contains unsupported fields",
  "code": "VALIDATION_ERROR",
  "details": {
    "fields": ["role"]
  }
}
```

### 3.3 HTTP status code 기준

| Status | 의미 | 사용 기준 |
|---|---|---|
| `200 OK` | 성공 | 조회, 로그인, 수정 성공 |
| `201 Created` | 생성 성공 | 회원가입 등 리소스 생성 |
| `400 Bad Request` | 잘못된 요청 | 필수값 누락, 형식 오류, 허용되지 않은 필드 |
| `401 Unauthorized` | 인증 실패 | 토큰 없음, 토큰 오류, 로그인 실패 |
| `403 Forbidden` | 권한 없음 | 비활성 사용자, 관리자 권한 부족 |
| `404 Not Found` | 리소스 없음 | 사용자 또는 대상 데이터 없음 |
| `409 Conflict` | 충돌 | 중복 아이디 등 |
| `500 Internal Server Error` | 서버 오류 | 예상하지 못한 서버 오류 |

---

## 4. Health API

### 4.1 Health Check

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/health` |
| 인증 | 불필요 |
| 설명 | 백엔드 API 서버가 동작 중인지 확인함 |

Response 예시:

```json
{
  "status": "ok",
  "service": "Smart Edu Platform API"
}
```

### 4.2 System Status / Maintenance

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/system/status` |
| 인증 | 불필요 |
| 설명 | 서비스 점검/업데이트 모드 상태를 공개 조회함 |

Response 예시:

```json
{
  "maintenance": {
    "enabled": false,
    "title": "사각사각 업데이트 중",
    "message": "더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.",
    "estimatedEndAt": null,
    "updatedAt": "2026-05-29T12:00:00.000Z"
  }
}
```

정책:

- 공개 조회 API이므로 DB URL, secret, 관리자 정보 등 민감정보를 반환하지 않음.
- `enabled`가 `true`이면 프론트엔드는 일반 사용자에게 점검 화면을 표시함.
- 관리자 로그인과 관리자 화면 접근은 프론트엔드에서 별도 우회 정책으로 처리함.
- status API 조회 실패 시 프론트엔드는 fail-open 방식으로 일반 화면을 유지함.

### 4.3 Realtime WebSocket

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Endpoint | `/ws` |
| 인증 | 서비스 점검/공지 수신은 불필요, 친구 접속 상태는 연결 후 `presence.authenticate` 메시지로 인증 |
| 설명 | 접속 중인 클라이언트에 서비스 점검 상태, 관리자 공지, 커뮤니티 새 댓글, 친구 접속 상태를 실시간 전달함 |

클라이언트 발행 메시지:

| Message type | Payload | 설명 |
|---|---|---|
| `presence.authenticate` | `{ "token": "<JWT>" }` | WebSocket 연결 후 친구 접속 상태를 수신하기 위해 현재 사용자 token으로 인증함. token은 URL query로 보내지 않음 |
| `presence.refresh` | `{}` | 인증된 연결에서 현재 온라인 친구 목록 snapshot을 다시 요청함 |

서버 발행 이벤트:

| Event type | Payload | 설명 |
|---|---|---|
| `maintenance.updated` | `{ "maintenance": { ... } }` | 관리자가 점검 모드 ON/OFF 또는 안내 문구를 변경했을 때 발행 |
| `admin.notice` | `{ "notice": { "id": "...", "title": "...", "message": "...", "level": "info" } }` | 관리자가 실시간 공지를 전송했을 때 발행 |
| `community.comment.created` | `{ "comment": { "postId": 1, "commentId": 10, "parentId": null, "isReply": false, "author": { "id": 2, "name": "사용자" }, "preview": "댓글 미리보기", "createdAt": "..." } }` | 커뮤니티 게시글에 새 댓글이 작성되었을 때 발행 |
| `community.reply.created` | `{ "comment": { "postId": 1, "commentId": 11, "parentId": 10, "isReply": true, "author": { "id": 2, "name": "사용자" }, "preview": "대답글 미리보기", "createdAt": "..." } }` | 커뮤니티 게시글에 새 대답글이 작성되었을 때 발행 |
| `friends.presence.snapshot` | `{ "onlineFriendIds": [2, 3] }` | 인증된 사용자에게 현재 온라인 상태인 친구 ID 목록을 전달 |
| `friends.presence.updated` | `{ "userId": 2, "online": true, "updatedAt": "..." }` | 친구가 온라인/오프라인 상태로 바뀌었을 때 해당 친구 관계 사용자에게만 전달 |
| `friends.presence.auth_failed` | `{ "reason": "invalid_token" }` | WebSocket presence 인증 실패 시 전달. token 원문은 반환하지 않음 |
| `directMessage.created` | `{ "thread": { "id": 1, "friend": { "id": 2, "name": "학습 친구", "loginId": "study_peer" }, "unreadCount": 1 }, "message": { "id": 10, "threadId": 1, "senderId": 2, "content": "오늘 복습할까요?", "createdAt": "..." } }` | 친구 간 쪽지 작성 성공 후 thread 참여자에게만 전달 |
| `directMessage.read` | `{ "threadId": 1, "userId": 1, "lastReadAt": "...", "thread": { ... } }` | 사용자가 쪽지 thread를 읽음 처리했을 때 thread 참여자에게만 전달 |
| `directMessage.typing` | `{ "threadId": 1, "userId": 2, "isTyping": true, "updatedAt": "..." }` | 인증된 WebSocket 사용자가 참여 중인 쪽지 thread에서 작성 중 상태를 보낼 때 thread 참여자에게만 전달 |
| `account.status.updated` | `{ "status": "SUSPENDED", "reason": "ADMIN_STATUS_CHANGE", "changedAt": "...", "message": "Account status changed to SUSPENDED" }` | 회원 탈퇴 또는 관리자 계정 상태 변경 성공 후 해당 사용자 연결에 전달. 프론트엔드는 `SUSPENDED`/`DEACTIVATED` 수신 시 중앙 제한 화면으로 전환하고, `ACTIVE` 수신 시 제한 화면을 해제함 |
| `bossRaid.progress.updated` | `{ "party": { "id": 10, "raid": { "id": 1, ... }, "totalDamage": 140, "remainingHp": 160, "progressRate": 0.46, "participantCount": 2, "completed": false } }` | 보스 레이드 파티 생성/참가/상세 갱신 후 진행률이 변경될 수 있을 때 파티 멤버에게만 전달 |
| `bossRaid.completed` | `{ "party": { "id": 10, "status": "CLEARED", "completed": true, ... } }` | 보스 레이드가 처치 완료 상태로 계산되거나 보상 수령 흐름에서 완료 상태가 확인될 때 파티 멤버에게만 전달 |
| `collabQuest.progress.updated` | `{ "quest": { "questId": 1, "currentValue": 55, "goalValue": 100, "progressPercent": 55, "participantCount": 2, "completed": false } }` | 협동 퀘스트 생성/참여/기여도 추가 후 진행률이 바뀌었을 때 참여자에게만 전달 |
| `collabQuest.completed` | `{ "quest": { "questId": 1, "status": "COMPLETED", "completed": true, ... } }` | 협동 퀘스트 목표 달성 또는 보상 수령 흐름에서 완료 상태가 확인될 때 참여자에게만 전달 |

WebSocket URL 기준:

- 로컬 개발 API가 `http://localhost:4000/api`이면 WebSocket은 `ws://localhost:4000/ws`를 사용함.
- 배포 API가 `https://<backend-domain>/api`이면 WebSocket은 `wss://<backend-domain>/ws`를 사용함.

정책:

- WebSocket은 서버 broadcast 수신을 기본으로 사용하고, 클라이언트 발행 메시지는 `presence.authenticate`/`presence.refresh`와 `directMessage.typing`만 제한적으로 처리함.
- 클라이언트가 임의 관리자 이벤트를 보낼 수 없도록 관리자 공지나 점검 상태 변경 메시지는 클라이언트 입력으로 처리하지 않음.
- WebSocket 연결 실패 시 기존 `GET /api/system/status` 기반 HTTP fallback을 유지함.
- 친구 접속 상태는 친구 관계가 있는 사용자에게만 표시하며, 정확한 위치나 상세 활동 내역은 전달하지 않음.
- 보스 레이드 진행률 event는 해당 파티 멤버에게만 전달하며, 보상 지급은 기존 HTTP API transaction과 중복 수령 방지 로직을 그대로 사용함.
- Vercel은 WebSocket 서버를 실행하지 않고, 브라우저가 Render backend의 `/ws` endpoint에 직접 연결함.
- 서버 발행 WebSocket payload에는 DB URL, secret, token, `passwordHash` 등 민감정보를 포함하지 않음.

---

## 5. Auth API

프론트엔드 로그인/회원가입 화면은 이 섹션의 Auth API를 호출함.

- 로그인 화면은 `POST /api/auth/login`을 호출함.
- 회원가입 화면은 `POST /api/auth/register`를 호출함.
- 앱 시작 시 저장된 token이 있으면 `GET /api/auth/me`로 현재 사용자를 확인함.
- 성공 시 token은 클라이언트 저장소에 저장하고 이후 인증 요청에 Bearer token으로 사용함.
- 실제 JWT token 원문은 화면, 로그, 문서에 출력하지 않음.

계정 상태 정책:

| 상태 | 로그인 | 보호 API 호출 | 설명 |
|---|---|---|---|
| `ACTIVE` | 허용 | 허용 | 정상 이용 상태 |
| `SUSPENDED` | 차단 (`403`) | 차단 (`401`) | 관리자 정지 상태. 기존 token도 보호 API에서 유효하지 않게 처리함 |
| `DEACTIVATED` | 차단 (`403`) | 차단 (`401`) | 회원 탈퇴 또는 비활성 상태. 기존 token도 보호 API에서 유효하지 않게 처리함 |

### 5.1 회원가입

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/auth/register` |
| 인증 | 불필요 |
| 설명 | 아이디, 비밀번호, 닉네임을 받아 사용자를 생성하고 JWT를 발급함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `loginId` | string | 예 | 사용자 아이디 |
| `password` | string | 예 | 사용자 비밀번호 |
| `name` | string | 예 | 사용자 닉네임. API field는 기존 호환성을 위해 `name`을 유지함 |

Request 예시:

```json
{
  "loginId": "user_id",
  "password": "<PASSWORD>",
  "name": "홍길동"
}
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "홍길동",
    "role": "USER",
    "status": "ACTIVE"
  },
  "token": "<JWT_TOKEN>"
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락, 아이디 형식 오류, 비밀번호 길이 부족 |
| `409` | `CONFLICT` | 이미 가입된 아이디 |

보안 주의사항:

- 비밀번호는 bcrypt hash로 저장함.
- 응답에 `passwordHash`를 포함하지 않음.
- 실제 token 원문은 문서에 작성하지 않음.

### 5.2 로그인

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/auth/login` |
| 인증 | 불필요 |
| 설명 | 아이디와 비밀번호를 검증하고 JWT를 발급함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `loginId` | string | 예 | 사용자 아이디 |
| `password` | string | 예 | 사용자 비밀번호 |

Request 예시:

```json
{
  "loginId": "user_id",
  "password": "<PASSWORD>"
}
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "홍길동",
    "role": "USER",
    "status": "ACTIVE"
  },
  "token": "<JWT_TOKEN>"
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락 |
| `401` | `UNAUTHORIZED` | 존재하지 않는 사용자 또는 잘못된 비밀번호 |
| `403` | `FORBIDDEN` | `SUSPENDED` 또는 `DEACTIVATED` 상태 계정 |

보안 주의사항:

- 응답에 `passwordHash`를 포함하지 않음.
- 실제 token 원문은 문서에 작성하지 않음.

### 5.3 현재 사용자 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/auth/me` |
| 인증 | 필요 |
| 설명 | Bearer token 기준으로 현재 로그인한 사용자 기본 정보를 반환함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "홍길동",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 인증 헤더 없음, Bearer token 없음, token 검증 실패, token의 사용자를 찾을 수 없음, 계정이 `ACTIVE`가 아님 |

보안 주의사항:

- 응답에 `passwordHash`를 포함하지 않음.

---

## 6. User/Profile API

### 6.1 내 사용자 정보 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/users/me` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 기본 정보와 프로필 정보를 반환함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "홍길동",
    "role": "USER",
    "status": "ACTIVE",
    "profile": {
      "id": 1,
      "userId": 1,
      "learningGoal": "매일 2시간 학습",
      "preferredSubject": "수학",
      "profileImageUrl": null,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  }
}
```

참고:

- `profile`이 없으면 `null`로 반환될 수 있음.
- 응답에 `passwordHash`를 포함하지 않음.

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 인증 실패 |
| `404` | `NOT_FOUND` | 사용자를 찾을 수 없음 |

### 6.2 내 계정 기본 정보 수정

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/users/me` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 닉네임을 수정함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

수정 허용 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `name` | string | 사용자 닉네임. API field는 기존 호환성을 위해 `name`을 유지함 |

Request 예시:

```json
{
  "name": "사각 학습자"
}
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "사각 학습자",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 빈 닉네임, 허용되지 않은 필드, 잘못된 필드 타입 |
| `401` | `UNAUTHORIZED` | 인증 실패 |
| `404` | `NOT_FOUND` | 사용자를 찾을 수 없음 |

보안 주의사항:

- `role`, `status`, `loginId`, `passwordHash` 같은 권한/인증 관련 필드는 이 API에서 수정하지 않음.
- 응답에 `passwordHash`를 포함하지 않음.

### 6.3 내 비밀번호 변경

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/users/me/password` |
| 인증 | 필요 |
| 설명 | 현재 비밀번호 확인 후 새 비밀번호로 변경함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `currentPassword` | string | 예 | 현재 비밀번호 |
| `newPassword` | string | 예 | 새 비밀번호. 최소 8자 |

Request 예시:

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password-1234"
}
```

Response 예시:

```json
{
  "message": "Password changed successfully"
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락, 새 비밀번호 길이 부족, 허용되지 않은 필드 |
| `401` | `UNAUTHORIZED` | 인증 실패 또는 현재 비밀번호 불일치 |
| `404` | `NOT_FOUND` | 사용자를 찾을 수 없음 |

보안 주의사항:

- 현재 사용자 본인(`req.user.id`) 기준으로만 변경함.
- 응답에 기존/신규 비밀번호, `passwordHash`, token 원문을 포함하지 않음.
- 비밀번호는 bcrypt hash로 저장함.

### 6.4 내 계정 탈퇴

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `DELETE` |
| Endpoint | `/api/users/me` |
| 인증 | 필요 |
| 설명 | 현재 비밀번호와 확인 문구 검증 후 현재 로그인한 계정을 soft delete 방식으로 비활성화함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `currentPassword` | string | 예 | 현재 비밀번호 |
| `confirmationText` | string | 예 | 탈퇴 확인 문구. 정확히 `탈퇴합니다` 입력 필요 |

Request 예시:

```json
{
  "currentPassword": "current-password",
  "confirmationText": "탈퇴합니다"
}
```

Response 예시:

```json
{
  "message": "Account withdrawn successfully",
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "탈퇴한 사용자",
    "role": "USER",
    "status": "DEACTIVATED"
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락, 확인 문구 불일치, 허용되지 않은 필드 |
| `401` | `UNAUTHORIZED` | 인증 실패 또는 현재 비밀번호 불일치 |
| `404` | `NOT_FOUND` | 사용자를 찾을 수 없음 |

보안/운영 주의사항:

- hard delete가 아니라 기존 `AccountStatus.DEACTIVATED`를 사용하는 soft delete로 처리함.
- 탈퇴 후 기존 token은 `authMiddleware`의 status 검증에서 차단됨.
- 기존 게시글/댓글/보상/쪽지 등 사용자 참조 데이터는 FK 보호를 위해 유지함.
- 탈퇴 계정의 `loginId`는 재사용하지 않음.
- 응답에 `passwordHash`, token 원문, 현재 비밀번호를 포함하지 않음.

### 6.5 내 프로필 수정

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/users/me/profile` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 프로필 정보를 수정함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

수정 허용 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `learningGoal` | string 또는 null | 학습 목표 |
| `preferredSubject` | string 또는 null | 선호 과목 |
| `profileImageUrl` | string 또는 null | 프로필 이미지 URL |

Request 예시:

```json
{
  "learningGoal": "기말고사 대비",
  "preferredSubject": "영어",
  "profileImageUrl": null
}
```

Response 예시:

```json
{
  "profile": {
    "id": 1,
    "userId": 1,
    "learningGoal": "기말고사 대비",
    "preferredSubject": "영어",
    "profileImageUrl": null,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 빈 body, 허용되지 않은 필드, 잘못된 필드 타입 |
| `401` | `UNAUTHORIZED` | 인증 실패 |
| `404` | `NOT_FOUND` | 사용자를 찾을 수 없음 |

보안 주의사항:

- `role`, `status`, `passwordHash` 같은 권한/인증 관련 필드는 이 API에서 수정하지 않음.
- 응답에 `passwordHash`를 포함하지 않음.

### 6.6 내 커뮤니티 활동 통계 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/users/me/activity` |
| 인증 | 필요 |
| 설명 | 현재 로그인한 사용자의 커뮤니티 활동 수를 마이페이지 요약용으로 반환함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Response 예시:

```json
{
  "activity": {
    "postCount": 4,
    "commentCount": 7,
    "replyCount": 3,
    "likeCount": 11,
    "dislikeCount": 2,
    "bookmarkCount": 5,
    "reactionBasis": "GIVEN"
  }
}
```

집계 기준:

- `postCount`: 내가 작성한 커뮤니티 게시글 수
- `commentCount`: 내가 작성한 최상위 댓글 수
- `replyCount`: 내가 작성한 대답글 수
- `likeCount`: 내가 게시글과 댓글에 누른 좋아요 수
- `dislikeCount`: 내가 게시글과 댓글에 누른 싫어요 수
- `bookmarkCount`: 내가 저장한 커뮤니티 북마크 수
- `reactionBasis`가 `GIVEN`이면 받은 반응이 아니라 내가 누른 반응 기준임.

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 인증 실패 |
| `404` | `NOT_FOUND` | 사용자를 찾을 수 없음 |

보안 주의사항:

- 현재 사용자 본인(`req.user.id`) 기준으로만 집계함.
- 응답에 `passwordHash`, token, JWT 원문을 포함하지 않음.

### 6.7 공개 프로필 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/users/:userId/public-profile` |
| 인증 | 필요 |
| 설명 | 다른 사용자의 공개 가능한 프로필, 상점 꾸미기 적용 상태, 간단한 학습 요약을 조회함 |

Request Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

Response 예시:

```json
{
  "profile": {
    "id": 2,
    "name": "학습 친구",
    "displayLoginId": "st***r",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "learningGoal": "매일 30분 복습",
    "preferredSubject": "영어",
    "appearance": {
      "profileImageUrl": "/assets/shop/avatar-sky.png",
      "profileBackgroundUrl": "/assets/shop/background-mint.png",
      "titleText": "아침형 학습러",
      "equippedItems": {
        "profileImage": {
          "id": 1,
          "code": "PROFILE_AVATAR_SKY",
          "name": "하늘 노트 아바타",
          "type": "PROFILE_IMAGE",
          "assetUrl": "/assets/shop/avatar-sky.png"
        },
        "profileBackground": null,
        "title": null
      }
    },
    "stats": {
      "todayFocusMinutes": 25,
      "weeklyFocusMinutes": 180,
      "completedTaskCount": 9
    }
  }
}
```

보안 기준:

- 공개 프로필은 인증된 사용자만 조회함.
- 비활성/제재 계정은 공개 프로필로 노출하지 않음.
- 응답에는 원본 `loginId` 대신 표시용 `displayLoginId`만 제공함.
- `passwordHash`, token, JWT 원문, 관리자 내부 정보는 포함하지 않음.

### 6.8 친구 추가 및 친구 목록 API

친구 기능은 인증된 사용자끼리 친구 요청을 보내고, 수락/거절하고, 친구 목록을 조회하는 1차 MVP 범위로 구현함. DM, 실시간 채팅, 차단, 그룹 기능은 후속 범위임.

공통 보안 기준:

- 모든 친구 API는 인증이 필요함.
- 현재 사용자는 request body의 `userId`가 아니라 `req.user.id` 기준으로 처리함.
- 자기 자신에게 친구 요청을 보낼 수 없음.
- A→B와 B→A 중복 pending/accepted 관계를 service 계층에서 차단함.
- 친구 요청 수락/거절은 요청 수신자만 가능함.
- 응답에는 `passwordHash`, plain password, token/JWT 원문을 포함하지 않음.
- 사용자 검색 결과에는 공개 식별자인 `loginId`를 포함하되 password, token/JWT, `passwordHash`는 포함하지 않음.

#### 6.8.1 친구 추가 대상 검색

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/users/search?keyword=...` |
| 인증 | 필요 |
| 설명 | 닉네임 또는 아이디 일부로 친구 추가 대상을 검색함 |

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `keyword` | 예 | 2~40자 검색어 |

Response `200`:

```json
{
  "users": [
    {
      "id": 2,
      "name": "학습 친구",
      "role": "USER",
      "status": "ACTIVE",
      "loginId": "study_peer",
      "profileImageUrl": null,
      "profileBackgroundUrl": null,
      "titleText": null,
      "appearance": {
        "profileImageUrl": null,
        "profileBackgroundUrl": null,
        "titleText": null,
        "equippedItems": {
          "profileImage": null,
          "profileBackground": null,
          "title": null
        }
      },
      "learningGoal": "매일 30분 복습",
      "preferredSubject": "영어",
      "relationshipStatus": "NONE",
      "friendshipId": null
    }
  ]
}
```

`relationshipStatus` 값:

| 값 | 의미 |
|---|---|
| `NONE` | 친구 관계 없음 |
| `FRIENDS` | 이미 친구 |
| `REQUEST_SENT` | 내가 보낸 요청 대기 중 |
| `REQUEST_RECEIVED` | 상대가 보낸 요청 대기 중 |
| `REQUEST_REJECTED` | 이전 요청이 거절됨. 다시 요청 가능 |

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 검색어 누락, 2자 미만, 40자 초과 |
| `401` | `UNAUTHORIZED` | 인증 실패 |

#### 6.8.2 친구 목록 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/friends` |
| 인증 | 필요 |
| 설명 | 현재 사용자의 accepted 친구 목록을 조회함 |

Response `200`:

```json
{
  "friends": [
    {
      "id": 1,
      "status": "ACCEPTED",
      "direction": "SENT",
      "createdAt": "2026-05-29T00:00:00.000Z",
      "updatedAt": "2026-05-29T01:00:00.000Z",
      "user": {
        "id": 2,
        "name": "학습 친구",
        "role": "USER",
        "status": "ACTIVE",
        "loginId": "study_peer",
        "profileImageUrl": null,
        "profileBackgroundUrl": null,
        "titleText": null,
        "appearance": {
          "profileImageUrl": null,
          "profileBackgroundUrl": null,
          "titleText": null,
          "equippedItems": {
            "profileImage": null,
            "profileBackground": null,
            "title": null
          }
        },
        "learningGoal": "매일 30분 복습",
        "preferredSubject": "영어"
      }
    }
  ],
  "onlineFriendIds": [2]
}
```

- `onlineFriendIds`는 현재 WebSocket presence registry 기준으로 온라인 상태인 친구 ID 목록임.
- 이 값은 HTTP fallback용 snapshot이며, 이후 상태 변화는 `friends.presence.updated` WebSocket event로 반영함.

#### 6.8.3 친구 요청 목록 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/friends/requests` |
| 인증 | 필요 |
| 설명 | 현재 사용자의 받은/보낸 pending 친구 요청을 조회함 |

Response `200`:

```json
{
  "requests": {
    "received": [],
    "sent": [
      {
        "id": 3,
        "status": "PENDING",
        "direction": "SENT",
        "user": {
          "id": 4,
          "name": "보상 데모 사용자",
          "role": "USER",
          "status": "ACTIVE",
          "loginId": "reward_user"
        }
      }
    ]
  }
}
```

#### 6.8.4 친구 요청 보내기

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/friends/requests` |
| 인증 | 필요 |
| 설명 | 다른 사용자에게 친구 요청을 보냄 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `userId` | number | 예 | 친구 요청 대상 사용자 ID |

Response `201`:

```json
{
  "request": {
    "id": 10,
    "status": "PENDING",
    "direction": "SENT",
    "user": {
      "id": 2,
      "name": "학습 친구"
    }
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `userId` 누락/형식 오류, 자기 자신에게 요청 |
| `404` | `NOT_FOUND` | 대상 사용자 없음 또는 비활성 사용자 |
| `409` | `CONFLICT` | 이미 친구, 이미 pending 요청 존재, 반대 방향 pending 요청 존재 |

#### 6.8.5 친구 요청 수락/거절

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/friends/requests/:requestId` |
| 인증 | 필요 |
| 설명 | 받은 친구 요청을 수락하거나 거절함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `action` | string | 예 | `ACCEPT` 또는 `REJECT` |

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | action 누락/허용값 아님 |
| `403` | `FORBIDDEN` | 요청 수신자가 아닌 사용자가 처리 시도 |
| `404` | `NOT_FOUND` | 요청 없음 |
| `409` | `CONFLICT` | 이미 처리된 요청 |

#### 6.8.6 친구 삭제

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `DELETE` |
| Endpoint | `/api/friends/:friendId` |
| 인증 | 필요 |
| 설명 | 현재 사용자와 `friendId` 사이의 accepted 친구 관계만 삭제함 |

Response `200`:

```json
{
  "message": "Friend removed successfully",
  "friendship": {
    "id": 1,
    "status": "ACCEPTED",
    "user": {
      "id": 2,
      "name": "학습 친구"
    }
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `friendId` 형식 오류 |
| `404` | `NOT_FOUND` | accepted 친구 관계 없음 |

### 6.6 Direct Message API

친구 간 쪽지 API는 인증된 사용자만 사용할 수 있으며, `ACCEPTED` 친구 관계가 있는 사용자끼리만 1:1 thread를 생성하고 메시지를 전송할 수 있음. 모든 응답은 `passwordHash`, JWT token, secret 값을 반환하지 않음.

#### 6.6.1 쪽지 thread 목록 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/messages/threads` |
| 인증 | 필요 |
| 설명 | 현재 사용자가 참여 중인 쪽지 thread 목록과 unread count를 조회함 |

Response `200`:

```json
{
  "threads": [
    {
      "id": 1,
      "participantIds": [1, 2],
      "friend": {
        "id": 2,
        "name": "학습 친구",
        "loginId": "study_peer"
      },
      "lastMessage": {
        "id": 10,
        "threadId": 1,
        "senderId": 2,
        "content": "오늘 복습할까요?",
        "createdAt": "2026-05-30T12:00:00.000Z"
      },
      "unreadCount": 1,
      "lastMessageAt": "2026-05-30T12:00:00.000Z"
    }
  ]
}
```

#### 6.6.2 쪽지 thread 상세 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/messages/threads/:threadId` |
| 인증 | 필요 |
| 설명 | 현재 사용자가 참여 중인 쪽지 thread의 메시지 목록을 조회함 |

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `threadId` 형식 오류 |
| `403` | `FORBIDDEN` | thread 참여자가 아닌 사용자가 접근 |
| `404` | `NOT_FOUND` | thread 없음 |

#### 6.6.3 쪽지 thread 생성

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/messages/threads` |
| 인증 | 필요 |
| 설명 | accepted 친구와 1:1 쪽지 thread를 생성하거나 기존 thread를 반환함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `friendId` | number | 예 | 대화할 accepted 친구 사용자 ID |

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `friendId` 누락/형식 오류, 자기 자신 지정 |
| `403` | `FORBIDDEN` | accepted 친구 관계가 없음 |

#### 6.6.4 쪽지 전송

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/messages/threads/:threadId/messages` |
| 인증 | 필요 |
| 설명 | thread 참여자가 친구에게 쪽지를 전송함. 성공 시 `directMessage.created` WebSocket event를 thread 참여자에게만 발행함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `content` | string | 예 | 1~1000자 쪽지 본문 |

Response `201`:

```json
{
  "message": {
    "id": 10,
    "threadId": 1,
    "senderId": 1,
    "sender": {
      "id": 1,
      "name": "나",
      "loginId": "me"
    },
    "content": "오늘 복습할까요?",
    "createdAt": "2026-05-30T12:00:00.000Z"
  },
  "thread": {
    "id": 1,
    "friend": {
      "id": 2,
      "name": "학습 친구",
      "loginId": "study_peer"
    },
    "unreadCount": 0
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `threadId` 형식 오류, `content` 누락/공백/1000자 초과 |
| `403` | `FORBIDDEN` | thread 참여자가 아니거나 accepted 친구 관계가 사라짐 |
| `404` | `NOT_FOUND` | thread 없음 |

#### 6.6.5 쪽지 thread 읽음 처리

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/messages/threads/:threadId/read` |
| 인증 | 필요 |
| 설명 | 현재 사용자의 thread 읽음 시각을 저장함. 성공 시 `directMessage.read` WebSocket event를 thread 참여자에게만 발행함 |

Response `200`:

```json
{
  "read": {
    "threadId": 1,
    "userId": 1,
    "lastReadAt": "2026-05-30T12:01:00.000Z"
  },
  "thread": {
    "id": 1,
    "unreadCount": 0
  }
}
```

정책:

- 쪽지 thread는 `participantAId`, `participantBId` 정렬 pair로 unique 처리하여 중복 생성을 방지함.
- 메시지 전송 API는 body의 `userId`를 신뢰하지 않고 `req.user.id`를 sender로 사용함.
- WebSocket payload에는 thread ID, friend public profile, message preview 수준 정보만 포함하고 비밀번호 hash, token, secret 값을 포함하지 않음.
- WebSocket 연결 실패 시 프론트엔드는 `GET /api/messages/threads` 및 `GET /api/messages/threads/:threadId` HTTP fallback으로 다시 조회함.

---

## 7. Schedule/Task API

학습 일정과 칸반 태스크 API는 모두 인증이 필요함. 로그인한 사용자는 자신의 일정과 태스크만 조회, 수정, 삭제할 수 있음.

프론트엔드 화면 연동은 후속 작업임.

### 7.1 학습 일정 목록 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/schedules` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 학습 일정 목록을 조회함 |

Response 예시:

```json
{
  "schedules": [
    {
      "id": 1,
      "userId": 1,
      "title": "기말고사 수학 공부",
      "subject": "수학",
      "startAt": "2026-06-01T09:00:00.000Z",
      "endAt": "2026-06-01T10:00:00.000Z",
      "priority": "HIGH",
      "memo": "1단원 복습",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

### 7.2 학습 일정 생성

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/schedules` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자 기준으로 학습 일정을 생성함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | string | 예 | 일정 제목 |
| `startAt` | datetime string | 예 | 시작 시간 |
| `subject` | string 또는 null | 아니오 | 과목 |
| `endAt` | datetime string 또는 null | 아니오 | 종료 시간 |
| `priority` | `LOW` / `MEDIUM` / `HIGH` | 아니오 | 우선순위 |
| `memo` | string 또는 null | 아니오 | 메모 |

Request 예시:

```json
{
  "title": "기말고사 수학 공부",
  "subject": "수학",
  "startAt": "2026-06-01T09:00:00.000Z",
  "endAt": "2026-06-01T10:00:00.000Z",
  "priority": "HIGH",
  "memo": "1단원 복습"
}
```

Response 예시:

```json
{
  "schedule": {
    "id": 1,
    "userId": 1,
    "title": "기말고사 수학 공부",
    "subject": "수학",
    "startAt": "2026-06-01T09:00:00.000Z",
    "endAt": "2026-06-01T10:00:00.000Z",
    "priority": "HIGH",
    "memo": "1단원 복습",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.3 학습 일정 상세 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/schedules/:scheduleId` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 특정 학습 일정을 조회함 |

Response 예시:

```json
{
  "schedule": {
    "id": 1,
    "userId": 1,
    "title": "기말고사 수학 공부",
    "subject": "수학",
    "startAt": "2026-06-01T09:00:00.000Z",
    "endAt": "2026-06-01T10:00:00.000Z",
    "priority": "HIGH",
    "memo": "1단원 복습",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z",
    "tasks": []
  }
}
```

### 7.4 학습 일정 수정

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/schedules/:scheduleId` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 특정 학습 일정을 수정함 |

Request 예시:

```json
{
  "title": "수학 오답 정리",
  "priority": "MEDIUM"
}
```

Response 예시:

```json
{
  "schedule": {
    "id": 1,
    "userId": 1,
    "title": "수학 오답 정리",
    "subject": "수학",
    "startAt": "2026-06-01T09:00:00.000Z",
    "endAt": "2026-06-01T10:00:00.000Z",
    "priority": "MEDIUM",
    "memo": "1단원 복습",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.5 학습 일정 삭제

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `DELETE` |
| Endpoint | `/api/schedules/:scheduleId` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 특정 학습 일정을 삭제함 |

Response 예시:

```json
{
  "schedule": {
    "id": 1,
    "userId": 1,
    "title": "수학 오답 정리",
    "subject": "수학",
    "startAt": "2026-06-01T09:00:00.000Z",
    "endAt": "2026-06-01T10:00:00.000Z",
    "priority": "MEDIUM",
    "memo": "1단원 복습",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.6 태스크 목록 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/tasks` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 칸반 태스크 목록을 조회함 |

Query:

| 필드 | 필수 | 설명 |
|---|---|---|
| `scheduleId` | 아니오 | 특정 일정에 연결된 태스크만 조회 |

Response 예시:

```json
{
  "tasks": [
    {
      "id": 1,
      "userId": 1,
      "scheduleId": 1,
      "title": "수학 문제집 풀기",
      "status": "TODO",
      "dueDate": "2026-06-02T09:00:00.000Z",
      "priority": "HIGH",
      "memo": "1~10번",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

### 7.7 태스크 생성

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/tasks` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자 기준으로 칸반 태스크를 생성함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | string | 예 | 태스크 제목 |
| `scheduleId` | number 또는 null | 아니오 | 연결할 학습 일정 ID |
| `status` | `TODO` / `IN_PROGRESS` / `DONE` | 아니오 | 태스크 상태 |
| `dueDate` | datetime string 또는 null | 아니오 | 마감일 |
| `priority` | `LOW` / `MEDIUM` / `HIGH` | 아니오 | 우선순위 |
| `memo` | string 또는 null | 아니오 | 메모 |

Request 예시:

```json
{
  "title": "수학 문제집 풀기",
  "scheduleId": 1,
  "dueDate": "2026-06-02T09:00:00.000Z",
  "priority": "HIGH",
  "memo": "1~10번"
}
```

Response 예시:

```json
{
  "task": {
    "id": 1,
    "userId": 1,
    "scheduleId": 1,
    "title": "수학 문제집 풀기",
    "status": "TODO",
    "dueDate": "2026-06-02T09:00:00.000Z",
    "priority": "HIGH",
    "memo": "1~10번",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.8 태스크 수정

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/tasks/:taskId` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 특정 태스크를 수정함 |

Request 예시:

```json
{
  "title": "수학 문제집 오답 정리",
  "scheduleId": null,
  "memo": null
}
```

Response 예시:

```json
{
  "task": {
    "id": 1,
    "userId": 1,
    "scheduleId": null,
    "title": "수학 문제집 오답 정리",
    "status": "TODO",
    "dueDate": "2026-06-02T09:00:00.000Z",
    "priority": "HIGH",
    "memo": null,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.9 태스크 상태 변경

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/tasks/:taskId/status` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 특정 태스크 상태를 변경함 |

Request 예시:

```json
{
  "status": "IN_PROGRESS"
}
```

Response 예시:

```json
{
  "task": {
    "id": 1,
    "userId": 1,
    "scheduleId": 1,
    "title": "수학 문제집 풀기",
    "status": "IN_PROGRESS",
    "dueDate": "2026-06-02T09:00:00.000Z",
    "priority": "HIGH",
    "memo": "1~10번",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.10 태스크 삭제

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `DELETE` |
| Endpoint | `/api/tasks/:taskId` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자의 특정 태스크를 삭제함 |

Response 예시:

```json
{
  "task": {
    "id": 1,
    "userId": 1,
    "scheduleId": 1,
    "title": "수학 문제집 풀기",
    "status": "DONE",
    "dueDate": "2026-06-02T09:00:00.000Z",
    "priority": "HIGH",
    "memo": "1~10번",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

### 7.11 Schedule/Task 주요 에러

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락, 잘못된 날짜, 잘못된 enum 값, 허용되지 않은 필드 |
| `401` | `UNAUTHORIZED` | 인증 실패 |
| `404` | `NOT_FOUND` | 본인 소유가 아닌 일정/태스크 또는 존재하지 않는 데이터 |

---

## 8. 개발용 seed 데이터

개발용 seed script는 로컬 개발과 테스트 편의를 위한 기본 사용자 데이터를 생성하거나 갱신함.

실행 명령:

```bash
npm run seed:dev
```

생성 또는 갱신되는 개발용 데이터:

| 구분 | Login ID | Role | UserProfile |
|---|---|---|---|
| 일반 사용자 | `dev_user` | `USER` | 생성 또는 갱신 |
| 관리자 사용자 | `admin_user` | `ADMIN` | 생성 또는 갱신 |

주의:

- seed 계정의 실제 비밀번호는 문서에 작성하지 않음.
- DB에는 plain password를 저장하지 않고 bcrypt 기반 `passwordHash`를 저장함.
- production DB에서 실행 금지.
- 개인 dev branch 또는 `dev-main`처럼 개발용 branch에서만 실행함.
- 실제 DB URL, password, host, API key는 문서에 작성하지 않음.

---

## 9. 구현 및 예정 API

이 섹션은 현재 구현 완료된 후속 API와 아직 구현되지 않은 예정 API를 함께 정리함. 상태가 `구현 완료`인 API는 현재 Express route/controller/service 기준이며, 상태가 `예정`인 API는 후속 구현을 위한 초안임.

### 9.1 학습 노트 API

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| 인증 | 필요 (`USER`, `ADMIN`) |
| 설명 | 로그인 사용자 본인의 학습 노트 생성, 조회, 수정, 삭제 기능 제공 |

공통 정책:

- 모든 학습 노트 API는 JWT 인증이 필요함.
- 현재 사용자는 `req.user` 기준으로 식별함.
- `userId`를 request body로 받거나 신뢰하지 않음.
- `noteId`는 양의 정수만 허용하며 숫자가 아니거나 0 이하이면 `400 VALIDATION_ERROR`를 반환함.
- 존재하지 않는 노트 또는 다른 사용자 소유 노트는 소유권 노출을 줄이기 위해 `404 NOT_FOUND`로 처리함.
- 응답에는 `passwordHash`, password, token 원문을 포함하지 않음.
- `tags`는 Prisma schema 기준 `String[]`이며, 문자열 배열만 허용함.

#### 9.1.1 학습 노트 생성

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/notes` |
| 인증 | 필요 |
| 설명 | 사용자 본인의 학습 노트를 생성함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | string | 예 | 노트 제목 |
| `content` | string | 예 | 노트 본문 내용 |
| `subject` | string 또는 null | 아니오 | 과목 명 |
| `tags` | string[] | 아니오 | 태그 배열. 생략 시 빈 배열 저장 |

Request 예시:

```json
{
  "title": "운영체제 핵심 요약",
  "content": "프로세스와 스레드의 차이점...",
  "subject": "CS",
  "tags": ["OS", "면접준비"]
}
```

Response (201 Created) 예시:

```json
{
  "note": {
    "id": 1,
    "userId": 1,
    "title": "운영체제 핵심 요약",
    "content": "프로세스와 스레드의 차이점...",
    "subject": "CS",
    "tags": ["OS", "면접준비"],
    "createdAt": "2026-05-25T12:00:00.000Z",
    "updatedAt": "2026-05-25T12:00:00.000Z"
  }
}
```

#### 9.1.2 내 학습 노트 목록 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/notes` |
| 인증 | 필요 |
| 설명 | 로그인한 사용자가 작성한 전체 노트 목록 조회 |

Response (200 OK) 예시:

```json
{
  "notes": [
    {
      "id": 1,
      "userId": 1,
      "title": "운영체제 핵심 요약",
      "content": "프로세스와 스레드의 차이점...",
      "subject": "CS",
      "tags": ["OS", "면접준비"],
      "createdAt": "2026-05-25T12:00:00.000Z",
      "updatedAt": "2026-05-25T12:00:00.000Z"
    }
  ]
}
```

#### 9.1.3 학습 노트 상세 조회

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `GET` |
| Endpoint | `/api/notes/:noteId` |
| 인증 | 필요 |
| 설명 | 특정 노트의 상세 정보를 조회함 (작성자 본인만 접근 가능) |

Response (200 OK) 예시:

```json
{
  "note": {
    "id": 1,
    "userId": 1,
    "title": "운영체제 핵심 요약",
    "content": "프로세스와 스레드의 차이점...",
    "subject": "CS",
    "tags": ["OS", "면접준비"],
    "createdAt": "2026-05-25T12:00:00.000Z",
    "updatedAt": "2026-05-25T12:00:00.000Z"
  }
}
```

#### 9.1.4 학습 노트 수정

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `PATCH` |
| Endpoint | `/api/notes/:noteId` |
| 인증 | 필요 |
| 설명 | 특정 노트를 수정함 (작성자 본인만 접근 가능) |

Request Body:

| 필드 | 타입 | 설명 |
|---|---|---|
| `title` | string | 수정할 제목 |
| `content` | string | 수정할 내용 |
| `subject` | string 또는 null | 수정할 과목 |
| `tags` | string[] | 수정할 태그 배열 |

수정 요청은 위 필드 중 최소 1개 이상을 포함해야 함. 빈 body, 허용되지 않은 필드, 빈 문자열 `title`/`content`, 문자열 배열이 아닌 `tags`는 `400 VALIDATION_ERROR`로 처리함.

Request 예시:

```json
{
  "title": "운영체제 심화 요약",
  "tags": ["OS", "면접준비", "심화"]
}
```

Response (200 OK) 예시:

```json
{
  "note": {
    "id": 1,
    "userId": 1,
    "title": "운영체제 심화 요약",
    "content": "프로세스와 스레드의 차이점...",
    "subject": "CS",
    "tags": ["OS", "면접준비", "심화"],
    "createdAt": "2026-05-25T12:00:00.000Z",
    "updatedAt": "2026-05-25T12:30:00.000Z"
  }
}
```

#### 9.1.5 학습 노트 삭제

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `DELETE` |
| Endpoint | `/api/notes/:noteId` |
| 인증 | 필요 |
| 설명 | 특정 노트를 삭제함 (작성자 본인만 접근 가능) |

Response (200 OK) 예시:

```json
{
  "message": "Study note deleted successfully"
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락, 빈 수정 body, 잘못된 `noteId`, 허용되지 않은 필드, 잘못된 필드 타입 |
| `401` | `UNAUTHORIZED` | 인증 헤더 없음, Bearer token 없음, token 검증 실패 |
| `404` | `NOT_FOUND` | 노트가 존재하지 않거나 현재 사용자 소유 노트가 아님 |

### 9.2 AI 학습 지원 API

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Base Path | `/api/ai` |
| 인증 | 모든 엔드포인트 JWT 필요 |
| 프론트 연동 | AI 학습 지원 화면 연결 완료 |
| 외부 연동 | Google Generative Language API (`gemini-2.5-flash`, `.env`의 `AI_MODEL_NAME`으로 변경 가능) |
| 환경 변수 | `AI_API_KEY`(외부 provider 호출 시 필요), `AI_MODEL_NAME`(선택) |
| 속도 제한 | 사용자별 분당 최대 5회 |
| Fallback | API Key 미설정 또는 외부 호출 실패 시 Simulated 응답 (CI·오프라인 테스트용) |

보완 기준:

- `AI_API_KEY`는 백엔드 `.env`에서만 사용하고, 프론트엔드/문서/로그에는 실제 값을 노출하지 않음.
- 프론트엔드는 외부 AI provider를 직접 호출하지 않고 백엔드 `/api/ai/*` API만 호출함.
- `AI_API_KEY`가 없거나 provider 호출이 실패해도 서버가 중단되지 않고 fallback 응답을 반환함.
- 자동 테스트는 mock/fallback 중심으로 수행하며 실제 외부 AI API를 호출하지 않음.
- rate limit은 MVP용 in-memory 방식이며, production 수준 분산 rate limit은 후속 개선 범위임.
- AI MVP API는 기존 Prisma schema 기준으로 동작하며 schema/migration 변경 없음.
- `noteId`를 받는 API는 현재 로그인 사용자 소유 학습 노트만 허용함.
- invalid `noteId`는 `400 VALIDATION_ERROR`, 존재하지 않거나 다른 사용자 소유 `noteId`는 `404 NOT_FOUND`로 처리함.
- 기본 provider prompt와 fallback 문구는 한국어 응답을 우선하도록 정리함.
- 다국어 지원은 현재 핵심 구현 범위가 아니며, 기능 구현 후 UI/UX 단계에서 후속 검토함.

공통 입력 규칙:

| 항목 | 내용 |
|---|---|
| 질문/문제/답안 최대 길이 | 1,000자 (`question`, `problem`, `userAnswer`) |
| 요약 본문 최대 길이 | 3,000자 (`content`) |
| 초과 시 기본 동작 | `400 VALIDATION_ERROR` (`details.currentLength`, `details.maxLength` 포함) |
| 초과 시 선택 동작 | `allowTruncate: true`이면 한도까지만 잘라 AI 호출, 응답에 `isTruncated: true` |

### 9.2.1 AI 질문 및 응답

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/ai/questions` |
| 인증 | 필요 |
| 설명 | 사용자의 학습 관련 질문을 Gemini에 보내 답변을 받고, `AIQuestion`에 저장한 뒤 반환함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `question` | string | 예 | 질문 내용 (최대 1,000자) |
| `noteId` | number 또는 null | 아니오 | 관련 학습 노트 ID |
| `allowTruncate` | boolean | 아니오 | `true`이면 1,000자 초과 시 앞부분만 사용 |

Request 예시:

```json
{
  "question": "Python에서 리스트와 튜플의 차이점은?",
  "noteId": null
}
```

Response 예시:

```json
{
  "question": {
    "id": 1,
    "userId": 1,
    "noteId": null,
    "question": "Python에서 리스트와 튜플의 차이점은?",
    "answer": "파이썬에서 리스트와 튜플은 모두 여러 값을 저장하지만, 가장 큰 차이점은 변경 가능성입니다. 리스트는 가변(mutable)이고 튜플은 불변(immutable)입니다.",
    "subject": null,
    "createdAt": "2026-05-24T12:00:00.000Z",
    "isTruncated": false,
    "originalLength": 23,
    "maxLength": 1000
  }
}
```

### 9.2.2 학습 추천 생성

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/ai/recommendations` |
| 인증 | 필요 |
| 설명 | 현재 사용자의 학습 일정(최근 5개)과 칸반 태스크(최근 10개)를 분석해 맞춤 팁·추천 과목을 생성하고 `AIRecommendation`에 저장한 뒤 반환함 |

Request Body: 없음

Response 예시:

```json
{
  "recommendation": {
    "id": 1,
    "userId": 1,
    "basisJson": {
      "scheduleCount": 2,
      "taskCount": 2,
      "recentSchedules": [
        { "title": "Math study", "subject": "Math" }
      ],
      "recentTasks": [
        { "title": "Solve algebra", "status": "TODO" }
      ]
    },
    "recommendationJson": {
      "tips": [
        "집중력이 좋은 오전 시간에 Algebra 공부를 배치하세요.",
        "미완료된 태스크(Solve algebra)를 오늘 완료하는 것을 최우선으로 잡으세요."
      ],
      "recommendedSubject": "Math 복습 및 정리"
    },
    "createdAt": "2026-05-24T12:00:00.000Z"
  }
}
```

### 9.2.3 텍스트 요약

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/ai/summary` |
| 인증 | 필요 |
| 설명 | 학습용 텍스트를 3가지 핵심 불릿 포인트로 요약해 반환함 (DB 저장 없음) |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `content` | string | 예 | 요약할 텍스트 본문 (최대 3,000자) |
| `allowTruncate` | boolean | 아니오 | `true`이면 3,000자 초과 시 앞부분만 사용 |

Request 예시:

```json
{
  "content": "운영체제(OS)는 컴퓨터 하드웨어와 사용자 사이에서 인터페이스 역할을 하는 시스템 소프트웨어입니다."
}
```

Response 예시:

```json
{
  "summary": "- 운영체제(OS)는 컴퓨터 하드웨어와 사용자 간의 인터페이스 역할을 함\n- 프로세스, 메모리, 파일 시스템, 입출력 장치 등 컴퓨터 자원을 관리함\n- 시스템 소프트웨어로서 전반적인 하드웨어 자원의 효율적인 분배를 담당함",
  "isTruncated": false,
  "originalLength": 59,
  "maxLength": 3000
}
```

### 9.2.4 오답노트 및 취약점 분석

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/ai/wrong-answers` |
| 인증 | 필요 |
| 설명 | 오답 문항과 사용자 답안을 분석해 해설·취약 유형을 도출하고 `WrongAnswerNote`에 저장한 뒤 반환함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `problem` | string | 예 | 오답 문제 본문 (최대 1,000자) |
| `userAnswer` | string 또는 null | 아니오 | 사용자가 적었던 틀린 답안 (최대 1,000자) |
| `noteId` | number 또는 null | 아니오 | 관련 학습 노트 ID |
| `allowTruncate` | boolean | 아니오 | `true`이면 문제/답안을 각각 1,000자까지만 사용 |

Request 예시:

```json
{
  "problem": "x + 5 = 12 일 때, x의 값을 구하시오.",
  "userAnswer": "x = 8",
  "noteId": null
}
```

Response 예시:

```json
{
  "wrongAnswerNote": {
    "id": 1,
    "userId": 1,
    "noteId": null,
    "problem": "x + 5 = 12 일 때, x의 값을 구하시오.",
    "userAnswer": "x = 8",
    "explanation": "[연산 실수 분석] x + 5 = 12에서 양변에 5를 빼면 x = 7입니다. 8로 답을 도출한 것은 단순 덧셈/뺄셈 계산에서의 연산 실수입니다.",
    "weakType": "연산 실수",
    "createdAt": "2026-05-24T12:00:00.000Z",
    "isProblemTruncated": false,
    "originalProblemLength": 15,
    "maxLength": 1000
  }
}
```

### 9.2.5 AI API 주요 에러

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수 값 누락, 글자 수 초과, 잘못된 데이터 구조 |
| `401` | `UNAUTHORIZED` | 인증 실패 및 토큰 유효하지 않음 |
| `404` | `NOT_FOUND` | `noteId`가 존재하지 않거나 현재 사용자 소유 학습 노트가 아님 |
| `429` | `TOO_MANY_REQUESTS` | 분당 호출 횟수 한도(5회) 초과 |

### 9.3 집중 시간/통계 API

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| 기본 namespace | `/api` |
| 인증 | 필요 |
| 관련 요구사항 | `FR-15`, `FR-16`, `FR-17`, `UC-11`, `UC-12` |
| 사용 모델 | `FocusSession`, `StudyTask` |
| 구현 범위 | 완료된 집중 세션 기록/조회, 기간별 학습 시간 요약, 기간별 히트맵 데이터 조회 |
| 제외 범위 | 앱 차단/방해금지 권한 제어, 진행 중 타이머 상태 관리, 프론트 타이머/통계 시각화 화면 |

공통 정책:

- 모든 Focus/Statistics API는 인증이 필요함.
- 현재 사용자는 request body나 query의 `userId`가 아니라 `req.user.id` 기준으로 처리함.
- `durationMs`는 클라이언트가 측정한 최종 순공 시간이며 millisecond 단위 positive integer만 허용함.
- 서버는 `startedAt < endedAt`을 검증하지만, 일시정지/재개를 포함한 순공 시간 측정 가능성을 고려해 `durationMs`와 `endedAt - startedAt`의 완전 일치를 강제하지 않음.
- 날짜/시간 값은 ISO timestamp를 권장함.
- `startDate`, `endDate` query에 `YYYY-MM-DD` 형식만 전달하면 UTC 기준 해당 날짜 전체를 포함함.
  - 예: `endDate=2026-05-31`은 `2026-05-31T23:59:59.999Z`까지 포함함.
- 히트맵의 날짜 key는 서버에서 `startedAt`의 UTC 날짜(`YYYY-MM-DD`) 기준으로 그룹핑함.
- KST 등 사용자 현지 시간대 기준 시각화는 프론트 또는 후속 통계 고도화에서 별도 보정이 필요함.
- `taskId`를 전달하면 현재 사용자 소유 `StudyTask`인지 확인하며, 없거나 타 사용자 소유이면 404로 처리함.
- 응답에는 `passwordHash`, password, token/JWT 등 민감정보를 포함하지 않음.

#### 9.3.1 집중 세션 기록

`POST /api/focus-sessions`

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `taskId` | number 또는 null | 아니오 | 연결할 학습 태스크 ID. 현재 사용자 소유 태스크만 허용 |
| `startedAt` | string | 예 | 집중 시작 시각. ISO timestamp 권장 |
| `endedAt` | string | 예 | 집중 종료 시각. `startedAt`보다 늦어야 함 |
| `durationMs` | number | 예 | 클라이언트가 측정한 최종 순공 시간(ms) |
| `memo` | string 또는 null | 아니오 | 집중 세션 메모 |

Response `201`:

```json
{
  "focusSession": {
    "id": 1,
    "userId": 1,
    "taskId": 10,
    "startedAt": "2026-05-28T01:00:00.000Z",
    "endedAt": "2026-05-28T02:00:00.000Z",
    "durationMs": 3600000,
    "memo": "Deep focus",
    "createdAt": "2026-05-28T02:00:10.000Z"
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 필수값 누락, 잘못된 날짜, `durationMs`가 positive integer가 아님, 지원하지 않는 body field 포함 |
| `401` | `UNAUTHORIZED` | 인증 실패 |
| `404` | `NOT_FOUND` | `taskId`가 존재하지 않거나 현재 사용자 소유가 아님 |

#### 9.3.2 집중 세션 목록 조회

`GET /api/focus-sessions`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `startDate` | 조건부 | 기간 조회 시작일 또는 시작 시각. `endDate`와 함께 전달 |
| `endDate` | 조건부 | 기간 조회 종료일 또는 종료 시각. `startDate`와 함께 전달 |

Response `200`:

```json
{
  "focusSessions": [
    {
      "id": 1,
      "userId": 1,
      "taskId": 10,
      "startedAt": "2026-05-28T01:00:00.000Z",
      "endedAt": "2026-05-28T02:00:00.000Z",
      "durationMs": 3600000,
      "memo": "Deep focus",
      "createdAt": "2026-05-28T02:00:10.000Z"
    }
  ]
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `startDate`/`endDate` 중 하나만 전달, 잘못된 날짜, 시작일이 종료일보다 늦음, 지원하지 않는 query field 포함 |
| `401` | `UNAUTHORIZED` | 인증 실패 |

#### 9.3.3 학습 통계 요약 조회

`GET /api/statistics/summary`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `startDate` | 예 | 기간 조회 시작일 또는 시작 시각 |
| `endDate` | 예 | 기간 조회 종료일 또는 종료 시각 |

Response `200`:

```json
{
  "summary": {
    "totalMinutes": 120,
    "completionRate": 67,
    "sessionCount": 2,
    "taskCount": 3
  }
}
```

계산 기준:

- `totalMinutes`: 기간 내 현재 사용자 `FocusSession.durationMs` 합계를 분 단위로 내림 변환함.
- `completionRate`: 기간 내 현재 사용자 `StudyTask` 중 `DONE` 상태 비율을 정수 percent로 반올림함.
- `sessionCount`: 기간 내 현재 사용자 집중 세션 수.
- `taskCount`: 기간 내 현재 사용자 태스크 수.
- 데이터가 없으면 `totalMinutes: 0`, `completionRate: 0`, `sessionCount: 0`, `taskCount: 0`을 반환함.

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 날짜 누락, 잘못된 날짜, 시작일이 종료일보다 늦음, 지원하지 않는 query field 포함 |
| `401` | `UNAUTHORIZED` | 인증 실패 |

#### 9.3.4 학습 히트맵 조회

`GET /api/statistics/heatmap`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `startDate` | 예 | 기간 조회 시작일 또는 시작 시각 |
| `endDate` | 예 | 기간 조회 종료일 또는 종료 시각 |

Response `200`:

```json
{
  "heatmap": {
    "2026-05-28": {
      "durationMs": 5400000,
      "sessionCount": 2
    }
  }
}
```

계산 기준:

- 현재 사용자 집중 세션만 집계함.
- 날짜 key는 `startedAt`의 UTC 날짜(`YYYY-MM-DD`) 기준임.
- 같은 날짜의 `durationMs`를 합산하고 `sessionCount`를 누적함.
- 데이터가 없으면 빈 객체 `{}`를 반환함.

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 날짜 누락, 잘못된 날짜, 시작일이 종료일보다 늦음, 지원하지 않는 query field 포함 |
| `401` | `UNAUTHORIZED` | 인증 실패 |

### 9.4 커뮤니티/게시판 API

| 항목 | 내용 |
|---|---|
| 상태 | 1차 게시글 CRUD, 댓글 API, 반응/북마크 API, 사용자 신고 API, 관리자 신고 조회/처리 API 구현 완료 |
| 기본 namespace | `/api/community` |
| 인증 | 필요 (`Authorization: Bearer <JWT_TOKEN>`) |
| 사용 모델 | `BoardPost`, `PostCategory`, `Comment`, `ReactionType`, `CommunityReaction`, `CommunityBookmark`, `CommunityReport` |
| 1차 범위 | 게시글 목록/상세/작성/수정/삭제, 댓글 목록/작성/수정/삭제, 게시글 반응 생성/전환/취소, 게시글 북마크 생성/취소, 내 북마크 목록 조회, 게시글/댓글 사용자 신고 생성, pagination, category filter, 게시글 title/content 검색, 게시글 최신순/오래된순 정렬 |
| 제외 범위 | 답글, 프론트 화면, seed 데이터 |

커뮤니티 게시글 API는 `routes → controllers → services → repositories → Prisma` 구조로 구현함. 기존 DB 과제 커뮤니티 레포의 기능 흐름과 정보 구조는 참고하지만, 기존 코드와 static HTML/CSS/Vanilla JS UI는 복사하지 않음.

공통 정책:

- 모든 게시글/댓글 API는 인증이 필요함.
- 게시글 작성자와 댓글 작성자는 request body의 `userId`가 아니라 `req.user.id` 기준으로 저장함.
- `postId`, `commentId`, `page`, `pageSize`는 positive integer로 검증함.
- `category`는 `QUESTION`, `FREE`, `STUDY_PROOF` 중 하나만 허용함.
- 게시글 목록 `search`는 `title`, `content`에 대해 대소문자 구분 없이 포함 검색을 수행함.
- `search`가 제공되었으나 trim 결과가 빈 문자열이거나 100자를 초과하면 `400 VALIDATION_ERROR`로 처리함.
- 게시글 목록 `sort`는 `latest`(최신순, 기본값)와 `oldest`(오래된순)만 허용함.
- 댓글 목록 정렬은 오래된순(`createdAt asc`) 고정임.
- viewCount, reaction, bookmark, comment count 기반 정렬은 후속 범위로 둠.
- 게시글 상세 조회는 인증된 사용자라면 작성자가 아니어도 가능하며, 존재하지 않는 게시글은 404로 처리함.
- 게시글 수정/삭제는 작성자 본인만 가능하며, 타 사용자 게시글 또는 존재하지 않는 게시글 수정/삭제는 404로 처리함.
- 댓글 목록/작성은 대상 게시글 존재 여부를 먼저 확인하며, 존재하지 않는 게시글은 404로 처리함.
- 댓글 수정/삭제는 작성자 본인만 가능하며, 타 사용자 댓글 또는 존재하지 않는 댓글 수정/삭제는 404로 처리함.
- 반응은 `LIKE`, `DISLIKE`만 허용하며, 사용자 1명은 게시글 1개에 반응 1개만 가질 수 있음.
- 같은 반응을 다시 요청하면 중복 row를 만들지 않고 현재 반응을 유지하며, 다른 반응을 요청하면 기존 반응 type을 전환함.
- 반응 취소는 현재 사용자 본인의 반응만 삭제하며, 반응이 없으면 404로 처리함.
- 북마크는 사용자 1명당 게시글 1개에 1개만 가질 수 있음.
- 같은 게시글을 다시 북마크해도 중복 row를 만들지 않고 현재 북마크를 유지함.
- 북마크 취소는 현재 사용자 본인의 북마크만 삭제하며, 북마크가 없으면 404로 처리함.
- 게시글 목록/상세 응답에는 `likeCount`, `dislikeCount`, `bookmarkCount`, `myReaction`, `isBookmarked`를 포함함.
- `myReaction`과 `isBookmarked`는 현재 인증 사용자 기준으로 계산하며, 다른 사용자의 반응/북마크는 count에만 반영함.
- 게시글/댓글 신고는 `CommunityReport`에 `PENDING` 상태로 저장하며, 신고자는 `req.user.id` 기준으로 처리함.
- 같은 사용자가 같은 게시글 또는 댓글을 다시 신고하면 `409 CONFLICT`로 처리함.
- 신고 생성 시 기존 관리자 호환을 위해 대상 `BoardPost.reported` 또는 `Comment.reported`를 `true`로 갱신함.
- 응답에는 `passwordHash`, password, token 등 불필요한 민감정보를 포함하지 않음.
- 게시글 삭제 시 현재 schema의 `Comment` relation에 cascade가 없으므로, 작성자 소유 게시글 확인 후 연결 댓글을 먼저 삭제하고 게시글을 삭제함.

#### 9.4.1 게시글 목록 조회

`GET /api/community/posts`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `page` | 선택 | positive integer, 기본값 `1` |
| `pageSize` | 선택 | positive integer, 기본값 `10`, 최대 `50` |
| `category` | 선택 | `QUESTION`, `FREE`, `STUDY_PROOF` 중 하나 |
| `search` | 선택 | `title`, `content`, 작성자 `name` 대상 포함 검색. trim 후 빈 문자열 또는 100자 초과는 400 |
| `sort` | 선택 | `latest`, `oldest`, `likes`, `views`, `comments` 중 하나. 기본값 `latest` |

Response `200`:

```json
{
  "posts": [
    {
      "id": 1,
      "userId": 1,
      "category": "QUESTION",
      "title": "학습 질문",
      "content": "문제 풀이 질문입니다.",
      "viewCount": 0,
      "createdAt": "2026-05-26T00:00:00.000Z",
      "updatedAt": "2026-05-26T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "사용자 이름"
      },
      "commentCount": 0,
      "likeCount": 0,
      "dislikeCount": 0,
      "bookmarkCount": 0,
      "myReaction": null,
      "isBookmarked": false
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Error:

- `400`: invalid `page`, `pageSize`, `category`, `search`, `sort`
- `401`: 인증 token 없음 또는 유효하지 않음

#### 9.4.2 게시글 생성

`POST /api/community/posts`

Request body:

```json
{
  "category": "QUESTION",
  "title": "학습 질문",
  "content": "문제 풀이 질문입니다."
}
```

Response `201`:

```json
{
  "post": {
    "id": 1,
    "userId": 1,
    "category": "QUESTION",
    "title": "학습 질문",
      "content": "문제 풀이 질문입니다.",
      "viewCount": 0,
      "createdAt": "2026-05-26T00:00:00.000Z",
    "updatedAt": "2026-05-26T00:00:00.000Z",
    "author": {
      "id": 1,
      "name": "사용자 이름"
    },
    "commentCount": 0
  }
}
```

Error:

- `400`: `category`, `title`, `content` 누락 또는 빈 문자열, invalid `category`, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음

#### 9.4.3 게시글 상세 조회

`GET /api/community/posts/:postId`

Response `200`:

```json
{
  "post": {
    "id": 1,
    "userId": 1,
    "category": "QUESTION",
    "title": "학습 질문",
      "content": "문제 풀이 질문입니다.",
      "viewCount": 1,
      "createdAt": "2026-05-26T00:00:00.000Z",
    "updatedAt": "2026-05-26T00:00:00.000Z",
    "author": {
      "id": 1,
      "name": "사용자 이름"
    },
    "commentCount": 0,
    "likeCount": 0,
    "dislikeCount": 0,
    "bookmarkCount": 0,
    "myReaction": null,
    "isBookmarked": false
  }
}
```

Error:

- `400`: invalid `postId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

Note:

- 상세 조회 성공 시 `viewCount`가 1 증가함.

#### 9.4.4 게시글 수정

`PATCH /api/community/posts/:postId`

Request body:

```json
{
  "category": "FREE",
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

수정 body의 `category`, `title`, `content`는 모두 선택값이지만, 최소 1개 이상의 수정 가능 field가 필요함.

Response `200`:

```json
{
  "post": {
    "id": 1,
    "userId": 1,
    "category": "FREE",
    "title": "수정된 제목",
    "content": "수정된 내용",
    "createdAt": "2026-05-26T00:00:00.000Z",
    "updatedAt": "2026-05-26T00:10:00.000Z",
    "author": {
      "id": 1,
      "name": "사용자 이름"
    },
    "commentCount": 0
  }
}
```

Error:

- `400`: invalid `postId`, 빈 body, 빈 문자열, invalid `category`, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음 또는 작성자 불일치

#### 9.4.5 게시글 삭제

`DELETE /api/community/posts/:postId`

Response `200`:

```json
{
  "message": "Community post deleted successfully"
}
```

Error:

- `400`: invalid `postId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음 또는 작성자 불일치

#### 9.4.6 댓글 목록 조회

`GET /api/community/posts/:postId/comments`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `page` | 선택 | positive integer, 기본값 `1` |
| `pageSize` | 선택 | positive integer, 기본값 `10`, 최대 `50` |

Response `200`:

```json
{
  "comments": [
    {
      "id": 1,
      "postId": 1,
      "userId": 1,
      "parentId": null,
      "content": "댓글 내용입니다.",
      "replyCount": 1,
      "likeCount": 2,
      "dislikeCount": 0,
      "myReaction": "LIKE",
      "createdAt": "2026-05-26T00:00:00.000Z",
      "updatedAt": "2026-05-26T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "사용자 이름"
      },
      "replies": [
        {
          "id": 2,
          "postId": 1,
          "userId": 2,
          "parentId": 1,
          "content": "대답글 내용입니다.",
          "replyCount": 0,
          "likeCount": 0,
          "dislikeCount": 0,
          "myReaction": null,
          "createdAt": "2026-05-26T00:01:00.000Z",
          "updatedAt": "2026-05-26T00:01:00.000Z",
          "author": {
            "id": 2,
            "name": "다른 사용자"
          },
          "replies": []
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Error:

- `400`: invalid `postId`, invalid `page`, invalid `pageSize`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

#### 9.4.7 댓글 생성

`POST /api/community/posts/:postId/comments`

Request body:

```json
{
  "content": "댓글 내용입니다.",
  "parentId": null
}
```

- `parentId`는 선택값임. 생략 또는 `null`이면 일반 댓글로 생성함.
- `parentId`에 같은 게시글의 최상위 댓글 id를 전달하면 대답글로 생성함.
- 대답글에 다시 대답글을 다는 2단 이상 nested reply는 지원하지 않음.

Response `201`:

```json
{
  "comment": {
    "id": 1,
    "postId": 1,
    "userId": 1,
    "parentId": null,
    "content": "댓글 내용입니다.",
    "replyCount": 0,
    "createdAt": "2026-05-26T00:00:00.000Z",
    "updatedAt": "2026-05-26T00:00:00.000Z",
    "author": {
      "id": 1,
      "name": "사용자 이름"
    }
  }
}
```

Error:

- `400`: invalid `postId`, invalid `parentId`, `content` 누락 또는 빈 문자열, 지원하지 않는 field 포함, 대답글에 다시 대답글 작성 시도
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음 또는 parent comment 없음

#### 9.4.8 댓글 수정

`PATCH /api/community/comments/:commentId`

Request body:

```json
{
  "content": "수정된 댓글 내용입니다."
}
```

Response `200`:

```json
{
  "comment": {
    "id": 1,
    "postId": 1,
    "userId": 1,
    "content": "수정된 댓글 내용입니다.",
    "createdAt": "2026-05-26T00:00:00.000Z",
    "updatedAt": "2026-05-26T00:10:00.000Z",
    "author": {
      "id": 1,
      "name": "사용자 이름"
    }
  }
}
```

Error:

- `400`: invalid `commentId`, 빈 body, `content` 누락 또는 빈 문자열, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 댓글 없음 또는 작성자 불일치

#### 9.4.9 댓글 삭제

`DELETE /api/community/comments/:commentId`

Response `200`:

```json
{
  "message": "Community comment deleted successfully"
}
```

Error:

- `400`: invalid `commentId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 댓글 없음 또는 작성자 불일치

#### 9.4.10 게시글 반응 생성/전환

`POST /api/community/posts/:postId/reactions`

Request body:

```json
{
  "type": "LIKE"
}
```

`type`은 `LIKE` 또는 `DISLIKE`만 허용함. 같은 사용자가 같은 게시글에 이미 반응한 상태에서 같은 `type`을 다시 요청하면 중복 row를 만들지 않고 현재 반응을 유지함. 다른 `type`을 요청하면 기존 반응을 새 `type`으로 전환함.

Response `201`:

```json
{
  "reaction": {
    "id": 1,
    "postId": 1,
    "userId": 1,
    "type": "LIKE",
    "createdAt": "2026-05-27T00:00:00.000Z",
    "updatedAt": "2026-05-27T00:00:00.000Z"
  }
}
```

Error:

- `400`: invalid `postId`, `type` 누락, invalid `type`, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

#### 9.4.11 게시글 반응 취소

`DELETE /api/community/posts/:postId/reactions`

Response `200`:

```json
{
  "message": "Community reaction deleted successfully"
}
```

Error:

- `400`: invalid `postId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음 또는 현재 사용자의 반응 없음

#### 9.4.12 댓글 반응 생성/전환

`POST /api/community/comments/:commentId/reactions`

Request body:

```json
{
  "type": "LIKE"
}
```

`type`은 `LIKE` 또는 `DISLIKE`만 허용함. 같은 사용자가 같은 댓글에 이미 반응한 상태에서 같은 `type`을 다시 요청하면 중복 row를 만들지 않고 현재 반응을 유지함. 다른 `type`을 요청하면 기존 반응을 새 `type`으로 전환함.

Response `201`:

```json
{
  "reaction": {
    "id": 1,
    "commentId": 1,
    "userId": 1,
    "type": "LIKE",
    "createdAt": "2026-05-27T00:00:00.000Z",
    "updatedAt": "2026-05-27T00:00:00.000Z"
  }
}
```

Error:

- `400`: invalid `commentId`, `type` 누락, invalid `type`, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 댓글 없음

#### 9.4.13 댓글 반응 취소

`DELETE /api/community/comments/:commentId/reactions`

Response `200`:

```json
{
  "message": "Community comment reaction deleted successfully"
}
```

Error:

- `400`: invalid `commentId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 댓글 없음 또는 현재 사용자의 댓글 반응 없음

#### 9.4.14 게시글 북마크 생성

`POST /api/community/posts/:postId/bookmarks`

Request body:

- body는 필요하지 않음.
- `userId`, `postId`, `reported` 등 지원하지 않는 field가 포함되면 `400 VALIDATION_ERROR`로 처리함.

같은 사용자가 같은 게시글을 다시 북마크해도 중복 row를 만들지 않고 현재 북마크를 유지함.

Response `201`:

```json
{
  "bookmark": {
    "id": 1,
    "postId": 1,
    "userId": 1,
    "createdAt": "2026-05-27T00:00:00.000Z"
  }
}
```

Error:

- `400`: invalid `postId`, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

#### 9.4.15 게시글 북마크 취소

`DELETE /api/community/posts/:postId/bookmarks`

Response `200`:

```json
{
  "message": "Community bookmark deleted successfully"
}
```

Error:

- `400`: invalid `postId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음 또는 현재 사용자의 북마크 없음

#### 9.4.16 내 북마크 목록 조회

`GET /api/community/bookmarks`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `page` | 선택 | positive integer, 기본값 `1` |
| `pageSize` | 선택 | positive integer, 기본값 `10`, 최대 `50` |
| `sort` | 선택 | `latest` 또는 `oldest`. 기본값 `latest`, 북마크 생성일 기준 정렬 |

Response `200`:

```json
{
  "bookmarks": [
    {
      "bookmarkId": 1,
      "bookmarkedAt": "2026-05-28T00:00:00.000Z",
      "post": {
        "id": 1,
        "userId": 1,
        "category": "QUESTION",
        "title": "학습 질문",
        "content": "문제 관련 질문입니다.",
        "createdAt": "2026-05-26T00:00:00.000Z",
        "updatedAt": "2026-05-26T00:00:00.000Z",
        "author": {
          "id": 1,
          "name": "사용자 이름"
        },
        "commentCount": 0,
        "likeCount": 0,
        "dislikeCount": 0,
        "bookmarkCount": 1,
        "myReaction": null,
        "isBookmarked": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

정책:

- 현재 인증 사용자가 북마크한 게시글만 조회함.
- `sort=latest`는 북마크 생성일 `createdAt desc`, `sort=oldest`는 `createdAt asc` 기준임.
- `post.isBookmarked`는 이 목록에서 항상 `true`임.
- `post.myReaction`은 현재 인증 사용자의 반응 기준이며 `LIKE`, `DISLIKE`, `null` 중 하나임.
- 다른 사용자의 반응/북마크는 `likeCount`, `dislikeCount`, `bookmarkCount`에만 반영함.

Error:

- `400`: invalid `page`, `pageSize`, `sort`
- `401`: 인증 token 없음 또는 유효하지 않음

#### 9.4.17 게시글 신고

`POST /api/community/posts/:postId/reports`

Request body:

```json
{
  "reason": "신고 사유"
}
```

정책:

- `reason`은 필수 문자열이며 trim 후 빈 문자열이면 `400 VALIDATION_ERROR`로 처리함.
- `reason`은 최대 500자까지 허용함.
- `userId`, `reporterId`, `postId`, `commentId`, `status`, `resolvedById`, `resolvedAt`, `resolutionNote` 등 지원하지 않는 field는 `400 VALIDATION_ERROR`로 처리함.
- 신고자는 request body가 아니라 `req.user.id` 기준으로 저장함.
- `targetType`은 `POST`, `commentId`는 `null`, `status`는 `PENDING`으로 저장함.
- 같은 사용자가 같은 게시글을 이미 신고한 경우 `409 CONFLICT`로 처리함.
- 신고 생성 성공 시 대상 `BoardPost.reported`를 `true`로 갱신함.

Response `201`:

```json
{
  "report": {
    "id": 1,
    "targetType": "POST",
    "postId": 1,
    "commentId": null,
    "reason": "신고 사유",
    "status": "PENDING",
    "createdAt": "2026-05-28T00:00:00.000Z"
  }
}
```

Error:

- `400`: invalid `postId`, `reason` 누락/공백/타입 오류/500자 초과, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음
- `409`: 현재 사용자가 이미 같은 게시글을 신고함

#### 9.4.18 댓글 신고

`POST /api/community/comments/:commentId/reports`

Request body:

```json
{
  "reason": "신고 사유"
}
```

정책:

- `reason` validation과 unsupported field 차단 정책은 게시글 신고와 동일함.
- 신고자는 request body가 아니라 `req.user.id` 기준으로 저장함.
- `targetType`은 `COMMENT`, `postId`는 `null`, `status`는 `PENDING`으로 저장함.
- 같은 사용자가 같은 댓글을 이미 신고한 경우 `409 CONFLICT`로 처리함.
- 신고 생성 성공 시 대상 `Comment.reported`를 `true`로 갱신함.

Response `201`:

```json
{
  "report": {
    "id": 1,
    "targetType": "COMMENT",
    "postId": null,
    "commentId": 1,
    "reason": "신고 사유",
    "status": "PENDING",
    "createdAt": "2026-05-28T00:00:00.000Z"
  }
}
```

Error:

- `400`: invalid `commentId`, `reason` 누락/공백/타입 오류/500자 초과, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 댓글 없음
- `409`: 현재 사용자가 이미 같은 댓글을 신고함

관리자 신고 처리와 운영 관리는 기존 `/api/admin/...` namespace를 유지함.

### 9.5 관리자 API

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| 인증 | 필요 (`ADMIN` 권한) |
| 프론트 연동 | 기본 관리자 화면 연결 완료, 커뮤니티 신고 처리 화면은 후속 범위 |
| 설명 | 사용자 제재, 게시글/댓글 관리, 스터디 챌린지 강제 조치 등 시스템 운영 관리 기능 제공 |

주의:
- 모든 관리자 API는 Bearer 토큰 인증 및 `ADMIN` 권한 검증(`adminMiddleware`)이 적용되어 일반 사용자는 접근이 불가능합니다.
- 커뮤니티 신고 조회/처리 API는 백엔드 기준으로 구현되었으며, 관리자 화면 연동은 후속 범위임.
- 제재나 숨김 등의 모든 조치 이력은 `AdminAction` 테이블에 기록 및 저장됩니다.
- 사용자 응답에는 `passwordHash`, password, token 원문이 포함되지 않음.
- id path parameter는 양의 정수만 허용하며, 숫자가 아니거나 0 이하이면 `400 VALIDATION_ERROR`를 반환함.
- 존재하지 않는 사용자, 게시글, 댓글, 챌린지는 `404 NOT_FOUND`를 반환함.

공통 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `400` | `VALIDATION_ERROR` | 잘못된 id, 잘못된 status/action, 관리자가 자기 자신을 정지/비활성화하려는 경우 |
| `401` | `UNAUTHORIZED` | 인증 헤더 없음, Bearer token 없음, token 검증 실패 |
| `403` | `FORBIDDEN` | 일반 USER 등 ADMIN 권한이 없는 사용자 접근 |
| `404` | `NOT_FOUND` | 대상 사용자, 게시글, 댓글, 챌린지를 찾을 수 없음 |

---

#### 9.5.0 서비스 점검 모드 관리

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/system/maintenance` | 현재 점검 모드 설정 조회 |
| `PATCH` | `/api/admin/system/maintenance` | 점검 모드 ON/OFF 및 안내 문구 수정 |
| `POST` | `/api/admin/system/notice` | 접속 중인 사용자에게 관리자 실시간 공지 broadcast |

Request Body:

```json
{
  "enabled": true,
  "title": "사각사각 업데이트 중",
  "message": "더 좋은 기능으로 찾아오겠습니다. 조금만 기다려주세요.",
  "estimatedEndAt": null
}
```

Response 예시:

```json
{
  "maintenance": {
    "enabled": true,
    "title": "사각사각 업데이트 중",
    "message": "더 좋은 기능으로 찾아오겠습니다. 조금만 기다려주세요.",
    "estimatedEndAt": null,
    "updatedAt": "2026-05-29T12:00:00.000Z"
  }
}
```

정책:

- `authMiddleware`와 `adminMiddleware`를 모두 적용하므로 `ADMIN`만 조회/수정할 수 있음.
- 일반 사용자는 `PATCH` 요청 시 `403 FORBIDDEN`을 반환함.
- `enabled`는 boolean만 허용함.
- `title`과 `message`는 빈 문자열을 허용하지 않으며 각각 길이 제한을 적용함.
- `estimatedEndAt`은 ISO date string 또는 `null`만 허용함.
- 응답에는 DB URL, secret, token, `passwordHash` 등 민감정보를 포함하지 않음.
- 점검 모드가 켜져도 관리자 로그인과 관리자 화면 접근은 프론트엔드에서 우회 허용함.
- 점검 모드 설정 변경 성공 시 WebSocket `maintenance.updated` 이벤트를 접속 중인 클라이언트에 broadcast함.

관리자 실시간 공지 Request Body:

```json
{
  "title": "공지",
  "message": "잠시 후 서비스 업데이트가 시작됩니다.",
  "level": "info"
}
```

관리자 실시간 공지 Response 예시:

```json
{
  "notice": {
    "id": "notice-1780000000000",
    "title": "공지",
    "message": "잠시 후 서비스 업데이트가 시작됩니다.",
    "level": "info"
  }
}
```

관리자 실시간 공지 정책:

- `authMiddleware`와 `adminMiddleware`를 모두 적용하므로 `ADMIN`만 전송할 수 있음.
- `level`은 `info`, `success`, `warning`, `danger` 중 하나만 허용하며 생략 시 `info`로 처리함.
- `title`과 `message`는 빈 문자열을 허용하지 않고 길이 제한을 적용함.
- 공지 메시지 자체는 관리자가 입력한 텍스트를 그대로 broadcast하며 자동 번역하지 않음.
- 요청 성공 시 WebSocket `admin.notice` 이벤트를 접속 중인 클라이언트에 broadcast함.
- 응답에는 DB URL, secret, token, `passwordHash` 등 민감정보를 포함하지 않음.

---
#### 9.5.1 사용자 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/users` | 등록된 모든 사용자 목록 조회 |

Response 예시:

```json
{
  "users": [
    {
      "id": 1,
      "loginId": "user_id",
      "name": "홍길동",
      "role": "USER",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "loginId": "admin_user",
      "name": "관리자",
      "role": "ADMIN",
      "status": "ACTIVE"
    }
  ]
}
```

---

#### 9.5.2 사용자 상태 변경(제재)

| Method | Endpoint | 설명 |
|---|---|---|
| `PATCH` | `/api/admin/users/:userId/status` | 사용자 계정 상태 변경 (제재 처리 및 해제) |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `status` | string | 예 | `ACTIVE` / `SUSPENDED` / `DEACTIVATED` |
| `reason` | string | 아니오 | 제재 사유 |

Request 예시:

```json
{
  "status": "SUSPENDED",
  "reason": "커뮤니티 가이드라인 반복 위반"
}
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "loginId": "user_id",
    "name": "홍길동",
    "role": "USER",
    "status": "SUSPENDED"
  },
  "action": {
    "adminId": 2,
    "targetType": "USER",
    "targetId": 1,
    "actionType": "SUSPEND_USER",
    "status": "SUSPENDED",
    "reason": "커뮤니티 가이드라인 반복 위반"
  }
}
```

정책:

- 관리자는 자기 자신의 status를 `SUSPENDED`, `DEACTIVATED`로 변경할 수 없음.
- 현재 `AdminActionType` enum은 사용자 상태 변경 로그 타입을 `SUSPEND_USER`로 관리하므로, 실제 변경된 status는 응답의 `action.status`와 대상 사용자 상태로 확인함.
- 변경 성공 시 해당 사용자 WebSocket 연결에 `account.status.updated` 이벤트를 발행함.
- 프론트엔드는 `SUSPENDED` 또는 `DEACTIVATED` 이벤트를 수신하면 일반 화면 대신 계정 이용 제한 화면을 표시하고, 로그인 화면 이동/로그아웃 액션만 제공함.
- `ACTIVE`로 복구되는 이벤트를 수신하면 기존 세션의 제한 화면을 해제함. WebSocket 연결이 끊긴 경우에는 기존 HTTP 인증/API fallback 기준을 따름.

---

#### 9.5.3 신고 및 처리 내역 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/reports` | 신고된 게시글, 신고된 댓글 목록 및 전체 처리 기록 조회 |
| `GET` | `/api/admin/community/reports` | `CommunityReport` 기반 커뮤니티 신고 목록 조회 |
| `PATCH` | `/api/admin/community/reports/:reportId` | 커뮤니티 신고 기각/처리 상태 변경 |

Response 예시:

```json
{
  "reportedPosts": [
    {
      "id": 992,
      "userId": 1,
      "category": "FREE",
      "title": "부적절한 광고",
      "content": "스팸 내용",
      "reported": true,
      "user": {
        "id": 1,
        "loginId": "user_id",
        "name": "홍길동"
      }
    }
  ],
  "reportedComments": [
    {
      "id": 992,
      "postId": 991,
      "userId": 1,
      "content": "부적절한 욕설",
      "reported": true,
      "user": {
        "id": 1,
        "loginId": "user_id",
        "name": "홍길동"
      },
      "post": {
        "id": 991,
        "title": "학습 질문"
      }
    }
  ],
  "adminActions": [
    {
      "id": 1,
      "adminId": 2,
      "targetType": "USER",
      "targetId": 1,
      "actionType": "SUSPEND_USER",
      "reason": "커뮤니티 가이드라인 위반",
      "createdAt": "2026-05-24T20:30:00.000Z",
      "admin": {
        "id": 2,
        "loginId": "admin_user",
        "name": "관리자"
      }
    }
  ]
}
```

---

#### 9.5.4 커뮤니티 신고 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/community/reports` | `CommunityReport` 기반 커뮤니티 신고 목록을 조회함 |

Query Params:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `status` | string | 아니오 | `PENDING`, `DISMISSED`, `RESOLVED` 중 하나 |
| `targetType` | string | 아니오 | `POST`, `COMMENT` 중 하나 |
| `page` | number | 아니오 | positive integer, 기본값 `1` |
| `pageSize` | number | 아니오 | positive integer, 기본값 `10`, 최대 `50` |

Response 예시:

```json
{
  "reports": [
    {
      "id": 301,
      "reporterId": 1,
      "targetType": "POST",
      "postId": 101,
      "commentId": null,
      "reason": "스팸 게시글",
      "status": "PENDING",
      "resolvedById": null,
      "resolvedAt": null,
      "resolutionNote": null,
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z",
      "reporter": {
        "id": 1,
        "loginId": "user_id",
        "name": "사용자",
        "role": "USER",
        "status": "ACTIVE"
      },
      "resolvedBy": null,
      "post": {
        "id": 101,
        "category": "QUESTION",
        "title": "신고된 게시글",
        "reported": true,
        "author": {
          "id": 3,
          "loginId": "author_user",
          "name": "작성자",
          "role": "USER",
          "status": "ACTIVE"
        }
      },
      "comment": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Error:

- `400`: invalid `status`, `targetType`, `page`, `pageSize` 또는 지원하지 않는 query field
- `401`: 인증 token 없음 또는 유효하지 않음
- `403`: `ADMIN` 권한 없음

정책:

- `ADMIN` 사용자만 조회할 수 있음.
- 신고자, 처리자, 대상 게시글/댓글의 최소 정보만 반환함.
- 관리자 API 특성상 사용자 `loginId`는 기존 관리자 API 정책에 맞춰 반환하지만, `passwordHash`, password, token/JWT는 반환하지 않음.

---

#### 9.5.5 커뮤니티 신고 처리

| Method | Endpoint | 설명 |
|---|---|---|
| `PATCH` | `/api/admin/community/reports/:reportId` | 커뮤니티 신고를 기각 또는 처리 완료로 변경함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `action` | string | 예 | `DISMISS` 또는 `RESOLVE` |
| `resolutionNote` | string | 아니오 | 처리 메모, 500자 이하 |

Request 예시:

```json
{
  "action": "RESOLVE",
  "resolutionNote": "정책 위반으로 처리함"
}
```

Response 예시:

```json
{
  "report": {
    "id": 301,
    "targetType": "POST",
    "postId": 101,
    "commentId": null,
    "reason": "스팸 게시글",
    "status": "RESOLVED",
    "resolvedById": 2,
    "resolvedAt": "2026-05-28T01:00:00.000Z",
    "resolutionNote": "정책 위반으로 처리함"
  },
  "message": "Community report resolved successfully"
}
```

Error:

- `400`: invalid `reportId`, invalid `action`, invalid `resolutionNote`, 지원하지 않는 body field
- `401`: 인증 token 없음 또는 유효하지 않음
- `403`: `ADMIN` 권한 없음
- `404`: 신고 내역 없음
- `409`: 이미 `DISMISSED` 또는 `RESOLVED`로 처리된 신고 재처리

정책:

- `DISMISS`는 `CommunityReport.status`를 `DISMISSED`로 변경함.
- `RESOLVE`는 `CommunityReport.status`를 `RESOLVED`로 변경함.
- 처리 시 `resolvedById`, `resolvedAt`, `resolutionNote`를 저장함.
- 같은 대상에 남은 `PENDING` 신고가 없으면 `BoardPost.reported` 또는 `Comment.reported`를 `false`로 갱신함.
- 같은 대상에 다른 `PENDING` 신고가 남아 있으면 대상 `reported` flag를 `true`로 유지함.
- 신고 대상 게시글/댓글 삭제 또는 숨김 처리는 이번 API에서 수행하지 않으며 후속 범위로 분리함.

---

#### 9.5.6 게시글 관리 조치 (삭제/신고 기각)

| Method | Endpoint | 설명 |
|---|---|---|
| `PATCH` | `/api/admin/posts/:postId/moderation` | 신고된 게시글 삭제 또는 유지(신고 기각) 처리 |

현재 schema에는 게시글 숨김 상태 필드가 없으므로, `HIDE` action은 실제 게시글 삭제 및 관련 댓글 삭제로 처리함.

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `action` | string | 예 | `HIDE` (삭제 및 조치 로그 기록) / `KEEP` (신고 상태 해제) |
| `reason` | string | 아니오 | 조치 사유 |

Request 예시:

```json
{
  "action": "HIDE",
  "reason": "스팸 광고성 게시글 영구 차단"
}
```

Response 예시 (HIDE 조치 시):

```json
{
  "message": "Post deleted by admin moderation successfully",
  "action": {
    "adminId": 2,
    "targetType": "POST",
    "targetId": 992,
    "actionType": "HIDE_POST",
    "reason": "스팸 광고성 게시글 영구 차단"
  }
}
```

Response 예시 (KEEP 조치 시):

```json
{
  "post": {
    "id": 992,
    "title": "학습 질문",
    "reported": false
  },
  "message": "Post report dismissed"
}
```

---

#### 9.5.7 댓글 관리 상태 변경 (삭제/해제)

| Method | Endpoint | 설명 |
|---|---|---|
| `PATCH` | `/api/admin/comments/:commentId/moderation` | 신고된 댓글 삭제 또는 유지(신고 기각) 처리 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `action` | string | 예 | `DELETE` / `KEEP` |
| `reason` | string | 아니오 | 조치 사유 |

Request 예시:

```json
{
  "action": "DELETE",
  "reason": "타인 비하 및 욕설 댓글"
}
```

Response 예시 (DELETE 조치 시):

```json
{
  "message": "Comment deleted successfully",
  "action": {
    "adminId": 2,
    "targetType": "COMMENT",
    "targetId": 992,
    "actionType": "DELETE_COMMENT",
    "reason": "타인 비하 및 욕설 댓글"
  }
}
```

---

#### 9.5.8 스터디 챌린지 제재 (강제 종료)

| Method | Endpoint | 설명 |
|---|---|---|
| `PATCH` | `/api/admin/challenges/:challengeId/moderation` | 부적절한 스터디 챌린지 강제 종료 처리 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `action` | string | 예 | `CLOSE` |
| `reason` | string | 아니오 | 조치 사유 |

Request 예시:

```json
{
  "action": "CLOSE",
  "reason": "부적절한 챌린지 개설"
}
```

Response 예시:

```json
{
  "challenge": {
    "id": 991,
    "title": "부적절한 챌린지",
    "status": "CLOSED"
  },
  "message": "Challenge closed successfully",
  "action": {
    "adminId": 2,
    "targetType": "CHALLENGE",
    "targetId": 991,
    "actionType": "MODERATE_CHALLENGE",
    "reason": "부적절한 챌린지 개설"
  }
}
```

---

#### 9.5.9 보상 배지 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/rewards/badges` | 관리자 권한으로 등록된 보상 배지 목록을 조회함 |

Response 예시:

```json
{
  "badges": [
    {
      "id": 1,
      "code": "TOTAL_STUDY_60",
      "name": "60분 집중 학습",
      "description": "누적 60분 이상 공부하면 획득",
      "iconUrl": "/assets/badges/total-study-60.png",
      "condition": "TOTAL_STUDY_MINUTES >= 60",
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z"
    }
  ]
}
```

Error:

- `401`: 인증 token 없음 또는 유효하지 않음
- `403`: `ADMIN` 권한 없음

---

#### 9.5.10 보상 배지 생성/수정

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/admin/rewards/badges` | 새 보상 배지를 생성함 |
| `PATCH` | `/api/admin/rewards/badges/:badgeId` | 기존 보상 배지 정보를 수정함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `code` | string | 생성 시 필수 | 배지 고유 코드, 공백 trim 후 저장 |
| `name` | string | 생성 시 필수 | 배지 이름 |
| `description` | string \| null | 선택 | 배지 설명 |
| `iconUrl` | string \| null | 선택 | 프론트에서 사용할 이미지 경로 또는 URL |
| `condition` | string \| null | 선택 | 획득 조건 설명 |

Request 예시:

```json
{
  "code": "TOTAL_STUDY_60",
  "name": "60분 집중 학습",
  "description": "누적 60분 이상 공부하면 획득",
  "iconUrl": "/assets/badges/total-study-60.png",
  "condition": "TOTAL_STUDY_MINUTES >= 60"
}
```

Response 예시 (`POST`):

```json
{
  "badge": {
    "id": 1,
    "code": "TOTAL_STUDY_60",
    "name": "60분 집중 학습",
    "description": "누적 60분 이상 공부하면 획득",
    "iconUrl": "/assets/badges/total-study-60.png",
    "condition": "TOTAL_STUDY_MINUTES >= 60",
    "createdAt": "2026-05-28T00:00:00.000Z",
    "updatedAt": "2026-05-28T00:00:00.000Z"
  }
}
```

Error:

- `400`: 잘못된 `badgeId`, 필수값 누락, 길이 초과, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `403`: `ADMIN` 권한 없음
- `404`: 수정 대상 배지가 존재하지 않음
- `409`: 중복된 `code`

비고:

- `iconUrl`은 이미지 파일 자체를 DB에 저장하는 방식이 아니라, 프론트에서 사용할 경로/URL 문자열만 저장함.

---

#### 9.5.11 보상 퀘스트 목록 조회/생성/수정

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/rewards/quests` | 등록된 보상 퀘스트 목록을 조회함 |
| `POST` | `/api/admin/rewards/quests` | 새 보상 퀘스트를 생성함 |
| `PATCH` | `/api/admin/rewards/quests/:questId` | 기존 보상 퀘스트를 수정함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `code` | string | 생성 시 필수 | 퀘스트 고유 코드 |
| `title` | string | 생성 시 필수 | 퀘스트 제목 |
| `description` | string \| null | 선택 | 퀘스트 설명 |
| `type` | string | 생성 시 필수 | `TOTAL_STUDY_MINUTES` / `TASK_COMPLETION` |
| `targetValue` | integer | 생성 시 필수 | 목표 수치, 0 이상 정수 |
| `rewardPoints` | integer | 생성 시 필수 | 지급 포인트, 0 이상 정수 |
| `badgeId` | integer \| null | 선택 | 달성 시 지급할 배지 id |
| `isActive` | boolean | 선택 | 활성화 여부 |

Request 예시:

```json
{
  "code": "TOTAL_STUDY_60",
  "title": "누적 60분 공부하기",
  "description": "집중 학습 시간을 누적 60분 이상 기록하세요.",
  "type": "TOTAL_STUDY_MINUTES",
  "targetValue": 60,
  "rewardPoints": 50,
  "badgeId": 1,
  "isActive": true
}
```

Response 예시 (`GET`):

```json
{
  "quests": [
    {
      "id": 1,
      "code": "TOTAL_STUDY_60",
      "title": "누적 60분 공부하기",
      "description": "집중 학습 시간을 누적 60분 이상 기록하세요.",
      "type": "TOTAL_STUDY_MINUTES",
      "targetValue": 60,
      "rewardPoints": 50,
      "badgeId": 1,
      "isActive": true,
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z",
      "badge": {
        "id": 1,
        "code": "TOTAL_STUDY_60",
        "name": "60분 집중 학습",
        "iconUrl": "/assets/badges/total-study-60.png"
      }
    }
  ]
}
```

Error:

- `400`: 잘못된 `questId`, 필수값 누락, 잘못된 `type`, 음수 값, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `403`: `ADMIN` 권한 없음
- `404`: 수정 대상 퀘스트 또는 참조한 배지가 존재하지 않음
- `409`: 중복된 `code`

비고:

- 현재 지원하는 퀘스트 타입은 `TOTAL_STUDY_MINUTES`, `TASK_COMPLETION` 두 가지임.
- `badgeId`를 `null`로 보내면 배지 없이 포인트만 지급하는 퀘스트로 저장 가능함.

### 9.6 보상 API

| 항목 | 내용 |
|---|---|
| 관련 요구사항 | FR-24 퀘스트/뱃지/포인트 |
| 인증 | 모든 엔드포인트 JWT 필요 |
| 구현 범위 | 내 보상 현황 조회, 달성 퀘스트 보상 수령 |
| 주요 모델 | `RewardAccount`, `Badge`, `UserBadge`, `RewardQuest`, `UserQuest`, `PointTransaction` |

#### 9.6.1 내 보상 현황 조회

| 항목 | 내용 |
|---|---|
| Method | `GET` |
| URL | `/api/rewards/me` |
| 설명 | 현재 사용자의 포인트 지갑, 퀘스트 진행 현황, 획득 뱃지, 최근 포인트 내역을 조회함 |

Response 예시:

```json
{
  "rewards": {
    "account": {
      "id": 1,
      "userId": 1,
      "pointBalance": 120,
      "createdAt": "2026-05-28T00:00:00.000Z",
      "updatedAt": "2026-05-28T00:00:00.000Z"
    },
    "metrics": {
      "totalStudyMinutes": 60,
      "completedTaskCount": 1
    },
    "quests": [
      {
        "id": 1,
        "code": "TOTAL_STUDY_60",
        "title": "누적 60분 공부하기",
        "type": "TOTAL_STUDY_MINUTES",
        "targetValue": 60,
        "rewardPoints": 50,
        "progressValue": 60,
        "progressRate": 1,
        "status": "ACHIEVED",
        "badge": {
          "id": 1,
          "code": "TOTAL_STUDY_60",
          "name": "60분 집중 학습",
          "iconUrl": "/assets/badges/total-study-60.png"
        }
      }
    ],
    "badges": [],
    "recentPointTransactions": []
  }
}
```

#### 9.6.2 달성 퀘스트 보상 수령

| 항목 | 내용 |
|---|---|
| Method | `POST` |
| URL | `/api/rewards/quests/:questId/claim` |
| 설명 | `ACHIEVED` 상태의 퀘스트 보상을 수령하고 포인트와 뱃지를 반영함 |

Response 예시:

```json
{
  "reward": {
    "account": {
      "id": 1,
      "userId": 1,
      "pointBalance": 170
    },
    "quest": {
      "id": 1,
      "code": "TOTAL_STUDY_60",
      "status": "CLAIMED",
      "rewardPoints": 50
    },
    "badge": {
      "id": 1,
      "badge": {
        "code": "TOTAL_STUDY_60",
        "name": "60분 집중 학습"
      }
    },
    "pointTransaction": {
      "type": "EARN",
      "amount": 50,
      "sourceType": "REWARD_QUEST",
      "sourceId": 1
    }
  }
}
```

주요 에러:

| HTTP | code | 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `questId`가 양의 정수가 아님 |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음/잘못됨 |
| 404 | `NOT_FOUND` | 퀘스트가 존재하지 않음 |
| 409 | `CONFLICT` | 아직 달성하지 않았거나 이미 수령한 퀘스트 |

### 9.7 음성/접근성 API

음성/접근성 API는 `FR-18`, `FR-20`, `FR-21`, `FR-25`, `FR-26`을 기준으로 구현된 사용자 접근성 설정, 브라우저 음성 기능 요청 이력, 복습 알림 등록 기능을 다룬다. 모든 endpoint는 로그인한 사용자 기준으로 동작하며 다른 사용자의 설정이나 음성 요청 이력에 접근할 수 없다.

공통 인증:

```http
Authorization: Bearer <JWT_TOKEN>
```

공통 오류:

| HTTP | code | 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 필수 필드 누락, 타입 오류, 길이 제한 초과, 잘못된 날짜/시간 형식 |
| 401 | `UNAUTHORIZED` | 인증 token 없음 또는 유효하지 않음 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 내부 오류 |

#### 9.7.1 접근성 설정 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/accessibility/preferences` | 현재 사용자의 큰 글씨, 고대비, 초등학생 친화 UI, TTS/STT, 복습 알림 설정 조회 |

Response 예시:

```json
{
  "preference": {
    "textScale": 1.2,
    "highContrast": true,
    "elementaryFriendlyUi": false,
    "voiceInputEnabled": true,
    "voiceOutputEnabled": true,
    "reviewReminderEnabled": false,
    "reminderTime": "20:30"
  }
}
```

저장된 설정이 없으면 기본값을 반환한다.

#### 9.7.2 접근성 설정 저장

| Method | Endpoint | 설명 |
|---|---|---|
| `PUT` | `/api/accessibility/preferences` | 큰 글씨, 고대비, 초등학생 친화 UI, 음성 입력/출력, 복습 알림 기본 설정 저장 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `textScale` | number | 아니오 | 글자 크기 배율. `1.0`~`1.6` |
| `highContrast` | boolean | 아니오 | 고대비 모드 사용 여부 |
| `elementaryFriendlyUi` | boolean | 아니오 | 초등학생 친화 UI 사용 여부 |
| `voiceInputEnabled` | boolean | 아니오 | STT 음성 입력 사용 여부 |
| `voiceOutputEnabled` | boolean | 아니오 | TTS 읽어주기 사용 여부 |
| `reviewReminderEnabled` | boolean | 아니오 | 복습 알림 사용 여부 |
| `reminderTime` | string/null | 아니오 | 기본 알림 시간. `HH:mm` 형식 |

#### 9.7.3 TTS 읽어주기 요청 저장

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/accessibility/tts` | 읽어주기 요청 텍스트와 선택한 음성 톤 값을 저장 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `text` | string | 예 | 읽어줄 텍스트. 최대 1000자 |
| `voiceType` | string | 아니오 | 음성 톤 선택값. `ADULT_MALE`, `ADULT_FEMALE`, `CHILD_BOY`, `CHILD_GIRL` 중 하나 |

Response 예시:

```json
{
  "speech": {
    "id": 1,
    "mode": "TTS",
    "voiceType": "ADULT_FEMALE",
    "text": "오늘 배운 내용을 천천히 읽어 주세요.",
    "status": "READY",
    "createdAt": "2026-05-28T03:00:00.000Z"
  }
}
```

서버는 TTS provider를 호출하지 않고 요청 이력과 선택값을 저장한다. 실제 음성 출력은 프론트엔드에서 브라우저 Web Speech API 지원 여부에 따라 처리한다.

#### 9.7.4 STT 음성 입력 결과 저장

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/accessibility/stt` | 브라우저 음성 인식 결과 transcript 저장 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `transcript` | string | 예 | 음성 인식 결과 텍스트. 최대 1000자 |

#### 9.7.5 복습 알림 등록

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/accessibility/review-reminders` | 기존 `Notification` 모델에 `REVIEW` 타입 복습 알림 등록 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | string | 아니오 | 복습 알림 제목. 최대 200자 |
| `task` | string | 아니오 | 복습할 내용. 최대 500자 |
| `message` | string | 아니오 | 하위 호환용 복습 알림 메시지. 최대 200자 |
| `scheduledAt` | string | 예 | 알림 예정 시각. ISO datetime |

#### 9.7.6 복습 알림 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/accessibility/review-reminders` | 현재 로그인한 사용자의 읽지 않은 복습 알림 목록 조회 |

Response 예시:

```json
{
  "reminders": [
    {
      "id": 1,
      "userId": 3,
      "type": "REVIEW",
      "message": "영어 단어 복습 - Day 3 단어 20개 다시 보기",
      "scheduledAt": "2026-05-29T11:00:00.000Z",
      "readAt": null,
      "createdAt": "2026-05-28T03:15:00.000Z"
    }
  ]
}
```

### 9.8 포인트 상점 API

포인트 상점은 보상 시스템에서 획득한 포인트를 사용해 프로필 꾸미기용 아이템을 구매/적용하는 기능임.
현재 MVP 범위에서는 아래 3가지 아이템 타입을 지원함.

- `PROFILE_IMAGE`
- `PROFILE_BACKGROUND`
- `TITLE`

개발용 기본 상점 아이템은 `npm run seed:dev` 실행 시 함께 생성됨.

#### 9.8.1 상점 아이템 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/shop/items` | 로그인한 사용자 기준 상점 아이템 목록 조회 |

#### 9.8.2 내 상점 상태 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/shop/me` | 로그인한 사용자 기준 포인트 잔액, 구매 내역, 현재 적용 상태 조회 |

#### 9.8.3 상점 아이템 구매

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/shop/items/:itemId/purchase` | 포인트를 차감하고 상점 아이템 구매 |

주요 에러:

- `400`: invalid `itemId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 아이템 없음 또는 비활성 아이템
- `409`: 이미 구매한 아이템, 또는 포인트 부족

동작:

- 동일 아이템은 사용자당 한 번만 구매 가능함.
- 구매 시 `RewardAccount.pointBalance`를 차감함.
- 차감 내역은 `PointTransaction.type = SPEND`, `sourceType = SHOP_ITEM`으로 기록함.

#### 9.8.4 구매 아이템 적용

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/shop/items/:itemId/equip` | 구매한 아이템을 현재 프로필 꾸미기 상태에 적용 |

적용 규칙:

- `PROFILE_IMAGE`는 `UserProfile.profileImageUrl`에 `assetUrl`을 반영함.
- `PROFILE_BACKGROUND`는 `UserProfile.profileBackgroundUrl`에 `assetUrl`을 반영함.
- `TITLE`은 `UserProfile.titleText`에 아이템 `name`을 반영함.

#### 9.8.5 기본 꾸미기 상태로 되돌리기

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/shop/unequip` | 타입별로 기본 프로필 이미지/배경/칭호 상태로 되돌림 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `type` | string | 예 | `PROFILE_IMAGE`, `PROFILE_BACKGROUND`, `TITLE` 중 하나 |

### 9.9 스터디 보스 레이드 API

스터디 보스 레이드는 원하는 사람끼리 파티를 만들거나 참여 코드로 합류해서,
그룹 누적 집중 시간과 완료 태스크 수로 보스 HP를 깎는 협동 퀘스트입니다.

핵심 규칙:

- 파티 단위로 진행
- 참여 코드로 원하는 사람끼리 합류 가능
- 데미지 계산:
  - `1 집중분 = 1 데미지`
  - `완료 태스크 1개 = 15 데미지`
- 진행도는 최근 계산 시점 기준 5분 간격으로 갱신
- 보상은 보스당 사용자 1회만 수령 가능
- 보상 구조:
  - 공통 포인트
  - 개인 기여도 보너스
  - 한정 배지

#### 9.9.1 보스 레이드 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/boss-raids` | 현재 활성 보스 레이드 목록과 내 파티 참여 여부 조회 |

#### 9.9.2 보스 레이드 파티 생성

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/boss-raids/parties` | 특정 보스 레이드에 새 파티 생성 |

Request Body:

```json
{
  "raidId": 1,
  "name": "아침 집중팟"
}
```

#### 9.9.3 참여 코드로 파티 참가

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/boss-raids/parties/join` | 참여 코드로 기존 파티에 합류 |

Request Body:

```json
{
  "joinCode": "DAWN01"
}
```

#### 9.9.4 내 파티 목록 / 파티 상세 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/boss-raids/parties/me` | 내가 참여 중인 보스 레이드 파티 목록 조회 |
| `GET` | `/api/boss-raids/parties/:partyId` | 파티 상세, 멤버, 기여도, 남은 HP, 클리어 여부 조회 |

#### 9.9.5 보스 레이드 보상 수령

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/boss-raids/parties/:partyId/claim` | 클리어한 보스 레이드 보상 수령 |

응답에는 아래 내용이 포함될 수 있음:

- 공통 포인트 지급 내역
- 개인 기여도 기반 보너스 포인트
- 한정 배지 지급 여부

### 9.10 협동 퀘스트 API

협동 퀘스트는 기존 개인 보상 퀘스트(`RewardQuest`/`UserQuest`)와 분리된 공동 목표 기반 학습 기능이다. 참여자는 같은 퀘스트에 참여하고 기여도를 추가하며, 목표 수치 달성 후 각자 한 번만 보상을 수령한다.

공통 정책:

- 모든 API는 로그인 사용자만 접근 가능함.
- 1차 MVP는 친구 그룹 강제 제한 없이 참여 가능한 협동 퀘스트로 시작함. 친구/그룹 기반 제한은 후속 고도화 범위임.
- 기여도 추가와 보상 수령은 현재 로그인 사용자 기준으로 처리하며, `userId`를 body로 받아 신뢰하지 않음.
- 완료 전 보상 수령, 미참여자 기여/보상 수령, 중복 보상 수령은 차단함.
- 진행률 변경 성공 시 WebSocket `collabQuest.progress.updated`, 완료 시 `collabQuest.completed` event를 참여자에게 전달함.

#### 9.10.1 협동 퀘스트 목록 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/collaborative-quests` | 협동 퀘스트 목록과 내 참여/보상 수령 상태 조회 |

Response 주요 필드:

- `id`, `title`, `description`
- `goalValue`, `currentValue`, `progressRate`, `progressPercent`
- `status`: `ACTIVE`, `COMPLETED`, `EXPIRED`
- `rewardPoints`
- `participantCount`, `participants`
- `hasJoined`, `hasClaimed`, `canJoin`, `canContribute`, `canClaim`

#### 9.10.2 협동 퀘스트 상세 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/collaborative-quests/:questId` | 협동 퀘스트 상세, 참여자, 최근 기여도, 보상 상태 조회 |

#### 9.10.3 협동 퀘스트 생성

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/collaborative-quests` | 새 협동 퀘스트 생성. 생성자는 자동 참여자로 등록 |

Request Body:

```json
{
  "title": "100분 집중 릴레이",
  "description": "함께 집중 시간을 모아 목표를 달성합니다.",
  "goalValue": 100,
  "rewardPoints": 30,
  "endsAt": null
}
```

#### 9.10.4 협동 퀘스트 참여

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/collaborative-quests/:questId/join` | 진행 중인 협동 퀘스트에 참여 |

중복 참여는 `409 Conflict`로 차단함.

#### 9.10.5 협동 퀘스트 기여도 추가

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/collaborative-quests/:questId/contributions` | 참여 중인 협동 퀘스트에 기여도 추가 |

Request Body:

```json
{
  "amount": 15,
  "memo": "25분 집중 완료"
}
```

기여도 추가 성공 시 현재 진행률을 갱신한다. `currentValue >= goalValue`가 되면 상태를 `COMPLETED`로 전환하고 `completedAt`을 기록한다.

#### 9.10.6 협동 퀘스트 보상 수령

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/collaborative-quests/:questId/claim` | 완료된 협동 퀘스트 보상을 현재 사용자 기준으로 수령 |

보상 정책:

- 완료된 퀘스트의 참여자만 수령 가능함.
- `CollaborativeQuestRewardClaim`의 `questId + userId` unique 제약으로 중복 수령을 방지함.
- 포인트 보상은 `RewardAccount`와 `PointTransaction`에 `sourceType: "COLLABORATIVE_QUEST"`로 기록함.

### 9.11 docs 기준 기능 구현 상태 재점검

아래 표는 요구사항 문서, 설계 문서, 회의록, 현재 main 구현 상태를 함께 대조한 결과임. docs에 근거가 있는 기능은 계획된 기능으로 유지하며, 아직 구현되지 않은 항목은 `미구현` 또는 `부분 구현`으로 표시함.

| 기능 | docs 근거 | 현재 상태 | 구현/문서 근거 | 후속 작업 |
|---|---|---|---|---|
| 로그인/회원가입/사용자 인증 | FR-01, UC-01, UC-02 | 완료 | Auth API, 프론트 로그인/회원가입 화면 연결 | 화면 자동 테스트와 배포 환경 smoke test |
| 사용자 프로필 | FR-02, UC-03 | 부분 구현 | User/Profile API 구현 및 테스트 완료 | 프론트 프로필 화면 연결 |
| 학습 일정 API | FR-03, UC-04 | 완료 | Schedule API 구현 및 테스트 완료 | 프론트 일정 화면 연결 |
| 태스크/칸반 API | FR-04, UC-05 | 완료 | Task API 구현 및 테스트 완료 | 칸반 프론트 화면 연결 |
| 마감일 알림 | FR-05, UC-06 | 미구현 | `Notification` 모델 초안 존재 | 알림 API, 프론트 알림, 테스트 추가 |
| 학습 노트 API | FR-06, UC-08 | 완료 | PR #81, `/api/notes` CRUD API 및 테스트 반영 | 학습 노트 프론트 화면 연결 |
| AI 학습 질의 | FR-07, UC-09 | 부분 구현 | AI MVP API와 AI 학습 지원 화면 연결 완료 | 실제 질문 품질 검증, 비용/한도 관리 |
| AI 오답노트/추천/요약 | FR-08, FR-09, FR-19, UC-07, UC-10, UC-18 | 부분 구현 | AI 추천, 요약, 오답 분석 API 구현 | 프롬프트 히스토리 기반 자동화와 학습 데이터 개인화 고도화 |
| AI 기반 퀴즈 생성 | FR-10, UC-19 | 미구현 | `Quiz`, `QuizQuestion` 모델 초안 존재 | 퀴즈 생성 API와 화면 구현 |
| 랭킹/챌린지 | FR-11, FR-12, FR-29, UC-21 | 부분 구현 | schema 모델과 관리자 챌린지 처리 API 존재 | 사용자 챌린지/랭킹 API와 화면 구현 |
| 커뮤니티 게시판 | FR-13, FR-27, UC-13, UC-20 | 부분 구현 | `/api/community/posts` 게시글 CRUD API, 댓글 API, 반응 API, 북마크 API, 내 북마크 목록 API, 사용자 신고 API, 관리자 신고 조회/처리 API 및 테스트 완료 | 프론트 구현 |
| 앱 차단/방해금지 | FR-14, UC-14 | 미구현 | 요구사항/설계 문서에 계획됨 | 플랫폼 권한 검토 및 구현 가능 범위 확정 |
| 스톱워치/타이머/집중 시간 | FR-15, UC-12 | 완료 | `POST /api/focus-sessions`, `GET /api/focus-sessions` 구현 및 테스트 반영 | 타이머 화면 연결 |
| 학습 통계/데이터 시각화/히트맵 | FR-16, FR-17, UC-11 | 완료 | `GET /api/statistics/summary`, `GET /api/statistics/heatmap` 구현 및 테스트 반영 | 시각화 화면 연결 |
| TTS/STT/접근성 UI | FR-18, FR-20, FR-21, FR-23, FR-25 | 미구현 | 요구사항/설계 문서에 계획됨 | 큰 글씨/고대비, 아이콘 UI, TTS/STT 구현 범위 확정 |
| 외부 캘린더 연동 | FR-22 | 미구현 | 요구사항/설계 문서에 계획됨 | 연동 provider와 인증 방식 확정 |
| 복습 알림/퀘스트/보상 | FR-24, FR-26 | 부분 구현 | `/api/rewards/me`, `/api/rewards/quests/:questId/claim`, `/api/admin/rewards/badges`, `/api/admin/rewards/quests`, 보상 schema/migration 및 관리자 CRUD API 추가 | 알림 API와 보상 정책 고도화, 프론트 보상 화면 연결 |
| 포인트 상점/프로필 꾸미기 | FR-24 확장 | 부분 구현 | `/api/shop/items`, `/api/shop/me`, `/api/shop/items/:itemId/purchase`, `/api/shop/items/:itemId/equip`, `/api/shop/unequip`, 포인트 상점 프론트 화면 및 seed 아이템 추가 | 실제 자산 고도화, 마이페이지 연동 범위 확정 |
| 배포/최종보고서/발표자료/데모 | Phase 3 요구사항 | 미구현 | AGENTS/과제 요구사항 기준 | 배포 URL, 설치/사용 가이드, 영상, 발표자료 작성 |

---

## 10. 테스트 및 검증 기준

현재 프로젝트에서 주로 사용하는 검증 명령은 다음과 같음.

| 명령 | 용도 | 비고 |
|---|---|---|
| `npm test` | Jest + Supertest 기반 백엔드 테스트 | Health, Auth, User/Profile, Schedule/Task, Admin, Admin Community Report, Admin Reward, System Maintenance, Realtime WebSocket helper, AI, Study Note, Focus/Statistics, Reward, Accessibility, Friend, Community Post, Community Comment, Community Reaction, Community Bookmark, Community Bookmark List, Community Report, Seed, Boss Raid, Collaborative Quest, Direct Message 포함. 최신 확인 기준 28 suites / 486 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/focus-statistics.test.js` | 집중 시간/통계 API 단일 테스트 | 실제 결과는 테스트 보고서에 기록 |
| `npm --prefix src/backend test -- --runTestsByPath tests/note.test.js` | 학습 노트 API 단일 테스트 | 1 suite / 13 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-post.test.js` | 커뮤니티 게시글 API 단일 테스트 | 1 suite / 50 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-comment.test.js` | 커뮤니티 댓글 API 단일 테스트 | 1 suite / 41 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-reaction.test.js` | 커뮤니티 반응 API 단일 테스트 | 1 suite / 31 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-bookmark.test.js` | 커뮤니티 북마크 API 단일 테스트 | 1 suite / 16 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-bookmark-list.test.js` | 커뮤니티 내 북마크 목록 API 단일 테스트 | 1 suite / 14 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-report.test.js` | 커뮤니티 사용자 신고 API 단일 테스트 | 1 suite / 36 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/admin-community-report.test.js` | 관리자 커뮤니티 신고 처리 API 단일 테스트 | 1 suite / 29 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/admin-reward.test.js` | 관리자 보상 배지/퀘스트 CRUD API 단일 테스트 | 1 suite / 12 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/friend.test.js` | 친구 추가 및 친구 목록 API 단일 테스트 | 1 suite / 20 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/boss-raid.test.js` | 스터디 보스 레이드 API 단일 테스트 | 1 suite / 8 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/collaborative-quest.test.js` | 협동 퀘스트 API 단일 테스트 | 1 suite / 13 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/system-maintenance.test.js` | 서비스 점검 모드 및 관리자 공지 API 단일 테스트 | 1 suite / 10 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/realtime-websocket.test.js` | WebSocket frame/helper 단일 테스트 | 1 suite / 3 tests passed |
| `npx jest tests/ai.test.js` | AI API 통합 테스트 | `src/backend`에서 실행. 자동 테스트는 실제 외부 AI API를 호출하지 않음 |
| `npm run check` | 전체 기본 검증 | 백엔드 테스트, Prisma validate, frontend config/export 포함 |
| `npm run validate:prisma` | Prisma schema 유효성 검증 | DB 구조 변경 없음 |
| `git diff --check` | 문서/코드 diff whitespace 검증 | trailing whitespace와 EOF 문제 확인 |
| `npm run test:db` | 실제 DB 연결 smoke test | production DB에서 실행 금지 |

주의:

- `npm run test:db`는 개인 dev branch 또는 `dev-main`처럼 개발용 branch에서만 실행함.
- production DB에서 `npm run test:db`, `prisma migrate dev`, `seed:dev`를 실행하지 않음.
- 검증 결과는 테스트 보고서에 실제 실행한 범위만 기록함.

---

## 11. 변경 이력

| 날짜 | 내용 |
|---|---|
| 2026-05 | API 명세서 초안 작성, Health/Auth/User/Profile 구현 API 기준 반영 |
| 2026-05 | Schedule/Task API 구현 완료 기준으로 명세 갱신 |
| 2026-05 | 프론트엔드 로그인/회원가입 화면의 Auth API 연결 상태 반영 |
| 2026-05-24 | AI 학습 지원 API(§9.2) 구현 완료 반영, 기본 모델 `gemini-2.5-flash`, Schedule/Task API와 동일한 표 양식으로 정리 |
| 2026-05-25 | 학습 노트 API(§9.1) 구현 완료 내역 반영 |
| 2026-05-25 | 관리자 화면 연결과 AI 학습 지원 화면 연결 상태 반영, AI API 한국어 응답/fallback/API key 관리 기준 보강 |
| 2026-05-26 | PR #81 merge 이후 학습 노트 CRUD API 검증 결과와 docs 기준 기능 구현 상태 재점검 결과 반영 |
| 2026-05-26 | 커뮤니티 게시글 CRUD API(§9.4) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-26 | 커뮤니티 댓글 API(§9.4.6~§9.4.9) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-27 | 커뮤니티 반응 API(§9.4.10~§9.4.11) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-27 | 커뮤니티 북마크 API(§9.4.14~§9.4.15) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-28 | 커뮤니티 내 북마크 목록 API(§9.4.16) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-28 | 커뮤니티 사용자 신고 API(§9.4.17~§9.4.18) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-29 | 커뮤니티 댓글 반응 API(§9.4.12~§9.4.13) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-29 | 커뮤니티 게시글 작성자 검색, 좋아요/조회수/댓글순 정렬, 조회수 응답 및 상세 조회 증가 정책 반영 |
| 2026-05-28 | 관리자 커뮤니티 신고 조회/처리 API(§9.5.4~§9.5.5) 구현 완료 내역과 테스트 결과 반영 |
| 2026-05-29 | 친구 추가 및 친구 목록 API(§6.5) 구현 완료 내역과 테스트 결과 반영 |
