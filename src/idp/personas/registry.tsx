import { Sparkles } from "lucide-react";
import type { PersonaModule } from "../types";
import AgenticExperience from "../agentic/AgenticExperience";
import aiEngineer from "./ai-engineer";
import agenticEngineer from "./agentic-engineer";
import dataScientist from "./data-scientist";
import appEngineer from "./app-engineer";
import mlops from "./mlops";
import security from "./security";
import dataEngineer from "./data-engineer";

/**
 * Adds the per-persona "Agentic Experience" as a nav item + route to every
 * persona module, so it's available for everyone (with a role-appropriate,
 * curated agent set — see agentic/curated.ts). Done centrally here rather than
 * in each persona folder.
 */
const withAgenticExperience = (m: PersonaModule): PersonaModule => ({
  ...m,
  nav: [...m.nav, { label: "Agentic Experience", path: "agentic", icon: Sparkles }],
  routes: [...m.routes, { path: `${m.id}/agentic`, element: <AgenticExperience /> }],
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
].map(withAgenticExperience);

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
