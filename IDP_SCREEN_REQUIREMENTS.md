# IDP Screen Requirements — Persona-Aware, Capability-Driven

Screen requirements for the Internal Developer Platform, generated from the
capability-to-persona scope. **One screen per capability**, persona-aware:
the active persona (from `AuthContext.user.persona`) drives which entities,
fields, and actions render — we do **not** duplicate screens per persona
unless workflows are fundamentally different.

## Personas
`ai-engineer` (AI), `agentic-engineer` (AGE), `data-scientist` (DS),
`app-engineer` (APE), `mlops` (MLE), `security` (SCE), `data-engineer` (DE).

> The source scope omitted per-capability breakdowns for **Agentic Engineer**;
> its rows below are derived from the existing `agentic-engineer` domain
> (agent registry, plan→act→observe runs, tools, autonomy budget, HITL
> checkpoints) so the spec is complete for all 7 personas.

## Global design principles
- **Single persona-aware screen per capability.** The screen reads the active
  persona and adapts its columns, default filters, entity types, and action set.
  Reuse the shared library in `src/idp/components` (`DataTable`, `MetricCard`,
  `SideDrawer`, `Wizard`, `StatusBadge`, `Field`, chart wrappers).
- **APIs are persona-parameterized.** List/summary endpoints take `?persona=<id>`
  and return the entity shape relevant to that persona; the server (mock layer
  today) owns the persona→entity mapping. Detail/action endpoints are keyed by
  the concrete asset id and are persona-agnostic.
- **RBAC (Capability 4.3).** The matrix governs access: every capability is full
  self-service for its owning personas; **Role-Based Management is SCE/admin
  only**, others are view-only. Actions that mutate cross-team or prod state
  require elevation.
