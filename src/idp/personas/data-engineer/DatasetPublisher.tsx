import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, X, ShieldAlert, Lock, Globe, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  PageHeader,
  Field,
  SectionCard,
  StatusBadge,
  KeyValueEditor,
  type KeyValuePair,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { detectSchema, publishDataset, getPipelines_forSelect } from "./api";

const DOMAINS = ["CRM", "Finance", "Product", "Marketing", "Operations", "Other"];
const ACCESS_LEVELS = ["Public", "Restricted", "Private"];
const REFRESH = ["Real-time", "Hourly", "Daily", "Weekly", "One-time"];

const accessIcon = (a: string) =>
  a === "Public" ? <Globe className="w-3.5 h-3.5" /> : a === "Restricted" ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />;

const DatasetPublisher = () => {
  const navigate = useNavigate();
  const { data: pipelines } = useMockQuery(getPipelines_forSelect, []);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<"pipeline" | "external">("pipeline");
  const [sourcePipeline, setSourcePipeline] = useState("");
  const [storage, setStorage] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Product");

  // Schema: reuse KeyValueEditor as column+type rows (key=column, value=type)
  const [schema, setSchema] = useState<KeyValuePair[]>([{ key: "", value: "string" }]);
  const [piiSuspects, setPiiSuspects] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [access, setAccess] = useState("Public");
  const [approvalProcess, setApprovalProcess] = useState("");
  const [piiOn, setPiiOn] = useState(false);
  const [piiColumns, setPiiColumns] = useState<string[]>([]);
  const [refresh, setRefresh] = useState("Daily");
  const [owner, setOwner] = useState("p.joshipura");
  const [upstream, setUpstream] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const validateName = (v: string) => {
    setName(v);
    if (!v) setNameError(null);
    else if (!/^[a-z][a-z0-9_.]*$/.test(v)) setNameError("Use lowercase, digits, dot or underscore; start with a letter.");
    else if (["crm.customer_360", "analytics.orders_daily"].includes(v)) setNameError("A dataset with this name already exists.");
    else setNameError(null);
  };

  const autoDetect = async () => {
    if (!storage) {
      toast.error("Enter a storage location first");
      return;
    }
    setDetecting(true);
    const res = await detectSchema(storage);
    setSchema(res.columns.map((c) => ({ key: c.name, value: c.type })));
    setPiiSuspects(res.pii_suspects);
    setDetecting(false);
    toast.success(`Detected ${res.columns.length} columns · ${res.pii_suspects.length} suspected PII`);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const columnNames = schema.map((s) => s.key).filter(Boolean);
  const togglePiiColumn = (col: string) =>
    setPiiColumns((c) => (c.includes(col) ? c.filter((x) => x !== col) : [...c, col]));
  const toggleUpstream = (col: string) =>
    setUpstream((c) => (c.includes(col) ? c.filter((x) => x !== col) : [...c, col]));

  const submit = async () => {
    if (!name) return toast.error("Dataset name is required");
    if (nameError) return toast.error(nameError);
    if (piiOn && piiColumns.length === 0) return toast.error("Select which columns contain PII");
    if (access === "Restricted" && !approvalProcess.trim()) return toast.error("Restricted access requires an approval-process description");

    setSubmitting(true);
    const { dataset_id } = await publishDataset({
      name, source: sourceMode === "pipeline" ? sourcePipeline : "external",
      storage, description, domain,
      schema: schema.filter((s) => s.key), tags, access, approvalProcess,
      pii: piiOn ? piiColumns : [], refresh, owner, upstream,
    });
    setSubmitting(false);
    if (piiOn) toast("Security team notified of PII columns", { icon: "🔒" });
    toast.success(`Dataset ${dataset_id} published to catalog`);
    navigate("/idp/data-engineer/dashboard");
  };

  return (
    <div>
      <PageHeader
        title="Dataset Publisher"
        description="Publish a processed dataset to the catalog. The card preview shows how it will appear to consumers."
        backTo="/idp/data-engineer/dashboard"
        backLabel="Dashboard"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          <Field label="Dataset name" required hint={nameError ?? "Unique catalog identifier, e.g. analytics.customer_ltv"}>
            <Input value={name} onChange={(e) => validateName(e.target.value)} placeholder="analytics.customer_ltv" className={nameError ? "border-destructive" : ""} />
          </Field>

          <SectionCard title="Source">
            <Field label="Source">
              <Select value={sourceMode} onValueChange={(v) => setSourceMode(v as "pipeline" | "external")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipeline">Source pipeline</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {sourceMode === "pipeline" && (
              <Field label="Pipeline" className="mt-3">
                <Select value={sourcePipeline} onValueChange={setSourcePipeline}>
                  <SelectTrigger><SelectValue placeholder="Select pipeline…" /></SelectTrigger>
                  <SelectContent>
                    {(pipelines ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Storage location (path / table ref)" className="mt-3">
              <Input value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="bq://analytics.customer_ltv" className="font-mono text-sm" />
            </Field>
          </SectionCard>

          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this dataset contains and how to use it." className="h-20" />
          </Field>

          <Field label="Domain">
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <SectionCard
            title="Schema"
            description="Auto-detect from the storage location, or enter columns manually."
            actions={<Button variant="outline" size="sm" onClick={autoDetect} disabled={detecting}>{detecting ? "Detecting…" : "Auto-detect"}</Button>}
          >
            <KeyValueEditor pairs={schema} onChange={setSchema} keyPlaceholder="column" valuePlaceholder="type" addLabel="Add column" />
            {piiSuspects.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-yellow-600 shrink-0" />
                <span>Suspected PII columns: <span className="font-mono">{piiSuspects.join(", ")}</span>. Enable the PII flag and confirm.</span>
              </div>
            )}
          </SectionCard>

          <Field label="Tags">
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="add a tag and press Enter" />
              <Button variant="outline" size="icon" onClick={addTag} type="button"><Plus className="w-4 h-4" /></Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs">
                    {t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <SectionCard title="Access & governance">
            <Field label="Access level">
              <Select value={access} onValueChange={setAccess}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCESS_LEVELS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {access === "Restricted" && (
              <Field label="Approval process" required className="mt-3" hint="Describe who approves access requests and how.">
                <Textarea value={approvalProcess} onChange={(e) => setApprovalProcess(e.target.value)} placeholder="Access requests reviewed by the Finance data steward within 1 business day." className="h-16" />
              </Field>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Contains PII</div>
                <div className="text-xs text-muted-foreground">Flag if any columns hold personal data</div>
              </div>
              <Switch checked={piiOn} onCheckedChange={setPiiOn} />
            </div>
            {piiOn && (
              <div className="mt-3">
                <div className="mb-1.5 text-sm font-medium">PII columns <span className="text-destructive">*</span></div>
                {columnNames.length === 0 && <div className="text-xs text-muted-foreground">Add or detect columns first.</div>}
                <div className="space-y-1">
                  {columnNames.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={piiColumns.includes(c)} onCheckedChange={() => togglePiiColumn(c)} />
                      <span className="font-mono text-xs">{c}</span>
                      {piiSuspects.includes(c) && <StatusBadge tone="warning">suspected</StatusBadge>}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Refresh schedule">
              <Select value={refresh} onValueChange={setRefresh}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFRESH.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Data owner">
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </Field>
          </div>

          <SectionCard title="Upstream datasets" description="Select the datasets this one is derived from — builds lineage.">
            <div className="space-y-1">
              {["crm.customer_360", "analytics.orders_daily", "product.web_sessions", "finance.payments_recon"].map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={upstream.includes(d)} onCheckedChange={() => toggleUpstream(d)} />
                  <span className="font-mono text-xs">{d}</span>
                </label>
              ))}
            </div>
          </SectionCard>

          <Button className="w-full" onClick={submit} disabled={submitting}>{submitting ? "Publishing…" : "Publish dataset"}</Button>
        </div>

        {/* Catalog card preview */}
        <div>
          <div className="sticky top-4">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Catalog card preview</h3>
            <Card className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold truncate">{name || "your.dataset_name"}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{domain} · owned by {owner}</div>
                </div>
                <StatusBadge tone={access === "Public" ? "success" : access === "Restricted" ? "warning" : "neutral"}>
                  <span className="inline-flex items-center gap-1">{accessIcon(access)}{access}</span>
                </StatusBadge>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {description || "No description yet — add one so consumers know what this dataset contains."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-border bg-muted px-2 py-0.5">{refresh}</span>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5">{columnNames.length} columns</span>
                {piiOn && <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive"><ShieldAlert className="w-3 h-3" />PII</span>}
                {tags.map((t) => <span key={t} className="rounded-full border border-border bg-muted px-2 py-0.5">{t}</span>)}
              </div>

              {columnNames.length > 0 && (
                <div className="mt-4 rounded-lg border border-border">
                  <div className="border-b border-border px-3 py-1.5 text-xs font-semibold">Schema</div>
                  <div className="divide-y divide-border">
                    {schema.filter((s) => s.key).slice(0, 8).map((s) => (
                      <div key={s.key} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <span className="font-mono">{s.key}</span>
                        <span className="text-muted-foreground">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upstream.length > 0 && (
                <div className="mt-4 text-xs">
                  <span className="text-muted-foreground">Derived from: </span>
                  <span className="font-mono">{upstream.join(", ")}</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetPublisher;
