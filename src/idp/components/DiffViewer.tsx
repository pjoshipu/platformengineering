import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Longest-common-subsequence line diff → added/removed/unchanged rows. */
function diffLines(a: string, b: string) {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const n = aLines.length;
  const m = bLines.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        aLines[i] === bLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const rows: { type: "same" | "add" | "remove"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      rows.push({ type: "same", text: aLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "remove", text: aLines[i] });
      i++;
    } else {
      rows.push({ type: "add", text: bLines[j] });
      j++;
    }
  }
  while (i < n) rows.push({ type: "remove", text: aLines[i++] });
  while (j < m) rows.push({ type: "add", text: bLines[j++] });
  return rows;
}

interface DiffViewerProps {
  /** original / current-prod text */
  before: string;
  /** new / candidate text */
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
}

/** Unified line diff — removed lines red, added lines green. */
export const DiffViewer = ({ before, after, beforeLabel, afterLabel }: DiffViewerProps) => {
  const rows = useMemo(() => diffLines(before, after), [before, after]);
  return (
    <div>
      {(beforeLabel || afterLabel) && (
        <div className="flex gap-4 text-xs text-muted-foreground mb-1">
          {beforeLabel && (
            <span className="text-destructive">− {beforeLabel}</span>
          )}
          {afterLabel && (
            <span className="text-green-600 dark:text-green-400">+ {afterLabel}</span>
          )}
        </div>
      )}
      <pre className="rounded-lg border border-border bg-muted/40 p-3 text-xs font-mono overflow-x-auto leading-relaxed">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={cn(
              "px-1",
              row.type === "add" && "bg-green-500/15 text-green-700 dark:text-green-300",
              row.type === "remove" && "bg-destructive/15 text-destructive"
            )}
          >
            <span className="select-none opacity-60 mr-2">
              {row.type === "add" ? "+" : row.type === "remove" ? "−" : " "}
            </span>
            {row.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
};

export default DiffViewer;
