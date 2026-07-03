import {
  Terminal,
  GitBranch,
  Shield,
  Users,
  Flag,
  DollarSign,
  AlertTriangle,
  Bot,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the platform-engineering agent "demos".
 *
 * Previously this array lived inline in AdminView.tsx. It is now shared so the
 * "Agentic Experience" tab and the per-persona curated agent lists all render
 * from one list (see CLAUDE.md on registry drift).
 */
export interface Demo {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** semantic color key — mapped to static Tailwind classes in DEMO_COLOR_CLASSES */
  color: DemoColor;
  problem: string;
  solution: string;
  pythonFile: string;
}

export type DemoColor =
  | "tech-orange"
  | "primary"
  | "tech-cyan"
  | "accent"
  | "destructive"
  | "green";

/**
 * Static class lookup so Tailwind's JIT compiler can see every class string
 * (dynamic `text-${color}` strings get purged from the build).
 */
export const DEMO_COLOR_CLASSES: Record<DemoColor, { text: string; bg: string }> = {
  "tech-orange": { text: "text-tech-orange", bg: "bg-tech-orange/10" },
  primary: { text: "text-primary", bg: "bg-primary/10" },
  "tech-cyan": { text: "text-tech-cyan", bg: "bg-tech-cyan/10" },
  accent: { text: "text-accent-foreground", bg: "bg-accent/50" },
  destructive: { text: "text-destructive", bg: "bg-destructive/10" },
  green: { text: "text-green-600", bg: "bg-green-500/10" },
};

export const DEMOS: Demo[] = [
  {
    id: "developer-onboarding",
    title: "Developer Onboarding",
    description:
      "Persona-specific checklist for new hires that accelerates ramp time from days to hours.",
    icon: Users,
    color: "tech-orange",
    problem: "Manual onboarding checklists are generic and time-consuming",
    solution: "AI generates personalized plans based on experience level and background",
    pythonFile: "section1_onboarding.py",
  },
  {
    id: "workflow-diagnostic",
    title: "CI/CD Diagnostic",
    description:
      "Automatically diagnoses failed CI/CD workflows and provides root cause analysis with suggested fixes.",
    icon: Terminal,
    color: "primary",
    problem: "Cryptic error messages in failed workflows waste developer time",
    solution: "Agent analyzes logs, context, and provides actionable explanations",
    pythonFile: "section2_diagnostic.py",
  },
  {
    id: "release-readiness",
    title: "Release Readiness",
    description:
      "Evaluates quality gates (test coverage, performance, security) to make intelligent release/rollback decisions.",
    icon: GitBranch,
    color: "tech-cyan",
    problem: "Binary pass/fail gates don't capture nuanced deployment risks",
    solution: "Contextual evaluation with confidence scores and full rationale",
    pythonFile: "section3_release_readiness.py",
  },
  {
    id: "feature-flag-lifecycle",
    title: "Feature Flags",
    description: "Detect stale flags, enforce hygiene, recommend cleanup and consolidation.",
    icon: Flag,
    color: "accent",
    problem: "Stale feature flags accumulate technical debt and create confusion",
    solution: "Agent identifies cleanup opportunities and prevents flag sprawl",
    pythonFile: "section4_feature_flags.py",
  },
  {
    id: "security-posture",
    title: "Security Posture",
    description: "CVE triage, secret scanning, IaC drift detection with prioritized remediation.",
    icon: Shield,
    color: "destructive",
    problem: "Manual security reviews are slow and miss context-specific risks",
    solution: "Automated scanning with intelligent prioritization and recommendations",
    pythonFile: "section5_security.py",
  },
  {
    id: "cost-optimization",
    title: "Cost Optimization",
    description: "Identify underutilized resources, recommend rightsizing with savings estimates.",
    icon: DollarSign,
    color: "green",
    problem: "Infrastructure costs drift upward without continuous optimization",
    solution: "Agent finds rightsizing opportunities and quantifies savings",
    pythonFile: "section6_cost.py",
  },
  {
    id: "incident-response",
    title: "Incident Response",
    description: "P1-P4 classification, deployment correlation, ServiceNow ticket pre-fill.",
    icon: AlertTriangle,
    color: "destructive",
    problem: "Manual incident triage slows response time and misses context",
    solution: "Automated classification with deployment correlation and escalation",
    pythonFile: "section7_incident.py",
  },
  {
    id: "developer-portal",
    title: "Developer Portal",
    description:
      "AI-driven self-service endpoint that understands developer needs and provides guidance.",
    icon: Bot,
    color: "tech-orange",
    problem: "Manual documentation hunts slow developer productivity",
    solution: "Conversational AI provides personalized context-aware help",
    pythonFile: "section8_developer_portal.py",
  },
];

export const getDemoById = (id: string): Demo | undefined =>
  DEMOS.find((demo) => demo.id === id);
