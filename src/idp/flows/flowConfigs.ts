/**
 * Flow Viewer configuration.
 *
 * Two layers so the feature scales to every screen as *data*:
 *   - BASE_FLOWS   — one entry per Request_Flows slide (the shared diagram,
 *                    step labels, infra hotspots, step-by-step narrative).
 *   - SCREEN_FLOWS — one small entry per screen: which base flow it uses, which
 *                    steps are active here, and the route it lives on.
 *
 * `getFlowConfig(flowId)` composes a full config from the two. The shell renders
 * the "See the flow" button automatically for any route matched by
 * `flowForPath`, so adding the Flow Viewer to a screen is a pure data change.
 *
 * Orchestrator note: the platform IDP + orchestrator is **Harness** (it acts as
 * both the Internal Developer Platform and the multi-domain orchestrator). The
 * slide/infra JPGs still render the older "Humanitec" label baked into the
 * image — that text can't be re-rendered here without the source deck + slide
 * tooling; all copy the Flow Viewer controls has been updated to Harness.
 */

export interface FlowStepPoint {
  x_pct: number;
  y_pct: number;
}

export interface RequestFlow {
  slide_asset: string;
  slide_title: string;
  flow_label: string;
  source: string;
  total_steps: number;
  active_steps: number[];
  step_labels: Record<number, string>;
  step_points: Record<number, FlowStepPoint>;
}

export interface InfraHotspot {
  id: string;
  label: string;
  x_pct: number;
  y_pct: number;
  tooltip: string;
}

export interface InfraDetail {
  image_asset: string;
  hotspots: InfraHotspot[];
  components_involved: string[];
}

export type StepStatus = "done" | "active" | "upcoming";

export interface StepByStepItem {
  number: number;
  status: StepStatus;
  component: string;
  summary: string;
}

export interface StepByStep {
  title: string;
  subtitle: string;
  estimated_time: string;
  tools_used: string[];
  docs_link: string;
  steps: StepByStepItem[];
}

export interface FlowConfig {
  flow_id: string;
  screen_name: string;
  persona: string;
  request_flow: RequestFlow;
  /** omitted for "internal only" screens (no infra tab) */
  infra_detail?: InfraDetail;
  step_by_step: StepByStep;
}

/** Resolve a public asset path through the Vite base URL (/platform/ or /). */
export const flowAsset = (p: string) =>
  `${import.meta.env.BASE_URL}${p.replace(/^\//, "")}`;

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

const STEP_POINTS_STD: Record<number, FlowStepPoint> = {
  1: { x_pct: 40, y_pct: 10 }, 2: { x_pct: 41, y_pct: 27 }, 3: { x_pct: 63, y_pct: 21 },
  4: { x_pct: 34, y_pct: 38 }, 5: { x_pct: 50, y_pct: 45 }, 6: { x_pct: 47, y_pct: 57 },
  7: { x_pct: 40, y_pct: 79 }, 8: { x_pct: 15, y_pct: 53 }, 9: { x_pct: 10, y_pct: 82 },
};

const STEP_POINTS_API: Record<number, FlowStepPoint> = {
  1: { x_pct: 40, y_pct: 10 }, 2: { x_pct: 41, y_pct: 27 }, 3: { x_pct: 63, y_pct: 21 },
  4: { x_pct: 50, y_pct: 35 }, 5: { x_pct: 52, y_pct: 44 }, 6: { x_pct: 47, y_pct: 55 },
  7: { x_pct: 40, y_pct: 79 }, 8: { x_pct: 14, y_pct: 50 }, 9: { x_pct: 10, y_pct: 82 },
};

