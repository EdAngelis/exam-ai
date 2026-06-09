# FRONT.md — Exam-AI

## Routing

Uses Next.js App Router (file-based routing under `app/`). Every page is a `page.tsx` file. Dynamic segments are not used — exam IDs and tokens are passed as query parameters.

| Route              | Page file                          | Purpose                                             |
|--------------------|-------------------------------------|-----------------------------------------------------|
| `/`                | `app/page.tsx`                      | Sign-in page (root)                                 |
| `/home`            | `app/home/page.tsx`                 | Dashboard: exam history + question filter           |
| `/generator`       | `app/generator/page.tsx`            | AI question generation form                         |
| `/exam`            | `app/exam/page.tsx`                 | Exam-taking interface                               |
| `/student`         | `app/student/page.tsx`              | Student list management                             |
| `/signup`          | `app/signup/page.tsx`               | Account registration                                |
| `/forgot-password` | `app/forgot-password/page.tsx`      | Password reset request form                         |
| `/reset-password`  | `app/reset-password/page.tsx`       | New password form (reads `?token=` from URL)        |
| `/verify-email`    | `app/verify-email/page.tsx`         | 6-digit email verification code input               |
| `/about`           | `app/about/page.tsx`                | Static placeholder                                  |

---

## Layouts

### Root layout — `app/layout.tsx`

Wraps the entire application. Responsibilities:
- Loads `GeistVF` (sans) and `GeistMonoVF` (mono) fonts as CSS variables `--font-geist-sans` and `--font-geist-mono`
- Sets page `<title>` and `<description>` metadata
- Wraps children in `NextAuthProvider` (provides session context to all client components)
- Renders `Footer` at the bottom of every page

### `/home` layout — `app/home/layout.tsx`

Thin wrapper that renders `<main>{children}</main>`. No extra logic.

### `/generator` layout — `app/generator/layout.tsx`

Same thin wrapper as `/home`. Used to scope Suspense for the `useSearchParams` hook in the generator page.

---

## Pages

### `/` — Sign-in

- **Auth requirement:** Public. `Header` redirects authenticated users to `/home`.
- **What the user does:** Signs in with email/password or Google.
- **Key state:** None (managed inside `SignIn` component).
- **Services called:** None directly; sign-in is handled by NextAuth via `credencialSignIn("credentials", ...)`.

---

### `/home` — Dashboard

- **Auth requirement:** Protected. `Header` redirects unauthenticated users to `/`.
- **What the user does:**
  - Teachers: filter questions by category/subcategory/topic, start an exam, assign an exam to students, navigate to the generator.
  - All users: view exam history, search past exams, click to retake or start an exam.
- **Key state:** `userEmail` (ref), `level` (ref) — read from session.
- **Services called:** `getExams()` (inside `ExamHistory`), `getCategory()`, `getSubcategory()`, `getQuestions()`, `insertExam()`, `insertStudentsExams()`, `getUser()` (inside `QuestionsFilter`).
- **Conditional rendering:** `QuestionsFilter` is only rendered when `level !== 0`.

---

### `/generator` — AI Question Generator

- **Auth requirement:** Protected.
- **What the user does:** Selects category, subcategory, optional subject; sets language (default: "Português"), number of questions (max 20), and optionally pastes text or a prompt. Submits to generate questions.
- **Key state:**
  - `formData` — all form field values
  - `categories`, `subCategories`, `subjects` — dropdown options
  - `errors` — category and subcategory validation errors
  - `isPending` — `useTransition` for the async submit
- **URL params read:** `category`, `subCategory`, `subject` (pre-fills the form; set when navigating from `QuestionsFilter`)
- **Services called:** `getCategory()`, `getSubcategory()`, `getQuestions()` (for subjects), `generateQuestions()`
- **On success:** Navigates to `/exam?examId=<id>`

---

### `/exam` — Exam

