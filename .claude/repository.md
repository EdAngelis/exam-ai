---
repo: EdAngelis/my-home
project_owner: EdAngelis
project_name: my-home
project_number: 1
base_branch: main
repo_url: https://github.com/EdAngelis/my-home
project_url: https://github.com/users/EdAngelis/projects/1
---

# Repository configuration

This file is the single source of truth to determine which GitHub repository and project board to operate on.

To reuse those commands in a different repository, copy them along with this file and update the values in the frontmatter above — no other edits are needed.

| Key             | Meaning                                                                 |
|-----------------|--------------------------------------------------------------------------|
| `repo`          | `owner/repo` passed to `gh issue` / `gh pr` via `--repo`                |
| `project_owner` | GitHub org/user that owns the project board, passed to `gh project` via `--owner` |
| `project_name`  | Title of the project (v2) board to add/move issue cards on             |
| `project_number` | Number of the project (v2) board, passed to `gh project` via the positional arg — avoids a `gh project list` lookup by title |
| `base_branch`   | Branch that Pull Requests are opened against                           |
| `repo_url`      | Convenience link to the repository                                     |
| `project_url`   | Convenience link to the project (v2) board                             |
