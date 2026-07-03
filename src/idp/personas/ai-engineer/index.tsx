import { LayoutDashboard, Rocket, FileText, GitCompare, Shield, Activity, DollarSign, Sparkles } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import DeployLlmApp from "./DeployLlmApp";
import PromptRegistry from "./PromptRegistry";
import CanaryRollout from "./CanaryRollout";
import Guardrails from "./Guardrails";
import Observability from "./Observability";
import CostExplorer from "./CostExplorer";

const nav = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Deploy LLM App", path: "deploy", icon: Rocket },
  { label: "Prompt Registry", path: "prompts", icon: FileText },
  { label: "Canary Rollout", path: "canary", icon: GitCompare },
  { label: "Guardrails", path: "guardrails", icon: Shield },
  { label: "LLM Observability", path: "observe", icon: Activity },
  { label: "Cost Explorer", path: "cost", icon: DollarSign },
];

const aiEngineer: PersonaModule = {
  id: "ai-engineer",
  label: "AI Engineer",
  icon: Sparkles,
  blurb: "LLM app deployment, prompts, guardrails, canaries, observability.",
  nav,
  routes: [
    { path: "ai-engineer/dashboard", element: <Dashboard /> },
    { path: "ai-engineer/deploy", element: <DeployLlmApp /> },
    { path: "ai-engineer/prompts", element: <PromptRegistry /> },
    { path: "ai-engineer/prompts/:appId", element: <PromptRegistry /> },
    { path: "ai-engineer/canary", element: <CanaryRollout /> },
    { path: "ai-engineer/canary/:canaryId", element: <CanaryRollout /> },
    { path: "ai-engineer/guardrails", element: <Guardrails /> },
    { path: "ai-engineer/guardrails/:appId", element: <Guardrails /> },
    { path: "ai-engineer/observe", element: <Observability /> },
    { path: "ai-engineer/observe/:appId", element: <Observability /> },
    { path: "ai-engineer/cost", element: <CostExplorer /> },
  ],
};

export default aiEngineer;
