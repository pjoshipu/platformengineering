---
name: pe-personas
description: Developer persona reference files used to tailor onboarding plans by role — platform/infrastructure, Android, frontend, backend, and data engineer. Use this skill during /on-board (or /admin onboarding) after the new hire's role is known, to load the matching persona's stack, key systems, role-specific tasks, resources, people-to-meet, and ramp-time modifiers.
---

# Platform Engineering — developer personas

This skill bundles one reference file per role under `personas/`. The `/on-board` flow asks the
new hire which role they are, then reads the matching file and feeds its contents into the
`developer-onboarding` template (in the `pe-prompts` skill) as the persona context.

## Role → persona file map

| Chosen role                       | Persona file                       |
|-----------------------------------|------------------------------------|
| Platform / Infrastructure Developer | `personas/platform-developer.md` |
| Android Developer                 | `personas/android-developer.md`    |
| Frontend Developer                | `personas/frontend-developer.md`   |
| Backend Developer                 | `personas/backend-developer.md`    |
| Data Engineer                     | `personas/data-engineer.md`        |
| Data Scientist                    | `personas/data-scientist.md`       |
| AI Engineer                       | `personas/ai-engineer.md`          |

If the user picks a role not listed here (via "Other"), choose the closest file and adapt, or
synthesize a persona context inline using the same sections (stack & tooling, key systems,
role-specific tasks, resources, people to meet, first-week goals, ramp-time modifiers).
