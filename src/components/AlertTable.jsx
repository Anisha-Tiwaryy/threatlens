import { memo } from "react";
import { SeverityBadge, StatusPill } from "./SeverityBadge";
import styles from "./AlertTable.module.scss";

// memo: a row re-renders only when its own Alert instance or selection flag changes.
const AlertRow = memo(function AlertRow({ alert, selected, active, compact, onToggle, onOpen }) {
  return (
    <tr className={`${styles.row} ${active ? styles.active : ""}`} onClick={() => onOpen(alert.id)} aria-selected={active}>
      <td onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" aria-label={`Select ${alert.id}`} checked={selected} onChange={() => onToggle(alert.id)} />
      </td>
      <td className={styles.mono}>{alert.id}</td>
      <td><SeverityBadge severity={alert.severity} /></td>
      <td className={styles.title}>{alert.title}</td>
      {!compact && <td>{alert.category}</td>}
      {!compact && <td className={styles.mono}>{alert.source}</td>}
      <td className={styles.risk}>{alert.riskScore}</td>
      <td><StatusPill status={alert.status} /></td>
    </tr>
  );
});

export function AlertTable({ rows, selectedIds, activeId, compact, allSelected, onToggleRow, onToggleAll, onOpen }) {
  if (!rows.length) {
    return <div className={`${styles.wrap} ${styles.empty}`}>No alerts match these filters.</div>;
  }
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th><input type="checkbox" aria-label="Select all on page" checked={allSelected} onChange={onToggleAll} /></th>
            <th>ID</th>
            <th>Severity</th>
            <th>Alert</th>
            {!compact && <th>Category</th>}
            {!compact && <th>Source</th>}
            <th>Risk</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              selected={selectedIds.has(a.id)}
              active={a.id === activeId}
              compact={compact}
              onToggle={onToggleRow}
              onOpen={onOpen}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
