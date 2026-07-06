import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings as SettingsIcon } from "lucide-react";
import { PageHeader, SectionCard, InfoList, Field } from "@/idp/components";
import { useAuth } from "@/contexts/AuthContext";
import { getPersonaModule } from "@/idp/personas/registry";

/**
 * Profile screen — the user's identity and role. Display name is editable and
 * persists via AuthContext (which the top header reads). Links to Settings for
 * menu/appearance personalization.
 */
const Profile = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const persona = user?.persona ?? "";
  const module = getPersonaModule(persona);
  const [name, setName] = useState(user?.name ?? "");

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const save = () => {
    if (!name.trim() || !user) return;
    login({ persona: user.persona, name: name.trim() });
    toast.success("Profile updated");
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Your identity and role in the platform."
        actions={
          <Button variant="outline" onClick={() => navigate(`/${persona}/settings`)}>
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <SectionCard title="Identity">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary/15 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{user?.name}</div>
              <div className="text-sm text-muted-foreground">{module?.label}</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Field label="Display name">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button size="sm" onClick={save} disabled={!name.trim() || name.trim() === user?.name}>
              Save changes
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Role & workspace">
          <InfoList
            items={[
              { label: "Persona", value: module?.label ?? persona },
              { label: "Focus", value: module?.blurb ?? "—" },
              { label: "Workspace id", value: <span className="font-mono text-xs">{persona}</span> },
              { label: "Access", value: persona === "security" ? "Admin (Role-Based Management)" : "Standard self-service" },
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Your persona is fixed at login and scopes which screens and agents you see. To personalize your left-hand
            menu, open Settings.
          </p>
        </SectionCard>
      </div>
    </div>
  );
};

export default Profile;
