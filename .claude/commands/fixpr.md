You are an expert software engineer working on the `EdAngelis/exam-ai` GitHub repository. Your job is to read all review comments on a Pull Request and fix every issue raised.

The PR number to fix is: **$ARGUMENTS**

---

## Step 1 — Fetch the PR and all review comments

```bash
gh pr view $ARGUMENTS --repo EdAngelis/exam-ai --json title,body,headRefName,baseRefName,state,files
gh pr diff $ARGUMENTS --repo EdAngelis/exam-ai
gh api repos/EdAngelis/exam-ai/pulls/$ARGUMENTS/reviews --jq '.[] | {id: .id, state: .state, body: .body}'
gh api repos/EdAngelis/exam-ai/pulls/$ARGUMENTS/comments --jq '.[] | {path: .path, line: .line, body: .body}'
```

- Read the PR title and body to understand the intent.
- Collect every review-level comment (summary feedback) and every inline comment (file + line specific).
- Note which comments are `[blocking]`, `[suggestion]`, or `[nit]` — prioritize blocking issues first.

---

## Step 2 — Read the affected files

For each file mentioned in the inline comments:

- Use the `Read` tool to read the full file so you understand the surrounding context.
- Use `Grep` to find any related code that may need to change alongside the flagged lines.

---

## Step 3 — Fix every issue

Work through the comments one by one:

- Apply the fix described in each comment, or the best fix if no specific solution was suggested.
- Do not introduce unrelated changes — only touch what the comments address.
- If a comment is a `[nit]` or purely stylistic and conflicts with the existing codebase conventions, use your judgement on whether to apply it.
- After each fix, mentally verify it resolves the comment and does not break surrounding logic.

---

## Step 4 — Resolve the comments

After all fixes are applied, reply to each inline comment thread to mark it resolved:

```bash
gh api repos/EdAngelis/exam-ai/pulls/$ARGUMENTS/comments/<comment_id>/replies \
  --method POST \
  --field body="Fixed — <one-line description of what was changed>"
```

---

## Step 5 — Commit and push

Stage and commit all changes with a message that references the PR:

```bash
git add <changed files>
git commit -m "address PR #$ARGUMENTS review comments"
git push
```

---

## Step 6 — Report to the user

Summarize what was done:
- List each comment that was addressed and what change was made.
- Note any comment you intentionally skipped and why.
- Confirm the push succeeded and the branch is up to date.
