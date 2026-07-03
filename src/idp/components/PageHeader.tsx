import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** buttons / controls rendered on the right */
  actions?: React.ReactNode;
  /** optional back link (path relative to /idp or absolute) */
  backTo?: string;
  backLabel?: string;
}

export const PageHeader = ({ title, description, actions, backTo, backLabel }: PageHeaderProps) => (
  <div className="mb-6">
    {backTo && (
      <Link
        to={backTo}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel ?? "Back"}
      </Link>
    )}
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
