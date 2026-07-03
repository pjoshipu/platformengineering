import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { PersonaModule } from "../types";

interface SidebarProps {
  persona?: PersonaModule;
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ persona, collapsed, onToggle }: SidebarProps) => {
  const PersonaIcon = persona?.icon;
  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-card/40 flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Active persona context (fixed by login — no switching) */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? persona?.label : undefined}
        >
          {PersonaIcon && <PersonaIcon className="w-4 h-4 text-primary shrink-0" />}
          {!collapsed && (
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                Workspace
              </span>
              <span className="block font-medium truncate">{persona?.label}</span>
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {persona?.nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={`/idp/${persona.id}/${item.path}`}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="m-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {collapsed ? (
          <PanelLeftOpen className="w-4 h-4" />
        ) : (
          <>
            <PanelLeftClose className="w-4 h-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