- **Auth requirement:** Protected.
- **What the user does:** Answers multiple-choice questions one at a time using Previous/Next navigation. Submits when on the last question. Views score and per-question feedback after submission. Teachers (level ≠ 0) can regenerate questions.
- **Key state:**
  - `exam` — the loaded `Exam` object
  - `result` — array of chosen option indexes (one per question), initialized to `-1`
  - `currentQuestionIndex` — which question is displayed
  - `submitted` — whether the exam has been submitted
  - `score` — final percentage (0–100)
  - `showRegenerate` — whether the regenerate panel is visible (teacher + owns exam + not yet submitted)
  - `textAreaValue`, `radioValue` — regenerate form state
  - `isButtonDisabled` — prevents double-clicks
- **URL params read:** `examId` — used to fetch the exam
- **Services called:** `getExam()`, `updateResult()`, `regenerateQuestions()`
- **Option shuffling:** Options are shuffled on load using `arrayShuffle()`. The shuffle is not persisted; navigating away and back reshuffles.
- **Score display:** Shown as a conic-gradient circle after submission. Value is `Math.round(calcScore(exam)[last])`.

---

### `/student` — Student Management

- **Auth requirement:** Protected (teacher feature; no programmatic guard beyond `Header`).
- **What the user does:** Adds students by email (with email validation), removes students, searches and paginates the list (10 per page).
- **Key state:** `user` (full `User` object), `searchTerm`, `currentPage`
- **Services called:** `getUser()`, `addStudent()`, `removeStudent()`

---

### `/signup` — Registration

- **Auth requirement:** Public.
- **What the user does:** Registers with email, password, and password confirmation.
- **Key state:** `successMessage`, `error`, `isLoading`
- **Validation:** Yup schema — email format, password min 6 chars, passwords must match
- **Services called:** `createUser()` — on success, navigates to `/verify-email`

---

### `/forgot-password` — Password Reset Request

- **Auth requirement:** Public.
- **What the user does:** Enters their email to receive a reset link.
- **Key state:** `error`, `success`, `isLoading`
- **Validation:** Yup schema — email format required
- **Services called:** `sendResetPasswordToken(email)` — on success, navigates to `/`

---

### `/reset-password` — New Password

- **Auth requirement:** Public.
- **URL params read:** `token` — the reset token from the email link
- **What the user does:** Enters and confirms a new password.
- **Key state:** `error`, `success`, `isLoading`
- **Validation:** Yup schema — password min 6 chars, passwords must match
- **Services called:** `resetPassword(token, password)` — on success, navigates to `/`

---

### `/verify-email` — Email Verification

- **Auth requirement:** Public.
- **What the user does:** Enters a 6-digit numeric code received by email. Focus advances automatically between digits; backspace moves backward.
- **Key state:** `code` (array of 6 strings), `error`, `isLoading`
- **Services called:** `verifyEmail(code)` — on success, navigates to `/`

---

## Component system

See `CLAUDE.md` for the full component reference. Components are organized into two directories:

- `components/elements/` — reusable UI primitives following Atomic Design (atoms/molecules)
- `components/sessions/` — page-level composite components (organisms)

Barrel export: `components/index.ts` exports `Button`, `Dropdown`, `InputButton`, `Table`, `MultiSelection`, `TextArea`, `Radios`.

---

## Styling

- **Strategy:** CSS Modules. Every component has a co-located `.module.css` file.
- **Global styles:** `app/globals.css` — global resets, CSS variables for colors and fonts. Colors and font definitions must be declared here, not in individual module files.
- **Fonts:** `GeistVF` and `GeistMonoVF` loaded via `next/font/local` in the root layout. Available as CSS variables `--font-geist-sans` and `--font-geist-mono`.
- **CSS variables:** Used for theme values (e.g., `var(--sky-700)` in `dropdown_input.module.css`). Define all custom properties in `globals.css`.

---

## State management

