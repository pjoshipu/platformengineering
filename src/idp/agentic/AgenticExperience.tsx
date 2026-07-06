import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { PageHeader, EmptyState, Loading } from "@/idp/components";
import DemoRunner from "@/components/DemoRunner";
import { DEMOS, DEMO_COLOR_CLASSES, getDemoById } from "@/config/demos";
import { useAuth } from "@/contexts/AuthContext";
import { useMockQuery } from "@/idp/api/client";
import { getCuratedForPersona } from "./curated";
import { getPersonaAgentContext } from "./context";

/**
 * Per-persona Agentic Experience. Shows the agents curated for the logged-in
 * role as cards; selecting one loads context LIVE from that persona's dashboard
 * data and runs the agent (inputs + prompt) tailored to their role.
 */
const AgenticExperience = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";
  const { intro, agentIds } = getCuratedForPersona(personaId);
  const agents = agentIds
    .map(getDemoById)
    .filter((d): d is (typeof DEMOS)[number] => Boolean(d));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? getDemoById(selectedId) : undefined;

  // Live persona context for the selected agent (from their api.ts mock data).
  const { data: context, loading } = useMockQuery(
    () =>
      selected
        ? getPersonaAgentContext(personaId, selected.id)
        : Promise.resolve(undefined),
    [personaId, selectedId]
  );

  if (selected) {
    // DemoRunner renders its own title, description, and close control, so we
    // don't add a PageHeader here (that duplicated the whole header block).
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedId(null)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to agents
        </Button>
        {loading || !context ? (
          <Loading label="Loading your workspace context…" />
        ) : (
          <DemoRunner
            key={`${personaId}-${selected.id}`}
            demo={selected}
            onClose={() => setSelectedId(null)}
            userRole="developer"
            contextSeed={context.seed}
            contextProfile={context.profile}
            contextSummary={context.summary}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Agentic Experience" description={intro} />

      {agents.length === 0 ? (
        <EmptyState title="No agents configured for this role yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const color = DEMO_COLOR_CLASSES[agent.color];
            return (
              <Card
                key={agent.id}
                className="p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 flex flex-col"
                onClick={() => setSelectedId(agent.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color.bg}`}>
                  <Icon className={`w-5 h-5 ${color.text}`} />
                </div>
                <h3 className="font-semibold mb-1">{agent.title}</h3>
                <p className="text-sm text-muted-foreground flex-1">{agent.description}</p>
                <span className="text-xs font-medium text-primary mt-3">Run agent →</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgenticExperience;
