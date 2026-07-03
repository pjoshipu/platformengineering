import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import {
  PageHeader,
  Wizard,
  Field,
  SectionCard,
  InfoList,
  type WizardStep,
} from "@/idp/components";
import { Loading } from "@/idp/components/states";
import { useMockQuery } from "@/idp/api/client";
import {
  getProviders,
  getVectorStores,
  deployLlmApp,
  getPipelineStatus,
  type PipelineStep,
} from "./api";

const APP_TYPES = ["RAG pipeline", "LLM API wrapper", "Agent service", "Embedding service"];
const ENVIRONMENTS = ["Dev", "Staging", "Staging to Prod with canary gate"];
const PII_PATTERNS = ["email", "phone", "SSN", "credit card"];

const StepIcon = ({ status }: { status: PipelineStep["status"] }) =>
  status === "success" ? (
    <CheckCircle2 className="w-4 h-4 text-green-600" />
  ) : status === "running" ? (
    <Loader2 className="w-4 h-4 text-primary animate-spin" />
  ) : status === "failed" ? (
    <Circle className="w-4 h-4 text-destructive" />
  ) : (
    <Circle className="w-4 h-4 text-muted-foreground/40" />
  );

const PIPELINE_PREVIEW = [
  "Validate app config",
  "Register prompt version",
  "Attach guardrails",
  "Provision vector store binding",
  "Deploy inference endpoint",
  "Warm-up eval on test set",
  "Route to canary gate",
  "App live",
];

