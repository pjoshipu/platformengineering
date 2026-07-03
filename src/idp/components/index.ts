// Barrel export for the IDP shared component library.
// Personas should import UI primitives from "@/idp/components".
export { PageHeader } from "./PageHeader";
export { MetricCard, MetricsRow, type MetricCardProps, type MetricTone } from "./MetricCard";
export { StatusBadge, toneForStatus, type Tone } from "./StatusBadge";
export { DataTable, type Column } from "./DataTable";
export { SideDrawer } from "./SideDrawer";
export { Wizard, type WizardStep } from "./Wizard";
export { KeyValueEditor, type KeyValuePair } from "./KeyValueEditor";
export { DiffViewer } from "./DiffViewer";
export { Loading, RowSkeleton, EmptyState } from "./states";
export { Field, InfoList, SectionCard, SidePanel } from "./primitives";
export {
  ChartCard,
  LineChartCard,
  StackedBarChartCard,
  HorizontalBarChartCard,
  AreaChartCard,
  CHART_COLORS,
  type SeriesConfig,
} from "./charts";
