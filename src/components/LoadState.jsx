import styles from "./AlertTable.module.scss";

export function LoadState({ status, retryInfo, error, onRetry }) {
  if (status === "loading") {
    return (
      <div className={`${styles.wrap} ${styles.empty}`} role="status">
        Loading threat feed{retryInfo ? ` (attempt ${retryInfo.attempt + 1}, retrying after a 503 in ${retryInfo.delay} ms)` : "..."}
      </div>
    );
  }
  return (
    <div className={`${styles.wrap} ${styles.empty}`} role="alert">
      <p>Could not load the threat feed: {error?.message}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>Try again</button>
    </div>
  );
}
