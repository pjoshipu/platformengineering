import { LayoutDashboard, Workflow, Upload, Layers, ShieldCheck, Share2, Database } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import PipelineBuilder from "./PipelineBuilder";
import DatasetPublisher from "./DatasetPublisher";
import FeatureStore from "./FeatureStore";
import DataQuality from "./DataQuality";
import LineageExplorer from "./LineageExplorer";

const nav = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Pipeline Builder", path: "pipelines", icon: Workflow },
  { label: "Dataset Publisher", path: "publish", icon: Upload },
  { label: "Feature Store", path: "features", icon: Layers },
  { label: "Data Quality", path: "quality", icon: ShieldCheck },
  { label: "Lineage Explorer", path: "lineage", icon: Share2 },
];

const dataEngineer: PersonaModule = {
  id: "data-engineer",
  label: "Data Engineer",
  icon: Database,
  blurb: "Data pipelines, dataset publishing, feature store, lineage.",
  nav,
  routes: [
    { path: "data-engineer/dashboard", element: <Dashboard /> },
    { path: "data-engineer/pipelines", element: <PipelineBuilder /> },
    { path: "data-engineer/publish", element: <DatasetPublisher /> },
    { path: "data-engineer/features", element: <FeatureStore /> },
    { path: "data-engineer/quality", element: <DataQuality /> },
    { path: "data-engineer/lineage", element: <LineageExplorer /> },
  ],
};

export default dataEngineer;
