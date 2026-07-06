import { Link } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getFlowConfig, flowAsset,
  type FlowConfig, type RequestFlow, type InfraDetail, type StepByStep, type StepStatus,
} from "./flowConfigs";

/**
 * FlowViewerPanel — a right-side drawer with three tabs (Request flow, Infra
 * detail, Step by step). It is fully generic: everything it renders comes from
 * the FlowConfig looked up by `flowId`. Step highlights and infra hotspots are
 * SVG overlays positioned with percentage coordinates, so they track the image
 * at any panel width.
 */

// --- SVG overlays ----------------------------------------------------------

/** Pulsing purple ring + number for an active step (SMIL-animated SVG). */
const StepMarker = ({ n, active, x, y }: { n: number; active: boolean; x: number; y: number }) => (
  <div
    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    {active ? (
      <svg width="40" height="40" viewBox="0 0 40 40" aria-label={`Step ${n} active`}>
        <circle cx="20" cy="20" r="11" fill="none" strokeWidth="2" style={{ stroke: "hsl(var(--brand-purple))" }}>
          <animate attributeName="r" values="11;18;11" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="20" r="11" strokeWidth="2" style={{ stroke: "hsl(var(--brand-purple))", fill: "hsl(var(--brand-purple) / 0.18)" }} />
        <text x="20" y="24" textAnchor="middle" fontSize="12" fontWeight="700" style={{ fill: "hsl(var(--brand-purple))" }}>{n}</text>
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" opacity="0.7" aria-label={`Step ${n}`}>
        <circle cx="12" cy="12" r="9" strokeWidth="1" style={{ stroke: "hsl(var(--border))", fill: "hsl(var(--muted))" }} />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="600" style={{ fill: "hsl(var(--muted-foreground))" }}>{n}</text>
      </svg>
    )}
  </div>
);

