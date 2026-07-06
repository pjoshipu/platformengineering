import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { PERSONA_MODULES } from "./personas/registry";
import Home from "./capabilities/home/Home";
import Marketplace from "./capabilities/agents/Marketplace";
import AgentDetail from "./capabilities/agents/AgentDetail";
import AgentBuilder from "./capabilities/agents/AgentBuilder";
import Templates from "./capabilities/templates/Templates";
import Docs from "./capabilities/docs/Docs";
import PipelineBuilder from "./personas/data-engineer/PipelineBuilder";
import CapabilityPillar from "./capabilities/pillars/CapabilityPillar";
import { ComingSoon } from "./components/ComingSoon";
import NotFound from "@/pages/NotFound";

/**
 * The whole portal as a flat, root-level route table (spec's 38-route registry).
 * The homepage is the index; every persona's screens mount at root (they are
 * already persona-prefixed, e.g. "ai-engineer/dashboard"); shared capabilities
 * (agents, templates, docs, capability pillars) mount at root too. Unbuilt
 * screens render a placeholder — never a 404. One persistent AppShell wraps the
 * lot (see Portal.tsx), so the top bar + sidebar + journey banner survive
 * navigation with no full page reload.
 */
export function buildPortalRoutes(): RouteObject[] {
  const personaRoutes = PERSONA_MODULES.flatMap((m) => m.routes);

  return [
    { index: true, element: <Home /> },

    // All persona screens (dashboards, workspaces, per-persona shared screens).
    ...personaRoutes,

    // Spec path for the pipeline builder ("/new") alongside the existing one.
    { path: "data-engineer/pipelines/new", element: <PipelineBuilder /> },

    // Root-level Agent Marketplace (static routes before the :agentId param).
    { path: "agents/build", element: <AgentBuilder /> },
    { path: "agents/tools", element: <ComingSoon title="Tool Registry" /> },
    { path: "agents/executions", element: <ComingSoon title="Agent Executions" /> },
    { path: "agents/safety", element: <ComingSoon title="Agent Safety" /> },
    { path: "agents/marketplace", element: <Marketplace /> },
    { path: "agents/:agentId", element: <AgentDetail /> },
    { path: "agents", element: <Navigate to="/agents/marketplace" replace /> },

    // Curated templates + documentation (detail routes reuse the list screens).
    { path: "templates/:templateId", element: <Templates /> },
    { path: "docs/:docId", element: <Docs /> },

    // Capability pillars (Connection 10).
    { path: "capabilities/software-assets", element: <CapabilityPillar id="software-assets" /> },
    { path: "capabilities/knowledge-assets", element: <CapabilityPillar id="knowledge-assets" /> },
    { path: "capabilities/environment-assets", element: <CapabilityPillar id="environment-assets" /> },
    { path: "capabilities/portal-management", element: <CapabilityPillar id="portal-management" /> },

    { path: "*", element: <NotFound /> },
  ];
}
