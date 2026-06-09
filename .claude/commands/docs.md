You are a technical writer. Your job is to generate four documentation files for the current project. All documentation must be grounded in what you actually find in the codebase — do not invent features, endpoints, or conventions.

---

## Step 1 — Discover the project

Start by understanding what kind of project this is and where the source lives.

- Check the root for `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, or equivalent to identify the language and runtime.
- Identify the project entry points: `src/`, `app/`, `lib/`, `cmd/`, or similar.
- Read the root-level config files (e.g., `next.config.ts`, `vite.config.ts`, `tsconfig.json`, `Dockerfile`, `docker-compose.yml`).
- Look for an existing `README.md` or `CLAUDE.md` and read them if present — they may contain context you should preserve or update.
- Read `.env.example`, `.env.local.example`, or any other env template files for required environment variables.
- Identify the authentication system (if any), API layer, data models, services/utilities, and UI components.
- Scan folder structure with Glob to understand the overall layout before diving into files.

Take the time to read all critical source files before writing. Do not write documentation based on folder names alone.

---

## Step 2 — Write `README.md`

Write this file at the **project root** (same level as `package.json` or equivalent).

**Audience:** Any developer who is new to the project and needs to understand what it is and how to get it running.

**Structure:**

1. **Project name and purpose** — One paragraph explaining what the project does and who it is for.
2. **Tech stack** — The key languages, frameworks, and libraries used (derive from the dependency manifest).
3. **Prerequisites** — Runtime versions, required tools (e.g., Node.js >= 20, Docker, etc.).
4. **Environment variables** — A table or list of every variable found in the env template, with a short description of what each one does and whether it is required or optional.
5. **Installation** — Step-by-step commands to install dependencies.
6. **Running locally** — How to start the development server or run the app.
7. **Building for production** — Build and start commands (if applicable).
8. **Project structure** — A short annotated tree of the top-level directories and what each contains.
9. **Key flows** — 2–4 bullet points describing the main user journeys or system flows (derive from pages, routes, or entrypoints you read).
10. **Contributing** — Only include this section if a `CONTRIBUTING.md` or contribution guidelines already exist.

Rules:
- Do not include sections with no real content.
- Do not add emojis or badges.
- Do not speculate about features you did not find in the code.

---

## Step 3 — Write `CLAUDE.md`

Write this file at the **project root**.

**Audience:** Claude Code itself — this file is loaded at the start of every AI-assisted coding session to provide context.

**Structure:**

1. **Project overview** — One paragraph: what the app does, who uses it, and the main flows.
2. **Architecture** — How the system is structured: layers, key patterns (e.g., proxy pattern, MVC, service layer), and how components/modules connect to each other.
3. **Authentication** — How auth works in this project: provider, session handling, token strategy, protected vs public routes.
4. **Data models** — Summarize the core data types or database schemas found in `models/`, `types/`, `schema/`, or equivalent. Include field names and their purpose.
5. **Service / business logic layer** — List service files or modules and the key functions each exposes, with one-line descriptions.
6. **API layer** — Internal API routes (if any) and how they work. How the frontend communicates with the backend (direct calls, proxy, GraphQL, etc.).
7. **UI / pages** — List each page or view with its route and a one-line description of what it does.
8. **Components** — Describe the component organization (e.g., primitive elements vs layout sections). List notable components and their purpose.
9. **Conventions** — Coding patterns, naming conventions, styling approach, file co-location rules, import patterns — derived from reading the actual source files.
10. **Environment variables** — Which variables are required and what breaks without them.
11. **What NOT to do** — Based on what you observe in the codebase, list things that should never be done (e.g., bypass the proxy, expose secrets to the client, skip validation).

Rules:
- Be specific and factual. This file is read by an AI, so precision matters more than readability.
- Do not add filler or pleasantries.

---

## Step 4 — Write `API.md`

Write this file at the **project root** (or inside a `docs/` folder if one exists).

**Audience:** Developers who need to understand the API surface: what routes exist, what they accept, and what they return.

If the project has no API (pure frontend, CLI tool, library), write a short `API.md` stating that and skip the rest of this step.

**Structure:**

1. **Overview** — Describe the API architecture: REST, GraphQL, RPC, internal proxy, etc. Explain any authentication mechanism used on API routes (API key, session cookie, Bearer token).
2. **Base URL / configuration** — How the API URL is configured (env var name and default).
3. **Internal routes** — For each route handler found in the codebase:
   - Method(s) and path
   - Purpose
   - Query parameters (name, type, required/optional, description)
   - Request body schema (if applicable)
   - Response shape
   - Error responses
4. **External / backend endpoints consumed** — If the app proxies to or calls a separate backend, document every endpoint it calls (grouped by resource). Include method, path, parameters, request body, and return shape.
5. **Data schemas** — The TypeScript interfaces, Zod schemas, Pydantic models, or equivalent type definitions for all request/response bodies.

Rules:
- Derive every endpoint from actual fetch/axios/http calls found in the service layer or route handlers.
- Do not document hypothetical endpoints.

---

## Step 5 — Write `FRONT.md`

Write this file at the **project root** (or inside `docs/` if one exists).

If the project has no frontend (pure API, CLI, library), write a short `FRONT.md` stating that and skip the rest of this step.

**Audience:** Frontend developers who need to understand the UI structure, components, and state management patterns.

**Structure:**

1. **Routing** — How routing works (file-based, React Router, etc.). List every page/route with its path and purpose.
2. **Layouts** — How layouts are structured. Which layouts wrap which pages.
3. **Pages** — For each page/view:
   - Route path
   - What the user does on this page
   - Key local state
   - Which services or API calls it makes
   - Auth requirement (protected / public)
4. **Component system** — How components are organized. For each component (or component group), describe:
   - Location
   - Purpose
   - Key props (if readily visible from the source)
5. **Styling** — Styling strategy (CSS Modules, Tailwind, styled-components, etc.). Where global styles live. Any design tokens or theme system.
6. **State management** — How state is managed (local state, Context API, Zustand, Redux, etc.). List any contexts or stores and what they hold.
7. **Authentication on the client** — How session/auth state is accessed in components. Protected route pattern.
8. **Forms** — Form library used (if any), validation strategy, and the pattern used across the project.
9. **Navigation** — How programmatic navigation works. Any URL param patterns used.
10. **Loading and error states** — How async operations are handled in the UI (Suspense, loading flags, skeletons, error boundaries).
11. **Utilities** — Document each utility function found in `utils/`, `helpers/`, or equivalent.

Rules:
- Only document components and patterns you actually read in the source.
- If a component's props are not easily derivable from the source, describe its purpose and skip the props table.

---

## Step 6 — Review and finalize

After writing all four files:

1. Re-read each file you just wrote.
2. Verify that every claim is backed by something you read in the source. Remove anything speculative.
3. Ensure cross-references are consistent (e.g., endpoints in `API.md` match what the services in `FRONT.md` call).
4. Check that code samples, if any, use actual variable names, function signatures, and file paths from the project.

---

## Important rules

- Explore first, write second. Never write a documentation section before reading the relevant source files.
- Do not invent. If something is unclear, say so in the doc rather than guessing.
- Do not add emojis or marketing language.
- Do not create any files other than the four specified above.
- If a technology, pattern, or file referenced in one doc does not exist, remove the reference.