// Infra hotspots describe infra-flow-5.jpg (the deep infrastructure view used as
// the Infra Detail tab for every flow). Harness sits at the Humanitec position.
const INFRA_HOTSPOTS: InfraHotspot[] = [
  { id: "harness", label: "Harness (IDP + Orchestrator)", x_pct: 38, y_pct: 22, tooltip: "Harness is the Internal Developer Platform and the multi-domain orchestrator. It parses your Score spec and decides which orchestrators to invoke." },
  { id: "api-gateway-orchestrator", label: "API Gateway Orchestrator", x_pct: 50, y_pct: 35, tooltip: "Apigee / Kong / Traefik — routes traffic to your endpoint and applies the rate limits and auth rules you configured." },
  { id: "security-auth-layer", label: "Security & Auth Layer", x_pct: 30, y_pct: 55, tooltip: "IAM, mTLS, JWT validator enforcing the auth type you selected on every call." },
  { id: "argo-cd", label: "Argo CD", x_pct: 55, y_pct: 48, tooltip: "Syncs the generated manifests to the cluster (GitOps delivery)." },
  { id: "crossplane", label: "Crossplane", x_pct: 55, y_pct: 60, tooltip: "Provisions the cloud resources your workload declared as dependencies." },
  { id: "api-endpoints", label: "API Endpoints", x_pct: 22, y_pct: 62, tooltip: "The gateway instances and load balancers your workload is reachable through." },
  { id: "opa-policies", label: "OPA Policies", x_pct: 74, y_pct: 50, tooltip: "Validates the deploy against org policies — resource limits, allowed registries, guardrails." },
  { id: "infrastructure", label: "Infrastructure & Cloud Resources", x_pct: 55, y_pct: 82, tooltip: "Kubernetes, Database, Storage, Network — provisioned by Crossplane in step 7." },
];

const INFRA_COMPONENTS = [
  "Harness (IDP + Orchestrator)",
  "API Gateway (Kong)",
  "IAM / mTLS layer",
  "Argo CD",
  "Crossplane",
  "OPA Gatekeeper",
  "GKE / Kubernetes",
];

const infra = (): InfraDetail => ({
  image_asset: "assets/flows/infra-flow-5.jpg",
  hotspots: INFRA_HOTSPOTS,
  components_involved: INFRA_COMPONENTS,
});

const TOOLS = ["Harness", "Argo CD", "Crossplane", "Kong", "OPA", "GKE"];

interface BaseFlow {
  slide_asset: string;
  slide_title: string;
  flow_label: string;
  source: string;
  total_steps: number;
  subtitle: string;
  estimated_time: string;
  tools_used: string[];
  step_labels: Record<number, string>;
  step_points: Record<number, FlowStepPoint>;
  step_details: { number: number; component: string; summary: string }[];
}

// ---------------------------------------------------------------------------
// Base flows — one per slide
// ---------------------------------------------------------------------------

const AI_AGENT: BaseFlow = {
  slide_asset: "assets/flows/slide-1-ai-agent-build.jpg",
  slide_title: "How an AI Team Requests an AI Agent Build",
  flow_label: "AI Agent Build Flow",
  source: "Request_Flows.pptx — Slide 1",
  total_steps: 9,
  subtitle: "Your Score spec triggers a 9-step automated flow",
  estimated_time: "3–8 minutes",
  tools_used: TOOLS,
  step_labels: {
    1: "Platform Engineer configured policies — done",
    2: "Harness (IDP) parses your Score spec",
    3: "Context-Based Federation routes to orchestrators",
    4: "Data + AI Orchestrators execute",
    5: "AI Orchestrator runs model training/serving config",
    6: "Argo CD synchronizes GitOps",
    7: "Crossplane provisions cloud resources",
    8: "Data Orchestrator executes ETL",
    9: "Agent deployed and monitored",
  },
  step_points: STEP_POINTS_STD,
  step_details: [
    { number: 1, component: "Platform Engineer + OPA/Sentinel", summary: "Org-wide policies already configured. OPA Gatekeeper rules define what your deployment is allowed to do." },
    { number: 2, component: "Harness (IDP + Orchestrator)", summary: "Harness reads your Score spec and identifies which orchestrators to invoke." },
    { number: 3, component: "Context-Based Federation", summary: "Harness federates the request across the relevant orchestrators." },
    { number: 4, component: "AI + Application Orchestrators", summary: "Orchestrators execute prompt engineering, training, and the workload config." },
    { number: 5, component: "AI Orchestrator (KubeFlow/MLflow)", summary: "Runs prompt engineering and model training / serving configuration." },
    { number: 6, component: "Argo CD (GitOps)", summary: "Syncs the generated manifests to the GKE cluster." },
    { number: 7, component: "Crossplane", summary: "Provisions declared cloud resource dependencies (vector store, database)." },
    { number: 8, component: "Data Orchestrator", summary: "Executes ETL; status is collected by Harness." },
    { number: 9, component: "Agent Live", summary: "Deployed, endpoint active, guardrails enforcing, observability collecting." },
  ],
};

