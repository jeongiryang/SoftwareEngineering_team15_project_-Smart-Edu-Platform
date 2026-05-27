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

### 9.4 커뮤니티/게시판 API

| 항목 | 내용 |
|---|---|
| 상태 | 1차 게시글 CRUD 및 댓글 API 구현 완료 |
| 기본 namespace | `/api/community` |
| 인증 | 필요 (`Authorization: Bearer <JWT_TOKEN>`) |
| 사용 모델 | `BoardPost`, `PostCategory`, `Comment` |
| 1차 범위 | 게시글 목록/상세/작성/수정/삭제, 댓글 목록/작성/수정/삭제, pagination, category filter, 게시글 title/content 검색, 게시글 최신순/오래된순 정렬 |
| 제외 범위 | 답글, 좋아요/싫어요, 북마크, 신고, 관리자 신고 처리 연동, 프론트 화면, seed 데이터 |

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
- 응답에는 `passwordHash`, password, token, email 등 불필요한 민감정보를 포함하지 않음.
- 게시글 삭제 시 현재 schema의 `Comment` relation에 cascade가 없으므로, 작성자 소유 게시글 확인 후 연결 댓글을 먼저 삭제하고 게시글을 삭제함.

#### 9.4.1 게시글 목록 조회

`GET /api/community/posts`

Query:

| 이름 | 필수 | 설명 |
|---|---|---|
| `page` | 선택 | positive integer, 기본값 `1` |
| `pageSize` | 선택 | positive integer, 기본값 `10`, 최대 `50` |
| `category` | 선택 | `QUESTION`, `FREE`, `STUDY_PROOF` 중 하나 |
| `search` | 선택 | `title`, `content` 대상 포함 검색. trim 후 빈 문자열 또는 100자 초과는 400 |
| `sort` | 선택 | `latest` 또는 `oldest`. 기본값 `latest` |

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
      "createdAt": "2026-05-26T00:00:00.000Z",
      "updatedAt": "2026-05-26T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "사용자 이름"
      },
      "commentCount": 0
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

- `400`: invalid `postId`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

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
      "content": "댓글 내용입니다.",
      "createdAt": "2026-05-26T00:00:00.000Z",
      "updatedAt": "2026-05-26T00:00:00.000Z",
      "author": {
        "id": 1,
        "name": "사용자 이름"
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

Error:

- `400`: invalid `postId`, invalid `page`, invalid `pageSize`
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

#### 9.4.7 댓글 생성

`POST /api/community/posts/:postId/comments`

Request body:

```json
{
  "content": "댓글 내용입니다."
}
```

Response `201`:

```json
{
  "comment": {
    "id": 1,
    "postId": 1,
    "userId": 1,
    "content": "댓글 내용입니다.",
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

- `400`: invalid `postId`, `content` 누락 또는 빈 문자열, 지원하지 않는 field 포함
- `401`: 인증 token 없음 또는 유효하지 않음
- `404`: 게시글 없음

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

후속 구현 예정 endpoint:

| Method | Endpoint 후보 | 설명 |
|---|---|---|
| `POST` | `/api/community/posts/:postId/likes` | 좋아요 생성 |
| `DELETE` | `/api/community/posts/:postId/likes` | 좋아요 취소 |
| `POST` | `/api/community/posts/:postId/bookmarks` | 북마크 생성 |
| `DELETE` | `/api/community/posts/:postId/bookmarks` | 북마크 취소 |

신고 API는 `CommunityReport` 모델 도입 여부와 함께 후속 설계에서 확정함. 후보 경로는 `/api/community/reports` 또는 `/api/community/posts/:postId/reports`이며, 현재 문서에서는 구현 완료로 표시하지 않음.

관리자 신고 처리와 운영 관리는 기존 `/api/admin/...` namespace를 유지함.

### 9.5 관리자 API

| 항목 | 내용 |
|---|---|
| 상태 | 구현 완료 |
| 인증 | 필요 (`ADMIN` 권한) |
| 프론트 연동 | 관리자 화면 연결 완료 |
| 설명 | 사용자 제재, 게시글/댓글 관리, 스터디 챌린지 강제 조치 등 시스템 운영 관리 기능 제공 |

주의:
- 모든 관리자 API는 Bearer 토큰 인증 및 `ADMIN` 권한 검증(`adminMiddleware`)이 적용되어 일반 사용자는 접근이 불가능합니다.
- 관리자 화면 연결 작업은 기존 관리자 API를 프론트에서 호출하는 범위이며, 새 관리자 endpoint를 추가하지 않음.
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

### 9.6 docs 기준 기능 구현 상태 재점검

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
| 랭킹/챌린지 | FR-11, FR-12, FR-29, UC-11, UC-12, UC-21 | 부분 구현 | schema 모델과 관리자 챌린지 처리 API 존재 | 사용자 챌린지/랭킹 API와 화면 구현 |
| 커뮤니티 게시판 | FR-13, FR-27, UC-13, UC-20 | 부분 구현 | `/api/community/posts` 게시글 CRUD API와 댓글 API 및 테스트 완료 | 반응/북마크/신고 API와 프론트 구현 |
| 앱 차단/방해금지 | FR-14, UC-14 | 미구현 | 요구사항/설계 문서에 계획됨 | 플랫폼 권한 검토 및 구현 가능 범위 확정 |
| 스톱워치/타이머/집중 시간 | FR-15, UC-15 | 미구현 | `FocusSession` 모델 초안 존재 | 집중 세션 API, 타이머 화면, 테스트 구현 |
| 학습 통계/데이터 시각화/히트맵 | FR-16, FR-17, UC-16, UC-17 | 미구현 | `StudyStatistics` 모델 초안 존재 | 통계 집계 API와 시각화 화면 구현 |
| TTS/STT/접근성 UI | FR-18, FR-20, FR-21, FR-23, FR-25 | 미구현 | 요구사항/설계 문서에 계획됨 | 큰 글씨/고대비, 아이콘 UI, TTS/STT 구현 범위 확정 |
| 외부 캘린더 연동 | FR-22 | 미구현 | 요구사항/설계 문서에 계획됨 | 연동 provider와 인증 방식 확정 |
| 복습 알림/퀘스트/보상 | FR-24, FR-26 | 미구현 | 요구사항 문서에 계획됨 | 알림/보상 정책 및 테스트 설계 |
| 배포/최종보고서/발표자료/데모 | Phase 3 요구사항 | 미구현 | AGENTS/과제 요구사항 기준 | 배포 URL, 설치/사용 가이드, 영상, 발표자료 작성 |

---

## 10. 테스트 및 검증 기준

현재 프로젝트에서 주로 사용하는 검증 명령은 다음과 같음.

| 명령 | 용도 | 비고 |
|---|---|---|
| `npm test` | Jest + Supertest 기반 백엔드 테스트 | Health, Auth, User/Profile, Schedule/Task, Admin, AI, Study Note, Community Post, Community Comment 포함. 최신 확인 기준 11 suites / 198 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/note.test.js` | 학습 노트 API 단일 테스트 | 1 suite / 13 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-post.test.js` | 커뮤니티 게시글 API 단일 테스트 | 1 suite / 44 tests passed |
| `npm --prefix src/backend test -- --runTestsByPath tests/community-comment.test.js` | 커뮤니티 댓글 API 단일 테스트 | 1 suite / 38 tests passed |
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
