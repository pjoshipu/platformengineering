import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Database, Workflow, Boxes, Layers, Brain, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  PageHeader,
  StatusBadge,
  SectionCard,
  InfoList,
  EmptyState,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  searchLineage,
  getLineageGraph,
  getLineageImpact,
  type LineageNode,
  type LineageType,
  type LineageEdge,
} from "./api";

// column order (left → right) for the layered layout
const LAYERS: LineageType[] = ["source", "pipeline", "dataset", "feature-group", "model", "endpoint"];
const LAYER_LABEL: Record<LineageType, string> = {
  source: "Sources",
  pipeline: "Pipelines",
  dataset: "Datasets",
  "feature-group": "Feature groups",
  model: "Models",
  endpoint: "Endpoints",
};
const TYPE_ICON: Record<LineageType, React.ReactNode> = {
  source: <Database className="w-3.5 h-3.5" />,
  pipeline: <Workflow className="w-3.5 h-3.5" />,
  dataset: <Boxes className="w-3.5 h-3.5" />,
  "feature-group": <Layers className="w-3.5 h-3.5" />,
  model: <Brain className="w-3.5 h-3.5" />,
  endpoint: <Radio className="w-3.5 h-3.5" />,
};
const TYPE_COLOR: Record<LineageType, string> = {
  source: "border-slate-400/60 bg-slate-500/10",
  pipeline: "border-tech-cyan/50 bg-tech-cyan/10",
  dataset: "border-primary/50 bg-primary/10",
  "feature-group": "border-tech-orange/50 bg-tech-orange/10",
  model: "border-accent/50 bg-accent/10",
  endpoint: "border-green-500/50 bg-green-500/10",
};

// layout constants (px)
const COL_W = 190;
const COL_GAP = 60;
const NODE_H = 52;
const NODE_GAP = 18;
const TOP = 40;

