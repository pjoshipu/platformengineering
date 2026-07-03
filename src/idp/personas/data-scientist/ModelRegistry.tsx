import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SectionCard,
  Field,
  Loading,
  HorizontalBarChartCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getModels,
  getModel,
  getFeatureImportance,
  promoteModel,
  rollbackModel,
  type ModelSummary,
  type ModelVersion,
} from "./api";

const ModelRegistry = () => {
  const { data: models, loading } = useMockQuery(getModels, []);
  const list = models ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: detail } = useMockQuery(
    () => (selectedId ? getModel(selectedId) : Promise.resolve(undefined)),
    [selectedId]
  );
  const { data: features } = useMockQuery(
    () =>
      selectedId && detail
        ? getFeatureImportance(selectedId, detail.latest_version ?? "")
        : Promise.resolve([]),
    [selectedId]
  );

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteJustification, setPromoteJustification] = useState("");
  const [promoteEnv, setPromoteEnv] = useState("Prod");
  const [rollbackTarget, setRollbackTarget] = useState<ModelVersion | null>(null);

  // Auto-select first model once loaded.
  useEffect(() => {
    if (!selectedId && list.length) setSelectedId(list[0].id);
  }, [selectedId, list]);

  const versionColumns: Column<ModelVersion>[] = [
    { key: "version", header: "Version", render: (v) => <span className="font-mono text-xs">{v.version}</span> },
    { key: "dataset", header: "Trained on", render: (v) => <span className="font-mono text-xs">{v.dataset}</span> },
    { key: "auc", header: "AUC", sortable: true, render: (v) => v.auc.toFixed(3) },
    { key: "f1", header: "F1", sortable: true, render: (v) => v.f1.toFixed(3) },
    { key: "deployed_to", header: "Deployed to", render: (v) => <StatusBadge tone="neutral">{v.deployed_to}</StatusBadge> },
    { key: "deployed_by", header: "Deployed by" },
    { key: "date", header: "Date", sortable: true, accessor: (v) => v.date, render: (v) => timeAgo(v.date) },
    {
      key: "actions",
      header: "Actions",
      render: (v) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setRollbackTarget(v)}>Rollback</Button>
          <Button variant="ghost" size="sm" onClick={() => toast(`Comparing ${v.version}`)}>Compare</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Model Registry"
        description="Browse registered models, inspect versions and lineage, promote and roll back."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Model list */}
        <div className="space-y-2">
          {loading ? (
            <Loading label="Loading models…" />
          ) : (
            list.map((m: ModelSummary) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors",
                  selectedId === m.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{m.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{m.latest_version}</span>
                </div>
                <div className="mt-1">
                  <StatusBadge>{m.status}</StatusBadge>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Model detail */}
        <div className="min-w-0 space-y-6">
          {!detail ? (
            <Loading label="Select a model" />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{detail.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {detail.framework} · owner {detail.owner}
                  </p>
                </div>
                <div className="flex gap-2">
                  {detail.status === "In staging" && (
                    <Button onClick={() => setPromoteOpen(true)}>Promote</Button>
                  )}
                  <Button variant="outline" onClick={() => toast.success(`Archived ${detail.name}`)}>Archive</Button>
                </div>
              </div>

              <SectionCard title="Versions">
                <DataTable
                  columns={versionColumns}
                  rows={detail.versions}
                  rowKey={(v) => v.id}
                  defaultSort={{ key: "date", dir: "desc" }}
                />
              </SectionCard>

              <SectionCard title="Lineage">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {[
                    detail.lineage.dataset,
                    detail.lineage.training_job,
                    detail.lineage.model_version,
                    detail.lineage.endpoint,
                  ].map((node, i, arr) => (
                    <div key={node} className="flex items-center gap-2">
                      <Card className="px-3 py-1.5 font-mono text-xs">{node}</Card>
                      {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <HorizontalBarChartCard
                title="Feature importance (top 10)"
                data={features ?? []}
              />
            </>
          )}
        </div>
      </div>

      {/* Promote modal */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote {detail?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Target environment">
              <Select value={promoteEnv} onValueChange={setPromoteEnv}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staging">Staging</SelectItem>
                  <SelectItem value="Prod">Prod</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Justification" required>
              <Textarea
                value={promoteJustification}
                onChange={(e) => setPromoteJustification(e.target.value)}
                placeholder="Beats current prod model by +1.4 AUC on holdout…"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPromoteOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (promoteJustification.trim().length < 10) {
                  toast.error("Please add a justification");
                  return;
                }
                if (!selectedId) return;
                const { approval_id } = await promoteModel(selectedId, {
                  env: promoteEnv,
                  justification: promoteJustification,
                });
                toast.success(`Promotion requested — ${approval_id}`);
                setPromoteOpen(false);
                setPromoteJustification("");
              }}
            >
              Request promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback confirmation */}
      <Dialog open={!!rollbackTarget} onOpenChange={(o) => !o && setRollbackTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll back to {rollbackTarget?.version}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will redeploy {detail?.name} version {rollbackTarget?.version} (trained on{" "}
            {rollbackTarget?.dataset}) to the serving endpoint. The current version stays in the registry.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRollbackTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selectedId || !rollbackTarget) return;
                await rollbackModel(selectedId, rollbackTarget.id);
                toast.success(`Rolling back to ${rollbackTarget.version}`);
                setRollbackTarget(null);
              }}
            >
              Confirm rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelRegistry;
