import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface WizardStep {
  title: string;
  content: React.ReactNode;
  /** return false (or an error string) to block advancing */
  validate?: () => boolean | string;
}

interface WizardProps {
  steps: WizardStep[];
  onSubmit: () => void;
  submitLabel?: string;
  submitting?: boolean;
}

/**
 * Generic multi-step wizard with a progress rail. Used by Deploy LLM App,
 * New Service Request, New Training Request, etc. Validation runs per-step
 * before advancing; the final step's button calls onSubmit.
 */
export const Wizard = ({ steps, onSubmit, submitLabel = "Submit", submitting }: WizardProps) => {
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string>();
  const isLast = current === steps.length - 1;

  const next = () => {
    const res = steps[current].validate?.();
    if (res === false) {
      setError("Please complete the required fields before continuing.");
      return;
    }
    if (typeof res === "string") {
      setError(res);
      return;
    }
    setError(undefined);
    if (isLast) onSubmit();
    else setCurrent((c) => c + 1);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      {/* Progress rail */}
      <ol className="space-y-1">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.title}>
              <button
                type="button"
                onClick={() => i <= current && setCurrent(i)}
                disabled={i > current}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active && "bg-primary/10 text-primary font-medium",
                  !active && "hover:bg-muted",
                  i > current && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                    done && "bg-primary border-primary text-primary-foreground",
                    active && "border-primary text-primary",
                    !done && !active && "border-border text-muted-foreground"
                  )}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </span>
                {step.title}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <div className="min-w-0">
        <div className="space-y-4">{steps[current].content}</div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Back
          </Button>
          <Button onClick={next} disabled={submitting}>
            {isLast ? (submitting ? "Submitting…" : submitLabel) : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Wizard;
