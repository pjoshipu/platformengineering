import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  Field,
  InfoList,
  Wizard,
  type Column,
  type WizardStep,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getPolicies,
  getPolicy,
  getPolicyTemplates,
  createPolicy,
  updatePolicy,
  testPolicy,
  deployPolicy,
  type Policy,
  type PolicyViolation,
} from "./api";

const SAMPLE_RESOURCE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
spec:
  template:
    spec:
      containers:
        - name: main
          image: registry.internal/my-service:v1
          # resources.limits intentionally omitted`;

const PolicyManager = () => {
  const { data: policies, loading, refetch } = useMockQuery(getPolicies, []);
  const { data: templates } = useMockQuery(getPolicyTemplates, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: detail } = useMockQuery(
    () => (selectedId ? getPolicy(selectedId) : Promise.resolve(undefined)),
    [selectedId]
  );

  // Editor state (seeded when a policy is opened).
  const [code, setCode] = useState("");
  const [action, setAction] = useState<"Deny" | "Warn" | "Audit only">("Deny");
  const [namespaces, setNamespaces] = useState("");
  const [sample, setSample] = useState(SAMPLE_RESOURCE);
  const [testResult, setTestResult] = useState<{ result: "Pass" | "Fail"; message: string } | null>(null);

  const openPolicy = async (p: Policy) => {
    setSelectedId(p.id);
    setTestResult(null);
    const d = await getPolicy(p.id);
    setCode(d.policy_code);
    setAction(d.constraint_config.enforcement_action);
    setNamespaces(d.constraint_config.namespaces.join(", "));
  };

  const columns: Column<Policy>[] = [
    { key: "name", header: "Policy name", sortable: true, render: (p) => <span className="font-medium font-mono text-xs">{p.name}</span> },
    { key: "kind", header: "Kind", render: (p) => <span className="text-xs">{p.kind}</span> },
    { key: "scope", header: "Scope" },
    {
      key: "violations_count",
      header: "Violations",
      sortable: true,
      align: "right",
      render: (p) => <span className={p.violations_count > 0 ? "text-destructive font-medium" : ""}>{p.violations_count}</span>,
    },
    { key: "last_updated", header: "Last updated", sortable: true, accessor: (p) => p.last_updated, render: (p) => timeAgo(p.last_updated) },
    {
      key: "enforced",
      header: "Enforced",
      render: (p) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={p.enforced}
            onCheckedChange={async (v) => {
              await updatePolicy(p.id, { enforced: v });
              toast.success(`${p.name} ${v ? "enforced" : "set to audit"}`);
              refetch();
            }}
          />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => openPolicy(p)}>Edit</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const r = await testPolicy(p.id, SAMPLE_RESOURCE);
              toast[r.result === "Pass" ? "success" : "error"](`Test: ${r.result}`);
            }}
          >
            Test
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await deletePolicyMock(); toast.success(`Deleted ${p.name}`); refetch(); }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const deletePolicyMock = () => updatePolicy("del", {});

  const runTest = async () => {
    if (!selectedId) return;
    const r = await testPolicy(selectedId, sample);
    setTestResult(r);
  };

  return (
    <div>
      <PageHeader
        title="Policy Manager"
        description="Author, test, and enforce OPA/Gatekeeper policies across the platform."
        actions={<Button onClick={() => setWizardOpen(true)}>New policy</Button>}
      />

      <DataTable
        columns={columns}
        rows={policies ?? []}
        rowKey={(p) => p.id}
        loading={loading}
        onRowClick={(p) => openPolicy(p)}
        defaultSort={{ key: "violations_count", dir: "desc" }}
      />

      {/* Policy editor drawer */}
      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.name ?? ""}
        description={detail ? `${detail.kind}` : undefined}
        wide
      >
        {detail && (
          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="violations">Violations ({detail.violations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4 mt-4">
              <SectionCard
                title="Policy code (Rego)"
                actions={<Button variant="ghost" size="sm" onClick={() => toast.success("Syntax valid — 0 errors")}>Validate syntax</Button>}
              >
                <Textarea value={code} onChange={(e) => setCode(e.target.value)} className="font-mono text-xs h-56" />
              </SectionCard>

              <SectionCard title="Constraint config">
                <div className="space-y-3">
                  <Field label="Namespaces in scope" hint="Comma-separated; leave blank for all namespaces">
                    <Input value={namespaces} onChange={(e) => setNamespaces(e.target.value)} className="font-mono text-xs" placeholder="prod, staging" />
                  </Field>
                  <Field label="Enforcement action">
                    <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Deny">Deny</SelectItem>
                        <SelectItem value="Warn">Warn</SelectItem>
                        <SelectItem value="Audit only">Audit only</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </SectionCard>

              <SectionCard
                title="Test against a sample resource"
                actions={<Button variant="ghost" size="sm" onClick={runTest}>Run test</Button>}
              >
                <Textarea value={sample} onChange={(e) => setSample(e.target.value)} className="font-mono text-xs h-40" />
                {testResult && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-border p-3">
                    {testResult.result === "Pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive mt-0.5" />
                    )}
                    <div>
                      <StatusBadge tone={testResult.result === "Pass" ? "success" : "danger"}>{testResult.result}</StatusBadge>
                      <p className="text-sm mt-1">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </SectionCard>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => { await updatePolicy(selectedId!, { code, action, namespaces }); toast.success("Draft saved"); }}
                >
                  Save draft
                </Button>
                <Button
                  onClick={async () => { await deployPolicy(selectedId!); toast.success("Deployed to cluster"); setSelectedId(null); refetch(); }}
                >
                  Deploy to cluster
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="violations" className="mt-4">
              <DataTable<PolicyViolation>
                columns={[
                  { key: "resource", header: "Resource", render: (v) => <span className="font-mono text-xs">{v.resource}</span> },
                  { key: "namespace", header: "Namespace" },
                  { key: "message", header: "Violation message", render: (v) => <span className="text-sm">{v.message}</span> },
                  { key: "time", header: "Time", accessor: (v) => v.time, render: (v) => timeAgo(v.time) },
                  { key: "user", header: "Created by", render: (v) => <span className="font-mono text-xs">{v.user}</span> },
                ]}
                rows={detail.violations}
                rowKey={(v) => v.resource}
                emptyTitle="No violations"
              />
            </TabsContent>
          </Tabs>
        )}
      </SideDrawer>

      <NewPolicyWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        templates={templates ?? []}
        onCreated={refetch}
      />
    </div>
  );
};

