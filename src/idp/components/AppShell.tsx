import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Route as RouteIcon, X } from "lucide-react";
import { TopHeader } from "./TopHeader";
import { Sidebar } from "./Sidebar";
import { getPersonaModule, personaForPath } from "../personas/registry";
import { usePreferences } from "../preferences";
import { usePersona } from "../state/persona";
import { useJourney } from "../state/journey";
import { FlowViewerButton } from "../flows/FlowViewerButton";
import { flowForPath } from "../flows/flowConfigs";
import { cn } from "@/lib/utils";

const prettify = (seg?: string) =>
  seg ? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Dashboard";

/** Home > Persona workspace > Screen (spec Connection 8), derived from the URL. */
const Breadcrumbs = ({ personaId }: { personaId?: string }) => {
  const { pathname } = useLocation();
  const segs = pathname.split("/").filter(Boolean);
  const persona = personaId ? getPersonaModule(personaId) : undefined;
  // Screen segment: the part after the persona id, else the second segment.
  const screenSeg = persona && segs[0] === persona.id ? segs[1] : segs[1] ?? segs[0];

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/" className="hover:text-brand-purple">Home</Link>
      {persona && (
        <>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/${persona.id}/dashboard`} className="hover:text-brand-purple">{persona.label}</Link>
        </>
      )}
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground">{prettify(screenSeg)}</span>
    </nav>
  );
};

/** Guided journey banner (spec Connection 6). Rendered in the shell so it
 *  persists across every screen while a journey is active. */
const JourneyBanner = () => {
  const journey = useJourney();
  const navigate = useNavigate();
  if (!journey.journey) return null;

  const { title, steps } = journey.journey;
  const atEnd = journey.step >= steps.length - 1;
  const current = steps[journey.step];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-brand-border bg-brand-tint/60 px-3 py-2 text-sm">
      <RouteIcon className="h-4 w-4 text-brand-purple" />
      <span className="font-medium text-brand-purple">{title}</span>
      <span className="text-muted-foreground">
        {atEnd ? "Journey complete ✓" : `Step ${journey.step + 1} of ${steps.length}: ${current.label}`}
      </span>
      <span className="ml-auto flex items-center gap-2">
        {!atEnd && (
          <button
            onClick={() => { const url = journey.next(); if (url) navigate(url); }}
            className="rounded-md bg-brand-purple px-2 py-1 text-xs font-medium text-white hover:opacity-90"
          >
            Next step →
          </button>
        )}
        <button
          onClick={journey.exit}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Exit journey
        </button>
      </span>
    </div>
  );
};

/**
 * Common chrome for the portal: top header (persistent) + a persona-scoped
 * sidebar + the routed screen. The active persona comes from the URL when on a
 * persona screen, else from the shared "idp_persona" preference. On the homepage
 * ("/") the sidebar and breadcrumb are hidden — it's a full-width front door.
 */
export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { persona: activePersonaId } = usePersona();
  const persona = personaForPath(location.pathname) ?? getPersonaModule(activePersonaId);
  const { collapsedDefault } = usePreferences();

  const isHome = location.pathname === "/";
  const flowId = flowForPath(location.pathname);

  // Collapse to icon-only on smaller viewports, or if the user prefers it.
  const [collapsed, setCollapsed] = useState(
    (typeof window !== "undefined" && window.innerWidth < 1024) || collapsedDefault
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (collapsedDefault) setCollapsed(true);
  }, [collapsedDefault]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopHeader />
      <div className="flex-1 flex min-h-0">
        {!isHome && (
          <Sidebar
            persona={persona}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          <div className={cn("container mx-auto px-6 py-8", isHome ? "max-w-6xl" : "max-w-7xl")}>
            {!isHome && (
              <div className="mb-4 flex items-center justify-between gap-3">
                <Breadcrumbs personaId={persona?.id} />
                {flowId && <FlowViewerButton flowId={flowId} />}
              </div>
            )}
            {!isHome && <JourneyBanner />}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
