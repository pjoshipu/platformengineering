import { useState } from "react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  type Column,
} from "@/idp/components";
import { cn } from "@/lib/utils";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { getRuns, getRun, type AgentRun, type RunStep } from "./api";

const PHASE_STYLE: Record<RunStep["phase"], string> = {
  plan: "bg-tech-cyan/15 text-tech-cyan border-tech-cyan/30",
  act: "bg-primary/15 text-primary border-primary/30",
  observe: "bg-accent/50 text-accent-foreground border-border",
};

const STEP_TONE: Record<RunStep["status"], "success" | "warning" | "danger" | "info"> = {
  ok: "success",
  blocked: "warning",
  error: "danger",
  waiting: "info",
};

const RunTraces = () => {
  const { data: runs, loading } = useMockQuery(getRuns, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMockQuery(
    () => (selectedId ? getRun(selectedId) : Promise.resolve(undefined)),
    [selectedId]
  );

  const columns: Column<AgentRun>[] = [
    { key: "agent_name", header: "Agent", sortable: true, render: (r) => <span className="font-medium">{r.agent_name}</span> },
    { key: "goal", header: "Goal", render: (r) => <span className="text-sm text-muted-foreground line-clamp-1">{r.goal}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    { key: "steps", header: "Steps", align: "right", sortable: true },
    { key: "tokens", header: "Tokens", align: "right", sortable: true, render: (r) => r.tokens.toLocaleString() },
    { key: "cost", header: "Cost", align: "right", sortable: true, accessor: (r) => r.cost, render: (r) => `$${r.cost.toFixed(2)}` },
    { key: "started_at", header: "Started", sortable: true, accessor: (r) => r.started_at, render: (r) => timeAgo(r.started_at) },
  ];

  return (
    <div>
      <PageHeader
        title="Run Traces"
        description="Plan → act → observe traces for every agent run, with tool calls, cost, and checkpoints."
      />
      <DataTable
        columns={columns}
        rows={runs ?? []}
        rowKey={(r) => r.id}
        loading={loading}
        onRowClick={(r) => setSelectedId(r.id)}
        defaultSort={{ key: "started_at", dir: "desc" }}
      />

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.run ? detail.run.agent_name : "Run trace"}
        description={detail?.run?.goal}
        wide
      >
        {detail?.run && (
          <SectionCard
            title="Plan → act → observe"
            description={`${detail.run.steps} steps · ${detail.run.tokens.toLocaleString()} tokens · $${detail.run.cost.toFixed(2)}`}
          >
            <ol className="space-y-2">
              {detail.steps.map((s) => (
                <li key={s.idx} className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground w-5 text-right mt-1">{s.idx}</span>
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase mt-0.5", PHASE_STYLE[s.phase])}>
                    {s.phase}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{s.summary}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {s.tool && <span className="font-mono text-[11px] text-muted-foreground">{s.tool}</span>}
                      <StatusBadge tone={STEP_TONE[s.status]}>{s.status}</StatusBadge>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        )}
      </SideDrawer>
    </div>
  );
};

export default RunTraces;
