# System Review — 2026-07-06

- **Command:** `/system-review` (driver for the `system-improvement-scan` skill)
- **Lenses run:** Security, Reliability & Scalability, Performance, UX/UI, Architecture, Tests, Fragility — all 7 completed on Fable 5 sub-agents.
- **Scope:** `exam-ai-next/` (Next.js 15 frontend). Sub-agents also cross-referenced the sibling `exam-ai-api` backend where a frontend call reached it, but only frontend files are in scope for fixes.
- **Status: NO CODE HAS BEEN CHANGED.** This is a scan report only. Tick the `- [ ] Implement` boxes for what you want done, then tell Claude to implement the checked items.

All paths below are relative to `exam-ai-next/` unless noted.

---

## Summary table

| # | Severity | Lens | One-line description | Files |
|---|----------|------|----------------------|-------|
| 1 | Critical | Security | Proxy never requires a session; API key granted to every caller, incl. unauthenticated | `app/api/proxy/route.ts` |
| 2 | Critical | Security | Correct answers + explanations shipped to students before they submit | `service/exams.service.ts`, `app/exam/page.tsx`, `utils/calc_score.ts`, `models/question.ts` |
| 3 | Critical | Security | Proxy `path` param unvalidated → path traversal / arbitrary backend route reach | `app/api/proxy/route.ts` |
| 4 | Critical | Security | Real-looking `AUTH_SECRET` committed in tracked `.example.env.local` | `.example.env.local`, `.gitignore` |
| 5 | High | Reliability | Proxy forwards backend 4xx/5xx as HTTP 200 — every `res.ok` check is dead | `app/api/proxy/route.ts` |
| 6 | High | Reliability/Fragility | No service checks `res.ok`; error bodies flow onward as `undefined` fields | all `service/*.ts` |
| 7 | High | Reliability/Security | `signIn` callback `finally { return true }` swallows all failures; login always succeeds | `auth.ts` |
| 8 | High | Fragility | Exam page `fetchExam` unguarded → hangs on "Loading..." forever; non-null assert on optional | `app/exam/page.tsx` |
| 9 | High | Reliability | Exam submission failure invisible; answers silently lost | `app/exam/page.tsx` |
| 10 | High | Performance | `getUser` fires on every session read (Google users) → doubles latency on every proxied call | `auth.ts` |
| 11 | Medium | Security | User emails/tokens interpolated into proxy URLs without `encodeURIComponent` | `service/*.ts` |
| 12 | Medium | Security | Sensitive data (email+password, auth responses) logged to browser console | `service/auth.service.ts`, `components/sessions/signin/page.tsx`, `app/reset-password/page.tsx`, `app/verify-email/page.tsx` |
| 13 | Medium | Reliability | Exam create + assign not idempotent; partial failure orphans/duplicates data | `components/sessions/questionsFilter/questions-filter.tsx`, `app/assign-exam/page.tsx` |
| 14 | Medium | Reliability | `startTransition(async …)` defeats surrounding try/catch → unhandled rejection | `app/generator/page.tsx`, `app/exam/page.tsx` |
| 15 | Medium | Performance | Generator re-fetch storm: 3 API calls per keystroke, sequential, categories refetched | `app/generator/page.tsx` |
| 16 | Medium | Performance | Full question payloads downloaded just to derive a subject list; `limit=undefined` sent | `components/sessions/questionsFilter/questions-filter.tsx`, `app/generator/page.tsx`, `service/questions.service.ts` |
| 17 | Medium | Performance | ExamHistory: unbounded fetch, backend N+1 embeds full questions, client-only pagination | `components/sessions/exam_history/exam_history.tsx` |
| 18 | Medium | Fragility | `calcScore` parallel-array indexing throws on length mismatch; blanks history grid | `utils/calc_score.ts`, `components/sessions/exam_history/exam_history.tsx` |
| 19 | Medium | Fragility/Arch | `subject`/`subJect` normalized inconsistently; filter checks only `subject`, drops legacy questions | `models/question.ts`, `app/generator/page.tsx`, `components/sessions/questionsFilter/questions-filter.tsx` |
| 20 | Medium | UX | Instant unconfirmed student delete | `app/student/page.tsx`, `components/elements/table/table.tsx` |
| 21 | Medium | UX | Double-click creates duplicate exams (no pending/disable); uses `alert()` | `components/sessions/questionsFilter/questions-filter.tsx` |
| 22 | Medium | Security | Only route protection is a client-side redirect in `Header`; no middleware/server enforcement | `components/sessions/header/header.tsx` |
| 23 | Low | Architecture | Missing deep `apiClient`; 18 shallow service pass-throughs duplicate fetch/header/error boilerplate | all `service/*.ts` |
| 24 | Low | Architecture/Fragility | Duplicate conflicting `getExams` in two service files | `service/exams.service.ts`, `service/questions.service.ts` |
| 25 | Low | Tests | Zero test infrastructure in the entire repo | `package.json` |
| 26 | Low | UX | Hardcoded fake date `00/00/0000` on every exam card; no empty state | `components/sessions/exam_history/exam_history.tsx` |
| 27 | Low | UX | Sign-in leaks raw NextAuth error; success gives no visible feedback/redirect | `components/sessions/signin/page.tsx` |
| 28 | Low | UX/A11y | Labels not associated with inputs; stray `name` attr renders `name="true"`; exam options are clickable `<div>`s | `components/elements/label/label.tsx`, `components/elements/input/input.tsx`, `app/exam/page.tsx` |
| 29 | Low | Architecture | Pagination+search logic reimplemented 3×; three feedback mechanisms (toast/alert/inline) | `app/student/page.tsx`, `app/assign-exam/page.tsx`, `components/sessions/exam_history/exam_history.tsx` |
| 30 | Low | Reliability | Env vars used with no startup validation; missing var → `undefined/api/...` opaque failure | `app/api/proxy/route.ts`, `service/*.ts` |

