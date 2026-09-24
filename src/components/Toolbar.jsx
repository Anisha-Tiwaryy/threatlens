import styles from "./Toolbar.module.scss";

export function BulkActions({ count, onAction, onClear }) {
  if (!count) return <span className={styles.label}>Select alerts to triage in bulk</span>;
  return (
    <>
      <span className={styles.label}>{count} selected</span>
      <button type="button" className="button button--small" onClick={() => onAction("acknowledged")}>Acknowledge</button>
      <button type="button" className="button button--small" onClick={() => onAction("resolved")}>Resolve</button>
      <button type="button" className="button button--small" onClick={() => onAction("false_positive")}>False positive</button>
      <button type="button" className="button button--small" onClick={onClear}>Clear</button>
    </>
  );
}

export function UndoRedo({ canUndo, canRedo, undoLabel, redoLabel, onUndo, onRedo }) {
  return (
    <>
      <button type="button" className="button button--small" disabled={!canUndo} onClick={onUndo} title={undoLabel ? `Undo: ${undoLabel} (Ctrl+Z)` : "Nothing to undo"}>
        Undo
      </button>
      <button type="button" className="button button--small" disabled={!canRedo} onClick={onRedo} title={redoLabel ? `Redo: ${redoLabel} (Ctrl+Shift+Z)` : "Nothing to redo"}>
        Redo
      </button>
    </>
  );
}

export function Toolbar({ children }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function Spacer() {
  return <span className={styles.spacer} />;
}

export function Pagination({ page, pageCount, onPageChange }) {
  return (
    <nav className={styles.pager} aria-label="Pagination">
      <button type="button" className="button button--small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span>Page {page} of {pageCount}</span>
      <button type="button" className="button button--small" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
    </nav>
  );
}
