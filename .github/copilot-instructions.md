# Global Repo Guidelines (Chat-wide)
- Spanish explanations; code, identifiers and Git artifacts in English.
- Clean Architecture + SOLID; prefer small, testable units.
- Linear history on `main`; update feature branches via **rebase** (no merge-from-main).
- Conventional Commits; enforce PR review ≥1; CI must be green before merge.
- Security-first: never expose secrets; prefer `.env.example` + least privilege.
- Observability-first: logs (structured), traces, metrics; meaningful error messages.
- PowerShell-safe snippets in answers (no `&&`; use `;` or newlines).

## MCP Usage Guidance (VS Code, applies to all chat modes)
When MCP servers/tools are available in VS Code, follow these rules:
1. Prefer **tool-powered navigation** over manual guessing:
    - Use file/project search tools to locate definitions, references and usages.
2. Propose **multi-file edits** by outputting full file contents; the editor tool can apply them tomically.
3. **Run tests/lint/tasks** via terminal/task tools; surface only the *relevant* output.
4. For integrations, **call HTTP tools** (if configured) to validate endpoints, contracts or chema examples.
5. **Announce MCP usage** explicitly in responses (e.g., “Using MCP file search to find all usages of `VectorStore`”).
6. Keep commands **PowerShell-safe** in outputs produced through tools.