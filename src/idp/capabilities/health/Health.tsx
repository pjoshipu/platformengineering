import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  getHealthAssets,
  getHealthMetrics,
  getHealthSeries,
  type HealthChartSpec,
  type TimeRange,
} from "./api";

/**
 * Capability 1.4 — Service Health Metrics. ONE persona-aware screen: pick an
 * asset (defaults to the first) + a time range, and see the persona's metric
 * cards and adaptive charts. Data comes from getHealth*(persona, asset, range).
 */

const RANGES: TimeRange[] = ["24h", "7d", "30d"];

const ChartFromSpec = ({ spec }: { spec: HealthChartSpec }) => {
  const common = {
    title: spec.title,
    data: spec.data,
    series: spec.series,
    xKey: "ts",
  };
  if (spec.kind === "area") return <AreaChartCard {...common} />;
  if (spec.kind === "stacked") return <StackedBarChartCard {...common} />;
  return <LineChartCard {...common} threshold={spec.threshold} />;
};

const Health = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";

  const { data: assets, loading: assetsLoading } = useMockQuery(
    () => getHealthAssets(personaId),
    [personaId]
  );

  const [assetId, setAssetId] = useState<string>("");
  const [range, setRange] = useState<TimeRange>("24h");

  // Default to the first asset once assets load / persona changes.
  useEffect(() => {
    const list = assets ?? [];
    if (list.length && !list.some((a) => a.id === assetId)) {
      setAssetId(list[0].id);
    }
  }, [assets, assetId]);

  const { data: metrics, loading: metricsLoading } = useMockQuery(
    () => (assetId ? getHealthMetrics(personaId, assetId, range) : Promise.resolve(undefined)),
    [personaId, assetId, range]
  );

  const { data: specs } = useMockQuery(
    () => (assetId ? getHealthSeries(personaId, assetId, range) : Promise.resolve(undefined)),
    [personaId, assetId, range]
  );

  const selected = (assets ?? []).find((a) => a.id === assetId);
  const cards = metrics?.cards ?? [];

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
        title="Service Health Metrics"
        description={
          selected
            ? `${selected.type} · ${selected.name} — real-time and historical operational health.`
            : "Real-time and historical operational health for your assets."
        }
        actions={rangeSelector}
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground">Asset</span>
        <Select value={assetId} onValueChange={setAssetId} disabled={assetsLoading}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={assetsLoading ? "Loading…" : "Select an asset"} />
          </SelectTrigger>
          <SelectContent>
            {(assets ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name} · {a.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <MetricsRow>
        {metricsLoading && cards.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <MetricCard key={i} label="—" value="…" />
            ))
          : cards.map((c) => (
              <MetricCard key={c.label} label={c.label} value={c.value} tone={c.tone} />
            ))}
      </MetricsRow>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {(specs ?? []).map((spec) => (
          <ChartFromSpec key={spec.id} spec={spec} />
        ))}
      </div>
    </div>
  );
};

export default Health;