const LineageExplorer = () => {
  const [query, setQuery] = useState("");
  const [rootId, setRootId] = useState<string>("ds_orders");
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [impactSet, setImpactSet] = useState<Set<string> | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<LineageType>>(new Set());

  const { data: results } = useMockQuery(() => searchLineage(query), [query]);
  const { data: graph } = useMockQuery(() => getLineageGraph(rootId, 3), [rootId]);

  const nodes = useMemo(() => (graph?.nodes ?? []).filter((n) => !hiddenTypes.has(n.type)), [graph, hiddenTypes]);
  const edges = useMemo<LineageEdge[]>(() => {
    const ids = new Set(nodes.map((n) => n.id));
    return (graph?.edges ?? []).filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [graph, nodes]);

  // position nodes by layer column and stacking order within column
  const positions = useMemo(() => {
    const byLayer: Record<string, LineageNode[]> = {};
    nodes.forEach((n) => (byLayer[n.type] = [...(byLayer[n.type] ?? []), n]));
    const pos: Record<string, { x: number; y: number }> = {};
    const visibleLayers = LAYERS.filter((l) => (byLayer[l] ?? []).length > 0);
    visibleLayers.forEach((layer, col) => {
      (byLayer[layer] ?? []).forEach((n, row) => {
        pos[n.id] = { x: col * (COL_W + COL_GAP), y: TOP + row * (NODE_H + NODE_GAP) };
      });
    });
    const maxRows = Math.max(1, ...visibleLayers.map((l) => (byLayer[l] ?? []).length));
    return { pos, cols: visibleLayers, width: visibleLayers.length * (COL_W + COL_GAP), height: TOP + maxRows * (NODE_H + NODE_GAP) };
  }, [nodes]);

  // highlight: nodes connected to the selected node (upstream + downstream), or impact set
  const highlighted = useMemo(() => {
    if (impactSet) return impactSet;
    if (!selectedNode) return null;
    const set = new Set<string>([selectedNode.id]);
    // walk both directions
    let changed = true;
    while (changed) {
      changed = false;
      edges.forEach((e) => {
        if (set.has(e.source) && !set.has(e.target)) { set.add(e.target); changed = true; }
        if (set.has(e.target) && !set.has(e.source)) { set.add(e.source); changed = true; }
      });
    }
    return set;
  }, [selectedNode, edges, impactSet]);

  const directUpstream = selectedNode ? edges.filter((e) => e.target === selectedNode.id).map((e) => nodes.find((n) => n.id === e.source)!).filter(Boolean) : [];
  const directDownstream = selectedNode ? edges.filter((e) => e.source === selectedNode.id).map((e) => nodes.find((n) => n.id === e.target)!).filter(Boolean) : [];

  const selectAsset = (id: string) => {
    setRootId(id);
    setImpactSet(null);
    const n = (graph?.nodes ?? []).find((x) => x.id === id);
    if (n) setSelectedNode(n);
    setQuery("");
  };

  const runImpact = async () => {
    if (!selectedNode) return;
    const { affected_assets } = await getLineageImpact(selectedNode.id);
    setImpactSet(new Set([selectedNode.id, ...affected_assets.map((a) => a.id)]));
    toast(`Impact analysis: ${affected_assets.length} downstream asset(s) affected`);
  };

  const toggleType = (t: LineageType) =>
    setHiddenTypes((s) => {
      const next = new Set(s);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const edgePath = (e: LineageEdge) => {
    const a = positions.pos[e.source];
    const b = positions.pos[e.target];
    if (!a || !b) return "";
    const x1 = a.x + COL_W, y1 = a.y + NODE_H / 2;
    const x2 = b.x, y2 = b.y + NODE_H / 2;
    const mid = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
  };

  const isDim = (id: string) => highlighted != null && !highlighted.has(id);

  return (
    <div>
      <PageHeader
        title="Lineage Explorer"
        description="Search any asset and explore its upstream sources and downstream consumers across the data platform."
      />

      {/* search */}
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasets, pipelines, models, feature groups, endpoints…" className="pl-9" />
        {query && (results ?? []).length > 0 && (
          <Card className="absolute z-20 mt-1 w-full overflow-hidden p-1">
            {(results ?? []).map((r) => (
              <button
                key={r.id}
                onClick={() => selectAsset(r.id)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="text-muted-foreground">{TYPE_ICON[r.type]}</span>
                <span className="font-medium">{r.name}</span>
                <StatusBadge tone="neutral">{r.type}</StatusBadge>
              </button>
            ))}
          </Card>
        )}
      </div>

      {/* type filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Show:</span>
        {LAYERS.map((t) => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${hiddenTypes.has(t) ? "border-border bg-transparent text-muted-foreground line-through" : TYPE_COLOR[t]}`}
          >
            {TYPE_ICON[t]} {LAYER_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* graph canvas */}
        <SectionCard title="Lineage graph" description="Left → right: sources flow to endpoints. Click a node to trace its paths.">
          <div className="overflow-auto">
            <div className="relative" style={{ width: Math.max(positions.width, 400), height: Math.max(positions.height, 240) }}>
              {/* column headers */}
              {positions.cols.map((layer, col) => (
                <div
                  key={layer}
                  className="absolute text-center text-xs font-semibold text-muted-foreground"
                  style={{ left: col * (COL_W + COL_GAP), top: 8, width: COL_W }}
                >
                  {LAYER_LABEL[layer]}
                </div>
              ))}

              {/* edges */}
              <svg className="pointer-events-none absolute inset-0" width={Math.max(positions.width, 400)} height={Math.max(positions.height, 240)}>
                {edges.map((e, i) => {
                  const active = highlighted == null || (highlighted.has(e.source) && highlighted.has(e.target));
                  return (
                    <path
                      key={i}
                      d={edgePath(e)}
                      fill="none"
                      stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={active ? 2 : 1.5}
                      strokeOpacity={active ? 0.9 : 0.4}
                    />
                  );
                })}
              </svg>

              {/* nodes */}
              {nodes.map((n) => {
                const p = positions.pos[n.id];
                if (!p) return null;
                const selected = selectedNode?.id === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => { setSelectedNode(n); setImpactSet(null); }}
                    className={`absolute flex flex-col justify-center gap-0.5 rounded-lg border px-2 text-left transition-opacity ${TYPE_COLOR[n.type]} ${selected ? "ring-2 ring-primary" : ""} ${isDim(n.id) ? "opacity-30" : ""}`}
                    style={{ left: p.x, top: p.y, width: COL_W, height: NODE_H }}
                  >
                    <div className="flex items-center gap-1 text-xs font-medium">
                      {TYPE_ICON[n.type]}
                      <span className="truncate">{n.name}</span>
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">{n.owner} · {timeAgo(n.updated)}</div>
                  </button>
                );
              })}

              {nodes.length === 0 && (
                <div className="p-6">
                  <EmptyState title="No visible assets" description="All node types are hidden — re-enable a filter above." />
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* node detail panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <>
              <SectionCard title="Asset detail">
                <InfoList items={[
                  { label: "Name", value: <span className="font-mono text-xs">{selectedNode.name}</span> },
                  { label: "Type", value: <StatusBadge tone="neutral">{selectedNode.type}</StatusBadge> },
                  { label: "Owner", value: selectedNode.owner },
                  { label: "Updated", value: timeAgo(selectedNode.updated) },
                ]} />
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast(`Open ${selectedNode.name} detail`)}>
                  Open asset detail
                </Button>
              </SectionCard>

              <SectionCard title="Connections">
                <div className="text-xs font-semibold text-muted-foreground">Direct upstream</div>
                <div className="mt-1 space-y-1">
                  {directUpstream.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
                  {directUpstream.map((n) => (
                    <button key={n.id} onClick={() => setSelectedNode(n)} className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm hover:bg-muted">
                      {TYPE_ICON[n.type]} {n.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs font-semibold text-muted-foreground">Direct downstream</div>
                <div className="mt-1 space-y-1">
                  {directDownstream.length === 0 && <div className="text-sm text-muted-foreground">None</div>}
                  {directDownstream.map((n) => (
                    <button key={n.id} onClick={() => setSelectedNode(n)} className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-sm hover:bg-muted">
                      {TYPE_ICON[n.type]} {n.name}
                    </button>
                  ))}
                </div>
              </SectionCard>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => { selectAsset(selectedNode.id); toast("Expanded upstream"); }}>Expand upstream</Button>
                <Button variant="outline" size="sm" onClick={() => { selectAsset(selectedNode.id); toast("Expanded downstream"); }}>Expand downstream</Button>
              </div>
              <Button className="w-full" onClick={runImpact}>Impact analysis</Button>
              {impactSet && (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-xs">
                  Highlighting {impactSet.size - 1} downstream affected asset(s). Click another node to clear.
                </div>
              )}
            </>
          ) : (
            <SectionCard title="Asset detail">
              <div className="text-sm text-muted-foreground">Select a node in the graph to see its owner, upstream and downstream connections, and run impact analysis.</div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineageExplorer;
