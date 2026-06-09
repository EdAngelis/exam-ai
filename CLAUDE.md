# CLAUDE.md — Exam-AI

## Project overview

Exam-AI is a Next.js 15 frontend application that allows teachers to generate AI-powered multiple-choice exams, manage a student list, and assign exams to students. Students can take exams directly in the browser. All business logic and persistence live in an external backend API; this repository is the frontend only.

---

## Architecture

The app follows a three-layer structure:

1. **Pages (`app/`)** — Next.js App Router pages. All pages except the root signin are client components (`"use client"`). Pages call service functions directly.
2. **Service layer (`service/`)** — Pure TypeScript modules that wrap `fetch` calls to `/api/proxy`. One file per resource (`auth`, `user`, `exams`, `questions`).
3. **Proxy route (`app/api/proxy/route.ts`)** — A single Next.js API route handler that forwards all HTTP methods to the backend. It reads `path` from the query string to construct the backend URL, injects the `x-api-key` header, and forwards the request body for non-GET/HEAD/DELETE methods.

All backend communication goes through `/api/proxy`. The backend URL is never exposed to the client; only the proxy uses `process.env.API_URL` and `process.env.API_KEY`.

The exception is `user.service.ts` and `auth.service.ts`, where server-side calls (invoked from `auth.ts` callbacks) use the absolute URL `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/proxy` so they work outside the browser context.

---

## Authentication

Configured in `auth.ts` using NextAuth v5.

**Providers:**
- `Google` — standard Google OAuth
- `CredentialsProvider` — email/password, delegates to `POST /auth/signin` on the backend via `signInService()`

**Callbacks:**
- `signIn` — called after every successful login. Calls `createUser()` to upsert the user in the backend. Always returns `true`.
- `session` — enriches the session object by fetching the user's `level` from the backend (`getUser(email)`) if it is not already in the token. Attaches `level` to `session.user`.
- `jwt` — caches `id` and `level` from the user object into the JWT token on first login so subsequent requests do not re-fetch from the backend.

**User levels:** `level === 0` indicates a student. Any non-zero level indicates a teacher. The `QuestionsFilter` component (question management + exam creation tools) is only rendered when `level !== 0`.

**Session access:**
- Client components: `useSession()` from `next-auth/react`, wrapped by `NextAuthProvider` (context/NextAuthContext.tsx) which renders `SessionProvider`.
- Server-side / auth callbacks: `auth()` imported from `auth.ts`.

**Route protection:** Handled by the `Header` component. It reads `status` from `useSession()` and redirects unauthenticated users to `/` and authenticated users away from `/`.

---

## Data models

All interfaces are in `models/` and re-exported from `models/index.ts`.

### `User`
```ts
interface User {
  _id?: string;
  username?: string;
  level?: number;       // 0 = student, non-zero = teacher
  students?: string[];  // list of student emails managed by this teacher
  email: string;
  password?: string;
  name?: string;
  id?: string;
}
```

### `Question`
```ts
interface Option {
  index: number;  // numeric identifier for the option (used as the answer key)
  label: string;  // display text
}

interface Question {
  _id: string;
  title?: string;
  type: string;
  subject?: string;
  subJect?: string;   // legacy casing variant — check both fields
  category: string;
  subCategory?: string;
  question: string;   // the question text
  answer: number;     // index of the correct Option
  whenWrong?: string; // explanation shown after an incorrect answer
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
  answers?: number[][];  // array of attempts; each attempt is an array of chosen option indexes
  duration?: number;
}
```

### `NextAuthUser`
Extends NextAuth's `User` with `level?: number`. Used to type `session.user` on the client.

---

## Service layer

### `service/auth.service.ts`
- `signInService({ email, password })` — POST `/auth/signin`, returns `{ data: User, message, token }`
- `verifyEmail(code)` — GET `/auth/validate-email/:code`, returns `{ message }`
- `sendResetPasswordToken(email)` — GET `/auth/send-reset-password-token/:email`, returns `{ message, status }`
- `resetPassword(token, newPassword)` — POST `/auth/reset-password/:token`, body: `{ password }`, returns `{ message, status }`

