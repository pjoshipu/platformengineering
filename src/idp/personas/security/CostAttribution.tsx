import { DollarSign, Crown, Tag, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { getCostMetrics, getCostRows, getCostCharts, type CostRow } from "./api";

const money = (n: number) => `$${n.toLocaleString()}`;

const CostAttribution = () => {
  const { data: metrics } = useMockQuery(getCostMetrics, []);
  const { data: rows, loading } = useMockQuery(getCostRows, []);
  const { data: charts } = useMockQuery(getCostCharts, []);

  const columns: Column<CostRow>[] = [
    { key: "team", header: "Team / namespace", sortable: true, render: (r) => <span className="font-medium font-mono text-xs">{r.team}</span> },
    { key: "owner", header: "Owner", render: (r) => <span className="font-mono text-xs">{r.owner}</span> },
    { key: "mtd_cost", header: "MTD cost", sortable: true, align: "right", accessor: (r) => r.mtd_cost, render: (r) => <span className="tabular-nums">{money(r.mtd_cost)}</span> },
    { key: "pct_of_total", header: "% of total", align: "right", render: (r) => <span className="tabular-nums">{r.pct_of_total}%</span> },
    {
      key: "trend",
      header: "Trend",
      align: "right",
      render: (r) => (
        <span className={`inline-flex items-center gap-0.5 tabular-nums ${r.trend > 0 ? "text-destructive" : "text-green-600"}`}>
          {r.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(r.trend)}%
        </span>
      ),
    },
    { key: "budget_status", header: "Budget", render: (r) => <StatusBadge>{r.budget_status}</StatusBadge> },
  ];

  return (
    <div>
      <PageHeader
        title="Cost Attribution"
        description="Attribute platform, LLM, and compute cost to teams and namespaces for chargeback."
      />

      <MetricsRow>
        <MetricCard label="Total spend MTD" value={metrics ? money(metrics.total_spend_mtd) : "—"} icon={DollarSign} tone="highlight" />
        <MetricCard label="Top team" value={metrics?.top_team ?? "—"} icon={Crown} />
        <MetricCard
          label="Untagged spend"
          value={metrics ? money(metrics.untagged_spend) : "—"}
          icon={Tag}
          tone={metrics && metrics.untagged_spend > 0 ? "warning" : "good"}
        />
        <MetricCard label="Projected month" value={metrics ? money(metrics.projected_month) : "—"} icon={TrendingUp} tone="warning" />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-2 mt-8">
        <HorizontalBarChartCard title="Cost by team (MTD)" data={charts?.by_team ?? []} />
        <LineChartCard
          title="Cost over time"
          data={charts?.over_time ?? []}
          series={[{ key: "spend", label: "Weekly spend" }]}
          xKey="ts"
        />
      </div>

      <div className="mt-6">
        <StackedBarChartCard
          title="Cost by category"
          data={charts?.by_category ?? []}
          xKey="ts"
          series={[
            { key: "compute", label: "Compute" },
            { key: "llm", label: "LLM" },
            { key: "storage", label: "Storage" },
            { key: "data", label: "Data" },
          ]}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Team chargeback</h2>
        <DataTable
          columns={columns}
          rows={rows ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          defaultSort={{ key: "mtd_cost", dir: "desc" }}
        />
      </div>
    </div>
  );
};

export default CostAttribution;
