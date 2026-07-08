import { useParams, Link } from "react-router-dom";
import { Check, X, Star, Building2, Tag, Target, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/idp/components";
import { VIGNETTES, GROUPS, categoryScore, type CompetitorKey } from "./data";

/**
 * A one-page vendor vignette for a shortlisted candidate (Cortex, Port,
 * Harness): general info, core features, strengths / weaknesses, best-fit, and
 * the per-lens scores from the detailed scorecard. Content from `./data`.
 */

const Meta = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  </div>
);

const VendorVignette = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const key = vendorId as CompetitorKey;
  const v = VIGNETTES[key];

  if (!v) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Vendor not found" backTo="/archetypes" backLabel="Back to archetypes" />
        <p className="text-sm text-muted-foreground">
          Vignettes exist for the three shortlisted candidates: {" "}
          <Link to="/vendor/cortex" className="text-brand-purple hover:underline">Cortex</Link>,{" "}
          <Link to="/vendor/port" className="text-brand-purple hover:underline">Port</Link>, and{" "}
          <Link to="/vendor/harness" className="text-brand-purple hover:underline">Harness</Link>.
        </p>
      </div>
    );
  }

  // Per-lens scores from the detailed scorecard (category averages).
  const lensScores = GROUPS.map((g) => ({
    short: g.title,
    title: g.title,
    score: categoryScore(g, key),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={v.name}
        description={v.tagline}
        backTo="/archetypes"
        backLabel="Back to archetypes"
        actions={
          <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand-purple">
            {v.category}
          </span>
        }
      />

      <p className="text-sm text-muted-foreground">{v.overview}</p>

      {/* Meta strip */}
      <div className="mt-4 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-3">
        <Meta icon={Building2} label="Model" value={v.model} />
        <Meta icon={Star} label="Notable" value={v.notable} />
        <Meta icon={Tag} label="Pricing" value={v.pricing} />
      </div>

      {/* Per-lens scores */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {lensScores.map((l) => (
          <div key={l.title} className="rounded-lg border border-border p-3 text-center" title={l.title}>
            <div className="text-lg font-bold text-brand-purple tabular-nums">{l.score}<span className="text-xs text-muted-foreground">/5</span></div>
            <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{l.short}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {/* Core features */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Core features</h2>
          <ul className="mt-2 space-y-1.5">
            {v.coreFeatures.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-foreground/80">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Strengths / weaknesses */}
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Strengths</h2>
          <ul className="mt-2 space-y-1.5">
            {v.strengths.map((s) => (
              <li key={s} className="flex gap-2 text-sm text-foreground/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                {s}
              </li>
            ))}
          </ul>
          <h2 className="mt-4 text-sm font-semibold">Watch-outs</h2>
          <ul className="mt-2 space-y-1.5">
            {v.weaknesses.map((w) => (
              <li key={w} className="flex gap-2 text-sm text-foreground/80">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                {w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Best for */}
      <p className="mt-4 rounded-lg border-l-2 border-brand-purple bg-brand-tint/40 p-3 text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-brand-purple">
          <Target className="h-4 w-4" /> Best for:
        </span>{" "}
        {v.bestFor}
      </p>

      {/* Nav between the three */}
      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4 text-xs">
        <span className="text-muted-foreground">Other candidates:</span>
        {(["cortex", "port", "harness"] as CompetitorKey[])
          .filter((k) => k !== key)
          .map((k) => (
            <Link key={k} to={`/vendor/${k}`} className="text-brand-purple hover:underline">
              {VIGNETTES[k].name}
            </Link>
          ))}
      </div>
    </div>
  );
};

export default VendorVignette;