const DATASET: BaseFlow = {
  slide_asset: "assets/flows/slide-2-data-scientist.jpg",
  slide_title: "How a Data Scientist Team Requests a Dataset",
  flow_label: "Dataset Request Flow",
  source: "Request_Flows.pptx — Slide 2",
  total_steps: 9,
  subtitle: "Your Data Catalog spec triggers a 9-step automated flow",
  estimated_time: "3–8 minutes",
  tools_used: TOOLS,
  step_labels: {
    1: "Platform Engineer configured policies — done",
    2: "Harness (IDP) parses your Data Catalog spec",
    3: "Context-Based Federation routes to orchestrators",
    4: "Data + AI Orchestrators execute",
    5: "AI Orchestrator prepares feature/model config",
    6: "Argo CD synchronizes GitOps",
    7: "Crossplane provisions cloud resources",
    8: "Data Orchestrator ETL + Lineage & Catalog",
    9: "Dataset available and managed",
  },
  step_points: STEP_POINTS_STD,
  step_details: [
    { number: 1, component: "Platform Engineer + OPA/Sentinel", summary: "Org-wide data policies already configured — access, lineage, and governance rules." },
    { number: 2, component: "Harness (IDP + Orchestrator)", summary: "Harness reads your Score / Data Catalog spec and selects the Data Orchestrator path." },
    { number: 3, component: "Context-Based Federation", summary: "Harness federates the request to the Data Orchestrator." },
    { number: 4, component: "Data Orchestrator (Prefect/Airflow)", summary: "Builds the pipeline that produces your dataset." },
    { number: 5, component: "AI Orchestrator", summary: "Prepares any feature / model configuration the dataset feeds." },
    { number: 6, component: "Argo CD (GitOps)", summary: "Syncs the pipeline and resource manifests to the cluster." },
    { number: 7, component: "Crossplane", summary: "Provisions storage and compute for the dataset." },
    { number: 8, component: "Data Orchestrator + Lineage/Catalog", summary: "Runs ETL and registers lineage + catalog entries." },
    { number: 9, component: "Dataset Live", summary: "Dataset is published, governed, and discoverable in the catalog." },
  ],
};

const APP_AI_AGENT: BaseFlow = {
  ...AI_AGENT,
  slide_asset: "assets/flows/slide-3-app-ai-agent.jpg",
  slide_title: "How an Application Team Requests an AI Agent Build",
  flow_label: "AI / ML Agent Flow",
  source: "Request_Flows.pptx — Slide 3",
};

const API: BaseFlow = {
  slide_asset: "assets/flows/slide-4-api-build.jpg",
  slide_title: "How an Application Team Requests an API Build",
  flow_label: "API Development Flow",
  source: "Request_Flows.pptx — Slide 4",
  total_steps: 9,
  subtitle: "Your Score / OpenAPI spec triggers a 9-step automated flow",
  estimated_time: "3–8 minutes",
  tools_used: TOOLS,
  step_labels: {
    1: "Platform Engineer configured policies — done",
    2: "Harness (IDP) parses your Score / OpenAPI spec",
    3: "Context-Based Federation routes to orchestrators",
    4: "Data + API Gateway Orchestrators execute",
    5: "Orchestrators generate Crossplane / Argo AuthN/AuthZ config",
    6: "Argo CD synchronizes GitOps",
    7: "Crossplane provisions cloud resources",
    8: "Status feedback (build artifacts)",
    9: "API deployed and monitored",
  },
  step_points: STEP_POINTS_API,
  step_details: [
    { number: 1, component: "Platform Engineer + OPA/Sentinel", summary: "Org-wide policies already configured — what your service is allowed to do." },
    { number: 2, component: "Harness (IDP + Orchestrator)", summary: "Harness reads your Score / OpenAPI spec and identifies orchestrators to invoke." },
    { number: 3, component: "Context-Based Federation", summary: "Federates across the Data and API Gateway Orchestrators." },
    { number: 4, component: "API Gateway Orchestrator (Kong)", summary: "Creates the gateway route, applies auth and rate limits for your API." },
    { number: 5, component: "Orchestrators → Crossplane + Argo CD", summary: "Generate Crossplane claims and Argo CD AuthN/AuthZ manifests." },
    { number: 6, component: "Argo CD (GitOps)", summary: "Syncs the generated manifests to the GKE cluster." },
    { number: 7, component: "Crossplane", summary: "Provisions declared cloud resources in your region." },
    { number: 8, component: "Status Feedback", summary: "Build artifacts generated; status returned to the IDP dashboard." },
    { number: 9, component: "API Live", summary: "API deployed, gateway route active, observability collecting." },
  ],
};

