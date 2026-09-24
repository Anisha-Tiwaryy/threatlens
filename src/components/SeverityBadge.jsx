import styles from "./SeverityBadge.module.scss";

// Presentational: renders from props only, no state, no data access.
export function SeverityBadge({ severity }) {
  return <span className={`${styles.badge} ${styles[severity]}`}>{severity}</span>;
}

const STATUS_TEXT = { open: "Open", acknowledged: "Acknowledged", resolved: "Resolved", false_positive: "False positive" };

export function StatusPill({ status }) {
  return <span className={styles[`status-${status}`]}>{STATUS_TEXT[status]}</span>;
}
