Search GitHub for open issues, resolve them in code, and open Pull Requests to the `dev` branch. A log file at `.github/solved-issues.json` tracks which issues have already been handled so the skill never processes the same issue twice.

## Arguments ($ARGUMENTS)

- `<number>` — process only that specific issue (e.g. `/solve-issues 42`)
- `--base <branch>` or `-b <branch>` — override the PR target branch (default: `dev`, fallback `main`)
- `--dry-run` — fetch and print new issues without creating branches or PRs
- No args — process all new open issues not yet in the log

## Steps

### 1. Resolve the target branch

Parse `$ARGUMENTS`:
- If `--base <branch>` or `-b <branch>` is present, use that as `$BASE_BRANCH`.
- Otherwise use `dev` if it exists on the remote (`gh api repos/{owner}/{repo}/branches/dev`), else fall back to `main`.

### 2. Load the solved-issues log

Check for `.github/solved-issues.json` in the repo root.
- If it exists, read it. It is a JSON object: `{ "solved": [ { "number": <int>, "title": "<str>", "branch": "<str>", "pr_url": "<str>", "solved_at": "<ISO date>" } ] }`.
- If it does not exist, treat the solved list as empty. Do **not** create the file yet — only write it after a real resolution.

Extract the set of already-solved issue numbers from the `"solved"` array.

### 3. Fetch open issues

Run:
```
gh issue list --state open --json number,title,body,labels,assignees --limit 100
```

If `$ARGUMENTS` contains a bare number (e.g. `42`), filter the list to that single issue:
```
gh issue view 42 --json number,title,body,labels,assignees
```

Remove from the list any issue whose number is already in the solved set from Step 2.

If no new issues remain, print: "No new issues to resolve." and stop.

If `--dry-run` was passed, print a table of new issues (number, title) and stop without making any changes.

### 4. For each new issue — resolve it

Process issues one at a time. For each issue:

#### 4a. Understand the issue

Read the issue `title` and `body` carefully. Identify:
- What is broken or missing
- Which files are likely affected (infer from context, file names mentioned, error messages, labels)
- What the expected behavior should be after the fix

If the body references specific files, functions, or error messages, locate them in the codebase (`grep`, `find`, or `Read` as needed).

#### 4b. Create a branch

Derive a short slug from the issue title: lowercase, spaces → hyphens, strip punctuation, max 40 chars.

```
git checkout -b fix/issue-<number>-<slug>
```

Make sure the working tree is clean before branching (`git status`). If there are uncommitted changes, print a warning and skip this issue.

#### 4c. Fix the code

Make the minimal code changes that resolve the issue as described. Follow the existing code style and conventions. Do not refactor unrelated code, add unnecessary comments, or introduce new dependencies beyond what the fix requires.

If the issue is ambiguous or requires information you cannot infer from the codebase and the issue body, print a note explaining what is unclear and skip the issue (do not create a branch or PR).

#### 4d. Commit the fix

Stage only the files you changed:
```
git add <file1> <file2> ...
```

Commit with a message that references the issue:
```
git commit -m "fix: <concise description>\n\nCloses #<number>"
```

#### 4e. Push the branch and open a PR

```
git push -u origin fix/issue-<number>-<slug>
```

Then create a PR targeting `$BASE_BRANCH`:
```
gh pr create \
  --base $BASE_BRANCH \
  --title "fix: <concise description> (#<number>)" \
  --body "$(cat <<'EOF'
## Related Issue
Closes #<number>

## Summary
<1-3 sentence summary of what was wrong and how it was fixed>

## Changes
<bulleted list of files changed and what changed in each>

## How to Test
<concrete steps to verify the fix>
EOF
)"
```

Capture the PR URL returned by `gh pr create`.

#### 4f. Return to the base branch

```
git checkout <original-branch>
```
(the branch you were on before starting, captured with `git rev-parse --abbrev-ref HEAD` at the very beginning)

### 5. Update the solved-issues log

After all issues are processed, update `.github/solved-issues.json`:
- For each issue that was successfully resolved (branch created, PR opened), append an entry to the `"solved"` array:
  ```json
  {
    "number": <issue-number>,
    "title": "<issue-title>",
    "branch": "fix/issue-<number>-<slug>",
    "pr_url": "<pr-url>",
    "solved_at": "<today's date ISO 8601>"
  }
  ```
- Write the updated JSON back to `.github/solved-issues.json` (pretty-printed, 2-space indent).

Commit and push this log update **on the original branch** (not on a fix branch):
```
git add .github/solved-issues.json
git commit -m "chore: log resolved issues [skip ci]"
git push
```

### 6. Print a summary

Print a markdown table of everything that was processed this run:

| Issue | Title | Branch | PR |
|-------|-------|--------|----|
| #42   | ...   | fix/issue-42-... | <url> |

If any issues were skipped (ambiguous, uncommitted changes, etc.), list them separately with the reason.