- **Everything is same-origin mock data today** (each persona's `api.ts`); these
  requirements describe the target capability screens that generalize it.

## Capability → screen → route (summary)
| # | Capability | Screen | Route |
|---|------------|--------|-------|
| 1.1 | Software Catalogs | `Catalog` | `/catalog` (+ `/catalog/:assetId`) |
| 1.2 | Curated Templates | `Templates` | `/templates` |
| 1.3 | Assessment Scorecards | `Scorecards` | `/scorecards` (+ `/scorecards/:assetId`) |
| 1.4 | Service Health Metrics | `Health` | `/health/:assetId` |
| 2.1 | Documentation | `Docs` | `/docs` (+ `/docs/:docId`) |
| 2.2 | Forum | `Forum` | `/forum` (+ `/forum/:threadId`) |
| 3.1 | Self-Service Actions | `Actions` | `/actions` |
| 3.2 | Platform Integrations | `Integrations` | `/integrations` |
| 3.3 | Pipeline Orchestration | `Pipelines` | `/pipelines` (+ `/pipelines/:runId`) |
| 3.4 | Infrastructure KPIs | `InfraKPIs` | `/infra` |
| 4.1 | Customizable Dashboard | `Dashboard` | `/dashboard` |
| 4.2 | Portal Usage Analytics | `Analytics` | `/analytics` |
| 4.3 | Role-Based Management | `Admin` | `/admin/*` (SCE/admin) |

---

# PILLAR 1 — SOFTWARE ASSETS

## 1.1 Software Catalogs — screen `Catalog` (`/catalog`)

**Purpose:** One searchable registry of every asset. The catalog shows the asset
*types* the active persona owns, with persona-relevant columns and row actions;
a shared detail drawer opens any asset.

**Persona adaptation**
| Persona | Primary asset types | Persona columns | Row actions |
|---|---|---|---|
| AI | LLM apps, RAG pipelines, agent services, embedding services, prompt registries | model, provider, version, guardrail status, faithfulness, endpoint, owner | View deployment, Clone config, Open observability |
| AGE | Autonomous agents, agent runs, tools, runtimes | runtime, model, tools, autonomy, success rate, HITL policy, cost/day | View runs, Deploy agent, Edit autonomy policy |
| DS | Trained models, experiments, feature groups, training datasets | framework, best metric, training dataset, registry status, owner | Request retraining, Compare versions, Submit for approval |
| APE | Microservices, APIs, Score-spec workloads | env, sync status, health, Git repo, Kong route, deps | Redeploy, Scale, View GitOps status |
| MLE | ML pipelines, training jobs, serving endpoints, drift monitors | schedule, last run, drift score, retraining rule, compute | Trigger pipeline, View drift report, Edit retraining rule |
| SCE | **All** assets (cross-persona) + compliance | policy violations, OPA score, last audit event, access level, PII flag | View violations, Run policy check, View audit trail |
| DE | Data pipelines, published datasets, feature groups, lineage | schedule, last run, quality score, downstream consumers, refresh | Trigger pipeline, View lineage, Edit dataset |

**Fields (screen):** global search box; type filter (options vary by persona);
status filter; owner/team filter; `DataTable` whose columns come from the
persona column set above; SCE adds a cross-persona **asset-type** facet and a
compliance column on every row.

**Interactions:** search (debounced) + filter update the query; sortable columns;
row click → **Asset detail drawer** (summary, owner, links to Health/Docs/Scorecard
for that asset, persona action buttons); action buttons stop row-click propagation
and call the persona action endpoint (toast on success).

**API calls**
- `GET /api/catalog?persona=<id>&q=&type=&status=&owner=` → `[{ id, name, type, owner, status, ...personaFields }]`
- `GET /api/catalog/:assetId` → full detail (persona-agnostic) + `links{health,docs,scorecard}`
- Actions reuse existing endpoints, e.g. `POST /api/services/:id/redeploy`, `POST /api/mlops/pipelines/:id/trigger`, `POST /api/agentic/agents/:id/pause`, `GET /api/security/assets/:id/violations`.

---

## 1.2 Curated Templates — screen `Templates` (`/templates`)

**Purpose:** Library of pre-approved scaffolds; the active persona sees its own
template categories and can preview, use (pre-fills the relevant Self-Service
form), or contribute a template.

**Persona adaptation**
| Persona | Template categories | Persona preview fields | Actions |
|---|---|---|---|
| AI | RAG starter, LLM API wrapper, agent-service scaffold, guardrail policy set, prompt library | included guardrails, provider compatibility, est. cost | Use, Clone & customise, Submit to library |
| AGE | Agent scaffold (Claude Agent SDK/LangGraph), tool-binding preset, autonomy-policy preset, HITL checkpoint set, eval-scenario pack | runtime, bundled tools + scopes, autonomy defaults, HITL rules | Use → Deploy Agent wizard, Clone, Submit |
| DS | Training-job config per framework, experiment notebook, model-serving Score spec, eval report | framework, default hyperparams, quality checks, example dataset | Use → New Training Request, Clone |
| APE | Score-spec scaffolds per service type, Crossplane claims, Kong route configs, GitOps folder layouts | resource-dep defaults, env presets, example YAML, provisioning time | Use → New Service, Deploy directly, Save draft |
| MLE | Pipeline DAG starters, drift-monitor configs, retraining-rule presets, infra sizing | compute defaults, alert thresholds, compatible model types | Use, Attach to model |
| SCE | OPA policy templates (resource limits, restrict registries, block privileged, require labels), audit report formats | enforcement default, scope options, included test sample | Deploy from template, Customise & save |
| DE | Pipeline DAG starters per source, DQ check bundles, dataset schema templates, feature-group scaffolds | source compatibility, default DQ checks, output format | Use → Pipeline Builder, Pre-fill |

**Fields:** category tabs (persona-scoped); template cards (name, description, tags,
preview fields, "approved" badge, version); template preview panel (README + the
included config/YAML/policy); "Use" opens the target wizard pre-filled.

**Interactions:** filter by category/tag/search; card → preview drawer; **Use**
routes to the matching Self-Service screen with `?template=<id>`; **Submit to
library** opens a contribute form (needs approval → SCE/owner review).

**API calls**
- `GET /api/templates?persona=<id>&category=&q=` → `[{ id, name, category, tags, preview, version, approved }]`
- `GET /api/templates/:id` → `{ readme, config, previewFields }`
- `POST /api/templates` (contribute) → `{ template_id, status:"pending-review" }`
- Consumption is client-side: navigate to the target wizard with the template payload.

---

## 1.3 Assessment Scorecards — screen `Scorecards` (`/scorecards`)

**Purpose:** Health/maturity assessment per asset against platform standards;
surfaces gaps with links to the screen that fixes each gap.

**Persona adaptation (scored dimensions)**
| Persona | Scored on | Scope shown |
|---|---|---|
| AI | guardrail coverage, prompt version control, observability setup, cost/call, hallucination rate, canary used | per LLM app |
| AGE | autonomy budget defined, HITL on write-tools, least-privilege tool scopes, run success rate, eval coverage, run traces enabled | per agent |
| DS | model-doc completeness, eval metric coverage, reproducibility (dataset+hyperparams logged), approval followed | per model |
| APE | resource limits, health checks, GitOps sync healthy, Kong route secured, dependency declarations | per service |
| MLE | drift monitor attached, retraining rule defined, run frequency, alert thresholds, last-success recency | per pipeline+model |
| SCE | policy coverage/namespace, audit-log retention, PII datasets flagged, roles reviewed, violation rate | org-wide + per-team |
| DE | DQ check coverage, lineage documented, schema registered, refresh set, PII flagged, access level | per dataset+pipeline |

**Fields:** score gauge (0–100, color-coded) per asset; gap checklist (item,
status pass/fail, recommended action, "Fix" deep-link); SCE view adds an org score
+ per-team breakdown table.

**Interactions:** filter by asset/score band; row/card → detail with the gap list;
each gap's **Fix** navigates to the owning screen (e.g. AI guardrail gap →
`/actions?agent=guardrail&app=`; DE schema gap → Dataset Publisher) prefilled.

