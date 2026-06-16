export interface AgentConfig {
  id: string;
  title: string;
  description: string;
  icon: any; // lucide-react icon
  category: 'onboarding' | 'reliability' | 'cost' | 'security' | 'operations';
  endpoint: string;
  requiredInputs: string[];
  outputType: string;
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'developer-onboarding',
    title: 'Developer Onboarding',
    description: 'Persona-specific checklist for new hires (days → hours)',
    icon: 'Users',
    category: 'onboarding',
    endpoint: '/developer-onboarding',
    requiredInputs: ['name', 'team', 'experience_level'],
    outputType: 'checklist'
  },
  {
    id: 'workflow-diagnostic',
    title: 'CI/CD Diagnostic',
    description: 'Root cause analysis for pipeline failures with confidence scores',
    icon: 'Terminal',
    category: 'reliability',
    endpoint: '/workflow-diagnostic',
    requiredInputs: ['errorLog', 'workflowContext'],
    outputType: 'diagnosis'
  },
  {
    id: 'release-readiness',
    title: 'Release Readiness',
    description: 'Quality gate checks → RELEASE/HOLD/ROLLBACK',
    icon: 'GitBranch',
    category: 'reliability',
    endpoint: '/release-readiness',
    requiredInputs: ['qualityMetrics'],
    outputType: 'decision'
  },
  {
    id: 'feature-flag-lifecycle',
    title: 'Feature Flag Lifecycle',
    description: 'Detect stale flags, enforce hygiene, recommend cleanup',
    icon: 'Flag',
    category: 'operations',
    endpoint: '/feature-flag-lifecycle',
    requiredInputs: ['flags_inventory'],
    outputType: 'recommendations'
  },
  {
    id: 'security-posture',
    title: 'Security Posture',
    description: 'CVE triage, secret scanning, IaC drift detection',
    icon: 'Shield',
    category: 'security',
    endpoint: '/security-posture',
    requiredInputs: ['cves', 'secrets_found_count'],
    outputType: 'security_report'
  },
  {
    id: 'cost-optimization',
    title: 'Cost Optimization',
    description: 'Identify underutilized resources, recommend rightsizing',
    icon: 'DollarSign',
    category: 'cost',
    endpoint: '/cost-optimization',
    requiredInputs: ['compute_resources', 'utilization_metrics'],
    outputType: 'cost_analysis'
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    description: 'P1-P4 classification, deployment correlation, ServiceNow pre-fill',
    icon: 'AlertTriangle',
    category: 'operations',
    endpoint: '/incident-response',
    requiredInputs: ['description', 'affected_services'],
    outputType: 'incident_response'
  }
];

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENTS.find(agent => agent.id === id);
}

export function getAgentsByCategory(category: string): AgentConfig[] {
  return AGENTS.filter(agent => agent.category === category);
}
