# API.md — Exam-AI

## Overview

The frontend exposes two internal Next.js API routes and delegates all business logic to an external backend via a generic proxy. Authentication on proxied requests is handled server-side using an API key (`x-api-key` header). NextAuth manages user sessions independently.

---

## Base URL / configuration

The backend base URL is configured via the `API_URL` environment variable (server-only, not exposed to the client). The public frontend domain is configured via `NEXT_PUBLIC_DOMAIN_URL` (e.g., `http://localhost:3000`).

---

## Internal routes

### `GET | POST | PUT | DELETE /api/proxy`

Generic reverse proxy that forwards requests to the backend API.

**Query parameters**

| Parameter | Type   | Required | Description                                                                 |
|-----------|--------|----------|-----------------------------------------------------------------------------|
| `path`    | string | Yes      | Backend resource path, e.g. `exams/123` or `questions/generate`            |
| *(others)*| any    | No       | All remaining query parameters are forwarded to the backend as-is          |

**Request body**

Forwarded as JSON for `POST` and `PUT`. Ignored for `GET`, `HEAD`, and `DELETE`.

**Headers added by the proxy**

```
Content-Type: application/json
x-api-key: <API_KEY env var>
```

**Backend URL construction**

```
${API_URL}/${path}?${remainingQueryString}
```

Where `remainingQueryString` is the full query string with `path` removed.

**Response**

Returns the backend JSON response verbatim.

**Error responses**

| Status | Body                          | Cause                              |
|--------|-------------------------------|------------------------------------|
| 400    | `{ "error": "Invalid JSON input" }` | Request body is not valid JSON |
| 500    | `{ "error": "<message>" }`    | Backend fetch failed               |

---

### `GET | POST /api/auth/[...nextauth]`

NextAuth.js catch-all route. Handles all OAuth flows (Google), credentials sign-in, session management, and CSRF protection. Implemented in `auth.ts` and exposed via `handlers`.

---

## Backend endpoints consumed

All calls below go through `/api/proxy`. The `path` value shown is passed as the `path` query parameter.

### Authentication

| Method | Path                                         | Description                              |
|--------|----------------------------------------------|------------------------------------------|
| POST   | `auth/signin`                                | Sign in with email/password credentials  |
| GET    | `auth/validate-email/:code`                  | Verify email with a 6-digit code         |
| GET    | `auth/send-reset-password-token/:email`      | Send password reset email                |
| POST   | `auth/reset-password/:token`                 | Set a new password using a reset token   |

**`POST auth/signin`**

Request body:
```json
{ "email": "string", "password": "string" }
```

Response:
```json
{ "data": { "id": "string", "email": "string", "name": "string", "level": 0 }, "message": "string", "token": "string" }
```

**`POST auth/reset-password/:token`**

Request body:
```json
{ "password": "string" }
```

Response:
```json
{ "message": "string", "status": 200 }
```

---

### Users

| Method | Path                                           | Description                                     |
|--------|------------------------------------------------|-------------------------------------------------|
| POST   | `users`                                        | Create or upsert a user                         |
| GET    | `users/email/:email`                           | Get a user by email                             |
| PUT    | `users/:id`                                    | Update user fields                              |
| GET    | `users/students/:userEmail/:studentEmail`      | Add a student to the teacher's student list     |
| DELETE | `users/students/:userEmail/:studentEmail`      | Remove a student from the teacher's student list|

**`POST users`** — Request body:
```json
{ "email": "string", "password": "string", "name": "string" }
```

Response:
```json
{ "user": { ...User }, "message": "string", "error": "string" }
```

**`PUT users/:id`** — Request body:
```json
{ "name": "string", "email": "string", "password": "string" }
```
All fields optional. Response: `{ "user": { ...User } }`

**`GET users/students/:userEmail/:studentEmail`** and **`DELETE users/students/:userEmail/:studentEmail`**