**API calls**
- `GET /api/scorecards?persona=<id>` → `[{ asset_id, name, score, gaps:[{id,label,status,fix_link}] }]`
- `GET /api/scorecards/:assetId` → full dimension breakdown
- `GET /api/scorecards/summary?persona=security` → `{ org_score, by_team:[] }`

---

## 1.4 Service Health Metrics — screen `Health` (`/health/:assetId`)

**Purpose:** Real-time + historical operational health for one asset; the metric
set and chart layout adapt to the asset/persona type. (Reachable from Catalog.)

**Persona adaptation (metric set + display)**
| Persona | Metrics | Display |
|---|---|---|
| AI | p50/p95/p99 latency, error rate, faithfulness, hallucination rate, token usage, cost/call, guardrail trigger rate | per-metric timeseries with threshold lines + incident markers |
| AGE | run success rate, avg steps/run, tokens & cost/run, blocked-tool rate, HITL checkpoint latency, autonomy budget used | run-health dashboard + step distribution |
| DS | live accuracy over time, prediction-distribution drift, serving latency, request volume | model-performance dashboard per deployed version |
| APE | pod health, replica count, CPU/mem, request rate, error rate, sync status | service dashboard with K8s signals |
| MLE | pipeline success rate, avg run duration, GPU/CPU util, data freshness, drift-score trend | pipeline-ops dashboard with run history |
| SCE | violation rate over time, guardrail incident frequency, access-anomaly count, audit event volume | security-posture trend charts |
| DE | pipeline success rate, rows processed, DQ pass rate, dataset freshness, feature-store lag | data-ops dashboard per pipeline |

**Fields:** time-range selector (1h/6h/24h/7d/30d); metric cards (current + delta);
charts (line/area/stacked per metric); incident/marker overlay; right panel of
open incidents scoped to the asset.

**Interactions:** change range → refetch series; hover tooltips; click incident
marker → incident detail; "Investigate" → Pipelines/Actions as relevant.

**API calls**
- `GET /api/health/:assetId/metrics?persona=<id>&range=24h` → `{ ...metricSet }`
- `GET /api/health/:assetId/timeseries?metric=&range=` → `[{ ts, value }]`
- `GET /api/health/:assetId/incidents` → `[{ id, severity, title, ts }]`

---

# PILLAR 2 — KNOWLEDGE ASSETS

## 2.1 Documentation — screen `Docs` (`/docs`)

**Purpose:** Structured, searchable knowledge base linked to catalog entries.
The editor/browser is shared; persona changes default templates, doc-type filters,
and suggested links.

