/**
 * Mock identity directory — the "who is signed in" source of truth.
 *
 * The platform is identity-driven: a user does NOT pick a persona. Instead we
 * hold a signed-in *employee profile* (as an SSO/HR directory would provide),
 * and the persona is DERIVED from that profile's attributes (see
 * `resolvePersona.ts`). Editing a profile re-derives the persona live.
 *
 * Each employee below is authored so their title / department / team / skills
 * clearly imply one persona — but the persona itself is never stored here; it
 * is always inferred. Switching "person" (not persona) is how a demo moves
 * across all seven workspaces.
 */

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  /** job title — the strongest signal for persona derivation */
  title: string;
  department: string;
  team: string;
  location: string;
  seniority: "Junior" | "Mid" | "Senior" | "Staff" | "Principal";
  /** technologies the person works with */
  skills: string[];
  /** platforms/systems the person operates in */
  systems: string[];
  bio: string;
}

export const EMPLOYEES: EmployeeProfile[] = [
  {
    id: "ava-chen",
    name: "Ava Chen",
    email: "ava.chen@acme.io",
    title: "Senior AI Engineer",
    department: "Applied AI",
    team: "Applied AI",
    location: "San Francisco, CA",
    seniority: "Senior",
    skills: ["Python", "LangChain", "RAG", "vLLM", "Prompt Engineering", "TypeScript"],
    systems: ["model gateway", "vector store", "prompt registry", "LLM observability"],
    bio: "Builds and ships LLM applications and RAG pipelines with faithfulness guardrails.",
  },
  {
    id: "kai-nakamura",
    name: "Kai Nakamura",
    email: "kai.nakamura@acme.io",
    title: "Staff Agentic Engineer",
    department: "Autonomous Systems",
    team: "Autonomous Systems",
    location: "Seattle, WA",
    seniority: "Staff",
    skills: ["Python", "Claude Agent SDK", "LangGraph", "MCP", "Tool Orchestration"],
    systems: ["agent runtime", "tool gateway (MCP)", "run traces", "autonomy policy engine"],
    bio: "Deploys autonomous agents with autonomy budgets and human-in-the-loop checkpoints.",
  },
  {
    id: "maya-patel",
    name: "Dr. Maya Patel",
    email: "maya.patel@acme.io",
    title: "Principal Data Scientist",
    department: "Data Science",
    team: "Data Science",
    location: "Boston, MA",
    seniority: "Principal",
    skills: ["Python", "PyTorch", "scikit-learn", "Statistics", "Experimentation", "BigQuery"],
    systems: ["training platform", "experiment tracking", "model registry", "feature store"],
    bio: "Trains and evaluates models, promoting them from staging to production.",
  },
  {
    id: "sam-rivera",
    name: "Sam Rivera",
    email: "sam.rivera@acme.io",
    title: "Senior Platform Engineer",
    department: "Platform Engineering",
    team: "Platform",
    location: "Austin, TX",
    seniority: "Senior",
    skills: ["Go", "Terraform", "Kubernetes", "ArgoCD", "GitOps"],
    systems: ["GKE", "Terraform", "GitHub Actions", "ArgoCD", "Prometheus"],
    bio: "Owns golden-path service delivery, GitOps, and infrastructure paved roads.",
  },
  {
    id: "diego-santos",
    name: "Diego Santos",
    email: "diego.santos@acme.io",
    title: "Senior MLOps Engineer",
    department: "ML Platform",
    team: "ML Platform",
    location: "Remote",
    seniority: "Senior",
    skills: ["Python", "Kubeflow", "Airflow", "Model Serving", "Drift Monitoring", "Terraform"],
    systems: ["training pipelines", "drift monitors", "model serving", "GPU fleet"],
    bio: "Runs ML pipelines, serving endpoints, and automated retraining on drift.",
  },
  {
    id: "riya-kapoor",
    name: "Riya Kapoor",
    email: "riya.kapoor@acme.io",
    title: "Staff Security & Compliance Engineer",
    department: "Security & Compliance",
    team: "Security & Compliance",
    location: "London, UK",
    seniority: "Staff",
    skills: ["Rego/OPA", "Threat Modeling", "Python", "Terraform", "Compliance"],
    systems: ["policy engine (OPA/Gatekeeper)", "audit log", "SIEM", "secrets vault"],
    bio: "Governs admission policies, audit, and compliance across the platform.",
  },
  {
    id: "noah-kim",
    name: "Noah Kim",
    email: "noah.kim@acme.io",
    title: "Senior Data Engineer",
    department: "Data Platform",
    team: "Data Platform",
    location: "New York, NY",
    seniority: "Senior",
    skills: ["Python", "SQL", "dbt", "Airflow", "Spark"],
    systems: ["BigQuery warehouse", "Airflow", "dbt", "data catalog"],
    bio: "Publishes datasets to the catalog with quality checks, lineage, and PII handling.",
  },
  {
    id: "morgan-lee",
    name: "Morgan Lee",
    email: "morgan.lee@acme.io",
    title: "Platform Administrator",
    department: "Platform Engineering",
    team: "Platform Leadership",
    location: "San Francisco, CA",
    seniority: "Principal",
    skills: ["Governance", "IDP administration", "RBAC", "Reporting"],
    systems: ["all specialist platforms", "identity", "policy", "audit"],
    bio: "Administers the Internal Developer Platform — oversees every workspace and manages engineer profiles.",
  },
];

/** The employee signed in by default when no prior identity is remembered. */
export const DEFAULT_EMPLOYEE_ID = "ava-chen";

export const getEmployee = (id: string): EmployeeProfile =>
  EMPLOYEES.find((e) => e.id === id) ?? EMPLOYEES[0];

export const employeeInitials = (name: string): string =>
  name
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
