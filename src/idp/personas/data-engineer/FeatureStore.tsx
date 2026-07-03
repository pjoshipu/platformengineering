import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  Field,
  LineChartCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getFeatureGroups,
  getFeatureGroup,
  createFeatureGroup,
  refreshFeatureGroup,
  getPipelines_forSelect,
  type FeatureGroup,
} from "./api";

const freshnessLabel = (min: number) =>
  min < 60 ? `${min}m` : min < 1440 ? `${Math.round(min / 60)}h` : `${Math.round(min / 1440)}d`;

interface NewFeatureRow {
  id: string;
  name: string;
  type: string;
  description: string;
}
let seq = 0;

const FeatureStore = () => {
  const { data: groups, loading, refetch } = useMockQuery(getFeatureGroups, []);
  const { data: pipelines } = useMockQuery(getPipelines_forSelect, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: detail } = useMockQuery(
    () => (selectedId ? getFeatureGroup(selectedId) : Promise.resolve(undefined)),
    [selectedId]
  );

  // new-group form state
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [sourcePipeline, setSourcePipeline] = useState("");
  const [freq, setFreq] = useState("Daily");
  const [online, setOnline] = useState(true);
  const [feats, setFeats] = useState<NewFeatureRow[]>([{ id: `f_${seq++}`, name: "", type: "float", description: "" }]);

  const addFeat = () => setFeats((f) => [...f, { id: `f_${seq++}`, name: "", type: "float", description: "" }]);
  const removeFeat = (id: string) => setFeats((f) => f.filter((x) => x.id !== id));
  const updateFeat = (id: string, patch: Partial<NewFeatureRow>) =>
    setFeats((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const columns: Column<FeatureGroup>[] = [
    { key: "name", header: "Group", sortable: true, render: (g) => <span className="font-medium">{g.name}</span> },
    { key: "entity_type", header: "Entity", render: (g) => <StatusBadge tone="neutral">{g.entity_type}</StatusBadge> },
    { key: "feature_count", header: "Features", sortable: true },
    { key: "freshness_min", header: "Freshness", sortable: true, accessor: (g) => g.freshness_min, render: (g) => freshnessLabel(g.freshness_min) },
    { key: "consumer_count", header: "Consumer models", sortable: true },
    { key: "last_updated", header: "Last updated", accessor: (g) => g.last_updated, render: (g) => timeAgo(g.last_updated) },
    {
      key: "actions",
      header: "Actions",
      render: (g) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(g.id)}>View features</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(g.id)}>Edit</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const { job_id } = await refreshFeatureGroup(g.id);
              toast.success(`Refresh triggered (${job_id})`);
              refetch();
            }}
          >
            Publish update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              g.consumer_count > 0
                ? toast.error(`${g.name} has ${g.consumer_count} consuming model(s) — resolve dependencies before deleting`)
                : toast.success(`Deleted ${g.name}`)
            }
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const submit = async () => {
    if (!name || !entityType) return toast.error("Group name and entity type are required");
    await createFeatureGroup({ name, entityType, sourcePipeline, freq, online, features: feats.filter((f) => f.name) });
    toast.success(`Feature group ${name} created`);
    setCreating(false);
    setName(""); setEntityType(""); setSourcePipeline(""); setFreq("Daily"); setOnline(true);
    setFeats([{ id: `f_${seq++}`, name: "", type: "float", description: "" }]);
    refetch();
  };

  return (
    <div>
      <PageHeader
        title="Feature Store"
        description="Feature groups served to models, their freshness and consuming models."
        actions={<Button onClick={() => setCreating(true)}>New feature group</Button>}
      />

      <DataTable columns={columns} rows={groups ?? []} rowKey={(g) => g.id} loading={loading} onRowClick={(g) => setSelectedId(g.id)} />

      {/* Detail drawer */}
      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.name ?? "Feature group"}
        description={detail ? `entity: ${detail.entity_type}` : undefined}
        wide
      >
        {detail && (
          <>
            <SectionCard title="Features">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-1.5 pr-2">Name</th>
                      <th className="py-1.5 pr-2">Type</th>
                      <th className="py-1.5 pr-2">Description</th>
                      <th className="py-1.5 pr-2">Sample</th>
                      <th className="py-1.5">Null rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.features.map((f) => (
                      <tr key={f.name} className="border-b border-border last:border-0">
                        <td className="py-1.5 pr-2 font-mono text-xs">{f.name}</td>
                        <td className="py-1.5 pr-2">{f.type}</td>
                        <td className="py-1.5 pr-2 text-muted-foreground">{f.description}</td>
                        <td className="py-1.5 pr-2 font-mono text-xs">{f.sample_value}</td>
                        <td className="py-1.5">
                          <span className={f.null_rate > 1 ? "text-yellow-600" : ""}>{f.null_rate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Consumer models">
              {detail.consumers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No models currently consume this group.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {detail.consumers.map((c) => (
                    <span key={c} className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs">{c}</span>
                  ))}
                </div>
              )}
            </SectionCard>

            <LineChartCard
              title="Freshness (minutes since last update)"
              data={detail.freshness_chart}
              series={[{ key: "minutes", label: "Minutes stale" }]}
              xKey="ts"
              height={200}
            />

            <Button
              className="w-full"
              onClick={async () => {
                const { job_id } = await refreshFeatureGroup(detail.id);
                toast.success(`Refresh triggered (${job_id})`);
              }}
            >
              Publish update
            </Button>
          </>
        )}
      </SideDrawer>

      {/* New feature group dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New feature group</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Group name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="customer_activity" />
              </Field>
              <Field label="Entity type" required>
                <Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="customer" />
              </Field>
            </div>
            <Field label="Source pipeline">
              <Select value={sourcePipeline} onValueChange={setSourcePipeline}>
                <SelectTrigger><SelectValue placeholder="Select pipeline…" /></SelectTrigger>
                <SelectContent>
                  {(pipelines ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Features">
              <div className="space-y-2">
                {feats.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Input value={f.name} placeholder="name" onChange={(e) => updateFeat(f.id, { name: e.target.value })} className="font-mono text-sm" />
                    <Select value={f.type} onValueChange={(v) => updateFeat(f.id, { type: v })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["float", "int", "bool", "string", "array", "timestamp"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input value={f.description} placeholder="description" onChange={(e) => updateFeat(f.id, { description: e.target.value })} />
                    <Button variant="ghost" size="icon" onClick={() => removeFeat(f.id)} type="button"><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFeat} type="button"><Plus className="w-4 h-4 mr-1" />Add feature</Button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Update frequency">
                <Select value={freq} onValueChange={setFreq}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Real-time">Real-time</SelectItem>
                    <SelectItem value="Hourly">Hourly</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Online serving">
                <div className="flex h-10 items-center gap-2">
                  <Switch checked={online} onCheckedChange={setOnline} />
                  <span className="text-sm text-muted-foreground">{online ? "Enabled" : "Offline only"}</span>
                </div>
              </Field>
            </div>
            <InfoList items={[
              { label: "Entity", value: entityType || "—" },
              { label: "Features", value: feats.filter((f) => f.name).length },
              { label: "Serving", value: online ? "Online + offline" : "Offline" },
            ]} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={submit}>Create feature group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeatureStore;
