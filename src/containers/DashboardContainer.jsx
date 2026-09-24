import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AlertStore } from "../core/AlertStore";
import { computeStats, filterAlerts, paginate, sortAlerts } from "../core/query";
import { fetchAlerts } from "../api/alertsApi";
import { useAlertStore, useHistoryState } from "../hooks/useAlertStore";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useUndoRedoShortcuts } from "../hooks/useKeyboardShortcuts";
import { useWindowWidth } from "../hooks/useWindowWidth";
import { StatsBar } from "../components/StatsBar";
import { FilterBar } from "../components/FilterBar";
import { AlertTable } from "../components/AlertTable";
import { LoadState } from "../components/LoadState";
import { BulkActions, Pagination, Spacer, Toolbar, UndoRedo } from "../components/Toolbar";

const AlertDetailContainer = lazy(() => import(/* webpackChunkName: "alert-detail" */ "./AlertDetailContainer"));
const PAGE_SIZE = 15;

// Container (stateful): owns data loading, filter state, selection and pagination.
// Every child below is presentational and receives plain props and callbacks.
export function DashboardContainer({ store: injectedStore, loader = fetchAlerts, flaky = false }) {
  const [store] = useState(() => injectedStore || new AlertStore());
  const alerts = useAlertStore(store);
  const history = useHistoryState(store.history);

  const [load, setLoad] = useState({ status: "loading", retryInfo: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [severities, setSeverities] = useState([]);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("active");
  const [sort, setSort] = useState("risk");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [activeId, setActiveId] = useState(null);

  const windowWidth = useWindowWidth();

  useEffect(() => {
    const controller = new AbortController();
    setLoad({ status: "loading", retryInfo: null, error: null });
    loader({ flaky, signal: controller.signal, onRetry: (info) => setLoad((l) => ({ ...l, retryInfo: info })) })
      .then((data) => {
        store.load(data);
        setLoad({ status: "ready", retryInfo: null, error: null });
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoad({ status: "error", retryInfo: null, error });
      });
    return () => controller.abort();
  }, [store, loader, flaky, reloadKey]);

  // Reset to page 1 whenever the result set changes shape.
  useEffect(() => setPage(1), [debouncedQuery, severities, category, status, sort]);

  const categories = useMemo(() => [...new Set(alerts.map((a) => a.category))].sort(), [alerts]);
  const filtered = useMemo(
    () => sortAlerts(filterAlerts(alerts, { query: debouncedQuery, severities, category, status }), sort),
    [alerts, debouncedQuery, severities, category, status, sort]
  );
  const stats = useMemo(() => computeStats(alerts), [alerts]);
  const { rows, page: safePage, pageCount } = paginate(filtered, page, PAGE_SIZE);

  const toggleSeverity = useCallback(
    (s) => setSeverities((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])),
    []
  );
  const toggleRow = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const toggleAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (allSelected ? next.delete(r.id) : next.add(r.id)));
      return next;
    });

  const bulkAction = (newStatus) => {
    store.setStatus([...selectedIds], newStatus);
    setSelectedIds(new Set());
  };
  const undo = useCallback(() => store.undo(), [store]);
  const redo = useCallback(() => store.redo(), [store]);
  useUndoRedoShortcuts({ onUndo: undo, onRedo: redo });

  // Hide Category/Source columns on narrow screens or when the detail panel takes space.
  const compact = windowWidth < 1100 || (activeId !== null && windowWidth < 1600);

  if (load.status !== "ready") {
    return <LoadState status={load.status} retryInfo={load.retryInfo} error={load.error} onRetry={() => setReloadKey((k) => k + 1)} />;
  }

  return (
    <>
      <StatsBar stats={stats} />
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        severities={severities}
        onToggleSeverity={toggleSeverity}
        category={category}
        categories={categories}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
      />
      <Toolbar>
        <BulkActions count={selectedIds.size} onAction={bulkAction} onClear={() => setSelectedIds(new Set())} />
        <Spacer />
        <UndoRedo {...history} onUndo={undo} onRedo={redo} />
      </Toolbar>
      <div className={`app__body ${activeId ? "" : "app__body--single"}`}>
        <div>
          <AlertTable
            rows={rows}
            selectedIds={selectedIds}
            activeId={activeId}
            compact={compact}
            allSelected={allSelected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onOpen={setActiveId}
          />
          <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </div>
        {activeId && (
          <Suspense fallback={<div className="app__subtitle">Loading details...</div>}>
            <AlertDetailContainer store={store} alertId={activeId} onClose={() => setActiveId(null)} />
          </Suspense>
        )}
      </div>
    </>
  );
}
