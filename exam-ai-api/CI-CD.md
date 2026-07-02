# CI/CD — Deploying `exam-ai-api` to AWS Lambda + API Gateway (SAM + GitHub Actions OIDC)

This documents the CI/CD for **`exam-ai-api`**, the Express REST API in the
`exam-ai` monorepo (alongside `exam-ai-next` and `exam-ai-mobile`). The API runs
on **AWS Lambda behind an HTTP API Gateway** (via `serverless-http` —
`src/server.ts` exports `handler = serverless(app)`), and is packaged/deployed
with **AWS SAM** (`template.yaml`).

> This replaces the old **Serverless Framework** deploy (`serverless.yml`, stack
> `exam-ai`). The new SAM stacks are `exam-ai-api` / `exam-ai-api-staging`. Once
> SAM is verified, the old `exam-ai` stack and `serverless.yml` can be retired.

There are two pipelines:

| Pipeline | Trigger | Stack | Purpose |
|---|---|---|---|
| **Production** (`.github/workflows/deploy-api.yml`) | push to `main` **that touches `exam-ai-api/**`** | `exam-ai-api` | The live API |
| **Staging** (`.github/workflows/deploy-api-staging.yml`) | pull request to `main` **opened / synchronize / reopened** touching `exam-ai-api/**` | `exam-ai-api-staging` | A preview API for the PR |

Authentication uses **GitHub OIDC → an AWS IAM role** — no static AWS access keys
are stored in GitHub. The SAM parameters (DB URI, API keys, OpenAI key, etc.)
come from **GitHub Secrets**; `samconfig.toml` (with the live values, for local
deploys) is gitignored so CI never sees it.

```
push to main (exam-ai-api/** changed) ─► deploy-api.yml         ─► sam deploy  stack: exam-ai-api
PR opened/updated (exam-ai-api/** )    ─► deploy-api-staging.yml ─► sam deploy  stack: exam-ai-api-staging
                     │
                     └── GitHub OIDC token ──► sts:AssumeRoleWithWebIdentity ──► IAM deploy role
```

### Why the path filter

This is a **monorepo** (`exam-ai-api` + `exam-ai-next` + `exam-ai-mobile`). Both
workflows filter on `paths: ["exam-ai-api/**", <the workflow file>]`, so a commit
that only touches a frontend (or root docs) **does not** trigger an API deploy —
exactly the "change `main` but only the frontend → skip the API deploy" behavior.

---

## 1. What's in the repo (SAM side)

- **`src/server.ts`** exports `export const handler = serverless(app)` and only
  calls `app.listen(...)` when `config.serverless === "false"` (i.e. env
  `SERVERLESS !== "true"`), so the same entry point runs both locally and in
  Lambda. In Lambda we set **`SERVERLESS=true`** so it never tries to listen.
- **`template.yaml`** — one `AWS::Serverless::Function` (`ApiFunction`,
  `Handler: dist/server.handler`, `Runtime: nodejs20.x`, `Timeout: 30`,
  `MemorySize: 1024`) with two `HttpApi` events (`/` and `/{proxy+}` `ANY`) that
  proxy every route to Express. It declares one parameter **per secret / per-env
  value** (all `NoEcho` for secrets) and outputs `ApiUrl`.
- **Build** — `npm run build` (`tsc`) emits `dist/`; `sam build` then packages it
  (`.samignore` excludes `src`, keeps `dist`, and `sam build` reinstalls
  production deps). CI runs `npm ci → npm run build → sam build → sam deploy`,
  mirroring the local `npm run sam:deploy`.
- **`samconfig.toml`** — used for **manual local deploys only**; it is
  **gitignored** because its `parameter_overrides` contains the real MongoDB
  URI, OpenAI key, etc. CI does not read it — it passes every parameter from
  GitHub secrets.

### Changes made during the SAM migration

- **`package.json` `build` script** was `tsc && node dist/server.js` (which
  would try to boot the server in CI); it is now just **`tsc`**. Added
  `sam:build` and `sam:deploy` convenience scripts.
- Workflows live in **`.github/workflows/`** (plural). The repo previously had a
  misspelled `.github/workflow/` (singular) folder, which GitHub **ignores** —
  the existing `claude.yml` in there never ran.

### No `NameSuffix` needed

`template.yaml` has **no hardcoded physical names** (no `FunctionName`, no
explicit API name — CloudFormation derives them from logical ids per stack). So
the staging stack (`exam-ai-api-staging`) gets its own function, its own HTTP
API, and its own URL automatically, just from a different `--stack-name`.

---

## 2. AWS setup (once per account/repo) — **you do this**

### 2.1 Add the GitHub OIDC identity provider (once per AWS account)

AWS Console → **IAM → Identity providers → Add provider**:

- Type: **OpenID Connect**
- Provider URL: `https://token.actions.githubusercontent.com` → **Get thumbprint**
- Audience: `sts.amazonaws.com`

