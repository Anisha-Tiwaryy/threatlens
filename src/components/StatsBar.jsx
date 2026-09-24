import styles from "./StatsBar.module.scss";

export function StatsBar({ stats }) {
  const tiles = [
    { label: "Open alerts", value: stats.open },
    { label: "Critical and open", value: stats.criticalOpen, danger: stats.criticalOpen > 0 },
    { label: "Resolved", value: stats.resolved },
    { label: "False positives", value: stats.falsePositives },
  ];
  return (
    <section className={styles.grid} aria-label="Alert summary">
      {tiles.map((t) => (
        <div key={t.label} className={styles.tile}>
          <div className={styles.label}>{t.label}</div>
          <div className={`${styles.value} ${t.danger ? styles.danger : ""}`} data-testid={`stat-${t.label}`}>
            {t.value}
          </div>
        </div>
      ))}
    </section>
  );
}
