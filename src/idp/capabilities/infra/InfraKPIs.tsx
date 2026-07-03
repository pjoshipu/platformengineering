import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  LineChartCard,
  AreaChartCard,
  StackedBarChartCard,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getInfraKpis,
  getInfraTrends,
  type InfraTrend,
  type TimeRange,
} from "./api";

/**
 * Capability 3.4 — Infrastructure KPIs. ONE persona-aware screen: pick a time
 * range and see the active persona's resource-efficiency / reliability KPI
 * cards plus 2–3 adaptive trend charts. Data comes from getInfra*(persona,
 * range). Mirrors the Health capability's structure.
 */

const RANGES: TimeRange[] = ["24h", "7d", "30d"];

const DESCRIPTIONS: Record<string, string> = {
  "ai-engineer": "Per-app LLM serving reliability, throughput, and cost efficiency.",
  "agentic-engineer": "Agent-ops KPIs: fleet activity, checkpoints, and autonomy budget.",
  "data-scientist": "Training-queue, GPU usage, and serving-volume summary.",
  "app-engineer": "Platform-ops dashboard: service health, drift, deploys, and rollbacks.",
  mlops: "ML-infra efficiency: utilisation, pipeline reliability, and retrain speed.",
  security: "Security-posture dashboard: compliance, violations, MTTR, and anomalies.",
  "data-engineer": "Data-platform reliability: pipelines, data quality, and freshness.",
};

const ChartFromTrend = ({ trend }: { trend: InfraTrend }) => {
  const common = {
    title: trend.title,
    data: trend.data,
    series: trend.series,
    xKey: "ts",
  };
  if (trend.kind === "area") return <AreaChartCard {...common} />;
  if (trend.kind === "stacked") return <StackedBarChartCard {...common} />;
  return <LineChartCard {...common} />;
};

const InfraKPIs = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";

  const [range, setRange] = useState<TimeRange>("7d");

  const { data: kpis, loading: kpisLoading } = useMockQuery(
    () => getInfraKpis(personaId, range),
    [personaId, range]
  );

  const { data: trends } = useMockQuery(
    () => getInfraTrends(personaId, range),
    [personaId, range]
  );

  const cards = kpis?.cards ?? [];

  const rangeSelector = (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <Button
          key={r}
          variant={r === range ? "default" : "outline"}
          size="sm"
          onClick={() => setRange(r)}
        >
          {r}
        </Button>
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Infrastructure KPIs"
        description={
          DESCRIPTIONS[personaId] ??
          "Platform-wide resource-efficiency and reliability KPIs."
        }
        actions={rangeSelector}
      />

      <MetricsRow>
        {kpisLoading && cards.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <MetricCard key={i} label="—" value="…" />
            ))
          : cards.map((c) => (
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
        {(trends ?? []).map((trend) => (
          <ChartFromTrend key={trend.id} trend={trend} />
        ))}
      </div>
    </div>
  );
};

export default InfraKPIs;
