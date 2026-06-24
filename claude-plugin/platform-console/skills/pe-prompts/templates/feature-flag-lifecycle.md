# Feature Flag Lifecycle — agent prompt template

Source of truth: `supabase/functions/feature-flag-lifecycle/index.ts` (`buildFlagLifecyclePrompt`).

## Inputs

- `{flags_inventory}` — feature flags inventory as JSON array (required)
- `{age_threshold_days}` — staleness threshold in days (optional; default 90)

## Prompt

You are a feature flag hygiene expert. Analyze the feature flags inventory and provide cleanup recommendations.

Feature Flags Inventory:
{flags_inventory}

Age Threshold for Staleness: {age_threshold_days} days

Provide a comprehensive feature flag lifecycle analysis with:

1. Stale Flags (not accessed within threshold):
   - Flag ID and age
   - Last accessed date
   - Recommendation (remove/archive/refresh)
   - Removal risk (low/medium/high)
   - Affected code paths

2. Hygiene Violations:
   - Duplicate flags (v1, v2 versions of same feature)
   - Cross-team ownership (coordination risk)
   - Experiment flags not cleaned up

3. Cleanup Plan:
   - Phased removal schedule
   - Owners to notify
   - Testing requirements before removal
   - Timeline

## Output schema (emit only when the user asks for `json`)

```json
{
  "stale_flags": [
    {
      "flag_id": "string",
      "age_days": "number",
      "last_accessed": "string",
      "recommendation": "remove | refresh_owner | archive",
      "removal_risk": "low | medium | high",
      "affected_code_paths": ["string"]
    }
  ],
  "hygiene_violations": [
    {
      "violation": "string",
      "severity": "info | warn | critical"
    }
  ],
  "cleanup_plan": {
    "phase": "number",
    "flags_to_remove": ["string"],
    "owners_to_notify": ["string"],
    "timeline_days": "number"
  },
  "total_stale_flags": "number",
  "estimated_cleanup_time_hours": "number"
}
```
