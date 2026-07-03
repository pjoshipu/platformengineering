import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { getCatalog, getCatalogAsset, type CatalogRow } from "./api";

/**
 * Capability 1.1 — Software Catalogs. ONE persona-aware screen: the active
 * persona (from auth) selects the type options, the persona-specific columns,
 * and the row actions. Data comes from getCatalog(persona, …).
 */

interface FieldCol {
  key: string;
  header: string;
  align?: "left" | "right";
}

interface PersonaCatalogConfig {
  /** entity types this persona owns (for the type filter) */
  types: string[];
  /** persona-specific columns, mapped from row.fields[key] */
  columns: FieldCol[];
  /** row action labels (reference screen: they toast) */
  actions: string[];
}

const CONFIG: Record<string, PersonaCatalogConfig> = {
  "ai-engineer": {
    types: ["LLM app", "RAG pipeline", "Agent service", "Embedding service", "Prompt registry"],
    columns: [
      { key: "model", header: "Model" },
      { key: "provider", header: "Provider" },
      { key: "version", header: "Version" },
      { key: "guardrails", header: "Guardrails" },
      { key: "faithfulness", header: "Faithfulness", align: "right" },
    ],
    actions: ["View deployment", "Clone config", "Observability"],
  },
  "agentic-engineer": {
    types: ["Agent", "Tool", "Runtime"],
    columns: [
      { key: "runtime", header: "Runtime" },
      { key: "model", header: "Model" },
      { key: "tools", header: "Tools", align: "right" },
      { key: "autonomy", header: "Autonomy" },
      { key: "success", header: "Success", align: "right" },
      { key: "cost_day", header: "Cost/day", align: "right" },
    ],
    actions: ["View runs", "Edit autonomy"],
  },
  "data-scientist": {
    types: ["Model", "Experiment", "Feature group", "Dataset"],
    columns: [
      { key: "framework", header: "Framework" },
      { key: "best_metric", header: "Best metric" },
      { key: "dataset", header: "Training dataset" },
      { key: "registry_status", header: "Registry" },
    ],
    actions: ["Request retraining", "Compare versions", "Submit for approval"],
  },
  "app-engineer": {
    types: ["Service", "API"],
    columns: [
      { key: "env", header: "Env" },
      { key: "sync", header: "Sync" },
      { key: "health", header: "Health" },
      { key: "route", header: "Route" },
    ],
    actions: ["Redeploy", "Scale", "GitOps status"],
  },
  mlops: {
    types: ["Pipeline", "Serving endpoint", "Drift monitor"],
    columns: [
      { key: "schedule", header: "Schedule" },
      { key: "last_run", header: "Last run" },
      { key: "drift", header: "Drift" },
      { key: "compute", header: "Compute" },
    ],
    actions: ["Trigger pipeline", "Drift report", "Edit rule"],
  },
  security: {
    types: ["LLM app", "Service", "Model", "Pipeline", "Dataset", "Policy"],
    columns: [
      { key: "violations", header: "Violations", align: "right" },
      { key: "opa_score", header: "OPA score", align: "right" },
      { key: "pii", header: "PII" },
      { key: "access", header: "Access" },
    ],
    actions: ["View violations", "Run policy check", "Audit trail"],
  },
  "data-engineer": {
    types: ["Data pipeline", "Dataset", "Feature group"],
    columns: [
      { key: "schedule", header: "Schedule" },
      { key: "last_run", header: "Last run" },
      { key: "quality", header: "Quality" },
      { key: "consumers", header: "Consumers" },
    ],
    actions: ["Trigger pipeline", "View lineage", "Edit dataset"],
  },
};

const Catalog = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const config = CONFIG[personaId] ?? { types: [], columns: [], actions: [] };

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: rows, loading } = useMockQuery(
    () => getCatalog(personaId, { q, type, status }),
    [personaId, q, type, status]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMockQuery(
    () => (selectedId ? getCatalogAsset(personaId, selectedId) : Promise.resolve(undefined)),
    [personaId, selectedId]
  );

  // Status options derived from the persona's data so the filter stays generic.
  const statusOptions = useMemo(
    () => Array.from(new Set((rows ?? []).map((r) => r.status))),
    [rows]
  );

  const columns: Column<CatalogRow>[] = [
    { key: "name", header: "Name", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", render: (r) => <StatusBadge tone="neutral">{r.type}</StatusBadge> },
    ...config.columns.map((c): Column<CatalogRow> => ({
      key: c.key,
      header: c.header,
      align: c.align,
      accessor: (r) => r.fields[c.key] ?? "",
      render: (r) => <span className="text-sm">{r.fields[c.key] ?? "—"}</span>,
    })),
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    { key: "owner", header: "Owner", render: (r) => <span className="text-xs text-muted-foreground">{r.owner}</span> },
    { key: "updated_at", header: "Updated", sortable: true, accessor: (r) => r.updated_at, render: (r) => timeAgo(r.updated_at) },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {config.actions.slice(0, 3).map((a) => (
            <Button key={a} variant="ghost" size="sm" onClick={() => toast(`${a}: ${r.name}`)}>
              {a}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assets, types, owners…" className="pl-9" />
      </div>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {config.types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Software Catalog"
        description={
          personaId === "security"
            ? "Every asset across the org with its compliance status."
            : "Your services, models, pipelines, and platform components."
        }
      />
      <DataTable
        columns={columns}
        rows={rows ?? []}
        rowKey={(r) => r.id}
        loading={loading}
        toolbar={toolbar}
        onRowClick={(r) => setSelectedId(r.id)}
        emptyTitle="No assets match"
        emptyDescription="Adjust search or filters."
      />

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.name ?? ""}
        description={detail ? `${detail.type} · ${detail.owner}` : undefined}
        wide
      >
        {detail && (
          <>
            <p className="text-sm text-muted-foreground">{detail.description}</p>
            <SectionCard title="Details">
              <InfoList
                items={[
                  { label: "Status", value: <StatusBadge>{detail.status}</StatusBadge> },
                  { label: "Owner", value: detail.owner },
                  { label: "Updated", value: timeAgo(detail.updated_at) },
                  ...config.columns.map((c) => ({ label: c.header, value: String(detail.fields[c.key] ?? "—") })),
                ]}
              />
            </SectionCard>
            <SectionCard title="Open">
              <div className="flex flex-wrap gap-2">
                {["Health", "Docs", "Scorecard"].map((l) => (
                  <Button key={l} variant="outline" size="sm" onClick={() => toast(`${l} for ${detail.name} (coming soon)`)}>
                    {l}
                  </Button>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Actions">
              <div className="flex flex-wrap gap-2">
                {config.actions.map((a) => (
                  <Button key={a} variant="ghost" size="sm" onClick={() => toast(`${a}: ${detail.name}`)}>
                    {a}
                  </Button>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Catalog;