**Persona adaptation**
| Persona | Authoring doc types (defaults) | Common searches |
|---|---|---|
| AI | LLM app runbooks, prompt-design rationale, guardrail explanations, cost-tuning guides, post-mortems | RAG best practices, provider comparisons, troubleshooting |
| AGE | agent design docs, tool/permission rationale, autonomy-policy explanations, run post-mortems | agent patterns, HITL playbooks, tool-scope guidance |
| DS | model cards, experiment notes, dataset usage guides, eval methodology | dataset docs, feature definitions, prior results |
| APE | service READMEs, ADRs, Score-spec guides, deployment runbooks | dependency docs, Kong examples, GitOps conventions |
| MLE | pipeline design docs, drift-threshold rationale, retraining guides, infra sizing | compute comparisons, drift playbooks |
| SCE | policy descriptions, compliance mappings, IR playbooks, access guides | policy templates, regulatory notes, audit procedures |
| DE | dataset docs, pipeline design notes, DQ rationale, schema change logs, feature-eng guides | source docs, transformation patterns, lineage |

**Shared fields (all personas):** rich-text editor (code blocks, tables, diagrams);
title, doc-type, tags, linked catalog entry; version history; comments/suggested edits.

**Interactions:** full-text search with filters (persona, asset type, date, author);
create/edit with autosave + version snapshots; **Link to catalog entry** picker;
comment threads and suggested-edit review/accept.

**API calls**
- `GET /api/docs?persona=<id>&q=&type=&asset=&author=&date=` → `[{ id, title, type, tags, linked_asset, updated_by, updated_at }]`
- `GET /api/docs/:docId` → `{ body, versions:[], links, comments:[] }`
- `POST /api/docs` / `PUT /api/docs/:docId` → `{ doc_id, version }`
- `POST /api/docs/:docId/comments` → `{ comment_id }`
- `POST /api/docs/:docId/link` `{ asset_id }`

---

## 2.2 Forum — screen `Forum` (`/forum`)

**Purpose:** Cross-persona discussion (questions, discussions, proposals,
announcements) linked to catalog entries/docs.

**Persona adaptation:** default topic tags and a "For you" feed filter derive from
the persona (AI → prompt/guardrail/RAG/cost; AGE → agent design, autonomy/HITL, tool
permissioning, evals; DS → features, model comparison, eval methodology; APE →
Score spec, deps, GitOps, Kong; MLE → drift, retraining, GPU, reliability; SCE →
policy enforcement, compliance, IR, access — **plus moderation controls**; DE →
source changes, schema evolution, pipeline failures, feature-store, lineage).

**Shared fields:** post types Question/Discussion/Proposal/Announcement; tags
(persona, asset type, topic); body (rich text); linked catalog entry/doc.

**Interactions:** create post; upvote; comment; **accept answer** (questions);
follow thread; notifications on mentions/followed threads; SCE/admin can pin,
lock, move, or remove posts.

**API calls**
- `GET /api/forum?persona=<id>&type=&tag=&q=&sort=` → `[{ id, type, title, tags, author, votes, answered, followers }]`
- `GET /api/forum/:threadId` → `{ post, comments:[], accepted_answer_id }`
- `POST /api/forum` / `POST /api/forum/:threadId/comments`
- `POST /api/forum/:threadId/vote` `{ dir }`, `.../accept` `{ comment_id }`, `.../follow`
- Moderation (SCE/admin): `POST /api/forum/:threadId/moderate` `{ action:"pin|lock|move|remove" }`

---

# PILLAR 3 — ENVIRONMENT ASSETS

## 3.1 Self-Service Actions — screen `Actions` (`/actions`)

**Purpose:** Catalog of pre-approved actions the persona can run without a ticket;
each action opens a form/wizard and enforces guardrails before executing.

**Persona adaptation (actions + guardrails)**
| Persona | Actions | Guardrails enforced |
|---|---|---|
| AI | deploy LLM app, update prompt version, adjust canary split, enable/disable guardrail, rollback, scale replicas | cost cap; guardrail policies auto-applied pre-deploy |
| AGE | deploy agent, adjust autonomy budget, approve/reject HITL checkpoint, enable/disable tool, pause/resume agent, rollback version | write-scoped tools require HITL; autonomy budget cap enforced |
| DS | submit training request, promote model→staging, request dataset access, clone experiment, trigger eval | compute quota check; metric-threshold gate before promotion |
| APE | deploy service (Score spec), provision resource, sync GitOps app, create Kong route, scale | OPA policy check pre-deploy; resource limits enforced |
| MLE | trigger pipeline run, attach drift monitor, create retraining rule, adjust GPU alloc, pause/resume schedule | quota check; schedule-conflict detection |
| SCE | deploy OPA policy, revoke access, run compliance scan, export audit log, enable guardrail org-wide | policy syntax validation + test-pass before cluster apply |
| DE | trigger pipeline run, publish dataset, refresh feature group, request schema change, update lineage | DQ gate before publish; PII flag notifies security |

