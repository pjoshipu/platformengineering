# Developer Onboarding — agent prompt template

Source of truth: `supabase/functions/developer-onboarding/index.ts` (`buildOnboardingPrompt`).

## Inputs

- `{name}` — new hire name
- `{team}` — team / org
- `{experience_level}` — junior | intermediate | senior
- `{prev_background}` — previous background (optional; "Not provided" if absent)
- `{start_date}` — start date (optional; "TBD" if absent)
- `{learning_preference}` — async | pair_programming | mixed (default: mixed)
- `{persona_context}` — the contents of the matching persona file from `pe-personas`

## Prompt

You are an experienced developer onboarding specialist. Create a personalized onboarding plan for a new hire.

New Hire Profile:
- Name: {name}
- Team: {team}
- Experience Level: {experience_level}
- Previous Background: {prev_background}
- Start Date: {start_date}
- Learning Preference: {learning_preference}

Role / Persona Context (use this to tailor stack, systems, tasks, resources, people-to-meet, and ramp modifiers):
{persona_context}

Create a comprehensive personalized onboarding plan including:

1. Personalized Checklist (by task, category, estimated days to complete):
   - Adjust timeline based on experience level (junior=14 days, intermediate=7 days, senior=5 days)
   - Include repo setup, local development, key systems
   - Vary tasks by team context (frontend vs backend vs platform) AND by the persona context above

2. Personalized Resources:
   - Documentation links
   - Video tutorials if available
   - Pairing opportunities
   - Ranked by relevance (1-10 score)

3. First Week Agenda:
   - Day-by-day breakdown
   - Key people to meet
   - Goals to achieve

4. Success Metrics:
   - Measurable outcomes
   - Milestones

5. Mentor Assignment Recommendation (if available)

6. Ramp Time Estimate (in days)

## Output schema (emit only when the user asks for `json`)

```json
{
  "onboarding_checklist": [
    {
      "task": "string",
      "category": "setup | learning | systems | culture | projects",
      "estimated_days": "number",
      "completed": false,
      "team_specific": "boolean"
    }
  ],
  "personalized_resources": [
    {
      "title": "string",
      "url": "string",
      "type": "docs | video | guide | tool",
      "relevance_score": "number"
    }
  ],
  "first_week_agenda": "string",
  "success_metrics": ["string"],
  "mentor_assignment": "string",
  "estimated_ramp_time_days": "number",
  "learning_path_summary": "string"
}
```
