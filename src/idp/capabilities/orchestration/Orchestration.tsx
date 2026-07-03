import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Circle, AlertCircle, Clock, Play, Square } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPipelines,
  getRun,
  triggerPipeline,
  abortRun,
  decideGate,
  type Pipeline,
  type RunStep,
} from "./api";

/**
 * Capability 3.3 — Pipeline Orchestration. ONE persona-aware screen: the active
 * persona (from auth) selects which pipelines it can trigger/monitor and which
 * row actions appear. Row click opens the shared run-detail drawer (step
 * timeline + logs + gate approvals).
 */

/** Row action labels per persona (reference screen: they toast). */
const ACTIONS: Record<string, string[]> = {
  "ai-engineer": ["Trigger deploy", "Approve gate", "Abort", "History"],
  "agentic-engineer": ["Deploy", "Approve checkpoint", "Abort run"],
  "data-scientist": ["Submit job", "Approve", "Re-trigger step"],
  "app-engineer": ["Trigger deploy", "Sync now", "Rollback"],
  mlops: ["Trigger now", "Edit schedule", "Pause/Resume", "Logs"],
  security: ["Trigger scan", "Deploy policy", "Approve rollout"],
  "data-engineer": ["Trigger", "Re-run failed step", "View lineage"],
};

const PIPELINE_STATUS_TONE: Record<Pipeline["status"], "success" | "warning" | "danger" | "info" | "active"> = {
  Running: "active",
  Success: "success",
  Failed: "danger",
  Queued: "info",
};

const StepIcon = ({ status }: { status: RunStep["status"] }) => {
  switch (status) {
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "running":
      return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    case "failed":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case "waiting":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground/40" />;
  }
};

const Orchestration = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const actions = ACTIONS[personaId] ?? [];
  const isDataEngineer = personaId === "data-engineer";

  const { data: pipelines, loading, refetch } = useMockQuery(
    () => getPipelines(personaId),
    [personaId]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: run, refetch: refetchRun } = useMockQuery(
    () => (selectedId ? getRun(personaId, selectedId) : Promise.resolve(undefined)),
    [personaId, selectedId]
  );

  // Typed reason required to enable a data-engineer "skip quality gate".
  const [skipReason, setSkipReason] = useState("");

  const selectedPipeline = run?.pipeline;
  const steps = run?.steps ?? [];

  const handleTrigger = async (p: Pipeline) => {
    const { status } = await triggerPipeline(p.id);
    toast.success(`Triggered ${p.name} · ${status}`);
    refetch();
  };

  const handleAbort = async (p: Pipeline) => {
    const { status } = await abortRun(p.id);
    toast(`${p.name} · ${status}`);
    refetch();
  };

  const handleGate = async (decision: "approve" | "reject", reason?: string) => {
    if (!selectedPipeline) return;
    const { status } = await decideGate(selectedPipeline.id, decision, reason);
    toast.success(`${selectedPipeline.name} · gate ${status}`);
    setSkipReason("");
    refetchRun();
    refetch();
  };

  const columns: Column<Pipeline>[] = [
    { key: "name", header: "Pipeline", sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "type", header: "Type", render: (p) => <StatusBadge tone="neutral">{p.type}</StatusBadge> },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusBadge tone={PIPELINE_STATUS_TONE[p.status]}>{p.status}</StatusBadge>,
    },
    { key: "last_run", header: "Last run", sortable: true, accessor: (p) => p.last_run, render: (p) => timeAgo(p.last_run) },
    {
      key: "next_run",
      header: "Next run",
      render: (p) => (p.next_run ? timeAgo(p.next_run) : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {actions.map((a) => (
            <Button
              key={a}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (a.toLowerCase().includes("abort")) handleAbort(p);
                else if (a.toLowerCase().includes("trigger") || a.toLowerCase().includes("deploy") || a.toLowerCase().includes("submit") || a.toLowerCase().includes("scan"))
                  handleTrigger(p);
                else toast(`${a}: ${p.name}`);
              }}
            >
              {a}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pipeline Orchestration"
        description="Trigger, monitor, and manage your pipelines. Open a run to inspect steps, logs, and gates."
      />

      <DataTable
        columns={columns}
        rows={pipelines ?? []}
        rowKey={(p) => p.id}
        loading={loading}
        onRowClick={(p) => {
          setSelectedId(p.id);
          setSkipReason("");
        }}
        defaultSort={{ key: "last_run", dir: "desc" }}
        emptyTitle="No pipelines"
        emptyDescription="This persona has no pipelines configured."
      />

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => {
          if (!o) {
            setSelectedId(null);
            setSkipReason("");
          }
        }}
        title={selectedPipeline?.name ?? "Run detail"}
        description={selectedPipeline ? `${selectedPipeline.type} · ${selectedPipeline.status}` : undefined}
        wide
      >
        {selectedPipeline && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  await handleTrigger(selectedPipeline);
                  refetchRun();
                }}
              >
                <Play className="w-4 h-4 mr-1" /> Trigger run
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await handleAbort(selectedPipeline);
                  refetchRun();
                }}
              >
                <Square className="w-4 h-4 mr-1" /> Abort
              </Button>
            </div>

            <SectionCard title="Run steps" description={`${steps.length} steps`}>
              {steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps recorded for this run.</p>
              ) : (
                <ol className="space-y-3">
                  {steps.map((s) => (
                    <li key={s.idx} className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground w-5 text-right mt-0.5">{s.idx}</span>
                      <span className="mt-0.5">
                        <StepIcon status={s.status} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{s.name}</span>
                          {s.gate && <StatusBadge tone="warning">gate</StatusBadge>}
                        </div>
                        {s.log && (
                          <div className="text-xs text-muted-foreground font-mono mt-0.5 break-words">{s.log}</div>
                        )}

                        {s.gate && s.status === "waiting" && (
                          <div className="mt-2 space-y-2">
                            {isDataEngineer && (
                              <Textarea
                                value={skipReason}
                                onChange={(e) => setSkipReason(e.target.value)}
                                placeholder="Reason required to skip the quality gate…"
                                className="text-xs h-16"
                              />
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={isDataEngineer && !skipReason.trim()}
                                onClick={() => handleGate("approve", isDataEngineer ? skipReason.trim() : undefined)}
                              >
                                {isDataEngineer ? "Skip gate" : "Approve"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGate("reject")}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Orchestration;
