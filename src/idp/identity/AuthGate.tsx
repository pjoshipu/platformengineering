import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Boxes, Plus, LogIn, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { employeeInitials, type EmployeeProfile } from "./directory";
import { resolvePersona, dashboardForPersona } from "./resolvePersona";
import Onboarding from "./Onboarding";

/**
 * The sign-in gate shown whenever no one is signed in. You can resume as a
 * previously created engineer (your saved roster) or a demo person, or create a
 * new profile (onboarding). Picking an identity derives its persona and drops
 * you into that workspace.
 */

const AuthGate = () => {
  const { savedProfiles, directory, signInAs } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"select" | "create">(savedProfiles.length > 0 ? "select" : "create");

  if (mode === "create") {
    return <Onboarding onBack={savedProfiles.length > 0 ? () => setMode("select") : undefined} />;
  }

  const enter = (profile: EmployeeProfile) => {
    signInAs(profile.id);
    navigate(dashboardForPersona(resolvePersona(profile).personaId));
  };

  const Row = ({ profile }: { profile: EmployeeProfile }) => {
    const match = resolvePersona(profile);
    return (
      <button
        onClick={() => enter(profile)}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-brand-border hover:bg-brand-tint/40"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-xs font-semibold text-brand-purple">
          {employeeInitials(profile.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{profile.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {profile.title || "—"} · {match.label}
          </span>
        </span>
        <LogIn className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-brand-tint">
              <Boxes className="w-7 h-7 text-brand-purple" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Continue as a saved profile, or create a new one.</p>
        </div>

        {savedProfiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" /> Your profiles
            </div>
            {savedProfiles.map((p) => <Row key={p.id} profile={p} />)}
          </div>
        )}

        <Button onClick={() => setMode("create")} className="w-full" size="lg">
          <Plus className="w-4 h-4 mr-2" /> Create a new profile
        </Button>

        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Demo engineers
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {directory.map((emp) => (
              <button
                key={emp.id}
                onClick={() => enter(emp)}
                title={`${emp.name} — ${emp.title}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-left hover:border-brand-border hover:text-brand-purple"
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {employeeInitials(emp.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium">{emp.name.replace(/^Dr\.?\s+/i, "")}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{emp.title}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Demo environment — no real authentication. Your profile drives the persona.
        </p>
      </Card>
    </div>
  );
};

export default AuthGate;
