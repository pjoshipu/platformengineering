import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** widen for detail-heavy drawers */
  wide?: boolean;
  side?: "right" | "left";
}

/**
 * Standard right-side detail drawer used across the IDP (row detail, diff view,
 * propose-change panels). Wraps shadcn Sheet with a scrollable body.
 */
export const SideDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  wide,
  side = "right",
}: SideDrawerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side={side}
      className={cn(
        "w-full overflow-y-auto",
        wide ? "sm:max-w-2xl" : "sm:max-w-lg"
      )}
    >
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        {description && <SheetDescription>{description}</SheetDescription>}
      </SheetHeader>
      <div className="mt-4 space-y-4">{children}</div>
    </SheetContent>
  </Sheet>
);

export default SideDrawer;
