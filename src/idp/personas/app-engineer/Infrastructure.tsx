import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  Field,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getInfraResources,
  getInfraResource,
  getAvailableResources,
  createInfraResource,
  deleteInfraResource,
  type InfraResource,
} from "./api";

const Infrastructure = () => {
  const { data: resources, loading, refetch } = useMockQuery(getInfraResources, []);
  const { data: available } = useMockQuery(getAvailableResources, []);
  const [selected, setSelected] = useState<InfraResource | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ type: "", name: "", region: "us-central1", namespace: "prod" });

  const { data: detail } = useMockQuery(
    () => (selected ? getInfraResource(selected.name) : Promise.resolve(undefined)),
    [selected?.name]
  );

  const columns: Column<InfraResource>[] = [
    { key: "name", header: "Resource", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type" },
    { key: "provider", header: "Provider" },
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    { key: "namespace", header: "Namespace" },
    { key: "claimed_by", header: "Claimed by" },
    { key: "age", header: "Age", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>View</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await deleteInfraResource(r.name);
              toast.success(`Deleting ${r.name}`);
              refetch();
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const submit = async () => {
    if (!form.type || !form.name) {
      toast.error("Type and name are required");
      return;
    }
    await createInfraResource(form);
    toast.success(`Provisioning ${form.name}`);
    setCreating(false);
    setForm({ type: "", name: "", region: "us-central1", namespace: "prod" });
    refetch();
  };

  return (
    <div>
      <PageHeader
        title="Infrastructure"
        description="View and request cloud infrastructure resources provisioned by the platform."
        actions={<Button onClick={() => setCreating(true)}>New resource</Button>}
      />

      <DataTable columns={columns} rows={resources ?? []} rowKey={(r) => r.name} loading={loading} onRowClick={(r) => setSelected(r)} />

      {/* Detail drawer */}
      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.type} · ${selected.provider}` : undefined}
        wide
      >
        {detail && (
          <>
            <SectionCard title="Configuration">
              <InfoList items={Object.entries(detail.config).map(([k, v]) => ({ label: k, value: String(v) }))} />
            </SectionCard>
            <SectionCard title="Status conditions">
              <div className="space-y-1">
                {detail.conditions.map((c) => (
                  <div key={c.type} className="flex items-center justify-between text-sm">
                    <span>{c.type}</span>
                    <StatusBadge tone={c.status === "True" ? "success" : "warning"}>{c.reason}</StatusBadge>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Events">
              <div className="space-y-1">
                {detail.events.map((e, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-muted-foreground text-xs mr-2">{timeAgo(e.time)}</span>
                    <span className="font-medium">{e.reason}</span> — {e.message}
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Connection details">
              <InfoList
                items={Object.entries(detail.connection_details).map(([k, v]) => ({
                  label: k,
                  value: (
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      {String(v)}
                      <button onClick={() => toast.success(`Copied ${k}`)}>
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </span>
                  ),
                }))}
              />
            </SectionCard>
          </>
        )}
      </SideDrawer>

      {/* New resource modal */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New infrastructure resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Resource type" required>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
                <SelectContent>
                  {(available ?? []).map((r) => (
                    <SelectItem key={r.type} value={r.type}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Name" required>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="my-resource" />
            </Field>
            <Field label="Region">
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </Field>
            <Field label="Namespace">
              <Input value={form.namespace} onChange={(e) => setForm({ ...form, namespace: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => toast("Config YAML preview generated")}>Generate config YAML</Button>
            <Button onClick={submit}>Submit for provisioning</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Infrastructure;
