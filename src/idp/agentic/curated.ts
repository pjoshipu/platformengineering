/**
 * Which platform-engineering agents (from src/config/demos.ts) are surfaced in
 * each persona's Agentic Experience. Instead of one static list of all 8 agents
 * for everyone, each role sees the agents relevant to it. The App / Platform
 * Engineer keeps the full platform toolkit; others get a curated subset.
 */
export const CURATED_AGENTS: Record<string, { intro: string; agentIds: string[] }> = {
  "app-engineer": {
    intro:
      "The full platform-engineering toolkit — diagnose pipelines, gate releases, respond to incidents, and keep cost and security in check.",
    agentIds: [
      "workflow-diagnostic",
      "release-readiness",
      "incident-response",
      "feature-flag-lifecycle",
      "cost-optimization",
      "security-posture",
      "developer-onboarding",
      "developer-portal",
    ],
  },
  "agentic-engineer": {
    intro: "Agents that help ship and operate autonomous agents — diagnose failed runs, gate releases, respond to incidents, and control autonomy cost and risk.",
    agentIds: [
      "workflow-diagnostic",
      "release-readiness",
      "incident-response",
      "cost-optimization",
      "security-posture",
      "developer-portal",
    ],
  },
  "ai-engineer": {
    intro: "Agents that help ship and operate LLM apps safely and cost-effectively.",
    agentIds: [
      "release-readiness",
      "incident-response",
      "cost-optimization",
      "security-posture",
      "workflow-diagnostic",
      "developer-portal",
    ],
  },
  "data-scientist": {
    intro: "Agents that speed up ramp-up, control training cost, and keep your work compliant.",
    agentIds: [
      "developer-onboarding",
      "cost-optimization",
      "security-posture",
      "developer-portal",
    ],
  },
  mlops: {
    intro: "Agents for pipeline reliability — diagnostics, release gating, incidents, and cost.",
    agentIds: [
      "workflow-diagnostic",
      "release-readiness",
      "incident-response",
      "cost-optimization",
      "feature-flag-lifecycle",
    ],
  },
  security: {
    intro: "Agents focused on security posture, incident response, and cost governance.",
    agentIds: [
      "security-posture",
      "incident-response",
      "cost-optimization",
      "developer-portal",
    ],
  },
  "data-engineer": {
    intro: "Agents that diagnose pipelines, control cost, and keep published data secure.",
    agentIds: [
      "workflow-diagnostic",
      "cost-optimization",
      "security-posture",
      "developer-onboarding",
      "developer-portal",
    ],
  },
};

export const getCuratedForPersona = (personaId: string) =>
  CURATED_AGENTS[personaId] ?? { intro: "", agentIds: [] };
