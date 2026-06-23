You are working on the GitHub repository configured in `.claude/repository.md`. Your job is to read every comment on a Pull Request and address each one — either by fixing the code or by replying with a clear explanation of why no change is needed — repeating until none are left unaddressed.

The PR number to work on is: **$ARGUMENTS**

---

## Step 0 — Load repository configuration

```bash
REPO=$(grep '^repo:' .claude/repository.md | head -1 | sed 's/^repo: *//')
PROJECT_OWNER=$(grep '^project_owner:' .claude/repository.md | head -1 | sed 's/^project_owner: *//')
PROJECT_NUMBER=$(grep '^project_number:' .claude/repository.md | head -1 | sed 's/^project_number: *//')
BASE_BRANCH=$(grep '^base_branch:' .claude/repository.md | head -1 | sed 's/^base_branch: *//')
```

This lets the same command work unmodified in another repository — just edit `.claude/repository.md` there.

---

## Step 1 — Load the PR and find the linked issue

```bash
gh pr view $ARGUMENTS --repo "$REPO" --json title,body,number,headRefName,baseRefName,state,comments,reviews
ME=$(gh api user --jq '.login')
```

- Note `headRefName` — the branch you'll need to check out if any comment requires a code change.
- Determine the linked issue number by parsing the PR body for `Closes #N` / `Fixes #N` / `Resolves #N` (case-insensitive). If no linked issue can be found, skip the project-board steps later and say so when reporting back — do not guess an issue number.
- `ME` is your own `gh` login — use it below to tell which comments you've already replied to, so you don't loop on the same comment forever or double-reply.

---

## Step 2 — Gather every comment

A PR has two distinct comment surfaces — fetch both:

```bash
# Top-level PR conversation comments
gh pr view $ARGUMENTS --repo "$REPO" --json comments --jq '.comments[] | {id: .id, author: .author.login, body: .body}'

# Inline review comments (anchored to a diff line), with pagination
gh api "repos/$REPO/pulls/$ARGUMENTS/comments" --paginate --jq '.[] | {id: .id, in_reply_to: .in_reply_to_id, author: .user.login, path: .path, line: .line, body: .body}'
```

Build a list of comments that:
- Were **not** authored by `$ME`, and
- Have **no existing reply authored by `$ME`** (for inline comments, no other comment in the thread with matching context has `in_reply_to_id` pointing at it and `author == $ME`; for top-level comments, no later top-level comment by `$ME` already responds to it).

Those are the comments still needing action this pass.

If there are none, you're done — skip to Step 7.

---

## Step 3 — Decide an action for each unaddressed comment

For every comment found in Step 2, read it carefully alongside the diff hunk / file it's anchored to (use `gh pr diff $ARGUMENTS --repo "$REPO"` for full context) and decide:

- **Code change required** — the comment points out a real bug, regression, missed convention, or requested change.
- **No change needed** — the comment is based on a misunderstanding, is out of scope, already handled elsewhere, or is a question that can be answered without touching code.

Do not guess — verify against the actual current code, not just the diff, before deciding.

---

## Step 4 — If any comment needs a code change

Do this **once**, before making any edits, the first time this PR needs a code change in this run:

1. Move the linked issue's card on the project board to **In progress**:
   ```bash
   PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.id')
   ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq ".items[] | select(.content.number==<linked-issue-number>) | .id")
   FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .id')
   OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In progress") | .id')
   gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
   ```
   If no linked issue was found in Step 1, skip this and say so in your final report.
2. Check out the PR's branch:
   ```bash
   gh pr checkout $ARGUMENTS --repo "$REPO"
   ```
3. Make the change with `Edit`/`Write`, following the project's existing conventions. Keep each change scoped to what the comment actually asked for — do not use this as an opportunity to refactor unrelated code.

You only need to do step 1 and 2 once per run, even if multiple comments require code changes — keep working on the same checked-out branch for all of them.

---

## Step 5 — Reply to each comment

For inline review comments, reply **in the same thread** so context is preserved:

```bash
gh api -X POST "repos/$REPO/pulls/$ARGUMENTS/comments/<comment_id>/replies" -f body="<your reply>"
```

For top-level PR conversation comments:

```bash
gh pr comment $ARGUMENTS --repo "$REPO" --body "<your reply>"
```

- If you made a code change for that comment, say what you changed (briefly — the diff speaks for itself) rather than re-explaining the whole fix.
- If no change was needed, explain why in plain terms — point at the specific behavior, line, or test that makes the requested change unnecessary or incorrect.

---

## Step 6 — Repeat until nothing is left

Go back to Step 2 and re-fetch comments. Replying can itself prompt a follow-up from a reviewer, so don't treat one pass as sufficient — keep looping until a fresh fetch shows every comment already has a reply from `$ME`.

---

## Step 7 — Commit, push, and wrap up

If you made any code changes during this run:

1. Re-read every file you modified to confirm correctness.
2. Stage only the files relevant to the addressed comments:
   ```bash
   git add <files>
   ```
3. Commit with a message describing what review feedback was addressed:
   ```bash
   git commit -m "address review feedback on PR #$ARGUMENTS"
   ```
4. Push to the PR's existing branch:
   ```bash
   git push
   ```
5. Move the linked issue's card back to **In review**, reusing the `ITEM_ID`, `PROJECT_ID`, `FIELD_ID` from Step 4 (re-resolve them if this is a fresh session):
   ```bash
   OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In review") | .id')
   gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
   ```

If no code changes were needed at all (every comment was resolved with an explanation), do **not** touch the project board — it never left whatever column it was already in.

Report back: which comments were addressed with code vs. with an explanation, what was pushed (if anything), and the resulting board column.

---

## Important rules

- Never commit secrets, `.env` files, or credentials.
- Never force-push or amend published commits.
- Never skip pre-commit hooks (`--no-verify`).
- Never resolve a comment with a fix you haven't actually verified by reading the current code.
- If a comment's intent is ambiguous, ask the user before guessing — don't reply with a fix for the wrong problem.
- If the project has no field literally named `Status`, or no option literally named `In progress` / `In review`, list the available field/option names instead of guessing and ask the user which one to use.
- If `gh project` commands fail due to missing scopes, ask the user to run `gh auth refresh -s project,read:project` and retry.
