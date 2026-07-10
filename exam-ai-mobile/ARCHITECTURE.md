# Exam-AI Mobile — Architecture

This document describes how `exam-ai-mobile` is built and how it integrates with the backend. For setup/run instructions see [`README.md`](./README.md); for the port history see [`PLAN.md`](./PLAN.md).

---

## 1. The three repositories

| Repo | Role |
|---|---|
| `exam-ai-next` | The original Next.js 15 web frontend. The mobile app is a port of it. |
| `exam-ai-api` | Express + MongoDB backend (serverless-capable), runs at `http://localhost:3001` in dev. Single source of business logic and persistence. |
| `exam-ai-mobile` | **This repo** — the Expo / React Native client. |

The web app reaches the backend through a Next.js proxy route (`/api/proxy`) that hides `API_KEY`. React Native has no such server, so the mobile app calls `exam-ai-api` **directly**. Because a shipped binary can't hide a secret, the mobile app authenticates with two things instead:

1. A non-secret **mobile client key** (`x-mobile-api-key`) identifying "this is the official app".
2. A per-user **JWT** (access + refresh) carrying real authorization.

---

## 2. Layered architecture

```
 Screens (src/app/**)                 ← expo-router pages; compose components, own page state
   │  use
   ├── Context (src/context)          ← auth state (user, status, sign-in/out)
   ├── Organisms (components/organisms)← feature-aware UI (fetch + navigate)
   │       │ call
   └───────┴── Service layer (src/service/*)   ← one module per resource
                   │ call
                   └── api-client (src/lib/api-client.ts)  ← headers, refresh/retry, errors
                           │ HTTP
                           └── exam-ai-api  (http://localhost:3001)
```

Presentation primitives (atoms/molecules) sit beside the screens but **never** call services or context — they receive everything via props.

---

## 3. Routing & navigation

File-based via `expo-router`, rooted at `src/app/` (`typedRoutes` is on, so links and params are type-checked).

```
src/app/
  _layout.tsx              Root: ThemeProvider + AuthProvider + <Stack.Protected> guards
  (app)/                   Authenticated group (a Stack)
    _layout.tsx            Stack: (tabs), generator, exam, student, assign-exam, settings, game/*
    (tabs)/                Dashboard bottom tab navigator  →  "/"
      _layout.tsx          NativeTabs: Home, Multi-player, History
      index.tsx            Home tab (QuestionsFilter + ExamHistory)
      multiplayer.tsx       Multi-player tab: invite code, active games, recent game results
      history.tsx           History tab
    generator.tsx          AI question generation
    exam.tsx               Exam-taking
    student.tsx            Student management (teachers)
    assign-exam.tsx        Assign an exam to students
    settings.tsx           Account + sign out
    game/                  Two-player competitive exam game (epic: Game)
      new.tsx               Invite an opponent by email or 6-digit code
      [gameId]/lobby.tsx     Accept/start, host can edit the time limit before start
      [gameId]/play.tsx      Timer, question nav, submit, waiting-for-opponent state
      [gameId]/result.tsx    Winner/draw + scores
  (auth)/                  Public group (a Stack)
    _layout.tsx
    index.tsx              Redirects → /sign-in  ("/")
    sign-in.tsx  sign-up.tsx  verify-email.tsx  forgot-password.tsx  reset-password.tsx
```

### Route protection

The root `_layout.tsx` reads `status` from the auth context:

- `loading` → render a spinner (session is being restored).
- otherwise render a `<Stack>` with two `<Stack.Protected>` blocks:
  - `guard={status === 'authenticated'}` wraps `(app)`.
  - `guard={status === 'unauthenticated'}` wraps `(auth)`.

When a group's guard is false, its screens are unavailable and expo-router redirects to the nearest available route. **Both `(app)/index` and `(auth)/index` map to `/`**, so the guard alone decides where `/` goes — dashboard when signed in, the `(auth)` redirect-to-sign-in when not. This is the canonical expo-router auth pattern. The `(auth)/index` redirect exists so the unauthenticated landing is deterministically `/sign-in` (otherwise the router would pick whichever auth file is first alphabetically).

There is no manual "redirect if logged out" code in screens — guarding is centralized here, mirroring how the web app centralizes it in `Header`.

---

## 4. Authentication

### State — `src/context/auth-context.tsx`

`AuthProvider` exposes:

| Field | Meaning |
|---|---|
| `user` | `User \| null` |
| `status` | `loading \| authenticated \| unauthenticated` |
| `isTeacher` | `(user.level ?? 0) !== 0` — absent level = student (matches the web app) |
| `signIn(email, password)` | email/password login |
| `signUp({ name, email, password })` | registration (does **not** log in — email must be verified first) |
| `signInWithGoogle(idToken)` | exchanges a Google ID token for a session |
| `signOut()` | clears tokens + state |

### Session lifecycle

