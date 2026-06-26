# Exam-AI Mobile

The React Native (Expo) client for **Exam-AI** — teachers generate AI-powered multiple-choice exams, manage students, and assign exams; students take exams on their phone. It's a port of the `exam-ai-next` web app and talks to the same backend, `exam-ai-api`.

- **Stack**: Expo SDK 56, React Native 0.85, React 19, expo-router, React Hook Form + Yup.
- **Architecture**: see [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- **Port history & remaining QA**: see [`PLAN.md`](./PLAN.md).

---

## Prerequisites

- Node.js 18+ and npm
- The **`exam-ai-api`** backend running locally (defaults to `http://localhost:3001`)
- One of: iOS Simulator (macOS), Android emulator, the **Expo Go** app on a physical device, or just a web browser
- For Google sign-in: a Google Cloud OAuth client (optional for the rest of the app)

---

## 1. Start the backend (`exam-ai-api`)

In the `exam-ai-api` project:

1. Create its `.env` from `.example.env` and fill in **at least**:
   - `API_KEY` — the existing shared key
   - `MOBILE_API_KEY` — a new value the mobile app will send as `x-mobile-api-key` (any non-empty string; it just identifies the official app)
   - `GOOGLE_CLIENT_ID` — only needed for Google sign-in; must equal the Google **client ID whose ID token the app sends** (see step 3)
   - the usual `DB_URI`, `DB_NAME`, `SECRET`, email/OpenAI keys
2. Run it: `npm run dev` (serves on `http://localhost:3001`).

---

## 2. Configure the mobile app

```bash
npm install
cp .env.example .env   # then edit .env
```

Fill in `.env` (all vars are `EXPO_PUBLIC_*`, inlined into the bundle — **non-secret only**):

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL, no trailing slash. See the note below. |
| `EXPO_PUBLIC_MOBILE_API_KEY` | Must match `MOBILE_API_KEY` in the backend `.env`. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth **web** client ID (also the backend's `GOOGLE_CLIENT_ID`). |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth iOS client ID (optional). |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Google OAuth Android client ID (optional). |

### Which `EXPO_PUBLIC_API_URL`?

`localhost` means "this device", so it differs by target:

| Running on | Use |
|---|---|
| Web browser | `http://localhost:3001` |
| iOS Simulator | `http://localhost:3001` |
| Android emulator | `http://10.0.2.2:3001` |
| Physical device (Expo Go) | `http://<your-computer-LAN-IP>:3001` (e.g. `http://192.168.1.20:3001`) |

> After editing `.env`, restart the dev server so the new values are picked up.

---

## 3. Run the app

```bash
npm start          # Metro dev server; press i / a / w, or scan the QR with Expo Go
# or target directly:
npm run ios
npm run android
npm run web
```

---

## Google sign-in (optional)

1. In Google Cloud Console, create OAuth client IDs (Web, plus iOS/Android if you build native).
2. Put the IDs in the mobile `.env` (table above).
3. Set the backend `GOOGLE_CLIENT_ID` to the **same client ID whose ID token the app will send**. The token's audience must match what the backend verifies — easiest is to use the **web** client ID across both. If you ship native client IDs, the backend must accept those audiences too.

Email/password sign-up, sign-in, verification, and password reset all work **without** any Google setup.

---

## Password reset deep link (not yet wired)

The reset-password screen reads a `token` from the URL (the app's scheme is `examaimobile`, e.g. `examaimobile://reset-password?token=...`). The reset **email** sent by `exam-ai-api` currently links to the **web** app, so reset isn't end-to-end on mobile until that email template is updated to the mobile deep link. The screen itself works if you navigate to it with a token.

---

## Project scripts

| Script | What it does |
|---|---|
| `npm start` | Start Metro / Expo dev server |
| `npm run ios` / `android` / `web` | Start on a specific platform |
| `npm run lint` | ESLint (`expo lint`) |
| `npx tsc --noEmit` | Type-check (strict) |
| `npx expo export --platform web` | Production web bundle (also a build smoke test) |

---

## Troubleshooting

- **Requests fail / "Forbidden: Invalid mobile API key"** — `EXPO_PUBLIC_MOBILE_API_KEY` doesn't match the backend's `MOBILE_API_KEY`, or the backend isn't running.
- **Network request failed on a device** — you're using `localhost`; switch `EXPO_PUBLIC_API_URL` to your machine's LAN IP (see the table) and ensure both are on the same network.
- **Config warnings in the console** (`Missing required env var ...`) — `.env` is missing or incomplete; create it from `.env.example` and restart.
- **Stuck on the loading spinner** — the app is calling `/auth/mobile/me`; check the backend is reachable at `EXPO_PUBLIC_API_URL`.
