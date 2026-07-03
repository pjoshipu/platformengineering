import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, RowSkeleton } from "./states";

export interface Column<T> {
  /** unique key; also used as the sort accessor into the row when `accessor` is absent */
  key: string;
  header: string;
  /** custom cell renderer; defaults to String(row[key]) */
  render?: (row: T) => React.ReactNode;
  /** value used for sorting; defaults to (row as any)[key] */
  accessor?: (row: T) => string | number;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** filters / search rendered above the table */
  toolbar?: React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** id of the column to sort by initially */
  defaultSort?: { key: string; dir: "asc" | "desc" };
}

const alignClass = (align?: string) =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  toolbar,
  loading,
  emptyTitle = "Nothing to show",
  emptyDescription,
  defaultSort,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | undefined>(
    defaultSort
  );

  const accessorFor = (col: Column<T>) =>
    col.accessor ?? ((row: T) => (row as Record<string, unknown>)[col.key] as string | number);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const acc = accessorFor(col);
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  return (
    <div className="space-y-3">
      {toolbar}
      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={cn(alignClass(col.align), col.className)}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      {sort?.key === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <RowSkeleton />
                </TableCell>
              </TableRow>
            ) : sortedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              sortedRows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn(alignClass(col.align), col.className)}>
                      {col.render ? col.render(row) : String(accessorFor(col)(row) ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DataTable;
