---
description: Quick-create a service in the IDP Software Catalog and see it live in the portal. Persona-aware; a shortcut for the Catalog→Create path of /idp. Writes catalog-overrides.json so the running portal updates via HMR.
argument-hint: [optional: persona and/or service name, e.g. "data-engineer payments_qc_pipeline"]
allowed-tools: Read, Write, Edit, AskUserQuestion
---

You register a new asset in the IDP **Software Catalog** — the create shortcut of
`/idp`. Unlike the read-only platform agents, this **writes real data the portal
renders**: the new service appears live in the running portal
(http://localhost:8080), at the top of that persona's Software Catalog table.

## Step 1 — Load the write contract

Read the **`pe-idp`** skill (`${CLAUDE_PLUGIN_ROOT}/skills/pe-idp/SKILL.md`). Use
its **catalog** resource entry (the `CatalogRow` schema + per-persona `type`
values and `fields` keys) and its overrides schema. Follow it exactly.

## Step 2 — Resolve persona + details from "$ARGUMENTS"

- Persona: if `$ARGUMENTS` names one, use it. Else read `.claude/platform-console.local.md`
  and use its `persona`. Else **default to `data-engineer`**.
- If `$ARGUMENTS` names a service, use that as the `name`.
- For anything still missing — `type`, `owner`, `status`, and each persona
  `fields` key — ask with **AskUserQuestion** (header "Service"), offering the
  schema's example values as defaults. Constrain `type` to the persona's allowed
  types. Do not invent a service the user didn't ask for.

## Step 3 — Write it

1. Build one `CatalogRow` per the schema: a unique `id` (`usr_<slug>`), the
   `name`, a valid `type`, `owner`, `status`, `updated_at` = current time
   (ISO-8601), and a `fields` object containing **every** key for that persona
   (use `"—"` for N/A).
2. Read `src/idp/capabilities/catalog/catalog-overrides.json` (treat missing as `{}`).
3. Append the row to `overrides["<persona>"].added` (create the persona object
   and its `added` array if needed). Never remove or reorder existing entries.
4. Write valid, pretty-printed JSON back to the same path.

## Step 4 — Confirm + point at the portal

Show the row you added (a compact table of its fields) and tell the user:

> Added **<name>** to the **<persona>** Software Catalog.
> Open the portal at http://localhost:8080, switch to the **<persona>** persona,
> and open **Software Catalog** — it's at the top of the table.
> If `npm run dev` is already running it updated live (HMR); otherwise start it
> and it'll be there.

For update/delete/list, or other resources like Pipelines, use **`/idp`**.

## Guardrails

- Only write `src/idp/capabilities/catalog/catalog-overrides.json`. Never edit
  `api.ts` or the built-in `CATALOG`.
- Keep the JSON valid — it is the portal's live data source.
