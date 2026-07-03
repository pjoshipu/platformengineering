import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  EmptyState,
  InfoList,
  type Column,
  type MetricTone,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getScorecards,
  getScorecardSummary,
  type Scorecard,
  type Gap,
  type ScorecardSummary,
} from "./api";

/**
 * Capability 1.3 — Assessment Scorecards. ONE persona-aware screen: the active
 * persona (from auth) selects which assets are scored and which dimensions form
 * the gap checklist. Data comes from getScorecards(persona). Security also gets
 * an org score + per-team breakdown at the top from getScorecardSummary().
 */

interface PersonaScorecardConfig {
  /** noun for a scored asset, used in copy */
  assetNoun: string;
  description: string;
}

const CONFIG: Record<string, PersonaScorecardConfig> = {
  "ai-engineer": { assetNoun: "LLM app", description: "Maturity of each LLM app against platform AI standards." },
  "agentic-engineer": { assetNoun: "agent", description: "Safety & maturity of each agent against platform standards." },
  "data-scientist": { assetNoun: "model", description: "Governance & reproducibility of each model against standards." },
  "app-engineer": { assetNoun: "service", description: "Production readiness of each service against paved-road standards." },
  mlops: { assetNoun: "pipeline", description: "Health of each pipeline + model against ML operational standards." },
  security: { assetNoun: "namespace", description: "Org-wide policy posture with a per-team and per-namespace breakdown." },
  "data-engineer": { assetNoun: "dataset", description: "Quality & governance of each dataset + pipeline against standards." },
};

type Band = "all" | "green" | "yellow" | "red";

/** green ≥90, yellow 75–89, red <75 — mirrors the MetricCard tone idea. */
function bandForScore(score: number): Exclude<Band, "all"> {
  if (score >= 90) return "green";
  if (score >= 75) return "yellow";
  return "red";
}

function toneForScore(score: number): MetricTone {
  const b = bandForScore(score);
  return b === "green" ? "good" : b === "yellow" ? "warning" : "poor";
}

const SCORE_TEXT: Record<Exclude<Band, "all">, string> = {
  green: "text-green-600 dark:text-green-400",
  yellow: "text-yellow-600 dark:text-yellow-400",
  red: "text-destructive",
};

function GapRow({ gap }: { gap: Gap }) {
  const pass = gap.status === "pass";
  const Icon = pass ? CheckCircle2 : gap.action.toLowerCase().startsWith("fix") ? AlertCircle : XCircle;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <Icon
          className={
            pass
              ? "w-4 h-4 shrink-0 text-green-600 dark:text-green-400"
              : "w-4 h-4 shrink-0 text-destructive"
          }
        />
        <span className={pass ? "text-sm truncate" : "text-sm font-medium truncate"}>{gap.label}</span>
      </div>
      {!pass && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            toast(gap.action, { description: "Deep-linking to the fixing screen (coming soon)." });
          }}
        >
          Fix
        </Button>
      )}
    </div>
  );
}