```
App launch
  └─ AuthProvider effect: read access token from secure storage
       ├─ none           → status = unauthenticated
       └─ present        → GET /auth/mobile/me
                              ├─ ok    → user set, status = authenticated
                              └─ fail  → clear tokens, status = unauthenticated
                                 (api-client auto-tries a refresh before this fails)

Sign in / Google
  └─ POST /auth/mobile/{signin|google}
       → { user, accessToken, refreshToken }
       → store tokens, status = authenticated

Sign up
  └─ POST /auth/mobile/signup  (backend creates inactive user + emails a code)
       → navigate to /verify-email  (no auto-login)

Sign out
  └─ clear secure storage, status = unauthenticated
```

### Google sign-in — `src/hooks/use-google-auth.ts`

`expo-auth-session`'s Google provider runs the OAuth flow on-device and yields an **ID token**, which the context posts to `/auth/mobile/google`. The backend verifies it with `google-auth-library` and upserts the user. The ID token's audience must match the backend's `GOOGLE_CLIENT_ID` (see README).

---

## 5. Networking — `src/lib/api-client.ts`

A thin `fetch` wrapper exposing `get/post/put/delete`. Each request:

1. Sets `Content-Type: application/json` and `x-mobile-api-key`.
2. Attaches `Authorization: Bearer <accessToken>` (unless `auth = false`, used by public auth endpoints).
3. On **`401`** (and `auth`): performs a single silent token refresh via `/auth/mobile/refresh`, then replays the request once. Concurrent 401s share one in-flight refresh (de-duped via a module-level promise). If refresh fails, it calls the registered **auth-failure handler** (the context's `signOut`) and throws.
4. Parses the body and, on non-2xx, throws an `ApiError(message, status, body)`.

### Heterogeneous response envelopes

`exam-ai-api` is not consistent:

- User/auth controllers use `{ message, data, status, token? }` (the `ApiEnvelope<T>` type).
- The older exam/question controllers (`.js`) return ad-hoc shapes: `{ message, exam }`, `{ message, exams }`, `{ message, questions }`, `{ message, categories }`, `{ message, id }`, etc.

So the api-client returns the **full parsed body typed by the caller**, and each service reads the correct key (`res.data`, `res.exam`, `res.questions`, …). This avoids forcing one envelope shape that doesn't exist.

### Tokens — `src/lib/secure-storage.ts`

Wraps `expo-secure-store` for the access/refresh tokens, with a `localStorage` fallback on web (where SecureStore is unavailable). Refresh tokens are rotated on every refresh and validated against the copy stored on the user document server-side, so sign-out / password change can revoke them.

---

## 6. Service layer — `src/service/*`

One module per resource, mirroring `exam-ai-next/service/*` function-for-function (minus the web-only proxy and `createUser`, which is now part of `signUp`).

| Module | Functions |
|---|---|
| `auth.service.ts` | `signInService`, `signUpService`, `signInWithGoogleService`, `getMeService`, `verifyEmail`, `sendResetPasswordToken`, `resetPassword` |
| `user.service.ts` | `getUser`, `updateUser`, `addStudent`, `removeStudent` |
| `exams.service.ts` | `getExam`, `getExams`, `updateResult`, `insertExam`, `insertStudentsExams` |
| `questions.service.ts` | `getQuestions`, `getCategory`, `getSubcategory`, `generateQuestions`, `regenerateQuestions` |
| `game.service.ts` | `createGame`, `listGames`, `getGame`, `acceptGame`, `startGame`, `updateGameTimeLimit`, `getPlayableGame`, `submitGameAnswers`, `getGameResult` — all hit `/games/*` on `exam-ai-api` (client-agnostic; not part of the mobile-specific backend changes in §12), same `x-mobile-api-key` + bearer JWT auth as every other authenticated route |

Notable contract fix: `insertStudentsExams` maps the backend's `data`-wrapped result to the documented `{ acknowledged, insertedCount, message }` shape (the web version's type was wrong).

---

## 7. Data models — `src/models/`

Ported as-is from the web app (dropping the NextAuth-specific type): `User`, `Question` (+ `Option`), `Exam`. Note the legacy dual casing `question.subject` / `question.subJect` — always read both.

`src/types/game.ts` adds the Game domain (not ported from web — added directly, then mirrored back into `exam-ai-next`): `GameStatus`, `GameSummary`, `CreateGameInput`, `PlayableGame` (+`PlayableQuestion`, answer keys stripped server-side), `SubmittedAnswer`, `GameResult`, `SubmissionResponse`. See `exam-ai-api`'s `docs/schemas/game.schemas.yml` for the authoritative shapes.

---

## 8. Components — Atomic Design (`src/components/`)

| Layer | Folder | Examples | Rule |
|---|---|---|---|
| Atoms | `atoms/` | `Button`, `Label`, `Loader`, `TextField`, `ThemedText`, `ThemedView` | Single-purpose, presentation-only. |
| Molecules | `molecules/` | `FormInput`, `InlineMessage`, `Dropdown`, `DropdownInput`, `TextArea`, `SearchBar`, `Pagination`, `DataTable`, `InputButton`, `GoogleSignInButton` | Compositions of atoms, still props-only. |
| Organisms | `organisms/` | `ExamHistory`, `QuestionsFilter` | Feature-aware: may fetch data and navigate. |
| Templates/pages | `src/app/**` | the screens | Assemble organisms/molecules/atoms; own page state. |

