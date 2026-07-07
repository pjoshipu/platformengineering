import { Bot, Boxes, Sparkles, Database, BrainCircuit, type LucideIcon } from "lucide-react";

/**
 * Shared capability model for the vendor comparison (`Compare.tsx`) and the
 * capability-descriptions guide (`CapabilityGuide.tsx`). Keeping the list in
 * one place means the table and the guide never drift apart. A head-to-head of
 * three real IDP / platform-engineering products — Harness, Port, and Cortex.
 * Support levels and scores are a researched judgement grounded in each
 * vendor's public docs, product pages, and third-party reviews as of mid-2026.
 */

export type VendorKey = "harness" | "port" | "cortex";

export interface Vendor {
  key: VendorKey;
  label: string;
  note: string;
}

export const VENDORS: Vendor[] = [
  { key: "harness", label: "Harness", note: "harness.io" },
  { key: "port", label: "Port", note: "port.io" },
  { key: "cortex", label: "Cortex", note: "cortex.io" },
];

// Support level for a single capability × vendor cell (comparison table).
export type Level = "full" | "partial" | "addon" | "none";

/** All vendors are scored; alias kept for the scoring helpers. */
export type CompetitorKey = VendorKey;
export const COMPETITORS: CompetitorKey[] = ["harness", "port", "cortex"];
export const COMPETITOR_LABEL: Record<CompetitorKey, string> = {
  harness: "Harness",
  port: "Port",
  cortex: "Cortex",
};

export interface Capability {
  feature: string;
  /** short note shown under the feature name in the comparison table */
  hint?: string;
  /** plain-language explanation of what the capability is (guide page) */
  description: string;
  levels: Record<VendorKey, Level>;
  /**
   * Sub-category maturity score, 1 (least capable) – 5 (best-in-class), for
   * each vendor. Researched judgement from each vendor's docs, product pages,
   * and third-party reviews (mid-2026).
   */
  scores: Record<CompetitorKey, number>;
}

export interface Group {
  title: string;
  icon: LucideIcon;
  rows: Capability[];
}

