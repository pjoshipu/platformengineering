import { LayoutDashboard, ShieldCheck, KeyRound, ScrollText, DollarSign, FileCheck, Shield } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import PolicyManager from "./PolicyManager";
import AccessGovernance from "./AccessGovernance";
import AuditLog from "./AuditLog";
import CostAttribution from "./CostAttribution";
import ComplianceReports from "./ComplianceReports";

const nav = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Policy Manager", path: "policies", icon: ShieldCheck },
  { label: "Access Governance", path: "access", icon: KeyRound },
  { label: "Audit Log", path: "audit", icon: ScrollText },
  { label: "Cost Attribution", path: "cost", icon: DollarSign },
  { label: "Compliance Reports", path: "reports", icon: FileCheck },
];

const security: PersonaModule = {
  id: "security",
  label: "Security / Compliance Engineer",
  icon: Shield,
  blurb: "Policy management, audit, access governance, compliance.",
  nav,
  routes: [
    { path: "security/dashboard", element: <Dashboard /> },
    { path: "security/policies", element: <PolicyManager /> },
    { path: "security/access", element: <AccessGovernance /> },
    { path: "security/audit", element: <AuditLog /> },
    { path: "security/cost", element: <CostAttribution /> },
    { path: "security/reports", element: <ComplianceReports /> },
  ],
};

export default security;
