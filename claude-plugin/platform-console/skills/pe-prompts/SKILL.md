---
name: pe-prompts
description: Canonical prompt templates for the 8 Platform Engineering Admin Console agents — developer onboarding, CI/CD diagnostic, release readiness, feature flag lifecycle, security posture, cost optimization, incident response, and the developer portal copilot. Use this skill whenever running any /admin, /on-board, /diagnostic, /release, /flags, /security, /cost, /incident, or /copilot command to load the exact agent prompt and its output schema.
---

# Platform Engineering — agent prompt templates

This skill bundles one template per agent under `templates/`, copied verbatim from the
platform's Supabase edge functions (`supabase/functions/<agent>/index.ts`) so the Claude Code
console behaves the same as the web app's Admin Console.

## How to run an agent

1. Read the matching template file in `templates/`.
2. Substitute the user-provided inputs into the `{placeholder}` variables. For optional inputs
   that the user did not provide, use the documented default (e.g. "Not provided", `0`, 90 days).
3. Generate the output following the prompt.
4. **Render a clean, human-readable report by default.** Emit the raw JSON in the template's
   output schema **only when the user replies `json`**.

## Command → template map

| Command      | Template file                        |
|--------------|--------------------------------------|
| `/on-board`  | `templates/developer-onboarding.md`  |
| `/diagnostic`| `templates/workflow-diagnostic.md`   |
| `/release`   | `templates/release-readiness.md`     |
| `/flags`     | `templates/feature-flag-lifecycle.md`|
| `/security`  | `templates/security-posture.md`      |
| `/cost`      | `templates/cost-optimization.md`     |
| `/incident`  | `templates/incident-response.md`     |
| `/copilot`   | `templates/developer-portal.md`      |

Persona tailoring for `/on-board` comes from the companion `pe-personas` skill.
