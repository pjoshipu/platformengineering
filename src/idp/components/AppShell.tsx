import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TopHeader } from "./TopHeader";
import { Sidebar } from "./Sidebar";
import { personaForPath } from "../personas/registry";
import { usePreferences } from "../preferences";

/**
 * Common chrome for every IDP screen: top header (logo, search, notifications,
 * user menu) + a persona-scoped sidebar. The active persona is derived from the
 * URL so the nav stays in sync no matter how the user navigates.
 */
export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const persona = personaForPath(location.pathname);
  const { collapsedDefault } = usePreferences();

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

  // Reflect the "start collapsed" preference when it's turned on in Settings.
  useEffect(() => {
    if (collapsedDefault) setCollapsed(true);
  }, [collapsedDefault]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopHeader />
      <div className="flex-1 flex min-h-0">
        <Sidebar
          persona={persona}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
