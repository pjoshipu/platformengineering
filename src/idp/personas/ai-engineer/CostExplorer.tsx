import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DollarSign, CalendarDays, TrendingUp, Gauge } from "lucide-react";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  LineChartCard,
  StackedBarChartCard,
  HorizontalBarChartCard,
  type Column,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import {
  getCostSummary,
  getCostTimeseries,
  getCostBreakdown,
  getCostByApp,
  getAppCostRows,
} from "./api";

const RANGES = ["7d", "14d", "30d", "90d"];

type CostRow = Awaited<ReturnType<typeof getAppCostRows>>[number];

const CostExplorer = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState("14d");
  const { data: summary } = useMockQuery(getCostSummary, []);
  const { data: series } = useMockQuery(() => getCostTimeseries(), [range]);
  const { data: breakdown } = useMockQuery(() => getCostBreakdown(), [range]);
  const { data: byApp } = useMockQuery(getCostByApp, []);
  const { data: rows, loading } = useMockQuery(getAppCostRows, []);

  const columns: Column<CostRow>[] = [
    { key: "name", header: "App", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "model", header: "Model", render: (r) => <span className="font-mono text-xs">{r.model}</span> },
    { key: "calls", header: "Calls", align: "right", sortable: true, accessor: (r) => r.calls, render: (r) => r.calls.toLocaleString() },
    { key: "tokens", header: "Tokens", align: "right" },
    { key: "cost_day", header: "Cost/day", align: "right", sortable: true, accessor: (r) => r.cost_day, render: (r) => `$${r.cost_day.toFixed(2)}` },
    { key: "trend", header: "Trend", align: "right", render: (r) => <StatusBadge tone={r.trend.startsWith("-") ? "success" : "warning"}>{r.trend}</StatusBadge> },
  ];

  return (
    <div>
      <PageHeader
        title="Cost Explorer"
        description="Spend across your LLM applications — tokens, embeddings, vector search, and infrastructure."
        actions={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button key={r} variant={r === range ? "default" : "outline"} size="sm" onClick={() => setRange(r)}>{r}</Button>
            ))}
          </div>
        }
      />

      <MetricsRow>
        <MetricCard label="Today's cost" value={summary ? `$${summary.today.toFixed(2)}` : "—"} icon={DollarSign} />
        <MetricCard label="Month-to-date" value={summary ? `$${summary.mtd.toFixed(0)}` : "—"} icon={CalendarDays} />
        <MetricCard label="Projected month" value={summary ? `$${summary.projected.toFixed(0)}` : "—"} icon={TrendingUp} tone="warning" />
        <MetricCard label="Cost / 1k calls" value={summary ? `$${summary.cost_per_1k_calls.toFixed(2)}` : "—"} icon={Gauge} />
      </MetricsRow>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <LineChartCard title="Cost over time" data={series ?? []} series={[{ key: "value", label: "$ / day" }]} />
        <HorizontalBarChartCard title="Cost by app ($/day)" data={byApp ?? []} />
        <StackedBarChartCard
          title="Cost breakdown by component"
          data={breakdown ?? []}
          series={[
            { key: "tokens", label: "Tokens" },
            { key: "embeddings", label: "Embeddings" },
            { key: "vector", label: "Vector search" },
            { key: "infra", label: "Infrastructure" },
          ]}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Per-app cost</h2>
        <DataTable
          columns={columns}
          rows={rows ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          defaultSort={{ key: "cost_day", dir: "desc" }}
          onRowClick={(r) => navigate(`/idp/ai-engineer/observe/${r.id}`)}
        />
      </div>
    </div>
  );
};

export default CostExplorer;
