import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./states";

/** Placeholder screen used while a persona's screens are being built. */
export const ComingSoon = ({ title }: { title: string }) => (
  <div>
    <PageHeader title={title} />
    <EmptyState icon={Hammer} title="Screen under construction" description="This screen is being built." />
  </div>
);

export default ComingSoon;
