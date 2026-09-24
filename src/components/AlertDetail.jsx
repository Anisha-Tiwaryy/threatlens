import { SeverityBadge, StatusPill } from "./SeverityBadge";
import styles from "./AlertDetail.module.scss";

const ANALYSTS = ["Unassigned", "Anisha", "SOC Tier 1", "SOC Tier 2"];

export default function AlertDetail({ alert, onStatus, onAssign, onClose }) {
  return (
    <aside className={styles.panel} aria-label={`Details for ${alert.id}`}>
      <div className={styles.head}>
        <div>
          <SeverityBadge severity={alert.severity} /> <StatusPill status={alert.status} />
        </div>
        <button type="button" className={styles.close} aria-label="Close details" onClick={onClose}>x</button>
      </div>
      <h2 className={styles.title}>{alert.title}</h2>
      <dl className={styles.meta}>
        <dt>Alert ID</dt><dd>{alert.id}</dd>
        <dt>Category</dt><dd>{alert.category}</dd>
        <dt>Asset</dt><dd>{alert.asset}</dd>
        <dt>Source</dt><dd>{alert.source}</dd>
        <dt>Confidence</dt><dd>{Math.round(alert.confidence * 100)}%</dd>
        <dt>Risk score</dt><dd>{alert.riskScore} / 100</dd>
        <dt>Detected</dt><dd>{new Date(alert.detectedAt).toLocaleString()}</dd>
        <dt>Assignee</dt>
        <dd>
          <select aria-label="Assignee" value={alert.assignee || "Unassigned"} onChange={(e) => onAssign(e.target.value === "Unassigned" ? null : e.target.value)}>
            {ANALYSTS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </dd>
      </dl>
      <div className={styles.actions}>
        <button type="button" className="button button--small" onClick={() => onStatus("acknowledged")}>Acknowledge</button>
        <button type="button" className="button button--small" onClick={() => onStatus("resolved")}>Resolve</button>
        <button type="button" className="button button--small" onClick={() => onStatus("false_positive")}>False positive</button>
        {alert.status !== "open" && <button type="button" className="button button--small" onClick={() => onStatus("open")}>Reopen</button>}
      </div>
    </aside>
  );
}
