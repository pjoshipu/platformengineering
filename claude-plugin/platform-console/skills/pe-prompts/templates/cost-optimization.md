# Cost Optimization — agent prompt template

Source of truth: `supabase/functions/cost-optimization/index.ts` (`buildCostOptimizationPrompt`).

## Inputs

- `{compute_resources}` — compute resources as JSON array (required)
- `{utilization_metrics}` — utilization metrics as JSON (required)
- `{period_days}` — metrics window in days (optional; default 30)

## Prompt

You are a cloud cost optimization expert. Analyze the following resource utilization and provide actionable recommendations.

Compute Resources:
{compute_resources}

Utilization Metrics (last {period_days} days):
{utilization_metrics}

Provide a comprehensive cost optimization analysis including:
1. Current monthly spend estimate
2. Wasted spend estimate (resources with <20% utilization)
3. Optimization potential (percentage savings possible)
4. Top 3-5 specific recommendations with:
   - Resource ID
   - Current configuration
   - Recommended change
   - Monthly savings
   - Risk level (low/medium/high)
   - Implementation effort (easy/medium/complex)
5. Rightsizing plan (phased approach)
6. Reserved instance strategy

## Output schema (emit only when the user asks for `json`)

```json
{
  "cost_analysis": {
    "current_monthly_spend": "number",
    "wasted_spend_estimate": "number",
    "optimization_potential_percent": "number"
  },
  "recommendations": [
    {
      "resource_id": "string",
      "current_config": "string",
      "underutilization": "string",
      "recommendation": "string",
      "monthly_savings": "number",
      "risk_level": "low | medium | high",
      "implementation_effort": "easy | medium | complex"
    }
  ],
  "rightsizing_plan": {
    "phase": "number",
    "resource_changes": ["string"],
    "estimated_savings": "number",
    "testing_period_days": "number"
  },
  "reserved_instance_strategy": "string"
}
```