/** Clickable infra hotspot: a pulsing outline that opens a tooltip popover. */
const Hotspot = ({ label, tooltip, x, y }: { label: string; tooltip: string; x: number; y: number }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${x}%`, top: `${y}%` }}
        aria-label={label}
      >
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="9" fill="none" strokeWidth="2" style={{ stroke: "hsl(var(--brand-purple))" }}>
            <animate attributeName="r" values="9;13;9" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="15" cy="15" r="6" style={{ fill: "hsl(var(--brand-purple) / 0.35)", stroke: "hsl(var(--brand-purple))" }} strokeWidth="1.5" />
        </svg>
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" align="center" className="w-64">
      <div className="text-sm font-semibold text-brand-purple">{label}</div>
      <p className="mt-1 text-xs text-muted-foreground">{tooltip}</p>
    </PopoverContent>
  </Popover>
);

/** Image with a percentage-positioned overlay + an "Open full size" lightbox. */
const DiagramImage = ({
  src, alt, children,
}: { src: string; alt: string; children?: React.ReactNode }) => (
  <div>
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <img src={src} alt={alt} className="block w-full select-none" draggable={false} />
      {children}
    </div>
    <Dialog>
      <DialogTrigger asChild>
        <button className="mt-2 inline-flex items-center gap-1 text-xs text-brand-purple hover:underline">
          <Maximize2 className="h-3 w-3" /> Open full size
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[95vw] p-2">
        <img src={src} alt={alt} className="w-full h-auto" />
      </DialogContent>
    </Dialog>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{children}</div>
);

// --- Tabs ------------------------------------------------------------------

const RequestFlowTab = ({ rf }: { rf: RequestFlow }) => (
  <div className="space-y-4">
    <DiagramImage src={flowAsset(rf.slide_asset)} alt={rf.slide_title}>
      {Object.entries(rf.step_points).map(([num, pt]) => {
        const n = Number(num);
        return <StepMarker key={n} n={n} active={rf.active_steps.includes(n)} x={pt.x_pct} y={pt.y_pct} />;
      })}
    </DiagramImage>

    <div className="space-y-1.5">
      <SectionLabel>Active on this screen</SectionLabel>
      {rf.active_steps.map((n) => (
        <div key={n} className="flex gap-2 text-sm">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-bold text-brand-purple">{n}</span>
          <span className="text-foreground">{rf.step_labels[n]}</span>
        </div>
      ))}
    </div>

    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-medium text-brand-purple">
        {rf.flow_label}
      </div>
      <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <div>Source: {rf.source}</div>
        <div>Total steps: {rf.total_steps} end-to-end</div>
      </dl>
    </div>
  </div>
);

const InfraTab = ({ infra }: { infra: InfraDetail }) => (
  <div className="space-y-4">
    <DiagramImage src={flowAsset(infra.image_asset)} alt="Infrastructure detail">
      {infra.hotspots.map((h) => (
        <Hotspot key={h.id} label={h.label} tooltip={h.tooltip} x={h.x_pct} y={h.y_pct} />
      ))}
    </DiagramImage>
    <p className="text-xs text-muted-foreground">Tap a pulsing marker to see what that component does in this flow.</p>

    <div className="space-y-1.5">
      <SectionLabel>Components involved</SectionLabel>
      {infra.components_involved.map((c) => (
        <div key={c} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>{c}</span>
          <span className="ml-auto text-[11px] text-muted-foreground">Active in this flow</span>
        </div>
      ))}
    </div>
  </div>
);

const STEP_TONE: Record<StepStatus, { dot: string; label: string }> = {
  done: { dot: "bg-green-500", label: "Done" },
  active: { dot: "bg-amber-500", label: "Active now" },
  upcoming: { dot: "bg-muted-foreground/40", label: "Upcoming" },
};

const StepsTab = ({ sbs, flowId }: { sbs: StepByStep; flowId: string }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-base font-semibold">{sbs.title}</h3>
      <p className="text-sm text-muted-foreground">{sbs.subtitle}</p>
    </div>

    <ol className="relative space-y-4 border-l border-border pl-5">
      {sbs.steps.map((s) => {
        const tone = STEP_TONE[s.status];
        return (
          <li key={s.number} className="relative">
            <span className={cn("absolute -left-[27px] top-0.5 h-3 w-3 rounded-full ring-4 ring-background", tone.dot)} />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Step {s.number}</span>
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                s.status === "done" ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : s.status === "active" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-muted text-muted-foreground")}>{tone.label}</span>
            </div>
            <div className="text-sm font-medium">{s.component}</div>
            <p className="text-xs text-muted-foreground">{s.summary}</p>
          </li>
        );
      })}
    </ol>

    <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
      <div>Estimated time end-to-end: <span className="text-foreground">{sbs.estimated_time}</span></div>
      <div>This flow uses: {sbs.tools_used.join(" · ")}</div>
      <Link to={`/docs/${flowId}`} className="inline-block text-brand-purple hover:underline">
        Questions about any step? → Open docs
      </Link>
    </div>
  </div>
);

// --- Panel -----------------------------------------------------------------

interface FlowViewerPanelProps {
  flowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FlowViewerPanel = ({ flowId, open, onOpenChange }: FlowViewerPanelProps) => {
  const config: FlowConfig | undefined = getFlowConfig(flowId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:w-[520px] sm:max-w-[520px] flex flex-col">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle>How this works end-to-end</SheetTitle>
          <SheetDescription>
            {config ? `${config.screen_name} → ${config.request_flow.flow_label}` : "Flow not configured"}
          </SheetDescription>
        </SheetHeader>

        {!config ? (
          <div className="p-6 text-sm text-muted-foreground">
            No flow is configured for <code>{flowId}</code> yet.
          </div>
        ) : (
          <Tabs defaultValue="request" className="flex min-h-0 flex-1 flex-col">
            <TabsList className={cn("mx-4 mt-3 grid", config.infra_detail ? "grid-cols-3" : "grid-cols-2")}>
              <TabsTrigger value="request">Request flow</TabsTrigger>
              {config.infra_detail && <TabsTrigger value="infra">Infra detail</TabsTrigger>}
              <TabsTrigger value="steps">Step by step</TabsTrigger>
            </TabsList>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <TabsContent value="request" className="mt-0"><RequestFlowTab rf={config.request_flow} /></TabsContent>
              {config.infra_detail && (
                <TabsContent value="infra" className="mt-0"><InfraTab infra={config.infra_detail} /></TabsContent>
              )}
              <TabsContent value="steps" className="mt-0"><StepsTab sbs={config.step_by_step} flowId={config.flow_id} /></TabsContent>
            </div>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FlowViewerPanel;