export const GROUPS: Group[] = [
  {
    title: "Developer Portal & Catalog",
    icon: Boxes,
    rows: [
      {
        feature: "Software catalog",
        description:
          "A single, searchable inventory of every service, API, resource, and job — with its owner, dependencies, and metadata. It is the source of truth the rest of the portal builds on.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 4, port: 5, cortex: 5 },
      },
      {
        feature: "Service scorecards & maturity",
        description:
          "Codified standards — security, reliability, ownership, test coverage — scored automatically per service, with tiered maturity levels (e.g. Bronze / Silver / Gold) that drive teams toward best practice.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 3, port: 4, cortex: 5 },
      },
      {
        feature: "Self-service templates / scaffolding",
        description:
          "Golden-path templates that let developers create a new service, provision a resource, or run a workflow in a few clicks — pre-approved and consistent, with no ticket queue.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 4, port: 3, cortex: 5 },
      },
      {
        feature: "Technical docs (TechDocs)",
        description:
          "Docs-as-code: markdown documentation kept next to the code and rendered on each service's page, so guides stay current, versioned, and discoverable.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 4, port: 3, cortex: 4 },
      },
      {
        feature: "Customizable dashboards",
        description:
          "Configurable, widget-based views that surface catalog data, metrics, and insights tailored to a specific team, role, or initiative.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 3, port: 5, cortex: 5 },
      },
      {
        feature: "Persona-aware experience",
        hint: "7 built-in engineering personas; others rely on role-scoped views",
        description:
          "The portal adapts its navigation, screens, and defaults to who you are — AI engineer, data engineer, security engineer, and so on — rather than showing everyone the same one-size-fits-all UI.",
        levels: { harness: "none", port: "partial", cortex: "partial" },
        scores: { harness: 2, port: 3, cortex: 4 },
      },
    ],
  },
  {
    title: "AI & Agentic",
    icon: Bot,
    rows: [
      {
        feature: "AI copilot / assistant",
        description:
          "A conversational assistant grounded in your portal data that answers questions about ownership, dependencies, and standards — and helps you get things done without leaving the portal.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 4, port: 5, cortex: 4 },
      },
      {
        feature: "Curated agent marketplace",
        hint: "76 prebuilt platform agents",
        description:
          "A catalog of prebuilt, task-specific AI agents spanning the whole platform-engineering lifecycle — onboarding, diagnostics, release, cost, security, incidents — ready to deploy without building them from scratch.",
        levels: { harness: "none", port: "partial", cortex: "none" },
        scores: { harness: 1, port: 4, cortex: 1 },
      },
      {
        feature: "Custom agent builder",
        description:
          "A guided builder to compose your own agent — choosing its tools, inputs, guardrails, and model — for workflows unique to your organization.",
        levels: { harness: "none", port: "full", cortex: "none" },
        scores: { harness: 1, port: 5, cortex: 1 },
      },
      {
        feature: "Autonomous, action-taking agents",
        hint: "plan → act → observe with tool use",
        description:
          "Agents that go beyond chat: they plan a goal, call tools, take actions in your systems, and observe the results in a loop — under governance rather than one-shot answers.",
        levels: { harness: "partial", port: "full", cortex: "none" },
        scores: { harness: 3, port: 5, cortex: 2 },
      },
      {
        feature: "Persona-tailored AI context",
        hint: "runs seeded from live dashboard data",
        description:
          "Agent runs are automatically seeded with the current persona's live data and profile, so results are relevant to your role, stack, and systems out of the box — no manual prompt setup.",
        levels: { harness: "none", port: "partial", cortex: "none" },
        scores: { harness: 1, port: 3, cortex: 1 },
      },
      {
        feature: "Human-in-the-loop approvals & autonomy budget",
        description:
          "Controls that keep humans in charge: approval gates before an agent acts, an autonomy budget that caps how far it can go unattended, and an audit log of everything it did.",
        levels: { harness: "partial", port: "full", cortex: "none" },
        scores: { harness: 3, port: 5, cortex: 1 },
      },
    ],
  },
  {
    title: "Platform Engineering & Delivery",
    icon: Sparkles,
    rows: [
      {
        feature: "CI/CD pipeline orchestration",
        hint: "Harness is a native CI/CD engine; portals trigger external pipelines",
        description:
          "Building, testing, and deploying software through automated pipelines with strategies like canary and blue-green. A delivery platform runs the pipelines natively; a portal typically triggers and observes external ones.",
        levels: { harness: "full", port: "partial", cortex: "none" },
        scores: { harness: 5, port: 2, cortex: 1 },
      },
      {
        feature: "Feature flag lifecycle",
        description:
          "Managing feature flags from creation to retirement — gradual rollouts and targeting, plus detecting and cleaning up stale flags to reduce risk and technical debt.",
        levels: { harness: "full", port: "none", cortex: "none" },
        scores: { harness: 5, port: 1, cortex: 1 },
      },
      {
        feature: "Infrastructure / IaC provisioning",
        description:
          "Provisioning and managing infrastructure through code (Terraform, OpenTofu, etc.), exposed as self-service requests that stay governed by policy.",
        levels: { harness: "full", port: "partial", cortex: "partial" },
        scores: { harness: 5, port: 3, cortex: 2 },
      },
      {
        feature: "Incident response",
        description:
          "Classifying, triaging, and coordinating response to incidents — root-cause help, on-call context, and integration with tools like PagerDuty and ServiceNow to shorten time-to-resolution.",
        levels: { harness: "partial", port: "full", cortex: "partial" },
        scores: { harness: 3, port: 4, cortex: 3 },
      },
      {
        feature: "Cost optimization",
        description:
          "Visibility into cloud and tooling spend, with rightsizing, spot, and idle-resource recommendations that turn utilization data into concrete savings.",
        levels: { harness: "full", port: "partial", cortex: "partial" },
        scores: { harness: 5, port: 3, cortex: 3 },
      },
      {
        feature: "Security posture & CVE triage",
        description:
          "Surfacing vulnerabilities, exposed secrets, and IaC misconfigurations, then prioritizing and routing them for remediation with a clear, ranked plan.",
        levels: { harness: "full", port: "partial", cortex: "partial" },
        scores: { harness: 5, port: 3, cortex: 3 },
      },
    ],
  },
  {
    title: "Governance & Extensibility",
    icon: Boxes,
    rows: [
      {
        feature: "Integrations / connectors",
        description:
          "Prebuilt connectors that pull data from — and push actions to — your cloud providers, SDLC tools, observability, ticketing, secrets, and AI providers.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 5, port: 5, cortex: 4 },
      },
      {
        feature: "Role-based access control",
        description:
          "Fine-grained permissions governing who can view which data and run which actions across the portal, so self-service stays safe.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 5, port: 4, cortex: 4 },
      },
      {
        feature: "Engineering analytics (DORA / SEI)",
        description:
          "Out-of-the-box delivery and quality metrics — DORA, deployment frequency, change-failure rate, incident trends — to measure and continuously improve engineering performance.",
        levels: { harness: "full", port: "full", cortex: "full" },
        scores: { harness: 4, port: 4, cortex: 5 },
      },
    ],
  },
];

