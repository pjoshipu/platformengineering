import { LayoutGrid, LayoutDashboard, Users, ShieldCheck } from "lucide-react";
import type { PersonaModule } from "../../types";
import Overview from "./Overview";
import AllDashboards from "./AllDashboards";
import Profiles from "./Profiles";

const nav = [
  { label: "Overview", path: "overview", icon: LayoutDashboard },
  { label: "All Dashboards", path: "dashboards", icon: LayoutGrid },
  { label: "Profiles", path: "profiles", icon: Users },
];

/**
 * Administrator workspace. Unlike the seven specialist personas it does NOT get
 * the shared capability screens — it is a cross-cutting console: every dashboard
 * in one place plus profile management.
 */
const admin: PersonaModule = {
  id: "admin",
  label: "Administrator",
  icon: ShieldCheck,
  blurb: "Oversee every workspace and manage engineer profiles.",
  nav,
  routes: [
    { path: "admin/overview", element: <Overview /> },
    { path: "admin/dashboards", element: <AllDashboards /> },
    { path: "admin/profiles", element: <Profiles /> },
  ],
};

export default admin;