### `service/user.service.ts`
- `createUser(user)` — POST `/users`, returns `{ user?, message?, error? }`
- `getUser(email)` — GET `/users/email/:email`, returns `User`
- `updateUser(id, { name?, email?, password? })` — PUT `/users/:id`, returns `User`
- `addStudent(userEmail, studentEmail)` — GET `/users/students/:userEmail/:studentEmail`, returns updated `User`
- `removeStudent(userEmail, studentEmail)` — DELETE `/users/students/:userEmail/:studentEmail`, returns updated `User`

### `service/exams.service.ts`
- `getExam(id)` — GET `/exams/:id`, returns `Exam`
- `getExams(userEmail)` — GET `/exams/:userEmail/by-user-email`, returns `Exam[]`
- `updateResult(id, result)` — PUT `/exams/:id`, body: `number[]`, returns `{ exam: Exam, message }`
- `insertExam(exam)` — POST `/exams`, returns `{ exam: { acknowledged, insertedId }, message }`
- `insertStudentsExams(students, exam)` — POST `/exams/students-exams`, body: `{ students, exam }`, returns `{ acknowledged, insertedCount, message }`

### `service/questions.service.ts`
- `getQuestions(userEmail, category, subCategory, limit?)` — GET `/questions`, returns `Question[]`
- `getCategory(userEmail)` — GET `/questions/categories/:userEmail`, returns `string[]`
- `getSubcategory(category, userEmail)` — GET `/questions/subcategories`, returns `string[]`
- `generateQuestions(params)` — POST `/questions/generate`, returns exam ID as `string`
- `regenerateQuestions(prompt, questions)` — POST `/questions/regenerate-questions`, returns `{ message }`
- `getExams(userEmail)` — GET `/exams?userEmail=:userEmail`, returns `any[]` (note: duplicate of exams service)

---

## API layer

The single proxy route at `app/api/proxy/route.ts` handles GET, POST, PUT, DELETE. It:
1. Reads `path` from the query string
2. Strips `path` from the remaining query string and appends it to `${API_URL}/${path}`
3. For POST/PUT, reads the request body as JSON
4. Adds `Content-Type: application/json` and `x-api-key: ${API_KEY}` headers
5. Returns the backend JSON response verbatim, or `{ error }` with status 400/500 on failure

---

## UI / pages

| Route               | Description                                                                                    |
|---------------------|-----------------------------------------------------------------------------------------------|
| `/`                 | Root login page. Renders `Header` + `SignIn`. Redirects to `/home` when already authenticated. |
| `/home`             | Dashboard. Shows `QuestionsFilter` (teachers only, level ≠ 0) and `ExamHistory` for all users.|
| `/generator`        | AI question generation form. Accepts category, subcategory, subject, language, count, prompt. |
| `/exam`             | Exam-taking page. Loads exam by `examId` query param. Shows questions one at a time.           |
| `/student`          | Teacher's student management. Add/remove students by email. Paginated table.                  |
| `/signup`           | Account registration form (email, password, confirmPassword).                                  |
| `/forgot-password`  | Sends a password reset email for a given address.                                              |
| `/reset-password`   | Reads `token` from query param and submits a new password.                                     |
| `/verify-email`     | 6-digit code input for email verification after signup.                                        |
| `/about`            | Static placeholder page.                                                                       |

---

## Components

Components are split into two categories:

### `components/elements/` — reusable primitives

| Component         | Purpose                                                                                        |
|-------------------|-----------------------------------------------------------------------------------------------|
| `Button`          | Styled `<button>` with `type`, `size` ("default" \| "full"), `onClick`, `disabled` props      |
| `Input`           | Controlled input bound to React Hook Form via `register`. Includes password visibility toggle. |
| `Label`           | Styled `<label>` with a `text` prop                                                            |
| `Dropdown`        | `<select>` wrapper with chevron icon; `options`, `selectedValue`, `onChange`, `width`, `disabled` |
| `DropdownInput`   | Free-text input with a filterable dropdown list overlay; `label`, `name`, `value`, `options`, `onChange`, `error` |
| `Form`            | Thin `<form>` wrapper that passes `onSubmit`                                                   |
| `InputButton`     | Text input with an inline submit button; `onClick(value)` callback                            |
| `TextArea`        | Styled `<textarea>` with `value`, `onChange`, `placeholder`                                   |
| `Radios`          | Radio button group; `options`, `label`, `selectedValue`, `name`, `onChange`                   |
| `MultiSelection`  | Multi-select component; `options`, `selectedValues`, `onChange`                               |
| `Table`           | Data table with `head`, `body`, optional delete column (`deleteEnabled`, `onDelete`)          |
| `Loader`          | Spinner / loading indicator                                                                    |
| `ErrorToast`      | Inline error message display; `message` prop                                                   |
| `SuccessToast`    | Inline success message display; `message` prop                                                 |
| `GoogleSignInButton` | Triggers NextAuth Google sign-in flow                                                       |
| `SignOutButton`   | Triggers NextAuth sign-out                                                                     |

