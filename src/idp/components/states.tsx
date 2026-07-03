import { Loader2, type LucideIcon, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/** Inline spinner block for loading regions. */
export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
    <Loader2 className="w-5 h-5 animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);

/** Table/list skeleton rows. */
export const RowSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2 py-2">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <div className="p-3 rounded-full bg-muted">
      <Icon className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="font-medium">{title}</p>
    {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
