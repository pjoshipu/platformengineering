import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle2 } from "lucide-react";
import {
  PageHeader,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  EmptyState,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { getTemplates, getTemplate, type Template } from "./api";

/**
 * Capability 1.2 — Curated Templates. ONE persona-aware screen: the active
 * persona (from auth) selects the category options, the persona-specific
 * preview fields, and the row actions. Data comes from getTemplates(persona, …).
 */

interface PreviewField {
  key: string;
  label: string;
}

interface PersonaTemplateConfig {
  /** template categories this persona sees (for the category filter) */
  categories: string[];
  /** persona-specific preview fields, mapped from template.preview[key] */
  preview: PreviewField[];
  /** action button labels shown in the drawer (they toast) */
  actions: string[];
}

const CONFIG: Record<string, PersonaTemplateConfig> = {
  "ai-engineer": {
    categories: ["RAG pipeline", "LLM API wrapper", "Agent-service scaffold", "Guardrail policy set", "Prompt template library"],
    preview: [
      { key: "guardrails", label: "Included guardrails" },
      { key: "providers", label: "Provider compatibility" },
      { key: "est_cost", label: "Est. cost" },
    ],
    actions: ["Use", "Clone & customise", "Submit to library"],
  },
  "agentic-engineer": {
    categories: ["Agent scaffold", "Tool-binding preset", "Autonomy-policy preset", "HITL checkpoint set", "Eval-scenario pack"],
    preview: [
      { key: "runtime", label: "Runtime" },
      { key: "tools", label: "Bundled tools + scopes" },
      { key: "autonomy", label: "Autonomy defaults" },
      { key: "hitl", label: "HITL rules" },
    ],
    actions: ["Use", "Clone", "Submit"],
  },
  "data-scientist": {
    categories: ["Training-job config", "Experiment notebook", "Model-serving Score spec", "Eval report structure"],
    preview: [
      { key: "framework", label: "Framework" },
      { key: "hyperparameters", label: "Default hyperparameters" },
      { key: "quality_checks", label: "Included quality checks" },
      { key: "dataset", label: "Example dataset path" },
    ],
    actions: ["Use", "Pre-fill training request"],
  },
  "app-engineer": {
    categories: ["Score-spec scaffold", "Crossplane resource claim", "Kong route config", "GitOps folder structure"],
    preview: [
      { key: "dependencies", label: "Resource-dependency defaults" },
      { key: "environments", label: "Environment presets" },
      { key: "example", label: "Example YAML" },
      { key: "provisioning", label: "Provisioning time" },
    ],
    actions: ["Use", "Deploy directly", "Save as draft"],
  },
  mlops: {
    categories: ["Pipeline DAG starter", "Drift-monitor config", "Retraining-rule preset", "Infra sizing guide"],
    preview: [
      { key: "compute", label: "Compute defaults" },
      { key: "alert_thresholds", label: "Alert-threshold presets" },
      { key: "model_types", label: "Compatible model types" },
    ],
    actions: ["Use", "Attach to model"],
  },
  security: {
    categories: ["OPA policy template", "Audit report format"],
    preview: [
      { key: "enforcement", label: "Enforcement action default" },
      { key: "scope", label: "Scope options" },
      { key: "test_sample", label: "Included test sample" },
    ],
    actions: ["Deploy from template", "Customise & save"],
  },
  "data-engineer": {
    categories: ["Pipeline DAG starter", "Data-quality check bundle", "Dataset schema template", "Feature-group scaffold"],
    preview: [
      { key: "source_compat", label: "Source-type compatibility" },
      { key: "quality_checks", label: "Default quality checks" },
      { key: "output_format", label: "Output format" },
    ],
    actions: ["Use", "Pre-fill pipeline builder"],
  },
};

const Templates = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const config = CONFIG[personaId] ?? { categories: [], preview: [], actions: [] };

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");

  const { data: templates, loading } = useMockQuery(
    () => getTemplates(personaId, { q, category }),
    [personaId, q, category]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detail } = useMockQuery(
    () => (selectedId ? getTemplate(personaId, selectedId) : Promise.resolve(undefined)),
    [personaId, selectedId]
  );

  const rows = templates ?? [];

  const handleAction = (action: string, tpl: { name: string }) => {
    if (action === "Use") toast(`Prefilled the relevant form from "${tpl.name}"`);
    else if (action.startsWith("Pre-fill")) toast(`Prefilled: ${action.replace("Pre-fill ", "")} from "${tpl.name}"`);
    else if (action.startsWith("Deploy")) toast(`Deploying from template: ${tpl.name}`);
    else toast(`${action}: ${tpl.name}`);
  };

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates, categories, tags…" className="pl-9" />
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {config.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Curated Templates"
        description="Pre-approved scaffolds for your stack — preview, use, or contribute your own."
        actions={
          <Button onClick={() => toast("Opening template submission form (coming soon)")}>
            Submit to library
          </Button>
        }
      />

      {toolbar}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-muted-foreground py-12 text-center">Loading templates…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No templates match" description="Adjust search or category filter." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((tpl) => (
              <Card
                key={tpl.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors flex flex-col gap-3"
                onClick={() => setSelectedId(tpl.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium leading-tight">{tpl.name}</div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{tpl.version}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="neutral">{tpl.category}</StatusBadge>
                  {tpl.approved && (
                    <StatusBadge tone="success">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                      Approved
                    </StatusBadge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {tpl.tags.map((tag) => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <dl className="mt-1 space-y-1 text-xs">
                  {config.preview.map((f) => (
                    <div key={f.key} className="flex gap-2">
                      <dt className="text-muted-foreground shrink-0">{f.label}:</dt>
                      <dd className="truncate">{tpl.preview[f.key] ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={detail?.name ?? ""}
        description={detail ? `${detail.category} · ${detail.version}` : undefined}
        wide
      >
        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="neutral">{detail.category}</StatusBadge>
              {detail.approved && (
                <StatusBadge tone="success">
                  <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                  Approved
                </StatusBadge>
              )}
              {detail.tags.map((tag) => (
                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">{detail.readme}</p>

            <SectionCard title="Preview">
              <InfoList
                items={config.preview.map((f) => ({
                  label: f.label,
                  value: String(detail.preview[f.key] ?? "—"),
                }))}
              />
            </SectionCard>

            <SectionCard title="Example config">
              <pre className="font-mono text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre">
                {detail.config}
              </pre>
            </SectionCard>

            <SectionCard title="Actions">
              <div className="flex flex-wrap gap-2">
                {config.actions.map((a) => (
                  <Button
                    key={a}
                    variant={a === "Use" || a.startsWith("Deploy") ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAction(a, detail)}
                  >
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

export default Templates;
