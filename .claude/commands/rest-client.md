You are generating REST Client (`.http`) request files for the `my-home-api` Express API, for use with the VS Code "REST Client" extension. Ground every request in the actual route/controller/model code — do not invent endpoints, fields, or query parameters.

---

## Step 1 — Discover the routes

- Read `my-home-api/src/routes/routes.ts` to find every resource mounted on the router and its path prefix (e.g. `/products`, `/buyers`).
- For each resource, read its route file in `my-home-api/src/routes/*.routes.ts` to get the exact method + sub-path for every endpoint, in declaration order.
- Read the matching controller in `my-home-api/src/controller/*.controller.ts` for each route to see what it reads from `req.body`, `req.params`, and `req.query` — this tells you which requests need a JSON body, a path param, or query params.
- For endpoints that take a body, read the relevant Mongoose model in `my-home-api/src/models/*.model.ts` to build a realistic example JSON payload using the model's actual fields and types. Do not include Mongoose-only fields (`_id`, `createdAt`, `updatedAt`) in request bodies.
- Check `my-home-api/src/app.ts` for whether routes are mounted at the root or under a prefix, and confirm the dev port (`src/config/config.ts` / `PORT` env default) for the base URL.

## Step 2 — Create one `.http` file per resource

Write the files to `my-home-api/http/<resource>.http` — one file per route file discovered in Step 1 (e.g. `products.routes.ts` -> `http/products.http`). Do not merge multiple resources into one file, and do not split one resource across multiple files.

Each file should follow this structure:

```http
@baseUrl = http://localhost:3000
@<resource>Id = REPLACE_WITH_AN_ID

### <Short description of the action> — <METHOD> <path>
<METHOD> {{baseUrl}}/<resource><path>
Content-Type: application/json

<json body, only if the controller reads req.body>
```

Rules:
- One `###`-separated block per route, in the same order the routes are declared in the `*.routes.ts` file.
- Use `{{baseUrl}}` plus the resource's mount prefix (from `routes.ts`) plus the route's own path.
- For routes with an `:id` param, declare a `@<resource>Id` variable at the top of the file (e.g. `@buyerId`) and use `{{<resource>Id}}` in the URL instead of a hardcoded id.
- For routes with query params read via `req.query` (e.g. filters), add 1-2 of the most relevant query params as a commented-out example line (`# &status=active`) rather than guessing required ones — only the routes that actually read `req.query` should show this.
- Only add `Content-Type: application/json` and a body block for routes whose controller actually reads `req.body`.
- Add a one-line `###` comment above each request naming what it does, taken from the controller's behavior (e.g. "Create a new buyer", not just the HTTP verb).
- Keep example JSON bodies minimal but valid against the model's required fields.

## Step 3 — Review

After writing all files:
- Re-check each generated file against its route file — every route must have exactly one corresponding request block, nothing missing, nothing invented.
- Confirm no file mixes routes from a different resource.
- Report the list of files created/updated.
