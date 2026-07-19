import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Bot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { EmployeeProfile } from "./directory";
import { resolvePersona, dashboardForPersona, type PersonaMatch } from "./resolvePersona";

/**
 * Conversational intake. The engineer describes their day-to-day duties in plain
 * language; we derive the matching persona from everything they've said (a local,
 * deterministic mapping — no external model) and offer to generate the profile.
 */

interface Msg { role: "assistant" | "user"; text: string }

const profileFromText = (text: string): EmployeeProfile => ({
  id: "self", name: "You", email: "you@acme.io", title: "", department: "", team: "",
  location: "Remote", seniority: "Senior", skills: text ? [text] : [], systems: [], bio: text,
});

const assistantReply = (match: PersonaMatch): string =>
  match.confidence > 0
    ? `Sounds like you're a ${match.label}. ${match.reason} I can set you up with that workspace — hit “Create my workspace”, or tell me more to refine it.`
    : `I couldn't pin down a workspace yet. Tell me more — which tools, systems, or tasks fill your day?`;

const DutiesChat = () => {
  const { createProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [allText, setAllText] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! Tell me about your day-to-day — what do you build, and which tools or systems do you work with?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const match = useMemo(() => (allText ? resolvePersona(profileFromText(allText)) : null), [allText]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    const combined = `${allText} ${t}`.trim();
    const m = resolvePersona(profileFromText(combined));
    setMessages((prev) => [...prev, { role: "user", text: t }, { role: "assistant", text: assistantReply(m) }]);
    setAllText(combined);
    setInput("");
  };

  const create = () => {
    if (!match || match.confidence <= 0) return;
    createProfile({
      name: name.trim() || "You",
      title: match.label,
      skills: match.signals.length ? match.signals : undefined,
      bio: allText,
    });
    navigate(dashboardForPersona(match.personaId));
  };

  const canCreate = !!match && match.confidence > 0;

  return (
    <div className="space-y-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" />

      <div ref={scrollRef} className="h-56 overflow-y-auto rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
            {m.role === "assistant" && (
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-brand-purple">
                <Bot className="h-3.5 w-3.5" />
              </span>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-[13px]",
                m.role === "assistant" ? "bg-card border border-border" : "bg-brand-purple text-white"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. I build ETL pipelines, manage Airflow DAGs, and enforce data quality…"
        />
        <Button variant="outline" size="icon" onClick={send} disabled={!input.trim()} title="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {match && (
        <div className="rounded-xl border border-brand-border bg-brand-tint/40 p-3">
          <div className="flex items-center gap-2 text-brand-purple">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">
              {canCreate ? `Detected: ${match.label}` : "Need a bit more detail"}
            </span>
          </div>
          {canCreate && <p className="mt-1 text-[12px] text-muted-foreground">{match.reason}</p>}
        </div>
      )}

      <Button onClick={create} disabled={!canCreate} className="w-full" size="lg">
        Create my {canCreate ? match!.label : ""} workspace <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default DutiesChat;
