import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, ShieldCheck, ChevronDown } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  Field,
  InfoList,
  type Column,
  type Tone,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getUsers,
  getRoles,
  getElevations,
  decideElevation,
  getAccessReview,
  attestReview,
  getPermissionAudit,
  getTeams,
  createTeam,
  type User,
  type Role,
  type Elevation,
  type AccessReviewItem,
  type AuditEntry,
  type Team,
} from "./api";

/**
 * Capability 4.3 — Role-Based Management. Admin-only screen (the registry gates
 * it to the security persona). Six tabs let an admin control what each persona
 * can see/do: Users, Roles, Elevation requests, Access review, Audit trail,
 * and Teams. All mutating actions toast; data comes from ./api mocks.
 */

const riskTone = (risk: string): Tone =>
  risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success";

const auditTone = (action: string): Tone => {
  switch (action) {
    case "Granted":
    case "Attested":
      return "success";
    case "Revoked":
      return "danger";
    case "Elevated":
      return "warning";
    default:
      return "info";
  }
};

const RoleManagement = () => {
  return (
    <div>
      <PageHeader
        title="Role-Based Management"
        description="Admin-only: control what each persona can see and do — assignments, role permissions, elevation requests, access reviews, and the permission audit trail."
      />

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="elevations">Elevation requests</TabsTrigger>
          <TabsTrigger value="review">Access review</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <RolesTab />
        </TabsContent>
        <TabsContent value="elevations" className="mt-4">
          <ElevationsTab />
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          <AccessReviewTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
        <TabsContent value="teams" className="mt-4">
          <TeamsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* --------------------------------- Users --------------------------------- */

const UsersTab = () => {
  const [q, setQ] = useState("");
  const { data: users, loading } = useMockQuery(getUsers, []);

  const query = q.trim().toLowerCase();
  const rows = (users ?? []).filter(
    (u) =>
      !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.persona.toLowerCase().includes(query) ||
      u.team.toLowerCase().includes(query)
  );

  const columns: Column<User>[] = [
    { key: "name", header: "Name", sortable: true, render: (u) => <span className="font-medium">{u.name}</span> },
    { key: "email", header: "Email", render: (u) => <span className="font-mono text-xs">{u.email}</span> },
    { key: "persona", header: "Persona", render: (u) => <StatusBadge tone="neutral">{u.persona}</StatusBadge> },
    { key: "team", header: "Team", render: (u) => <span className="text-xs text-muted-foreground">{u.team}</span> },
    { key: "status", header: "Status", render: (u) => <StatusBadge>{u.status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => toast(`Reassign persona: ${u.name}`)}>
            Reassign
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast(`Manage team membership: ${u.name}`)}>
            Teams
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search users, personas, teams…"
        className="min-w-64"
      />
    </div>
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(u) => u.id}
      loading={loading}
      toolbar={toolbar}
      emptyTitle="No users match"
      emptyDescription="Adjust the search."
    />
  );
};

/* --------------------------------- Roles --------------------------------- */

const RolesTab = () => {
  const { data: roles, loading } = useMockQuery(getRoles, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8">Loading roles…</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(roles ?? []).map((role) => (
        <RoleCard key={role.persona} role={role} />
      ))}
    </div>
  );
};

