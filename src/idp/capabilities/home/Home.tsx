import { useNavigate } from "react-router-dom";
import {
  Bot, Infinity as InfinityIcon, ScatterChart, Server, RefreshCw, ShieldCheck, Database,
  Rocket, Type, Eye, Play, GitBranch, Plug, Activity, Shield, FlaskConical, CheckCircle2,
  HeartPulse, Settings as SettingsIcon, Cpu, ScanSearch, AlertTriangle, Download, UserX,
  Upload, ArrowRight, Clock, Boxes, BookText, Zap, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMockQuery } from "../../api/client";
import {
  getActivity, getQuickActions, getFeed, getJourneys,
  type DotColor, type FeedTag,
} from "../../api/homepage";
import { usePersona } from "../../state/persona";
import { useJourney } from "../../state/journey";

/**
 * The IDP homepage — the front door. Three always-visible sections: persona
 * tiles, an activity feed + quick actions, and journey cards. Selecting a tile
 * personalizes sections 2 and 3 in place (no reload); every element links to a
 * real portal route.
 */

interface Tile {
  id: string;
  label: string;
  icon: LucideIcon;
  subtitle: string;
  dashboard: string;
  agents: number;
}

// Order + labels + primary route per the spec (tile "Platform Engineer" =
// app-engineer; "Agentic Engineer" primary screen is the marketplace).
const TILES: Tile[] = [
  { id: "ai-engineer", label: "AI Engineer", icon: Bot, subtitle: "LLM apps, RAG, guardrails", dashboard: "/ai-engineer/dashboard", agents: 6 },
  { id: "agentic-engineer", label: "Agentic Engineer", icon: InfinityIcon, subtitle: "Autonomous agents, tool chains", dashboard: "/agents/marketplace", agents: 8 },
  { id: "data-scientist", label: "Data Scientist", icon: ScatterChart, subtitle: "Model training and evaluation", dashboard: "/data-scientist/dashboard", agents: 7 },
  { id: "app-engineer", label: "Platform Engineer", icon: Server, subtitle: "Services, GitOps, infrastructure", dashboard: "/app-engineer/dashboard", agents: 7 },
  { id: "mlops", label: "MLOps Engineer", icon: RefreshCw, subtitle: "Pipelines, drift, retraining", dashboard: "/mlops/dashboard", agents: 6 },
  { id: "security", label: "Security Engineer", icon: ShieldCheck, subtitle: "Policies, audit, compliance", dashboard: "/security/dashboard", agents: 7 },
  { id: "data-engineer", label: "Data Engineer", icon: Database, subtitle: "Pipelines, datasets, lineage", dashboard: "/data-engineer/dashboard", agents: 7 },
];

const ACTION_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, type: Type, eye: Eye, play: Play, "git-branch": GitBranch, plug: Plug,
  activity: Activity, shield: Shield, database: Database, flask: FlaskConical, check: CheckCircle2,
  server: Server, heart: HeartPulse, settings: SettingsIcon, cpu: Cpu, scan: ScanSearch,
  alert: AlertTriangle, download: Download, "user-x": UserX, upload: Upload, refresh: RefreshCw,
};

const JOURNEY_ICONS: Record<string, LucideIcon> = {
  robot: Bot, infinity: InfinityIcon, database: Database, refresh: RefreshCw, shield: ShieldCheck, server: Server,
};

const DOT_CLASS: Record<DotColor, string> = {
  amber: "bg-amber-500",
  red: "bg-red-500",
  green: "bg-green-500",
  gray: "bg-transparent border border-muted-foreground/50",
};