const BASE_FLOWS = {
  "ai-agent": AI_AGENT,
  dataset: DATASET,
  "app-ai-agent": APP_AI_AGENT,
  api: API,
} satisfies Record<string, BaseFlow>;

type BaseKey = keyof typeof BASE_FLOWS;

// ---------------------------------------------------------------------------
// Screen flows — one small entry per screen (the flow map). Adding the Flow
// Viewer to a screen is just a new entry here.
// ---------------------------------------------------------------------------

interface ScreenFlow {
  screen_name: string;
  persona: string;
  base: BaseKey;
  /** route prefix this flow attaches to (matched by flowForPath) */
  route: string;
  /** steps highlighted on the diagram; the highest is "you are here" */
  active_steps: number[];
  subtitle?: string;
  /** false → internal-only screen, hide the Infra Detail tab */
  show_infra?: boolean;
}

const SCREEN_FLOWS: Record<string, ScreenFlow> = {
  // AI Engineer — Slide 1
  "ai-engineer-deploy": { screen_name: "Deploy LLM App", persona: "AI Engineer", base: "ai-agent", route: "ai-engineer/deploy", active_steps: [1, 2] },
  "ai-engineer-prompts": { screen_name: "Prompt Registry", persona: "AI Engineer", base: "ai-agent", route: "ai-engineer/prompts", active_steps: [5] },
  "ai-engineer-canary": { screen_name: "Canary Rollout", persona: "AI Engineer", base: "ai-agent", route: "ai-engineer/canary", active_steps: [6] },
  "ai-engineer-guardrails": { screen_name: "Guardrails", persona: "AI Engineer", base: "ai-agent", route: "ai-engineer/guardrails", active_steps: [1] },
  "ai-engineer-observe": { screen_name: "Observability", persona: "AI Engineer", base: "ai-agent", route: "ai-engineer/observe", active_steps: [9] },

  // Data Scientist — Slide 2
  "data-scientist-request": { screen_name: "New Training Request", persona: "Data Scientist", base: "dataset", route: "data-scientist/request", active_steps: [1, 2] },
  "data-scientist-experiments": { screen_name: "Experiments", persona: "Data Scientist", base: "dataset", route: "data-scientist/experiments", active_steps: [5], show_infra: false },
  "data-scientist-datasets": { screen_name: "Dataset Catalog", persona: "Data Scientist", base: "dataset", route: "data-scientist/datasets", active_steps: [8] },
  "data-scientist-models": { screen_name: "Model Registry", persona: "Data Scientist", base: "dataset", route: "data-scientist/models", active_steps: [6] },

  // App / Platform Engineer — Slide 4
  "app-engineer-deploy": { screen_name: "Deploy Service", persona: "Platform Engineer", base: "api", route: "app-engineer/deploy", active_steps: [1, 2] },
  "app-engineer-gitops": { screen_name: "GitOps Status", persona: "Platform Engineer", base: "api", route: "app-engineer/gitops", active_steps: [6] },
  "app-engineer-infrastructure": { screen_name: "Infrastructure", persona: "Platform Engineer", base: "api", route: "app-engineer/infrastructure", active_steps: [7] },

  // MLOps — Slide 2
  "mlops-dashboard": { screen_name: "MLOps Dashboard", persona: "MLOps Engineer", base: "dataset", route: "mlops/dashboard", active_steps: [4] },
  "mlops-drift": { screen_name: "Drift Monitor", persona: "MLOps Engineer", base: "dataset", route: "mlops/drift", active_steps: [5], show_infra: false },
  "mlops-retraining-rules": { screen_name: "Retraining Rules", persona: "MLOps Engineer", base: "dataset", route: "mlops/retraining-rules", active_steps: [3] },

  // Security — Slide 1
  "security-dashboard": { screen_name: "Security Dashboard", persona: "Security Engineer", base: "ai-agent", route: "security/dashboard", active_steps: [1] },
  "security-policies": { screen_name: "Policy Manager", persona: "Security Engineer", base: "ai-agent", route: "security/policies", active_steps: [1] },
  "security-audit": { screen_name: "Audit Log", persona: "Security Engineer", base: "ai-agent", route: "security/audit", active_steps: [1], show_infra: false },

  // Data Engineer — Slide 2
  "data-engineer-pipelines": { screen_name: "Pipeline Builder", persona: "Data Engineer", base: "dataset", route: "data-engineer/pipelines", active_steps: [3] },
  "data-engineer-publish": { screen_name: "Dataset Publisher", persona: "Data Engineer", base: "dataset", route: "data-engineer/publish", active_steps: [8] },
  "data-engineer-features": { screen_name: "Feature Store", persona: "Data Engineer", base: "dataset", route: "data-engineer/features", active_steps: [3] },
  "data-engineer-lineage": { screen_name: "Lineage Explorer", persona: "Data Engineer", base: "dataset", route: "data-engineer/lineage", active_steps: [8], show_infra: false },

  // Agent Marketplace — Slide 3
  "agents-marketplace": { screen_name: "Agent Marketplace", persona: "Agentic Engineer", base: "app-ai-agent", route: "agents/marketplace", active_steps: [9], show_infra: false },
  "agents-build": { screen_name: "Agent Builder", persona: "Agentic Engineer", base: "app-ai-agent", route: "agents/build", active_steps: [4, 5] },
  "agents-detail": { screen_name: "Agent Detail", persona: "Agentic Engineer", base: "ai-agent", route: "agents", active_steps: [5] },

  // Legacy aliases (kept so existing links/props keep resolving)
  "ai-agent-build": { screen_name: "Deploy LLM App", persona: "AI Engineer", base: "ai-agent", route: "__alias_ai_agent_build", active_steps: [1, 2] },
  "api-build": { screen_name: "Deploy Service", persona: "Platform Engineer", base: "api", route: "__alias_api_build", active_steps: [1, 2] },
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export function getFlowConfig(flowId: string): FlowConfig | undefined {
  const sf = SCREEN_FLOWS[flowId];
  if (!sf) return undefined;
  const base = BASE_FLOWS[sf.base];
  const current = Math.max(...sf.active_steps);

  const request_flow: RequestFlow = {
    slide_asset: base.slide_asset,
    slide_title: base.slide_title,
    flow_label: base.flow_label,
    source: base.source,
    total_steps: base.total_steps,
    active_steps: sf.active_steps,
    step_labels: base.step_labels,
    step_points: base.step_points,
  };

  const step_by_step: StepByStep = {
    title: "What happens when you click Submit",
    subtitle: sf.subtitle ?? base.subtitle,
    estimated_time: base.estimated_time,
    tools_used: base.tools_used,
    docs_link: `/docs/${flowId}`,
    steps: base.step_details.map((s) => ({
      ...s,
      status: (s.number < current ? "done" : s.number === current ? "active" : "upcoming") as StepStatus,
    })),
  };

  return {
    flow_id: flowId,
    screen_name: sf.screen_name,
    persona: sf.persona,
    request_flow,
    infra_detail: sf.show_infra === false ? undefined : infra(),
    step_by_step,
  };
}

/** Longest-prefix match of a pathname to a screen flow id (used by the shell). */
export function flowForPath(pathname: string): string | undefined {
  const p = pathname.replace(/^\//, "");
  let best: string | undefined;
  let bestLen = -1;
  for (const [id, sf] of Object.entries(SCREEN_FLOWS)) {
    const r = sf.route;
    if ((p === r || p.startsWith(`${r}/`)) && r.length > bestLen) {
      best = id;
      bestLen = r.length;
    }
  }
  return best;
}
