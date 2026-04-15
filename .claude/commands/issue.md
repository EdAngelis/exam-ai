You are working on the `EdAngelis/exam-ai` GitHub repository. Your job is to fully resolve a GitHub issue end-to-end: analyze it, implement the fix or feature, and open a Pull Request.

The issue number to work on is: **$ARGUMENTS**

---

## Step 1 — Read and understand the issue

- Fetch the issue with: `gh issue view $ARGUMENTS --repo EdAngelis/exam-ai --json title,body,comments,labels,state`
- Read the title, body, and all comments carefully.
- Identify: what is broken or missing? What is the expected behavior? Are there any constraints or hints in the comments?
- If the issue references files, routes, or components, note them for exploration.

---

## Step 2 — Explore the codebase

- Based on the issue context, locate the relevant files using `Glob` and `Grep`.
- Read the relevant source files to fully understand the existing implementation before making any changes.
- Identify the root cause (for bugs) or the best integration point (for features).
- Do not guess — verify by reading the actual code.

---

## Step 3 — Plan the implementation

- Write out a clear, step-by-step plan of what needs to change and why.
- Identify which files will be created or modified.
- Consider edge cases, security implications, and regressions.
- Keep the scope tight: only implement what is needed to resolve the issue. Do not refactor unrelated code.

---

## Step 4 — Create a dedicated branch

- Create and checkout a new branch named after the issue:
  ```bash
  git checkout -b issue-$ARGUMENTS
  ```

---

## Step 5 — Implement the changes

- Make the necessary code changes using the `Edit` or `Write` tools.
- Follow the existing code style, patterns, and conventions of the project.
- Do not add unnecessary comments, docstrings, or abstractions.
- Do not introduce new dependencies unless strictly required.

---

## Step 6 — Verify the changes

- Re-read every file you modified to confirm the changes are correct and complete.
- If the project has tests, check if existing tests need updating or new ones should be added.
- Check for obvious errors: syntax issues, broken imports, missing exports.

---

## Step 7 — Commit the changes

- Stage only the files relevant to the issue:
  ```bash
  git add <files>
  ```
- Write a clear, descriptive commit message focused on *why*, not just *what*:
  ```bash
  git commit -m "fix: <short description> (closes #$ARGUMENTS)"
  ```

---

## Step 8 — Push the branch

- Push the branch to origin:
  ```bash
  git push -u origin issue-$ARGUMENTS
  ```

---

## Step 9 — Open a Pull Request

- Create the PR using the GitHub CLI:
  ```bash
  gh pr create \
    --title "<concise title matching the issue>" \
    --body "..." \
    --head issue-$ARGUMENTS \
    --base main
  ```
- The PR body must include:
  - **Summary:** what was changed and why
  - **Closes:** `Closes #$ARGUMENTS` (so GitHub auto-closes the issue on merge)
  - **Test plan:** steps to verify the fix or feature works
  - Credit line: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

---

## Important rules

- Never commit secrets, `.env` files, or credentials.
- Never force-push or amend published commits.
- Never skip pre-commit hooks (`--no-verify`).
- Always confirm with the user before running destructive git operations.
- If you are unsure about scope or approach, ask the user before implementing.
