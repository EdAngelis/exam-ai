# Exam-AI Mobile — Port Plan

Status: **feature-complete; pending manual QA** — Phases 1–6 done (✅), Phase 7 automated checks done, manual device/web pass pending env setup. A full review pass has been completed and the fixes it surfaced applied (see Phase 7). Docs written: [`README.md`](./README.md) (setup/run) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) (design). This covers porting the existing Next.js web app (`exam-ai-next`) to this Expo project (`exam-ai-mobile`), reusing the existing backend (`exam-ai-api`). Real-time multiplayer is a separate future effort and is explicitly **out of scope** here.

## Environment

- **Backend API runs locally at `http://localhost:3001`** (`exam-ai-api`, see its `npm run dev`). The mobile app must point `EXPO_PUBLIC_API_URL` at this URL for local development.
  - Note: when testing on a **physical device or Android emulator**, `localhost` resolves to the device itself, not your dev machine — use your machine's LAN IP (e.g. `http://192.168.x.x:3001`) or `http://10.0.2.2:3001` for the Android emulator. The iOS simulator and web can use `http://localhost:3001` directly.

## Current state (recap)

- `exam-ai-next` — Next.js 15 frontend. Browser-only concerns (NextAuth, CSS Modules, the `/api/proxy` route) don't transfer to React Native.
- `exam-ai-api` — Express backend (serverless, runs at `http://localhost:3001`), MongoDB, Joi validation. JWT helper now has both access (`generateToken`/`verifyToken`, 1h) and refresh (`generateRefreshToken`/`verifyRefreshToken`, 30d) variants. The `authenticateToken` middleware is now wired onto `/auth/mobile/me` and returns `401` on auth failure. Business endpoints are still protected by the shared `x-api-key`; the new mobile routes use `x-mobile-api-key` + per-user JWT.
- `exam-ai-mobile` — Expo SDK 56 app. Networking/auth foundation, service layer, and route guarding are in place (Phases 1–3); screens are being built.

## Decisions this plan makes (flag for review)

1. **Mobile "API key"**: the web app hides `API_KEY` behind the Next.js proxy; a shipped mobile binary can't hide a secret the same way (it's extractable from the app bundle). Plan: introduce a separate, non-secret **mobile client key** (new env var on the backend, e.g. `MOBILE_API_KEY`) checked by a new lightweight middleware, distinct from the server-only `API_KEY`. It identifies "this is the official app," not a per-user secret — real authorization comes from the per-user JWT described below. If you'd rather reuse the existing `API_KEY` as-is, say so and step 1 below simplifies.
2. **Per-user auth on mobile**: there's no NextAuth session/cookie in React Native. The new mobile auth routes will issue a JWT **access token** (short-lived, ~1h, same as today) plus a JWT **refresh token** (longer-lived, ~30 days), with the refresh token stored on the user document (same pattern already used for `resetPasswordToken`) so it can be revoked on logout/password change. Tokens are stored on-device with `expo-secure-store`.
3. **Google sign-in**: NextAuth's Google provider only runs in a browser. Mobile will use `expo-auth-session` to get a Google ID token on-device, then send it to a new backend route that verifies it server-side (`google-auth-library`) and upserts the user — replacing what the NextAuth `signIn`/`jwt`/`session` callbacks do today.
4. **Service layer**: ported function-for-function from `exam-ai-next/service/*`, but calling `exam-ai-api` directly with the mobile client key + bearer token instead of going through `/api/proxy`.

---

## Phase 1 — Backend: mobile auth routes (`exam-ai-api`) — ✅ DONE

- [x] Add `MOBILE_API_KEY` config + a `checkMobileApiKey` middleware (`src/middlewares/mobile-api-key.ts`, checks `x-mobile-api-key`). Also added `GOOGLE_CLIENT_ID` to config + `.example.env`.
- [x] Add `refreshToken` field to `UserT` (`models/user.model.ts`) and its Mongo validator.
- [x] Extend `tools/jwt.ts` with `generateRefreshToken`/`verifyRefreshToken` (30d expiry, payload `{ email, type: "refresh" }`).
- [x] Wire the existing (previously unused) `authenticateToken` middleware onto `/auth/mobile/me`. Also corrected it to return `401` (was `403`) so the client can disambiguate an expired access token from a bad mobile key.
- [x] New `auth.mobile.route.ts` mounted at `/auth/mobile` (registered in `routes/index.ts`):
  - `POST /auth/mobile/signup` — reuses `createUserController` (hash password, send verification email).
  - `POST /auth/mobile/signin` — returns `{ user, accessToken, refreshToken }`.
  - `POST /auth/mobile/refresh` — exchanges a valid refresh token (verified against the stored one) for a new access + refresh token (rotation).
  - `POST /auth/mobile/google` — verifies a Google ID token via `google-auth-library`, upserts the user, returns `{ user, accessToken, refreshToken }`.
  - `GET /auth/mobile/me` — protected by `authenticateToken`.
  - Reused as-is: `validate-email/:code`, `send-reset-password-token/:email`, `reset-password/:token`.
