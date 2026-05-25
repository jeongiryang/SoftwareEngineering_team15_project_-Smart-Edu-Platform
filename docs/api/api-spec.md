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
9. [예정 API 초안](#9-예정-api-초안)
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
    "email": "user@example.com",
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
| `409 Conflict` | 충돌 | 중복 이메일 등 |
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

---

## 5. Auth API

프론트엔드 로그인/회원가입 화면은 이 섹션의 Auth API를 호출함.

- 로그인 화면은 `POST /api/auth/login`을 호출함.
- 회원가입 화면은 `POST /api/auth/register`를 호출함.
- 앱 시작 시 저장된 token이 있으면 `GET /api/auth/me`로 현재 사용자를 확인함.
- 성공 시 token은 클라이언트 저장소에 저장하고 이후 인증 요청에 Bearer token으로 사용함.
- 실제 JWT token 원문은 화면, 로그, 문서에 출력하지 않음.

### 5.1 회원가입

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| Method | `POST` |
| Endpoint | `/api/auth/register` |
| 인증 | 불필요 |
| 설명 | 이메일, 비밀번호, 이름을 받아 사용자를 생성하고 JWT를 발급함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `email` | string | 예 | 사용자 이메일 |
| `password` | string | 예 | 사용자 비밀번호 |
| `name` | string | 예 | 사용자 이름 |

Request 예시:

```json
{
  "email": "user@example.com",
  "password": "<PASSWORD>",
  "name": "홍길동"
}
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
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
| `400` | `VALIDATION_ERROR` | 필수값 누락, 이메일 형식 오류, 비밀번호 길이 부족 |
| `409` | `CONFLICT` | 이미 가입된 이메일 |

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
| 설명 | 이메일과 비밀번호를 검증하고 JWT를 발급함 |

Request Body:

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `email` | string | 예 | 사용자 이메일 |
| `password` | string | 예 | 사용자 비밀번호 |

Request 예시:

```json
{
  "email": "user@example.com",
  "password": "<PASSWORD>"
}
```

Response 예시:

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
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
| `403` | `FORBIDDEN` | 비활성 사용자 |

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
    "email": "user@example.com",
    "name": "홍길동",
    "role": "USER",
    "status": "ACTIVE"
  }
}
```

주요 에러:

| Status | Code | 발생 조건 |
|---|---|---|
| `401` | `UNAUTHORIZED` | 인증 헤더 없음, Bearer token 없음, token 검증 실패 |
| `404` | `NOT_FOUND` | token의 사용자를 찾을 수 없음 |

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
    "email": "user@example.com",
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

### 6.2 내 프로필 수정

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

| 구분 | Email | Role | UserProfile |
|---|---|---|---|
| 일반 사용자 | `dev.user@example.com` | `USER` | 생성 또는 갱신 |
| 관리자 사용자 | `dev.admin@example.com` | `ADMIN` | 생성 또는 갱신 |

주의:

- seed 계정의 실제 비밀번호는 문서에 작성하지 않음.
- DB에는 plain password를 저장하지 않고 bcrypt 기반 `passwordHash`를 저장함.
- production DB에서 실행 금지.
- 개인 dev branch 또는 `dev-main`처럼 개발용 branch에서만 실행함.
- 실제 DB URL, password, host, API key는 문서에 작성하지 않음.

---

## 9. 예정 API 초안

이 섹션의 API는 아직 구현되지 않은 예정 API임. 실제 구현 시 schema, 요구사항, 테스트 결과에 맞춰 세부 명세를 갱신해야 함.

### 9.1 학습 노트 API 예정

상태: 예정

예상 endpoint:

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/notes` | 학습 노트 목록 조회 |
| `POST` | `/api/notes` | 학습 노트 생성 |
| `GET` | `/api/notes/:noteId` | 학습 노트 단건 조회 |
| `PATCH` | `/api/notes/:noteId` | 학습 노트 수정 |
| `DELETE` | `/api/notes/:noteId` | 학습 노트 삭제 |

### 9.2 AI 학습 지원 API 예정

상태: 예정

예상 endpoint:

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/ai/questions` | AI 학습 질의 |
| `POST` | `/api/ai/recommendations` | 학습 추천 생성 |
| `POST` | `/api/ai/quizzes` | AI 기반 퀴즈 생성 |

주의:

- 실제 AI API key는 문서에 작성하지 않음.
- 테스트 단계에서는 mock 또는 테스트용 설정을 우선 검토함.

### 9.3 집중 시간/통계 API 예정

상태: 예정

예상 endpoint:

| Method | Endpoint | 설명 |
|---|---|---|
| `POST` | `/api/focus-sessions` | 완료된 집중 세션 기록 |
| `GET` | `/api/statistics/summary` | 학습 시간 및 완료율 요약 조회 |
| `GET` | `/api/statistics/heatmap` | 학습 히트맵 데이터 조회 |

구현 기준:

- 집중 시간은 `durationMs` 기준으로 저장함.
- 타이머 카운팅은 클라이언트에서 처리함.
- 서버는 완료된 집중 세션 기록만 저장함.

### 9.4 커뮤니티/게시판 API 예정

상태: 예정

예상 endpoint:

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/posts` | 게시글 목록 조회 |
| `POST` | `/api/posts` | 게시글 생성 |
| `GET` | `/api/posts/:postId` | 게시글 단건 조회 |
| `PATCH` | `/api/posts/:postId` | 게시글 수정 |
| `DELETE` | `/api/posts/:postId` | 게시글 삭제 |
| `POST` | `/api/posts/:postId/comments` | 댓글 생성 |

### 9.5 관리자 API

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| 인증 | 필요 (`ADMIN` 권한) |
| 설명 | 사용자 제재, 게시글/댓글 관리, 스터디 챌린지 강제 조치 등 시스템 운영 관리 기능 제공 |

주의:
- 모든 관리자 API는 Bearer 토큰 인증 및 `ADMIN` 권한 검증(`adminMiddleware`)이 적용되어 일반 사용자는 접근이 불가능합니다.
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
      "email": "user@example.com",
      "name": "홍길동",
      "role": "USER",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "email": "dev.admin@example.com",
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
    "email": "user@example.com",
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

---

#### 9.5.3 신고 및 처리 내역 조회

| Method | Endpoint | 설명 |
|---|---|---|
| `GET` | `/api/admin/reports` | 신고된 게시글, 신고된 댓글 목록 및 전체 처리 기록 조회 |

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
        "email": "user@example.com",
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
        "email": "user@example.com",
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
        "email": "dev.admin@example.com",
        "name": "관리자"
      }
    }
  ]
}
```

---

#### 9.5.4 게시글 관리 조치 (삭제/신고 기각)

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

#### 9.5.5 댓글 관리 상태 변경 (삭제/해제)

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

#### 9.5.6 스터디 챌린지 제재 (강제 종료)

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

## 10. 테스트 및 검증 기준

현재 프로젝트에서 주로 사용하는 검증 명령은 다음과 같음.

| 명령 | 용도 | 비고 |
|---|---|---|
| `npm test` | Jest + Supertest 기반 백엔드 테스트 | Health, Auth, User/Profile 등 |
| `npm run check` | 전체 기본 검증 | 백엔드 테스트, Prisma validate, frontend config/export 포함 |
| `npm run validate:prisma` | Prisma schema 유효성 검증 | DB 구조 변경 없음 |
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
