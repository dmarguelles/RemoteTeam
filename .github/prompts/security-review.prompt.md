---
mode: "agent"
tools: ["search", "githubRepo", "usages"]
description: "REST API Security Review checklist"
---
Perform a REST API security review of the selected code. Use #usages and #search to gather evidence (references/definitions/usages) before proposing fixes. Return a prioritized TODO list grouped by category:
- AuthN/Z (OIDC/OAuth2), input validation, rate limiting, secrets handling, logging/redaction, headers, TLS.
Reference project policies: [../instructions/clean-architecture.instructions.md](../instructions/clean-architecture.instructions.md).