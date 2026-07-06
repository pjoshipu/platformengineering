import { Fragment } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Sparkles, Bot, Boxes, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/idp/components";
import { VENDORS, GROUPS, type Level } from "./data";

/**
 * A feature comparison of this IDP against the three IDP/platform-engineering
 * products it is most often weighed against: Harness, Port, and Cortex. Static,
 * illustrative content for the teaching demo — grouped capability rows with a
 * support level per vendor and a highlighted "This IDP" column. The capability
 * list (and each row's description) lives in `./data` and is shared with the
 * capability-descriptions guide.
 */

const LEVEL_META: Record<Level, { label: string; className: string }> = {
  full: { label: "Yes", className: "text-green-600 dark:text-green-400" },
  partial: { label: "Partial", className: "text-yellow-700 dark:text-yellow-400" },
  addon: { label: "Add-on", className: "text-sky-600 dark:text-sky-400" },
  none: { label: "—", className: "text-muted-foreground/50" },
};

const LevelCell = ({ level, us }: { level: Level; us?: boolean }) => {
  const meta = LEVEL_META[level];
  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-2.5", us && "bg-brand-tint/40")}>
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

const Compare = () => {
  const totalFeatures = GROUPS.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="How this IDP compares"
        description="An at-a-glance feature comparison of this Internal Developer Platform against Harness, Port, and Cortex. This IDP is built AI-native — agents, an agent marketplace, and persona-tailored autonomy sit alongside the classic portal, catalog, and delivery capabilities."
        backTo="/"
        backLabel="Back to home"
        actions={
          <Link
            to="/capabilities/guide"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-brand-border hover:text-brand-purple"
          >
            <BookOpen className="h-4 w-4" />
            What do these capabilities mean?
          </Link>
        }
      />

      {/* Differentiator callouts */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        {[
          { icon: Bot, title: "A marketplace, not one agent", body: "76 prebuilt agents span the whole platform-engineering lifecycle, plus a custom builder — where rivals ship a handful of agents or a single assistant." },
          { icon: Sparkles, title: "Persona-tailored", body: "Every screen and agent run adapts to one of 7 engineering personas, seeded from your live dashboard data — beyond generic role-scoped views." },
          { icon: Boxes, title: "Portal + delivery breadth", body: "Catalog, scorecards, and docs combined with feature flags, cost, security, and incident response in one place." },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="p-4">
              <Icon className="h-5 w-5 text-brand-purple" />
              <div className="mt-2 text-sm font-semibold">{c.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
            </Card>
          );
        })}
      </div>

      <div className="mb-4">
        <Legend />
      </div>

      {/* Comparison table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-2/5 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Capability
                </th>
                {VENDORS.map((v) => (
                  <th
                    key={v.key}
                    className={cn(
                      "px-2 py-3 text-center",
                      v.us && "bg-brand-tint/60"
                    )}
                  >
                    <div className={cn("text-sm font-semibold", v.us && "text-brand-purple")}>{v.label}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">{v.note}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <Fragment key={group.title}>
                    <tr className="bg-muted/40">
                      <td colSpan={VENDORS.length + 1} className="px-4 py-2">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <GroupIcon className="h-3.5 w-3.5" />
                          {group.title}
                        </div>
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.feature} className="border-b border-border/60 last:border-0">
                        <td className="px-4 py-2.5 align-top">
                          <div className="font-medium">{row.feature}</div>
                          {row.hint && <div className="text-xs text-muted-foreground">{row.hint}</div>}
                        </td>
                        {VENDORS.map((v) => (
                          <td key={v.key} className="px-2 align-middle">
                            <LevelCell level={row.levels[v.key]} us={v.us} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Comparing {totalFeatures} capabilities across 4 platforms. Illustrative for the Agentic AI in Platform
        Engineering course; vendor capabilities evolve — verify against current product documentation before
        making procurement decisions.
      </p>
    </div>
  );
};

export default Compare;