function ScorecardCard({ card, onOpen }: { card: Scorecard; onOpen: () => void }) {
  const band = bandForScore(card.score);
  const failing = card.gaps.filter((g) => g.status === "fail").length;
  return (
    <Card
      className="p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{card.name}</h3>
          <p className="text-xs text-muted-foreground">
            {card.gaps.length - failing}/{card.gaps.length} checks passing
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-3xl font-bold tabular-nums ${SCORE_TEXT[band]}`}>{card.score}</div>
          <StatusBadge tone={band === "green" ? "success" : band === "yellow" ? "warning" : "danger"}>
            {band === "green" ? "Healthy" : band === "yellow" ? "Needs review" : "At risk"}
          </StatusBadge>
        </div>
      </div>
      <div className="divide-y divide-border border-t border-border pt-1">
        {card.gaps.map((gap) => (
          <GapRow key={gap.id} gap={gap} />
        ))}
      </div>
    </Card>
  );
}

const Scorecards = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const config = CONFIG[personaId] ?? { assetNoun: "asset", description: "Assessment scorecards for your assets." };
  const isSecurity = personaId === "security";

  const [band, setBand] = useState<Band>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: cards, loading } = useMockQuery(() => getScorecards(personaId), [personaId]);

  const { data: summary } = useMockQuery<ScorecardSummary | undefined>(
    () => (isSecurity ? getScorecardSummary() : Promise.resolve(undefined)),
    [personaId]
  );

  const filtered = useMemo(
    () => (cards ?? []).filter((c) => band === "all" || bandForScore(c.score) === band),
    [cards, band]
  );

  const selected = useMemo(
    () => (cards ?? []).find((c) => c.asset_id === selectedId),
    [cards, selectedId]
  );

  const teamColumns: Column<ScorecardSummary["by_team"][number]>[] = [
    { key: "team", header: "Team", sortable: true, render: (t) => <span className="font-medium">{t.team}</span> },
    {
      key: "score",
      header: "Score",
      align: "right",
      sortable: true,
      accessor: (t) => t.score,
      render: (t) => <span className={`font-semibold tabular-nums ${SCORE_TEXT[bandForScore(t.score)]}`}>{t.score}</span>,
    },
    {
      key: "violations",
      header: "Violations",
      align: "right",
      sortable: true,
      accessor: (t) => t.violations,
      render: (t) => <StatusBadge tone={t.violations > 0 ? "danger" : "success"}>{t.violations}</StatusBadge>,
    },
    {
      key: "actions",
      header: "",
      render: (t) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => toast(`Open ${t.team} violations (coming soon).`)}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const filter = (
    <Select value={band} onValueChange={(v) => setBand(v as Band)}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All scores</SelectItem>
        <SelectItem value="green">≥ 90</SelectItem>
        <SelectItem value="yellow">75–89</SelectItem>
        <SelectItem value="red">&lt; 75</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader
        title="Assessment Scorecards"
        description={config.description}
        actions={filter}
      />

      {isSecurity && summary && (
        <div className="space-y-4 mb-6">
          <MetricsRow>
            <MetricCard
              label="Org posture score"
              value={summary.org_score}
              tone={toneForScore(summary.org_score)}
              icon={ShieldCheck}
              footer="across all teams"
            />
            <MetricCard
              label="Teams assessed"
              value={summary.by_team.length}
              footer="namespaces scored"
            />
            <MetricCard
              label="Open violations"
              value={summary.by_team.reduce((n, t) => n + t.violations, 0)}
              tone="poor"
              footer="org-wide"
            />
            <MetricCard
              label="Teams below 75"
              value={summary.by_team.filter((t) => t.score < 75).length}
              tone={summary.by_team.some((t) => t.score < 75) ? "warning" : "good"}
              footer="need remediation"
            />
          </MetricsRow>
          <SectionCard title="Per-team breakdown" description="Policy posture score and open violations by team.">
            <DataTable
              columns={teamColumns}
              rows={summary.by_team}
              rowKey={(t) => t.team}
              defaultSort={{ key: "score", dir: "asc" }}
            />
          </SectionCard>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-4 h-56 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No scorecards match"
          description={
            (cards ?? []).length === 0
              ? `No ${config.assetNoun} scorecards are available for this persona yet.`
              : "No assets fall in the selected score band."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((card) => (
            <ScorecardCard key={card.asset_id} card={card} onOpen={() => setSelectedId(card.asset_id)} />
          ))}
        </div>
      )}

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={selected?.name ?? ""}
        description={selected ? `Assessment scorecard · ${config.assetNoun}` : undefined}
        wide
      >
        {selected && (
          <>
            <SectionCard title="Overall score">
              <InfoList
                items={[
                  {
                    label: "Score",
                    value: (
                      <span className={`font-bold tabular-nums ${SCORE_TEXT[bandForScore(selected.score)]}`}>
                        {selected.score} / 100
                      </span>
                    ),
                  },
                  {
                    label: "Checks passing",
                    value: `${selected.gaps.filter((g) => g.status === "pass").length}/${selected.gaps.length}`,
                  },
                  {
                    label: "Band",
                    value: (
                      <StatusBadge
                        tone={
                          bandForScore(selected.score) === "green"
                            ? "success"
                            : bandForScore(selected.score) === "yellow"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {bandForScore(selected.score) === "green"
                          ? "Healthy"
                          : bandForScore(selected.score) === "yellow"
                            ? "Needs review"
                            : "At risk"}
                      </StatusBadge>
                    ),
                  },
                ]}
              />
            </SectionCard>
            <SectionCard title="Gap checklist" description="Each dimension assessed against platform standards.">
              <div className="divide-y divide-border">
                {selected.gaps.map((gap) => (
                  <GapRow key={gap.id} gap={gap} />
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Scorecards;
