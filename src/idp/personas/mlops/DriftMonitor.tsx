import { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  StackedBarChartCard,
  ChartCard,
  InfoList,
  type Column,
} from "@/idp/components";
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { useMockQuery } from "@/idp/api/client";
import {
  getDriftReport,
  getFeatureHistogram,
  triggerRetraining,
  type FeatureDrift,
} from "./api";

const RANGES = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "custom", label: "Custom" },
];

const scoreTone = (score?: number) =>
  score == null ? "default" : score >= 0.5 ? "poor" : score >= 0.3 ? "warning" : "good";

const DriftMonitor = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const [range, setRange] = useState("7d");
  const [selectedFeature, setSelectedFeature] = useState<FeatureDrift | null>(null);

  const { data: report, loading } = useMockQuery(
    () => (modelId ? getDriftReport(modelId, range) : Promise.resolve(undefined)),
    [modelId, range]
  );
  const { data: hist } = useMockQuery(
    () =>
      modelId && selectedFeature
        ? getFeatureHistogram(modelId, selectedFeature.name)
        : Promise.resolve(undefined),
    [modelId, selectedFeature?.name]
  );

  const columns: Column<FeatureDrift>[] = [
    { key: "name", header: "Feature", sortable: true, render: (f) => <span className="font-mono text-xs">{f.name}</span> },
    { key: "baseline_mean", header: "Baseline mean", align: "right", render: (f) => f.baseline_mean.toFixed(2) },
    { key: "current_mean", header: "Current mean", align: "right", render: (f) => f.current_mean.toFixed(2) },
    { key: "score", header: "Drift score", sortable: true, align: "right", render: (f) => f.score.toFixed(2) },
    { key: "type", header: "Drift type", render: (f) => <StatusBadge tone="neutral">{f.type}</StatusBadge> },
    { key: "status", header: "Status", render: (f) => <StatusBadge>{f.status}</StatusBadge> },
  ];

  const overThreshold = report ? report.overall_score > report.threshold : false;

  const histData =
    hist?.bins.map((b, i) => ({
      bin: b,
      baseline: hist.baseline_hist[i],
      current: hist.current_hist[i],
    })) ?? [];

  return (
    <div>
      <PageHeader
        title={report ? `Drift · ${report.model_name}` : "Drift Monitor"}
        description="Feature drift, prediction drift, and retraining recommendation for the selected model."
        backTo="/idp/mlops/drift"
        backLabel="All models"
        actions={
          <Tabs value={range} onValueChange={setRange}>
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value}>{r.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <MetricsRow>
        <MetricCard
          label="Overall drift score"
          value={report ? report.overall_score.toFixed(2) : "—"}
          tone={scoreTone(report?.overall_score)}
          delta={report ? `${report.trend >= 0 ? "+" : ""}${report.trend.toFixed(2)} vs prev` : undefined}
          deltaPositive={report ? report.trend <= 0 : undefined}
          footer={report ? `threshold ${report.threshold.toFixed(2)}` : undefined}
        />
        <MetricCard
          label="Days since training"
          value={report?.days_since_training ?? "—"}
          tone={report && report.days_since_training > 5 ? "warning" : "default"}
        />
        <MetricCard
          label="Features drifting"
          value={report ? report.features.filter((f) => f.status !== "No drift").length : "—"}
          tone={report && report.features.some((f) => f.status === "Critical") ? "poor" : "warning"}
        />
        <MetricCard label="Time range" value={range} tone="highlight" />
      </MetricsRow>

      {overThreshold && report && (
        <Card className="p-4 mt-6 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Retraining recommended</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Overall drift score <span className="font-medium text-foreground">{report.overall_score.toFixed(2)}</span> exceeds
                threshold <span className="font-medium text-foreground">{report.threshold.toFixed(2)}</span>. Last trained{" "}
                <span className="font-medium text-foreground">{report.days_since_training} days</span> ago from{" "}
                <span className="font-mono text-xs">{report.source_dataset}</span>.
              </p>
            </div>
            <Button
              onClick={async () => {
                await triggerRetraining(report.model_id);
                toast.success(`Retraining request pre-filled for ${report.model_name}`);
              }}
            >
              Trigger retraining
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        <div>
          <h2 className="font-semibold mb-3">Feature drift</h2>
          <DataTable
            columns={columns}
            rows={report?.features ?? []}
            rowKey={(f) => f.name}
            loading={loading}
            onRowClick={(f) => setSelectedFeature(f)}
            defaultSort={{ key: "score", dir: "desc" }}
          />
        </div>

        <div>
          <h2 className="font-semibold mb-3">Prediction drift</h2>
          <StackedBarChartCard
            title="Predicted class distribution over time"
            data={report?.prediction_drift ?? []}
            series={[
              { key: "class_a", label: "Class A" },
              { key: "class_b", label: "Class B" },
              { key: "class_c", label: "Class C" },
            ]}
            xKey="ts"
            height={260}
          />
          {overThreshold && (
            <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="w-3.5 h-3.5" />
              Prediction distribution beyond drift threshold.
            </div>
          )}
        </div>
      </div>

      <SideDrawer
        open={!!selectedFeature}
        onOpenChange={(o) => !o && setSelectedFeature(null)}
        title={selectedFeature ? selectedFeature.name : ""}
        description={selectedFeature ? `${selectedFeature.type} drift · score ${selectedFeature.score.toFixed(2)}` : undefined}
        wide
      >
        {selectedFeature && (
          <>
            <SectionCard title="Summary">
              <InfoList
                items={[
                  { label: "Baseline mean", value: selectedFeature.baseline_mean.toFixed(2) },
                  { label: "Current mean", value: selectedFeature.current_mean.toFixed(2) },
                  { label: "Drift score", value: selectedFeature.score.toFixed(2) },
                  { label: "Drift type", value: selectedFeature.type },
                  { label: "Status", value: <StatusBadge>{selectedFeature.status}</StatusBadge> },
                ]}
              />
            </SectionCard>
            <SectionCard title="Distribution — baseline vs current">
              <ChartCard title="" height={240}>
                <BarChart data={histData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="bin" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="baseline" name="Baseline" fill="hsl(var(--muted-foreground))" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default DriftMonitor;