/**
 * Per-category narrative for each competitor. The numeric category score is
 * derived from the capability sub-scores (see `categoryScore`) so the two
 * levels always agree.
 */
export interface CategoryInsight {
  category: string;
  rationale: Record<CompetitorKey, string>;
}

export const CATEGORY_INSIGHTS: CategoryInsight[] = [
  {
    category: "Developer Portal & Catalog",
    rationale: {
      harness:
        "Backstage-based IDP 2.0 with a form-based catalog, entity-level RBAC and bi-directional Git sync — capable, but a newer and still-maturing standalone portal.",
      port:
        "Flexible no-code blueprint catalog and dashboards with fast time-to-value; self-service actions are single-step, so complex workflows push logic to your own backend.",
      cortex:
        "The category benchmark — an opinionated catalog that works on day one, its signature scorecards and maturity tiers, and a full multi-step self-service workflow engine.",
    },
  },
  {
    category: "AI & Agentic",
    rationale: {
      harness:
        "AIDA generates pipelines and diagnoses failures, with agentic security workflows — broad but delivery-centric, with no portal agent marketplace or builder.",
      port:
        "The clear leader after its late-2025 'Agentic Engineering Platform' pivot: ready-made and buildable agents that take actions via MCP, a Context Lake, and human-in-the-loop guardrails.",
      cortex:
        "Cortex AI and the Magellan data engine build and answer questions over the catalog, and MCP exposes it to external agents — assistive rather than autonomous action-taking.",
    },
  },
  {
    category: "Platform Engineering & Delivery",
    rationale: {
      harness:
        "Its heartland — native CI/CD, feature flags (Split/FME), cloud cost (CCM), security testing (STO), IaC management and chaos engineering in one platform.",
      port:
        "A portal, not a delivery engine — it triggers external pipelines and surfaces cost, incident and security data through integrations (plus an incident-manager agent).",
      cortex:
        "Focused on cataloging and intelligence rather than native delivery; workflows and integrations orchestrate other tools instead of running pipelines.",
    },
  },
  {
    category: "Governance & Extensibility",
    rationale: {
      harness:
        "Enterprise-grade entity-level RBAC, OPA policy-as-code, SEI analytics and a deep integration ecosystem spanning the whole platform.",
      port:
        "Broad integrations (Ocean), solid RBAC and out-of-the-box engineering-insights dashboards (DORA, delivery, pipeline reliability).",
      cortex:
        "60+ integrations, role-based access, and standout native Engineering Intelligence (DORA, velocity, incident) as its EngOps backbone.",
    },
  },
];

/**
 * Specialized-platform lenses. The main comparison assumes the artifact is a
 * software service; Data and AI/ML platforms manage datasets, pipelines,
 * models, and features instead. Through these lenses the three vendors are a
 * catalog / governance / self-service layer over the real engines (dbt,
 * Airflow, MLflow, Kubeflow, Vertex, Databricks/Unity, Snowflake, …) rather
 * than the engine itself — so scores concentrate in the 1–3 band, and how each
 * one *integrates* with those engines matters more than raw capability.
 */
export interface LensCapability {
  feature: string;
  scores: Record<CompetitorKey, number>;
}

