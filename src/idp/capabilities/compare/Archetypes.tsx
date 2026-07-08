import { Link } from "react-router-dom";
import { Boxes, Bot, Sparkles, Check, X, GitCompare, FileText, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/idp/components";
import { ARCHETYPES, type CompetitorKey } from "./data";

/**
 * A slide-style page explaining the three IDP archetypes (Cortex, Port,
 * Harness), why each leads its category, and its strengths / weaknesses.
 * Content is shared from `./data` (ARCHETYPES).
 */

const ICONS: Record<CompetitorKey, LucideIcon> = {
  cortex: Boxes,
  port: Bot,
  harness: Sparkles,
};

const Archetypes = () => (
  <div className="mx-auto max-w-5xl">
    <PageHeader
      title="Three IDP archetypes"
      description="The IDP market clusters into three archetypes — a developer portal / catalog, an agentic platform, and a delivery engine. Each has a clear leader. This is the shortlist that anchors the strategy."
      backTo="/compare"
      backLabel="Back to comparison"
      actions={
        <Link
          to="/compare"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-brand-border hover:text-brand-purple"
        >
          <GitCompare className="h-4 w-4" />
          See the full comparison
        </Link>
      }
    />

    {/* So what */}
    <p className="mb-6 rounded-lg border-l-2 border-brand-purple bg-brand-tint/40 p-3 text-sm">
      <span className="font-semibold text-brand-purple">So what: </span>
      Don't shop for a single "best IDP" — decide which archetype fits your gap first. Portal-led (Cortex),
      agentic-led (Port), or delivery-engine-led (Harness). Most mature orgs pair a portal with an execution
      engine rather than betting on one tool to do everything.
    </p>

    <div className="grid gap-4 lg:grid-cols-3">
      {ARCHETYPES.map((a) => {
        const Icon = ICONS[a.key];
        return (
          <Card key={a.key} className="flex flex-col p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{a.category}</div>
            <div className="mt-1 flex items-center gap-2">
              <Icon className="h-5 w-5 text-brand-purple" />
              <h2 className="text-lg font-bold">{a.title}</h2>
            </div>
            <div className="text-sm font-medium text-brand-purple">{a.tagline}</div>

            <p className="mt-3 text-sm text-muted-foreground">{a.whyLeader}</p>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strengths</div>
              <ul className="mt-1.5 space-y-1.5">
                {a.strengths.map((s) => (
                  <li key={s} className="flex gap-2 text-xs text-foreground/80">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Watch-outs</div>
              <ul className="mt-1.5 space-y-1.5">
                {a.weaknesses.map((w) => (
                  <li key={w} className="flex gap-2 text-xs text-foreground/80">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to={`/vendor/${a.key}`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-brand-purple hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              One-page vignette →
            </Link>
          </Card>
        );
      })}
    </div>

    <p className="mt-6 text-xs text-muted-foreground">
      WSO2 (Choreo) and VMware Tanzu are delivery engines in the same class as Harness; the shortlist deep-dives
      only the highest-rated of that group. All 16 platforms are scored side-by-side in the{" "}
      <Link to="/compare" className="text-brand-purple hover:underline">full comparison</Link>.
    </p>
  </div>
);

export default Archetypes;
