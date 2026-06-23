You are working on the GitHub repository configured in `.claude/repository.md`. Your job is to fully resolve a GitHub issue end-to-end: analyze it, implement the fix or feature, and open a Pull Request.

The issue number to work on is: **$ARGUMENTS**

---

## Step 0 — Load repository configuration

Read `.claude/repository.md` and extract the values from its frontmatter into shell variables, used by every step below:

```bash
REPO=$(grep '^repo:' .claude/repository.md | head -1 | sed 's/^repo: *//')
PROJECT_OWNER=$(grep '^project_owner:' .claude/repository.md | head -1 | sed 's/^project_owner: *//')
PROJECT_NUMBER=$(grep '^project_number:' .claude/repository.md | head -1 | sed 's/^project_number: *//')
BASE_BRANCH=$(grep '^base_branch:' .claude/repository.md | head -1 | sed 's/^base_branch: *//')
```

This lets the same command work unmodified in another repository — just edit `.claude/repository.md` there.

---

## Step 1 — Move the ticket to "In progress"

Before doing anything else, move the issue's card on the project board to the **In progress** column.

```bash
PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.id')

# Find the existing item for this issue (it should already be on the board, e.g. in Backlog)
ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq ".items[] | select(.content.number==$ARGUMENTS) | .id")

# If no item was found, the issue isn't on the board yet — add it first
if [ -z "$ITEM_ID" ]; then
  ISSUE_URL=$(gh issue view $ARGUMENTS --repo "$REPO" --json url --jq '.url')
  ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$ISSUE_URL" --format json --jq '.id')
fi

FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .id')
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In progress") | .id')

gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If the project has no field literally named `Status`, or no option literally named `In progress`, list the available field/option names instead of guessing and ask the user which one to use. If the `gh project` commands fail due to missing scopes, ask the user to run `gh auth refresh -s project,read:project` and retry — do not skip this step silently.

---

## Step 2 — Read and understand the issue

- Fetch the issue with: `gh issue view $ARGUMENTS --repo "$REPO" --json title,body,comments,labels,state`
- Read the title, body, and all comments carefully.
- Identify: what is broken or missing? What is the expected behavior? Are there any constraints or hints in the comments?
- If the issue references files, routes, or components, note them for exploration.

---

## Step 3 — Explore the codebase

- Based on the issue context, locate the relevant files using `Glob` and `Grep`.
- Read the relevant source files to fully understand the existing implementation before making any changes.
- Identify the root cause (for bugs) or the best integration point (for features).
- Do not guess — verify by reading the actual code.

---

## Step 4 — Plan the implementation

- Write out a clear, step-by-step plan of what needs to change and why.
- Identify which files will be created or modified.
- Consider edge cases, security implications, and regressions.
- Keep the scope tight: only implement what is needed to resolve the issue. Do not refactor unrelated code.

---

## Step 5 — Create a dedicated branch

- Before branching, make sure `dev` is checked out and up to date with its remote:
  ```bash
  git checkout dev
  git pull origin dev
  ```
  If `git checkout` or `git pull` fails (e.g. uncommitted local changes, diverged history), stop and ask the user how to proceed — do not stash, discard, or force anything automatically.
- Create and checkout a new branch named after the issue, off of `dev`:
  ```bash
  git checkout -b issue-$ARGUMENTS
  ```

---

## Step 6 — Implement the changes

- Make the necessary code changes using the `Edit` or `Write` tools.
- Follow the existing code style, patterns, and conventions of the project.
- Do not add unnecessary comments, docstrings, or abstractions.
- Do not introduce new dependencies unless strictly required.

---

## Step 7 — Verify the changes

- Re-read every file you modified to confirm the changes are correct and complete.
- If the project has tests, check if existing tests need updating or new ones should be added.
- Check for obvious errors: syntax issues, broken imports, missing exports.

---

## Step 8 — Commit the changes

- Stage only the files relevant to the issue:
  ```bash
  git add <files>
  ```
- Write a clear, descriptive commit message focused on *why*, not just *what*:
  ```bash
  git commit -m "fix: <short description> (closes #$ARGUMENTS)"
  ```

---

## Step 9 — Push the branch

- Push the branch to origin:
  ```bash
  git push -u origin issue-$ARGUMENTS
  ```

---

## Step 10 — Open a Pull Request

- Create the PR using the GitHub CLI:
  ```bash
  gh pr create \
    --repo "$REPO" \
    --title "<concise title matching the issue>" \
    --body "..." \
    --head issue-$ARGUMENTS \
    --base "$BASE_BRANCH"
  ```
- The PR body must include:
  - **Summary:** what was changed and why
  - **Closes:** `Closes #$ARGUMENTS` (so GitHub auto-closes the issue on merge)
  - **Test plan:** steps to verify the fix or feature works
  - Credit line: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

---

## Step 11 — Move the ticket to "In review"

Once the Pull Request is created, move the issue's card on the project board to the **In review** column, using the same `ITEM_ID`, `PROJECT_ID`, and `FIELD_ID` resolved in Step 1 (re-resolve them if this is a fresh session):

```bash
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In review") | .id')

gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

---

## Important rules

- Never commit secrets, `.env` files, or credentials.
- Never force-push or amend published commits.
- Never skip pre-commit hooks (`--no-verify`).
- Always confirm with the user before running destructive git operations.
- If you are unsure about scope or approach, ask the user before implementing.
