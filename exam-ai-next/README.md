# Exam-AI

Exam-AI is an AI-powered exam generator for teachers and students. Teachers can generate multiple-choice questions from a topic, text, or URL using AI, assemble exams from existing questions, and assign them to students. Students receive exams through their teacher's account and can take them directly in the browser.

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** React 19, CSS Modules, Geist fonts
- **Authentication:** NextAuth v5 (Google OAuth + email/password credentials)
- **Forms:** React Hook Form, Yup
- **HTTP:** native `fetch` (client-side), Axios available in dependencies
- **Icons:** lucide-react, react-icons
- **Toasts:** react-hot-toast

## Prerequisites

- Node.js >= 18
- npm

## Environment variables

Copy `.example.env.local` to `.env.local` and fill in the values.

| Variable                  | Required | Description                                                                 |
|---------------------------|----------|-----------------------------------------------------------------------------|
| `AUTH_SECRET`             | Yes      | Secret used by NextAuth to sign JWTs and encrypt session tokens             |
| `AUTH_GOOGLE_ID`          | Yes      | Google OAuth client ID                                                      |
| `AUTH_GOOGLE_SECRET`      | Yes      | Google OAuth client secret                                                  |
| `API_KEY`                 | Yes      | API key sent as `x-api-key` header on every proxied request to the backend  |
| `API_URL`                 | Yes      | Base URL of the backend API (e.g., `https://api.example.com`)               |
| `NEXT_PUBLIC_DOMAIN_URL`  | Yes      | Public domain of the frontend (e.g., `http://localhost:3000`). Used for OAuth redirect URIs and absolute URLs in server-side service calls |

### Google OAuth setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Go to **APIs & Services > Credentials** and create an OAuth 2.0 Client ID.
3. Under **Authorized JavaScript origins**, add `http://localhost:3000`.
4. Under **Authorized redirect URIs**, add `http://localhost:3000/api/auth/callback/google`.
5. Copy the client ID and secret into `.env.local`.

## Installation

```bash
npm install
```

## Running locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Building for production

```bash
npm run build
npm start
```

Run `npm run build` before committing to verify there are no build errors.

## Project structure

```
exam-ai-next/
├── app/                  # Next.js App Router: pages, layouts, API routes
│   ├── api/
│   │   ├── auth/         # NextAuth catch-all route
│   │   └── proxy/        # Generic reverse proxy to the backend
│   ├── exam/             # Exam-taking page
│   ├── generator/        # AI question generator form
│   ├── home/             # Dashboard (exam history + question filter)
│   ├── student/          # Student management page
│   ├── signup/           # Account registration
│   ├── forgot-password/  # Password reset request
│   ├── reset-password/   # Password reset via token
│   ├── verify-email/     # Email verification via code
│   └── about/            # Static about page
├── components/
│   ├── elements/         # Reusable UI primitives (Button, Input, Table, etc.)
│   └── sessions/         # Layout-level components (Header, Footer, SignIn, etc.)
├── context/              # React context providers (NextAuth SessionProvider wrapper)
├── models/               # TypeScript interfaces (User, Exam, Question)
├── service/              # API call functions grouped by resource
└── utils/                # Utility functions (score calculation, array shuffle)
```

## Key flows

- **Sign in:** User authenticates via Google OAuth or email/password. On first Google login, an account is created automatically in the backend. The user's `level` field is fetched from the backend and attached to the session.
- **Generate questions:** A teacher fills in the generator form (category, subcategory, topic, language, number of questions, optional prompt). The backend AI generates questions and creates an exam. The browser navigates to the exam page.
- **Take an exam:** The exam is loaded by ID from the URL (`/exam?examId=...`). Options are shuffled on load. The user answers all questions and submits. Results are saved and a score percentage is shown.
- **Manage students:** A teacher adds students by email on the `/student` page. From the home dashboard, the teacher can assign exams to all students in their list.

## Git flow

```sh
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# After finishing
git commit -m "feat: description"
git push origin feature/my-feature
# Open a Pull Request: feature/my-feature → develop
```

## Commit types

| Prefix       | Use                                                  |
|--------------|------------------------------------------------------|
| `feat`       | New feature                                          |
| `fix`        | Bug fix                                              |
| `docs`       | Documentation changes                                |
| `style`      | Formatting, whitespace (no logic change)             |
| `refactor`   | Code restructuring without fixing bugs or adding features |
| `test`       | Adding or updating tests                             |
| `chore`      | Build scripts, tooling                               |

## Definition of Done

- Clean Code
- Atomic Design component structure
- Responsive layout
- No build errors (`npm run build` passes)
- No bugs

## License

MIT
