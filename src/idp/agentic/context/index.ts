import { getPersonaProfile, type PersonaProfile } from "./profiles";
import { buildAiEngineerContext } from "./ai-engineer";
import { buildAgenticEngineerContext } from "./agentic-engineer";
import { buildDataScientistContext } from "./data-scientist";
import { buildAppEngineerContext } from "./app-engineer";
import { buildMlopsContext } from "./mlops";
import { buildSecurityContext } from "./security";
import { buildDataEngineerContext } from "./data-engineer";

/** What each persona builder returns for a given agent. */
export interface PersonaBuilderResult {
  /** field-name → value overrides applied to the DynamicDemoInputs form */
  seed?: Record<string, string>;
  /** live context highlights appended to the prompt preamble */
  highlights?: string;
}

/** Full context handed to DemoRunner for a (persona, agent) run. */
export interface PersonaAgentContext {
  profile: PersonaProfile;
  seed: Record<string, string>;
  /** persona preamble prepended to the agent prompt */
  summary: string;
}

type Builder = (agentId: string, profile: PersonaProfile) => Promise<PersonaBuilderResult>;

const BUILDERS: Record<string, Builder> = {
  "ai-engineer": buildAiEngineerContext,
  "agentic-engineer": buildAgenticEngineerContext,
  "data-scientist": buildDataScientistContext,
  "app-engineer": buildAppEngineerContext,
  mlops: buildMlopsContext,
  security: buildSecurityContext,
  "data-engineer": buildDataEngineerContext,
};

/**
 * Profile-derived seeds shared by every persona for the identity-driven agents.
 * Note: the onboarding experience field only accepts junior|intermediate|senior,
 * so advanced personas map to "senior" there.
 */
function baseSeed(agentId: string, p: PersonaProfile): Record<string, string> {
  if (agentId === "developer-portal") {
    return {
      devName: p.name,
      devExperience: p.experience,
      devTeam: p.team,
      devTechStack: p.techStack,
      devRole: p.role,
      devQuery: p.query,
    };
  }
  if (agentId === "developer-onboarding") {
    return {
      onboardName: p.name,
      onboardTeam: p.team,
      onboardExp: "senior",
      onboardBg: p.techStack,
    };
  }
  return {};
}

function baseSummary(p: PersonaProfile): string {
  return `You are assisting ${p.name}, a ${p.role} on the ${p.team} team. Their stack: ${p.techStack}. Key systems: ${p.keySystems}. Tailor every recommendation to this role, stack, and systems — avoid generic advice.`;
}

/**
 * Builds the live, persona-specific context for an agent run. Combines static
 * identity (profile), profile-derived form seeds, and live domain data mapped
 * by the persona's builder.
 */
export async function getPersonaAgentContext(
  personaId: string,
  agentId: string
): Promise<PersonaAgentContext> {
  const profile = getPersonaProfile(personaId);
  const base = baseSeed(agentId, profile);

  let result: PersonaBuilderResult = {};
  const builder = BUILDERS[personaId];
  if (builder) {
    try {
      result = await builder(agentId, profile);
    } catch {
      result = {};
    }
  }

  const summary = result.highlights
    ? `${baseSummary(profile)}\n\nCurrent signals from their workspace: ${result.highlights}`
    : baseSummary(profile);

  return {
    profile,
    seed: { ...base, ...(result.seed ?? {}) },
    summary,
  };
}

export type { PersonaProfile } from "./profiles";