Skip if the provider already exists in the account.

### 2.2 Create the deploy IAM role

IAM → **Roles → Create role → Custom trust policy**.

**Trust policy** — the `sub` list needs **both** entries: pushes to `main`
(production) present `ref:refs/heads/main`, while `pull_request` runs (staging)
present the distinct subject `repo:EdAngelis/exam-ai:pull_request`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": [
          "repo:EdAngelis/exam-ai:ref:refs/heads/main",
          "repo:EdAngelis/exam-ai:pull_request"
        ]
      }
    }
  }]
}
```

**Permissions policy** — attach as an inline policy (covers what `sam deploy`
needs for a Lambda + HTTP API stack; tighten later if desired):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Sid": "Cfn",       "Effect": "Allow", "Action": "cloudformation:*", "Resource": "*" },
    { "Sid": "Lambda",    "Effect": "Allow", "Action": "lambda:*",         "Resource": "*" },
    { "Sid": "ApiGw",     "Effect": "Allow", "Action": "apigateway:*",     "Resource": "*" },
    { "Sid": "Logs",      "Effect": "Allow", "Action": "logs:*",           "Resource": "*" },
    { "Sid": "SamBucket", "Effect": "Allow", "Action": "s3:*",
      "Resource": ["arn:aws:s3:::aws-sam-cli-managed-*", "arn:aws:s3:::aws-sam-cli-managed-*/*"] },
    { "Sid": "Iam", "Effect": "Allow",
      "Action": ["iam:CreateRole","iam:DeleteRole","iam:GetRole","iam:PassRole","iam:TagRole","iam:UntagRole",
                 "iam:AttachRolePolicy","iam:DetachRolePolicy","iam:PutRolePolicy","iam:DeleteRolePolicy",
                 "iam:GetRolePolicy","iam:ListRolePolicies","iam:ListAttachedRolePolicies"],
      "Resource": "*" }
  ]
}
```

Name the role (e.g. `exam-ai-api-gha-deploy`) and **copy its ARN** — it becomes
the `AWS_DEPLOY_ROLE_ARN` GitHub secret.

---

## 3. GitHub repository secrets — **you do this**

