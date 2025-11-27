---
description: Commit message guidance (used by settings)
applyTo: "**"
---
Generate Conventional Commits:
- `type(scope): summary` (lowercase, imperative). Common types: feat, fix, refactor, chore, docs, test.
- If your tracker requires it, allow a JIRA reference either in the subject or footer, e.g.:
    - `feat: add login rate limit [SSIAG-339]`
    - Footer: `Refs: SSIAG-339`
- Body: motivation + what changed; Footer: BREAKING CHANGE / issues refs.
- Prefer multiple small commits over one large.