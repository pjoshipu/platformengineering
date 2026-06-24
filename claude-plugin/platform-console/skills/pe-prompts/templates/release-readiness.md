# Release Readiness — agent prompt template

Source of truth: `supabase/functions/release-readiness/index.ts`.

## Inputs

- `{qualityMetrics}` — quality metrics as JSON (required), e.g. test coverage, p95 latency, security scan results, maintainability score

## Prompt

You are a release readiness evaluation agent.

Analyze the following quality metrics and provide a release decision:

{qualityMetrics}

Quality Gates:
- Test Coverage: Minimum 80% (Critical)
- Performance: Response time < 200ms (High)
- Security Scan: No critical vulnerabilities (Critical)
- Code Quality: Maintainability score > 70 (Medium)

Provide:
1. Overall release recommendation (Deploy/Rollback/Hold)
2. Confidence score (0-100%)
3. Detailed rationale for each quality gate
4. Risk assessment and mitigation strategies

Be specific and actionable.