**Fields:** action grid (cards grouped by asset); each action → a right-drawer form
with only the inputs that action needs; a **guardrail preflight** banner showing the
checks that will run.

**Interactions:** click action → form; on submit, run preflight (show pass/fail);
on pass, execute and route to the resulting pipeline/status (Capability 3.3);
elevation-required actions show an "elevate" prompt if the persona lacks permission.

**API calls**
- `GET /api/actions?persona=<id>` → `[{ id, label, asset_type, form_schema, guardrails:[] }]`
- `POST /api/actions/:id/preflight` `{ inputs }` → `{ checks:[{name,status,reason}] }`
- `POST /api/actions/:id/execute` `{ inputs }` → `{ pipeline_run_id }` (or `{ status }`)

---

## 3.2 Platform Integrations — screen `Integrations` (`/integrations`)

**Purpose:** Pre-built connections to the persona's external tools, surfacing their
data inside the IDP.

**Persona adaptation**
| Persona | Integrations | Surfaced in IDP |
|---|---|---|
| AI | LLM providers (Anthropic, Vertex, OpenAI, self-hosted), vector stores, tracing/observability, guardrail services, cost dashboards | live token usage, cost/call, trace viewer, provider status |
| AGE | agent runtime/registry, tool gateway (MCP), tracing/observability, model providers | run traces, tool-call volume, checkpoint queue, provider status |
| DS | training platforms, experiment trackers, model registries, dataset storage, notebooks | training-job status, experiment metrics, registry entries, dataset previews |
| APE | GitOps controller, infra provisioner, API gateway, container registry, secrets manager | sync status, resource state, route config, deploy health |
| MLE | training platforms, monitoring, alerting, compute schedulers, drift detection | run results, drift scores, alert history, compute util |
| SCE | policy engine, audit-log aggregator, IAM, vuln scanner, SIEM | violation feed, audit events, access anomalies, compliance score |
| DE | orchestrator, data catalog, feature store, DQ engine, lineage tracker, source systems | DAG status, DQ results, lineage graph, feature freshness |

**Fields:** integration cards (name, category, connection status, last sync); a
detail drawer with the surfaced live data widget + config (endpoint, auth mode,
scopes — secrets masked).

**Interactions:** connect/disconnect (OAuth or credential form); test connection;
open the surfaced data widget; SCE sees connection compliance (scopes, last audit).

**API calls**
- `GET /api/integrations?persona=<id>` → `[{ id, name, category, status, last_sync }]`
- `GET /api/integrations/:id` → `{ config(masked), surfaced_data }`
- `POST /api/integrations/:id/connect` / `/test` / `DELETE /api/integrations/:id`

---

## 3.3 Pipeline Orchestration — screen `Pipelines` (`/pipelines`)

**Purpose:** Trigger, monitor, and manage the pipelines relevant to the persona,
with a shared run-detail view (steps, logs, gates).

**Persona adaptation**
| Persona | Pipelines | Run detail emphasis | Actions |
|---|---|---|---|
| AI | LLM app deploy, canary promotion, prompt eval, guardrail test | step status, live logs, quality-gate result/step | trigger deploy, approve promotion gate, abort, history |
| AGE | agent deploy, sandbox eval, run trace | plan→act→observe steps, tool calls, HITL checkpoints | deploy, approve checkpoint, abort run |
| DS | model training, evaluation, model promotion | training progress, streaming epoch metrics, eval gate, approval status | submit job, approve/reject promotion, re-trigger step |
| APE | service deploy, infra provisioning, GitOps sync | step status, provisioning log, sync result/app | trigger deploy, sync now, rollback |
| MLE | scheduled training, drift eval, retraining trigger | run history, duration trends, failure reason, next run | trigger now, edit schedule, pause/resume, logs |
| SCE | policy deploy, compliance scan, audit export | deploy status, scan results/namespace, export completion | trigger scan, deploy policy, approve rollout |
| DE | ETL/ELT, feature computation, DQ, dataset publish | step status, rows processed, DQ results, output location | trigger, re-run failed step, skip DQ gate w/ reason (approval) |

