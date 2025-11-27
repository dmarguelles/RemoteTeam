<!--
Title (guidelines):
- Imperative, ≤72 chars, include scope if relevant.
- Prefix JIRA IDs when applicable, e.g.: [SSIAG-339] Feature: brief description
-->

# Overview

Brief summary of the change and the value delivered.

## Context/Motivation

Why this change is needed (ticket/ADR/background).

## What changed

- Bullet the main code changes (modules, endpoints, scripts)

## Why

Key design/tech choices (trade-offs, alternatives considered).

## How to test

```powershell
# exact steps/commands to run locally/CI
```

## Risk & Rollback

**Risks:**
**Monitoring plan:**
**Rollback plan** (how to revert safely; data migrations included).

## Backward compatibility / Breaking changes

- [ ] No breaking changes
- [ ] Breaking changes → describe impact + migration notes

## Linked issues

Closes #123, Relates to #456

## Checklist

- [ ] Tests added/updated and passing
- [ ] Lint/Type checks clean
- [ ] ADR updated (if architecture decision)
- [ ] Security review (secrets, PII, deps) done
- [ ] Observability hooks in place (traces/logs/metrics)
- [ ] Docs updated (README/runbook)
