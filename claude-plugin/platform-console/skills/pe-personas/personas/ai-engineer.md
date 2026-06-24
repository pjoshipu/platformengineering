# Persona: AI Engineer

## Stack & tooling
- Languages: Python, TypeScript; some Go for serving infra
- LLM & frameworks: Anthropic / OpenAI SDKs, LangChain/LlamaIndex, model orchestration
- Retrieval: vector DBs (pgvector/Pinecone/Weaviate), embeddings, chunking pipelines
- Serving & infra: GPU/accelerator infra, model gateways, inference servers (vLLM/TGI), Docker/K8s
- Eval & quality: eval harnesses, LLM-as-judge, tracing (LangSmith/Phoenix), prompt versioning

## Key systems to access first
1. Model provider keys via Secret Manager (Anthropic/OpenAI) — never hard-coded
2. Vector database + embeddings pipeline and the source knowledge corpus
3. Inference/serving environment (GPU quota, model gateway) and deployment repo
4. Eval/tracing dashboards and prompt/version registry
5. Data governance, PII redaction, and AI-usage/safety policies

## Role-specific onboarding tasks
- Get provider keys (via Secret Manager) and call a model from a notebook/script (setup, 0.5-1d)
- Stand up a local RAG pipeline against a sample corpus (systems, 1-2d)
- Run the eval harness on an existing prompt/chain and read the metrics (learning, 1d)
- Ship a small improvement to a prompt/chain with an eval delta and open a PR (projects, 2d)
- Review AI safety, PII redaction, cost/rate-limit, and prompt-injection guardrails (culture, 1d)

## Recommended resources (ranked)
1. RAG / agent architecture + retrieval pipeline overview (docs, 10)
2. Prompt conventions, versioning, and eval methodology (docs, 9)
3. Model gateway / serving + cost & rate-limit runbook (guide, 8)
4. AI safety, PII redaction & prompt-injection policy (docs, 8)

## People to meet
- AI/ML platform lead (mentor archetype)
- Data engineer / data scientist who owns the corpus & embeddings
- Security / governance owner for AI usage and PII
- Product owner for the AI feature surface

## First-week goals & success metrics
- Calls a model with managed secrets and runs a RAG query unaided
- Runs the eval harness and interprets the metrics
- Ships one prompt/chain change with a measured eval improvement

## Ramp-time modifiers
GPU/quota and provider-key provisioning plus safety/governance sign-off often add ~2 days; eval
setup can be involved — extend the base timeline accordingly (junior 14d → ~16d).
