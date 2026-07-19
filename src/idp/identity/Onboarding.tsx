import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Boxes, Sparkles, ArrowRight, ChevronDown, ArrowLeft, MessagesSquare, FormInput } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { EmployeeProfile } from "./directory";
import { resolvePersona, PERSONA_OPTIONS, archetypeForPersona, dashboardForPersona } from "./resolvePersona";
import DutiesChat from "./DutiesChat";

/**
 * First-run intake. The IDP opens by asking the engineer what they work on, then
 * builds their dashboard. Primary path is a chat ("describe your duties"); a form
 * is available as an alternative, plus a direct persona pick. Every path routes to
 * an existing persona's dashboard behind the scenes.
 */

const parseList = (text: string): string[] =>
  text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

/** The form-based intake (alternative to the chat). */
const ProfileForm = () => {
  const { createProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [topics, setTopics] = useState("");

  const draft = useMemo<EmployeeProfile>(
    () => ({
      id: "self", name: name.trim() || "You", email: "you@acme.io", title: title.trim(),
      department: "", team: "", location: "Remote", seniority: "Senior",
      skills: parseList(keywords), systems: parseList(topics), bio: "",
    }),
    [name, title, keywords, topics]
  );
  const match = useMemo(() => resolvePersona(draft), [draft]);
  const hasInput = Boolean(title.trim() || keywords.trim() || topics.trim());

  const build = () => {
    createProfile(draft);
    navigate(dashboardForPersona(match.personaId));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ob-name">Your name <span className="text-muted-foreground">(optional)</span></Label>
          <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Doe" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ob-title">Job title</Label>
          <Input id="ob-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior AI Engineer" className="mt-1.5" />
        </div>
      </div>
      <div>
        <Label htmlFor="ob-keywords">Keywords / skills <span className="text-muted-foreground">(comma-separated)</span></Label>
        <Input id="ob-keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="LangChain, RAG, prompts, vector store" className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="ob-topics">Topics / systems you work in</Label>
        <Input id="ob-topics" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="model gateway, guardrails, observability" className="mt-1.5" />
      </div>

      {hasInput && (
        <div className="rounded-xl border border-brand-border bg-brand-tint/40 p-4">
          <div className="flex items-center gap-2 text-brand-purple">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">We’ll set you up as {match.label}</span>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{match.reason}</p>
        </div>
      )}

      <Button onClick={build} disabled={!hasInput} className="w-full" size="lg">
        Build my {hasInput ? match.label : ""} dashboard <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};

/** "Or pick a workspace directly" — creates a profile from a persona archetype. */
const PersonaQuickPick = () => {
  const { createProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const pick = (personaId: string) => {
    const arche = archetypeForPersona(personaId);
    createProfile({
      ...(arche ?? {}),
      name: arche?.name || "You",
      email: "you@acme.io",
      skills: arche?.skills ?? [],
      systems: arche?.systems ?? [],
    });
    navigate(dashboardForPersona(personaId));
  };

  return (
    <div className="pt-1">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-brand-purple"
      >
        Or pick a workspace directly
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PERSONA_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className="rounded-lg border border-border bg-card px-2 py-2 text-xs hover:border-brand-border hover:text-brand-purple"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Onboarding = ({ onBack }: { onBack?: () => void }) => {
  const [mode, setMode] = useState<"chat" | "form">("chat");

  const Tab = ({ id, icon: Icon, label }: { id: "chat" | "form"; icon: typeof MessagesSquare; label: string }) => (
    <button
      onClick={() => setMode(id)}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        mode === id ? "bg-card text-brand-purple shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8 space-y-6">
        {onBack && (
          <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-purple">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        )}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-brand-tint">
              <Boxes className="w-7 h-7 text-brand-purple" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Set up your workspace</h1>
          <p className="text-sm text-muted-foreground">
            Tell us what you work on — we’ll build the right dashboard for you.
          </p>
        </div>

        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <Tab id="chat" icon={MessagesSquare} label="Describe your day" />
          <Tab id="form" icon={FormInput} label="Fill a form" />
        </div>

        {mode === "chat" ? <DutiesChat /> : <ProfileForm />}

        <PersonaQuickPick />

        <p className="text-center text-[11px] text-muted-foreground">
          Demo environment — your profile drives the persona; you can refine it later in Profile.
        </p>
      </Card>
    </div>
  );
};

export default Onboarding;
