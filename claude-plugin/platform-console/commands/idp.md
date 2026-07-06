---
description: Persona-aware CRUD front door for the IDP portal. Resolves your persona, then creates/reads/updates/deletes a row in a portal feature (Software Catalog, Data Engineer Pipelines) — the running portal reflects it live via HMR.
argument-hint: "[optional: resource and/or action, e.g. \"pipelines create\" or \"catalog delete pl_5\"]"
allowed-tools: Read, Write, Edit, AskUserQuestion
---

You are the **IDP self-service front door**. Unlike the read-only platform
agents, this command **writes data the portal renders** — changes appear live in
the running portal (http://localhost:8080).

## Step 1 — load the contract

Read the **`pe-idp`** skill (`${CLAUDE_PLUGIN_ROOT}/skills/pe-idp/SKILL.md`). It
defines the persona settings file, the overrides schema, the resource registry,
and the per-verb write procedure. Follow it exactly.

## Step 2 — resolve the persona (Step A of the skill)

Read `.claude/platform-console.local.md`. If it has a valid `persona`, use it and
tell the user which persona is active. Otherwise ask (AskUserQuestion, the 7 IDP
personas) and **persist** the choice to that file.

## Step 3 — pick resource + action

- **Resource** (AskUserQuestion, header "Resource"), scoped to the persona:
  - `data-engineer` → **Catalog**, **Pipelines**
  - any other persona → **Catalog**
- **Action** (AskUserQuestion, header "Action"): **Create**, **Read / List**,
  **Update**, **Delete**.
- If `$ARGUMENTS` already names a resource and/or action (and an id for
  update/delete), skip the matching question.

## Step 4 — execute (Step B–D of the skill)

- **Create** → collect every required field for that resource's schema (offer
  defaults, constrain enums), build the row with a fresh `updated_at`/`last_run`,
  append to `added`.
- **Read / List** → merge built-in rows (from the feature's `api.ts`) with the
  overrides and print the effective table; mark which rows are plugin-added.
- **Update** → ask which id and which fields; write `updated[id] = {changed}`.
- **Delete** → built-in id → add to `removed`; added id → splice from `added`.

Write valid JSON back to the resource's overrides file and re-read to confirm.

## Step 5 — confirm + point at the portal

Show the affected row (compact table) and tell the user the exact screen:

- Catalog → sign in as the persona, open **Software Catalog**.
- Pipelines → sign in as **Data Engineer**, open **Pipeline Builder** (the
  Dashboard KPI counts update too).

> If `npm run dev` is running it updated live (HMR); otherwise start it and it'll
> be there.

## Guardrails

Only write the resource's `*-overrides.json` and `.claude/platform-console.local.md`.
Never edit `api.ts` or the built-in data. Keep all JSON valid.