---

## Detailed findings

### 1. Proxy never requires a session — API key granted to every caller
**Severity: Critical · Lens: Security · Size: S**

`app/api/proxy/route.ts` fetches `auth()` but never rejects when there is no session, and injects `x-api-key` (the trusted backend key) for every request. Any unauthenticated visitor can call `/api/proxy?path=…` and reach any backend route with full credentials. Student-level users are never authorization-checked either.

**Failure scenario:** `curl 'https://app/api/proxy?path=users/email/victim@x.com'` with no cookies returns the victim's user record. A student hits teacher-only endpoints.

**Fix direction:** Reject with 401 when `!session` before forwarding; enforce level/ownership per path where feasible.

- [ ] Implement

---

### 2. Correct answers shipped to students before submission
**Severity: Critical · Lens: Security · Size: M**

`service/exams.service.ts` `getExam` returns the full exam including `questions[].answer` and `whenWrong` (`models/question.ts:15`). Scoring runs client-side in `utils/calc_score.ts` (`app/exam/page.tsx` around lines 44/108/119). A student can read every correct answer from the network payload or JS state before answering.

**Failure scenario:** Student opens DevTools → Network → sees `answer` index for every question; scores 100% trivially.

**Fix direction:** Strip `answer`/`whenWrong` for students server-side (backend or proxy projection) and score on the backend. Frontend-only partial mitigation is limited; note this likely needs a backend change.

- [ ] Implement

---

### 3. Proxy `path` param unvalidated → path traversal / arbitrary route
**Severity: Critical · Lens: Security · Size: S**

`app/api/proxy/route.ts` builds `${API_URL}/${path}?${query}` from a raw client-supplied `path` with no allow-list or encoding. Combined with #1, this is unauthenticated full backend reachability, including `..` traversal or crafted routes.

**Failure scenario:** `path=../admin/deleteAll` or similar reaches unintended backend routes with the API key attached.

**Fix direction:** Validate `path` against an allow-list of known route prefixes; reject `..` and absolute URLs.

- [ ] Implement

---

### 4. Real-looking `AUTH_SECRET` committed in tracked example env
**Severity: Critical · Lens: Security · Size: XS**

`.example.env.local:1` is git-tracked (`.gitignore` ignores `.env*` but not `.example.env.local`) and holds a real-looking base64 `AUTH_SECRET`. If reused in production, session JWTs are forgeable.

**Failure scenario:** Attacker reads the repo, uses the secret to mint a valid session token for any user.

