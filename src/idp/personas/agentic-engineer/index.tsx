import { LayoutDashboard, Rocket, Boxes, Route, ShieldQuestion, Wrench, Bot } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import DeployAgent from "./DeployAgent";
import AgentRegistry from "./AgentRegistry";
import RunTraces from "./RunTraces";
import Autonomy from "./Autonomy";
import ToolRegistry from "./ToolRegistry";

const nav = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Deploy Agent", path: "deploy", icon: Rocket },
  { label: "Agent Registry", path: "agents", icon: Boxes },
  { label: "Run Traces", path: "runs", icon: Route },
  { label: "Autonomy & Checkpoints", path: "autonomy", icon: ShieldQuestion },
  { label: "Tool Registry", path: "tools", icon: Wrench },
];

const agenticEngineer: PersonaModule = {
  id: "agentic-engineer",
  label: "Agentic Engineer",
  icon: Bot,
  blurb: "Build & operate autonomous agents — runtime, tools, autonomy budgets, human-in-the-loop.",
  nav,
  routes: [
    { path: "agentic-engineer/dashboard", element: <Dashboard /> },
    { path: "agentic-engineer/deploy", element: <DeployAgent /> },
    { path: "agentic-engineer/agents", element: <AgentRegistry /> },
    { path: "agentic-engineer/runs", element: <RunTraces /> },
    { path: "agentic-engineer/autonomy", element: <Autonomy /> },
    { path: "agentic-engineer/tools", element: <ToolRegistry /> },
  ],
};

export default agenticEngineer;
