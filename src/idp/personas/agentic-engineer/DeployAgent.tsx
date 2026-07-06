import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { PageHeader, Wizard, Field, SectionCard, InfoList, type WizardStep } from "@/idp/components";
import { Loading } from "@/idp/components/states";
import { useMockQuery } from "@/idp/api/client";
import {
  getRuntimes,
  getAvailableTools,
  deployAgent,
  getAgentDeployStatus,
  type DeployStep,
} from "./api";

const StepIcon = ({ status }: { status: DeployStep["status"] }) =>
  status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-600" />
    : status === "running" ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
    : status === "failed" ? <Circle className="w-4 h-4 text-destructive" />
    : <Circle className="w-4 h-4 text-muted-foreground/40" />;

const AUTONOMY_LEVELS = ["Low", "Medium", "High"] as const;

const DeployAgent = () => {
  const { data: runtimes } = useMockQuery(getRuntimes, []);
  const { data: tools } = useMockQuery(getAvailableTools, []);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [runtime, setRuntime] = useState("Claude Agent SDK");
  const [model, setModel] = useState("claude-3.5-sonnet");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [autonomy, setAutonomy] = useState<(typeof AUTONOMY_LEVELS)[number]>("Medium");
  const [maxSteps, setMaxSteps] = useState(15);
  const [maxCost, setMaxCost] = useState(2);
  const [hitlTools, setHitlTools] = useState(true);
  const [hitlWrites, setHitlWrites] = useState(true);
  const [hitlSpend, setHitlSpend] = useState(false);

  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const { data: status } = useMockQuery(
    () => (deploymentId ? getAgentDeployStatus(deploymentId) : Promise.resolve(undefined)),
    [deploymentId]
  );

  const toggleTool = (id: string) =>
    setSelectedTools((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const submit = async () => {
    const { deployment_id } = await deployAgent({ name, goal, runtime, model, selectedTools, autonomy, maxSteps, maxCost });
    setDeploymentId(deployment_id);
    toast.success("Agent deployment triggered");
  };

  const steps: WizardStep[] = [
    {
      title: "Goal & runtime",
      validate: () => (name.trim() && goal.trim() ? true : "Name and goal are required"),
      content: (
        <div className="space-y-4">
          <Field label="Agent name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="incident-triage-agent" />
          </Field>
          <Field label="Goal" required hint="The objective the agent pursues via plan→act→observe.">
            <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Diagnose paging alerts and remediate within policy" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Runtime">
              <Select value={runtime} onValueChange={setRuntime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(runtimes ?? ["Claude Agent SDK"]).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
                  <SelectItem value="claude-3.5-haiku">claude-3.5-haiku</SelectItem>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      ),
    },
    {
      title: "Tools & skills",
      validate: () => (selectedTools.length > 0 ? true : "Select at least one tool"),
      content: (
        <SectionCard title="Bind tools" description="Scopes are enforced by the tool gateway at runtime.">
          <div className="space-y-2">
            {(tools ?? []).map((t) => (
              <label key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-2 cursor-pointer">
                <Checkbox checked={selectedTools.includes(t.id)} onCheckedChange={() => toggleTool(t.id)} />
                <div className="flex-1">
                  <div className="text-sm font-mono">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.type} · scope {t.scope}</div>
                </div>
              </label>
            ))}
          </div>
        </SectionCard>
      ),
    },
    {
      title: "Autonomy & HITL",
      content: (
        <div className="space-y-4">
          <Field label="Autonomy level">
            <Select value={autonomy} onValueChange={(v) => setAutonomy(v as typeof autonomy)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUTONOMY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={`Max steps per run: ${maxSteps}`} hint="Hard cap on plan→act→observe iterations.">
            <Slider value={[maxSteps]} min={3} max={40} step={1} onValueChange={([v]) => setMaxSteps(v)} />
          </Field>
          <Field label={`Max cost per run: $${maxCost.toFixed(2)}`}>
            <Slider value={[maxCost]} min={0.5} max={10} step={0.5} onValueChange={([v]) => setMaxCost(v)} />
          </Field>
          <SectionCard title="Human-in-the-loop checkpoints">
            <div className="space-y-3">
              <label className="flex items-center justify-between"><span className="text-sm">Approve before any tool call</span><Switch checked={hitlTools} onCheckedChange={setHitlTools} /></label>
              <label className="flex items-center justify-between"><span className="text-sm">Approve before external / prod writes</span><Switch checked={hitlWrites} onCheckedChange={setHitlWrites} /></label>
              <label className="flex items-center justify-between"><span className="text-sm">Approve before spend over budget</span><Switch checked={hitlSpend} onCheckedChange={setHitlSpend} /></label>
            </div>
          </SectionCard>
        </div>
      ),
    },
    {
      title: "Review",
      content: (
        <div className="space-y-4">
          <InfoList
            items={[
              { label: "Agent", value: name || "—" },
              { label: "Goal", value: goal || "—" },
              { label: "Runtime / model", value: `${runtime} · ${model}` },
              { label: "Tools", value: `${selectedTools.length} bound` },
              { label: "Autonomy", value: autonomy },
              { label: "Budget", value: `${maxSteps} steps · $${maxCost.toFixed(2)}/run` },
              { label: "HITL", value: [hitlTools && "tool calls", hitlWrites && "prod writes", hitlSpend && "over-budget"].filter(Boolean).join(", ") || "none" },
            ]}
          />
          <SectionCard title="Deployment pipeline">
            <ol className="space-y-2 text-sm">
              {["Register agent in runtime", "Bind tools & check scopes", "Apply autonomy budget & HITL policy", "Sandbox eval (20 scenarios)", "Promote to shadow traffic", "Agent live"].map((s, i) => (
                <li key={s} className="flex items-center gap-2">
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

  if (deploymentId) {
    return (
      <div>
        <PageHeader title="Agent deployment" description={`Pipeline run for ${name}`} backTo="/agentic-engineer/agents" backLabel="Agent Registry" />
        <SectionCard title="Pipeline">
          {!status ? (
            <Loading label="Starting deployment…" />
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
      <PageHeader title="Deploy Agent" description="Configure an autonomous agent, its tools, autonomy budget, and human-in-the-loop checkpoints." />
      <Wizard steps={steps} onSubmit={submit} submitLabel="Deploy agent" />
    </div>
  );
};

export default DeployAgent;
