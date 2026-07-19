import { useNavigate } from "react-router-dom";
import {
  Bot, ScatterChart, Server, RefreshCw, ShieldCheck, Database,
  Rocket, Type, Eye, Play, GitBranch, Plug, Activity, Shield, FlaskConical, CheckCircle2,
  HeartPulse, Settings as SettingsIcon, Cpu, ScanSearch, AlertTriangle, Download, UserX,
  Upload, ArrowRight, Clock, Boxes, BookText, Zap, Sparkles, Pencil, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMockQuery } from "../../api/client";
import {
  getActivity, getQuickActions, getFeed, getJourneys,
  type DotColor, type FeedTag,
} from "../../api/homepage";
import { useAuth } from "@/contexts/AuthContext";
import { employeeInitials } from "../../identity/directory";
import { dashboardForPersona } from "../../identity/resolvePersona";
import { useJourney } from "../../state/journey";

/**
 * The IDP homepage — the identity-driven front door. There is no persona picker:
 * you are signed in as a person, and the platform shows the workspace it DERIVED
 * from that person's profile, with the reason. Below, an identity switcher lets a
 * demo move across people (each re-derives its own workspace). Everything else
 * (activity, feed, journeys) is personalized to the derived persona.
 */

const ACTION_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, type: Type, eye: Eye, play: Play, "git-branch": GitBranch, plug: Plug,
  activity: Activity, shield: Shield, database: Database, flask: FlaskConical, check: CheckCircle2,
  server: Server, heart: HeartPulse, settings: SettingsIcon, cpu: Cpu, scan: ScanSearch,
  alert: AlertTriangle, download: Download, "user-x": UserX, upload: Upload, refresh: RefreshCw,
};

const JOURNEY_ICONS: Record<string, LucideIcon> = {
  robot: Bot, infinity: Bot, database: Database, refresh: RefreshCw, shield: ShieldCheck, server: Server,
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
  const { user, profile, personaMatch, directory, savedProfiles, signInAs, logout } = useAuth();
  const persona = user!.persona;
  const journey = useJourney();

  const { data: quickActions } = useMockQuery(() => getQuickActions(persona), [persona]);
  const { data: activity, loading: activityLoading } = useMockQuery(() => getActivity(persona), [persona]);
  const { data: feed } = useMockQuery(() => getFeed(), []);
  const { data: journeys } = useMockQuery(() => getJourneys(), []);

  const startJourney = (id: string) => {
    const url = journey.start(id);
    if (url) navigate(url);
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* SECTION 1 — identity-driven workspace (no persona picker) */}
      <section id="workspace">
        <SectionLabel>Your workspace</SectionLabel>
        <div className="rounded-2xl border border-brand-border bg-brand-tint/40 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-lg font-semibold text-brand-purple">
              {employeeInitials(profile.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px]">
                {greetingWord()}, <span className="font-semibold">{profile.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {[profile.title, profile.team, profile.location].filter(Boolean).join(" · ")}
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-purple/10 px-3 py-1 text-sm font-medium text-brand-purple">
                <Sparkles className="h-3.5 w-3.5" />
                Loaded the {personaMatch.label} workspace
              </div>
              <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground">{personaMatch.reason}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(dashboardForPersona(persona))}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-purple px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  Go to your {personaMatch.label} dashboard <ArrowRight className="h-3 w-3" />
                </button>
                <button
                  onClick={() => navigate(`/${persona}/profile`)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-brand-border hover:text-brand-purple"
                >
                  <Pencil className="h-3 w-3" /> Edit profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="my-5 border-t border-border" />

      {/* SECTION 2 — activity + quick actions (fades on identity change) */}
      <section key={persona} className="animate-in fade-in duration-150">
        <div className="text-[15px] font-medium">
          {greetingWord()} — viewing as{" "}
          <span className="text-brand-purple">{personaMatch.label}</span>
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

      {/* Footer — de-emphasized demo identity switch + vendor comparison link */}
      <div className="mt-8 border-t border-border pt-3 space-y-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[10px] text-muted-foreground/70">
          <span className="uppercase tracking-wide">Demo · viewing as {profile.name}</span>
          <span aria-hidden>·</span>
          {[...savedProfiles, ...directory].map((emp) => {
            const active = emp.id === profile.id;
            return (
              <button
                key={emp.id}
                onClick={() => signInAs(emp.id)}
                title={`${emp.name} — ${emp.title}`}
                className={cn(
                  "rounded px-1 py-0.5 hover:text-brand-purple",
                  active ? "font-semibold text-brand-purple" : "text-muted-foreground/70"
                )}
              >
                {employeeInitials(emp.name)}
              </button>
            );
          })}
          <span aria-hidden>·</span>
          <button onClick={() => { logout(); navigate("/"); }} className="hover:text-brand-purple">log out</button>
        </div>
        <button
          onClick={() => navigate("/compare")}
          className="text-xs text-muted-foreground hover:text-brand-purple hover:underline"
        >
          Compare Harness, Port &amp; Cortex →
        </button>
      </div>
    </div>
  );
};

export default Home;
