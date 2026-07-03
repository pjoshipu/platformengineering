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
 * Shared capability ROUTES injected for every persona (screens from
 * IDP_SCREEN_REQUIREMENTS.md). `securityOnly` items (Role-Based Management,
 * cap 4.3) are injected only for the `security` persona. Nav placement/grouping
 * is built separately in `withSharedScreens`.
 */
interface SharedRoute {
  path: string;
  element: RouteObject["element"];
  securityOnly?: boolean;
}

const SHARED_ROUTES: SharedRoute[] = [
  { path: "catalog", element: <Catalog /> },
  { path: "templates", element: <Templates /> },
  { path: "scorecards", element: <Scorecards /> },
  { path: "health", element: <Health /> },
  { path: "docs", element: <Docs /> },
  { path: "forum", element: <Forum /> },
  { path: "actions", element: <Actions /> },
  { path: "integrations", element: <Integrations /> },
  { path: "orchestration", element: <Orchestration /> },
  { path: "infra", element: <InfraKPIs /> },
  { path: "board", element: <Board /> },
  { path: "analytics", element: <Analytics /> },
  { path: "admin", element: <RoleManagement />, securityOnly: true },
  { path: "agentic", element: <AgenticExperience /> },
];

/**
 * Builds the grouped, persona-aware sidebar + routes. Layout (top→bottom):
 *  - Quick access: persona Dashboard, My Dashboard, Software Catalog, Agentic Experience
 *  - Workspace: the persona's own screens (minus Dashboard, promoted to Quick access)
 *  - Software Assets / Knowledge Assets / Environment Assets / Portal & Admin: the pillars
 * (Catalog also appears under Software Assets — intentional shortcut duplication.)
 */
const withSharedScreens = (m: PersonaModule): PersonaModule => {
  const isSec = m.id === "security";
  const dash = m.nav.find((n) => n.path === "dashboard");
  const own = m.nav
    .filter((n) => n.path !== "dashboard")
    .map((n) => ({ ...n, group: "Workspace" }));

  const quickAccess: IdpNavItem[] = [
    ...(dash ? [{ ...dash, group: "Quick access" }] : []),
    { label: "My Dashboard", path: "board", icon: LayoutGrid, group: "Quick access" },
    { label: "Software Catalog", path: "catalog", icon: Library, group: "Quick access" },
    { label: "Agentic Experience", path: "agentic", icon: Sparkles, group: "Quick access" },
  ];

  const pillars: IdpNavItem[] = [
    { label: "Software Catalog", path: "catalog", icon: Library, group: "Software Assets" },
    { label: "Templates", path: "templates", icon: LayoutTemplate, group: "Software Assets" },
    { label: "Scorecards", path: "scorecards", icon: ClipboardCheck, group: "Software Assets" },
    { label: "Service Health", path: "health", icon: HeartPulse, group: "Software Assets" },
    { label: "Documentation", path: "docs", icon: BookText, group: "Knowledge Assets" },
    { label: "Forum", path: "forum", icon: MessagesSquare, group: "Knowledge Assets" },
    { label: "Self-Service", path: "actions", icon: Zap, group: "Environment Assets" },
    { label: "Integrations", path: "integrations", icon: Plug, group: "Environment Assets" },
    { label: "Orchestration", path: "orchestration", icon: Workflow, group: "Environment Assets" },
    { label: "Infrastructure KPIs", path: "infra", icon: Gauge, group: "Environment Assets" },
    { label: "Usage Analytics", path: "analytics", icon: BarChart3, group: "Portal & Admin" },
    ...(isSec
      ? [{ label: "Role Management", path: "admin", icon: UserCog, group: "Portal & Admin" }]
      : []),
  ];

  return {
    ...m,
    nav: [...quickAccess, ...own, ...pillars],
    routes: [
      ...m.routes,
      ...SHARED_ROUTES.filter((s) => !s.securityOnly || isSec).map((s) => ({
        path: `${m.id}/${s.path}`,
        element: s.element,
      })),
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
