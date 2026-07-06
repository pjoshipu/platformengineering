import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  PageHeader,
  Wizard,
  Field,
  SectionCard,
  InfoList,
  KeyValueEditor,
  Loading,
  type WizardStep,
  type KeyValuePair,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import {
  createTrainingJob,
  getPipelineStatus,
  getComputeQuota,
  type PipelineStep,
  type Dataset,
} from "./api";
import { DatasetCatalog } from "./DatasetCatalog";

const PIPELINE_STEPS = [
  "Validate request (dataset exists, quota, policy)",
  "Build training container",
  "Trigger training job on compute",
  "Stream training logs",
  "Evaluate against metric threshold",
  "Register model if passed",
  "Request approval if env requires",
  "Deploy to serving endpoint",
];

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

const NewTrainingRequest = () => {
  const { data: quota } = useMockQuery(getComputeQuota, []);

  const [name, setName] = useState("");
  const [framework, setFramework] = useState("PyTorch");
  const [compute, setCompute] = useState("GPU single");
  const [trainDataset, setTrainDataset] = useState("");
  const [valDataset, setValDataset] = useState("");
  const [targetMetric, setTargetMetric] = useState("AUC-ROC");
  const [threshold, setThreshold] = useState("0.85");
  const [hpProfile, setHpProfile] = useState("Default");
  const [customHp, setCustomHp] = useState<KeyValuePair[]>([
    { key: "learning_rate", value: "0.001" },
    { key: "batch_size", value: "256" },
  ]);
  const [maxTime, setMaxTime] = useState("4h");
  const [environment, setEnvironment] = useState("Dev");
  const [justification, setJustification] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [notify, setNotify] = useState(true);

  const [browseOpen, setBrowseOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const { data: status } = useMockQuery(
    () => (jobId ? getPipelineStatus(jobId) : Promise.resolve(undefined)),
    [jobId]
  );

  // Pipeline preview updates when the environment changes: prod auto-promotes,
  // staging inserts an approval gate, dev deploys straight to a dev endpoint.
  const pipelinePreview = useMemo(() => {
    const steps = [...PIPELINE_STEPS];
    if (environment === "Dev") {
      steps[6] = "Request approval if env requires (skipped — Dev)";
      steps[7] = "Deploy to serving endpoint (dev)";
    } else if (environment.startsWith("Staging")) {
      steps[6] = "Request approval (Staging gate — reviewer required)";
      steps[7] = "Deploy to serving endpoint after approval";
    } else {
      steps[6] = "Request approval if env requires (auto-promote — Prod)";
      steps[7] = "Deploy to serving endpoint (prod, auto-promote)";
    }
    return steps;
  }, [environment]);

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  };

  const submit = async () => {
    setSubmitting(true);
    const { job_id } = await createTrainingJob({
      name, framework, compute, trainDataset, valDataset, targetMetric,
      threshold, hpProfile, customHp, maxTime, environment, justification, tags, notify,
    });
    setSubmitting(false);
    setJobId(job_id);
    toast.success("Training job submitted");
  };

  const steps: WizardStep[] = [
    {
      title: "Model",
      validate: () =>
        !name.trim() ? "Model name is required" : name.length < 3 ? "Model name too short" : true,
      content: (
        <>
          <Field label="Model name" required hint="Must be unique in the registry.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="churn-xgb-v8" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Framework">
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PyTorch", "TensorFlow", "scikit-learn", "XGBoost"].map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Compute" hint={quota ? `${quota.available_gpus} GPUs · ${quota.available_cpus} CPUs · queue ${quota.queue_depth}` : undefined}>
              <Select value={compute} onValueChange={setCompute}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["CPU standard", "GPU single", "GPU high-memory", "TPU"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </>
      ),
    },
    {
      title: "Data",
      validate: () => (!trainDataset.trim() ? "A training dataset is required" : true),
      content: (
        <>
          <Field label="Training dataset" required hint="Path/URI, or browse the catalog.">
            <div className="flex gap-2">
              <Input
                className="font-mono text-sm"
                value={trainDataset}
                onChange={(e) => setTrainDataset(e.target.value)}
                placeholder="bq://project.dataset.table"
              />
              <Button variant="outline" onClick={() => setBrowseOpen(true)}>Browse catalog</Button>
            </div>
          </Field>
          <Field label="Validation dataset" hint="Optional.">
            <Input
              className="font-mono text-sm"
              value={valDataset}
              onChange={(e) => setValDataset(e.target.value)}
              placeholder="bq://project.dataset.val"
            />
          </Field>
        </>
      ),
    },
    {
      title: "Objective",
      content: (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target metric">
              <Select value={targetMetric} onValueChange={setTargetMetric}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["AUC-ROC", "F1", "Accuracy", "RMSE", "Custom"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Metric threshold">
              <Input value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="0.85" />
            </Field>
          </div>
          <Field label="Hyperparameter profile">
            <Select value={hpProfile} onValueChange={setHpProfile}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Default">Default</SelectItem>
                <SelectItem value="High regularisation">High regularisation</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {hpProfile === "Custom" && (
            <Field label="Custom hyperparameters">
              <KeyValueEditor pairs={customHp} onChange={setCustomHp} />
            </Field>
          )}
          <Field label="Max training time">
            <Select value={maxTime} onValueChange={setMaxTime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["1h", "4h", "8h", "24h"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </>
      ),
    },
    {
      title: "Delivery",
      validate: () =>
        justification.trim().length < 15 ? "Justification must be at least 15 characters" : true,
      content: (
        <>
          <Field label="Environment">
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Dev">Dev</SelectItem>
                <SelectItem value="Staging with approval gate">Staging with approval gate</SelectItem>
                <SelectItem value="Prod auto-promote">Prod auto-promote</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Justification" required hint="Why this training run is needed.">
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Re-train churn model on Q3 data to recover AUC lost to drift…"
            />
          </Field>
          <Field label="Tags">
            <div className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add a tag and press Enter"
              />
              <Button variant="outline" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t} ✕
                  </button>
                ))}
              </div>
            )}
          </Field>
          <SectionCard>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Notify on completion</div>
                <div className="text-xs text-muted-foreground">Send a Slack DM when the job finishes.</div>
              </div>
              <Switch checked={notify} onCheckedChange={setNotify} />
            </div>
          </SectionCard>
        </>
      ),
    },
    {
      title: "Review",
      content: (
        <InfoList
          items={[
            { label: "Model name", value: name || "—" },
            { label: "Framework", value: framework },
            { label: "Compute", value: compute },
            { label: "Training dataset", value: <span className="font-mono text-xs">{trainDataset || "—"}</span> },
            { label: "Validation dataset", value: <span className="font-mono text-xs">{valDataset || "—"}</span> },
            { label: "Target", value: `${targetMetric} ≥ ${threshold}` },
            { label: "Hyperparameters", value: hpProfile },
            { label: "Max time", value: maxTime },
            { label: "Environment", value: environment },
            { label: "Tags", value: tags.length ? tags.join(", ") : "—" },
            { label: "Notify", value: notify ? "Yes" : "No" },
          ]}
        />
      ),
    },
  ];

  if (jobId) {
    return (
      <div>
        <PageHeader
          title="Training job status"
          description={`Pipeline run for ${name}`}
          backTo="/data-scientist/dashboard"
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
        title="New Training Request"
        description="Submit a model training job; the platform orchestrates build, train, evaluate, register, and deploy."
      />

      <Wizard steps={steps} onSubmit={submit} submitLabel="Submit training job" submitting={submitting} />

      <SectionCard title="Pipeline preview" className="mt-8">
        <ol className="space-y-2">
          {pipelinePreview.map((step, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* Browse catalog dialog */}
      <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Browse dataset catalog</DialogTitle>
          </DialogHeader>
          <DatasetCatalog
            embedded
            onUse={(d: Dataset) => {
              setTrainDataset(d.name);
              setBrowseOpen(false);
              toast.success(`Selected ${d.name}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewTrainingRequest;
