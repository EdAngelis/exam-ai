# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

This project is on **Expo SDK 56**, which changed significantly from earlier SDKs (new `expo-file-system` API, `expo-router/unstable-native-tabs`, stable Expo UI, RN 0.85/React 19.2). Before writing code that touches Expo APIs, check the versioned docs at https://docs.expo.dev/versions/v56.0.0/ rather than relying on patterns from older SDKs.

`exam-ai-mobile` is the React Native (Expo) port of the `exam-ai-next` web app. It reuses the same backend, `exam-ai-api`, but talks to it **directly** (there is no Next.js proxy in React Native). See `ARCHITECTURE.md` for the full design and `README.md` for setup/run instructions. See `PLAN.md` for the port history and remaining QA items.

## Commands

- `npm install` — install dependencies
- `npm start` (or `npx expo start`) — start the Metro dev server; choose iOS/Android/web/Expo Go from the CLI output
- `npm run android` / `npm run ios` / `npm run web` — start directly on a given platform
- `npm run lint` — runs `expo lint` (ESLint)
- `npx tsc --noEmit` — type-check (strict mode)
- `npx expo export --platform web` — production bundle; doubles as a smoke test that everything resolves/compiles
- `npm run reset-project` — moves starter code to `app-example/` and resets `src/app/`; destructive, do not run
- No test runner is configured yet.

## Architecture (summary — see ARCHITECTURE.md for detail)

Three layers, mirroring the web app: **screens** (`src/app/**`) → **service layer** (`src/service/*`) → **api-client** (`src/lib/api-client.ts`) → `exam-ai-api`. Auth state lives in a React context; tokens live in secure storage.

- **Routing**: `expo-router`, file-based under `src/app/`. There's no top-level `app/` dir — expo-router falls back to `src/app/`. `typedRoutes` is on, so links/params are type-checked.
  - Two route groups gated by the root `_layout.tsx` via `<Stack.Protected guard={...}>`: `(app)` (authenticated; a Stack of the `(tabs)` dashboard, `generator`, `exam`, `student`, `assign-exam`, `settings`, and the `game/*` screens) and `(auth)` (public; `sign-in`, `sign-up`, `verify-email`, `forgot-password`, `reset-password`, plus an `index` that redirects to `/sign-in`).
  - `(app)/(tabs)` is a bottom `NativeTabs` navigator: Home (`index`), Multi-player (`multiplayer` — the two-player Game feature's entry point/history), History (`history`).
  - `game/new` → `game/[gameId]/lobby` → `game/[gameId]/play` → `game/[gameId]/result` are pushed Stack screens (not tabs), backed by `service/game.service.ts` and `types/game.ts`. Same HTTP-polling design as `exam-ai-next`'s `/game/*` pages — no WebSocket layer.
  - Both `(app)/index` (inside `(tabs)`) and `(auth)/index` map to `/`; the guard decides which is live. This is the canonical expo-router auth pattern — keep it.
- **Auth**: `src/context/auth-context.tsx` exposes `user`, `status` (`loading|authenticated|unauthenticated`), `isTeacher`, and `signIn`/`signUp`/`signInWithGoogle`/`signOut`. It restores the session on launch via `GET /auth/mobile/me`. `isTeacher` is `(user.level ?? 0) !== 0` (absent level = student, matching the web app). Google sign-in uses the `useGoogleAuth` hook (`expo-auth-session`) to get an ID token, which the context exchanges via the backend.
- **Networking**: `src/lib/api-client.ts` injects the `x-mobile-api-key` header + bearer access token, and on a `401` does a single silent refresh via `/auth/mobile/refresh` (de-duped across concurrent requests) before replaying once; an unrecoverable 401 triggers sign-out. It returns the **full parsed body** typed by the caller because `exam-ai-api`'s response envelopes are inconsistent (user/auth use `{ message, data }`; exams/questions use ad-hoc keys like `{ exam }`, `{ questions }`, `{ id }`). Services read the right key.
- **Tokens**: `src/lib/secure-storage.ts` wraps `expo-secure-store` (with a `localStorage` fallback on web).
- **Config / env**: `src/constants/config.ts` reads `EXPO_PUBLIC_*` vars (inlined at build time, so non-secret only). `.env` is gitignored; copy `.env.example`.
- **Components — Atomic Design** under `src/components/`:
  - `atoms/` (`Button`, `Label`, `Loader`, `TextField`) and the pre-existing `themed-text`/`themed-view` — presentation-only, no business logic.
  - `molecules/` (`FormInput`, `InlineMessage`, `Dropdown`, `DropdownInput`, `TextArea`, `SearchBar`, `Pagination`, `DataTable`, `InputButton`, `GoogleSignInButton`) — compositions of atoms, still props-only.
  - `organisms/` (`ExamHistory`, `QuestionsFilter`) — feature-aware: they may fetch data and navigate.
  - Screens are the templates/pages layer. **Rule**: atoms/molecules never import a service or context; only organisms and screens do. Add variants via props (`variant`, `size`), not duplicate components.
- **Theming**: single source of truth is `src/constants/theme.ts` (`Colors.light`/`Colors.dark`, `Fonts`, `Spacing`, `MaxContentWidth`). `useTheme()` returns the resolved color object (falls back to light when the scheme is null). Use `ThemedText`/`ThemedView` and theme colors, never hardcoded hex, so dark mode keeps working.
- **Forms**: React Hook Form + Yup via `yupResolver`, bound through the `FormInput` molecule. When a schema has an optional field, give it a `.default('')` or derive the form type with `yup.InferType` so the resolver's input/output types line up (RHF v7's third generic is strict).
- **Color scheme on web**: `use-color-scheme.ts` has a `.web.ts` sibling deferring to a post-hydration value. Metro resolves per platform; keep this `name.tsx` + `name.web.tsx` pairing (also used by `animated-icon`).
- **React Compiler**: enabled via `experiments.reactCompiler` — don't hand-write `useMemo`/`useCallback`/`React.memo` for what the compiler handles.
- **Styling**: plain RN `StyleSheet.create`, no CSS-in-JS. `src/global.css` only declares web font CSS variables.
- **Native projects aren't checked in**: `/ios` and `/android` are gitignored (managed workflow). Custom native code needs `npx expo prebuild`.

## Conventions

- Component/hook files are kebab-case (`themed-text.tsx`, `use-color-scheme.ts`), not PascalCase.
- Use the `@/` alias for cross-directory imports inside `src/`.
- `strict` TypeScript: no `any` except the legacy `subJect` model field. Both `npx tsc --noEmit` and `npm run lint` must be clean before committing.
- Don't read `question.subject` without also checking `question.subJect` — both casings exist in backend data.
