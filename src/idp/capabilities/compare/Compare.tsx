import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, BookOpen, Trophy, Compass, Layers, Plug, Globe, Presentation, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/idp/components";
import {
  VENDORS, GROUPS, CATEGORY_INSIGHTS, COMPETITORS, COMPETITOR_LABEL, categoryScore,
  overallScore, PORT_VS_HARNESS, PLATFORM_LENSES, lensScore,
  LANDSCAPE, LANDSCAPE_CATEGORIES, landscapeAvg, SCORING_METHODOLOGY,
  type Level, type CompetitorKey,
} from "./data";

/** A high-contrast "So what" takeaway used at the end of each section. */
const SoWhat = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 flex gap-2 rounded-lg border-l-2 border-brand-purple bg-brand-tint/40 p-3 text-sm">
    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
    <span>
      <span className="font-semibold text-brand-purple">So what: </span>
      {children}
    </span>
  </p>
);

/**
 * A head-to-head comparison of three IDP / platform-engineering products —
 * Harness, Port, and Cortex. Opens with the Data / AI / Agentic platform lenses,
 * then the capability table, a 1–5 scorecard, and the Port-vs-Harness verdict.
 * The capability list (and each row's description) lives in `./data` and is
 * shared with the capability-descriptions guide.
 */

const LEVEL_META: Record<Level, { label: string; className: string }> = {
  full: { label: "Yes", className: "text-green-600 dark:text-green-400" },
  partial: { label: "Partial", className: "text-yellow-700 dark:text-yellow-400" },
  addon: { label: "Add-on", className: "text-sky-600 dark:text-sky-400" },
  none: { label: "—", className: "text-muted-foreground/50" },
};

const LevelCell = ({ level }: { level: Level }) => {
  const meta = LEVEL_META[level];
  return (
    <div className="flex items-center justify-center gap-1.5 py-2.5">
      {level === "full" ? (
        <Check className={cn("h-4 w-4", meta.className)} />
      ) : level === "none" ? (
        <Minus className={cn("h-4 w-4", meta.className)} />
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full bg-current", meta.className)} />
      )}
      {level !== "full" && level !== "none" && (
        <span className={cn("text-xs font-medium", meta.className)}>{meta.label}</span>
      )}
      <span className="sr-only">{meta.label}</span>
    </div>
  );
};

/** A 1–5 maturity meter drawn as five segments. */
const ScoreMeter = ({ score, leader }: { score: number; leader?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "h-1.5 w-5 rounded-full",
            n <= score ? (leader ? "bg-brand-purple" : "bg-foreground/70") : "bg-muted"
          )}
        />
      ))}
    </div>
    <span className={cn("text-xs font-semibold tabular-nums", leader ? "text-brand-purple" : "text-foreground/70")}>
      {score}/5
    </span>
  </div>
);

/** Colour a 1–5 sub-score by band; the row leader is emphasised separately. */
const scoreClass = (n: number) =>
  n >= 4 ? "text-green-600 dark:text-green-400" : n === 3 ? "text-yellow-700 dark:text-yellow-400" : "text-muted-foreground";

const Legend = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
    <span className="inline-flex items-center gap-1.5">
      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> Supported
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-600" /> Partial / limited
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Available as add-on
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Minus className="h-3.5 w-3.5 text-muted-foreground/50" /> Not available
    </span>
  </div>
);

/**
 * Data / AI / Agentic platform lenses. Rendered just below the capability
 * comparison table (the one that groups by category). Data & AI/ML rate
 * integration depth with the real engines; Agentic keeps a native pick.
 */