**Fields:** pipeline list (name, type, last run, status, next run) filtered by
persona; run detail: step timeline with per-step status/logs, gate results,
metrics stream where applicable; approval controls for gated steps.

**Interactions:** trigger/re-run/abort; approve or reject a gate (typed reason for
overrides, e.g. DE "skip DQ gate"); live-tail logs; view run history + trends.

**API calls**
- `GET /api/pipelines?persona=<id>` → `[{ id, name, type, last_run, status, next_run }]`
- `GET /api/pipelines/:runId` → `{ steps:[{name,status,log,gate?}], metrics? }`
- `POST /api/pipelines/:id/trigger`, `POST /api/pipelines/:runId/abort`, `POST /api/pipelines/:runId/steps/:step/retry`
- `POST /api/pipelines/:runId/gate` `{ decision, reason? }`

---

## 3.4 Infrastructure KPIs — screen `InfraKPIs` (`/infra`)

**Purpose:** Platform-wide + per-persona resource-efficiency and reliability KPIs.

**Persona adaptation**
| Persona | KPIs | Display |
|---|---|---|
| AI | endpoint uptime, serving latency trend, token throughput, cost/1k calls, guardrail trigger rate | per-app KPI cards with trend indicators |
| AGE | active agents, active runs, pending checkpoints, autonomy budget used %, token spend/day | agent-ops KPI cards |
| DS | training-queue depth, avg wait time, GPU-hours this month, serving request volume | usage summary with quota remaining |
| APE | services healthy/total, sync error rate, infra drift count, avg deploy time, rollback rate | platform-ops dashboard |
| MLE | GPU/CPU util, pipeline success rate, avg training duration, drift-alert frequency, time-to-retrain | ML-infra efficiency dashboard |
| SCE | compliance score/namespace, violation-rate trend, MTTR, audit event volume, access-anomaly rate | security-posture dashboard with trend lines |
| DE | pipeline success rate, avg duration, DQ pass rate, dataset freshness lag, feature-store update delay | data-platform reliability dashboard |

**Fields:** KPI cards (value, trend, target); trend charts; quota gauges where
relevant; time-range selector.

**Interactions:** change range; drill from a KPI to the underlying Health/Pipelines
screen; set/adjust target (owning persona).

**API calls**
- `GET /api/infra/kpis?persona=<id>&range=` → `{ ...kpiSet, trends:{} }`
- `GET /api/infra/kpis/:kpi/timeseries?range=`

---

# PILLAR 4 — PORTAL MANAGEMENT & ADMINISTRATION

## 4.1 Customizable Dashboard — screen `Dashboard` (`/dashboard`)

**Purpose:** The persona's landing page; default widget set per persona, fully
user-customizable.

**Persona adaptation (default widgets)**
| Persona | Default widgets | Add-from-library examples |
|---|---|---|
| AI | active LLM apps health, today's cost, avg faithfulness, active canaries, recent incidents, prompt activity | token usage chart, guardrail feed, cost by app, trace volume |
| AGE | agents health, active runs, pending checkpoints, autonomy budget, today's cost | run success trend, tool-call volume, checkpoint latency, cost by agent |
| DS | active training jobs, experiments this week, models pending approval, recent results | compute-quota gauge, dataset access requests, metric trends, approval queue |
| APE | services healthy/total, GitOps sync errors, active deployments, infra drift | deployments feed, usage by namespace, rollback history, sync errors |
| MLE | pipeline health, active drift alerts, GPU util, retraining jobs today | run-history chart, drift trends, compute cost by model, rule status |
| SCE | policy violations today, compliance by namespace, guardrail incidents, access anomalies | violation trend, top violating teams, audit volume, open incidents |
| DE | pipelines running, failed runs today, DQ alerts, datasets published | duration trends, quality by dataset, feature freshness, lineage change feed |

**Shared fields/interactions:** drag-and-drop reorder; add/remove from a widget
library; save multiple named layouts; per-widget default time range; share a layout
with teammates.