export interface PlatformLens {
  id: string;
  title: string;
  icon: LucideIcon;
  framing: string;
  /** the real engines these portals sit on top of */
  engines: string;
  /** how each vendor integrates with this lens's engines (Kubeflow, Airflow, …) */
  integrations: { summary: string; vendors: Record<CompetitorKey, string> };
  /**
   * What the row scores measure. "integration" rates how well each vendor
   * integrates with the lens's engines; "native" rates native capability.
   */
  basis: "native" | "integration";
  /** present only for a lens with a clear native winner (basis === "native") */
  recommendation?: { pick: CompetitorKey; body: string };
  rows: LensCapability[];
}

export const PLATFORM_LENSES: PlatformLens[] = [
  {
    id: "data",
    title: "Data platform lens",
    icon: Database,
    framing:
      "Data teams manage datasets, pipelines, and lineage — none of the three runs the data stack, so what matters is how well each integrates with the tools that do. The scores below rate integration depth with each engine, not native capability.",
    engines: "Real engines live elsewhere: dbt, Airflow / Dagster, BigQuery, Snowflake, DataHub / Collibra, Unity Catalog.",
    integrations: {
      summary:
        "All three connect to Airflow, dbt, and warehouses — but mostly as generic / custom connectors, not deep data-native ones.",
      vendors: {
        harness:
          "Backstage plugins (a community Airflow plugin exists) + connectors; native GCP / BigQuery resource import and Snowflake Database DevOps. dbt and lineage need custom plugins.",
        port:
          "The no-code Ocean custom integration maps any REST API (Airflow, dbt, Snowflake, BigQuery) into the catalog; MCP connectors for on-demand queries.",
        cortex:
          "60+ prebuilt integrations plus custom API integrations (CQL); pulls dataset / pipeline metadata but relies on your warehouse and orchestrator.",
      },
    },
    basis: "integration",
    rows: [
      { feature: "Airflow / Dagster", scores: { harness: 4, port: 4, cortex: 3 } },
      { feature: "dbt", scores: { harness: 3, port: 4, cortex: 3 } },
      { feature: "Snowflake", scores: { harness: 4, port: 4, cortex: 4 } },
      { feature: "BigQuery / GCP data", scores: { harness: 4, port: 4, cortex: 3 } },
      { feature: "Lineage & governance (DataHub / Unity)", scores: { harness: 2, port: 3, cortex: 3 } },
    ],
  },
  {
    id: "ai",
    title: "AI / ML platform lens",
    icon: BrainCircuit,
    framing:
      "AI/ML teams manage models, features, and experiments — none of the three is a native ML platform, so what matters is integration. The scores below rate integration depth with each ML engine, not native capability.",
    engines: "Real engines live elsewhere: MLflow, Kubeflow, Vertex AI, SageMaker, Databricks / Unity Catalog, feature stores, vector DBs.",
    integrations: {
      summary:
        "MLflow, Kubeflow, and Vertex connect via integration — mostly custom, since none ships deep first-party ML connectors.",
      vendors: {
        harness:
          "No first-party MLflow / Kubeflow plugin — you build custom Backstage plugins against their APIs. Harness CD can deploy models; its MCP server exposes Harness to agents.",
        port:
          "Ocean custom integration ingests MLflow models, Kubeflow pipelines, and SageMaker via their REST APIs; MCP connectors give on-demand access.",
        cortex:
          "An ml-model catalog entity type plus custom API integrations pull model metadata; the scaffolder can bootstrap ML-model projects.",
      },
    },
    basis: "integration",
    rows: [
      { feature: "MLflow (registry / experiments)", scores: { harness: 2, port: 4, cortex: 3 } },
      { feature: "Kubeflow Pipelines", scores: { harness: 2, port: 4, cortex: 2 } },
      { feature: "Vertex AI", scores: { harness: 3, port: 4, cortex: 3 } },
      { feature: "SageMaker", scores: { harness: 2, port: 4, cortex: 3 } },
      { feature: "Feature store (Feast / Tecton)", scores: { harness: 2, port: 3, cortex: 2 } },
      { feature: "Vector DB (Pinecone / Weaviate)", scores: { harness: 3, port: 4, cortex: 3 } },
    ],
  },
  {
    id: "agentic",
    title: "Agentic AI platform lens",
    icon: Bot,
    framing:
      "Agentic platforms manage autonomous agents — a registry, a runtime that plans → acts → observes, tool/MCP access, and guardrails. This is the one lens where a competitor genuinely leads.",
    engines: "Agent runtimes live elsewhere: LangGraph, CrewAI, AutoGen, the Claude Agent SDK, Vertex Agent Builder — Port is the one embedding agent management natively.",
    integrations: {
      summary:
        "Agent frameworks connect through MCP — all three expose an MCP server, but only Port manages agents natively.",
      vendors: {
        harness:
          "A Harness MCP server exposes the platform to external agents (Claude Code, Gemini CLI); pipeline-native agents cover SRE and AppSec.",
        port:
          "An MCP server plus external MCP connectors (GitHub, Jira, Slack, PagerDuty) let agents built in any framework register and take action under guardrails.",
        cortex:
          "MCP exposes the catalog and scorecards to external agents (ChatGPT, etc.) for read / query — there is no native agent runtime.",
      },
    },
    basis: "native",
    recommendation: {
      pick: "port",
      body: "Port is the clear pick. After its $100M 'Agentic Engineering Platform' pivot it offers an agent registry, a builder, action-taking agents via MCP, and human-in-the-loop guardrails. Harness only brings agentic security workflows, and Cortex only exposes its catalog to external agents via MCP.",
    },
    rows: [
      { feature: "Agent registry / catalog", scores: { harness: 2, port: 4, cortex: 2 } },
      { feature: "Custom agent builder / SDK", scores: { harness: 1, port: 5, cortex: 1 } },
      { feature: "Autonomous plan → act → observe runtime", scores: { harness: 2, port: 4, cortex: 1 } },
      { feature: "Tool / MCP integration for agents", scores: { harness: 2, port: 5, cortex: 3 } },
      { feature: "Human-in-the-loop & autonomy guardrails", scores: { harness: 2, port: 5, cortex: 1 } },
      { feature: "Agent observability / run traces / audit", scores: { harness: 2, port: 4, cortex: 2 } },
    ],
  },
];

