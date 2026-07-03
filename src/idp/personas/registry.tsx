import {
  Sparkles, Library, LayoutTemplate, ClipboardCheck, HeartPulse, Zap, Plug,
  Workflow, Gauge, BookText, MessagesSquare, LayoutGrid, BarChart3, UserCog,
} from "lucide-react";
import type { PersonaModule, IdpNavItem } from "../types";
import type { RouteObject } from "react-router-dom";
import AgenticExperience from "../agentic/AgenticExperience";
import Catalog from "../capabilities/catalog/Catalog";
import Templates from "../capabilities/templates/Templates";
import Scorecards from "../capabilities/scorecards/Scorecards";
import Health from "../capabilities/health/Health";
import Actions from "../capabilities/actions/Actions";
import Integrations from "../capabilities/integrations/Integrations";
import Orchestration from "../capabilities/orchestration/Orchestration";
import InfraKPIs from "../capabilities/infra/InfraKPIs";
import Docs from "../capabilities/docs/Docs";
import Forum from "../capabilities/forum/Forum";
import Board from "../capabilities/board/Board";
import Analytics from "../capabilities/analytics/Analytics";
import RoleManagement from "../capabilities/roles/RoleManagement";
import aiEngineer from "./ai-engineer";
import agenticEngineer from "./agentic-engineer";
import dataScientist from "./data-scientist";
import appEngineer from "./app-engineer";
import mlops from "./mlops";
import security from "./security";
import dataEngineer from "./data-engineer";

/**
 * Shared, persona-aware capability screens (from IDP_SCREEN_REQUIREMENTS.md),
 * added to every persona and grouped into sidebar sections. `element` is the
 * screen; `securityOnly` items (Role-Based Management, cap 4.3) are injected
 * only for the `security` persona. The persona's own screens are grouped under
 * "Workspace". Add a new capability = one entry here.
 */
interface SharedScreen {
  label: string;
  path: string;
  icon: IdpNavItem["icon"];
  group: string;
  element: RouteObject["element"];
  securityOnly?: boolean;
}

const SHARED_SCREENS: SharedScreen[] = [
  // Pillar 1 — Software Assets
  { label: "Software Catalog", path: "catalog", icon: Library, group: "Software Assets", element: <Catalog /> },
  { label: "Templates", path: "templates", icon: LayoutTemplate, group: "Software Assets", element: <Templates /> },
  { label: "Scorecards", path: "scorecards", icon: ClipboardCheck, group: "Software Assets", element: <Scorecards /> },
  { label: "Service Health", path: "health", icon: HeartPulse, group: "Software Assets", element: <Health /> },
  // Pillar 2 — Knowledge
  { label: "Documentation", path: "docs", icon: BookText, group: "Knowledge", element: <Docs /> },
  { label: "Forum", path: "forum", icon: MessagesSquare, group: "Knowledge", element: <Forum /> },
  // Pillar 3 — Environment (paths avoid persona 'pipelines'/'infrastructure' collisions)
  { label: "Self-Service", path: "actions", icon: Zap, group: "Environment", element: <Actions /> },
  { label: "Integrations", path: "integrations", icon: Plug, group: "Environment", element: <Integrations /> },
  { label: "Orchestration", path: "orchestration", icon: Workflow, group: "Environment", element: <Orchestration /> },
  { label: "Infrastructure KPIs", path: "infra", icon: Gauge, group: "Environment", element: <InfraKPIs /> },
  // Pillar 4 — Administration
  { label: "My Dashboard", path: "board", icon: LayoutGrid, group: "Administration", element: <Board /> },
  { label: "Usage Analytics", path: "analytics", icon: BarChart3, group: "Administration", element: <Analytics /> },
  { label: "Role Management", path: "admin", icon: UserCog, group: "Administration", element: <RoleManagement />, securityOnly: true },
  // Agents
  { label: "Agentic Experience", path: "agentic", icon: Sparkles, group: "Agents", element: <AgenticExperience /> },
];

const withSharedScreens = (m: PersonaModule): PersonaModule => {
  const shared = SHARED_SCREENS.filter((s) => !s.securityOnly || m.id === "security");
  return {
    ...m,
    // persona's own screens go under "Workspace"; shared screens carry their group
    nav: [
      ...m.nav.map((n) => ({ ...n, group: n.group ?? "Workspace" })),
      ...shared.map(({ label, path, icon, group }) => ({ label, path, icon, group })),
    ],
    routes: [
      ...m.routes,
      ...shared.map(({ path, element }) => ({ path: `${m.id}/${path}`, element })),
    ],
  };
};

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
