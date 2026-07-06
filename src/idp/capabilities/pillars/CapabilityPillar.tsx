import { Link } from "react-router-dom";
import {
  Library, LayoutTemplate, ClipboardCheck, HeartPulse, BookText, MessagesSquare,
  Cable, Zap, Plug, Workflow, Gauge, BarChart3, UserCog, User, Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { usePersona } from "../../state/persona";

/**
 * Capability pillar page (Connection 10). A light index for one of the four IDP
 * pillars: lists the capabilities within it and links into the active persona's
 * version of each screen. Absolute paths (starting "/") link as-is; relative
 * paths are scoped to the active persona (e.g. "catalog" → /ai-engineer/catalog).
 */

interface Cap {
  label: string;
  desc: string;
  icon: LucideIcon;
  /** relative to the active persona, or absolute if it starts with "/" */
  path: string;
}

interface Pillar {
  title: string;
  blurb: string;
  caps: Cap[];
}

const PILLARS: Record<string, Pillar> = {
  "software-assets": {
    title: "Software Assets",
    blurb: "Discover and govern the software running on the platform.",
    caps: [
      { label: "Software Catalog", desc: "Every service, model, pipeline and component.", icon: Library, path: "catalog" },
      { label: "Curated Templates", desc: "Golden-path scaffolds to start new work.", icon: LayoutTemplate, path: "templates" },
      { label: "Assessment Scorecards", desc: "Production-readiness and quality checks.", icon: ClipboardCheck, path: "scorecards" },
      { label: "Service Health", desc: "Live health and SLOs across your assets.", icon: HeartPulse, path: "health" },
    ],
  },
  "knowledge-assets": {
    title: "Knowledge Assets",
    blurb: "Docs and discussion that help engineers move fast.",
    caps: [
      { label: "Documentation", desc: "Guides, runbooks, and platform references.", icon: BookText, path: "docs" },
      { label: "Forum", desc: "Ask questions and share solutions across teams.", icon: MessagesSquare, path: "forum" },
    ],
  },
  "environment-assets": {
    title: "Environment Assets",
    blurb: "Self-service the infrastructure and integrations you need.",
    caps: [
      { label: "Connectors", desc: "Wire up external systems and data sources.", icon: Cable, path: "connectors" },
      { label: "Self-Service Actions", desc: "Approved one-click platform operations.", icon: Zap, path: "actions" },
      { label: "Integrations", desc: "Connect the tools in your delivery chain.", icon: Plug, path: "integrations" },
      { label: "Orchestration", desc: "Compose multi-step platform workflows.", icon: Workflow, path: "orchestration" },
      { label: "Infrastructure KPIs", desc: "Compute, cost, and capacity signals.", icon: Gauge, path: "infra" },
    ],
  },
  "portal-management": {
    title: "Portal Management",
    blurb: "Administer the portal, usage, and access.",
    caps: [
      { label: "Usage Analytics", desc: "Adoption and usage across the platform.", icon: BarChart3, path: "analytics" },
      { label: "Role Management", desc: "Manage roles and access (security).", icon: UserCog, path: "admin" },
      { label: "Profile", desc: "Your account and preferences.", icon: User, path: "profile" },
      { label: "Settings", desc: "Personalize the portal experience.", icon: SettingsIcon, path: "settings" },
    ],
  },
};

const CapabilityPillar = ({ id }: { id: string }) => {
  const { persona } = usePersona();
  const pillar = PILLARS[id];

  if (!pillar) {
    return <PageHeader title="Capability" description="Unknown pillar." />;
  }

  const href = (path: string) => (path.startsWith("/") ? path : `/${persona}/${path}`);

  return (
    <div>
      <PageHeader title={pillar.title} description={pillar.blurb} />
      <div className="grid gap-3 sm:grid-cols-2">
        {pillar.caps.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={href(c.path)}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand-border hover:bg-brand-tint/40"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-tint p-2 text-brand-purple">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium group-hover:text-brand-purple">{c.label}</div>
                  <div className="text-sm text-muted-foreground">{c.desc}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default CapabilityPillar;
