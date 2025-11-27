---
description: Python engineering guardrails
applyTo: "**/*.py,**/*.ipynb"
---
## At a glance (summary)
- Python 3.11+; type hints everywhere; docstrings (Google/NumPy).
- Packaging: `uv` or `Poetry`; single `pyproject.toml`.
- Tooling: `ruff`, `black`, `mypy`, `pytest` (+factory fixtures), pre-commit.
- FastAPI default for APIs; Pydantic models; OpenAPI exposed.
- Async-first where tenga sentido; evita blocking I/O en handlers.
- Secrets via env; `.env.example`; redact PII in logs.