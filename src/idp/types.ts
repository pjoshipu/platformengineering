import type { LucideIcon } from "lucide-react";
import type { RouteObject } from "react-router-dom";

/** A single sidebar navigation entry for a persona. */
export interface IdpNavItem {
  label: string;
  /** path relative to the persona base, e.g. "dashboard" or "deploy" */
  path: string;
  icon: LucideIcon;
  /** sidebar section this item belongs to (e.g. "Workspace", "Software Assets") */
  group?: string;
}

/**
 * A persona is a self-contained module: it owns its nav, its routes, and its
 * own mock API. The registry stitches all personas into the AppShell. Building
 * a new persona = create a folder under personas/ and add it to the registry.
 */
export interface PersonaModule {
  /** stable id + base path segment, e.g. "app-engineer" */
  id: string;
  /** human label shown in the persona switcher */
  label: string;
  icon: LucideIcon;
  /** one-line description for the switcher */
  blurb: string;
  nav: IdpNavItem[];
  /**
   * Routes relative to /idp. Each path should be prefixed with the persona id,
   * e.g. { path: "app-engineer/dashboard", element: <Dashboard/> }.
   */
  routes: RouteObject[];
}

export interface UserProfile {
  name: string;
  role: string;
  persona: string;
  avatar_url?: string;
}
