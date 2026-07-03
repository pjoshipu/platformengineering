import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bot, Search, Star, Code2, Database, Server, ShieldCheck, Activity,
  MessagesSquare, DollarSign, type LucideIcon,
} from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAgents, CATEGORIES, SCOPES, PERSONA_NAMES, SORTS, personaDisplayName,
  type Agent, type Category,
} from "./api";

/**
 * Capability — IDP Agent Marketplace, Screen 1. Persona-agnostic card grid of
 * worker agents. Two tabs (Marketplace | Custom); live filter bar refetches via
 * getAgents on every change. Cards link to the detail screen; the Custom tab
 * offers a "Build new agent" action.
 */

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  "Code & Testing": Code2,
  "Data & ML": Database,
  Infrastructure: Server,
  Security: ShieldCheck,
  Observability: Activity,
  Collaboration: MessagesSquare,
  Cost: DollarSign,
};

/** Category → tint (icon square background + foreground). */
const CATEGORY_TINT: Record<Category, string> = {
  "Code & Testing": "bg-blue-500/10 text-blue-600",
  "Data & ML": "bg-purple-500/10 text-purple-600",
  Infrastructure: "bg-orange-500/10 text-orange-600",
  Security: "bg-red-500/10 text-red-600",
  Observability: "bg-teal-500/10 text-teal-600",
  Collaboration: "bg-pink-500/10 text-pink-600",
  Cost: "bg-green-500/10 text-green-600",
};

/** Compact use-count formatter: 1200 → "1.2k". */
const compact = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${n}`;

const AgentCard = ({ agent, onOpen }: { agent: Agent; onOpen: () => void }) => {
  const Icon = CATEGORY_ICON[agent.category] ?? Bot;
  const tint = CATEGORY_TINT[agent.category] ?? "bg-muted text-muted-foreground";
  const onHarness = agent.available_on?.includes("Harness");
  return (
    <Card
      className="p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-tight truncate">{agent.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">by {agent.author}</div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3">{agent.description_short}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge tone="neutral">{agent.scope}</StatusBadge>
        {onHarness && <StatusBadge tone="info">Harness</StatusBadge>}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-1">
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
          {agent.rating.toFixed(1)}
        </span>
        <span>{compact(agent.use_count)} uses</span>
        <span>{agent.version}</span>
      </div>
    </Card>
  );
};

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const personaId = user?.persona ?? "";

  const [tab, setTab] = useState<"marketplace" | "custom">("marketplace");
  const [q, setQ] = useState("");
  const [persona, setPersona] = useState<string>(() => personaDisplayName(personaId) || "all");
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState<string>("Most used");

  const { data: agents, loading } = useMockQuery(
    () => getAgents({ tab, persona, category, scope, sort, q }),
    [tab, persona, category, scope, sort, q]
  );

  const rows = agents ?? [];

  const resetFilters = () => {
    setQ("");
    setPersona("all");
    setCategory("all");
    setScope("all");
    setSort("Most used");
  };

  const openAgent = (id: string) => navigate(`/idp/${personaId}/agents/${id}`);

  const filterBar = (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="relative flex-1 min-w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search agents by name or description…"
          className="pl-9"
        />
      </div>
      <Select value={persona} onValueChange={setPersona}>
        <SelectTrigger className="w-52"><SelectValue placeholder="Persona" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All personas</SelectItem>
          {PERSONA_NAMES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={scope} onValueChange={setScope}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Scope" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All scopes</SelectItem>
          {SCOPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
        <SelectContent>
          {SORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const grid = (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${rows.length} agent${rows.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {loading && <p className="text-sm text-muted-foreground py-8">Loading agents…</p>}

      {!loading && rows.length === 0 && (
        <EmptyState
          title="No agents found"
          description="No agents match your current filters."
          action={
            <Button variant="link" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      )}

      {!loading && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((a) => (
            <AgentCard key={a.id} agent={a} onOpen={() => openAgent(a.id)} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <PageHeader
          title="Worker Agents"
          description="Discover, deploy, and manage autonomous worker agents across the platform."
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "marketplace" | "custom")}>
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-4">
          {filterBar}
          {grid}
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate(`/idp/${personaId}/agents/build`)}>
              Build new agent
            </Button>
          </div>
          {filterBar}
          {grid}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Marketplace;
