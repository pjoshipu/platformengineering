import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { getAgents, getAgentVersions, type Agent } from "./api";

const AgentRegistry = () => {
  const navigate = useNavigate();
  const { data: agents, loading } = useMockQuery(getAgents, []);
  const [selected, setSelected] = useState<Agent | null>(null);
  const { data: versions } = useMockQuery(
    () => (selected ? getAgentVersions(selected.id) : Promise.resolve([])),
    [selected?.id]
  );

  const columns: Column<Agent>[] = [
    { key: "name", header: "Agent", sortable: true, render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "goal", header: "Goal", render: (a) => <span className="text-sm text-muted-foreground line-clamp-1">{a.goal}</span> },
    { key: "runtime", header: "Runtime", render: (a) => <span className="text-xs">{a.runtime}</span> },
    { key: "autonomy", header: "Autonomy", render: (a) => <StatusBadge tone={a.autonomy === "High" ? "warning" : a.autonomy === "Medium" ? "info" : "neutral"}>{a.autonomy}</StatusBadge> },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
    { key: "avg_steps", header: "Avg steps", align: "right", sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Agent Registry"
        description="Every registered autonomous agent, its runtime, bound tools, and version history."
        actions={<Button onClick={() => navigate("/idp/agentic-engineer/deploy")}>Deploy Agent</Button>}
      />
      <DataTable columns={columns} rows={agents ?? []} rowKey={(a) => a.id} loading={loading} onRowClick={(a) => setSelected(a)} />

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected?.goal}
        wide
      >
        {selected && (
          <>
            <SectionCard title="Configuration">
              <InfoList
                items={[
                  { label: "Runtime", value: selected.runtime },
                  { label: "Model", value: <span className="font-mono text-xs">{selected.model}</span> },
                  { label: "Tools bound", value: String(selected.tools) },
                  { label: "Autonomy", value: <StatusBadge tone={selected.autonomy === "High" ? "warning" : "info"}>{selected.autonomy}</StatusBadge> },
                  { label: "Status", value: <StatusBadge>{selected.status}</StatusBadge> },
                  { label: "Success rate", value: `${(selected.success_rate * 100).toFixed(0)}%` },
                  { label: "Cost/day", value: `$${selected.cost_day.toFixed(2)}` },
                ]}
              />
            </SectionCard>

            <SectionCard title="Lineage">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {["Goal", "Planner", "Tools", "Runtime", "Endpoint"].map((n, i) => (
                  <span key={n} className="flex items-center gap-2">
                    <span className="rounded-md border border-border px-2 py-1">{n}</span>
                    {i < 4 && <span className="text-muted-foreground">→</span>}
                  </span>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Versions">
              <div className="space-y-2">
                {(versions ?? []).map((v) => (
                  <div key={v.version} className="flex items-center justify-between border-b border-border pb-2 last:border-0 text-sm">
                    <div>
                      <span className="font-mono text-xs">{v.version}</span>
                      <div className="text-xs text-muted-foreground">{v.deployed_by} · {timeAgo(v.date)} · {(v.success_rate * 100).toFixed(0)}% success</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge>{v.status}</StatusBadge>
                      <Button variant="ghost" size="sm" onClick={() => toast.success(`Rolled back ${selected.name} to ${v.version}`)}>Rollback</Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default AgentRegistry;
