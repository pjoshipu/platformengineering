import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings as SettingsIcon, Sparkles, RotateCcw } from "lucide-react";
import { PageHeader, SectionCard, InfoList, Field } from "@/idp/components";
import { useAuth } from "@/contexts/AuthContext";
import { employeeInitials } from "@/idp/identity/directory";
import { resolvePersona } from "@/idp/identity/resolvePersona";

/**
 * Profile screen — the editable identity that DRIVES the workspace. You don't
 * pick a persona; you describe who you are, and the platform derives it. The
 * right panel re-derives the persona live as you edit, showing the reason and
 * the signals that produced it. Saving persists the profile (AuthContext) and
 * the whole app re-renders into the new workspace.
 */

const parseList = (text: string): string[] =>
  text.split(",").map((s) => s.trim()).filter(Boolean);

const Profile = () => {
  const { user, profile, personaMatch, updateProfile, resetProfile } = useAuth();
  const navigate = useNavigate();
  const persona = user?.persona ?? "";

  // Local edit buffer, seeded from the active profile; re-seed when the
  // signed-in person changes (e.g. via the identity switcher).
  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [department, setDepartment] = useState(profile.department);
  const [team, setTeam] = useState(profile.team);
  const [skillsText, setSkillsText] = useState(profile.skills.join(", "));
  const [systemsText, setSystemsText] = useState(profile.systems.join(", "));

  useEffect(() => {
    setName(profile.name);
    setTitle(profile.title);
    setDepartment(profile.department);
    setTeam(profile.team);
    setSkillsText(profile.skills.join(", "));
    setSystemsText(profile.systems.join(", "));
  }, [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live-derived persona from the current (unsaved) edit buffer.
  const previewProfile = useMemo(
    () => ({ ...profile, name, title, department, team, skills: parseList(skillsText), systems: parseList(systemsText) }),
    [profile, name, title, department, team, skillsText, systemsText]
  );
  const preview = useMemo(() => resolvePersona(previewProfile), [previewProfile]);

  const dirty =
    name !== profile.name ||
    title !== profile.title ||
    department !== profile.department ||
    team !== profile.team ||
    skillsText !== profile.skills.join(", ") ||
    systemsText !== profile.systems.join(", ");

  const willSwitch = preview.personaId !== personaMatch.personaId;

  const save = () => {
    if (!name.trim()) return;
    updateProfile({
      name: name.trim(),
      title: title.trim(),
      department: department.trim(),
      team: team.trim(),
      skills: parseList(skillsText),
      systems: parseList(systemsText),
    });
    toast.success(
      willSwitch ? `Profile saved — workspace switched to ${preview.label}` : "Profile saved"
    );
    if (willSwitch) navigate(`/${preview.personaId}/dashboard`);
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your identity drives your workspace — edit it and the platform re-derives your persona automatically."
        actions={
          <Button variant="outline" onClick={() => navigate(`/${persona}/settings`)}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        {/* Editable identity */}
        <SectionCard title="Identity">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary/15 text-primary">
                {employeeInitials(name || profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-lg font-semibold truncate">{name || profile.name}</div>
              <div className="text-sm text-muted-foreground truncate">{profile.email}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Job title" hint="strongest signal for your workspace">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Department">
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </Field>
            <Field label="Team">
              <Input value={team} onChange={(e) => setTeam(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 space-y-3">
            <Field label="Skills" hint="comma-separated">
              <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
            </Field>
            <Field label="Systems" hint="comma-separated">
              <Input value={systemsText} onChange={(e) => setSystemsText(e.target.value)} />
            </Field>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={!dirty || !name.trim()}>
              Save changes
            </Button>
            <Button size="sm" variant="ghost" onClick={resetProfile} title="Discard edits to this profile">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset profile
            </Button>
          </div>
        </SectionCard>

        {/* Live-derived workspace */}
        <SectionCard title="Detected workspace">
          <div className="rounded-xl border border-brand-border bg-brand-tint/40 p-4">
            <div className="flex items-center gap-2 text-brand-purple">
              <Sparkles className="h-4 w-4" />
              <span className="text-lg font-semibold">{preview.label}</span>
            </div>
            <p className="mt-1.5 text-[13px] text-muted-foreground">{preview.reason}</p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Match confidence</span>
                <span>{Math.round(preview.confidence * 100)}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-border">
                <div className="h-1.5 rounded-full bg-brand-purple transition-all" style={{ width: `${Math.round(preview.confidence * 100)}%` }} />
              </div>
            </div>

            {preview.signals.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {preview.signals.slice(0, 8).map((s) => (
                  <span key={s} className="rounded-full bg-card px-2 py-0.5 text-[10px] text-muted-foreground border border-border">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {dirty && willSwitch && (
            <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
              Saving will move you from the {personaMatch.label} workspace to {preview.label}.
            </p>
          )}

          <div className="mt-4">
            <InfoList
              items={[
                { label: "Seniority", value: profile.seniority },
                { label: "Location", value: profile.location },
                { label: "Workspace id", value: <span className="font-mono text-xs">{preview.personaId}</span> },
                { label: "Access", value: preview.personaId === "security" ? "Admin (Role-Based Management)" : "Standard self-service" },
              ]}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your persona is inferred from this profile — you never pick it. Change your title or skills above to see it re-derive.
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

export default Profile;
