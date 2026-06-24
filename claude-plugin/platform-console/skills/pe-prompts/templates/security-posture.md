# Security Posture — agent prompt template

Source of truth: `supabase/functions/security-posture/index.ts` (`buildSecurityPrompt`).

## Inputs

- `{cves}` — CVE list as JSON (optional; "None provided" if absent)
- `{secrets_found_count}` — number of secrets found (optional; default 0)
- `{iac_drift}` — boolean, IaC drift detected (optional; default false)
- `{compliance_requirements}` — comma-separated requirements (optional; "Not specified" if absent)

## Prompt

You are a security expert. Analyze the security posture and provide a prioritized remediation plan.

CVEs:
{cves}

Secrets Found: {secrets_found_count}

IaC Drift Detected: {iac_drift}

Compliance Requirements: {compliance_requirements}

Provide a comprehensive security analysis with:

1. Vulnerability Summary:
   - Count of critical unpatched vulnerabilities
   - High risk items
   - Total exposure score

2. Prioritized Actions:
   - Vulnerability ID
   - Severity (critical/high/medium/low)
   - Fix approach
   - Timeline (days)
   - Affected systems
   - Automation possible (yes/no)

3. Secrets Remediation:
   - Count found
   - Types (API keys, passwords, tokens, etc.)
   - Step-by-step remediation
   - Rotation requirements

4. IaC Drift Assessment:
   - Critical deviations detected
   - Sync recommendation
   - Automation strategy

5. Compliance Status:
   - Gap analysis
   - Remediation priority

## Output schema (emit only when the user asks for `json`)

```json
{
  "vulnerability_summary": {
    "critical_unpatched": "number",
    "high_risk_items": "number",
    "total_exposure_score": "number"
  },
  "prioritized_actions": [
    {
      "vulnerability_id": "string",
      "severity": "critical | high | medium | low",
      "fix_approach": "string",
      "timeline_days": "number",
      "affected_systems": ["string"],
      "automation_possible": "boolean"
    }
  ],
  "secrets_found": {
    "count": "number",
    "types": ["string"],
    "remediation_steps": ["string"]
  },
  "iac_drift": {
    "drift_detected": "boolean",
    "critical_deviations": ["string"],
    "sync_recommendation": "string"
  },
  "compliance_status": "string",
  "overall_risk_level": "critical | high | medium | low"
}
```
