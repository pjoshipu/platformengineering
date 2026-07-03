import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Zap, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  StatusBadge,
  SideDrawer,
  SectionCard,
  Field,
  EmptyState,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getActions,
  runPreflight,
  executeAction,
  type SelfServiceAction,
  type PreflightCheck,
} from "./api";

/**
 * Capability 3.1 — Self-Service Actions. ONE persona-aware screen: the active
 * persona (from auth) selects which pre-approved actions appear. Each card
 * opens a drawer with a generic form (rendered from the action's fields), the
 * guardrails, a preflight step, and a gated Execute button.
 */

const Actions = () => {
  const { user } = useAuth();
  const personaId = user?.persona ?? "";

  const { data: actions, loading } = useMockQuery(() => getActions(personaId), [personaId]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<PreflightCheck[] | null>(null);
  const [running, setRunning] = useState(false);
  const [executing, setExecuting] = useState(false);

  const selected = useMemo(
    () => (actions ?? []).find((a) => a.id === selectedId) ?? null,
    [actions, selectedId]
  );

  // Group actions by asset_type for a labeled grid.
  const groups = useMemo(() => {
    const map = new Map<string, SelfServiceAction[]>();
    for (const a of actions ?? []) {
      const arr = map.get(a.asset_type) ?? [];
      arr.push(a);
      map.set(a.asset_type, arr);
    }
    return Array.from(map.entries());
  }, [actions]);

  const openAction = (action: SelfServiceAction) => {
    setSelectedId(action.id);
    setInputs({});
    setChecks(null);
    setRunning(false);
    setExecuting(false);
  };

  const closeDrawer = () => {
    setSelectedId(null);
    setChecks(null);
    setInputs({});
  };

  const setField = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
    setChecks(null); // inputs changed → require a fresh preflight
  };

  const onPreflight = async () => {
    if (!selected) return;
    setRunning(true);
    setChecks(null);
    try {
      const res = await runPreflight(selected.id, inputs);
      setChecks(res.checks);
    } finally {
      setRunning(false);
    }
  };

  const onExecute = async () => {
    if (!selected) return;
    setExecuting(true);
    try {
      const res = await executeAction(selected.id, inputs);
      toast.success(`${selected.label} started`, {
        description: res.pipeline_run_id ? `Run: ${res.pipeline_run_id}` : res.status,
      });
      closeDrawer();
    } finally {
      setExecuting(false);
    }
  };

  const allPassed = !!checks && checks.length > 0 && checks.every((c) => c.status === "pass");
  const canExecute = allPassed && !executing;

  return (
    <div>
      <PageHeader
        title="Self-Service Actions"
        description="Pre-approved actions you can run without a ticket. Each enforces its guardrails before executing."
      />

      {!loading && groups.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No self-service actions"
          description="No pre-approved actions are configured for your persona yet."
        />
      ) : (
        <div className="space-y-6">
          {(loading ? [] : groups).map(([assetType, list]) => (
            <div key={assetType}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{assetType}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((action) => (
                  <Card
                    key={action.id}
                    className="cursor-pointer p-4 transition-colors hover:border-primary/50"
                    onClick={() => openAction(action)}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <span className="font-medium">{action.label}</span>
                      <StatusBadge tone="neutral">{action.asset_type}</StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {action.guardrails.length} guardrail
                      {action.guardrails.length === 1 ? "" : "s"} enforced
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-28 animate-pulse bg-muted/40" />
              ))}
            </div>
          )}
        </div>
      )}

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && closeDrawer()}
        title={selected?.label ?? ""}
        description={selected ? `${selected.asset_type} · self-service` : undefined}
        wide
      >
        {selected && (
          <>
            <p className="text-sm text-muted-foreground">{selected.description}</p>

            <SectionCard title="Parameters">
              <div className="space-y-3">
                {selected.fields.map((f) => (
                  <Field key={f.name} label={f.label} htmlFor={f.name}>
                    {f.type === "select" ? (
                      <Select value={inputs[f.name] ?? ""} onValueChange={(v) => setField(f.name, v)}>
                        <SelectTrigger id={f.name}>
                          <SelectValue placeholder={f.placeholder ?? "Select…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={f.name}
                        type={f.type === "number" ? "number" : "text"}
                        placeholder={f.placeholder}
                        value={inputs[f.name] ?? ""}
                        onChange={(e) => setField(f.name, e.target.value)}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Guardrails">
              <ul className="space-y-1.5">
                {selected.guardrails.map((g) => (
                  <li key={g} className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {g}
                  </li>
                ))}
              </ul>
            </SectionCard>

            {checks && (
              <SectionCard title="Preflight checks">
                <div className="space-y-2">
                  {checks.map((c) => (
                    <div key={c.name} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm">{c.name}</p>
                        {c.reason && <p className="text-xs text-muted-foreground">{c.reason}</p>}
                      </div>
                      <StatusBadge tone={c.status === "pass" ? "success" : "danger"}>
                        {c.status === "pass" ? "Pass" : "Fail"}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
                {!allPassed && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Resolve the failing guardrail before executing.
                  </p>
                )}
              </SectionCard>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onPreflight} disabled={running}>
                {running ? "Running preflight…" : "Run preflight"}
              </Button>
              <Button onClick={onExecute} disabled={!canExecute}>
                {executing ? "Executing…" : "Execute"}
              </Button>
            </div>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Actions;
