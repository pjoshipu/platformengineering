# Persona: Backend Developer

## Stack & tooling
- Languages: Java/Kotlin, Go, Python, or Node.js/TypeScript
- Frameworks: Spring Boot / FastAPI / Express / gRPC services
- Data: PostgreSQL/MySQL, Redis, Kafka/queues; ORMs & migrations
- API: REST/GraphQL/gRPC, OpenAPI specs
- Quality & ops: unit/integration tests, Docker, observability (logs/metrics/traces)

## Key systems to access first
1. Source repo + artifact/package registry
2. Local stack via Docker Compose (DB, cache, message broker)
3. Database access (dev/staging) + migration tooling
4. Secrets manager and service-to-service auth
5. API gateway / service catalog and observability dashboards

## Role-specific onboarding tasks
- Clone repo and bring up the local stack with Docker Compose (setup, 1d)
- Run DB migrations and seed data; connect a local client (systems, 1d)
- Run unit + integration test suites (learning, 1d)
- Implement and ship a small endpoint or bug fix with tests (projects, 2d)
- Review the service catalog, API conventions, and SLOs (culture, 1d)

## Recommended resources (ranked)
1. Service architecture + API conventions (docs, 10)
2. Local-stack / Docker Compose setup guide (guide, 9)
3. Database schema + migration runbook (docs, 8)
4. Observability & on-call basics (guide, 7)

## People to meet
- Backend tech lead (mentor archetype)
- DBA / data platform owner
- SRE for the service's SLOs and on-call

## First-week goals & success metrics
- Runs the full local stack and test suite unaided
- Ships one endpoint/fix with integration tests
- Understands the service's data model and API contracts

## Ramp-time modifiers
Local-stack and data access setup can add ~1 day; otherwise on the base timeline
(intermediate ≈ 7-8d).
