import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  SidePanel,
  InfoList,
  LineChartCard,
  StackedBarChartCard,
  type Column,
} from "@/idp/components";
import { Button } from "@/components/ui/button";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getApps,
  getApp,
  getIncidents,
  getObserveMetrics,
  getObserveTimeseries,
  getTraces,
  getTraceDetail,
  type LlmApp,
  type Trace,
} from "./api";

const RANGES = ["1h", "6h", "24h", "7d", "30d"];

// --- Landing ---------------------------------------------------------------

const ObserveLanding = () => {
  const navigate = useNavigate();
  const { data: apps, loading } = useMockQuery(getApps, []);
  const columns: Column<LlmApp>[] = [
    { key: "name", header: "App", render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "type", header: "Type" },
    { key: "model", header: "Model", render: (a) => <span className="font-mono text-xs">{a.model}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
    { key: "p95_latency", header: "p95", align: "right", render: (a) => `${a.p95_latency}ms` },
  ];
  return (
    <div>
      <PageHeader title="LLM Observability" description="Select an app to inspect calls, latency, cost, quality, and traces." />
      <DataTable columns={columns} rows={apps ?? []} rowKey={(a) => a.id} loading={loading} onRowClick={(a) => navigate(`/ai-engineer/observe/${a.id}`)} />
    </div>
  );
};

// --- Detail ----------------------------------------------------------------

const rangeSelector = (range: string, setRange: (r: string) => void) => (
  <div className="flex gap-1">
    {RANGES.map((r) => (
      <Button key={r} variant={r === range ? "default" : "outline"} size="sm" onClick={() => setRange(r)}>{r}</Button>
    ))}
  </div>
);

const ObserveDetail = ({ appId }: { appId: string }) => {
  const navigate = useNavigate();
  const [range, setRange] = useState("24h");
  const { data: app } = useMockQuery(() => getApp(appId), [appId]);
  const { data: metrics } = useMockQuery(() => getObserveMetrics(appId, range), [appId, range]);
  const { data: volume } = useMockQuery(() => getObserveTimeseries(appId, "calls", range), [appId, range]);
  const { data: latency } = useMockQuery(() => getObserveTimeseries(appId, "latency", range), [appId, range]);
  const { data: cost } = useMockQuery(() => getObserveTimeseries(appId, "cost", range), [appId, range]);
  const { data: faith } = useMockQuery(() => getObserveTimeseries(appId, "faithfulness", range), [appId, range]);
  const { data: traces, loading } = useMockQuery(() => getTraces(appId), [appId]);
  const { data: incidents } = useMockQuery(getIncidents, []);

  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const { data: traceDetail } = useMockQuery(
    () => (selectedTrace ? getTraceDetail(appId, selectedTrace.trace_id) : Promise.resolve(undefined)),
    [selectedTrace?.trace_id]
  );

  const appIncidents = (incidents ?? []).filter((i) => i.app_id === appId);

  const columns: Column<Trace>[] = [
    { key: "time", header: "Time", render: (t) => timeAgo(t.time) },
    { key: "trace_id", header: "Trace ID", render: (t) => <span className="font-mono text-xs">{t.trace_id}</span> },
    { key: "input_preview", header: "Input", render: (t) => <span className="max-w-[160px] truncate inline-block align-middle">{t.input_preview}</span> },
    { key: "output_preview", header: "Output", render: (t) => <span className="max-w-[160px] truncate inline-block align-middle">{t.output_preview}</span> },
    { key: "latency", header: "Latency", align: "right", sortable: true, accessor: (t) => t.latency, render: (t) => `${t.latency}ms` },
    { key: "tokens", header: "Tokens", align: "right", render: (t) => t.tokens.toLocaleString() },
    { key: "cost", header: "Cost", align: "right", render: (t) => `$${t.cost.toFixed(4)}` },
    { key: "faithfulness", header: "Faithfulness", align: "right", render: (t) => (t.faithfulness ? `${(t.faithfulness * 100).toFixed(0)}%` : "—") },
    { key: "guardrails", header: "Guardrails", render: (t) => (t.guardrails === "none" ? "—" : <StatusBadge tone="warning">{t.guardrails}</StatusBadge>) },
    { key: "status", header: "Status", render: (t) => <StatusBadge tone={t.status === "OK" ? "success" : t.status === "Blocked" ? "warning" : "danger"}>{t.status}</StatusBadge> },
  ];

  const fmtPct = (n?: number) => (n != null ? `${(n * 100).toFixed(1)}%` : "—");

  return (
    <div>
      <PageHeader
        title={`Observability — ${app?.name ?? appId}`}
        description={app ? `${app.type} · ${app.model}` : undefined}
        backTo="/ai-engineer/observe"
        backLabel="All apps"
        actions={rangeSelector(range, setRange)}
      />

      <MetricsRow>
        <MetricCard label="Calls" value={metrics ? metrics.calls.toLocaleString() : "—"} />
        <MetricCard label="Avg latency (p50)" value={metrics ? `${metrics.latency_p50}ms` : "—"} />
        <MetricCard label="p95 latency" value={metrics ? `${metrics.latency_p95}ms` : "—"} />
        <MetricCard label="Total tokens" value={metrics ? `${(metrics.tokens / 1e6).toFixed(1)}M` : "—"} />
      </MetricsRow>
      <div className="mt-4">
        <MetricsRow>
          <MetricCard label="Total cost" value={metrics ? `$${metrics.cost.toFixed(2)}` : "—"} />
          <MetricCard label="Avg faithfulness" value={fmtPct(metrics?.faithfulness)} tone={metrics && metrics.faithfulness >= 0.9 ? "good" : "warning"} />
          <MetricCard label="Hallucination rate" value={fmtPct(metrics?.hallucination_rate)} tone={metrics && metrics.hallucination_rate > 0.05 ? "poor" : "good"} />
          <MetricCard label="Error rate" value={fmtPct(metrics?.error_rate)} tone={metrics && metrics.error_rate > 0.01 ? "warning" : "good"} />
        </MetricsRow>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <LineChartCard title="Call volume" data={volume ?? []} series={[{ key: "value", label: "calls" }]} />
            <LineChartCard
              title="Latency percentiles"
              data={latency ?? []}
              series={[{ key: "p50", label: "p50" }, { key: "p95", label: "p95" }, { key: "p99", label: "p99" }]}
            />
            <StackedBarChartCard
              title="Cost breakdown"
              data={cost ?? []}
              series={[
                { key: "tokens", label: "LLM tokens" },
                { key: "embeddings", label: "Embeddings" },
                { key: "vector", label: "Vector search" },
                { key: "infra", label: "Infrastructure" },
              ]}
            />
            <LineChartCard title="Faithfulness over time" data={faith ?? []} series={[{ key: "value", label: "faithfulness" }]} threshold={0.9} />
          </div>

          <div>
            <h2 className="font-semibold mb-3">Traces</h2>
            <DataTable columns={columns} rows={traces ?? []} rowKey={(t) => t.trace_id} loading={loading} onRowClick={(t) => setSelectedTrace(t)} />
          </div>
        </div>

        <SidePanel title="Active incidents">
          {appIncidents.length === 0 && <p className="text-sm text-muted-foreground">No open incidents for this app.</p>}
          {appIncidents.map((inc) => (
            <div key={inc.id} className="rounded-lg border border-border p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tone={inc.severity === "P1" ? "danger" : inc.severity === "P2" ? "info" : "warning"}>{inc.severity}</StatusBadge>
                <span className="text-xs text-muted-foreground">{timeAgo(inc.created_at)}</span>
              </div>
              <div className="text-sm font-medium leading-snug">{inc.title}</div>
            </div>
          ))}
        </SidePanel>
      </div>

      {/* Trace detail drawer */}
      <SideDrawer
        open={!!selectedTrace}
        onOpenChange={(o) => !o && setSelectedTrace(null)}
        title={selectedTrace ? selectedTrace.trace_id : ""}
        description={selectedTrace ? timeAgo(selectedTrace.time) : undefined}
        wide
      >
        {traceDetail && (
          <>
            <SectionCard title="Input / Output">
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Input</div>
                  <pre className="rounded-lg border border-border bg-muted/40 p-2 text-xs font-mono whitespace-pre-wrap">{traceDetail.input}</pre>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Output</div>
                  <pre className="rounded-lg border border-border bg-muted/40 p-2 text-xs font-mono whitespace-pre-wrap">{traceDetail.output}</pre>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Retrieved context chunks">
              <div className="space-y-2">
                {traceDetail.context_chunks.map((c) => (
                  <div key={c.doc} className="rounded-lg border border-border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{c.doc}</span>
                      <StatusBadge tone="neutral">{`score ${c.score.toFixed(2)}`}</StatusBadge>
                    </div>
                    <div className="text-muted-foreground mt-1">{c.text}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Token breakdown">
              <InfoList
                items={[
                  { label: "Prompt tokens", value: traceDetail.token_breakdown.prompt.toLocaleString() },
                  { label: "Completion tokens", value: traceDetail.token_breakdown.completion.toLocaleString() },
                ]}
              />
            </SectionCard>

            <SectionCard title="Guardrail eval results">
              <div className="space-y-1">
                {traceDetail.guardrail_results.map((g) => (
                  <div key={g.name} className="flex items-center justify-between text-sm">
                    <span>{g.name}</span>
                    <StatusBadge tone={g.result === "Pass" ? "success" : "danger"}>{g.result}</StatusBadge>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Latency waterfall">
              <div className="space-y-2">
                {traceDetail.waterfall.map((w) => {
                  const total = traceDetail.waterfall.reduce((s, x) => s + x.ms, 0);
                  return (
                    <div key={w.phase}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span>{w.phase}</span>
                        <span className="font-mono">{w.ms}ms</span>
                      </div>
                      <div className="h-2 rounded bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(w.ms / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

const Observability = () => {
  const { appId } = useParams<{ appId: string }>();
  if (!appId) return <ObserveLanding />;
  return <ObserveDetail appId={appId} />;
};

export default Observability;