**Reusability bar (enforced):**

- Atoms and molecules never import a service or a context — they receive data and callbacks via props. Only organisms and screens wire in services/context.
- No hardcoded copy where a `label`/`children` prop would do.
- All styling is theme-driven (see below) so every component works in light and dark unchanged.
- New looks are added through props (`variant`, `size`), not by forking into a near-duplicate component — check `atoms/`/`molecules/` before adding a new one.

---

## 9. Theming — `src/constants/theme.ts`

Single source of truth: `Colors.light` / `Colors.dark`, `Fonts`, `Spacing`, `MaxContentWidth`. `useTheme()` (`src/hooks/use-theme.ts`) returns the resolved color object and falls back to light when the OS scheme is null. Components consume theme colors (or `ThemedText`/`ThemedView`) — never hardcoded hex — so dark mode keeps working. On web, `use-color-scheme.web.ts` defers to a post-hydration value to avoid a flash during static rendering.

---

## 10. Forms

React Hook Form + Yup via `yupResolver`, bound through the `FormInput` molecule (`Controller` under the hood). Each screen owns its schema and `control`. For schemas with an optional field, give it a `.default('')` (or derive the type with `yup.InferType`) so the resolver's input and output types match — RHF v7's third "transformed values" generic is strict and will otherwise reject the `control`.

---

## 11. Configuration — `src/constants/config.ts`

Reads `EXPO_PUBLIC_*` env vars, which Expo inlines into the bundle at build time (hence non-secret only):

- `EXPO_PUBLIC_API_URL` — backend base URL
- `EXPO_PUBLIC_MOBILE_API_KEY` — the `x-mobile-api-key` value (must match the backend)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `_IOS_CLIENT_ID` / `_ANDROID_CLIENT_ID`

Missing required vars log a console warning in dev. `.env` is gitignored; `.env.example` documents the full set.

---

## 12. Backend integration (`exam-ai-api` changes made for mobile)

- **`MOBILE_API_KEY`** config + `checkMobileApiKey` middleware (`x-mobile-api-key`), distinct from the server-only `API_KEY`.
- **Refresh tokens**: `tools/jwt.ts` gained `generateRefreshToken`/`verifyRefreshToken` (30d, payload `{ email, type: "refresh" }`); a `refreshToken` field was added to the user model.
- **`authenticateToken`** middleware (previously defined but unused) is wired onto `/auth/mobile/me` and now returns `401` (was `403`) so the client can tell an expired access token apart from a bad mobile key.
- **New routes** under `/auth/mobile`: `signup`, `signin`, `refresh`, `google`, `me`, plus re-used `validate-email/:code`, `send-reset-password-token/:email`, `reset-password/:token`.
- **Bug fix**: `GET`/`DELETE /users/students/:userEmail/:studentEmail` routes were added (the repository functions existed but were never exposed — student management was broken on the web app too).
- API docs updated (`docs/api.yml`, `docs/paths/auth-mobile.yml`, schemas).

---

## 13. Key differences from the web app

| Concern | Web (`exam-ai-next`) | Mobile (`exam-ai-mobile`) |
|---|---|---|
| Backend access | Next.js `/api/proxy` hides `API_KEY` | Direct calls with `x-mobile-api-key` + JWT |
| Auth | NextAuth (cookies/session) | JWT access+refresh in secure storage + React context |
| Google | NextAuth Google provider (browser) | `expo-auth-session` ID token → `/auth/mobile/google` |
| Routing | Next.js App Router pages | expo-router groups + `<Stack.Protected>` |
| Styling | CSS Modules | RN `StyleSheet` + theme tokens |
| Navigation shape | dashboard + header links | bottom tab bar (Home/Multi-player/History) + pushed Stack screens |

---

## 14. Known limitations / not yet wired

- **Password-reset deep link**: the reset email from `exam-ai-api` points at the web app. The mobile screen reads `?token=` (scheme `examaimobile`), but isn't end-to-end until the email template targets `examaimobile://reset-password?token=...`.
- **Google audience**: native client IDs produce ID tokens whose audience differs from the web client ID; the backend verifies against a single `GOOGLE_CLIENT_ID`. Use the web client ID across both, or extend the backend to accept multiple audiences.
- **No automated tests** yet. QA is currently manual + `tsc`/`lint`/web-export smoke test.
- **The two-player Game feature is HTTP-polling based, not real-time.** `PLAN.md` originally scoped "real-time multiplayer" (a WebSocket layer) out of the web-port project; the epic that shipped afterward (`docs/epics/game.md`) implements competitive two-player games via plain REST + client-side polling on `exam-ai-api`, `exam-ai-mobile`, and `exam-ai-next` instead — no WebSocket layer exists. A true real-time transport is still out of scope.
