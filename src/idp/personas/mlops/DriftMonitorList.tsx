import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  type Column,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { getPipelines, MODELS, type Pipeline } from "./api";

interface ModelRow {
  id: string;
  name: string;
  drift_status: string;
  pipeline: string;
}

const DriftMonitorList = () => {
  const navigate = useNavigate();
  const { data: pipelines, loading } = useMockQuery(getPipelines, []);

  const rows: ModelRow[] = MODELS.map((m) => {
    const pl = (pipelines ?? []).find((p: Pipeline) => p.model_id === m.id);
    return {
      id: m.id,
      name: m.name,
      drift_status: pl?.drift_status ?? "No drift",
      pipeline: pl?.name ?? "—",
    };
  });

  const columns: Column<ModelRow>[] = [
    { key: "name", header: "Model", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "pipeline", header: "Pipeline", render: (r) => <span className="font-mono text-xs">{r.pipeline}</span> },
    { key: "drift_status", header: "Drift status", render: (r) => <StatusBadge>{r.drift_status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/idp/mlops/drift/${r.id}`)}>
            View drift report
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Drift Monitor"
        description="Pick a model to inspect feature drift, prediction drift, and retraining recommendations."
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        onRowClick={(r) => navigate(`/idp/mlops/drift/${r.id}`)}
      />
    </div>
  );
};

export default DriftMonitorList;
