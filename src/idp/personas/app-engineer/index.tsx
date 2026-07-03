import { LayoutDashboard, PlusSquare, Boxes, GitBranch, Server, Network } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import NewServiceRequest from "./NewServiceRequest";
import MyServices from "./MyServices";
import GitOpsStatus from "./GitOpsStatus";
import Infrastructure from "./Infrastructure";
import ApiGateway from "./ApiGateway";

const appEngineer: PersonaModule = {
  id: "app-engineer",
  label: "App / Platform Engineer",
  icon: Server,
  blurb: "Deploy services, GitOps sync, infra provisioning, gateway config.",
  nav: [
    { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
    { label: "New Service Request", path: "deploy", icon: PlusSquare },
    { label: "My Services", path: "my-services", icon: Boxes },
    { label: "GitOps Status", path: "gitops", icon: GitBranch },
    { label: "Infrastructure", path: "infrastructure", icon: Server },
    { label: "API Gateway", path: "api-gateway", icon: Network },
  ],
  routes: [
    { path: "app-engineer/dashboard", element: <Dashboard /> },
    { path: "app-engineer/deploy", element: <NewServiceRequest /> },
    { path: "app-engineer/my-services", element: <MyServices /> },
    { path: "app-engineer/gitops", element: <GitOpsStatus /> },
    { path: "app-engineer/infrastructure", element: <Infrastructure /> },
    { path: "app-engineer/api-gateway", element: <ApiGateway /> },
  ],
};

export default appEngineer;
