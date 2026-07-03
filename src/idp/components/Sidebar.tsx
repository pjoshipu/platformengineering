import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { PersonaModule, IdpNavItem } from "../types";

interface SidebarProps {
  persona?: PersonaModule;
  collapsed: boolean;
  onToggle: () => void;
}

/** Preferred section order; unknown groups fall to the end in first-seen order. */
const GROUP_ORDER = [
  "Workspace",
  "Software Assets",
  "Knowledge",
  "Environment",
  "Administration",
  "Agents",
];

export const Sidebar = ({ persona, collapsed, onToggle }: SidebarProps) => {
  const PersonaIcon = persona?.icon;

  // Group nav items into sections so the (now long) sidebar stays scannable.
  const byGroup = new Map<string, IdpNavItem[]>();
  for (const item of persona?.nav ?? []) {
    const g = item.group ?? "Workspace";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(item);
  }
  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => byGroup.has(g)),
    ...[...byGroup.keys()].filter((g) => !GROUP_ORDER.includes(g)),
  ].map((group) => ({ group, items: byGroup.get(group)! }));
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

      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        {orderedGroups.map(({ group, items }, gi) => (
          <div key={group} className={cn(gi > 0 && "mt-2")}>
            {!collapsed ? (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group}
              </div>
            ) : (
              gi > 0 && <div className="mx-2 my-2 border-t border-border" />
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={`/idp/${persona!.id}/${item.path}`}
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
            </div>
          </div>
        ))}
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
