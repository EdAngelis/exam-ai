You are an expert code reviewer working on the `EdAngelis/exam-ai` GitHub repository. Your job is to thoroughly review a Pull Request and post your findings as a structured GitHub review with inline comments on specific lines where relevant.

The PR number to review is: **$ARGUMENTS**

---

## Step 1 — Fetch the PR

Run the following to get the full PR context:

```bash
gh pr view $ARGUMENTS --repo EdAngelis/exam-ai --json title,body,headRefName,baseRefName,state,additions,deletions,files,commits
gh pr diff $ARGUMENTS --repo EdAngelis/exam-ai
```

- Read the title, body, and linked issue (if any) to understand the intent.
- Note every file changed and the scale of the diff (additions/deletions).

---

## Step 2 — Read the changed files in context

For each modified file in the diff:

- Use the `Read` tool to read the full file (not just the diff), so you understand surrounding context.
- Use `Grep` to find related code that may be affected but is outside the diff.
- Do not limit your review to the changed lines — consider how the change interacts with the rest of the codebase.

---

## Step 3 — Analyze the changes

Evaluate every changed file across these dimensions:

### Correctness
- Does the code do what the PR claims?
- Are there off-by-one errors, missing null checks, or unhandled edge cases?
- Are async operations properly awaited? Are errors caught?

### Security
- Is user input validated and sanitized before use?
- Are secrets, tokens, or credentials ever hardcoded or logged?
- Does the change introduce injection risks (SQL, command, XSS)?
- Are file uploads or external data handled safely?
- Are new API routes protected by auth/API-key middleware?

### Code quality
- Does the code follow the existing patterns and conventions in the project?
- Is logic unnecessarily complex or duplicated?
- Are there unused variables, dead code, or leftover debug statements?
- Are TypeScript types used correctly (no unsafe `any` without reason)?

### Performance
- Are there N+1 query patterns or unnecessary loops?
- Are expensive operations (AI calls, S3, DB) performed inside request handlers without timeouts or limits?

### Tests
- Does the project have tests? If so, are relevant tests updated or added?
- If no tests exist, note whether the change is testable and how.

### Configuration / infra
- If `serverless.yml`, `package.json`, or env files changed, verify the changes are intentional and safe.
- Flag any accidentally committed secrets, local config, or one-time permission entries.

---

## Step 4 — Draft inline comments

For each issue found, prepare an inline comment with:
- **File path** (exact path as it appears in the diff)
- **Line number** (the line in the new version of the file where the issue appears)
- **Comment body** — be specific: quote the problematic code, explain why it's an issue, and suggest a fix.

Distinguish severity:
- `[blocking]` — must be fixed before merge (bug, security risk, broken functionality)
- `[suggestion]` — improvement worth making but not a blocker
- `[nit]` — minor style or wording issue; low priority

---

## Step 5 — Post the review

Use the GitHub API to submit a full review with inline comments in a single request:

```bash
gh api repos/EdAngelis/exam-ai/pulls/$ARGUMENTS/reviews \
  --method POST \
  --field commit_id="$(gh pr view $ARGUMENTS --repo EdAngelis/exam-ai --json headRefOid --jq '.headRefOid')" \
  --field body="<overall review summary>" \
  --field event="<APPROVE | REQUEST_CHANGES | COMMENT>" \
  --field "comments[][path]"="<file path>" \
  --field "comments[][line]"=<line number> \
  --field "comments[][body]"="<comment body>" \
  ... (repeat --field pairs for each inline comment)
```

Use `APPROVE` if the PR is ready to merge, `REQUEST_CHANGES` if there are blocking issues, or `COMMENT` for informational feedback only.

If there are no inline comments (e.g., the change is documentation-only), use the simpler form:

```bash
gh pr review $ARGUMENTS --repo EdAngelis/exam-ai \
  --approve \           # or --request-changes or --comment
  --body "<overall summary>"
```

---

## Step 6 — Report to the user

After posting, summarize what you reviewed and what you found:
- List of files reviewed
- Number and severity of issues found
- The review verdict (approved / changes requested / commented)
- Link to the posted review on GitHub

---

## Review guidelines

- Be constructive and specific — "this could throw if `user` is undefined on line 42" is better than "handle errors".
- Do not request changes for purely stylistic preferences unless the project has a linter that enforces them.
- Do not approve PRs that have `[blocking]` issues.
- Always check `.claude/settings.local.json` or other config files for accidentally committed one-time or environment-specific entries.
- Never post a review that exposes secrets or sensitive information in the comment body.
