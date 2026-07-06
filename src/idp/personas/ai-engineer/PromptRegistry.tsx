import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  Field,
  DiffViewer,
  LineChartCard,
  type Column,
  type Tone,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getApps,
  getApp,
  getPrompts,
  getPromptSparklines,
  evalPrompt,
  deployPrompt,
  rollbackPrompt,
  type LlmApp,
  type PromptVersion,
} from "./api";

// --- Landing: list apps → prompts/:appId -----------------------------------

const PromptRegistryLanding = () => {
  const navigate = useNavigate();
  const { data: apps, loading } = useMockQuery(getApps, []);
  const columns: Column<LlmApp>[] = [
    { key: "name", header: "App", render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "type", header: "Type" },
    { key: "version", header: "Prod version", render: (a) => <span className="font-mono text-xs">{a.version}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
    { key: "faithfulness", header: "Faithfulness", align: "right", render: (a) => `${(a.faithfulness * 100).toFixed(0)}%` },
  ];
  return (
    <div>
      <PageHeader title="Prompt Registry" description="Select an app to view its prompt version history, diffs, and eval metrics." />
      <DataTable
        columns={columns}
        rows={apps ?? []}
        rowKey={(a) => a.id}
        loading={loading}
        onRowClick={(a) => navigate(`/ai-engineer/prompts/${a.id}`)}
      />
    </div>
  );
};

// --- Detail: prompts/:appId ------------------------------------------------

const statusToneMap = (s: PromptVersion["status"]): Tone | undefined =>
  s === "Active in prod" ? undefined : s === "In canary" ? "warning" : s === "Rolled back" ? "danger" : "info";

const PromptRegistryDetail = ({ appId }: { appId: string }) => {
  const navigate = useNavigate();
  const { data: app } = useMockQuery(() => getApp(appId), [appId]);
  const { data: prompts, loading, refetch } = useMockQuery(() => getPrompts(appId), [appId]);
  const list = prompts ?? [];
  const prod = list.find((p) => p.status === "Active in prod");

  const [selected, setSelected] = useState<PromptVersion | null>(null);
  const [proposing, setProposing] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<PromptVersion | null>(null);

  // propose-change state
  const [draftText, setDraftText] = useState("");
  const [draftVersion, setDraftVersion] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [evalResult, setEvalResult] = useState<Awaited<ReturnType<typeof evalPrompt>> | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const { data: sparks } = useMockQuery(
    () => (selected ? getPromptSparklines(appId, selected.version) : Promise.resolve(undefined)),
    [selected?.version]
  );

  const openPropose = () => {
    setDraftText(prod?.prompt_text ?? "");
    const bump = () => {
      const m = prod?.version.match(/v(\d+)\.(\d+)\.(\d+)/);
      if (!m) return "v1.0.0";
      return `v${m[1]}.${+m[2] + 1}.0`;
    };
    setDraftVersion(bump());
    setDraftSummary("");
    setEvalResult(null);
    setProposing(true);
  };

  const runEval = async () => {
    setEvaluating(true);
    const res = await evalPrompt(appId, draftText);
    setEvalResult(res);
    setEvaluating(false);
  };

  const submitCanary = async () => {
    if (!draftSummary) {
      toast.error("Add a change summary");
      return;
    }
    const { canary_id } = await deployPrompt(appId);
    toast.success(`Submitted ${draftVersion} for canary`);
    setProposing(false);
    navigate(`/ai-engineer/canary/${canary_id}`);
  };

  const doRollback = async () => {
    if (!rollbackTarget) return;
    await rollbackPrompt(appId);
    toast.success(`Rolled back to ${rollbackTarget.version}`);
    setRollbackTarget(null);
    refetch();
  };

  const columns: Column<PromptVersion>[] = [
    { key: "version", header: "Version", render: (p) => <span className="font-mono text-xs">{p.version}</span> },
    { key: "summary", header: "Summary", render: (p) => <span className="max-w-xs truncate inline-block align-middle">{p.summary}</span> },
    { key: "deployed_by", header: "Deployed by" },
    { key: "date", header: "Date", sortable: true, accessor: (p) => p.date, render: (p) => timeAgo(p.date) },
    { key: "status", header: "Status", render: (p) => <StatusBadge tone={statusToneMap(p.status)}>{p.status}</StatusBadge> },
    { key: "faithfulness", header: "Faithfulness", align: "right", sortable: true, accessor: (p) => p.faithfulness, render: (p) => `${(p.faithfulness * 100).toFixed(0)}%` },
    { key: "hallucination", header: "Hallucination", align: "right", render: (p) => `${(p.hallucination * 100).toFixed(1)}%` },
    { key: "latency", header: "Latency", align: "right", render: (p) => `${p.latency}ms` },
    { key: "cost_per_call", header: "Cost/call", align: "right", render: (p) => `$${p.cost_per_call.toFixed(4)}` },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>View</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>Compare</Button>
          {p.status !== "Active in prod" && (
            <Button variant="ghost" size="sm" onClick={() => setRollbackTarget(p)}>Rollback</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Prompt Registry — ${app?.name ?? appId}`}
        description="Version history, diffs against prod, and eval metrics."
        backTo="/ai-engineer/prompts"
        backLabel="All apps"
        actions={
          <div className="flex items-center gap-2">
            {prod && <StatusBadge>{`prod ${prod.version}`}</StatusBadge>}
            <Button onClick={openPropose}>Propose change</Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={list}
        rowKey={(p) => p.version}
        loading={loading}
        onRowClick={(p) => setSelected(p)}
      />

      {/* Prompt detail drawer */}
      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.version}` : ""}
        description={selected?.summary}
        wide
      >
        {selected && (
          <>
            <SectionCard title="Full prompt">
              <pre className="rounded-lg border border-border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap">{selected.prompt_text}</pre>
            </SectionCard>
            {prod && selected.version !== prod.version && (
              <SectionCard title={`Diff vs prod (${prod.version})`}>
                <DiffViewer before={prod.prompt_text} after={selected.prompt_text} beforeLabel="prod" afterLabel={selected.version} />
              </SectionCard>
            )}
            <div className="grid gap-3">
              <LineChartCard title="Faithfulness (7d)" data={sparks?.faithfulness ?? []} series={[{ key: "value", label: "faithfulness" }]} height={140} />
              <LineChartCard title="Hallucination rate (7d)" data={sparks?.hallucination ?? []} series={[{ key: "value", label: "hallucination" }]} height={140} />
              <LineChartCard title="Cost/call (7d)" data={sparks?.cost ?? []} series={[{ key: "value", label: "cost" }]} height={140} />
            </div>
          </>
        )}
      </SideDrawer>

      {/* Propose change drawer */}
      <SideDrawer open={proposing} onOpenChange={setProposing} title="Propose prompt change" wide>
        <Field label="Prompt template" hint="Pre-filled with current prod — edit freely" required>
          <Textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} className="font-mono text-xs h-56" />
        </Field>
        <Field label="Version label">
          <Input value={draftVersion} onChange={(e) => setDraftVersion(e.target.value)} className="font-mono text-sm" />
        </Field>
        <Field label="Change summary" required>
          <Textarea value={draftSummary} onChange={(e) => setDraftSummary(e.target.value)} className="h-20" placeholder="What changed and why" />
        </Field>

        <div className="flex gap-2">
          <Button variant="outline" onClick={runEval} disabled={evaluating}>
            {evaluating ? "Running eval…" : "Run eval preview"}
          </Button>
          <Button onClick={submitCanary}>Submit for canary</Button>
        </div>

        {evalResult && (
          <SectionCard title="Eval preview (sample test set)">
            <div className="flex gap-6 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Faithfulness</div>
                <div className="text-xl font-bold text-green-600">{(evalResult.faithfulness * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Hallucination rate</div>
                <div className="text-xl font-bold">{(evalResult.hallucination_rate * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="space-y-2">
              {evalResult.sample_outputs.map((s, i) => (
                <div key={i} className="rounded-lg border border-border p-2 text-xs">
                  <div className="text-muted-foreground">{s.input}</div>
                  <div className="font-mono mt-1">{s.output}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </SideDrawer>

      {/* Rollback modal */}
      <Dialog open={!!rollbackTarget} onOpenChange={(o) => !o && setRollbackTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll back to {rollbackTarget?.version}?</DialogTitle>
            <DialogDescription>
              This will make <span className="font-mono">{rollbackTarget?.version}</span> the active prod prompt and
              displace <span className="font-mono">{prod?.version}</span>. In-flight canaries for this app will be halted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRollbackTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doRollback}>Confirm rollback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PromptRegistry = () => {
  const { appId } = useParams<{ appId: string }>();
  if (!appId) return <PromptRegistryLanding />;
  return <PromptRegistryDetail appId={appId} />;
};

export default PromptRegistry;
export { PromptRegistryLanding };
