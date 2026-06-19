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

---

## Step 3 — Report back

After the issue is created, output the issue URL so the user can open it directly.
