---
name: pe-idp
description: Persona-aware CRUD write-contract for the IDP portal. Use during /idp (and /catalog-add, /persona) to resolve the active persona, then create / read / update / delete rows in a portal feature by writing that feature's overrides JSON — which the running portal merges over its built-in data and re-renders live via Vite HMR. Covers the persona settings file, the resource registry (Software Catalog, Data Engineer Pipelines), the overrides schema (added/updated/removed), and the per-verb write procedures.
---

# PE IDP — persona-aware CRUD on the portal, live

The IDP portal (`npm run dev`, http://localhost:8080) reads each feature from a
hardcoded mock array plus a plugin-writable `*-overrides.json` file. The portal
merges them with a shared engine (`src/idp/api/overrides.ts`) so the plugin can
**create / update / delete** rows **without touching source code**. Because the
overrides are imported as JSON modules, editing them triggers a **Vite HMR**
update — changes appear in the portal live, no restart.

This skill is the single source of truth for that write path. `/idp` is the
front door; `/catalog-add` is a quick catalog-create alias; `/persona` just sets
the remembered persona.

## Step A — resolve the active persona

Persona is remembered in a plugin settings file at the repo root:

```
.claude/platform-console.local.md
```

with YAML frontmatter:

```markdown
---
persona: data-engineer
---
Platform Console — remembered settings. Edit `persona` or run /persona to change.
```

Procedure:
1. Read `.claude/platform-console.local.md`. If it exists and `persona` is one of
   the valid ids below, use it.
2. Otherwise ask the user (AskUserQuestion, header "Persona") to pick one, then
   **write** the file so later commands don't re-ask.

Valid IDP persona ids (must match `src/idp/personas/registry.tsx`):
`ai-engineer`, `agentic-engineer`, `data-scientist`, `app-engineer`, `mlops`,
`security`, `data-engineer`.

## Step B — the overrides schema (all resources)

Each overrides file is a JSON object keyed by **persona id**. Each persona's
value is a `ResourceOverrides` record — the three write ops, declaratively:

```json
{
  "data-engineer": {
    "added":   [ { "id": "...", ... } ],
    "updated": { "<id>": { "<field>": "<new value>" } },
    "removed": [ "<id>" ]
  }
}
```

- **Create** → append a full row to `added`.
- **Update** → set `updated["<id>"]` to a partial object of just the changed
  fields. Works on a built-in id **or** an added id.
- **Delete** → if the id is built-in, add it to `removed`; if it's an added row,
  splice it out of `added` (and drop any stale `updated`/`removed` entry for it).
- **Read/List** → do not write. Read the built-in rows (from the feature's
  `api.ts`, listed below) and the overrides file, apply the merge in your head
  (drop `removed`, patch `updated`, prepend `added`), and print the effective
  table.

Merge order the portal uses: `added` first (top), then built-in rows minus
`removed`, with `updated` patches applied by id. So created rows sort to the top.

## Step C — resource registry

### catalog — Software Catalog (all personas)

- Overrides file: `src/idp/capabilities/catalog/catalog-overrides.json`
- Built-in data: `src/idp/capabilities/catalog/api.ts` (`const CATALOG`), keyed by persona
- Portal screen: **Software Catalog** (shared, every persona)
- Row id prefix for new rows: `usr_` (e.g. `usr_payments_qc`)
- Row schema (all fields required):

  | key | value |
  |---|---|
  | `id` | unique string, `usr_<slug>` |
  | `name` | asset name |
  | `type` | one of the persona's allowed types (below) |
  | `owner` | owning team; default = persona default (below) |
  | `status` | short status string (examples below) |
  | `updated_at` | current time, ISO-8601 |
  | `fields` | object whose keys **exactly** match the persona's field keys; use `"—"` for N/A, never omit a key |

  Per-persona `type` values, `fields` keys, example status, default owner:

  - **data-engineer** — types `Data pipeline`,`Dataset`,`Feature group`; fields `schedule`,`last_run`,`quality`,`consumers`,`refresh`; status `Success`/`Failed`/`Published`/`Healthy`; owner `data-platform`
  - **ai-engineer** — types `LLM app`,`RAG pipeline`,`Agent service`,`Embedding service`,`Prompt registry`; fields `model`,`provider`,`version`,`guardrails`,`faithfulness`; status `Healthy`/`Canary`/`Degraded`/`Active in prod`; owner `applied-ai`
  - **agentic-engineer** — types `Agent`,`Tool`,`Runtime`; fields `runtime`,`model`,`tools`(num),`autonomy`,`success`,`cost_day`; status `Healthy`/`Awaiting approval`/`Paused`; owner `autonomous-systems`
  - **data-scientist** — types `Model`,`Experiment`,`Feature group`,`Dataset`; fields `framework`,`best_metric`,`dataset`,`registry_status`; status `In prod`/`In staging`/`Pending approval`; owner `ds-team`
  - **app-engineer** — types `Service`,`API`; fields `env`,`sync`,`health`,`repo`,`route`; status `Healthy`/`Degraded`/`Progressing`; owner `payments`
  - **mlops** — types `Pipeline`,`Serving endpoint`,`Drift monitor`; fields `schedule`,`last_run`,`drift`,`rule`,`compute`; status `Success`/`Failed`/`Ready`/`Warning`; owner `ml-platform`
  - **security** — types `LLM app`,`Service`,`Model`,`Pipeline`,`Dataset`,`Policy`; fields `violations`(num),`opa_score`,`pii`,`access`; status `Compliant`/`Non-compliant`/`Enforced`; owner `security`

### pipelines — Data Engineer Pipelines (persona: data-engineer only)

- Overrides file: `src/idp/personas/data-engineer/pipelines-overrides.json`
- Built-in data: `src/idp/personas/data-engineer/api.ts` (`const PIPELINES`)
- Portal screens: **Pipeline Builder** and the Data Engineer **Dashboard** (KPI counts update too)
- Row id prefix for new rows: `pl_` (e.g. `pl_payments_qc`)
- Row schema (all fields required):

  | key | value |
  |---|---|
  | `id` | unique string, `pl_<slug>` |
  | `name` | pipeline name (snake_case), e.g. `payments_qc` |
  | `schedule` | cron or macro, e.g. `0 * * * *`, `@hourly`, `@daily` |
  | `last_run` | ISO-8601 timestamp (use "now" for a fresh pipeline) |
  | `duration_min` | number (minutes) |
  | `status` | one of `Running`, `Success`, `Failed`, `Skipped` |
  | `output_dataset` | e.g. `analytics.payments_qc` |
  | `quality_score` | number 0–100 |

  Only offer this resource when the active persona is `data-engineer`.

## Step D — write procedure

1. Resolve persona (Step A). Choose the resource (scoped to persona) and the
   CRUD action. For **create/update**, collect every required field with
   AskUserQuestion, offering the schema examples as defaults; constrain enum-like
   fields (`type`, `status`) to the allowed values. For a new `updated_at` /
   `last_run`, compute the current time in ISO-8601.
2. Read the resource's overrides file (treat missing as `{}`). Ensure the
   `overrides[persona]` object exists.
3. Apply the op to `added` / `updated` / `removed` per Step B.
4. Write valid, pretty-printed JSON back to the same path. Re-read to confirm it
   parses.
5. Confirm to the user: show the affected row, name the exact portal screen, and
   note it updated live via HMR (or that `npm run dev` will pick it up).

## Guardrails

- Only ever write these three files: the two `*-overrides.json` files above and
  `.claude/platform-console.local.md`. Never edit any `api.ts`, `CATALOG`,
  `PIPELINES`, or `overrides.ts`.
- Keep every JSON file valid — they are the portal's live data source; a syntax
  error breaks the feature's build.
- Never reorder or drop unrelated existing entries. Deletes are expressed as
  `removed` tombstones (or splicing an added row), never by editing source data.
