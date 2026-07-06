import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Database,
  Boxes,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  Field,
  SectionCard,
  StatusBadge,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import {
  getSourceConfigSchema,
  createPipeline,
  testRunPipeline,
  type TestRunResult,
} from "./api";

type TriggerType = "Schedule" | "Event-based" | "Manual";
type TransformType = "SQL transform" | "Script" | "Data model" | "Join" | "Filter" | "Aggregate" | "Deduplicate";
type CheckType = "Not null" | "Unique" | "Value range" | "Custom query";

interface TransformStep {
  id: string;
  type: TransformType;
  config: string;
}

interface QualityCheck {
  id: string;
  type: CheckType;
  column: string;
  threshold: number;
}

const SOURCE_TYPES = [
  { value: "postgres", label: "PostgreSQL" },
  { value: "bigquery", label: "BigQuery" },
  { value: "gcs", label: "GCS bucket" },
  { value: "s3", label: "S3 bucket" },
  { value: "kafka", label: "Kafka topic" },
];

const TRANSFORM_TYPES: TransformType[] = ["SQL transform", "Script", "Data model", "Join", "Filter", "Aggregate", "Deduplicate"];
const CHECK_TYPES: CheckType[] = ["Not null", "Unique", "Value range", "Custom query"];

let stepSeq = 0;
const nextId = (p: string) => `${p}_${stepSeq++}`;

/** Plain-language preview for a handful of common cron expressions. */
function describeCron(expr: string): string {
  const map: Record<string, string> = {
    "@hourly": "Every hour",
    "0 * * * *": "Every hour, on the hour",
    "0 2 * * *": "Every day at 02:00",
    "0 */4 * * *": "Every 4 hours",
    "0 0 * * 0": "Every Sunday at midnight",
  };
  return map[expr.trim()] ?? "Custom schedule (advanced cron)";
}

function transformConfigHint(t: TransformType): { label: string; placeholder: string; mono: boolean } {
  switch (t) {
    case "SQL transform":
      return { label: "SQL", placeholder: "SELECT customer_id, SUM(amount) AS total\nFROM {{input}}\nGROUP BY 1", mono: true };
    case "Script":
      return { label: "Python script", placeholder: "def transform(df):\n    return df.dropna()", mono: true };
    case "Data model":
      return { label: "dbt model ref", placeholder: "ref('stg_orders')", mono: true };
    case "Join":
      return { label: "Join condition", placeholder: "LEFT JOIN customers ON orders.cust_id = customers.id", mono: true };
    case "Filter":
      return { label: "Filter expression", placeholder: "status = 'complete' AND amount > 0", mono: true };
    case "Aggregate":
      return { label: "Aggregation", placeholder: "GROUP BY region; SUM(amount), COUNT(*)", mono: false };
    case "Deduplicate":
      return { label: "Dedup keys", placeholder: "order_id (keep latest by updated_at)", mono: false };
  }
}

const DagNode = ({ label, sub, icon }: { label: string; sub?: string; icon?: React.ReactNode }) => (
  <div className="flex min-w-[120px] flex-col items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-center shadow-sm">
    <div className="flex items-center gap-1 text-sm font-medium">
      {icon}
      <span className="truncate max-w-[110px]">{label}</span>
    </div>
    {sub && <span className="font-mono text-[10px] text-muted-foreground">{sub}</span>}
  </div>
);