const DeployLlmApp = () => {
  const { data: providers } = useMockQuery(getProviders, []);
  const { data: vectorStores } = useMockQuery(getVectorStores, []);

  // Step 1 — config
  const [name, setName] = useState("");
  const [type, setType] = useState("RAG pipeline");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [vectorStore, setVectorStore] = useState("None");
  const [maxTokens, setMaxTokens] = useState(1024);
  const [temperature, setTemperature] = useState(0.2);
  const [environment, setEnvironment] = useState("Dev");

  // Step 2 — prompt
  const [promptText, setPromptText] = useState(
    "You are a helpful assistant. Use the provided context to answer.\n\nContext:\n{context}\n\nQuestion: {question}"
  );
  const [promptVersion, setPromptVersion] = useState("v1.0.0");
  const [changeSummary, setChangeSummary] = useState("");

  // Step 3 — guardrails
  const [piiOn, setPiiOn] = useState(true);
  const [piiPatterns, setPiiPatterns] = useState<string[]>(["email", "SSN"]);
  const [topicOn, setTopicOn] = useState(false);
  const [blockedTopics, setBlockedTopics] = useState("legal advice, medical diagnosis");
  const [costCapOn, setCostCapOn] = useState(false);
  const [costCap, setCostCap] = useState(0.05);
  const [hallOn, setHallOn] = useState(true);
  const [hallMode, setHallMode] = useState("Monitor only");

  const [runId, setRunId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: status } = useMockQuery(
    () => (runId ? getPipelineStatus(runId) : Promise.resolve(undefined)),
    [runId]
  );

  const providerList = providers ?? [];
  const selectedProvider = providerList.find((p) => p.id === providerId);
  const models = selectedProvider?.models ?? [];
  const selectedModel = models.find((m) => m.id === modelId);

  // Live estimated cost per 1,000 calls.
  const estCostPer1k = useMemo(() => {
    if (!selectedModel) return null;
    // assume prompt+completion ≈ maxTokens per call
    const tokensPerCall = maxTokens;
    const costPerCall = (tokensPerCall / 1000) * selectedModel.cost_per_1k_tokens;
    return costPerCall * 1000;
  }, [selectedModel, maxTokens]);

  const changeProvider = (id: string) => {
    setProviderId(id);
    const p = providerList.find((x) => x.id === id);
    setModelId(p?.models[0]?.id ?? ""); // repopulate model list
  };

  const togglePattern = (p: string) =>
    setPiiPatterns((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const submit = async () => {
    setSubmitting(true);
    const { pipeline_run_id } = await deployLlmApp({
      name, type, providerId, modelId, vectorStore, maxTokens, temperature, environment,
      prompt: { text: promptText, version: promptVersion, summary: changeSummary },
      guardrails: { piiOn, piiPatterns, topicOn, blockedTopics, costCapOn, costCap, hallOn, hallMode },
    });
    setRunId(pipeline_run_id);
    setSubmitting(false);
    toast.success("Deployment pipeline started");
  };

  const steps: WizardStep[] = [
    {
      title: "App config",
      validate: () => (!name ? "App name is required" : !providerId ? "Select an LLM provider" : true),
      content: (
        <div className="space-y-4">
          <Field label="App name" hint="Must be unique across your workspace" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="support-rag" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="App type" required>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{APP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Target environment" required>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ENVIRONMENTS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="LLM provider" required>
              <Select value={providerId} onValueChange={changeProvider}>
                <SelectTrigger><SelectValue placeholder="Select provider…" /></SelectTrigger>
                <SelectContent>{providerList.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Model version" hint="Repopulates from provider" required>
              <Select value={modelId} onValueChange={setModelId} disabled={!selectedProvider}>
                <SelectTrigger><SelectValue placeholder="Select model…" /></SelectTrigger>
                <SelectContent>{models.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Vector store">
            <Select value={vectorStore} onValueChange={setVectorStore}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(vectorStores ?? ["None"]).map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Max tokens">
              <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(+e.target.value)} />
            </Field>
            <Field label={`Temperature: ${temperature.toFixed(2)}`}>
              <Slider value={[temperature]} min={0} max={1} step={0.05} onValueChange={([v]) => setTemperature(v)} className="mt-3" />
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: "Prompt",
      content: (
        <div className="space-y-4">
          <Field label="Initial prompt template" hint="Use {context} and {question} placeholders" required>
            <Textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} className="font-mono text-xs h-56" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prompt version label">
              <Input value={promptVersion} onChange={(e) => setPromptVersion(e.target.value)} className="font-mono text-sm" />
            </Field>
          </div>
          <Field label="Change summary">
            <Textarea value={changeSummary} onChange={(e) => setChangeSummary(e.target.value)} placeholder="Initial version" className="h-20" />
          </Field>
        </div>
      ),
    },
    {
      title: "Guardrails",
      content: (
        <div className="space-y-4">
          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">PII detection</div>
                <div className="text-xs text-muted-foreground">Redact sensitive patterns in inputs/outputs</div>
              </div>
              <Switch checked={piiOn} onCheckedChange={setPiiOn} />
            </div>
            {piiOn && (
              <div className="mt-3 flex flex-wrap gap-4">
                {PII_PATTERNS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={piiPatterns.includes(p)} onCheckedChange={() => togglePattern(p)} />
                    {p}
                  </label>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Topic restriction</div>
                <div className="text-xs text-muted-foreground">Block or redirect off-limits topics</div>
              </div>
              <Switch checked={topicOn} onCheckedChange={setTopicOn} />
            </div>
            {topicOn && (
              <div className="mt-3">
                <Field label="Blocked topics (comma-separated)">
                  <Input value={blockedTopics} onChange={(e) => setBlockedTopics(e.target.value)} />
                </Field>
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Cost cap per call</div>
                <div className="text-xs text-muted-foreground">Reject or truncate calls above a $ ceiling</div>
              </div>
              <Switch checked={costCapOn} onCheckedChange={setCostCapOn} />
            </div>
            {costCapOn && (
              <div className="mt-3">
                <Field label="Cap ($ per call)">
                  <Input type="number" step="0.01" value={costCap} onChange={(e) => setCostCap(+e.target.value)} />
                </Field>
              </div>
            )}
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Hallucination detector</div>
                <div className="text-xs text-muted-foreground">Score answers against retrieved context</div>
              </div>
              <Switch checked={hallOn} onCheckedChange={setHallOn} />
            </div>
            {hallOn && (
              <div className="mt-3">
                <Field label="Mode">
                  <Select value={hallMode} onValueChange={setHallMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Block">Block</SelectItem>
                      <SelectItem value="Monitor only">Monitor only</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
          </SectionCard>
        </div>
      ),
    },
    {
      title: "Review & submit",
      content: (
        <div className="space-y-4">
          <SectionCard title="Configuration">
            <InfoList
              items={[
                { label: "App name", value: name || "—" },
                { label: "Type", value: type },
                { label: "Provider", value: selectedProvider?.name ?? "—" },
                { label: "Model", value: <span className="font-mono text-xs">{selectedModel?.name ?? "—"}</span> },
                { label: "Vector store", value: vectorStore },
                { label: "Max tokens", value: maxTokens },
                { label: "Temperature", value: temperature.toFixed(2) },
                { label: "Environment", value: environment },
                { label: "Prompt version", value: <span className="font-mono text-xs">{promptVersion}</span> },
              ]}
            />
          </SectionCard>

          <SectionCard title="Guardrails">
            <InfoList
              items={[
                { label: "PII detection", value: piiOn ? piiPatterns.join(", ") || "on" : "off" },
                { label: "Topic restriction", value: topicOn ? blockedTopics : "off" },
                { label: "Cost cap", value: costCapOn ? `$${costCap.toFixed(2)}/call` : "off" },
                { label: "Hallucination detector", value: hallOn ? hallMode : "off" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Estimated cost">
            <div className="text-2xl font-bold tabular-nums">
              {estCostPer1k != null ? `$${estCostPer1k.toFixed(2)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              per 1,000 calls · {maxTokens} tokens/call at{" "}
              {selectedModel ? `$${selectedModel.cost_per_1k_tokens}/1k tokens` : "—"}
            </p>
          </SectionCard>

          <SectionCard title="Pipeline preview">
            <ol className="space-y-2">
              {PIPELINE_PREVIEW.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      ),
    },
  ];

  if (runId) {
    return (
      <div>
        <PageHeader
          title="Deployment status"
          description={`Pipeline run for ${name}`}
          backTo="/idp/ai-engineer/dashboard"
          backLabel="Dashboard"
        />
        <SectionCard title="Pipeline">
          {!status ? (
            <Loading label="Starting pipeline…" />
          ) : (
            <ol className="space-y-3">
              {status.steps.map((step) => (
                <li key={step.name} className="flex items-start gap-3">
                  <StepIcon status={step.status} />
                  <div>
                    <div className="text-sm font-medium">{step.name}</div>
                    {step.log && <div className="text-xs text-muted-foreground font-mono">{step.log}</div>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Deploy LLM App"
        description="Configure a new LLM application, its prompt, guardrails, and deploy it through the platform pipeline."
      />
      <Wizard steps={steps} onSubmit={submit} submitLabel="Submit deployment" submitting={submitting} />
    </div>
  );
};

export default DeployLlmApp;
