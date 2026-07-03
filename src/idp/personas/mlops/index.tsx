import { LayoutDashboard, Workflow, TrendingUp, RefreshCw, Server, ScrollText, Cog } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import PipelineMonitor from "./PipelineMonitor";
import DriftMonitorList from "./DriftMonitorList";
import DriftMonitor from "./DriftMonitor";
import RetrainingRules from "./RetrainingRules";
import InfrastructureMl from "./InfrastructureMl";
import AuditLog from "./AuditLog";

const mlops: PersonaModule = {
  id: "mlops",
  label: "MLOps Engineer",
  icon: Cog,
  blurb: "Pipeline reliability, drift monitoring, automated retraining.",
  nav: [
    { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
    { label: "Pipeline Monitor", path: "pipelines", icon: Workflow },
    { label: "Drift Monitor", path: "drift", icon: TrendingUp },
    { label: "Retraining Rules", path: "retraining-rules", icon: RefreshCw },
    { label: "Infrastructure (ML)", path: "infrastructure", icon: Server },
    { label: "Audit Log", path: "audit", icon: ScrollText },
  ],
  routes: [
    { path: "mlops/dashboard", element: <Dashboard /> },
    { path: "mlops/pipelines", element: <PipelineMonitor /> },
    { path: "mlops/drift", element: <DriftMonitorList /> },
    { path: "mlops/drift/:modelId", element: <DriftMonitor /> },
    { path: "mlops/retraining-rules", element: <RetrainingRules /> },
    { path: "mlops/infrastructure", element: <InfrastructureMl /> },
    { path: "mlops/audit", element: <AuditLog /> },
  ],
};

export default mlops;
