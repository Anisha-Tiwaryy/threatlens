import { SEVERITY_ORDER } from "../core/Alert";
import styles from "./FilterBar.module.scss";

export function FilterBar({
  query, onQueryChange, severities, onToggleSeverity, category, categories, onCategoryChange,
  status, onStatusChange, sort, onSortChange, resultCount,
}) {
  return (
    <div className={styles.bar} role="search">
      <label className="visually-hidden" htmlFor="alert-search">Search alerts</label>
      <input
        id="alert-search"
        className={styles.search}
        type="search"
        placeholder="Search by ID, asset, title or source"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <div className={styles.chips} aria-label="Severity filter">
        {SEVERITY_ORDER.map((s) => (
          <button key={s} type="button" className={styles.chip} aria-pressed={severities.includes(s)} onClick={() => onToggleSeverity(s)}>
            {s}
          </button>
        ))}
      </div>
      <select aria-label="Category" className={styles.select} value={category} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="all">All categories</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select aria-label="Status" className={styles.select} value={status} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="active">Open + acknowledged</option>
        <option value="all">All statuses</option>
        <option value="open">Open</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="resolved">Resolved</option>
        <option value="false_positive">False positive</option>
      </select>
      <select aria-label="Sort" className={styles.select} value={sort} onChange={(e) => onSortChange(e.target.value)}>
        <option value="risk">Highest risk</option>
        <option value="newest">Newest</option>
        <option value="severity">Severity</option>
      </select>
      <span className={styles.count} aria-live="polite">{resultCount} matching</span>
    </div>
  );
}
