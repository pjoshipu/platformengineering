import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Cloud, Package, DollarSign, GitBranch, Ticket, Activity, KeyRound,
  Database, MessageSquare, BookText, Sparkles, Plug, type LucideIcon,
} from "lucide-react";
import { PageHeader, MetricCard, MetricsRow, StatusBadge, EmptyState, type Tone } from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import {
  getConnectors, getConnectorSummary, CONNECTOR_CATEGORY_ORDER, type Connector, type ConnectorStatus,
} from "./api";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  "Cloud Providers": Cloud,
  "Artifact Repositories": Package,
  "Cloud & AI Costs": DollarSign,
  "Code Repositories": GitBranch,
  "Ticketing Systems": Ticket,
  "Monitoring & Logging": Activity,
  "Secret Managers": KeyRound,
  Database: Database,
  "Communication Tools": MessageSquare,
  Documentation: BookText,
  "AI Providers": Sparkles,
  "MCP Servers": Plug,
};

/** SDLC tools to feature at the top alongside GCP. */
const FEATURED_SDLC = new Set(["GitHub", "GitLab", "Bitbucket", "Jenkins", "Artifactory", "Jira", "ServiceNow"]);

const STATUS: Record<ConnectorStatus, { tone: Tone; action: string }> = {
  Connected: { tone: "success", action: "Manage" },
  Available: { tone: "info", action: "Connect" },
  "Upgrade required": { tone: "warning", action: "Upgrade" },
};

const ConnectorCard = ({ c }: { c: Connector }) => {
  const Icon = CATEGORY_ICON[c.category] ?? Plug;
  const s = STATUS[c.status];
  return (
    <Card className={`p-4 flex flex-col gap-2 transition-all hover:shadow-md ${c.gcp ? "ring-1 ring-primary/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{c.name}</div>
            <div className="text-xs text-muted-foreground truncate">{c.category}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <StatusBadge tone={s.tone}>{c.status}</StatusBadge>
        {c.gcp && <StatusBadge tone="active">GCP</StatusBadge>}
        {c.sdlc && <StatusBadge tone="info">SDLC</StatusBadge>}
      </div>
      <Button
        variant={c.status === "Available" ? "default" : "outline"}
        size="sm"
        className="mt-1"
        onClick={() => toast(`${s.action}: ${c.name}`)}
      >
        {s.action}
      </Button>
    </Card>
  );
};

const Connectors = () => {
  const { data: connectors, loading } = useMockQuery(getConnectors, []);
  const { data: summary } = useMockQuery(getConnectorSummary, []);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");

  const query = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      (connectors ?? []).filter(
        (c) =>
          (!query || c.name.toLowerCase().includes(query) || c.category.toLowerCase().includes(query)) &&
          (category === "all" || c.category === category)
      ),
    [connectors, query, category]
  );

  const featured = useMemo(
    () => (connectors ?? []).filter((c) => c.gcp || FEATURED_SDLC.has(c.name)),
    [connectors]
  );

  const showFeatured = !query && category === "all";

  const byCategory = CONNECTOR_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: filtered.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        title="Connectors"
        description="Connect the IDP to your cloud, SDLC, observability, secrets, and AI tools. GCP and software-delivery connectors are highlighted."
      />

      <MetricsRow>
        <MetricCard label="Connectors available" value={summary?.total ?? "—"} icon={Plug} />
        <MetricCard label="Connected" value={summary?.connected ?? "—"} icon={Cloud} tone="good" />
        <MetricCard label="GCP connectors" value={summary?.gcp ?? "—"} icon={Cloud} tone="highlight" />
        <MetricCard label="SDLC connectors" value={summary?.sdlc ?? "—"} icon={GitBranch} />
      </MetricsRow>

      <div className="flex flex-wrap gap-2 mt-6 mb-4">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search connectors…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CONNECTOR_CATEGORY_ORDER.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {showFeatured && featured.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Featured — GCP &amp; SDLC</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => <ConnectorCard key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading connectors…</p>}
      {!loading && byCategory.length === 0 && <EmptyState title="No connectors match" description="Try a different search or category." />}

      <div className="space-y-8">
        {byCategory.map(({ category: cat, items }) => {
          const Icon = CATEGORY_ICON[cat] ?? Plug;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">{cat}</h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
                {cat === "Secret Managers" && <StatusBadge tone="warning">Upgrade required</StatusBadge>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((c) => <ConnectorCard key={c.id} c={c} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Connectors;
