import { Sparkles, Library } from "lucide-react";
import type { PersonaModule } from "../types";
import AgenticExperience from "../agentic/AgenticExperience";
import Catalog from "../capabilities/catalog/Catalog";
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
 *  - "Agentic Experience" — role-curated agents (see agentic/curated.ts)
 *  - "Software Catalog"    — capability 1.1 (see capabilities/catalog)
 * Done centrally here rather than in each persona folder. Additional capability
 * screens from IDP_SCREEN_REQUIREMENTS.md are added the same way.
 */
const withSharedScreens = (m: PersonaModule): PersonaModule => ({
  ...m,
  nav: [
    ...m.nav,
    { label: "Software Catalog", path: "catalog", icon: Library },
    { label: "Agentic Experience", path: "agentic", icon: Sparkles },
  ],
  routes: [
    ...m.routes,
    { path: `${m.id}/catalog`, element: <Catalog /> },
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
