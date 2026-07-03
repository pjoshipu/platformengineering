import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  Field,
  Loading,
  EmptyState,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getDatasets,
  getDatasetSchema,
  getDatasetLineage,
  requestDatasetAccess,
  type Dataset,
} from "./api";

const accessTone = (level: Dataset["access_level"]) =>
  level === "Open" ? "success" : level === "Restricted" ? "warning" : "danger";

/**
 * Dataset Catalog. Rendered both as a full screen (route) and — via
 * `embedded` + `onUse` — inside the New Training Request "Browse catalog" dialog.
 */
export const DatasetCatalog = ({
  embedded = false,
  onUse,
}: {
  embedded?: boolean;
  onUse?: (d: Dataset) => void;
}) => {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("all");
  const [domain, setDomain] = useState("all");
  const { data, loading } = useMockQuery(
    () => getDatasets(search, source, domain),
    [search, source, domain]
  );
  const [selected, setSelected] = useState<Dataset | null>(null);
  const [justification, setJustification] = useState("");

  const { data: schema } = useMockQuery(
    () => (selected ? getDatasetSchema(selected.id) : Promise.resolve([])),
    [selected?.id]
  );
  const { data: lineage } = useMockQuery(
    () => (selected ? getDatasetLineage(selected.id) : Promise.resolve(undefined)),
    [selected?.id]
  );

  const datasets = data ?? [];

  const filters = (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search datasets or tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={source} onValueChange={setSource}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          <SelectItem value="BigQuery">BigQuery</SelectItem>
          <SelectItem value="Snowflake">Snowflake</SelectItem>
          <SelectItem value="GCS">GCS</SelectItem>
        </SelectContent>
      </Select>
      <Select value={domain} onValueChange={setDomain}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All domains</SelectItem>
          <SelectItem value="Customer">Customer</SelectItem>
          <SelectItem value="Risk">Risk</SelectItem>
          <SelectItem value="Marketing">Marketing</SelectItem>
          <SelectItem value="Finance">Finance</SelectItem>
          <SelectItem value="Product">Product</SelectItem>
          <SelectItem value="Sales">Sales</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const grid = (
    <div className="space-y-4">
      {filters}
      {loading ? (
        <Loading label="Loading datasets…" />
      ) : datasets.length === 0 ? (
        <EmptyState title="No datasets match" description="Try clearing filters or search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {datasets.map((d) => (
            <Card
              key={d.id}
              className="p-4 flex flex-col gap-2 cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => setSelected(d)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium truncate">{d.name}</span>
                <StatusBadge tone={accessTone(d.access_level)}>{d.access_level}</StatusBadge>
              </div>
              <div className="text-xs text-muted-foreground">
                {d.source} · {d.size_gb} GB · {d.owner}
              </div>
              <div className="text-xs text-muted-foreground">Updated {timeAgo(d.last_updated)}</div>
              <div className="flex flex-wrap gap-1">
                {d.tags.map((t) => (
                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                ))}
              </div>
              <div className="mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                {d.has_access ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (onUse) onUse(d);
                      else toast.success(`Using ${d.name}`);
                    }}
                  >
                    Use
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setSelected(d)}>
                    Request access
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const drawer = (
    <SideDrawer
      open={!!selected}
      onOpenChange={(o) => !o && (setSelected(null), setJustification(""))}
      title={selected?.name ?? ""}
      description={selected ? `${selected.source} · ${selected.domain} · ${selected.size_gb} GB` : undefined}
      wide
    >
      {selected && (
        <>
          <SectionCard title="Description">
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          </SectionCard>

          <SectionCard title="Schema preview (first 5 rows)" className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-1 pr-3">Column</th>
                    <th className="py-1 pr-3">Type</th>
                    <th className="py-1">Sample values</th>
                  </tr>
                </thead>
                <tbody>
                  {(schema ?? []).map((c) => (
                    <tr key={c.column} className="border-t border-border">
                      <td className="py-1 pr-3 font-mono">{c.column}</td>
                      <td className="py-1 pr-3 font-mono text-muted-foreground">{c.type}</td>
                      <td className="py-1 font-mono text-muted-foreground">{c.sample_values.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {lineage && (
            <SectionCard title="Lineage" className="mt-4">
              <InfoList
                items={[
                  { label: "Upstream", value: lineage.upstream.join(", ") },
                  { label: "Downstream", value: lineage.downstream.join(", ") },
                ]}
              />
            </SectionCard>
          )}

          <SectionCard title="Usage & access" className="mt-4">
            <InfoList
              items={[
                { label: "Owner", value: selected.owner },
                { label: "Access level", value: <StatusBadge tone={accessTone(selected.access_level)}>{selected.access_level}</StatusBadge> },
                { label: "Consumers", value: "churn-classifier, ltv-regressor, 3 dashboards" },
                { label: "Queries (30d)", value: "1,284" },
              ]}
            />
          </SectionCard>

          {!selected.has_access && (
            <SectionCard title="Request access" className="mt-4">
              <Field label="Justification" required hint="Explain the intended use for approval.">
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Training a churn model for Q3 retention…"
                />
              </Field>
              <Button
                className="mt-3"
                onClick={async () => {
                  if (justification.trim().length < 10) {
                    toast.error("Please add a fuller justification");
                    return;
                  }
                  const { ticket_id } = await requestDatasetAccess(selected.id, justification);
                  toast.success(`Access requested — ticket ${ticket_id}`);
                  setSelected(null);
                  setJustification("");
                }}
              >
                Submit access request
              </Button>
            </SectionCard>
          )}

          {selected.has_access && onUse && (
            <Button
              className="mt-4"
              onClick={() => {
                onUse(selected);
                setSelected(null);
              }}
            >
              Use this dataset
            </Button>
          )}
        </>
      )}
    </SideDrawer>
  );

  if (embedded) {
    return (
      <>
        {grid}
        {drawer}
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dataset Catalog"
        description="Discover datasets, inspect schema and lineage, and request access."
      />
      {grid}
      {drawer}
    </div>
  );
};

export default DatasetCatalog;
