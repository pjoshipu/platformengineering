# Platform Console — Claude Code plugin

A Claude Code plugin that mirrors this repo's web **Admin Console** (the *Agentic AI in Platform
Engineering* app) as slash commands. Each of the 8 AI agents becomes a command you can run directly
in Claude Code — no API keys, no servers. Claude Code itself is the model, so the agents run
**natively in your conversation** using the same prompts as the deployed Supabase edge functions.

## Commands

| Command       | Agent (web tab)        | What it does |
|---------------|------------------------|--------------|
| `/orchestrate`| Orchestrator Layer     | State a goal in plain English; routes to the owning platform **or** runs a multi-agent workflow (release / incident / onboarding) in business-rule order, narrating every cross-layer hop. |
| `/platforms`  | Platform catalog       | See what each specialist & foundational platform (Application / Data / AI / Infra) serves and the real system its connector stubs; route a single request to one platform. |
| `/admin`      | Admin Console (router) | Lists all 8 agents and routes you to one. `/admin security` jumps straight in. |
| `/on-board`   | Developer Onboarding   | **Interactive** — asks your role/persona, level, team, learning style, then builds a tailored onboarding plan. |
| `/diagnostic` | CI/CD Diagnostic       | Root-cause analysis for a failed pipeline. |
| `/release`    | Release Readiness      | Quality gates → RELEASE / HOLD / ROLLBACK. |
| `/flags`      | Feature Flag Lifecycle | Detect stale flags + cleanup plan. |
| `/security`   | Security Posture       | CVE triage, secret scan, IaC drift → remediation plan. |
| `/cost`       | Cost Optimization      | Rightsizing recommendations and savings. |
| `/incident`   | Incident Response      | P1-P4 classification + ServiceNow pre-fill. |
| `/copilot`    | Developer Portal       | Conversational self-service help (Developer view). |

Every agent renders a **formatted report by default**; reply `json` to get the raw JSON in the
agent's output schema (where one is defined).

These commands realize a layered **reference architecture** — a single front door (`/admin` UI/UX +
`/orchestrate` Orchestrator Layer) over specialist (Application / Data / AI / Agentic) and
foundational (Infrastructure) platforms, with the bare agent commands as a governed escape hatch. Each platform
has a **connector** that stubs a real system (BigQuery, Vertex AI, …) and returns **dummy data**;
the orchestrator narrates every **cross-layer hop** (AI → Data → Infra) and supports a
**self-service mode** so the AI platform can use paved-road defaults instead of depending on the
infra team. See **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

## Install — for others (over the network)

The marketplace manifest lives at the **repo root** (`.claude-plugin/marketplace.json`), so anyone
can install it straight from GitHub in a Claude Code session:

```
/plugin marketplace add pjoshipu/platformengineering
/plugin install platform-console@platform-eng
```

Then enable the plugin if prompted. Run `/admin` to start. To pin a version, add a git ref:
`/plugin marketplace add pjoshipu/platformengineering#v1.0.0`.

## Install — local development

Working in a clone? Add the repo root as a directory marketplace instead:

```
/plugin marketplace add .
/plugin install platform-console@platform-eng
/reload-plugins
```

> The plugin lives in-repo so its prompt templates stay version-controlled alongside the
> `supabase/functions/*` they mirror.

### Auto-enable for everyone (optional)

To give course participants the commands automatically on clone, register the marketplace and
enable the plugin in the repo's `.claude/settings.json` (committed):

```json
{
  "extraKnownMarketplaces": {
    "platform-eng": {
      "source": { "source": "github", "repo": "pjoshipu/platformengineering" }
    }
  },
  "enabledPlugins": {
    "platform-console@platform-eng": true
  }
}
```

## Structure

```
platformengineering/                       # repo root
├── .claude-plugin/marketplace.json        # marketplace manifest (root → installable via owner/repo)
└── claude-plugin/
    ├── README.md
    ├── ARCHITECTURE.md                    # reference architecture → plugin mapping
    └── platform-console/                  # the plugin (source: ./claude-plugin/platform-console)
        ├── .claude-plugin/plugin.json     # plugin manifest
        ├── commands/                      # the 11 slash commands (thin entry points)
        ├── agents/                        # 5 platform subagents (application/data/ai/agentic/infra)
        └── skills/
            ├── pe-prompts/                # canonical prompt templates (1 per agent)
            ├── pe-personas/               # persona reference files for /on-board
            ├── pe-connect-gcp/            # GCP access sub-flow
            ├── pe-orchestration/          # business rules for /orchestrate (workflows + order)
            └── pe-platforms/              # platform connectors (dummy data) + cross-layer protocol
```

Source mapping: each `skills/pe-prompts/templates/<agent>.md` is the prompt extracted verbatim
from `supabase/functions/<agent>/index.ts`; the `/admin` catalog mirrors `src/config/agents.ts`.