### `components/sessions/` — layout-level

| Component        | Purpose                                                                                         |
|------------------|-------------------------------------------------------------------------------------------------|
| `Header`         | Top bar with "Exam-AI" title (links to `/home`) and `SignOutButton`. Handles auth-based redirects. |
| `Footer`         | Bottom bar rendered in the root layout, visible on all pages                                   |
| `SignIn`         | Email/password sign-in form + Google sign-in button                                            |
| `ExamHistory`    | Paginated, searchable grid of past exams. Calls `getExams()`. Shows last 3 scores per exam.     |
| `QuestionsFilter`| Category/subcategory/subject filter dropdowns. Creates and assigns exams. Teacher-only.        |

Barrel export: `components/index.ts` exports `Button`, `Dropdown`, `InputButton`, `Table`, `MultiSelection`, `TextArea`, `Radios`.

---

## Conventions

- **Styling:** CSS Modules co-located with each component (e.g., `button.module.css` next to `button.tsx`). Global styles and CSS variables (colors, fonts) in `app/globals.css`. Do not add inline styles beyond one-off overrides.
- **Atomic Design:** Elements are atoms/molecules; sessions are organisms. Follow this hierarchy when adding components.
- **Imports:** Use the `@/` path alias (maps to the project root) for cross-cutting imports. Relative imports for closely related files.
- **Forms:** All forms use React Hook Form with a Yup schema passed to `yupResolver`. Fields are connected via `register(name)`. Do not build uncontrolled or raw HTML forms.
- **TypeScript:** `strict` mode is enabled. Do not use `any` except where it is already present in legacy code.
- **Fonts:** Loaded via `next/font/local` in `app/layout.tsx` and exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`.
- **Prettier:** Format on save. Run `npm run build` before every commit to catch type errors.

---

## Environment variables

| Variable                 | Used in                  | Effect if missing                         |
|--------------------------|--------------------------|-------------------------------------------|
| `AUTH_SECRET`            | NextAuth                 | Auth will not work; JWT signing fails     |
| `AUTH_GOOGLE_ID`         | NextAuth Google provider | Google sign-in unavailable                |
| `AUTH_GOOGLE_SECRET`     | NextAuth Google provider | Google sign-in unavailable                |
| `API_KEY`                | `/api/proxy`             | Backend rejects all requests              |
| `API_URL`                | `/api/proxy`             | All proxied requests fail                 |
| `NEXT_PUBLIC_DOMAIN_URL` | `user.service.ts`, `auth.service.ts` | Server-side service calls fail (used to build absolute URLs) |

---

## What NOT to do

- **Do not call the backend directly from the client.** All backend requests must go through `/api/proxy`. The `API_URL` and `API_KEY` are server-only env vars.
- **Do not add logic to the proxy route.** It is intentionally a dumb forwarder. Business logic belongs in the backend or the service layer.
- **Do not expose `API_KEY` or `API_URL` to the client.** They have no `NEXT_PUBLIC_` prefix and must stay that way.
- **Do not bypass the `Header` redirect logic** by adding custom route guards elsewhere — keep auth redirect behavior centralized in `Header`.
- **Do not read `question.subject` without also checking `question.subJect`** — both casings exist in backend data. Use `question?.subject || question?.subJect`.
- **Do not commit without running `npm run build`** — the project uses `strict` TypeScript; type errors will break the build.
