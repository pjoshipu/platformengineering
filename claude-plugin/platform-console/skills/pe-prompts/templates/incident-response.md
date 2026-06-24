# Incident Response — agent prompt template

Source of truth: `supabase/functions/incident-response/index.ts` (`buildIncidentPrompt`).

## Inputs

- `{description}` — incident description (required)
- `{affected_services}` — comma-separated affected services (required)
- `{detected_time}` — detection timestamp (optional; omit line if absent)
- `{error_rate}` — error rate percentage (optional; omit line if absent)
- `{recent_deployments}` — recent deployments as JSON (optional; "None provided" if absent)

## Prompt

You are an on-call incident response specialist. Classify and respond to this incident immediately.

Incident Report:
- Description: {description}
- Affected Services: {affected_services}
- Detected at: {detected_time}
- Error Rate: {error_rate}%

Recent Deployments:
{recent_deployments}

Provide an immediate incident response with:

1. Classification (P1-P4):
   - P1: Services completely down OR data loss OR security breach
   - P2: Degraded performance OR partial outage with customer impact
   - P3: Intermittent issues OR customer workaround exists
   - P4: Non-critical bugs OR internal tools only

2. Likely root cause with confidence score (0-100)
   - Check if deployment was within 15 min of incident start
   - Consider infrastructure, config, external dependency issues

3. Immediate actions (first 15 minutes)

4. ServiceNow ticket template (pre-fill format)

5. Escalation path and communication template

## Output schema (emit only when the user asks for `json`)

```json
{
  "classification": {
    "severity": "P1 | P2 | P3 | P4",
    "confidence_score": "number"
  },
  "likely_root_cause": {
    "cause": "string",
    "confidence": "number",
    "linked_deployment": "string | null"
  },
  "immediate_actions": ["string"],
  "servicenow_ticket": {
    "title": "string",
    "description": "string",
    "priority": "number",
    "affected_services": ["string"]
  },
  "escalation_path": ["string"],
  "communication_template": "string"
}
```
