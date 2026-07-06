import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SectionCard,
  Field,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getApps,
  getApp,
  getGuardrails,
  getGuardrailIncidents,
  toggleGuardrail,
  saveGuardrail,
  testGuardrail,
  type LlmApp,
  type Guardrail,
  type GuardrailIncident,
} from "./api";

// --- Landing ---------------------------------------------------------------

const GuardrailsLanding = () => {
  const navigate = useNavigate();
  const { data: apps, loading } = useMockQuery(getApps, []);
  const columns: Column<LlmApp>[] = [
    { key: "name", header: "App", render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "type", header: "Type" },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
  ];
  return (
    <div>
      <PageHeader title="Guardrails" description="Select an app to configure its safety, cost, and quality guardrails." />
      <DataTable columns={columns} rows={apps ?? []} rowKey={(a) => a.id} loading={loading} onRowClick={(a) => navigate(`/ai-engineer/guardrails/${a.id}`)} />
    </div>
  );
};

// --- Guardrail config editor (varies by type) ------------------------------

const GuardrailConfig = ({ g, onSave }: { g: Guardrail; onSave: (config: Record<string, unknown>) => void }) => {
  const [config, setConfig] = useState<Record<string, unknown>>({ ...g.config });
  const set = (patch: Record<string, unknown>) => setConfig((c) => ({ ...c, ...patch }));

  const patterns = (config.patterns as string[]) ?? [];
  const togglePattern = (p: string) =>
    set({ patterns: patterns.includes(p) ? patterns.filter((x) => x !== p) : [...patterns, p] });

  return (
    <div className="space-y-3">
      {g.type === "PII Detection" && (
        <Field label="Detected patterns">
          <div className="flex flex-wrap gap-4">
            {["email", "phone", "ssn", "credit card", "custom"].map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <Checkbox checked={patterns.includes(p)} onCheckedChange={() => togglePattern(p)} />
                {p}
              </label>
            ))}
          </div>
        </Field>
      )}

      {g.type === "Topic Restriction" && (
        <>
          <Field label="Blocked topics (comma-separated)">
            <Input value={(config.blocked_topics as string[])?.join(", ") ?? ""} onChange={(e) => set({ blocked_topics: e.target.value.split(",").map((s) => s.trim()) })} />
          </Field>
          <Field label="Action">
            <Select value={String(config.action ?? "Block")} onValueChange={(v) => set({ action: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Block", "Redirect", "Warn"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </>
      )}

      {g.type === "Cost Cap" && (
        <>
          <Field label="Threshold ($ per call)">
            <Input type="number" step="0.01" value={Number(config.threshold ?? 0.05)} onChange={(e) => set({ threshold: +e.target.value })} />
          </Field>
          <Field label="Action">
            <Select value={String(config.action ?? "Reject")} onValueChange={(v) => set({ action: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Truncate context", "Reject", "Warn"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </>
      )}

      {g.type === "Hallucination Detector" && (
        <>
          <Field label={`Threshold: ${Number(config.threshold ?? 0.15).toFixed(2)}`}>
            <Slider value={[Number(config.threshold ?? 0.15)]} min={0} max={1} step={0.05} onValueChange={([v]) => set({ threshold: v })} className="mt-3" />
          </Field>
          <Field label="Mode">
            <Select value={String(config.mode ?? "Monitor")} onValueChange={(v) => set({ mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Block", "Monitor"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </>
      )}

      {g.type === "Prompt Injection Guard" && (
        <Field label="Sensitivity">
          <Select value={String(config.sensitivity ?? "Medium")} onValueChange={(v) => set({ sensitivity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["Low", "Medium", "High"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}

      {g.type === "Output Length Limit" && (
        <Field label="Max token count">
          <Input type="number" value={Number(config.max_tokens ?? 1024)} onChange={(e) => set({ max_tokens: +e.target.value })} />
        </Field>
      )}

      <Button size="sm" onClick={() => onSave(config)}>Save</Button>
    </div>
  );
};

// --- Detail ----------------------------------------------------------------

const GuardrailsDetail = ({ appId }: { appId: string }) => {
  const { data: app } = useMockQuery(() => getApp(appId), [appId]);
  const { data: guardrails, loading, refetch } = useMockQuery(() => getGuardrails(appId), [appId]);
  const { data: incidents } = useMockQuery(() => getGuardrailIncidents(appId), [appId]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [testTarget, setTestTarget] = useState<Guardrail | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<Awaited<ReturnType<typeof testGuardrail>> | null>(null);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState("all");

  const list = guardrails ?? [];

  const toggle = async (g: Guardrail) => {
    await toggleGuardrail(appId, g.id, !g.enabled);
    toast.success(`${g.name} ${g.enabled ? "disabled" : "enabled"}`);
    refetch();
  };

  const runTest = async () => {
    if (!testTarget) return;
    const res = await testGuardrail(appId, testTarget.id, testInput);
    setTestResult(res);
  };

  const columns: Column<Guardrail>[] = [
    { key: "name", header: "Name", render: (g) => <span className="font-medium">{g.name}</span> },
    { key: "type", header: "Type" },
    {
      key: "enabled",
      header: "Enabled",
      render: (g) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={g.enabled} onCheckedChange={() => toggle(g)} />
        </div>
      ),
    },
    { key: "stats", header: "24h stats", render: (g) => `${g.stats_24h.triggers} triggers · ${g.stats_24h.false_positives} FP` },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (g) => (
        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => { setTestTarget(g); setTestInput(""); setTestResult(null); }}>Test</Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === g.id ? null : g.id)}>
            Configure {expanded === g.id ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      ),
    },
  ];

  const incidentTypes = Array.from(new Set((incidents ?? []).map((i) => i.guardrail_type)));
  const filteredIncidents = (incidents ?? []).filter((i) => incidentTypeFilter === "all" || i.guardrail_type === incidentTypeFilter);

  const incidentColumns: Column<GuardrailIncident>[] = [
    { key: "time", header: "Time", render: (i) => timeAgo(i.time) },
    { key: "guardrail_type", header: "Guardrail" },
    { key: "action", header: "Action taken", render: (i) => <StatusBadge tone={i.action.startsWith("Blocked") ? "danger" : "warning"}>{i.action}</StatusBadge> },
    { key: "sample_input", header: "Sample input", render: (i) => <span className="font-mono text-xs text-muted-foreground">{i.sample_input}</span> },
    { key: "details", header: "", align: "right", render: () => <Button variant="ghost" size="sm" onClick={() => toast("Opening incident details")}>Details</Button> },
  ];

  return (
    <div>
      <PageHeader
        title={`Guardrails — ${app?.name ?? appId}`}
        description="Enable, tune, and test the guardrails protecting this LLM app."
        backTo="/ai-engineer/guardrails"
        backLabel="All apps"
      />

      <DataTable columns={columns} rows={list} rowKey={(g) => g.id} loading={loading} />

      {/* Expanded config for whichever guardrail is open */}
      {expanded && (() => {
        const g = list.find((x) => x.id === expanded);
        if (!g) return null;
        return (
          <SectionCard title={`Configure — ${g.name}`} className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              {g.stats_24h.triggers} triggers / {g.stats_24h.false_positives} false positives in last 24h.
            </p>
            <GuardrailConfig g={g} onSave={async (config) => { await saveGuardrail(appId, g.id, config); toast.success(`${g.name} config saved`); }} />
            {g.stats_24h.samples.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground mb-1">Sample blocked outputs</div>
                <ul className="space-y-1">
                  {g.stats_24h.samples.map((s, i) => (
                    <li key={i} className="font-mono text-xs text-muted-foreground">• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        );
      })()}

      {/* Incident log */}
      <SectionCard
        title="Incident log"
        className="mt-6"
        actions={
          <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {incidentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        <DataTable columns={incidentColumns} rows={filteredIncidents} rowKey={(i) => i.time + i.guardrail_type} />
      </SectionCard>

      {/* Test modal */}
      <Dialog open={!!testTarget} onOpenChange={(o) => !o && setTestTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test guardrail — {testTarget?.name}</DialogTitle>
          </DialogHeader>
          <Field label="Sample input">
            <Textarea value={testInput} onChange={(e) => setTestInput(e.target.value)} className="h-24" placeholder="Enter text to test against this policy" />
          </Field>
          {testResult && (
            <div className={`rounded-lg border p-3 text-sm ${testResult.triggered ? "border-destructive/40 bg-destructive/10" : "border-green-500/40 bg-green-500/10"}`}>
              <div className="font-medium">{testResult.triggered ? "Triggered" : "Passed"}</div>
              <div className="text-xs text-muted-foreground mt-1">{testResult.reason}</div>
              <div className="text-xs mt-1">Action: <span className="font-medium">{testResult.action}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTestTarget(null)}>Close</Button>
            <Button onClick={runTest}>Run test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Guardrails = () => {
  const { appId } = useParams<{ appId: string }>();
  if (!appId) return <GuardrailsLanding />;
  return <GuardrailsDetail appId={appId} />;
};

export default Guardrails;