No global state library. State is managed with:

- **`useState`** — all local component state
- **`useRef`** — values that must not trigger re-renders (e.g., `userEmail`, `examId`, pagination totals)
- **`useTransition`** — async operations in the generator and exam pages to show pending states without blocking the UI
- **Session (NextAuth)** — the single source of truth for authentication state, accessed via `useSession()`

The `NextAuthProvider` in `app/layout.tsx` wraps `SessionProvider` from `next-auth/react`, making `useSession()` available to all client components.

---

## Authentication on the client

```ts
const { data: session, status } = useSession();
```

`session.user` is typed as `NextAuthUser` (extends NextAuth's `User` with `level?: number`).

- `status === "loading"` — session is being fetched
- `status === "authenticated"` — user is signed in
- `status === "unauthenticated"` — user is not signed in

**Route protection** is handled by the `Header` component:
- If `unauthenticated`: redirects to `/`
- If `authenticated` and on `/`: redirects to `/home`

This means `Header` must be included on every protected page. It is included on `/home`, `/generator`, `/exam`, and `/student`.

---

## Forms

All forms use [React Hook Form](https://react-hook-form.com/) with [Yup](https://github.com/jquense/yup) schema validation.

**Pattern:**
```ts
const validationSchema = Yup.object().shape({ ... });

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(validationSchema),
  defaultValues: { ... },
});

const onSubmit = async (data) => { ... };

// In JSX:
<Form onSubmit={handleSubmit(onSubmit)}>
  <Input register={register} name="email" type="email" />
  {errors.email && <ErrorToast message={errors.email?.message} />}
</Form>
```

The `Input` component accepts a `register` prop and spreads `register(name)` onto the underlying `<input>`. It also handles password visibility toggling internally.

---

## Navigation

```ts
const router = useRouter();       // programmatic navigation
const searchParams = useSearchParams(); // read query params
```

**URL param patterns used in the app:**

| Route              | Param     | Set by                              |
|--------------------|-----------|-------------------------------------|
| `/exam`            | `examId`  | Generator on success, ExamHistory, QuestionsFilter |
| `/reset-password`  | `token`   | Password reset email link           |
| `/generator`       | `category`, `subCategory`, `subject` | QuestionsFilter `goToGenerate()` |

---

## Loading and error states

| Mechanism         | Used in                                                      |
|-------------------|--------------------------------------------------------------|
| `useTransition`   | Generator form submit, QuestionsFilter category fetch, exam regenerate — shows `<Loading />` component or inline `<p>Loading...</p>` |
| `isPending` flag  | Combined with `useTransition` to disable buttons and show loading UI |
| `loading.tsx`     | Route-level Suspense fallback in `app/loading.tsx` and `app/generator/loading.tsx` |
| `isLoading` state | Local boolean on auth forms (signup, forgot-password, reset-password, verify-email) — renders `<Loader />` |
| `ErrorToast`      | Inline error messages under form fields or on form submission |
| `SuccessToast`    | Inline success confirmation (forgot-password, reset-password) |

There are no error boundaries configured. Errors from async calls are caught in `try/catch` blocks and surfaced via local state.

---

## Utilities

Located in `utils/`, exported from `utils/index.ts`.

### `calcScore(exam: Exam): number[]`

Calculates a percentage score for each attempt in `exam.answers`. For each attempt, counts the number of answers matching `exam.questions[i].answer` and returns `(correct / total) * 100`. Returns `[]` if `exam.answers` or `exam.questions` is missing.

Used in:
- `app/exam/page.tsx` — `Math.round(scores[scores.length - 1])` for the post-submit score display
- `components/sessions/exam_history/exam_history.tsx` — last 3 attempt scores shown on each exam card

### `arrayShuffle<T>(array: T[]): T[]`

Fisher-Yates in-place shuffle. Mutates and returns the array. Used in `app/exam/page.tsx` to randomize question options on load.
