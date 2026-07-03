import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, DataTable, StatusBadge, type Column } from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { getGatewayRoutes } from "./api";

type Route = Awaited<ReturnType<typeof getGatewayRoutes>>[number];

const ApiGateway = () => {
  const { data: routes, loading } = useMockQuery(getGatewayRoutes, []);

  const columns: Column<Route>[] = [
    { key: "path", header: "Route", sortable: true, render: (r) => <span className="font-mono text-xs">{r.path}</span> },
    { key: "service", header: "Service", render: (r) => <span className="font-medium">{r.service}</span> },
    { key: "auth", header: "Auth", render: (r) => <StatusBadge tone="neutral">{r.auth}</StatusBadge> },
    { key: "rate_limit", header: "Rate limit", sortable: true, render: (r) => (r.rate_limit ? `${r.rate_limit}/min` : "—") },
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => toast(`Edit route ${r.path}`)}>Edit</Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="API Gateway"
        description="Routes exposed through the platform gateway, their auth mode and rate limits."
        actions={<Button onClick={() => toast("New route form")}>New route</Button>}
      />
      <DataTable columns={columns} rows={routes ?? []} rowKey={(r) => r.id} loading={loading} />
    </div>
  );
};

export default ApiGateway;