- [x] Update docs (`docs/api.yml`, new `docs/paths/auth-mobile.yml`, new schemas) with the new endpoints.
- [x] **Fixed pre-existing bug**: added `GET`/`DELETE /users/students/:userEmail/:studentEmail` routes + controllers (the `insertStudent`/`removeStudent` repo fns already existed but were never exposed — broken on web too).
- [x] `tsc --noEmit` clean.
- ⚠️ **You must set real `MOBILE_API_KEY` and `GOOGLE_CLIENT_ID` in the actual `exam-ai-api/.env`** (only `.example.env` was updated).

## Phase 2 — Mobile networking & auth foundation (`exam-ai-mobile`) — ✅ DONE

- [x] Env config: `src/constants/config.ts` reading `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_MOBILE_API_KEY`, `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`; `.env.example` added, `.env` gitignored.
- [x] `src/lib/api-client.ts` — fetch wrapper injecting the mobile key + bearer token, single transparent refresh+retry on 401, de-duped concurrent refreshes, `ApiError`. Returns the full parsed body typed by the caller (backend envelopes are heterogeneous).
- [x] `src/lib/secure-storage.ts` — `expo-secure-store` wrapper (localStorage fallback on web).
- [x] `src/context/auth-context.tsx` — exposes `user`, `status`, `isTeacher`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`; restores session on launch via `/auth/mobile/me`; registers the api-client auth-failure handler.
- [x] Route guarding: root `_layout.tsx` wraps `AuthProvider` + `<Stack.Protected>` over `(app)` (authenticated) and `(auth)` (public) route groups; template tabs moved into `(app)`.

## Phase 3 — Service layer port — ✅ DONE

Mirrors `exam-ai-next/service/*`, one file per resource, targeting `exam-ai-api` directly through the Phase 2 API client:

- [x] `auth.service.ts` — `signInService`, `signUpService`, `signInWithGoogleService`, `getMeService`, `verifyEmail`, `sendResetPasswordToken`, `resetPassword`.
- [x] `user.service.ts` — `getUser`, `updateUser`, `addStudent`, `removeStudent` (dropped `createUser`). The student routes now work (fixed in Phase 1).
- [x] `exams.service.ts` — `getExam`, `getExams`, `updateResult`, `insertExam`, `insertStudentsExams`. `insertStudentsExams` now maps the backend's `data`-wrapped result to the documented `{ acknowledged, insertedCount, message }` contract (the web version's type was wrong).
- [x] `questions.service.ts` — `getQuestions`, `getCategory`, `getSubcategory`, `generateQuestions`, `regenerateQuestions` (dropped the duplicate `getExams` the web file carried).
- [x] Ported `models/` (`User`, `Question`, `Option`, `Exam`; dropped `NextAuthUser`).

## Phase 4 — Auth screens — ✅ DONE

- [x] `/sign-in` — email/password (RHF + Yup) + "Continue with Google" button (via `useGoogleAuth` hook + `expo-auth-session`).
- [x] `/sign-up` — name, email, password, confirm password; routes to `/verify-email` on success.
- [x] `/verify-email` — 6-digit code input.
- [x] `/forgot-password` (sends reset token) and `/reset-password` (reads `token` from query/deep link).
  - ⚠️ Deep-linking from the reset email still needs the `exam-ai-api` email template updated to target `examaimobile://reset-password?token=...` (currently points at the web app). Flag when you want this wired.
- [x] All forms use React Hook Form + Yup (`yupResolver`), built from the shared atoms/molecules.

## Phase 5 — Core screens — ✅ DONE

`(app)` was restructured from the template tabs into a Stack (dashboard + pushed screens), matching the web app's dashboard-and-header navigation.

- [x] Home/dashboard (`(app)/index.tsx`) — `ExamHistory` organism (paginated, searchable, last 3 scores) for everyone, plus `QuestionsFilter` organism only when `isTeacher` (`level !== 0`); "Account" button.
- [x] Generator (`(app)/generator.tsx`) — category/subcategory/topic (`DropdownInput`), language, count, difficulty, prompt; calls `generateQuestions`, accepts incoming filter params.
- [x] Exam-taking (`(app)/exam.tsx`) — shuffled options, one question at a time, progress, submit via `updateResult`, score + correct/incorrect highlighting + `whenWrong` feedback, teacher regenerate.
- [x] Student management (`(app)/student.tsx`, teachers) — add by email (`InputButton`), searchable paginated `DataTable` with remove.
- [x] Settings/account (`(app)/settings.tsx`) — update name/email/password (optional), sign out.
- [x] `tsc` + `lint` both clean (zero errors/warnings).

## Phase 6 — Shared UI components — ✅ DONE (built incrementally with Phases 4–5)

**Atomic Design** structure, built only as each screen needed it:
- `src/components/atoms/` — `Button` (variant/size props), `Label`, `Loader`, `TextField` (with password toggle). Plus the pre-existing `ThemedText`/`ThemedView`.
- `src/components/molecules/` — `FormInput` (RHF-bound), `InlineMessage` (error/success), `GoogleSignInButton`, `Dropdown`, `DropdownInput`, `TextArea`, `SearchBar`, `Pagination`, `DataTable`, `InputButton`.
- `src/components/organisms/` — `ExamHistory`, `QuestionsFilter` (feature-aware; fetch data, navigate).
- Screens (`src/app/**`) are the templates/pages layer — they assemble organisms/molecules/atoms.

Reusability bar held: atoms/molecules take data + callbacks via props and never import a service or context directly (only organisms and screens do); all styling is theme-driven via `useTheme`/`src/constants/theme.ts` (light/dark work unchanged); variants are props (`variant`, `size`) rather than duplicate components.

## Phase 7 — Polish & QA — 🔧 PARTIAL (automated + review done; manual pending)

- [x] Loading/error states on every screen that calls the backend (Loader + InlineMessage throughout).
- [x] `npm run lint` clean; `tsc --noEmit` clean (both mobile and api); no stray `any` (only legacy `subJect` model field).
- [x] Web bundle smoke test (`expo export --platform web`) — all routes build, all imports resolve, no bundler errors.
- [x] **Full review pass** — read through every layer for correctness, not just compilation. Fixes applied:
  - `isTeacher` treated an absent `level` as teacher; corrected to `(level ?? 0) !== 0` (absent = student, matching the web app) in `auth-context` and `exam.tsx`.
  - `useTheme` only guarded against `'unspecified'` (a value RN never returns); a `null` scheme would index `Colors[null]` and crash. Hardened to fall back to light.
  - `(auth)` had no index route, so an unauthenticated user could land on `forgot-password` (first alphabetically). Added `(auth)/index.tsx` redirecting to `/sign-in`.
  - Removed dead template files (`app-tabs.*`, `external-link`, `hint-row`, `web-badge`, `ui/collapsible`) left over after the tab→Stack restructure.
- [ ] **Manual pass (needs you / a device)** on iOS simulator, Android emulator, and web (`npm run ios|android|web`) once `.env` is filled in.
- [ ] **Confirm token refresh** (force an access-token expiry and verify the api-client silently refreshes).
- [ ] **Google sign-in + deep-linked password reset** can only be verified with real Google client IDs and the updated reset-email template.

---

## Explicitly out of scope (future)

- Real-time multiplayer (challenge another player, race to answer correctly) — separate effort once this port is stable; will need a WebSocket layer on `exam-ai-api` or a dedicated service, not addressed here.

---

## Progress log

- ✅ **Phase 1** — backend mobile auth routes, refresh tokens, mobile API key, Google verification, fixed `/users/students` routes, docs. `tsc` clean.
- ✅ **Phase 2** — config, secure storage, api-client (refresh+retry), auth context, route guarding.
- ✅ **Phase 3** — auth/user/exams/questions services + models ported. `tsc` clean.
- ✅ **Phase 4** — auth screens (sign-in/up, verify-email, forgot/reset password) + atoms (Button, Label, Loader, TextField) + molecules (FormInput, InlineMessage, GoogleSignInButton) + `useGoogleAuth`.
- ✅ **Phase 5** — `(app)` restructured to a Stack; dashboard, generator, exam-taking, student management, settings screens; organisms (ExamHistory, QuestionsFilter); molecules (Dropdown, DropdownInput, TextArea, SearchBar, Pagination, DataTable, InputButton); utils (calcScore, shuffleArray). `tsc` + lint fully clean.
- ✅ **Phase 6** — atomic components (atoms/molecules/organisms) built incrementally with Phases 4–5.
- ✅ **Phase 7 (automated + review)** — tsc, lint, web bundle all clean; full correctness review done and fixes applied (isTeacher semantics, useTheme null-scheme crash, deterministic auth landing, dead-file cleanup).
- 📄 **Docs** — `README.md` (setup/run), `ARCHITECTURE.md` (design), `CLAUDE.md` updated from the stale template version.
- 🔧 **Phase 7 (manual)** — device/web pass + token-refresh + Google/deep-link verification pending env setup (your action items below).

**Action items for you:**
1. Set real `MOBILE_API_KEY` and `GOOGLE_CLIENT_ID` in `exam-ai-api/.env`.
2. Create `exam-ai-mobile/.env` from `.env.example` with `EXPO_PUBLIC_API_URL=http://localhost:3001` (or LAN IP for devices), `EXPO_PUBLIC_MOBILE_API_KEY` (matching the backend), and the Google client IDs.
3. The password-reset email currently links to the web app — to support mobile deep-linking (`scheme: examaimobile`), the email template in `exam-ai-api` needs updating. Flag when you want this wired.