/* ----------------------------- New Policy Wizard ----------------------------- */

interface WizardTemplate {
  id: string;
  name: string;
  kind: string;
  description: string;
}

const NewPolicyWizard = ({
  open,
  onOpenChange,
  templates,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  templates: WizardTemplate[];
  onCreated: () => void;
}) => {
  const [template, setTemplate] = useState<string>("");
  const [scope, setScope] = useState("prod");
  const [action, setAction] = useState<"Deny" | "Warn" | "Audit only">("Deny");
  const [sample, setSample] = useState(SAMPLE_RESOURCE);
  const [testResult, setTestResult] = useState<{ result: "Pass" | "Fail"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const chosen = templates.find((t) => t.id === template);

  const steps: WizardStep[] = [
    {
      title: "Template",
      validate: () => (template ? true : "Choose a template to continue"),
      content: (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Start from the policy template library.</p>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplate(t.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${template === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.description}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Scope & action",
      content: (
        <div className="space-y-3">
          <Field label="Namespaces in scope" hint="Comma-separated; blank = all namespaces">
            <Input value={scope} onChange={(e) => setScope(e.target.value)} className="font-mono text-xs" />
          </Field>
          <Field label="Enforcement action">
            <Select value={action} onValueChange={(v) => setAction(v as typeof action)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Deny">Deny</SelectItem>
                <SelectItem value="Warn">Warn</SelectItem>
                <SelectItem value="Audit only">Audit only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      ),
    },
    {
      title: "Test",
      content: (
        <div className="space-y-3">
          <Field label="Sample resource">
            <Textarea value={sample} onChange={(e) => setSample(e.target.value)} className="font-mono text-xs h-40" />
          </Field>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => setTestResult(await testPolicy("new", sample))}
          >
            Run against policy
          </Button>
          {testResult && (
            <div className="flex items-center gap-2 text-sm">
              <StatusBadge tone={testResult.result === "Pass" ? "success" : "danger"}>{testResult.result}</StatusBadge>
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Deploy",
      content: (
        <InfoList
          items={[
            { label: "Template", value: chosen?.name ?? "—" },
            { label: "Kind", value: chosen?.kind ?? "—" },
            { label: "Scope", value: scope || "all namespaces" },
            { label: "Enforcement", value: action },
          ]}
        />
      ),
    },
  ];

  const submit = async () => {
    setSubmitting(true);
    await createPolicy({ template, scope, action });
    await deployPolicy("new");
    setSubmitting(false);
    toast.success("Policy created and deployed");
    onOpenChange(false);
    setTemplate("");
    setTestResult(null);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New policy</DialogTitle>
        </DialogHeader>
        <Wizard steps={steps} onSubmit={submit} submitLabel="Deploy policy" submitting={submitting} />
      </DialogContent>
    </Dialog>
  );
};

export default PolicyManager;
