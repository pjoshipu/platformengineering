import { useNavigate } from "react-router-dom";
import { PageHeader, MetricsRow, MetricCard, SectionCard } from "@/idp/components";
import { Button } from "@/components/ui/button";
import { Users, UserCog, LayoutGrid, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resolvePersona, personaLabel } from "../../identity/resolvePersona";

/** Admin landing: platform-wide counts + jumps to the all-dashboards and profiles screens. */
const Overview = () => {
  const { savedProfiles, directory } = useAuth();
  const navigate = useNavigate();

  const all = [...savedProfiles, ...directory];
  const counts = new Map<string, number>();
  for (const p of all) {
    const id = resolvePersona(p).personaId;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader title="Admin overview" description="Everything across the platform at a glance." />

      <MetricsRow>
        <MetricCard label="Engineers" value={all.length} icon={Users} />
        <MetricCard label="Created profiles" value={savedProfiles.length} icon={UserCog} tone="highlight" />
        <MetricCard label="Demo engineers" value={directory.length} />
        <MetricCard label="Workspaces in use" value={counts.size} icon={LayoutGrid} />
      </MetricsRow>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <SectionCard title="Engineers per workspace">
          {counts.size === 0 ? (
            <p className="text-sm text-muted-foreground">No engineers yet.</p>
          ) : (
            <div className="space-y-2">
              {[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, c]) => (
                <div key={id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <span>{personaLabel(id)}</span>
                  <span className="font-mono text-muted-foreground">{c}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/admin/dashboards")}>
              View all dashboards <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/admin/profiles")}>
              Manage profiles <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Overview;