const RoleCard = ({ role }: { role: Role }) => (
  <Card className="p-4 space-y-3">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">{role.label}</h3>
          <p className="font-mono text-xs text-muted-foreground">{role.persona}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => toast(`View / edit permissions: ${role.label}`)}>
        View / edit
      </Button>
    </div>

    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">Default permissions</p>
      <ul className="space-y-1">
        {role.can.map((c) => (
          <li key={c} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">Cannot without elevation</p>
      <ul className="space-y-1">
        {role.cannot.map((c) => (
          <li key={c} className="flex items-start gap-2 text-sm">
            <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{c}</span>
          </li>
        ))}
      </ul>
    </div>
  </Card>
);

/* ----------------------------- Elevation reqs ---------------------------- */

const ElevationsTab = () => {
  const { data: elevations, loading, refetch } = useMockQuery(getElevations, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = (elevations ?? []).find((e) => e.id === selectedId);

  const decide = async (e: Elevation, decision: "Approved" | "Denied") => {
    const res = await decideElevation(e.id, decision);
    if (decision === "Approved") {
      toast.success(`Approved: ${e.requested_permission} for ${e.requester}${res.expires_at ? ` — expires in ${e.duration}` : ""}`);
    } else {
      toast(`Denied: ${e.requested_permission} for ${e.requester}`);
    }
    setSelectedId(null);
    refetch();
  };

  const columns: Column<Elevation>[] = [
    { key: "requester", header: "Requester", sortable: true, render: (e) => <span className="font-medium">{e.requester}</span> },
    { key: "current_persona", header: "Current persona", render: (e) => <StatusBadge tone="neutral">{e.current_persona}</StatusBadge> },
    { key: "requested_permission", header: "Requested permission", render: (e) => <span className="text-sm">{e.requested_permission}</span> },
    { key: "scope", header: "Scope", render: (e) => <span className="font-mono text-xs">{e.scope}</span> },
    { key: "duration", header: "Duration", align: "right", render: (e) => <span className="text-sm">{e.duration}</span> },
    { key: "requested_at", header: "Requested", sortable: true, accessor: (e) => e.requested_at, render: (e) => timeAgo(e.requested_at) },
    { key: "status", header: "Status", render: (e) => <StatusBadge>{e.status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (e) => (
        <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
          {e.status === "Pending" ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => decide(e, "Approved")}>Approve</Button>
              <Button variant="ghost" size="sm" onClick={() => decide(e, "Denied")}>Deny</Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground px-2">Resolved</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={elevations ?? []}
        rowKey={(e) => e.id}
        loading={loading}
        onRowClick={(e) => setSelectedId(e.id)}
        defaultSort={{ key: "requested_at", dir: "desc" }}
        emptyTitle="No elevation requests"
        emptyDescription="Temporary permission upgrades appear here for review."
      />

      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title={selected ? selected.requested_permission : ""}
        description={selected ? `${selected.requester} · ${selected.current_persona}` : undefined}
      >
        {selected && (
          <>
            <SectionCard title="Request details">
              <InfoList
                items={[
                  { label: "Requester", value: selected.requester },
                  { label: "Current persona", value: <StatusBadge tone="neutral">{selected.current_persona}</StatusBadge> },
                  { label: "Requested permission", value: selected.requested_permission },
                  { label: "Scope", value: <span className="font-mono text-xs">{selected.scope}</span> },
                  { label: "Duration", value: selected.duration },
                  { label: "Requested", value: timeAgo(selected.requested_at) },
                  { label: "Status", value: <StatusBadge>{selected.status}</StatusBadge> },
                  ...(selected.expires_at ? [{ label: "Expires", value: timeAgo(selected.expires_at) }] : []),
                ]}
              />
            </SectionCard>
            <SectionCard title="Justification">
              <p className="text-sm text-muted-foreground">{selected.justification}</p>
            </SectionCard>
            {selected.status === "Pending" && (
              <div className="flex gap-2">
                <Button onClick={() => decide(selected, "Approved")}>Approve (sets {selected.duration} expiry)</Button>
                <Button variant="outline" onClick={() => decide(selected, "Denied")}>Deny</Button>
              </div>
            )}
          </>
        )}
      </SideDrawer>
    </>
  );
};

/* ------------------------------ Access review ---------------------------- */

const AccessReviewTab = () => {
  const { data: items, loading, refetch } = useMockQuery(getAccessReview, []);

  const attest = async (item: AccessReviewItem) => {
    await attestReview(item.id);
    toast.success(`Attested: ${item.principal} (${item.role})`);
    refetch();
  };

  const columns: Column<AccessReviewItem>[] = [
    { key: "principal", header: "Principal", sortable: true, render: (i) => <span className="font-medium">{i.principal}</span> },
    { key: "role", header: "Role", render: (i) => <StatusBadge tone="neutral">{i.role}</StatusBadge> },
    { key: "last_used", header: "Last used", sortable: true, accessor: (i) => i.last_used, render: (i) => timeAgo(i.last_used) },
    { key: "risk", header: "Risk", render: (i) => <StatusBadge tone={riskTone(i.risk)}>{i.risk}</StatusBadge> },
    { key: "status", header: "Status", render: (i) => <StatusBadge>{i.status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (i) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {i.status === "Attested" ? (
            <span className="text-xs text-muted-foreground px-2">Attested</span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => attest(i)}>Attest</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={items ?? []}
      rowKey={(i) => i.id}
      loading={loading}
      defaultSort={{ key: "risk", dir: "desc" }}
      emptyTitle="No scheduled reviews"
      emptyDescription="Access certifications appear here when due."
    />
  );
};

/* ------------------------------- Audit trail ----------------------------- */

const AuditTab = () => {
  const { data: entries, loading } = useMockQuery(getPermissionAudit, []);

  const columns: Column<AuditEntry>[] = [
    { key: "at", header: "When", sortable: true, accessor: (a) => a.at, render: (a) => timeAgo(a.at) },
    { key: "actor", header: "Changed by", render: (a) => <span className="font-medium">{a.actor}</span> },
    { key: "action", header: "Action", render: (a) => <StatusBadge tone={auditTone(a.action)}>{a.action}</StatusBadge> },
    { key: "permission", header: "Permission", render: (a) => <span className="text-sm">{a.permission}</span> },
    { key: "target", header: "Target", render: (a) => <span className="font-mono text-xs">{a.target}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={entries ?? []}
      rowKey={(a) => a.id}
      loading={loading}
      defaultSort={{ key: "at", dir: "desc" }}
      emptyTitle="No permission changes logged"
    />
  );
};

/* --------------------------------- Teams --------------------------------- */

const TeamsTab = () => {
  const { data: teams, loading, refetch } = useMockQuery(getTeams, []);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [dataScope, setDataScope] = useState("");
  const [resourceScope, setResourceScope] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Team name is required");
      return;
    }
    const team = await createTeam({ name: name.trim(), data_scope: dataScope, resource_scope: resourceScope });
    toast.success(`Team created: ${team.name}`);
    setName("");
    setDataScope("");
    setResourceScope("");
    setCreating(false);
    refetch();
  };

  const columns: Column<Team>[] = [
    { key: "name", header: "Team", sortable: true, render: (t) => <span className="font-medium font-mono text-xs">{t.name}</span> },
    { key: "members", header: "Members", align: "right", sortable: true, render: (t) => <span className="text-sm">{t.members}</span> },
    { key: "data_scope", header: "Data scope", render: (t) => <span className="font-mono text-xs">{t.data_scope}</span> },
    { key: "resource_scope", header: "Resource scope", render: (t) => <span className="font-mono text-xs">{t.resource_scope}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (t) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => toast(`Manage members: ${t.name}`)}>Members</Button>
          <Button variant="ghost" size="sm" onClick={() => toast(`Edit scope: ${t.name}`)}>Scope</Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex justify-end">
      <Button variant="outline" size="sm" onClick={() => setCreating((v) => !v)}>
        Create team <ChevronDown className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {creating && (
        <SectionCard title="Create team">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Team name" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="platform-tools" />
            </Field>
            <Field label="Data scope" hint="Comma-separated datasets/namespaces">
              <Input value={dataScope} onChange={(e) => setDataScope(e.target.value)} className="font-mono text-xs" placeholder="analytics.*" />
            </Field>
            <Field label="Resource scope" hint="Namespaces / compute">
              <Input value={resourceScope} onChange={(e) => setResourceScope(e.target.value)} className="font-mono text-xs" placeholder="ns/platform-tools" />
            </Field>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={submit}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </SectionCard>
      )}

      <DataTable
        columns={columns}
        rows={teams ?? []}
        rowKey={(t) => t.id}
        loading={loading}
        toolbar={toolbar}
        emptyTitle="No teams"
        emptyDescription="Create a team to scope data and resource access."
      />
    </div>
  );
};

export default RoleManagement;
