---
description: GenAI guardrails (LangGraph/LangChain)
applyTo: "**/*"
---
## Orchestration
- Prefer **LangGraph** (deterministic graphs + checkpointer). Tools con esquemas tipados.
- Separar **STM (checkpointer)** de **LTM**: profile / semantic / episodic / summary (TTL + caps).
- Retrieval: hybrid (BM25 + vector), filtros por metadata, rerankers; evita context over-stuffing.

## Safety & Cost
- PII scrubbing; abuse filters; rate limits; audit logs.
- Token accounting; caching; eval automática (RAGAS/DeepEval) con golden sets.