Response: `{ "user": { ...User } }` (the updated teacher user with the modified `students` array)

---

### Questions

| Method | Path                                         | Description                                           |
|--------|----------------------------------------------|-------------------------------------------------------|
| GET    | `questions`                                  | List questions filtered by category, subcategory, user|
| GET    | `questions/categories/:userEmail`            | Get distinct category names for a user                |
| GET    | `questions/subcategories`                    | Get distinct subcategory names for a category + user  |
| POST   | `questions/generate`                         | AI-generate questions and create an exam              |
| POST   | `questions/regenerate-questions`             | Regenerate existing questions with a new prompt       |

**`GET questions`** — Query parameters: `category`, `subCategory`, `limit`, `userEmail`

Response: `{ "questions": Question[] }`

**`GET questions/subcategories`** — Query parameters: `category`, `userEmail`

Response: `{ "subCategories": string[] }`

**`POST questions/generate`** — Request body:
```json
{
  "userEmail": "string",
  "category": "string",
  "subCategory": "string",
  "subject": "string",
  "lang": "string",
  "numberOfQuestions": 8,
  "type": "string",
  "prompt": "string",
  "userId": "string"
}
```

Response: `{ "id": "string" }` — the ID of the created exam

**`POST questions/regenerate-questions`** — Request body:
```json
{ "prompt": "string", "questions": Question[] }
```

Response: `{ "message": "string" }`

---

### Exams

| Method | Path                                    | Description                                     |
|--------|-----------------------------------------|-------------------------------------------------|
| GET    | `exams/:id`                             | Get a single exam by ID                         |
| GET    | `exams/:userEmail/by-user-email`        | Get all exams belonging to a user               |
| GET    | `exams`                                 | Get exams filtered by `userEmail` query param   |
| POST   | `exams`                                 | Create a new exam                               |
| PUT    | `exams/:id`                             | Submit exam answers (update result)             |
| POST   | `exams/students-exams`                  | Create and assign an exam to multiple students  |

**`GET exams/:id`** — Response: `{ "exam": Exam }`

**`PUT exams/:id`** — Request body: `number[]` (array of chosen option indexes, one per question)

Response: `{ "exam": Exam, "message": "string" }`

**`POST exams`** — Request body: `Exam` object

Response:
```json
{ "exam": { "acknowledged": true, "insertedId": "string" }, "message": "string" }
```

**`POST exams/students-exams`** — Request body:
```json
{ "students": ["email1", "email2"], "exam": { ...Exam } }
```

Response: `{ "acknowledged": true, "insertedCount": 2, "message": "string" }`

---

## Data schemas

### `User`
```ts
interface User {
  _id?: string;
  username?: string;
  level?: number;       // 0 = student, non-zero = teacher
  students?: string[];  // teacher's student email list
  email: string;
  password?: string;
  name?: string;
  id?: string;
}
```

### `Option`
```ts
interface Option {
  index: number;  // used as the answer key
  label: string;
}
```

### `Question`
```ts
interface Question {
  _id: string;
  title?: string;
  type: string;
  subject?: string;
  subJect?: string;   // legacy casing — check both fields
  category: string;
  subCategory?: string;
  question: string;
  answer: number;     // index of the correct Option
  whenWrong?: string;
  options: Option[];
}
```

### `Exam`
```ts
interface Exam {
  _id?: string;
  user?: User;
  userId?: string;
  userEmail: string;
  students?: string[];
  category: string;
  subCategory: string;
  subject?: string;
  questions?: Question[];
  questionsId: string[];
  answers?: number[][];  // each inner array is one attempt
  duration?: number;
}
```

### `GenerateQuestionsParams`
```ts
type GenerateQuestionsParams = {
  userId?: string;
  userEmail: string;
  category: string;
  subCategory: string;
  subject?: string;
  prompt?: string;
  type?: string;
  lang?: string;
  numberOfQuestions: number;
}
```
