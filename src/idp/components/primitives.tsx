import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Labelled form field wrapper with optional hint + required marker. */
export const Field = ({
  label,
  htmlFor,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={htmlFor}>
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/** Read-only label/value list for detail drawers and review steps. */
export const InfoList = ({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) => (
  <dl className="divide-y divide-border rounded-lg border border-border">
    {items.map((item, i) => (
      <div key={i} className="flex items-start justify-between gap-4 px-3 py-2">
        <dt className="text-sm text-muted-foreground shrink-0">{item.label}</dt>
        <dd className="text-sm font-medium text-right break-words">{item.value}</dd>
      </div>
    ))}
  </dl>
);

/** Titled section container. */
export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <Card className={cn("p-4", className)}>
    {(title || actions) && (
      <div className="flex items-center justify-between mb-3">
        <div>
          {title && <h3 className="font-semibold text-sm">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </Card>
);

/** Right-hand alert/list panel used on dashboards (incidents, alerts). */
export const SidePanel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="p-4">
    <h3 className="font-semibold text-sm mb-3">{title}</h3>
    <div className="space-y-2">{children}</div>
  </Card>
);
