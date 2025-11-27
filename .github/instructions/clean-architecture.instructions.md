---
description: Clean Architecture & Testing standards
applyTo: "**/*"
---
## Architecture
- Layers: **domain / application / interface / infrastructure**. Domain independent of frameworks.
- Ports/Adapters; DI over global singletons. No infra in domain.
- ADRs for decisions with impact (Status, Context, Decision, Consequences, Alternatives).

## Quality Bars
- Unit + integration tests for non-trivial logic.
- Lint/type checks clean (ruff/mypy or ESLint), CI must pass.
- Observability hooks (tracing/logging) in every use case.