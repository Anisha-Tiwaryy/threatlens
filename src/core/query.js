import { SEVERITY_ORDER } from "./Alert";

// Pure functions: easy to test, and memoisable from React with useMemo.
export function filterAlerts(alerts, { query = "", severities = [], category = "all", status = "all" } = {}) {
  const q = query.trim().toLowerCase();
  return alerts.filter((a) => {
    if (severities.length && !severities.includes(a.severity)) return false;
    if (category !== "all" && a.category !== category) return false;
    if (status === "active" && !a.isOpen) return false;
    if (status !== "all" && status !== "active" && a.status !== status) return false;
    if (q && !`${a.id} ${a.title} ${a.asset} ${a.source}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

const COMPARATORS = {
  risk: (a, b) => b.riskScore - a.riskScore,
  newest: (a, b) => (a.detectedAt < b.detectedAt ? 1 : -1),
  severity: (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
};

export function sortAlerts(alerts, sortKey = "risk") {
  return [...alerts].sort(COMPARATORS[sortKey] || COMPARATORS.risk);
}

export function paginate(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return { rows: items.slice(start, start + pageSize), page: safePage, pageCount };
}

export function computeStats(alerts) {
  return alerts.reduce(
    (acc, a) => {
      acc.total += 1;
      if (a.isOpen) acc.open += 1;
      if (a.isOpen && a.severity === "critical") acc.criticalOpen += 1;
      if (a.status === "false_positive") acc.falsePositives += 1;
      if (a.status === "resolved") acc.resolved += 1;
      return acc;
    },
    { total: 0, open: 0, criticalOpen: 0, resolved: 0, falsePositives: 0 }
  );
}
