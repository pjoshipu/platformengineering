import { Link } from "react-router-dom";
import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./states";

/** Placeholder screen for routes that aren't fully built yet. Shows the screen
 *  name and a link home — never a 404. */
export const ComingSoon = ({ title }: { title: string }) => (
  <div>
    <PageHeader title={title} />
    <EmptyState
      icon={Hammer}
      title="Screen under construction"
      description={`“${title}” isn’t built out yet — it’s wired into the portal so nothing is a dead end.`}
    />
    <div className="mt-4 text-center">
      <Link to="/" className="text-sm text-brand-purple hover:underline">← Back to home</Link>
    </div>
  </div>
);

export default ComingSoon;
