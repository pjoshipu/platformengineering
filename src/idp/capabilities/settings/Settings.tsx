import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/idp/components";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences } from "@/idp/preferences";
import { getPersonaModule } from "@/idp/personas/registry";
import type { IdpNavItem } from "@/idp/types";

/**
 * Personalization. Primary feature: customize the left-hand menu — pick which
 * nav items appear (persisted per persona). Plus an appearance toggle.
 */
const Settings = () => {
  const { user } = useAuth();
  const persona = user?.persona ?? "";
  const module = getPersonaModule(persona);
  const { isHidden, toggleNav, showAll, hideAll, collapsedDefault, setCollapsedDefault } = usePreferences();

  // Master list = the persona's full nav, de-duplicated by path (Software
  // Catalog appears in both Quick access and its pillar), grouped in nav order.
  const seen = new Set<string>();
  const groups: { group: string; items: IdpNavItem[] }[] = [];
  for (const item of module?.nav ?? []) {
    if (seen.has(item.path)) continue;
    seen.add(item.path);
    const g = item.group ?? "Workspace";
    let bucket = groups.find((x) => x.group === g);
    if (!bucket) {
      bucket = { group: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(item);
  }

  const allPaths = [...seen];
  const hiddenCount = allPaths.filter((p) => isHidden(p)).length;

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Personalize your IDP. Choose which items appear in your left-hand menu and how the workspace looks."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { showAll(); toast.success("All menu items shown"); }}>
              Show all
            </Button>
            <Button variant="outline" size="sm" onClick={() => { hideAll(allPaths.filter((p) => p !== "dashboard")); toast("Menu minimized"); }}>
              Hide all
            </Button>
          </div>
        }
      />

      <SectionCard
        title="Left-hand menu"
        description={`Toggle items on or off. ${allPaths.length - hiddenCount} of ${allPaths.length} shown.`}
      >
        <div className="space-y-5">
          {groups.map(({ group, items }) => (
            <div key={group}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                {group}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const visible = !isHidden(item.path);
                  return (
                    <label
                      key={item.path}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        {item.label}
                      </span>
                      <Switch checked={visible} onCheckedChange={() => toggleNav(item.path)} />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-6">
        <SectionCard title="Appearance">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-medium">Start with the sidebar collapsed</span>
              <span className="block text-xs text-muted-foreground">Show icon-only navigation when you open the IDP.</span>
            </span>
            <Switch checked={collapsedDefault} onCheckedChange={setCollapsedDefault} />
          </label>
        </SectionCard>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Preferences are saved to this browser and apply to the {module?.label ?? "current"} workspace.
      </p>
    </div>
  );
};

export default Settings;
