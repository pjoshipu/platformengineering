import { Link } from "react-router-dom";
import { GitCompare, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/idp/components";
import { GROUPS, COMPETITORS, COMPETITOR_LABEL, type Capability } from "./data";

/**
 * A plain-language guide to every capability used in the vendor comparison —
 * what each one is and why it matters — grouped the same way as `Compare.tsx`.
 * The data (and each description) is shared from `./data` so the two pages never
 * drift. Each card shows which vendor scores strongest on that capability.
 */

/** The vendor(s) with the top score for a capability, as a label string. */
const strongest = (row: Capability): string => {
  const top = Math.max(...COMPETITORS.map((k) => row.scores[k]));
  return COMPETITORS.filter((k) => row.scores[k] === top).map((k) => COMPETITOR_LABEL[k]).join(" / ");
};

const CapabilityGuide = () => (
  <div className="mx-auto max-w-4xl">
    <PageHeader
      title="Capability guide"
      description="What each platform capability means, in plain language. These are the same capabilities scored in the Harness vs Port vs Cortex comparison — here they are explained, with the strongest vendor noted for each."
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
              {group.rows.map((row) => (
                <Card key={row.feature} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{row.feature}</h3>
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-brand-purple"
                      title="Strongest vendor on this capability"
                    >
                      <Trophy className="h-3 w-3" />
                      {strongest(row)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{row.description}</p>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>

    <p className="mt-6 text-xs text-muted-foreground">
      The chip marks the strongest vendor for each capability. See the{" "}
      <Link to="/compare" className="text-brand-purple hover:underline">
        vendor comparison
      </Link>{" "}
      for the full 1–5 scores across Harness, Port, and Cortex.
    </p>
  </div>
);

export default CapabilityGuide;
