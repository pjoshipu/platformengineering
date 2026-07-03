import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  LineChartCard,
  AreaChartCard,
  HorizontalBarChartCard,
  DataTable,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyActivity,
  getOrgAnalytics,
  type ActivityTrend,
  type TeamRow,
  type Contributor,
  type TimeRange,
} from "./api";

/**
 * Capability 4.2 — Portal Usage Analytics. ONE persona-aware screen with two
 * modes. Individual ("my activity") is available to every persona and shows the
 * active persona's own-usage cards + trend charts. Admin ("org rollups") is
 * shown only to the `security` persona (treated as platform admin) and adds
 * org-wide adoption, per-team breakdown, top contributors, and search terms.
 */

const RANGES: TimeRange[] = ["24h", "7d", "30d"];

type Mode = "individual" | "admin";

const ChartFromTrend = ({ trend }: { trend: ActivityTrend }) => {
  const common = { title: trend.title, data: trend.data, series: trend.series, xKey: "ts" };
  if (trend.kind === "area") return <AreaChartCard {...common} />;
  return <LineChartCard {...common} />;
};

const Analytics = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const isAdmin = personaId === "security";

  const [range, setRange] = useState<TimeRange>("7d");
  const [mode, setMode] = useState<Mode>("individual");

  // Non-security personas can never enter admin mode.
  const activeMode: Mode = isAdmin ? mode : "individual";

  const { data: mine, loading: mineLoading } = useMockQuery(
    () => getMyActivity(personaId, range),
    [personaId, range]
  );

  const { data: org, loading: orgLoading } = useMockQuery(
    () => (activeMode === "admin" ? getOrgAnalytics(range) : Promise.resolve(undefined)),
    [activeMode, range]
  );

  const rangeSelector = (
    <div className="flex items-center gap-3">
      {isAdmin && (
        <div className="flex gap-1">
          <Button
            variant={activeMode === "individual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("individual")}
          >
            Individual
          </Button>
          <Button
            variant={activeMode === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("admin")}
          >
            Admin
          </Button>
        </div>
      )}
      <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
        <SelectContent>
          {RANGES.map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // --- Individual view ------------------------------------------------------
  const myCards = mine?.cards ?? [];
  const myTrends = mine?.trend ?? [];

  const individualView = (
    <>
      <MetricsRow>
        {mineLoading && myCards.length === 0
          ? Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="—" value="…" />)
          : myCards.map((c) => (
              <MetricCard
                key={c.label}
                label={c.label}
                value={c.value}
                delta={c.delta}
                deltaPositive={c.deltaPositive}
                tone={c.tone}
              />
            ))}
      </MetricsRow>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {myTrends.map((t) => (
          <ChartFromTrend key={t.id} trend={t} />
        ))}
      </div>
    </>
  );

  // --- Admin view -----------------------------------------------------------
  const teamColumns: Column<TeamRow>[] = [
    { key: "team", header: "Team", sortable: true, render: (r) => <span className="font-medium">{r.team}</span> },
    { key: "active_users", header: "Active users", align: "right", sortable: true, accessor: (r) => r.active_users, render: (r) => r.active_users },
    { key: "deploys", header: "Deploys", align: "right", sortable: true, accessor: (r) => r.deploys, render: (r) => r.deploys },
    {
      key: "adoption",
      header: "Adoption",
      align: "right",
      sortable: true,
      accessor: (r) => r.adoption,
      render: (r) => (
        <StatusBadge tone={r.adoption >= 70 ? "success" : r.adoption >= 50 ? "warning" : "danger"}>
          {r.adoption}%
        </StatusBadge>
      ),
    },
  ];

  const contributorColumns: Column<Contributor>[] = [
    { key: "name", header: "Contributor", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "persona", header: "Persona", render: (r) => <StatusBadge tone="neutral">{r.persona}</StatusBadge> },
    { key: "contributions", header: "Contributions", align: "right", sortable: true, accessor: (r) => r.contributions, render: (r) => r.contributions },
  ];

  const orgCards = org?.cards ?? [];

  const adminView = (
    <>
      <MetricsRow>
        {orgLoading && orgCards.length === 0
          ? Array.from({ length: 4 }).map((_, i) => <MetricCard key={i} label="—" value="…" />)
          : orgCards.map((c) => (
              <MetricCard
                key={c.label}
                label={c.label}
                value={c.value}
                delta={c.delta}
                deltaPositive={c.deltaPositive}
              />
            ))}
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        <HorizontalBarChartCard title="Feature adoption per capability (%)" data={org?.adoption ?? []} />

        <SectionCard title="Most-searched catalog terms">
          <div className="flex flex-wrap gap-2">
            {(org?.top_terms ?? []).map((t) => (
              <span
                key={t}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted/40"
              >
                {t}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard
          title="Per-team breakdown"
          description="Active users, deploy frequency, and feature adoption by team."
        >
          <DataTable
            columns={teamColumns}
            rows={org?.by_team ?? []}
            rowKey={(r) => r.team}
            loading={orgLoading}
            defaultSort={{ key: "adoption", dir: "desc" }}
            emptyTitle="No team data"
          />
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard title="Top contributors" description="Adoption funnel leaders across personas.">
          <DataTable
            columns={contributorColumns}
            rows={org?.top_contributors ?? []}
            rowKey={(r) => r.name}
            loading={orgLoading}
            defaultSort={{ key: "contributions", dir: "desc" }}
            emptyTitle="No contributors"
          />
        </SectionCard>
      </div>
    </>
  );

  const description =
    activeMode === "admin"
      ? "Org-wide portal adoption, per-team usage, and top contributors."
      : "Your own portal usage — activity, trends, and attribution.";

  return (
    <div>
      <PageHeader
        title="Portal Usage Analytics"
        description={description}
        actions={
          <div className="flex items-center gap-2">
            {activeMode === "admin" && (
              <>
                <Button variant="outline" size="sm" onClick={() => toast("Report export queued — you'll get a link when it's ready.")}>
                  Export report
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast("Adoption targets saved for this period.")}>
                  Set targets
                </Button>
              </>
            )}
            {rangeSelector}
          </div>
        }
      />

      {activeMode === "admin" ? adminView : individualView}
    </div>
  );
};

export default Analytics;
