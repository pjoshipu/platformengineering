import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export type MetricTone = "default" | "good" | "warning" | "poor" | "highlight";

const VALUE_TONE: Record<MetricTone, string> = {
  default: "text-foreground",
  good: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  poor: "text-destructive",
  highlight: "text-primary",
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  /** optional icon shown top-right */
  icon?: LucideIcon;
  /** colours the value; use for faithfulness/health style signals */
  tone?: MetricTone;
  /** delta vs previous period, e.g. "+12%" or "-$4.10" */
  delta?: string;
  /** true if the delta is a positive/good change (drives arrow + colour) */
  deltaPositive?: boolean;
  /** small footnote under the value */
  footer?: string;
  /** renders a "view" style affordance and makes the whole card clickable */
  onClick?: () => void;
  actionLabel?: string;
}

export const MetricCard = ({
  label,
  value,
  icon: Icon,
  tone = "default",
  delta,
  deltaPositive,
  footer,
  onClick,
  actionLabel,
}: MetricCardProps) => (
  <Card
    className={cn(
      "p-4 flex flex-col gap-1",
      onClick && "cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
    )}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
    </div>
    <div className={cn("text-2xl font-bold tabular-nums", VALUE_TONE[tone])}>{value}</div>
    <div className="flex items-center gap-2 min-h-[1.25rem]">
      {delta && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            deltaPositive ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}
        >
          {deltaPositive ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {delta}
        </span>
      )}
      {footer && <span className="text-xs text-muted-foreground">{footer}</span>}
      {actionLabel && onClick && (
        <span className="text-xs font-medium text-primary ml-auto">{actionLabel} →</span>
      )}
    </div>
  </Card>
);

/** Responsive row wrapper for 2–4 metric cards. */
export const MetricsRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">{children}</div>
);

export default MetricCard;