GitHub repo → **Settings → Secrets and variables → Actions → New repository
secret**. Both workflows reference the same secret names, so staging and
production share them (see §6 to isolate staging's database).

| Secret | Value (current source) |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | ARN of the role from §2.2 |
| `DB_URI` | MongoDB connection string (from `.env` / `samconfig.toml`) |
| `DB_NAME` | Mongo database name, e.g. `prod` |
| `API_KEY` | Web-client `x-api-key` shared secret |
| `MOBILE_API_KEY` | Mobile-client `x-api-key` shared secret |
| `SECRET` | JWT / app signing secret |
| `OPEN_AI_API_KEY` | OpenAI API key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | From address, e.g. `Exam AI <noreply@edangelis.site>` |
| `AWS_KEY_ID` | Access key id the app uses for S3 uploads (multer-s3) |
| `AWS_SECRET` | Secret access key the app uses for S3 uploads |
| `BUCKET_NAME` | S3 bucket for image uploads, e.g. `match-images-345` |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `CLIENT_URL` | Allowed frontend origin, e.g. `https://exam-ai-lake.vercel.app` |

⚠️ **Every secret referenced in a workflow must exist.** A missing secret expands
to an empty value (e.g. `DbUri=`), and `sam deploy` fails with
`Invalid value for '--parameter-overrides'`.

> 🔒 The values currently live in `exam-ai-api/.env` (and now
> `samconfig.toml`). These are **live credentials** (Mongo Atlas, OpenAI, AWS
> IAM user, Resend). Consider **rotating** them and using the fresh values as the
> GitHub secrets — the old ones are in git history-adjacent local files.
>
> 🔒 The app authenticates to S3 with a **static IAM user key** (`AWS_KEY_ID` /
> `AWS_SECRET`). A cleaner long-term fix is to drop those and grant the Lambda
> **execution role** `s3:PutObject` on the bucket instead (requires a small
> change to how the app constructs its aws-sdk S3 client).

---

## 4. The production workflow

`.github/workflows/deploy-api.yml`. Flow:
`checkout → setup-node@20 → npm ci → npm run build → setup-sam →
configure-aws-credentials (OIDC) → sam build → sam deploy → print ApiUrl`.

Key points:
- `on.push.branches: [main]` + `on.push.paths` scoping to `exam-ai-api/**`.
- `permissions: id-token: write` (OIDC) + `contents: read`.
- `concurrency: deploy-api`, `cancel-in-progress: false` — serialize prod deploys.
- `defaults.run.working-directory: exam-ai-api` — SAM runs against the API
  folder's `template.yaml`.
- Deploys `--stack-name exam-ai-api`, passing every parameter from the matching
  secret. Secrets are mapped to `env:` first and referenced as shell variables
  (avoids command-line injection and handles values containing spaces).
- `workflow_dispatch: {}` gives a manual **Run workflow** button.

The final step prints the live `ApiUrl` from the stack outputs.

---

## 5. The staging workflow (deploy on PR)

`.github/workflows/deploy-api-staging.yml`. Differences from production:

- `on.pull_request.branches: [main]`, `types: [opened, synchronize, reopened]`
  = created + every push to the PR + reopen.
- `permissions` also includes `pull-requests: write` so it can comment the URL.
- `concurrency: deploy-api-staging`, `cancel-in-progress: true` — all PRs share
  one staging stack; a newer push cancels a stale deploy.
- Deploys `--stack-name exam-ai-api-staging --s3-prefix exam-ai-api-staging`.
- Reads the `ApiUrl` output and **posts/updates a single PR comment** with the
  staging API URL (via `actions/github-script`, upserting a marker comment).

Point a frontend's API base URL at that staging URL to test a PR's API
end-to-end before merging.

---

## 6. Notes & recommended hardening

- **Shared database.** Both stacks currently receive the same `DB_URI` / `DB_NAME`,
  so **staging writes to the production database**. For isolation, add
  staging-specific secrets (e.g. `DB_URI_STAGING`, `DB_NAME_STAGING`) and
  reference them in `deploy-api-staging.yml` instead, pointing at a different
  Atlas database/cluster. The same applies to `BUCKET_NAME` if you want staging
  uploads separated.
- **Forks don't get secrets.** PRs opened from forks receive no secrets, so the
  staging deploy fails at the AWS credential step — staging only works for
  branches pushed to this repository.
- **Teardown.** The staging stack lingers after a PR merges/closes. Delete it
  manually when unneeded:
  `aws cloudformation delete-stack --stack-name exam-ai-api-staging`
  (a `pull_request: closed` cleanup job could automate this later).
- **Retire Serverless Framework.** Once SAM prod is verified, remove
  `serverless.yml` / `.serverless/` and delete the old `exam-ai` CloudFormation
  stack to avoid two stacks serving the same API.

---

## 7. Verify

- **Actions tab** → the run should show:
  `checkout → setup-node → npm ci → Build (tsc) → setup-sam →
  configure-aws-credentials → SAM build → SAM deploy → Print API URL`.
- On success, CloudFormation shows the stack `exam-ai-api` (or
  `exam-ai-api-staging`) as `UPDATE_COMPLETE` / `CREATE_COMPLETE`.
- From a terminal:
  `gh run list --workflow deploy-api.yml` and
  `gh run view <id> --json jobs --jq '.jobs[0].steps[] | .name + " => " + .conclusion'`.
- Hit the printed `ApiUrl` — `GET /` should return the app's root greeting.

---

## 8. Gotchas

1. **Trigger branch must be the real default branch.** This repo's default is
   `main`; the trust policy `sub` must use `refs/heads/main` too.
2. **Workflows must be in `.github/workflows/` (plural).** The old singular
   `.github/workflow/` folder is ignored by GitHub.
3. **"Re-run jobs" re-uses the workflow yaml from the original run's commit.**
   After fixing a workflow, push a new commit or use **Run workflow** instead of
   re-running.
4. **Empty `--parameter-overrides` value.** An unset secret expands to
   `Key=`, which SAM rejects. Every secret in §3 must exist.
5. **PR runs present a different OIDC subject** (`repo:EdAngelis/exam-ai:pull_request`,
   not `ref:refs/heads/...`). Both must be in the trust policy `sub` list or the
   staging pipeline fails at `AssumeRoleWithWebIdentity`.
6. **`SERVERLESS` must be `true` in Lambda.** If it is unset/`false`, the entry
   point calls `app.listen` and the Lambda hangs. The template sets it.
7. **Don't reuse reserved Lambda env names.** The app uses `AWS_KEY_ID` /
   `AWS_SECRET` / `REGION` (custom names) — not the reserved `AWS_ACCESS_KEY_ID` /
   `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`, which Lambda forbids setting.
8. **Path filter gotcha.** If you rename the API folder, update the `paths:`
   filters in **both** workflows or deploys silently stop firing.

---

## 9. What I need from you (setup checklist)

- [ ] **§2.1** OIDC provider exists in the AWS account.
- [ ] **§2.2** Create the deploy IAM role (trust policy with both `sub` entries +
      permissions policy). Copy its ARN.
- [ ] **§3** Add all GitHub secrets (14 total: `AWS_DEPLOY_ROLE_ARN` + the 13
      app values).
- [ ] (Recommended) Rotate the live credentials and use the new values.
- [ ] Push an API change to a PR → watch staging deploy + PR comment (§7).
- [ ] Merge to `main` → watch production deploy (§7).
- [ ] Once verified, retire `serverless.yml` and the old `exam-ai` stack (§6).
