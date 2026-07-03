import { LayoutDashboard, FlaskConical, GitCompare, Database, Boxes, CheckSquare } from "lucide-react";
import type { PersonaModule } from "../../types";
import Dashboard from "./Dashboard";
import NewTrainingRequest from "./NewTrainingRequest";
import Experiments from "./Experiments";
import DatasetCatalog from "./DatasetCatalog";
import ModelRegistry from "./ModelRegistry";
import Approvals from "./Approvals";

const nav = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "New Training Request", path: "request", icon: FlaskConical },
  { label: "Experiments", path: "experiments", icon: GitCompare },
  { label: "Dataset Catalog", path: "datasets", icon: Database },
  { label: "Model Registry", path: "models", icon: Boxes },
  { label: "Approvals", path: "approvals", icon: CheckSquare },
];

const dataScientist: PersonaModule = {
  id: "data-scientist",
  label: "Data Scientist",
  icon: FlaskConical,
  blurb: "Training requests, experiment tracking, datasets, model promotion.",
  nav,
  routes: [
    { path: "data-scientist/dashboard", element: <Dashboard /> },
    { path: "data-scientist/request", element: <NewTrainingRequest /> },
    { path: "data-scientist/experiments", element: <Experiments /> },
    { path: "data-scientist/datasets", element: <DatasetCatalog /> },
    { path: "data-scientist/models", element: <ModelRegistry /> },
    { path: "data-scientist/approvals", element: <Approvals /> },
  ],
};

export default dataScientist;