**API calls**
- `GET /api/dashboard/layout?persona=<id>` → `{ layouts:[], active }`
- `GET /api/widgets/catalog?persona=<id>` → `[{ id, title, defaultRange }]`
- `GET /api/widgets/:id/data?persona=<id>&range=`
- `PUT /api/dashboard/layout` `{ layout }`, `POST /api/dashboard/layout/share` `{ layout_id, team }`

---

## 4.2 Portal Usage Analytics — screen `Analytics` (`/analytics`)

**Purpose:** Two modes on one screen: **Admin/team-lead** (all personas) and
**Individual** (my own usage). Mode is chosen by permission; individuals always
see their own.

**Admin mode fields:** active users per persona, feature adoption per capability,
most-used templates, most-searched catalog terms, deploy frequency per team, doc
coverage score, forum participation; per-team breakdown table, adoption funnel, top
contributors. **Actions:** export usage report, set adoption targets, flag
low-adoption teams.

**Individual mode (per persona "my activity"):** AI → my deployments, prompt
changes, cost attributed, guardrail incidents; AGE → my agents deployed, my runs,
checkpoints I approved, tools I enabled; DS → training jobs, experiment runs, models
promoted, dataset requests; APE → deployments, provisions, syncs, rollbacks; MLE →
pipeline runs, drift alerts resolved, retraining rules triggered; SCE → policies
deployed, violations resolved, audit exports, scans triggered; DE → pipeline runs,
datasets published, DQ alerts resolved, feature refreshes.

**Interactions:** toggle Admin/Individual (Admin gated by RBAC); time range;
per-team drill-down (admin); export.

**API calls**
- `GET /api/analytics/me?persona=<id>&range=` → `{ ...myActivity }`
- `GET /api/analytics/org?range=` (admin) → `{ by_persona, adoption, top_terms, by_team, funnel, contributors }`
- `POST /api/analytics/targets` (admin), `GET /api/analytics/export?scope=&range=`

---

## 4.3 Role-Based Management — screen `Admin` (`/admin/*`) — **SCE / admin only**

**Purpose:** Control what each persona can see and do; governed at persona level,
refinable per team/individual. Non-SCE personas: **no access** (or read-only view
of their own permissions).

**Default permissions (per matrix):** each persona is full self-service for its
capabilities; the "Cannot without elevation" set from the scope applies (e.g. DS
cannot approve own model→prod; APE cannot modify OPA or approve own prod deploys;
MLE cannot approve promotion or touch non-ML infra; AI cannot modify OPA or see
other teams' cost; AGE cannot grant new write-scoped tools org-wide or raise
autonomy caps beyond policy; DE cannot approve cross-team dataset access or modify
PII datasets without security review; SCE cannot approve prod deploys or modify app
configs).

**Admin sub-screens/fields:**
- **Users** — list with persona assignment + team membership.
- **Role editor** — view/modify permissions per role.
- **Elevation requests** — approve temporary permission upgrades (requester,
  scope, duration, justification).
- **Access review** — scheduled review of all role assignments.
- **Audit trail** — who changed which permission, when.
- **Team management** — create teams, assign members, set team data/resource scope.

**Interactions:** edit a role's permission matrix; approve/deny elevation (sets
expiry); run/attest an access review; filter the permission audit trail; CRUD teams.

**API calls**
- `GET /api/admin/users`, `GET /api/admin/roles`, `PUT /api/admin/roles/:role`
- `GET /api/admin/elevations`, `POST /api/admin/elevations/:id` `{ decision, expires_at }`
- `GET /api/admin/access-review`, `POST /api/admin/access-review/:id/attest`
- `GET /api/admin/permission-audit?user=&range=`
- `POST /api/admin/teams`, `PUT /api/admin/teams/:id` `{ members, scope }`

---

## Implementation mapping (target)
- These 13 capability screens would live as **shared, persona-aware** routes
  (e.g. `src/idp/capabilities/<capability>/`), replacing the current per-persona
  screen folders over time; the persona-specific screens already built become the
  reference for each persona's slice of a capability screen.
- The nav becomes capability-oriented (Catalog, Templates, Scorecards, Health,
  Docs, Forum, Actions, Integrations, Pipelines, Infra, Dashboard, Analytics, plus
  Admin for SCE), with items filtered by the RBAC matrix.
- Reuse existing mock data: each persona's `src/idp/personas/<id>/api.ts` becomes
  the persona branch behind the `?persona=` param of the capability endpoints.
