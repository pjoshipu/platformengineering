import { useState } from "react";
import { Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowViewerPanel } from "./FlowViewerPanel";

/**
 * "See the flow" button — drop into any screen header. The ONLY thing that
 * changes per screen is the `flowId`; the button and panel are identical
 * everywhere (see flowConfigs.ts for the per-flow data).
 */
export const FlowViewerButton = ({ flowId }: { flowId: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-flow-id={flowId}
        onClick={() => setOpen(true)}
        className="border-brand-border text-brand-purple hover:bg-brand-tint hover:text-brand-purple"
      >
        <Workflow className="mr-2 h-4 w-4" />
        See the flow
      </Button>
      <FlowViewerPanel flowId={flowId} open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FlowViewerButton;
