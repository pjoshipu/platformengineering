---
name: pe-connect-gcp
description: Shared persona-driven sub-flow for connecting a developer to their GCP cloud resources (projects, BigQuery datasets, GCS buckets, orchestrators). Use during /copilot or /on-board whenever a developer needs cloud/GCP/data-pipeline access set up. Branches the questions it asks off the developer's persona, prefers LIVE discovery of real projects/datasets/buckets via gcloud after auth, and falls back to persona defaults + free text when the gcloud SDK is absent or the user isn't authenticated. Persists resolved (non-secret) choices to a local config file for reuse.
---

# Connect to GCP — persona-driven, live-discovery sub-flow

A reusable step shared by `/copilot` and `/on-board`. Goal: figure out *which* GCP resources a
developer should connect to, ask only the questions their role makes relevant, and prefer real
discovered values over free text. Requires `Bash`, `AskUserQuestion`, `Read`, `Write`.

## Guardrails (always)

- **Non-secret values only** in any file you write — project IDs, dataset names, bucket names,
  regions are identifiers, not credentials. Never write service-account keys, API keys, or
  passwords. Authentication is via `gcloud auth login`, never a stored value.
- **Interactive auth is the user's to run.** `gcloud auth login` / `application-default login`
  open a browser; tell the user to run them with the `!` prefix. Do not attempt to complete an
  auth flow for them.
- **Only read-only verification** is run on the user's behalf (list/describe/smoke-test queries).
  Never run a command that creates, deletes, or modifies cloud resources from this sub-flow.

## Step 1 — Decide which questions are relevant (persona branch)

Load the developer's persona (`pe-personas`) and branch the GCP question set off its
**`## Key systems to access first`** block. Map role → GCP resource types:

| Persona            | GCP resources to ask about |
|--------------------|----------------------------|
| `data-engineer`    | Project(s), BigQuery datasets, GCS data-lake buckets, Composer/Dagster env, Secret Manager, source-system connections |
| `data-scientist`   | Project(s), BigQuery (read) datasets, Vertex AI Workbench/notebooks, GCS training-data buckets, model registry, Secret Manager |
| `ai-engineer`      | Project(s), Secret Manager (provider keys), Vertex AI / GPU quota, vector DB + embeddings store, GCS corpus buckets, model gateway |
| `backend-developer`| Project(s), Cloud Run / GKE, Cloud SQL, Pub/Sub, Secret Manager |
| `platform-developer`| Project(s), GKE, Terraform state bucket, Artifact Registry, IAM |
| `frontend-developer`| Usually none — ask about preview/deploy env instead; skip GCP unless they insist |
| `android-developer`| Usually none — Firebase/Play console instead; skip GCP unless they insist |

If the persona implies no GCP footprint, say so and skip rather than asking irrelevant questions.

## Step 2 — Check tooling + auth state (read-only)

```bash
gcloud version 2>&1 | head -1; gcloud auth list 2>&1 | head -5
```

- **SDK missing** → tell the user to install it (`winget install Google.CloudSDK` on Windows) and
  restart the shell, then go to the **fallback** (Step 4).
- **SDK present but no active account** → tell the user to run `! gcloud auth login` and
  `! gcloud auth application-default login`, then continue with live discovery once they confirm.
- **Authenticated** → proceed to live discovery (Step 3).

## Step 3 — Live discovery → AskUserQuestion (preferred path)

Enumerate what the user *actually* has access to, then turn the results into AskUserQuestion
options (max 4 options per question; group/paginate if there are more). Only ask about resource
types the persona flagged in Step 1.

```bash
gcloud projects list --format="value(projectId)"          # pick project(s) first
bq ls --project_id=<picked_project> 2>&1                   # datasets (data/backend roles)
gsutil ls -p <picked_project> 2>&1                         # buckets (data/platform roles)
gcloud composer environments list --project=<picked_project> --locations=<region> 2>&1
```

Feed each command's output into AskUserQuestion ("Which of these projects?" / "Which datasets?")
so the user selects from real values instead of typing IDs.

## Step 4 — Fallback (no SDK / not authenticated)

Drive the same questions from the persona's "key systems" list plus free text. Use
AskUserQuestion with the resource types from Step 1 as headers and the persona examples as option
labels, and accept free-text via "Other". Make clear these values are unverified until the SDK is
installed and the user authenticates.

## Step 5 — Persist resolved choices

Write the resolved (non-secret) selections to `.gcp-pipeline-config.md` in the project root so the
next session is one step. Ensure that filename is in `.gitignore` (add it if missing). On a later
run, read this file first and only ask about what's missing or stale.

## Step 6 — Run read-only verification (only if authenticated)

```bash
gcloud projects get-iam-policy <project> --flatten="bindings[].members" \
  --filter="bindings.members:<account>" --format="table(bindings.role)"
bq query --use_legacy_sql=false 'SELECT CURRENT_TIMESTAMP() AS ok'
gsutil ls gs://<bucket>/
```

Report what passed/failed and help debug. Stop at verification — never provision or mutate.
