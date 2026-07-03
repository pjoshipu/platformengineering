import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X, ChevronUp, ChevronDown, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PageHeader,
  MetricCard,
  LineChartCard,
  AreaChartCard,
  StackedBarChartCard,
  SideDrawer,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWidgetCatalog,
  getDefaultLayout,
  saveLayout,
  type Widget,
} from "./api";

/**
 * Capability 4.1 — Customizable Dashboard. ONE persona-aware screen
 * ("My Dashboard"). The active persona (from auth) picks the default widget set
 * and the full widget library. The user can add/remove widgets from the library
 * and reorder them; layout state is a local ids array initialised from
 * getDefaultLayout. "Save layout" persists via the mock api.
 */

/** Renders a single widget (metric card or the matching chart card). */
const WidgetBody = ({ widget }: { widget: Widget }) => {
  if (widget.kind === "metric") {
    const m = widget.metric;
    return (
      <MetricCard
        label={widget.title}
        value={m?.value ?? "—"}
        delta={m?.delta}
        deltaPositive={m?.deltaPositive}
        tone={m?.tone}
      />
    );
  }

  const common = {
    title: widget.title,
    data: widget.data ?? [],
    series: widget.series ?? [],
    xKey: "ts",
  };
  if (widget.kind === "area") return <AreaChartCard {...common} />;
  if (widget.kind === "bar") return <StackedBarChartCard {...common} />;
  return <LineChartCard {...common} />;
};

const Board = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";

  const { data: catalog, loading } = useMockQuery(
    () => getWidgetCatalog(personaId),
    [personaId]
  );
  const { data: defaults } = useMockQuery(
    () => getDefaultLayout(personaId),
    [personaId]
  );

  // Local layout state (ordered ids). Initialised from the default layout;
  // re-seeded when the persona's defaults change.
  const [layout, setLayout] = useState<string[]>([]);
  const [seeded, setSeeded] = useState<string>("");
  const seedKey = `${personaId}:${(defaults ?? []).join(",")}`;
  if (defaults && seedKey !== seeded) {
    setLayout(defaults);
    setSeeded(seedKey);
  }

  const [drawerOpen, setDrawerOpen] = useState(false);

  const byId = useMemo(() => {
    const map = new Map<string, Widget>();
    (catalog ?? []).forEach((w) => map.set(w.id, w));
    return map;
  }, [catalog]);

  const activeWidgets = layout
    .map((id) => byId.get(id))
    .filter((w): w is Widget => !!w);

  const move = (index: number, dir: -1 | 1) => {
    setLayout((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setLayout((prev) => prev.filter((x) => x !== id));
  };

  const toggle = (id: string, on: boolean) => {
    setLayout((prev) => {
      if (on) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const handleSave = async () => {
    const res = await saveLayout(personaId, layout);
    toast.success(res.status);
  };

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> Add widget
      </Button>
      <Button size="sm" onClick={handleSave} disabled={loading}>
        <Save className="w-4 h-4 mr-1" /> Save layout
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        description="Your tailored dashboard — add, remove, and reorder widgets, then save your layout."
        actions={actions}
      />

      {loading && activeWidgets.length === 0 ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCard key={i} label="—" value="…" />
          ))}
        </div>
      ) : activeWidgets.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No widgets on your dashboard. Use “Add widget” to pick from the library.
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {activeWidgets.map((w, i) => (
            <div key={w.id} className="flex flex-col">
              <div className="flex items-center justify-end gap-1 mb-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Move down"
                  disabled={i === activeWidgets.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  aria-label="Remove widget"
                  onClick={() => remove(w.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <WidgetBody widget={w} />
            </div>
          ))}
        </div>
      )}

      <SideDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Widget library"
        description="Toggle widgets on or off your dashboard."
      >
        <div className="space-y-2">
          {(catalog ?? []).map((w) => {
            const on = layout.includes(w.id);
            return (
              <label
                key={w.id}
                className="flex items-center gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={on}
                  onCheckedChange={(c) => toggle(w.id, c === true)}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {w.kind === "metric" ? "Metric" : `${w.kind} chart`}
                  </div>
                </div>
              </label>
            );
          })}
          {(catalog ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No widgets available for this persona.
            </p>
          )}
        </div>
      </SideDrawer>
    </div>
  );
};

export default Board;