/** Lens score for a competitor = average of its lens-capability scores (1 dp). */
export function lensScore(lens: PlatformLens, key: CompetitorKey): number {
  const total = lens.rows.reduce((sum, r) => sum + r.scores[key], 0);
  return Math.round((total / lens.rows.length) * 10) / 10;
}

/** Category score for a competitor = rounded average of its capability scores. */
export function categoryScore(group: Group, key: CompetitorKey): number {
  const total = group.rows.reduce((sum, r) => sum + r.scores[key], 0);
  return Math.round(total / group.rows.length);
}

/**
 * Overall standing = the equal-weighted mean of the four category scores, on a
 * 1–5 scale (one decimal). Deliberately unweighted — the recommendation below
 * stresses that the right weighting depends on the buyer's priorities.
 */
export function overallScore(key: CompetitorKey): number {
  const total = GROUPS.reduce((sum, g) => sum + categoryScore(g, key), 0);
  return Math.round((total / GROUPS.length) * 10) / 10;
}

/**
 * The platform decision comes down to Port vs Harness — they are the two real
 * "platform" contenders. Cortex is a catalog/standards specialist, not a
 * delivery engine or an agentic platform, so it sits outside this head-to-head.
 */
export interface HeadToHeadSide {
  key: CompetitorKey;
  tagline: string;
  chooseIf: string[];
}

export interface PlatformVerdict {
  lean: string;
  port: HeadToHeadSide;
  harness: HeadToHeadSide;
  cortexNote: string;
}

export const PORT_VS_HARNESS: PlatformVerdict = {
  lean:
    "They are complementary, not interchangeable: Harness is the delivery engine, Port is the orchestration + agentic layer that sits on top. If you must standardize on one, lean Port for an AI-agentic developer platform over a best-of-breed stack, and Harness when you want to consolidate the delivery engine itself under one vendor.",
  port: {
    key: "port",
    tagline: "Orchestration + agentic layer (a portal over your stack)",
    chooseIf: [
      "You already run CI/CD (GitHub Actions, GitLab, Jenkins, Argo) and want a flexible layer to unify and govern it.",
      "AI agents across the SDLC are the priority — Port's Context Lake, agent management, and human-in-the-loop guardrails lead the field.",
      "Your infrastructure is non-standard and won't fit an opinionated schema — blueprints model anything.",
      "You want transparent per-seat pricing, a free tier, and time-to-value in days.",
    ],
  },
  harness: {
    key: "harness",
    tagline: "All-in-one delivery engine (with a Backstage portal)",
    chooseIf: [
      "You need the execution engine itself — CI/CD, deployment orchestration, rollback, verification — not just a UI layer.",
      "You want to consolidate CI, CD, feature flags, cost, security testing, and chaos under one vendor.",
      "You're in a regulated or high-stakes environment prioritizing built-in governance at scale.",
      "You want a managed Backstage portal without the maintenance overhead.",
    ],
  },
  cortexNote:
    "Cortex sits outside this head-to-head: it's the catalog-and-standards specialist (strongest system of record, scorecards, and Engineering Intelligence), not a delivery engine or an agentic platform. Pair it with a delivery engine rather than choosing it to run one.",
};