const PipelineBuilder = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>("Schedule");
  const [schedule, setSchedule] = useState("0 2 * * *");
  const [eventType, setEventType] = useState("file arrival");

  const [sourceType, setSourceType] = useState("postgres");
  const [sourceConfig, setSourceConfig] = useState<Record<string, string>>({});
  const { data: sourceSchema } = useMockQuery(
    () => getSourceConfigSchema(sourceType),
    [sourceType]
  );

  const [steps, setSteps] = useState<TransformStep[]>([
    { id: nextId("t"), type: "SQL transform", config: "" },
  ]);

  const [destType, setDestType] = useState("bigquery");
  const [destConfig, setDestConfig] = useState("analytics.my_output");
  const [writeMode, setWriteMode] = useState("Overwrite");

  const [checks, setChecks] = useState<QualityCheck[]>([
    { id: nextId("c"), type: "Not null", column: "id", threshold: 100 },
  ]);

  const [failureAction, setFailureAction] = useState("Alert only");

  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ---- step editing helpers ----
  const addStep = () => setSteps((s) => [...s, { id: nextId("t"), type: "SQL transform", config: "" }]);
  const removeStep = (id: string) => setSteps((s) => s.filter((x) => x.id !== id));
  const updateStep = (id: string, patch: Partial<TransformStep>) =>
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const moveStep = (i: number, dir: -1 | 1) =>
    setSteps((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const copy = [...s];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const addCheck = () => setChecks((c) => [...c, { id: nextId("c"), type: "Not null", column: "", threshold: 100 }]);
  const removeCheck = (id: string) => setChecks((c) => c.filter((x) => x.id !== id));
  const updateCheck = (id: string, patch: Partial<QualityCheck>) =>
    setChecks((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const triggerSummary =
    trigger === "Schedule"
      ? describeCron(schedule)
      : trigger === "Event-based"
      ? `On ${eventType}`
      : "Manual trigger";

  const buildConfig = () => ({
    name,
    trigger: { type: trigger, schedule, eventType },
    source: { type: sourceType, config: sourceConfig },
    transforms: steps.map((s) => ({ type: s.type, config: s.config })),
    output: { type: destType, config: destConfig, write_mode: writeMode },
    checks: checks.map((c) => ({ type: c.type, column: c.column, threshold: c.threshold })),
    failure_action: failureAction,
  });

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testRunPipeline({ checks: checks.map((c) => ({ column: c.column, type: c.type })) });
    setTestResult(res);
    setTesting(false);
    toast[res.status === "passed" ? "success" : "error"](`Test run ${res.status}`);
  };

  const submit = async () => {
    if (!name) {
      toast.error("Pipeline name is required");
      return;
    }
    setSubmitting(true);
    const { pipeline_id } = await createPipeline(buildConfig());
    setSubmitting(false);
    toast.success(`Pipeline ${pipeline_id} created`);
    navigate("/data-engineer/dashboard");
  };

  const shortSource = useMemo(
    () => SOURCE_TYPES.find((s) => s.value === sourceType)?.label ?? sourceType,
    [sourceType]
  );

  return (
    <div>
      <PageHeader
        title="Pipeline Builder"
        description="Build & schedule a data pipeline. Compose a source, transformations, output and quality checks, then test-run on a sample."
        backTo="/data-engineer/dashboard"
        backLabel="Dashboard"
      />

      {/* Live DAG preview */}
      <SectionCard title="Pipeline DAG preview" description={`${triggerSummary} · updates live as you edit the steps below.`}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <DagNode label={shortSource} sub={sourceConfig.table || sourceConfig.topic || sourceConfig.prefix} icon={<Database className="w-3.5 h-3.5" />} />
          {steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
              <DagNode label={s.type} />
            </div>
          ))}
          <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
          <DagNode label={destType} sub={destConfig} icon={<Boxes className="w-3.5 h-3.5" />} />
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left column: identity + trigger + source */}
        <div className="space-y-4">
          <Field label="Pipeline name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="orders_daily_agg" />
          </Field>

          <SectionCard title="Trigger">
            <Field label="Trigger type">
              <Select value={trigger} onValueChange={(v) => setTrigger(v as TriggerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Schedule">Schedule</SelectItem>
                  <SelectItem value="Event-based">Event-based</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {trigger === "Schedule" && (
              <Field label="Schedule expression" hint={describeCron(schedule)} className="mt-3">
                <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} className="font-mono text-sm" />
              </Field>
            )}
            {trigger === "Event-based" && (
              <Field label="Event type" className="mt-3">
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file arrival">File arrival</SelectItem>
                    <SelectItem value="message queue">Message queue</SelectItem>
                    <SelectItem value="API call">API call</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </SectionCard>

          <SectionCard title="Source">
            <Field label="Source type">
              <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setSourceConfig({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="mt-3 space-y-3">
              {(sourceSchema?.fields ?? []).map((f) => (
                <Field key={f.name} label={f.label}>
                  {f.type === "select" ? (
                    <Select
                      value={sourceConfig[f.name] ?? ""}
                      onValueChange={(v) => setSourceConfig((c) => ({ ...c, [f.name]: v }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={sourceConfig[f.name] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => setSourceConfig((c) => ({ ...c, [f.name]: e.target.value }))}
                      className="font-mono text-sm"
                    />
                  )}
                </Field>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Output">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Destination type">
                <Select value={destType} onValueChange={setDestType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Write mode">
                <Select value={writeMode} onValueChange={setWriteMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Append">Append</SelectItem>
                    <SelectItem value="Overwrite">Overwrite</SelectItem>
                    <SelectItem value="Merge">Merge</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Destination path / table" className="mt-3">
              <Input value={destConfig} onChange={(e) => setDestConfig(e.target.value)} className="font-mono text-sm" />
            </Field>
          </SectionCard>

          <SectionCard title="Failure action">
            <Field label="On failure">
              <Select value={failureAction} onValueChange={setFailureAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alert only">Alert only</SelectItem>
                  <SelectItem value="Halt pipeline">Halt pipeline</SelectItem>
                  <SelectItem value="Skip output">Skip output</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </SectionCard>
        </div>

        {/* Right column: transforms + quality checks + test run */}
        <div className="space-y-4">
          <SectionCard
            title="Transformations"
            description="Ordered steps applied in sequence."
            actions={<Button variant="outline" size="sm" onClick={addStep}><Plus className="w-4 h-4 mr-1" />Add step</Button>}
          >
            <div className="space-y-3">
              {steps.map((s, i) => {
                const hint = transformConfigHint(s.type);
                return (
                  <div key={s.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                      <Select value={s.type} onValueChange={(v) => updateStep(s.id, { type: v as TransformType })}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TRANSFORM_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => moveStep(i, -1)} disabled={i === 0}><ChevronUp className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}><ChevronDown className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeStep(s.id)}><X className="w-4 h-4" /></Button>
                    </div>
                    <Field label={hint.label} className="mt-3">
                      <Textarea
                        value={s.config}
                        onChange={(e) => updateStep(s.id, { config: e.target.value })}
                        placeholder={hint.placeholder}
                        className={hint.mono ? "font-mono text-xs h-24" : "text-sm h-20"}
                      />
                    </Field>
                  </div>
                );
              })}
              {steps.length === 0 && <div className="text-sm text-muted-foreground">No transforms — source passes straight to output.</div>}
            </div>
          </SectionCard>

          <SectionCard
            title="Data quality checks"
            actions={<Button variant="outline" size="sm" onClick={addCheck}><Plus className="w-4 h-4 mr-1" />Add check</Button>}
          >
            <div className="space-y-2">
              {checks.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <Select value={c.type} onValueChange={(v) => updateCheck(c.id, { type: v as CheckType })}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHECK_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={c.column}
                    placeholder="column"
                    onChange={(e) => updateCheck(c.id, { column: e.target.value })}
                    className="font-mono text-sm flex-1"
                  />
                  <Input
                    type="number"
                    value={c.threshold}
                    onChange={(e) => updateCheck(c.id, { threshold: +e.target.value })}
                    className="w-20"
                    title="Pass threshold %"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <Button variant="ghost" size="icon" onClick={() => removeCheck(c.id)}><X className="w-4 h-4" /></Button>
                </div>
              ))}
              {checks.length === 0 && <div className="text-sm text-muted-foreground">No quality checks configured.</div>}
            </div>
          </SectionCard>

          <SectionCard
            title="Test run"
            description="Dry-run on a 1,000-row sample and preview quality results."
            actions={<Button variant="outline" size="sm" onClick={runTest} disabled={testing}>{testing ? "Running…" : "Test run"}</Button>}
          >
            {!testResult && !testing && <div className="text-sm text-muted-foreground">Run a test to see quality-check results here.</div>}
            {testing && <div className="text-sm text-muted-foreground">Executing on sample…</div>}
            {testResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  Overall: <StatusBadge>{testResult.status === "passed" ? "Pass" : "Failed"}</StatusBadge>
                </div>
                {testResult.quality_results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-border px-2 py-1.5 text-sm">
                    <span className="flex items-center gap-2">
                      {r.passed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-destructive" />}
                      {r.check}
                    </span>
                    <span className="text-xs text-muted-foreground">{r.failed_rows} failed rows</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <Button className="w-full" onClick={submit} disabled={submitting}>
            {submitting ? "Creating…" : "Create pipeline"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PipelineBuilder;
