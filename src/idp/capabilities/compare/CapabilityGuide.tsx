import { Link } from "react-router-dom";
import { Check, Minus, GitCompare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/idp/components";
import { GROUPS, type Level } from "./data";

/**
 * A plain-language guide to every capability used in the vendor comparison —
 * what each one is and why it matters — grouped the same way as `Compare.tsx`.
 * The data (and each description) is shared from `./data` so the two pages never
 * drift. A small "this IDP" chip on each card reflects our own support level.
 */

const US_CHIP: Record<Level, { label: string; className: string; icon?: typeof Check }> = {
  full: { label: "Fully supported", className: "bg-green-500/15 text-green-600 dark:text-green-400", icon: Check },
  partial: { label: "Partial support", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
  addon: { label: "Available as add-on", className: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  none: { label: "Not offered", className: "bg-muted text-muted-foreground", icon: Minus },
};

const CapabilityGuide = () => (
  <div className="mx-auto max-w-4xl">
    <PageHeader
      title="Capability guide"
      description="What each platform capability means, in plain language. These are the same capabilities scored in the vendor comparison — here they are explained, with how fully this IDP delivers each one."
      backTo="/"
      backLabel="Back to home"
      actions={
        <Link
          to="/compare"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:border-brand-border hover:text-brand-purple"
        >
          <GitCompare className="h-4 w-4" />
          See the vendor comparison
        </Link>
      }
    />

    <div className="space-y-8">
      {GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <section key={group.title}>
            <div className="mb-3 flex items-center gap-2">
              <GroupIcon className="h-4 w-4 text-brand-purple" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.rows.map((row) => {
                const chip = US_CHIP[row.levels.idp];
                const ChipIcon = chip.icon;
                return (
                  <Card key={row.feature} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{row.feature}</h3>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
                          chip.className
                        )}
                        title="This IDP's support level"
                      >
                        {ChipIcon && <ChipIcon className="h-3 w-3" />}
                        {chip.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{row.description}</p>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>

    <p className="mt-6 text-xs text-muted-foreground">
      The support chip reflects this IDP only. See the{" "}
      <Link to="/compare" className="text-brand-purple hover:underline">
        vendor comparison
      </Link>{" "}
      for how Harness, Port, and Cortex stack up on each capability.
    </p>
  </div>
);

export default CapabilityGuide;