**Fix direction:** Rotate the secret, blank the value in the example file, add `.example.env.local` to `.gitignore` (and scrub history if it was ever a prod value).

- [ ] Implement

---

### 5. Proxy forwards backend errors as HTTP 200
**Severity: High · Lens: Reliability · Size: XS**

`app/api/proxy/route.ts:39-40` re-serializes the backend body with `NextResponse.json(data)` (default 200) without reading `response.status`. Every client-side `res.ok` check is meaningless; error bodies parse as success data.

**Failure scenario:** Backend returns 500; client sees 200 with `{error:…}`, treats it as data, crashes downstream on missing fields.

**Fix direction:** `NextResponse.json(data, { status: response.status })`.

- [ ] Implement

---

### 6. No service function checks `res.ok` before `res.json()`
**Severity: High · Lens: Reliability/Fragility · Size: M**

Across `service/exams.service.ts`, `user.service.ts`, `auth.service.ts`, `questions.service.ts` (all except `questions.service.ts:105`), functions do `await res.json()` and return `data.exam`/`data.questions` etc. with no status check. Error bodies yield `undefined` fields flowing silently into state.

**Failure scenario:** Backend 500 → `data.questions` is `undefined` → exam page throws on `.length` with no user-visible error.

**Fix direction:** A single shared `fetchJson` helper that throws on `!ok`; migrate services onto it (pairs with #23).

- [ ] Implement

---

### 7. `signIn` callback always returns true via `finally`
**Severity: High · Lens: Reliability/Security · Size: XS**

`auth.ts` (~lines 48-62) has `finally { return true }`, which overrides both the try and catch returns. If backend `createUser` fails, login proceeds with no backend user record; later `getUser` returns undefined and level/students silently break.

**Failure scenario:** Backend down during first Google login → user is signed in but has no backend record; every subsequent feature misbehaves with no error.

**Fix direction:** Return based on real success (or retry); don't return from `finally`.

- [ ] Implement

---

### 8. Exam page `fetchExam` unguarded → infinite "Loading…"
**Severity: High · Lens: Fragility · Size: S**

`app/exam/page.tsx:41-69` has no try/catch and no not-found handling; a failed/`undefined` `getExam` throws on `resp.questions` inside an async effect, leaving the bare `<div>Loading...</div>` forever (line ~362). `exam.questions![currentQuestionIndex]` (line ~196) non-null-asserts an optional field.

**Failure scenario:** Bad `examId` or backend down → student stares at "Loading..." indefinitely, error only in console.

**Fix direction:** try/catch, set an error state with a retry, guard empty questions, remove the non-null assertion.

- [ ] Implement

---

### 9. Exam submission failure is invisible; answers lost
**Severity: High · Lens: Reliability · Size: S**

`app/exam/page.tsx:87-101` `handleSubmit` only `console.error`s on failure — no toast, answers not persisted, student believes they submitted. With #5, a backend error yields `resp.exam === undefined`, `calcScore` throws, and the catch hides it.

**Failure scenario:** Network blip on submit → student's answers gone, no indication, no retry.

**Fix direction:** Validate response shape; surface an error with a retry that preserves answers.

- [ ] Implement

---

### 10. `getUser` fires on every session read (Google users)
**Severity: High · Lens: Performance · Size: S**

`auth.ts:64-71`: for Google users `token.level` is undefined, so `getUser()` runs on every `auth()`/`useSession` read — including inside `app/api/proxy/route.ts:25`, so every proxied API call triggers a second HTTP round-trip to the app's own `/api/proxy`, doubling latency permanently (result never persisted to the token).

**Failure scenario:** Every single API call a Google-authenticated user makes is 2× slower and doubles backend load.

**Fix direction:** Fetch `level` once in the `jwt` callback and persist it on the token.

- [ ] Implement

---

### 11. Emails/tokens interpolated into proxy URLs without encoding
**Severity: Medium · Lens: Security · Size: S**

`service/user.service.ts` (~35,62,79), `auth.service.ts` (~52,64,77,95), `questions.service.ts` (~23,42,104) place emails, reset tokens, and category strings directly into path/query with no `encodeURIComponent`. Special chars (`&`, `/`, `#`, `..`) break out of the intended slot and interact with the proxy's naive `split(/&(.+)/)` query handling.

**Failure scenario:** Email `a&path=admin@x.com` or category with `&` corrupts the forwarded URL / smuggles params.

**Fix direction:** `encodeURIComponent` all interpolated values (best done inside the shared client, #23).

- [ ] Implement

---

### 12. Sensitive data logged to browser console
**Severity: Medium · Lens: Security · Size: XS**

`service/auth.service.ts` (~30,87), `components/sessions/signin/page.tsx:44` (logs sign-in `data` incl. email+password), `app/reset-password/page.tsx:59`, `app/verify-email/page.tsx:64` log full auth responses / credentials.

**Failure scenario:** Credentials and tokens visible in the console and any log-capture browser extension / shared screen.

**Fix direction:** Remove these `console.log`s.

- [ ] Implement

---

### 13. Exam create + assign not idempotent
**Severity: Medium · Lens: Reliability · Size: M**

`components/sessions/questionsFilter/questions-filter.tsx:110-124` `goToExam` has no try/catch and gates success on a magic string; a succeeded insert with unexpected message wording orphans an exam and a retry duplicates it. `app/assign-exam/page.tsx:96-100` trusts `resp.message` and clears the draft without checking `acknowledged`/`insertedCount`, so a partial/failed multi-student assign still shows success and loses the draft.

**Failure scenario:** Assign to 5 students, backend inserts 2 then errors → UI says success, draft cleared, 3 students silently unassigned.

**Fix direction:** Wrap in try/catch; navigate/clear only on verified success (`insertedId` present, `insertedCount === selected.length`).

- [ ] Implement

---

### 14. `startTransition(async …)` defeats try/catch
**Severity: Medium · Lens: Reliability · Size: S**

`app/generator/page.tsx:133-140` and `app/exam/page.tsx:162-172` put an async callback inside `startTransition`; rejections escape the surrounding try/catch → unhandled rejection, leaving the user mid-flow with no feedback.

**Failure scenario:** `generateQuestions` rejects → no error shown, "Gerar" appears to do nothing.

**Fix direction:** Put try/catch *inside* the transition callback (or await before the transition).

- [ ] Implement

---

### 15. Generator re-fetch storm per keystroke
**Severity: Medium · Lens: Performance · Size: S**

`app/generator/page.tsx:58-92`: `DropdownInput` updates `formData.category/subCategory` on every keystroke and the effect depends on both, firing ~3 API calls per character, awaited sequentially; `getCategory` (independent of the deps) is refetched every time.

**Failure scenario:** Typing a 10-char category = ~30 sequential backend calls.

**Fix direction:** Debounce input, `Promise.all` the independent calls, fetch categories once on mount.

- [ ] Implement

---

### 16. Full question payloads downloaded to derive a subject list
**Severity: Medium · Lens: Performance · Size: M**

`components/sessions/questionsFilter/questions-filter.tsx:72-85` and `app/generator/page.tsx:68-81` call `getQuestions` (full docs incl. options/answers/explanations) only to derive distinct subjects + a count. `service/questions.service.ts:23` sends literal `limit=undefined` and the backend ignores `limit` → unbounded query.

**Failure scenario:** Selecting a category with thousands of questions downloads them all to show a dropdown.

**Fix direction:** Add a distinct-subjects endpoint or projection; send a real numeric `limit`. (Full fix touches backend; frontend can at least stop requesting full docs / fix the `limit`.)

- [ ] Implement

---

### 17. ExamHistory: unbounded fetch + backend N+1
**Severity: Medium · Lens: Performance · Size: M**

`components/sessions/exam_history/exam_history.tsx:19-30` fetches every exam for the user; the backend embeds full question arrays (one `Question.find` per exam) — all downloaded to render a title + last 3 scores, paginated only client-side.

**Failure scenario:** A teacher with hundreds of exams downloads megabytes and triggers hundreds of backend queries per page load.

**Fix direction:** Server-side pagination + projection excluding `questions`. (Backend-assisted; frontend switches to paged fetch.)

- [ ] Implement

---

### 18. `calcScore` parallel-array indexing throws on mismatch
**Severity: Medium · Lens: Fragility · Size: S**

`utils/calc_score.ts:10` compares `result[i] === exam.questions![i].answer`, assuming `answers[n].length === questions.length` and index alignment. After regeneration or a question-count change it reads `undefined.answer` and throws — uncaught in `exam_history.tsx` (~line 105), blanking the whole history grid. Also division by zero when `result.length === 0`.

**Failure scenario:** One exam with misaligned arrays makes the entire exam history render blank.

**Fix direction:** Guard `i < questions.length` and empty-result case; isolate per-card failures.

- [ ] Implement

---

### 19. `subject`/`subJect` normalized inconsistently
**Severity: Medium · Lens: Fragility/Architecture · Size: S**

`models/question.ts:10-11` carries both casings. `app/generator/page.tsx:78` and `questions-filter.tsx:78` coalesce, but `questions-filter.tsx:94-96` checks only `question.subject`, so a `subJect`-only question appears in the dropdown but filters to zero results silently.

**Failure scenario:** Legacy questions vanish from filtered results with no error.

**Fix direction:** Normalize to `subject` once at fetch time in `getQuestions`; remove `subJect` from the model.

- [ ] Implement

---

### 20. Instant unconfirmed student delete
**Severity: Medium · Lens: UX · Size: S**

`app/student/page.tsx:55-65` + `components/elements/table/table.tsx:51-57`: clicking Delete removes the student immediately, no confirmation naming the email, button not visually destructive.

**Failure scenario:** Accidental click permanently removes a student with no undo.

**Fix direction:** Confirm dialog naming the email ("Remover estudante x@y.com?"); visually distinct destructive button.

- [ ] Implement

---

### 21. Double-click creates duplicate exams
**Severity: Medium · Lens: UX · Size: S**

`components/sessions/questionsFilter/questions-filter.tsx:110-124`: `goToExam` calls `insertExam` with no pending/disabled state and no error handling; uses `alert()` (lines ~112,138).

**Failure scenario:** Impatient double-click creates two exams.

**Fix direction:** Disable the button while awaiting; replace `alert()` with the toast pattern; show failure feedback. (Overlaps #13.)

- [ ] Implement

---

### 22. Route protection is client-side only
**Severity: Medium · Lens: Security · Size: M**

`components/sessions/header/header.tsx:14-21` is the only access control (a `useSession()` redirect); there is no `middleware.ts` and the proxy enforces nothing (#1). Pages rendered without `<Header>`, or direct data/API access, bypass it entirely.

**Failure scenario:** Direct navigation/API call skips the redirect and reaches protected data.

**Fix direction:** Add `middleware.ts` (or layout-level server checks); pair with proxy auth (#1). Note this is the same root cause as #1 from the UI side.

- [ ] Implement

---

### 23. Missing deep `apiClient` module
**Severity: Low · Lens: Architecture · Size: M**

All ~18 functions in `service/*.ts` are shallow pass-throughs (fetch → `res.json()` → unwrap) duplicating header boilerplate, base-URL resolution (`NEXT_PUBLIC_DOMAIN_URL` vs relative), and missing status checks. The depth belongs in one `apiClient(path, opts)` that owns URL building (with encoding, #11), headers, and status checking (#6).

**Failure scenario:** A change to error handling or encoding must be repeated in 18 places; one gets missed.

**Fix direction:** Extract a typed `fetchJson`/`apiClient`; migrate services onto it. Enables #6, #11, #30.

- [ ] Implement

---

### 24. Duplicate conflicting `getExams`
**Severity: Low · Lens: Architecture/Fragility · Size: XS**

`service/exams.service.ts:29` (`exams/{email}/by-user-email`, typed `Exam[]`) vs `service/questions.service.ts:103` (`exams?userEmail=`, `any[]`, unused). Two adapters at a fake seam; a backend route change fixes one and silently breaks the other.

**Fix direction:** Delete the `questions.service.ts` copy.

- [ ] Implement

---

### 25. Zero test infrastructure
**Severity: Low · Lens: Tests · Size: M (to bootstrap)**

`package.json` has no `test` script and no jest/vitest/playwright/testing-library deps; no config or test files anywhere. Coverage is zero, so every finding above has no safety net.

**Fix direction:** Add vitest + a `test` script; first tests at the highest-value pure seams — `calcScore` (#18), proxy URL/query building (extract `buildTargetUrl`), auth callback level logic (#7/#10), service URL encoding (#11).

- [ ] Implement

---

### 26. Hardcoded fake date on every exam card + no empty state
**Severity: Low · Lens: UX · Size: S**

`components/sessions/exam_history/exam_history.tsx:96` renders literal `Criada em 00/00/0000 ás 00:00:00`. Zero exams shows a blank grid with "Página 1 de 0"; no loading/error state.

**Fix direction:** Render real `createdAt`; add an empty state with a "Gerar questões" CTA; add loading/error states.

- [ ] Implement

---

### 27. Sign-in leaks raw error; success gives no feedback
**Severity: Low · Lens: UX · Size: S**

`components/sessions/signin/page.tsx:55-63`: `setError(\`Credenciais Invalidas ${result.error}\`)` shows the raw NextAuth error; on success only `console.log`, no redirect/feedback; submit button never disabled during flight.

**Fix direction:** Friendly message, `router.push` on success, disable during flight.

- [ ] Implement

---

### 28. Inaccessible labels/inputs/options
**Severity: Low · Lens: UX/A11y · Size: S**

`components/elements/label/label.tsx:11` has no `htmlFor`; `components/elements/input/input.tsx:24` has a stray bare `name` JSX attribute (renders `name="true"`) and no `id`/`autocomplete`. `app/exam/page.tsx:203-243` renders answer options as clickable `<div>`s (not focusable, correctness by color alone).

**Fix direction:** Thread `id`/`htmlFor`/`autoComplete`; make options `<button>`/radios with visible focus and non-color correctness cues.

- [ ] Implement

---

### 29. Pagination/search + feedback duplicated
**Severity: Low · Lens: Architecture · Size: M**

Identical filter/slice/`totalPages` logic in `app/student/page.tsx:71-96`, `app/assign-exam/page.tsx:59-75`, `exam_history.tsx:49-69`; `exam_history` stores `totalPages` in a `useRef` mutated in effects so the label/Next-button render stale. Three feedback mechanisms coexist (toast components, `alert()`, inline `<p>`).

**Fix direction:** Extract a `usePagination` hook and standardize on one toast module (`react-hot-toast` is already a dependency).

- [ ] Implement

---

### 30. Env vars used with no startup validation
**Severity: Low · Lens: Reliability · Size: S**

`app/api/proxy/route.ts:22,31` (`API_KEY` defaults to `''`, `API_URL` interpolates as `undefined/...`), `service/auth.service.ts:20`, `service/user.service.ts:17` (`NEXT_PUBLIC_DOMAIN_URL`). A missing var produces fetches to `undefined/api/...`, discovered only as opaque request failures.

**Fix direction:** Assert required env vars at startup (a config module that throws on missing).

- [ ] Implement

---

## Clean areas (checked, found healthy)

- **No DOM XSS:** no `dangerouslySetInnerHTML` or raw HTML rendering anywhere.
- **No resource leaks:** the interval in `verify-email/page.tsx:28-31` and the listener in `dropdown_input.tsx:45-48` both clean up correctly.
- **Google OAuth wiring** itself is standard NextAuth v5; issues are in the callbacks (#7, #10), not the provider setup.
- `dropdown_input.tsx` `normalize()` recompute per keystroke was noted but is cheap (O(options)); not worth its own fix.

---

## Suggested implementation order

**Wave 1 — Security-critical (do first, some need backend coordination):**
- #4 (rotate/scrub secret — XS, do immediately), #1 + #22 (proxy auth + middleware — same root cause), #3 (path allow-list), #2 (hide answers from students — needs backend).

**Wave 2 — Reliability foundation (one refactor unlocks several):**
- #23 (extract `apiClient`) as the vehicle for #5, #6, #11, #30; then #7 (signIn), #10 (session-read latency), #24 (delete dup).

**Wave 3 — Data-integrity bugs:**
- #8, #9, #13, #14, #18, #19.

**Wave 4 — Performance:**
- #15, #16, #17 (last two benefit from backend projections).

**Wave 5 — UX & cleanup:**
- #20, #21, #26, #27, #28, #29, #12 (console logs — cheap, can be done any time), #25 (bootstrap tests to lock in the above).
