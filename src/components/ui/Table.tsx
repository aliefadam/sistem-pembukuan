import { ReactNode, useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import { EmptyState, IconButton, Skeleton } from "./Basic";
import { SearchBox } from "./Basic";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  accessor: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  searchPlaceholder?: string;
  filters?: ReactNode;
  onRefresh?: () => void;
  renderCardTitle: (row: T) => ReactNode;
  renderCardSubtitle?: (row: T) => ReactNode;
  renderCardBadge?: (row: T) => ReactNode;
  actions?: (row: T) => ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  hideSearch?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  searchPlaceholder,
  filters,
  onRefresh,
  renderCardTitle,
  renderCardSubtitle,
  renderCardBadge,
  actions,
  pageSize = 8,
  emptyTitle,
  emptyDescription,
  hideSearch,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    let rows = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((row) => columns.some((c) => String(c.accessor(row)).toLowerCase().includes(q)));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const av = col.accessor(a);
          const bv = col.accessor(b);
          if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
          return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
      }
    }
    return rows;
  }, [data, search, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleRefresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
    onRefresh();
    setRefreshing(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {!hideSearch && <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={searchPlaceholder} />}
          {filters}
        </div>
        {onRefresh && (
          <IconButton
            icon={cn("fi fi-rr-refresh", refreshing && "animate-spin-smooth")}
            onClick={handleRefresh}
            label="Refresh"
          />
        )}
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && toggleSort(col.key)}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
                      col.sortable && "cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200",
                      col.className,
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <i
                          className={cn(
                            "fi fi-rr-angle-small-down text-[10px] transition-transform duration-200",
                            sortKey === col.key && sortDir === "desc" && "rotate-180",
                            sortKey !== col.key && "opacity-30",
                          )}
                        />
                      )}
                    </span>
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/60">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3.5">
                        <Skeleton className="ml-auto h-4 w-16" />
                      </td>
                    )}
                  </tr>
                ))}
              {!loading &&
                pageData.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    className="border-b border-slate-50 transition-colors duration-150 last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("whitespace-nowrap px-4 py-3.5 text-slate-700 dark:text-slate-200", col.className)}>
                        {col.render ? col.render(row) : col.accessor(row)}
                      </td>
                    ))}
                    {actions && <td className="px-4 py-3.5 text-right"><div className="flex justify-end gap-1">{actions(row)}</div></td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && pageData.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      {/* Mobile Card List */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-4 h-16 w-full" />
            </div>
          ))}
        {!loading &&
          pageData.map((row) => (
            <div key={keyExtractor(row)} className="animate-fade-in-up rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{renderCardTitle(row)}</p>
                  {renderCardSubtitle && <p className="truncate text-xs text-slate-400">{renderCardSubtitle(row)}</p>}
                </div>
                {renderCardBadge?.(row)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-dashed border-slate-100 pt-3 dark:border-slate-800">
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((col) => (
                    <div key={col.key} className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-400">{col.header}</p>
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                        {col.render ? col.render(row) : col.accessor(row)}
                      </p>
                    </div>
                  ))}
              </div>
              {actions && <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">{actions(row)}</div>}
            </div>
          ))}
        {!loading && pageData.length === 0 && (
          <div className="col-span-full">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={pageSize} />
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  total?: number;
  pageSize?: number;
}) {
  const pages = useMemo(() => {
    const arr: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) arr.push(i);
      else if (arr[arr.length - 1] !== "...") arr.push("...");
    }
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      {total !== undefined && pageSize !== undefined && (
        <p className="text-xs text-slate-400">
          Menampilkan {Math.min((page - 1) * pageSize + 1, total)}-{Math.min(page * pageSize, total)} dari {total} data
        </p>
      )}
      <div className="flex items-center gap-1">
        <IconButton icon="fi fi-rr-angle-small-left" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)} label="Sebelumnya" />
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={i} className="px-1 text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={i}
              onClick={() => onChange(p as number)}
              className={cn(
                "h-8 w-8 rounded-lg text-sm font-semibold transition-colors duration-150",
                p === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {p}
            </button>
          ),
        )}
        <IconButton icon="fi fi-rr-angle-small-right" size="sm" disabled={page === totalPages} onClick={() => onChange(page + 1)} label="Berikutnya" />
      </div>
    </div>
  );
}
