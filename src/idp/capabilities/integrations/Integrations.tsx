import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug } from "lucide-react";
import {
  PageHeader,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  EmptyState,
  type Tone,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getIntegrations,
  testIntegration,
  setIntegrationEnabled,
  type Integration,
} from "./api";

/**
 * Capability 3.2 — Platform Integrations. ONE persona-aware screen: the active
 * persona (from auth) selects which pre-built connections to their external
 * tools are shown, and what live data each surfaces inside the IDP. Data comes
 * from getIntegrations(persona).
 */

const STATUS_TONE: Record<Integration["status"], Tone> = {
  Connected: "success",
  Degraded: "warning",
  Disconnected: "danger",
};

const Integrations = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";

  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const { data: integrations, loading } = useMockQuery(
    () => getIntegrations(personaId),
    [personaId]
  );

  const all = integrations ?? [];

  const categoryOptions = useMemo(
    () => Array.from(new Set(all.map((i) => i.category))),
    [all]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(all.map((i) => i.status))),
    [all]
  );

  const filtered = all.filter(
    (i) =>
      (category === "all" || i.category === category) &&
      (status === "all" || i.status === status)
  );

  const selected = all.find((i) => i.id === selectedId);

  const runTest = async (i: Integration) => {
    setTesting(true);
    try {
      const res = await testIntegration(i.id);
      toast.success(res.status);
    } finally {
      setTesting(false);
    }
  };

  const toggleConnection = async (i: Integration) => {
    const enable = i.status !== "Connected";
    const res = await setIntegrationEnabled(i.id, enable);
    toast(res.status);
  };

  return (
    <div>
      <PageHeader
        title="Platform Integrations"
        description="Pre-built connections to your external tools, surfacing their data inside the platform."
        actions={
          <div className="flex flex-wrap gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
        }
      />

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No integrations"
          description={
            all.length === 0
              ? "No pre-built connections are configured for your persona yet."
              : "No integrations match the selected filters."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(loading ? [] : filtered).map((i) => {
            const stats = i.surfaced.slice(0, 2);
            return (
              <Card
                key={i.id}
                className="p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelectedId(i.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.category}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[i.status] ?? "neutral"}>{i.status}</StatusBadge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-md border border-border px-2 py-1.5">
                      <p className="text-[11px] text-muted-foreground truncate">{s.label}</p>
                      <p className="text-sm font-medium truncate">{s.value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Last sync {timeAgo(i.last_sync)}
                </p>
              </Card>
            );
          })}
          {loading &&
            Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="p-4 h-32 animate-pulse bg-muted/40" />
            ))}
        </div>
      )}

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.category} · last sync ${timeAgo(selected.last_sync)}` : undefined}
        wide
      >
        {selected && (
          <>
            <div>
              <StatusBadge tone={STATUS_TONE[selected.status] ?? "neutral"}>{selected.status}</StatusBadge>
            </div>

            <SectionCard title="Surfaced in the platform" description="Live data this integration brings into the IDP.">
              <InfoList items={selected.surfaced.map((s) => ({ label: s.label, value: s.value }))} />
            </SectionCard>

            <SectionCard title="Connection config">
              <InfoList
                items={selected.config.map((c) => ({
                  label: c.label,
                  value: <span className="font-mono text-xs">{c.value}</span>,
                }))}
              />
            </SectionCard>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={testing} onClick={() => runTest(selected)}>
                {testing ? "Testing…" : "Test connection"}
              </Button>
              <Button
                variant={selected.status === "Connected" ? "ghost" : "default"}
                size="sm"
                onClick={() => toggleConnection(selected)}
              >
                {selected.status === "Connected" ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Integrations;
