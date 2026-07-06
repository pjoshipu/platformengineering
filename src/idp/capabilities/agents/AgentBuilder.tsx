import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader, Wizard, Field, SectionCard, InfoList, StatusBadge, type WizardStep } from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getToolsRegistry,
  getLlmProviders,
  buildAgent,
  sandboxTest,
  CATEGORIES,
  SCOPES,
  PERSONA_NAMES,
  type Category,
  type Scope,
  type PermissionScope,
} from "./api";

// ---------------------------------------------------------------------------
// Local option lists
// ---------------------------------------------------------------------------

const ICONS = [
  "Code & Testing", "Data & ML", "Infrastructure", "Security",
  "Observability", "Collaboration", "Cost",
] as const;

const VISIBILITY = [
  { value: "marketplace", label: "Marketplace — submit for review" },
  { value: "custom", label: "Custom — team only" },
  { value: "private", label: "Private — just me" },
] as const;

const TRIGGER_TYPES = ["Manual", "Pipeline stage", "Schedule", "Event"] as const;
const EVENT_TYPES = [
  "PR opened", "PR merged", "Test failure", "Policy violation",
  "Data quality alert", "Drift detected", "Cost threshold",
  "Deployment complete", "Incident created",
] as const;

const INPUT_TYPES = ["string", "number", "boolean", "secret", "file path", "dataset path"] as const;
const INPUT_SOURCES = ["pipeline variable", "user input", "auto-detected"] as const;

const REASONING_PATTERNS = ["ReAct", "Plan then execute", "Reflection", "Single shot"] as const;
const MEMORY_MODES = ["None", "In-session only", "Persistent vector"] as const;

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const AUTH_TYPES = ["None", "API key", "OAuth", "Secret", "Connector"] as const;

const PER_STEP_RATE = 0.012; // $ per reasoning step for the simple estimate

interface InputRow {
  name: string;
  type: string;
  required: boolean;
  default: string;
  description: string;
  source: string;
}

interface CustomTool {
  name: string;
  permission_scope: PermissionScope;
  description: string;
}

const toneForScope = (scope: PermissionScope) =>
  scope === "Read-only" ? "success"
    : scope === "Write" ? "warning"
    : scope === "Sandboxed" ? "info"
    : "active"; // Scoped

const AgentBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const persona = user?.persona ?? "agentic-engineer";

  const { data: providers } = useMockQuery(getLlmProviders, []);
  const { data: toolsRegistry } = useMockQuery(getToolsRegistry, []);

  // --- Step 1: Identity ---
  const [name, setName] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [category, setCategory] = useState<Category | "">("");
  const [scope, setScope] = useState<Scope>(SCOPES[0]);
  const [personaTags, setPersonaTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<string>(VISIBILITY[0].value);

  // --- Step 2: Trigger ---
  const [triggerType, setTriggerType] = useState<string>(TRIGGER_TYPES[0]);
  const [pipelineStage, setPipelineStage] = useState("");
  const [scheduleExpr, setScheduleExpr] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [triggerFilter, setTriggerFilter] = useState("");

  // --- Step 3: Inputs ---
  const [inputs, setInputs] = useState<InputRow[]>([
    { name: "", type: "string", required: true, default: "", description: "", source: "user input" },
  ]);

  // --- Step 4: Agent Logic ---
  const [providerId, setProviderId] = useState("");
  const [model, setModel] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [reasoning, setReasoning] = useState<string>(REASONING_PATTERNS[0]);
  const [maxSteps, setMaxSteps] = useState(12);
  const [memory, setMemory] = useState<string>(MEMORY_MODES[1]);

  // --- Step 5: Tools ---
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customTools, setCustomTools] = useState<CustomTool[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [ctName, setCtName] = useState("");
  const [ctMethod, setCtMethod] = useState<string>(HTTP_METHODS[1]);
  const [ctEndpoint, setCtEndpoint] = useState("");
  const [ctAuth, setCtAuth] = useState<string>(AUTH_TYPES[1]);
  const [ctInputSchema, setCtInputSchema] = useState("");
  const [ctOutputSchema, setCtOutputSchema] = useState("");

  // --- Step 6: Safety ---
  const [costCap, setCostCap] = useState(2);
  const [blockedActions, setBlockedActions] = useState("Cannot push directly to the main branch\nCannot delete production resources");
  const [hitl, setHitl] = useState(true);
  const [hitlStep, setHitlStep] = useState(3);
  const [hitlPrompt, setHitlPrompt] = useState("Review the proposed change before it is applied.");
  const [rollback, setRollback] = useState(true);
  const [rollbackDesc, setRollbackDesc] = useState("Revert any partial writes and restore the prior state.");
  const [sandboxRequired, setSandboxRequired] = useState(true);

  // --- Step 7: Review ---
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<Awaited<ReturnType<typeof sandboxTest>> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const providerModels = useMemo(
    () => (providers ?? []).find((p) => p.id === providerId)?.models ?? [],
    [providers, providerId]
  );

  const estimatedCost = +(maxSteps * PER_STEP_RATE).toFixed(2);

  const togglePersona = (p: string) =>
    setPersonaTags((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const toggleTool = (id: string) =>
    setSelectedTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const updateInput = (i: number, patch: Partial<InputRow>) =>
    setInputs((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeInput = (i: number) => setInputs((prev) => prev.filter((_, idx) => idx !== i));
  const addInput = () =>
    setInputs((prev) => [
      ...prev,
      { name: "", type: "string", required: false, default: "", description: "", source: "user input" },
    ]);

  const addCustomTool = () => {
    if (!ctName.trim()) {
      toast.error("Custom tool needs a name");
      return;
    }
    const scopeForMethod: PermissionScope = ctMethod === "GET" ? "Scoped" : "Write";
    setCustomTools((prev) => [
      ...prev,
      { name: ctName.trim(), permission_scope: scopeForMethod, description: `${ctMethod} ${ctEndpoint || "custom endpoint"}`.trim() },
    ]);
    toast.success(`Custom tool “${ctName.trim()}” added`);
    setCtName(""); setCtEndpoint(""); setCtInputSchema(""); setCtOutputSchema("");
  };
  const removeCustomTool = (i: number) => setCustomTools((prev) => prev.filter((_, idx) => idx !== i));

  const buildBody = () => ({
    name,
    description_short: shortDesc,
    description_full: fullDesc,
    icon,
    category,
    scope,
    personas: personaTags,
    visibility,
    trigger: {
      type: triggerType,
      config:
        triggerType === "Pipeline stage" ? pipelineStage
          : triggerType === "Schedule" ? scheduleExpr
          : triggerType === "Event" ? eventType
          : "Manual",
      filter: triggerFilter || undefined,
    },
    inputs: inputs.filter((r) => r.name.trim()),
    logic: { provider: providerId, model, system_prompt: systemPrompt, reasoning, max_steps: maxSteps, memory },
    tools: {
      registry: selectedTools,
      custom: customTools,
    },
    safety: {
      cost_cap_usd: costCap,
      blocked_actions: blockedActions.split("\n").map((s) => s.trim()).filter(Boolean),
      human_checkpoint: hitl ? { enabled: true, at_step: hitlStep, reviewer_prompt: hitlPrompt } : { enabled: false },
      rollback_on_failure: rollback,
      rollback_description: rollback ? rollbackDesc : undefined,
      sandbox_required: sandboxRequired,
    },
  });

  const runSandbox = async () => {
    setSandboxRunning(true);
    try {
      const res = await sandboxTest(buildBody());
      setSandboxResult(res);
      toast.success(`Sandbox test complete — ${res.outcome}`);
    } catch {
      toast.error("Sandbox test failed to run");
    } finally {
      setSandboxRunning(false);
    }
  };

  const saveDraft = () => {
    toast.success(`Draft saved — “${name || "Untitled agent"}”`);
  };

  const publish = async () => {
    setSubmitting(true);
    try {
      const { agent_id } = await buildAgent(buildBody());
      toast.success(
        visibility === "marketplace"
          ? `Submitted to Marketplace for review (${agent_id})`
          : `Agent published (${agent_id})`
      );
      navigate(`/${persona}/agents`);
    } catch {
      toast.error("Failed to publish agent");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Steps
  // -------------------------------------------------------------------------

  const steps: WizardStep[] = [
    // 1 — Identity
    {
      title: "Identity",
      validate: () => (name.trim() && category ? true : "Agent name and category are required"),
      content: (
        <div className="space-y-4">
          <Field label="Agent name" required hint="Must be unique within your org.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="drift-root-cause-analyst" />
          </Field>
          <Field label="Short description">
            <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="One line shown on the marketplace card." />
          </Field>
          <Field label="Full description">
            <Textarea value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} placeholder="What the agent does, how it reasons, and what it acts on." rows={4} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Icon">
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category" required>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Scope">
              <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Visibility">
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBILITY.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Persona tags" hint="Who this agent is built for.">
            <div className="flex flex-wrap gap-2">
              {PERSONA_NAMES.map((p) => {
                const on = personaTags.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePersona(p)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                      (on
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/70")
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      ),
    },

    // 2 — Trigger
    {
      title: "Trigger",
      content: (
        <div className="space-y-4">
          <Field label="Trigger type">
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          {triggerType === "Pipeline stage" && (
            <Field label="Pipeline stage name">
              <Input value={pipelineStage} onChange={(e) => setPipelineStage(e.target.value)} placeholder="build-prod / test / deploy" />
            </Field>
          )}
          {triggerType === "Schedule" && (
            <Field label="Schedule expression" hint="Cron or plain language, e.g. “0 7 * * *” runs daily at 07:00.">
              <Input value={scheduleExpr} onChange={(e) => setScheduleExpr(e.target.value)} placeholder="0 7 * * *" />
            </Field>
          )}
          {triggerType === "Event" && (
            <Field label="Event type">
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Trigger filter" hint="Optional condition to narrow when the agent fires.">
            <Input value={triggerFilter} onChange={(e) => setTriggerFilter(e.target.value)} placeholder="branch == 'main' && labels contains 'agent'" />
          </Field>
        </div>
      ),
    },

    // 3 — Inputs
    {
      title: "Inputs",
      content: (
        <SectionCard title="Agent inputs" description="What the agent receives at runtime.">
          <div className="space-y-3">
            {inputs.map((row, i) => (
              <Card key={i} className="p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <Field label="Name">
                      <Input value={row.name} onChange={(e) => updateInput(i, { name: e.target.value })} placeholder="target" />
                    </Field>
                    <Field label="Type">
                      <Select value={row.type} onValueChange={(v) => updateInput(i, { type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INPUT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Default">
                      <Input value={row.default} onChange={(e) => updateInput(i, { default: e.target.value })} placeholder="—" />
                    </Field>
                    <Field label="Source">
                      <Select value={row.source} onValueChange={(v) => updateInput(i, { source: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INPUT_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Description" className="col-span-2">
                      <Input value={row.description} onChange={(e) => updateInput(i, { description: e.target.value })} placeholder="What this input is for." />
                    </Field>
                  </div>
                  <Button variant="ghost" size="icon" type="button" onClick={() => removeInput(i)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Required</span>
                  <Switch checked={row.required} onCheckedChange={(v) => updateInput(i, { required: v })} />
                </label>
              </Card>
            ))}
            <Button variant="outline" size="sm" type="button" onClick={addInput}>
              <Plus className="w-4 h-4 mr-1" /> Add input
            </Button>
          </div>
        </SectionCard>
      ),
    },

    // 4 — Agent Logic
    {
      title: "Agent Logic",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="LLM provider">
              <Select
                value={providerId}
                onValueChange={(v) => {
                  setProviderId(v);
                  setModel((providers ?? []).find((p) => p.id === v)?.models[0] ?? "");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {(providers ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select value={model} onValueChange={setModel} disabled={providerModels.length === 0}>
                <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                <SelectContent>
                  {providerModels.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="System prompt">
            <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={5} placeholder="You are a scoped worker agent that…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reasoning pattern">
              <Select value={reasoning} onValueChange={setReasoning}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONING_PATTERNS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Memory">
              <Select value={memory} onValueChange={setMemory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEMORY_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label={`Max steps: ${maxSteps}`} hint="Hard cap on plan→act→observe iterations.">
            <Slider value={[maxSteps]} min={1} max={40} step={1} onValueChange={([v]) => setMaxSteps(v)} />
          </Field>
        </div>
      ),
    },

    // 5 — Tools
    {
      title: "Tools",
      content: (
        <div className="space-y-4">
          <SectionCard title="Tool registry" description="Select the tools this agent may call.">
            <div className="space-y-2">
              {(toolsRegistry ?? []).map((t) => (
                <label key={t.id} className="flex items-start gap-3 rounded-lg border border-border p-2 cursor-pointer">
                  <Checkbox checked={selectedTools.includes(t.id)} onCheckedChange={() => toggleTool(t.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      <StatusBadge tone={toneForScope(t.permission_scope)}>{t.permission_scope}</StatusBadge>
                    </div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </SectionCard>

          {customTools.length > 0 && (
            <SectionCard title="Custom tools">
              <div className="space-y-2">
                {customTools.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.name}</span>
                        <StatusBadge tone={toneForScope(t.permission_scope)}>{t.permission_scope}</StatusBadge>
                      </div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </div>
                    <Button variant="ghost" size="icon" type="button" onClick={() => removeCustomTool(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <Card className="p-4">
            <button
              type="button"
              onClick={() => setCustomOpen((o) => !o)}
              className="flex w-full items-center gap-2 text-sm font-semibold"
            >
              {customOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              Define custom tool
            </button>
            {customOpen && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tool name">
                    <Input value={ctName} onChange={(e) => setCtName(e.target.value)} placeholder="trigger_refresh" />
                  </Field>
                  <Field label="HTTP method">
                    <Select value={ctMethod} onValueChange={setCtMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Endpoint URL" className="col-span-2">
                    <Input value={ctEndpoint} onChange={(e) => setCtEndpoint(e.target.value)} placeholder="https://api.internal/v1/refresh" />
                  </Field>
                  <Field label="Auth type">
                    <Select value={ctAuth} onValueChange={setCtAuth}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AUTH_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div />
                  <Field label="Input schema" className="col-span-2">
                    <Textarea value={ctInputSchema} onChange={(e) => setCtInputSchema(e.target.value)} rows={3} placeholder='{ "id": "string" }' className="font-mono text-xs" />
                  </Field>
                  <Field label="Output schema" className="col-span-2">
                    <Textarea value={ctOutputSchema} onChange={(e) => setCtOutputSchema(e.target.value)} rows={3} placeholder='{ "status": "string" }' className="font-mono text-xs" />
                  </Field>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={addCustomTool}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            )}
          </Card>
        </div>
      ),
    },

    // 6 — Safety
    {
      title: "Safety",
      content: (
        <div className="space-y-4">
          <Field label="Cost cap per execution ($)">
            <Input
              type="number"
              min={0}
              step={0.5}
              value={costCap}
              onChange={(e) => setCostCap(Number(e.target.value))}
            />
          </Field>
          <Field label="Blocked actions" hint="One per line.">
            <Textarea value={blockedActions} onChange={(e) => setBlockedActions(e.target.value)} rows={4} />
          </Field>

          <SectionCard title="Human-in-the-loop">
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Require human review at a checkpoint</span>
                <Switch checked={hitl} onCheckedChange={setHitl} />
              </label>
              {hitl && (
                <>
                  <Field label="Pause at step">
                    <Input type="number" min={1} value={hitlStep} onChange={(e) => setHitlStep(Number(e.target.value))} />
                  </Field>
                  <Field label="Reviewer prompt">
                    <Textarea value={hitlPrompt} onChange={(e) => setHitlPrompt(e.target.value)} rows={2} />
                  </Field>
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Rollback">
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Roll back on failure</span>
                <Switch checked={rollback} onCheckedChange={setRollback} />
              </label>
              {rollback && (
                <Field label="Describe rollback behavior">
                  <Textarea value={rollbackDesc} onChange={(e) => setRollbackDesc(e.target.value)} rows={2} />
                </Field>
              )}
            </div>
          </SectionCard>

          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-sm">Require a passing sandbox test before deploy</span>
            <Switch checked={sandboxRequired} onCheckedChange={setSandboxRequired} />
          </label>
        </div>
      ),
    },

    // 7 — Review & publish
    {
      title: "Review & publish",
      content: (
        <div className="space-y-4">
          <SectionCard title="Configuration summary">
            <InfoList
              items={[
                { label: "Name", value: name || "—" },
                { label: "Category / scope", value: `${category || "—"} · ${scope}` },
                { label: "Visibility", value: VISIBILITY.find((v) => v.value === visibility)?.label ?? visibility },
                { label: "Persona tags", value: personaTags.length ? personaTags.join(", ") : "—" },
                {
                  label: "Trigger",
                  value:
                    triggerType === "Pipeline stage" ? `Pipeline stage · ${pipelineStage || "—"}`
                      : triggerType === "Schedule" ? `Schedule · ${scheduleExpr || "—"}`
                      : triggerType === "Event" ? `Event · ${eventType}`
                      : "Manual",
                },
                { label: "Inputs", value: `${inputs.filter((r) => r.name.trim()).length} defined` },
                { label: "Model", value: providerId ? `${(providers ?? []).find((p) => p.id === providerId)?.name} · ${model || "—"}` : "—" },
                { label: "Reasoning / memory", value: `${reasoning} · ${memory}` },
                { label: "Tools", value: `${selectedTools.length + customTools.length} selected` },
                { label: "Max steps", value: String(maxSteps) },
                { label: "Cost cap", value: `$${costCap.toFixed(2)} / run` },
                { label: "Human-in-the-loop", value: hitl ? `at step ${hitlStep}` : "off" },
                { label: "Rollback on failure", value: rollback ? "on" : "off" },
                { label: "Sandbox required", value: sandboxRequired ? "yes" : "no" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Estimated cost per execution">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">${estimatedCost.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">
                ({maxSteps} steps × ${PER_STEP_RATE.toFixed(3)}/step) — capped at ${costCap.toFixed(2)}
              </span>
            </div>
          </SectionCard>

          <SectionCard
            title="Sandbox test"
            description="Dry-run the agent against a mock environment before publishing."
            actions={
              <Button size="sm" variant="outline" type="button" onClick={runSandbox} disabled={sandboxRunning}>
                {sandboxRunning ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Running…</> : "Run sandbox test"}
              </Button>
            }
          >
            {!sandboxResult ? (
              <p className="text-sm text-muted-foreground">No sandbox run yet.</p>
            ) : (
              <div className="space-y-3">
                <ol className="space-y-2">
                  {sandboxResult.trace.map((t) => (
                    <li key={t.step} className="flex items-start gap-3 rounded-lg border border-border p-2 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">{t.step}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{t.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.tool_called !== "—" ? `${t.tool_called} — ` : ""}{t.result}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">${t.cost.toFixed(3)}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex items-center justify-between">
                  <StatusBadge tone={sandboxResult.outcome === "Success" ? "success" : "danger"}>
                    {sandboxResult.outcome}
                  </StatusBadge>
                  <span className="text-sm font-medium">Total: ${sandboxResult.total_cost.toFixed(3)}</span>
                </div>
              </div>
            )}
          </SectionCard>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" type="button" onClick={saveDraft} disabled={submitting}>
              Save as draft
            </Button>
            <Button type="button" onClick={publish} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit to Marketplace"}
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Custom Agent Builder"
        description="Configure a new agent — identity, trigger, inputs, logic, tools, and safety — then sandbox-test and publish."
        backTo={`/${persona}/agents`}
        backLabel="Agent Marketplace"
      />
      <Wizard steps={steps} onSubmit={publish} submitLabel="Publish" submitting={submitting} />
    </div>
  );
};

export default AgentBuilder;
