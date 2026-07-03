/**
 * Static identity/stack metadata per IDP persona. This is the part of an agent
 * run's context that is NOT in the persona's api.ts (which has domain data but
 * no notion of who the engineer is or their stack). The `name/experience/team/
 * techStack/role/query` fields match the shape DynamicDemoInputs already uses
 * for a developer profile, so they can be fed straight into the input form.
 */
export interface PersonaProfile {
  name: string;
  /** must be one of DynamicDemoInputs' experience options: beginner|intermediate|advanced|expert */
  experience: string;
  team: string;
  /** comma-separated, matching the DEVELOPER_PROFILES.techStack format */
  techStack: string;
  role: string;
  /** default developer-portal query for this role */
  query: string;
  /** systems this role works in — used in the prompt preamble */
  keySystems: string;
}

export const PERSONA_PROFILES: Record<string, PersonaProfile> = {
  "ai-engineer": {
    name: "Ava Chen",
    experience: "advanced",
    team: "Applied AI",
    techStack: "Python, LangChain, vLLM, TypeScript",
    role: "AI Engineer",
    query: "How do I roll out a new prompt version to my RAG app behind a canary with faithfulness gates?",
    keySystems: "model gateway, vector store, prompt registry, LLM observability",
  },
  "agentic-engineer": {
    name: "Kai Nakamura",
    experience: "advanced",
    team: "Autonomous Systems",
    techStack: "Python, Claude Agent SDK, LangGraph, TypeScript",
    role: "Agentic Engineer",
    query: "How do I deploy an agent with an autonomy budget and human-in-the-loop checkpoints before external writes?",
    keySystems: "agent runtime/registry, tool gateway (MCP), run traces, autonomy policy engine",
  },
  "data-scientist": {
    name: "Dr. Maya Patel",
    experience: "advanced",
    team: "Data Science",
    techStack: "Python, PyTorch, scikit-learn, BigQuery",
    role: "Data Scientist",
    query: "How do I request a GPU training job and promote a model from staging to prod?",
    keySystems: "training platform, experiment tracking, model registry, feature store",
  },
  "app-engineer": {
    name: "Sam Rivera",
    experience: "advanced",
    team: "Platform",
    techStack: "Go, Terraform, Kubernetes, ArgoCD",
    role: "Platform Engineer",
    query: "How do I deploy a new service to staging via the golden path and expose it through the gateway?",
    keySystems: "GKE, Terraform, GitHub Actions, ArgoCD, Prometheus",
  },
  mlops: {
    name: "Diego Santos",
    experience: "advanced",
    team: "ML Platform",
    techStack: "Python, Kubeflow, Airflow, Terraform",
    role: "MLOps Engineer",
    query: "How do I set up automated retraining when feature drift crosses a threshold?",
    keySystems: "training pipelines, drift monitors, model serving, GPU fleet",
  },
  security: {
    name: "Riya Kapoor",
    experience: "advanced",
    team: "Security & Compliance",
    techStack: "Rego/OPA, Python, Terraform",
    role: "Security & Compliance Engineer",
    query: "How do I roll out a new admission policy to prod without breaking existing workloads?",
    keySystems: "policy engine (OPA/Gatekeeper), audit log, SIEM, secrets vault",
  },
  "data-engineer": {
    name: "Noah Kim",
    experience: "advanced",
    team: "Data Platform",
    techStack: "Python, SQL, dbt, Airflow, Spark",
    role: "Data Engineer",
    query: "How do I publish a new dataset to the catalog with quality checks and PII handling?",
    keySystems: "BigQuery warehouse, Airflow, dbt, data catalog",
  },
};

export const getPersonaProfile = (personaId: string): PersonaProfile =>
  PERSONA_PROFILES[personaId] ?? PERSONA_PROFILES["app-engineer"];