const TAG_CLASS: Record<FeedTag, string> = {
  "New agent": "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  Template: "bg-brand-tint text-brand-purple",
  Docs: "bg-muted text-muted-foreground",
  Announcement: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const PILLARS = [
  { label: "Software Assets", icon: Boxes, url: "/capabilities/software-assets" },
  { label: "Knowledge Assets", icon: BookText, url: "/capabilities/knowledge-assets" },
  { label: "Environment Assets", icon: Zap, url: "/capabilities/environment-assets" },
  { label: "Portal Management", icon: SettingsIcon, url: "/capabilities/portal-management" },
];

const greetingWord = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
    {children}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { persona, setPersona } = usePersona();
  const journey = useJourney();

  const activeTile = TILES.find((t) => t.id === persona) ?? TILES[0];

  const { data: quickActions } = useMockQuery(() => getQuickActions(persona), [persona]);
  const { data: activity, loading: activityLoading } = useMockQuery(() => getActivity(persona), [persona]);
  const { data: feed } = useMockQuery(() => getFeed(), []);
  const { data: journeys } = useMockQuery(() => getJourneys(), []);

  const scrollToTiles = () =>
    document.getElementById("persona-tiles")?.scrollIntoView({ behavior: "smooth" });

  const startJourney = (id: string) => {
    const url = journey.start(id);
    if (url) navigate(url);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* SECTION 1 — persona tiles */}
      <section id="persona-tiles">
        <SectionLabel>Your workspace</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
          {TILES.map((t) => {
            const Icon = t.icon;
            const active = t.id === persona;
            return (
              <button
                key={t.id}
                onClick={() => setPersona(t.id)}
                title={t.subtitle}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors",
                  active
                    ? "border-brand-purple bg-brand-tint"
                    : "border-border bg-card hover:border-brand-border"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-brand-purple" : "text-muted-foreground")} />
                <span className={cn("text-[11px] leading-tight", active ? "text-brand-purple font-medium" : "text-foreground/80")}>
                  {t.label}
                </span>
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); navigate(`/agents/marketplace?persona=${t.id}`); }}
                  className="text-[10px] text-muted-foreground hover:text-brand-purple"
                >
                  {t.agents} agents
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => navigate(activeTile.dashboard)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-brand-purple hover:underline"
        >
          Go to {activeTile.label} dashboard <ArrowRight className="h-3 w-3" />
        </button>
      </section>

      <div className="my-5 border-t border-border" />

      {/* SECTION 2 — activity + quick actions (fades on persona change) */}
      <section key={persona} className="animate-in fade-in duration-150">
        <div className="text-[15px] font-medium">
          {greetingWord()} — viewing as{" "}
          <button onClick={scrollToTiles} className="text-brand-purple hover:underline">
            {activeTile.label}
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(quickActions ?? []).map((a) => {
            const Icon = ACTION_ICONS[a.icon] ?? Play;
            return (
              <button
                key={a.label}
                onClick={() => navigate(a.url)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:bg-brand-tint/50 hover:border-brand-border"
              >
                <Icon className="h-3.5 w-3.5 text-brand-purple" />
                {a.label}
              </button>
            );
          })}
        </div>

        {/* Two-column content */}
        <div className="mt-4 grid gap-3.5 lg:grid-cols-5">
          {/* Your activity (60%) */}
          <div className="lg:col-span-3">
            <SectionLabel>Your activity</SectionLabel>
            {!activityLoading && (activity?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center">
                <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
                <div className="mt-2 text-sm font-medium">No activity yet</div>
                <div className="text-xs text-muted-foreground">
                  Your recent deployments, jobs, and alerts will appear here.
                </div>
                <button onClick={() => navigate(`/${persona}/templates`)} className="mt-2 text-xs text-brand-purple hover:underline">
                  Explore templates →
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {(activity ?? []).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.url)}
                    className="flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left hover:border-border hover:bg-muted/50"
                  >
                    <span className={cn("mt-1 h-[7px] w-[7px] shrink-0 rounded-full", DOT_CLASS[item.dot_color])} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium">{item.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{item.subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Platform feed (40%) */}
          <div className="lg:col-span-2">
            <SectionLabel>Platform feed</SectionLabel>
            <div className="space-y-1">
              {(feed ?? []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.url)}
                  className="flex w-full flex-col gap-0.5 rounded-lg border border-transparent px-2 py-2 text-left hover:border-border hover:bg-muted/50"
                >
                  <span className={cn("w-fit rounded-full px-2 py-0.5 text-[10px] font-medium", TAG_CLASS[item.tag])}>
                    {item.tag}
                  </span>
                  <span className="text-[12px] font-medium">{item.title}</span>
                  <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capability pillars strip (Connection 10) */}
      <div className="my-5 flex flex-wrap gap-2 border-y border-border py-3">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.label}
              onClick={() => navigate(p.url)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-brand-border hover:text-brand-purple"
            >
              <Icon className="h-3.5 w-3.5" /> {p.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 3 — journey cards */}
      <section>
        <SectionLabel>Start a journey</SectionLabel>
        <div className="grid gap-2 md:grid-cols-2">
          {(journeys ?? []).map((j) => {
            const Icon = JOURNEY_ICONS[j.icon] ?? Rocket;
            const highlighted = j.highlighted_for.includes(persona);
            return (
              <button
                key={j.id}
                onClick={() => startJourney(j.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  highlighted
                    ? "border-brand-purple bg-brand-tint"
                    : "border-border bg-card hover:border-muted-foreground/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", highlighted ? "text-brand-purple" : "text-muted-foreground")} />
                  <span className={cn("text-[13px] font-medium", highlighted && "text-brand-purple")}>{j.title}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                  {j.steps.map((s, i) => (
                    <span key={s.label} className="flex items-center gap-1">
                      <span className={cn(highlighted && "text-brand-purple/80")}>{s.label}</span>
                      {i < j.steps.length - 1 && <ArrowRight className="h-3 w-3 text-border" />}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Footer — vendor comparison link */}
      <div className="mt-6 border-t border-border pt-3 text-center">
        <button
          onClick={() => navigate("/compare")}
          className="text-xs text-muted-foreground hover:text-brand-purple hover:underline"
        >
          How this IDP compares to Harness, Port &amp; Cortex →
        </button>
      </div>
    </div>
  );
};

export default Home;
