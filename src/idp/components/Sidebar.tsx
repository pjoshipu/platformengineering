import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, Home, ArrowRight } from "lucide-react";
import type { PersonaModule, IdpNavItem } from "../types";
import { usePreferences } from "../preferences";
import { useAuth } from "@/contexts/AuthContext";
import { useJourney } from "../state/journey";

interface SidebarProps {
  persona?: PersonaModule;
  collapsed: boolean;
  onToggle: () => void;
}

/** Preferred section order; unknown groups fall to the end in first-seen order. */
const GROUP_ORDER = [
  "Quick access",
  "Workspace",
  "Software Assets",
  "Knowledge Assets",
  "Environment Assets",
  "Marketplace",
  "Portal & Admin",
];

export const Sidebar = ({ persona, collapsed, onToggle }: SidebarProps) => {
  const PersonaIcon = persona?.icon;
  const { isHidden } = usePreferences();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const journey = useJourney();

  // Group nav items into sections so the (now long) sidebar stays scannable.
  // Items the user hid in Settings are filtered out here.
  const byGroup = new Map<string, IdpNavItem[]>();
  for (const item of persona?.nav ?? []) {
    if (isHidden(item.path)) continue;
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
      {/* Workspace badge — auto-detected from the signed-in identity (read-only). */}
      <div className="p-3">
        <div
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? persona?.label : `${persona?.label} · auto-detected for ${profile.name}`}
        >
          {PersonaIcon && <PersonaIcon className="w-4 h-4 text-brand-purple shrink-0" />}
          {!collapsed && (
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Workspace · auto-detected</span>
              <span className="block font-medium truncate">{persona?.label}</span>
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-1 overflow-y-auto">
        {/* Home — links back to the front door (spec Connection 7b) */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-brand-tint text-brand-purple font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
          title={collapsed ? "Home" : undefined}
        >
          <Home className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Home</span>}
        </NavLink>

        {orderedGroups.map(({ group, items }, gi) => (
          <div key={group} className="mt-2">
            {!collapsed ? (
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group}
              </div>
            ) : (
              <div className="mx-2 my-2 border-t border-border" />
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={`/${persona!.id}/${item.path}`}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-brand-tint text-brand-purple font-medium"
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

      {/* Journey progress (spec Connection 7d) */}
      {journey.journey && !collapsed && (
        <div className="m-2 rounded-lg border border-brand-border bg-brand-tint/50 p-2.5">
          <div className="text-[11px] font-medium text-brand-purple truncate">{journey.journey.title}</div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            Step {journey.step + 1} of {journey.journey.steps.length}
          </div>
          <div className="mt-1 h-1 w-full rounded-full bg-border">
            <div
              className="h-1 rounded-full bg-brand-purple transition-all"
              style={{ width: `${((journey.step + 1) / journey.journey.steps.length) * 100}%` }}
            />
          </div>
          <button
            onClick={() => navigate(journey.journey!.steps[journey.step].url)}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brand-purple hover:underline"
          >
            Continue <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

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
