import { Bot, Boxes, Sparkles, type LucideIcon } from "lucide-react";

/**
 * Shared capability model for the vendor comparison (`Compare.tsx`) and the
 * capability-descriptions guide (`CapabilityGuide.tsx`). Keeping the list in
 * one place means the table and the guide never drift apart. Support levels are
 * illustrative, grounded in each vendor's public docs as of mid-2026.
 */

export type VendorKey = "idp" | "harness" | "port" | "cortex";

export interface Vendor {
  key: VendorKey;
  label: string;
  note: string;
  /** the "This IDP" column — visually highlighted */
  us?: boolean;
}

// The four columns. The first is us and is visually highlighted.
export const VENDORS: Vendor[] = [
  { key: "idp", label: "This IDP", note: "AI-native", us: true },
  { key: "harness", label: "Harness", note: "harness.io" },
  { key: "port", label: "Port", note: "port.io" },
  { key: "cortex", label: "Cortex", note: "cortex.io" },
];

// Support level for a single capability × vendor cell.
export type Level = "full" | "partial" | "addon" | "none";

export interface Capability {
  feature: string;
  /** short note shown under the feature name in the comparison table */
  hint?: string;
  /** plain-language explanation of what the capability is (guide page) */
  description: string;
  levels: Record<VendorKey, Level>;
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
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Service scorecards & maturity",
        description:
          "Codified standards — security, reliability, ownership, test coverage — scored automatically per service, with tiered maturity levels (e.g. Bronze / Silver / Gold) that drive teams toward best practice.",
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Self-service templates / scaffolding",
        description:
          "Golden-path templates that let developers create a new service, provision a resource, or run a workflow in a few clicks — pre-approved and consistent, with no ticket queue.",
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Technical docs (TechDocs)",
        description:
          "Docs-as-code: markdown documentation kept next to the code and rendered on each service's page, so guides stay current, versioned, and discoverable.",
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Customizable dashboards",
        description:
          "Configurable, widget-based views that surface catalog data, metrics, and insights tailored to a specific team, role, or initiative.",
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Persona-aware experience",
        hint: "7 built-in engineering personas; others rely on role-scoped views",
        description:
          "The portal adapts its navigation, screens, and defaults to who you are — AI engineer, data engineer, security engineer, and so on — rather than showing everyone the same one-size-fits-all UI.",
        levels: { idp: "full", harness: "none", port: "partial", cortex: "partial" },
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
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Curated agent marketplace",
        hint: "76 prebuilt platform agents",
        description:
          "A catalog of prebuilt, task-specific AI agents spanning the whole platform-engineering lifecycle — onboarding, diagnostics, release, cost, security, incidents — ready to deploy without building them from scratch.",
        levels: { idp: "full", harness: "none", port: "partial", cortex: "none" },
      },
      {
        feature: "Custom agent builder",
        description:
          "A guided builder to compose your own agent — choosing its tools, inputs, guardrails, and model — for workflows unique to your organization.",
        levels: { idp: "full", harness: "none", port: "full", cortex: "none" },
      },
      {
        feature: "Autonomous, action-taking agents",
        hint: "plan → act → observe with tool use",
        description:
          "Agents that go beyond chat: they plan a goal, call tools, take actions in your systems, and observe the results in a loop — under governance rather than one-shot answers.",
        levels: { idp: "full", harness: "partial", port: "full", cortex: "none" },
      },
      {
        feature: "Persona-tailored AI context",
        hint: "runs seeded from live dashboard data",
        description:
          "Agent runs are automatically seeded with the current persona's live data and profile, so results are relevant to your role, stack, and systems out of the box — no manual prompt setup.",
        levels: { idp: "full", harness: "none", port: "partial", cortex: "none" },
      },
      {
        feature: "Human-in-the-loop approvals & autonomy budget",
        description:
          "Controls that keep humans in charge: approval gates before an agent acts, an autonomy budget that caps how far it can go unattended, and an audit log of everything it did.",
        levels: { idp: "full", harness: "partial", port: "full", cortex: "none" },
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
        levels: { idp: "partial", harness: "full", port: "partial", cortex: "none" },
      },
      {
        feature: "Feature flag lifecycle",
        description:
          "Managing feature flags from creation to retirement — gradual rollouts and targeting, plus detecting and cleaning up stale flags to reduce risk and technical debt.",
        levels: { idp: "full", harness: "full", port: "none", cortex: "none" },
      },
      {
        feature: "Infrastructure / IaC provisioning",
        description:
          "Provisioning and managing infrastructure through code (Terraform, OpenTofu, etc.), exposed as self-service requests that stay governed by policy.",
        levels: { idp: "partial", harness: "full", port: "partial", cortex: "partial" },
      },
      {
        feature: "Incident response",
        description:
          "Classifying, triaging, and coordinating response to incidents — root-cause help, on-call context, and integration with tools like PagerDuty and ServiceNow to shorten time-to-resolution.",
        levels: { idp: "full", harness: "partial", port: "full", cortex: "partial" },
      },
      {
        feature: "Cost optimization",
        description:
          "Visibility into cloud and tooling spend, with rightsizing, spot, and idle-resource recommendations that turn utilization data into concrete savings.",
        levels: { idp: "full", harness: "full", port: "partial", cortex: "partial" },
      },
      {
        feature: "Security posture & CVE triage",
        description:
          "Surfacing vulnerabilities, exposed secrets, and IaC misconfigurations, then prioritizing and routing them for remediation with a clear, ranked plan.",
        levels: { idp: "full", harness: "full", port: "partial", cortex: "partial" },
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
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Role-based access control",
        description:
          "Fine-grained permissions governing who can view which data and run which actions across the portal, so self-service stays safe.",
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
      {
        feature: "Engineering analytics (DORA / SEI)",
        description:
          "Out-of-the-box delivery and quality metrics — DORA, deployment frequency, change-failure rate, incident trends — to measure and continuously improve engineering performance.",
        levels: { idp: "full", harness: "full", port: "full", cortex: "full" },
      },
    ],
  },
];
