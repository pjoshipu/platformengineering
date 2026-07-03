import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { PageHeader, StatusBadge, Field, Loading, EmptyState } from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getRetrainingRules,
  createRetrainingRule,
  updateRetrainingRule,
  deleteRetrainingRule,
  testRetrainingRule,
  MODELS,
  type RetrainingRule,
  type TriggerType,
} from "./api";

const TRIGGER_TYPES: TriggerType[] = ["Drift threshold", "Schedule", "Performance degradation", "Manual only"];
const COOLDOWNS = ["None", "24h", "7 days", "30 days"];
const ACTIONS = ["Create training job automatically", "Send approval request", "Notify only"];
const METRICS = ["accuracy", "precision@10", "recall", "f1", "auc"];

interface FormState {
  name: string;
  model_id: string;
  trigger_type: TriggerType;
  drift_score: string;
  feature_scope: "all" | "specific";
  feature_name: string;
  schedule: string;
  metric: string;
  metric_threshold: string;
  action: string;
  cooldown: string;
  notify: boolean;
  notify_dest: string;
  enabled: boolean;
}

const emptyForm: FormState = {
  name: "",
  model_id: MODELS[0].id,
  trigger_type: "Drift threshold",
  drift_score: "0.6",
  feature_scope: "all",
  feature_name: "",
  schedule: "0 9 * * 1",
  metric: "accuracy",
  metric_threshold: "0.85",
  action: ACTIONS[0],
  cooldown: "24h",
  notify: true,
  notify_dest: "#mlops-alerts",
  enabled: true,
};

// Very small cron-ish -> plain language preview for demo purposes.
function schedulePreview(expr: string): string {
  const map: Record<string, string> = {
    "0 9 * * 1": "Every Monday at 9am UTC",
    "0 0 * * *": "Every day at midnight UTC",
    "0 */12 * * *": "Every 12 hours",
    "0 0 * * 0": "Every Sunday at midnight UTC",
  };
  return map[expr.trim()] ?? "Custom cron schedule";
}

function conditionFor(f: FormState): string {
  switch (f.trigger_type) {
    case "Drift threshold":
      return `drift score > ${f.drift_score} on ${f.feature_scope === "all" ? "any feature" : f.feature_name || "feature"}`;
    case "Schedule":
      return schedulePreview(f.schedule);
    case "Performance degradation":
      return `${f.metric} < ${f.metric_threshold}`;
    default:
      return "Triggered manually by owner";
  }
}

const RetrainingRules = () => {
  const { data: rules, loading, refetch } = useMockQuery(getRetrainingRules, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RetrainingRule | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: RetrainingRule) => {
    setEditing(r);
    setForm({ ...emptyForm, name: r.name, model_id: r.model_id, trigger_type: r.trigger_type, enabled: r.enabled });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    const body = {
      name: form.name,
      model_id: form.model_id,
      trigger_type: form.trigger_type,
      condition: conditionFor(form),
      enabled: form.enabled,
    };
    if (editing) {
      await updateRetrainingRule(editing.id, body);
      toast.success(`Updated ${form.name}`);
    } else {
      await createRetrainingRule(body);
      toast.success(`Created ${form.name}`);
    }
    setDialogOpen(false);
    refetch();
  };

  const runTest = async () => {
    const res = await testRetrainingRule(editing?.id ?? "draft");
    toast.success(`Would have triggered ${res.would_trigger_count} time(s) in the last 30 days`);
  };

  return (
    <div>
      <PageHeader
        title="Retraining Rules"
        description="Automate when models retrain — on drift, schedule, performance degradation, or manually."
        actions={<Button onClick={openNew}>Add rule</Button>}
      />

      {loading ? (
        <Loading />
      ) : (rules ?? []).length === 0 ? (
        <EmptyState title="No retraining rules" description="Create a rule to automate retraining." action={<Button onClick={openNew}>Add rule</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(rules ?? []).map((r) => (
            <Card key={r.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.model_name}</div>
                </div>
                <StatusBadge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "Enabled" : "Disabled"}</StatusBadge>
              </div>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Trigger: </span>{r.trigger_type}</div>
                <div><span className="text-muted-foreground">Condition: </span>{r.condition}</div>
                <div className="text-xs text-muted-foreground">
                  Last triggered: {r.last_triggered ? timeAgo(r.last_triggered) : "never"}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-auto pt-2 border-t border-border">
                <Switch
                  checked={r.enabled}
                  onCheckedChange={async (v) => {
                    await updateRetrainingRule(r.id, { enabled: v });
                    toast.success(`${v ? "Enabled" : "Disabled"} ${r.name}`);
                    refetch();
                  }}
                />
                <span className="text-xs text-muted-foreground mr-auto">Enabled</span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await deleteRetrainingRule(r.id);
                    toast.success(`Deleted ${r.name}`);
                    refetch();
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit retraining rule" : "New retraining rule"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Rule name" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Churn drift auto-retrain" />
            </Field>
            <Field label="Model">
              <Select value={form.model_id} onValueChange={(v) => set("model_id", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Trigger type">
              <Select value={form.trigger_type} onValueChange={(v) => set("trigger_type", v as TriggerType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.trigger_type === "Drift threshold" && (
              <>
                <Field label="Drift score threshold">
                  <Input type="number" step="0.05" min="0" max="1" value={form.drift_score} onChange={(e) => set("drift_score", e.target.value)} />
                </Field>
                <Field label="Feature scope">
                  <Select value={form.feature_scope} onValueChange={(v) => set("feature_scope", v as "all" | "specific")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All features</SelectItem>
                      <SelectItem value="specific">Specific feature</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {form.feature_scope === "specific" && (
                  <Field label="Feature name">
                    <Input value={form.feature_name} onChange={(e) => set("feature_name", e.target.value)} placeholder="monthly_charges" />
                  </Field>
                )}
              </>
            )}

            {form.trigger_type === "Schedule" && (
              <Field label="Schedule expression" hint={schedulePreview(form.schedule)}>
                <Input value={form.schedule} onChange={(e) => set("schedule", e.target.value)} className="font-mono text-xs" placeholder="0 9 * * 1" />
              </Field>
            )}

            {form.trigger_type === "Performance degradation" && (
              <>
                <Field label="Metric">
                  <Select value={form.metric} onValueChange={(v) => set("metric", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {METRICS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Threshold (retrain when below)">
                  <Input type="number" step="0.01" value={form.metric_threshold} onChange={(e) => set("metric_threshold", e.target.value)} />
                </Field>
              </>
            )}

            <Field label="Action on trigger">
              <Select value={form.action} onValueChange={(v) => set("action", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cooldown period">
              <Select value={form.cooldown} onValueChange={(v) => set("cooldown", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COOLDOWNS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center gap-2">
              <Switch checked={form.notify} onCheckedChange={(v) => set("notify", v)} />
              <span className="text-sm">Send notifications</span>
            </div>
            {form.notify && (
              <Field label="Notification destination">
                <Input value={form.notify_dest} onChange={(e) => set("notify_dest", e.target.value)} placeholder="#mlops-alerts" />
              </Field>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
              <span className="text-sm">Rule enabled</span>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <span className="text-muted-foreground">Resulting condition: </span>
              <span className="font-medium">{conditionFor(form)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={runTest}>
              <FlaskConical className="w-3.5 h-3.5 mr-1" /> Test rule
            </Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Create rule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetrainingRules;
