import { Sparkles, Library, LayoutTemplate, ClipboardCheck, HeartPulse, Zap, Plug, Workflow, Gauge } from "lucide-react";
import type { PersonaModule } from "../types";
import AgenticExperience from "../agentic/AgenticExperience";
import Catalog from "../capabilities/catalog/Catalog";
import Templates from "../capabilities/templates/Templates";
import Scorecards from "../capabilities/scorecards/Scorecards";
import Health from "../capabilities/health/Health";
import Actions from "../capabilities/actions/Actions";
import Integrations from "../capabilities/integrations/Integrations";
import Orchestration from "../capabilities/orchestration/Orchestration";
import InfraKPIs from "../capabilities/infra/InfraKPIs";
import aiEngineer from "./ai-engineer";
import agenticEngineer from "./agentic-engineer";
import dataScientist from "./data-scientist";
import appEngineer from "./app-engineer";
import mlops from "./mlops";
import security from "./security";
import dataEngineer from "./data-engineer";

/**
 * Adds shared, persona-aware capability screens as nav items + routes to every
 * persona (available to all, adapting to the active persona):
 *  - "Software Catalog"    — capability 1.1 (capabilities/catalog)
 *  - "Templates"           — capability 1.2 (capabilities/templates)
 *  - "Scorecards"          — capability 1.3 (capabilities/scorecards)
 *  - "Service Health"      — capability 1.4 (capabilities/health)
 *  - "Self-Service"        — capability 3.1 (capabilities/actions)
 *  - "Integrations"        — capability 3.2 (capabilities/integrations)
 *  - "Orchestration"       — capability 3.3 (capabilities/orchestration; path avoids persona 'pipelines')
 *  - "Infrastructure KPIs" — capability 3.4 (capabilities/infra; path avoids persona 'infrastructure')
 *  - "Agentic Experience"  — role-curated agents (agentic/curated.ts)
 * Done centrally here rather than in each persona folder. Additional capability
 * screens from IDP_SCREEN_REQUIREMENTS.md are added the same way.
 */
const withSharedScreens = (m: PersonaModule): PersonaModule => ({
  ...m,
  nav: [
    ...m.nav,
    { label: "Software Catalog", path: "catalog", icon: Library },
    { label: "Templates", path: "templates", icon: LayoutTemplate },
    { label: "Scorecards", path: "scorecards", icon: ClipboardCheck },
    { label: "Service Health", path: "health", icon: HeartPulse },
    { label: "Self-Service", path: "actions", icon: Zap },
    { label: "Integrations", path: "integrations", icon: Plug },
    { label: "Orchestration", path: "orchestration", icon: Workflow },
    { label: "Infrastructure KPIs", path: "infra", icon: Gauge },
    { label: "Agentic Experience", path: "agentic", icon: Sparkles },
  ],
  routes: [
    ...m.routes,
    { path: `${m.id}/catalog`, element: <Catalog /> },
    { path: `${m.id}/templates`, element: <Templates /> },
    { path: `${m.id}/scorecards`, element: <Scorecards /> },
    { path: `${m.id}/health`, element: <Health /> },
    { path: `${m.id}/actions`, element: <Actions /> },
    { path: `${m.id}/integrations`, element: <Integrations /> },
    { path: `${m.id}/orchestration`, element: <Orchestration /> },
    { path: `${m.id}/infra`, element: <InfraKPIs /> },
    { path: `${m.id}/agentic`, element: <AgenticExperience /> },
  ],
});

/**
 * All persona modules. Each is self-contained (nav, routes, mock API). To add a
 * persona: create personas/<id>/ exporting a PersonaModule and add it here.
 */
export const PERSONA_MODULES: PersonaModule[] = [
  aiEngineer,
  agenticEngineer,
  dataScientist,
  appEngineer,
  mlops,
  security,
  dataEngineer,
].map(withSharedScreens);

export const getPersonaModule = (id: string) =>
  PERSONA_MODULES.find((p) => p.id === id);

/** Resolve the persona owning a given /idp pathname. */
export const personaForPath = (pathname: string): PersonaModule | undefined => {
  // pathname looks like /idp/<persona-id>/<screen>
  const segments = pathname.split("/").filter(Boolean);
  const idpIdx = segments.indexOf("idp");
  const personaId = idpIdx >= 0 ? segments[idpIdx + 1] : segments[0];
  return getPersonaModule(personaId);
};