/**
 * The wider IDP landscape — the full set of vendors from the market map, scored
 * 1–5 across the same four lenses as the main scorecard (1 = least capable,
 * 5 = best-in-class). Harness, Port, and Cortex keep the exact category scores
 * from the detailed head-to-head above. Researched judgement (mid-2026) from
 * each vendor's docs, product pages, and third-party reviews; illustrative.
 */
export type LandscapeCatKey = "portal" | "ai" | "platform" | "governance";

export const LANDSCAPE_CATEGORIES: { key: LandscapeCatKey; short: string }[] = [
  { key: "portal", short: "Dev Portal & Catalog" },
  { key: "ai", short: "AI & Agentic" },
  { key: "platform", short: "Platform Eng & Delivery" },
  { key: "governance", short: "Governance & Extensibility" },
];

export interface LandscapeVendor {
  name: string;
  product: string;
  /** one of the three detailed in the head-to-head above */
  detailed?: boolean;
  scores: Record<LandscapeCatKey, number>;
}

export const LANDSCAPE: LandscapeVendor[] = [
  { name: "Atlassian", product: "Compass", scores: { portal: 4, ai: 3, platform: 2, governance: 4 } },
  { name: "Calibo", product: "IDP", scores: { portal: 3, ai: 3, platform: 4, governance: 3 } },
  { name: "Configure8", product: "Configure8", scores: { portal: 5, ai: 2, platform: 3, governance: 4 } },
  { name: "Cortex", product: "Cortex", detailed: true, scores: { portal: 5, ai: 2, platform: 2, governance: 4 } },
  { name: "Harness", product: "SDP", detailed: true, scores: { portal: 3, ai: 2, platform: 5, governance: 5 } },
  { name: "Krateo", product: "PlatformOps", scores: { portal: 3, ai: 2, platform: 4, governance: 3 } },
  { name: "Port", product: "IDP", detailed: true, scores: { portal: 4, ai: 5, platform: 3, governance: 4 } },
  { name: "Mia-Platform", product: "Platform Console", scores: { portal: 4, ai: 2, platform: 2, governance: 4 } },
  { name: "OpenContext", product: "Open Context", scores: { portal: 3, ai: 2, platform: 2, governance: 3 } },
  { name: "OpsLevel", product: "Dev Portal", scores: { portal: 5, ai: 3, platform: 2, governance: 4 } },
  { name: "OpsVerse", product: "OpsVerse One", scores: { portal: 3, ai: 2, platform: 4, governance: 4 } },
  { name: "Red Hat", product: "Developer Hub", scores: { portal: 4, ai: 3, platform: 3, governance: 4 } },
  { name: "Roadie", product: "Roadie (Backstage)", scores: { portal: 4, ai: 3, platform: 2, governance: 4 } },
  { name: "WSO2", product: "Choreo", scores: { portal: 3, ai: 3, platform: 4, governance: 4 } },
  { name: "VMware", product: "Tanzu App Platform", scores: { portal: 4, ai: 2, platform: 4, governance: 4 } },
];

/** Overall = equal-weighted mean of the four lens scores, one decimal. */
export function landscapeAvg(v: LandscapeVendor): number {
  const keys: LandscapeCatKey[] = ["portal", "ai", "platform", "governance"];
  const total = keys.reduce((s, k) => s + v.scores[k], 0);
  return Math.round((total / keys.length) * 10) / 10;
}
