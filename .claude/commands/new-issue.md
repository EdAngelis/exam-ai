Your job is to create a well-structured GitHub issue on the `EdAngelis/exam-ai` repository based on the user's description.

The user's description is: **$ARGUMENTS**

---

## Step 1 — Derive a title and body from the description

Read the description and produce:

- **Title:** a short, imperative sentence (≤ 72 chars) that names the problem or feature. Examples: "Fix crash when exam has no questions", "Add email validation on signup form".
- **Type:** classify as one of: `bug`, `enhancement`, `question`.
- **Body:** a concise markdown body with these sections:
  - **Description** — one paragraph expanding on the title.
  - **Expected behavior** (for bugs) or **Motivation** (for enhancements) — why this matters.
  - **Steps to reproduce** (for bugs only) — numbered list; omit for enhancements.
  - **Possible solution** (optional) — only if the description hints at one.

Do not invent details that are not in the description.

---

## Step 2 — Create the issue

Run:

```bash
gh issue create \
  --repo EdAngelis/exam-ai \
  --title "<derived title>" \
  --body "<derived body>" \
  --label "<bug|enhancement|question>"
```

Use a HEREDOC for the body to preserve newlines:

```bash
gh issue create --repo EdAngelis/exam-ai --title "<title>" --label "<type>" --body "$(cat <<'EOF'
<body markdown here>
EOF
)"
```

Capture the issue URL printed by `gh issue create` — it's needed in the next step.

---

## Step 3 — Add the issue to the "exam-ai" project board, in the Backlog column

This requires the `project` scope on the `gh` token. If a command below fails with a missing-scope error, ask the user to run `gh auth refresh -s project` themselves (it's an interactive browser auth step) and retry.

```bash
# Resolve the "exam-ai" project number and id, owned by EdAngelis
PROJECT_JSON=$(gh project list --owner EdAngelis --format json)
PROJECT_NUMBER=$(echo "$PROJECT_JSON" | jq -r '.projects[] | select(.title=="exam-ai") | .number')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.projects[] | select(.title=="exam-ai") | .id')

# Add the issue to the project, capture the new item's id
ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner EdAngelis --url "<issue-url-from-step-2>" --format json | jq -r '.id')

# Resolve the Status field id and the "Backlog" option id
FIELD_JSON=$(gh project field-list "$PROJECT_NUMBER" --owner EdAngelis --format json)
FIELD_ID=$(echo "$FIELD_JSON" | jq -r '.fields[] | select(.name=="Status") | .id')
OPTION_ID=$(echo "$FIELD_JSON" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="Backlog") | .id')

# Move the item into the Backlog column
gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If the project has no field literally named `Status`, or no option literally named `Backlog`, list the available field/option names instead of guessing and ask the user which one to use.

---

## Step 4 — Report back

After the issue is created and added to the project, output the issue URL and confirm it was placed in the Backlog column so the user can open it directly.
