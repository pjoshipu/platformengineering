import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { PageHeader, DataTable, StatusBadge, type Column } from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { getTools, toggleTool, type Tool } from "./api";

const ToolRegistry = () => {
  const { data, loading } = useMockQuery(getTools, []);
  const [tools, setTools] = useState<Tool[]>([]);
  useEffect(() => { if (data) setTools(data); }, [data]);

  const flip = async (t: Tool) => {
    setTools((prev) => prev.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)));
    await toggleTool(t.id, !t.enabled);
    toast.success(`${t.name} ${!t.enabled ? "enabled" : "disabled"}`);
  };

  const columns: Column<Tool>[] = [
    { key: "name", header: "Tool", sortable: true, render: (t) => <span className="font-mono text-sm">{t.name}</span> },
    { key: "type", header: "Type", render: (t) => <StatusBadge tone="neutral">{t.type}</StatusBadge> },
    { key: "scope", header: "Scope", render: (t) => <span className="font-mono text-xs">{t.scope}</span> },
    { key: "calls_24h", header: "Calls (24h)", align: "right", sortable: true },
    {
      key: "enabled",
      header: "Enabled",
      render: (t) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch checked={t.enabled} onCheckedChange={() => flip(t)} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tool Registry"
        description="Tools agents can call, their gateway scopes, and 24h usage. Write-scoped tools require HITL approval at runtime."
      />
      <DataTable columns={columns} rows={tools} rowKey={(t) => t.id} loading={loading && tools.length === 0} />
    </div>
  );
};

export default ToolRegistry;