const LensSection = () => (
  <div className="mt-6">
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-brand-purple" />
      <h3 className="text-sm font-semibold">Specialized platform lenses — Data, AI &amp; Agentic</h3>
    </div>
    <p className="mt-1 text-xs text-muted-foreground">
      For Data and AI/ML, none of the three is a native platform, so the scores rate how well each tool
      <em> integrates</em> with the real engines (Kubeflow, Airflow, MLflow, dbt, …) rather than native capability.
      Agentic rates native capability.
    </p>

    <div className="mt-4 space-y-4">
      {PLATFORM_LENSES.map((lens) => {
        const LensIcon = lens.icon;
        const avg = Object.fromEntries(
          COMPETITORS.map((k) => [k, lensScore(lens, k)])
        ) as Record<CompetitorKey, number>;
        const top = Math.max(...COMPETITORS.map((k) => avg[k]));
        const ranked = [...COMPETITORS].sort((a, b) => avg[b] - avg[a]);
        const scoreHeader = lens.basis === "integration" ? "By integration (1–5)" : "By capability (1–5)";

        return (
          <Card key={lens.id} className="p-4">
            <div className="flex items-center gap-2">
              <LensIcon className="h-4 w-4 text-brand-purple" />
              <h3 className="text-sm font-semibold">{lens.title}</h3>
            </div>

            {/* Vendor panels + integration rationale, ranked best-first */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {ranked.map((k) => {
                const isLeader = avg[k] === top;
                return (
                  <div key={k} className={cn("rounded-lg border p-3", isLeader ? "border-brand-border bg-brand-tint/30" : "border-border")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("flex items-center gap-1.5 text-sm font-medium", isLeader && "text-brand-purple")}>
                        {COMPETITOR_LABEL[k]}
                        {isLeader && <Trophy className="h-3 w-3" />}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ScoreMeter score={avg[k]} leader={isLeader} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{lens.integrations.vendors[k]}</p>
                  </div>
                );
              })}
            </div>

            {/* Sub-capability breakdown */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-1.5 pr-2 text-left font-medium">{scoreHeader}</th>
                    {COMPETITORS.map((k) => (
                      <th key={k} className="px-2 py-1.5 text-center font-medium">{COMPETITOR_LABEL[k]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lens.rows.map((row) => {
                    const rowTop = Math.max(...COMPETITORS.map((k) => row.scores[k]));
                    return (
                      <tr key={row.feature} className="border-b border-border/50 last:border-0">
                        <td className="py-1.5 pr-2 text-[13px]">{row.feature}</td>
                        {COMPETITORS.map((k) => {
                          const s = row.scores[k];
                          const isRowLeader = s === rowTop;
                          return (
                            <td key={k} className="px-2 py-1.5 text-center">
                              <span className={cn("tabular-nums", scoreClass(s), isRowLeader && "font-bold")}>
                                {s}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>

    <SoWhat>
      For Data &amp; AI/ML, none of these is the engine — they're a thin catalog / governance layer over your real
      stack, so <strong>integration quality</strong> (Kubeflow, Airflow, MLflow, dbt) matters more than native
      features. Only <strong>Agentic</strong> has a clear native leader (Port).
    </SoWhat>
  </div>
);

/**
 * The wider IDP landscape — all vendors from the market map scored 1–5 across
 * the same four lenses, ranked by overall. Harness/Port/Cortex (detailed above)
 * are marked with a star.
 */
const LandscapeSection = () => {
  const sorted = [...LANDSCAPE].sort((a, b) => landscapeAvg(b) - landscapeAvg(a));
  const colMax: Record<string, number> = {};
  LANDSCAPE_CATEGORIES.forEach((c) => {
    colMax[c.key] = Math.max(...LANDSCAPE.map((v) => v.scores[c.key]));
  });
  const ovMax = Math.max(...LANDSCAPE.map(landscapeAvg));

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-brand-purple" />
        <h2 className="text-lg font-semibold">The wider IDP landscape</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        The same four lenses, scored 1–5, across all {LANDSCAPE.length} platforms — the 15 from the market map plus
        Backstage (the open-source "build" baseline) — ranked by overall. The three detailed in the head-to-head
        above (Harness, Port, Cortex) are marked <span className="text-brand-purple">★</span>.
      </p>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="w-2/5 px-3 py-2 text-left font-medium">Platform &amp; scoring rationale</th>
                {LANDSCAPE_CATEGORIES.map((c) => (
                  <th key={c.key} className="px-2 py-2 text-center font-medium">{c.short}</th>
                ))}
                <th className="px-2 py-2 text-center font-medium">Overall</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => {
                const avg = landscapeAvg(v);
                return (
                  <tr key={v.name + v.product} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 align-top">
                      <div>
                        <span className={cn("text-[13px] font-medium", v.detailed && "text-brand-purple")}>
                          {v.name}
                          {v.detailed && " ★"}
                        </span>
                        <span className="ml-1 text-[11px] text-muted-foreground">{v.product}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{v.rationale}</div>
                    </td>
                    {LANDSCAPE_CATEGORIES.map((c) => {
                      const s = v.scores[c.key];
                      return (
                        <td key={c.key} className="px-2 py-2 text-center align-top">
                          <span className={cn("tabular-nums", scoreClass(s), s === colMax[c.key] && "font-bold")}>
                            {s}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center align-top">
                      <span className={cn("tabular-nums font-semibold", avg === ovMax ? "text-brand-purple" : "text-foreground/70")}>
                        {avg.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <SoWhat>
        The field clusters into the three archetypes — beyond the leaders, most tools are strong in{" "}
        <strong>one</strong> lens and thin elsewhere. Shortlist by the archetype you need, not by the overall
        average, and treat <strong>Backstage</strong> as the open-source "build" baseline the commercial vendors
        sit on top of.
      </SoWhat>

      {/* Scoring methodology */}
      <div className="mt-4 rounded-lg border border-border p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How we scored</div>
        <ul className="mt-2 space-y-1.5">
          {SCORING_METHODOLOGY.map((m) => (
            <li key={m} className="flex gap-2 text-xs text-muted-foreground">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const Compare = () => {
  const totalFeatures = GROUPS.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Harness vs Port vs Cortex"
        description="A head-to-head comparison of three leading IDP / platform-engineering products across capabilities, a 1–5 maturity scorecard, the Port-vs-Harness platform decision, and Data / AI / Agentic platform lenses."
        backTo="/"
        backLabel="Back to home"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/archetypes"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-brand-border hover:text-brand-purple"
            >
              <Presentation className="h-4 w-4" />
              The 3 archetypes
            </Link>
            <Link
              to="/capabilities/guide"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-brand-border hover:text-brand-purple"
            >
              <BookOpen className="h-4 w-4" />
              What do these capabilities mean?
            </Link>
          </div>
        }
      />

      {/* Category scorecard */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand-purple" />
          <h2 className="text-lg font-semibold">Category scorecard</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          A researched 1–5 maturity rating for Harness, Port, and Cortex (1 = least capable, 5 = best-in-class).
          Each category score is the average of its sub-capability scores — and each vendor leads a different
          category.
        </p>

        <p className="mt-3 rounded-lg border-l-2 border-brand-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Why only these three? </span>
          The detailed comparison profiles one leader per archetype rather than every vendor — a developer
          portal / catalog leader (<strong>Cortex</strong>), an agentic-platform leader (<strong>Port</strong>),
          and an execution / delivery-engine leader (<strong>Harness</strong>). <strong>WSO2 (Choreo)</strong> and{" "}
          <strong>VMware Tanzu</strong> are execution engines in the same class as Harness; since their
          capabilities overlap, we deep-dive only the highest-rated of that group — Harness — and keep WSO2 and
          Tanzu in the full 16-vendor landscape below, where all vendors are scored side-by-side.
        </p>

        <SoWhat>
          There is no single "best" IDP — each of the three leads a <strong>different</strong> category. Choose by
          the gap you're closing: <strong>Cortex</strong> for catalog &amp; standards, <strong>Port</strong> for
          AI-agentic developer experience, <strong>Harness</strong> for an execution engine.
        </SoWhat>

        <div className="mt-4 space-y-4">
          {GROUPS.map((group) => {
            const insight = CATEGORY_INSIGHTS.find((c) => c.category === group.title);
            const avg = Object.fromEntries(
              COMPETITORS.map((k) => [k, categoryScore(group, k)])
            ) as Record<CompetitorKey, number>;
            const top = Math.max(...COMPETITORS.map((k) => avg[k]));
            const ranked = [...COMPETITORS].sort((a, b) => avg[b] - avg[a]);
            const GroupIcon = group.icon;

            return (
              <Card key={group.title} className="p-4">
                <div className="flex items-center gap-2">
                  <GroupIcon className="h-4 w-4 text-brand-purple" />
                  <h3 className="text-sm font-semibold">{group.title}</h3>
                </div>

                {/* Category averages + rationale, ranked best-first */}
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {ranked.map((k) => {
                    const isLeader = avg[k] === top;
                    return (
                      <div key={k} className={cn("rounded-lg border p-3", isLeader ? "border-brand-border bg-brand-tint/30" : "border-border")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("flex items-center gap-1.5 text-sm font-medium", isLeader && "text-brand-purple")}>
                            {COMPETITOR_LABEL[k]}
                            {isLeader && <Trophy className="h-3 w-3" />}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <ScoreMeter score={avg[k]} leader={isLeader} />
                        </div>
                        {insight && <p className="mt-2 text-xs text-muted-foreground">{insight.rationale[k]}</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Sub-capability breakdown */}
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-1.5 pr-2 text-left font-medium">By capability (1–5)</th>
                        {COMPETITORS.map((k) => (
                          <th key={k} className="px-2 py-1.5 text-center font-medium">{COMPETITOR_LABEL[k]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => {
                        const rowTop = Math.max(...COMPETITORS.map((k) => row.scores[k]));
                        return (
                          <tr key={row.feature} className="border-b border-border/50 last:border-0">
                            <td className="py-1.5 pr-2 text-[13px]">{row.feature}</td>
                            {COMPETITORS.map((k) => {
                              const s = row.scores[k];
                              const isRowLeader = s === rowTop;
                              return (
                                <td key={k} className="px-2 py-1.5 text-center">
                                  <span className={cn("tabular-nums", scoreClass(s), isRowLeader && "font-bold")}>
                                    {s}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Data / AI / Agentic lenses, as additional scorecard entries */}
        <LensSection />
      </section>

      {/* The platform decision — Port vs Harness head-to-head */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-brand-purple" />
          <h2 className="text-lg font-semibold">The platform decision: Port vs Harness</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{PORT_VS_HARNESS.lean}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[PORT_VS_HARNESS.port, PORT_VS_HARNESS.harness].map((side) => (
            <Card key={side.key} className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-brand-purple">{COMPETITOR_LABEL[side.key]}</span>
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {overallScore(side.key).toFixed(1)}/5 overall
                </span>
              </div>
              <div className="mt-0.5 text-xs font-medium text-muted-foreground">{side.tagline}</div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Choose if</div>
              <ul className="mt-1.5 space-y-1.5">
                {side.chooseIf.map((point) => (
                  <li key={point} className="flex gap-2 text-xs text-foreground/80">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-purple" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <p className="mt-3 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Where Cortex fits: </span>
          {PORT_VS_HARNESS.cortexNote}
        </p>

        <SoWhat>
          These two aren't substitutes — <strong>Harness executes</strong>, <strong>Port orchestrates and adds
          agents on top</strong>. Most mature orgs run a portal/agentic layer over an execution engine, so the
          real decision is which layer you're missing, not which vendor "wins".
        </SoWhat>

        {/* Reference: equal-weighted overall standing across all three */}
        {(() => {
          const ranked = [...COMPETITORS].sort((a, b) => overallScore(b) - overallScore(a));
          const topKey = ranked[0];
          return (
            <Card className="mt-4 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                For reference — overall standing (equal-weighted across the four categories, out of 5)
              </div>
              <div className="mt-3 space-y-2.5">
                {ranked.map((k, i) => {
                  const val = overallScore(k);
                  const isTop = k === topKey;
                  return (
                    <div key={k} className="flex items-center gap-3">
                      <span className="w-4 text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                      <span className={cn("w-20 text-sm font-medium", isTop && "text-brand-purple")}>
                        {COMPETITOR_LABEL[k]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", isTop ? "bg-brand-purple" : "bg-foreground/60")}
                          style={{ width: `${(val / 5) * 100}%` }}
                        />
                      </div>
                      <span className={cn("w-12 text-right text-sm font-semibold tabular-nums", isTop && "text-brand-purple")}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Equal-weighted and unweighted by design — re-weight toward the categories you care about and the
                order can change. Treat it as a starting point, not a verdict.
              </p>
            </Card>
          );
        })()}
      </section>

      {/* The wider IDP landscape — all vendors from the market map */}
      <LandscapeSection />

      <p className="mt-6 text-xs text-muted-foreground">
        Comparing {totalFeatures} capabilities across Harness, Port, and Cortex, scored 1–5 across {GROUPS.length}{" "}
        categories, every sub-capability, and three platform lenses. Grounded in each vendor's public documentation
        and third-party reviews as of mid-2026 — vendor capabilities evolve, so verify against current product
        documentation before making procurement decisions.
      </p>
    </div>
  );
};

export default Compare;
