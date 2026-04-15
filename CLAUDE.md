# exam-ai

## Project overview

`exam-ai` is a monorepo with two packages:

- **`exam-ai-api`** — Backend REST API built with Node.js/TypeScript and Express, deployed via Serverless Framework on AWS Lambda. Handles auth, file uploads, AI-based exam/question generation, and user management.
- **`exam-ai-next`** — Frontend built with Next.js 15 + TypeScript. Provides the UI for signing in, generating exams, taking exams, and viewing history.

## Repository structure

```
exam-ai/
├── exam-ai-api/          # Backend (Node.js + Express + Serverless)
│   ├── src/
│   │   ├── ai/           # AI logic for generating/regenerating questions
│   │   ├── config/       # App config (env vars)
│   │   ├── controller/   # Route controllers (auth, exam, file, questions, user)
│   │   ├── db/           # MongoDB connection
│   │   ├── emails/       # Email templates
│   │   ├── middlewares/  # Auth (JWT), API key, and validation middleware
│   │   ├── models/       # MongoDB data models
│   │   ├── repository/   # DB access layer
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # External services (OpenAI, S3/multer, email)
│   │   ├── tools/        # Shared utilities
│   │   ├── app.ts        # Express app setup
│   │   └── server.ts     # Entry point (local + Lambda handler export)
│   ├── docs/             # OpenAPI/Swagger spec (api.yml)
│   └── serverless.yml    # AWS Lambda deployment config
│
└── exam-ai-next/         # Frontend (Next.js 15)
    ├── app/              # Next.js App Router pages
    │   ├── api/          # API routes (NextAuth, proxy)
    │   ├── exam/         # Exam-taking page
    │   ├── generator/    # Exam generator page
    │   ├── home/         # Home/dashboard
    │   ├── signup/       # Registration
    │   ├── forgot-password/ / reset-password/ / verify-email/
    │   └── student/      # Student view
    ├── components/       # Reusable UI components
    │   ├── elements/     # Atomic UI elements (button, input, table, etc.)
    │   └── sessions/     # Composite components (header, footer, signin, etc.)
    ├── context/          # React context providers
    ├── models/           # TypeScript interfaces (exam, question, user)
    ├── service/          # Frontend API service layer (exams, questions, user)
    └── utils/            # Utility functions (score calculation, shuffle)
```

## Tech stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js 20, TypeScript |
| Backend framework | Express |
| Deployment | Serverless Framework → AWS Lambda |
| Database | MongoDB |
| AI / question generation | OpenAI API (via `openai` npm package) |
| File storage | AWS S3 (via `multer-s3`) |
| Email | MailerSend + NodeMailer |
| Auth (backend) | JWT (`jsonwebtoken`) |
| Validation | Joi |
| Frontend | Next.js 15, TypeScript, React 19 |
| Auth (frontend) | NextAuth.js v5 (beta) with Google OAuth |
| Forms | React Hook Form + Yup |
| HTTP client | Axios |

## API routes

The backend exposes these route groups under `/`:

| Route prefix | Controller | Purpose |
|---|---|---|
| `/users` | `user.controller.ts` | User CRUD |
| `/auth` | `auth.controller.ts` | Login, register, token refresh |
| `/files` | `file.controller.ts` | S3 file uploads |
| `/questions` | `questions.controller.js` | AI question generation |
| `/exams` | `exam.controller.js` | Exam creation and history |

Swagger docs available at `/api-docs` in local dev mode.

## Development

### Backend

```bash
cd exam-ai-api
npm run dev        # ts-node-dev with hot reload
npm run build      # compile TypeScript to dist/
```

### Frontend

```bash
cd exam-ai-next
npm run dev        # Next.js dev server (http://localhost:3000)
npm run build
npm start
```

### Environment variables

**Backend** — copy `.env.example` to `.env` and fill in:
- MongoDB connection string
- JWT secret
- OpenAI API key
- AWS credentials / S3 bucket
- MailerSend API key

**Frontend** — copy `.example.env.local` to `.env.local` and fill in:
- `AUTH_SECRET` — NextAuth secret
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth app credentials
- `API_KEY` — backend API key
- `API_URL` — backend base URL
- `NEXT_PUBLIC_DOMAIN_URL` — public domain (default `http://localhost:3000`)

## Deployment

The backend is deployed to AWS Lambda via the Serverless Framework:

```bash
cd exam-ai-api
npx serverless deploy --stage prod
```

The Lambda handler is exported from `src/server.ts` as `handler`.
