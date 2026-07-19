import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader, SectionCard, Field, StatusBadge, SideDrawer } from "@/idp/components";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Trash2, Pencil, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resolvePersona, dashboardForPersona } from "../../identity/resolvePersona";
import { employeeInitials, type EmployeeProfile } from "../../identity/directory";

const parseList = (t: string) => t.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

/**
 * Admin profile management — set up engineer profiles behind the scenes. New
 * profiles are added to the roster without signing in; existing ones can be
 * edited, deleted, or impersonated ("sign in as").
 */
const Profiles = () => {
  const { savedProfiles, directory, addProfile, updateProfileById, deleteProfile, signInAs } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");

  const [editing, setEditing] = useState<EmployeeProfile | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eSkills, setESkills] = useState("");

  const create = () => {
    if (!title.trim() && !skills.trim()) {
      toast.error("Add a job title or some skills");
      return;
    }
    const id = addProfile({ name: name.trim() || "New engineer", title: title.trim(), skills: parseList(skills) });
    toast.success(`Profile created — ${resolvePersona({ ...profileStub(name, title, skills), id }).label} workspace`);
    setName(""); setTitle(""); setSkills("");
  };

  const openEdit = (p: EmployeeProfile) => {
    setEditing(p);
    setETitle(p.title);
    setESkills(p.skills.join(", "));
  };

  const saveEdit = () => {
    if (!editing) return;
    updateProfileById(editing.id, { title: eTitle.trim(), skills: parseList(eSkills) });
    toast.success("Profile updated");
    setEditing(null);
  };

  const enter = (p: EmployeeProfile) => {
    signInAs(p.id);
    navigate(dashboardForPersona(resolvePersona(p).personaId));
  };

  const Row = ({ p, canManage }: { p: EmployeeProfile; canManage: boolean }) => {
    const match = resolvePersona(p);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-xs font-semibold text-brand-purple">
          {employeeInitials(p.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{p.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{p.title || "—"}</div>
        </div>
        <StatusBadge tone="neutral">{match.label}</StatusBadge>
        <Button size="sm" variant="ghost" title="Sign in as" onClick={() => enter(p)}>
          <LogIn className="h-4 w-4" />
        </Button>
        {canManage && (
          <>
            <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(p)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" title="Delete" onClick={() => { deleteProfile(p.id); toast.success("Profile deleted"); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Profiles"
        description="Set up and manage engineer profiles. New profiles are provisioned behind the scenes."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <SectionCard title="Create a profile">
          <div className="space-y-3">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </Field>
            <Field label="Job title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Data Engineer" />
            </Field>
            <Field label="Skills" hint="comma-separated">
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="dbt, Airflow, Spark" />
            </Field>
            <Button onClick={create}>
              <UserPlus className="h-4 w-4 mr-1" /> Create profile
            </Button>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title={`Created profiles (${savedProfiles.length})`}>
            {savedProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No profiles created yet.</p>
            ) : (
              <div className="space-y-2">
                {savedProfiles.map((p) => <Row key={p.id} p={p} canManage />)}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Demo engineers">
            <div className="space-y-2">
              {directory.map((p) => <Row key={p.id} p={p} canManage={false} />)}
            </div>
          </SectionCard>
        </div>
      </div>

      <SideDrawer open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={`Edit ${editing?.name ?? ""}`}>
        <div className="space-y-3">
          <Field label="Job title">
            <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} />
          </Field>
          <Field label="Skills" hint="comma-separated">
            <Input value={eSkills} onChange={(e) => setESkills(e.target.value)} />
          </Field>
          {editing && (
            <p className="text-xs text-muted-foreground">
              Derived workspace:{" "}
              <span className="font-medium text-brand-purple">
                {resolvePersona({ ...editing, title: eTitle, skills: parseList(eSkills) }).label}
              </span>
            </p>
          )}
          <Button onClick={saveEdit}>Save changes</Button>
        </div>
      </SideDrawer>
    </div>
  );
};

/** Build a throwaway profile shape for the create-toast's persona label. */
const profileStub = (name: string, title: string, skills: string): EmployeeProfile => ({
  id: "stub", name: name || "New engineer", email: "", title, department: "", team: "",
  location: "", seniority: "Senior", skills: parseList(skills), systems: [], bio: "",
});

export default Profiles;
