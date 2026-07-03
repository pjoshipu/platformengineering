import { cn } from "@/lib/utils";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "active";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  warning: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
  info: "bg-tech-cyan/15 text-tech-cyan border-tech-cyan/30",
  neutral: "bg-muted text-muted-foreground border-border",
  active: "bg-primary/15 text-primary border-primary/30",
};

/**
 * Maps common status/severity strings used across the IDP to a tone so every
 * screen colours statuses consistently. Unknown values fall back to neutral.
 */
export function toneForStatus(status: string): Tone {
  const s = status.toLowerCase();
  if (/(healthy|synced|success|ready|pass|active in prod|complete|live|no drift|low)/.test(s))
    return "success";
  if (/(degraded|warning|progressing|canary|in canary|needs review|pending|queued|creating|skipped|medium)/.test(s))
    return "warning";
  if (/(fail|failed|error|critical|rolled back|out of sync|blocked|missing|deny|drift|high|p1)/.test(s))
    return "danger";
  if (/(running|deploying|in staging|draft|monitor|p2)/.test(s)) return "info";
  return "neutral";
}

interface StatusBadgeProps {
  /** Raw status string (tone is inferred), or any node when `tone` is set. */
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export const StatusBadge = ({ children, tone, className }: StatusBadgeProps) => {
  const t = tone ?? (typeof children === "string" ? toneForStatus(children) : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[t],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};

export default StatusBadge;
