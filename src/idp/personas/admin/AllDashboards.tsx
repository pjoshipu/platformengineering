import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/idp/components";
import AiDashboard from "../ai-engineer/Dashboard";
import AgenticDashboard from "../agentic-engineer/Dashboard";
import DsDashboard from "../data-scientist/Dashboard";
import AppDashboard from "../app-engineer/Dashboard";
import MlopsDashboard from "../mlops/Dashboard";
import SecurityDashboard from "../security/Dashboard";
import DeDashboard from "../data-engineer/Dashboard";

/**
 * Admin "all dashboards together" — every specialist persona's real dashboard in
 * one place, as tabs. The persona dashboards are self-contained (each reads its
 * own mock data), so the admin sees exactly what each engineer would.
 */

const TABS: { id: string; label: string; element: React.ReactNode }[] = [
  { id: "ai-engineer", label: "AI Engineer", element: <AiDashboard /> },
  { id: "agentic-engineer", label: "Agentic Engineer", element: <AgenticDashboard /> },
  { id: "data-scientist", label: "Data Scientist", element: <DsDashboard /> },
  { id: "app-engineer", label: "Platform Engineer", element: <AppDashboard /> },
  { id: "mlops", label: "MLOps", element: <MlopsDashboard /> },
  { id: "security", label: "Security", element: <SecurityDashboard /> },
  { id: "data-engineer", label: "Data Engineer", element: <DeDashboard /> },
];

const AllDashboards = () => {
  return (
    <div>
      <PageHeader
        title="All dashboards"
        description="Every specialist workspace in one place. Switch tabs to see what each engineer sees."
      />
      <Tabs defaultValue={TABS[0].id}>
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent key={t.id} value={t.id} className="mt-0">
            {t.element}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AllDashboards;
