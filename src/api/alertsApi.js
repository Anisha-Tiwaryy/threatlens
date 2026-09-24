import { fetchWithRetry } from "./withRetry";

// In-browser mock transport that behaves like fetch(): latency plus configurable failures.
// `failFirst` forces the first N attempts to fail with a 503 so the retry path is visible in the demo.
export function createMockFetch({ latency = 350, failFirst = 0, failRate = 0, random = Math.random } = {}) {
  let calls = 0;
  return (url, { signal } = {}) =>
    new Promise((resolve, reject) => {
      const n = calls++;
      const t = setTimeout(() => {
        const fail = n < failFirst || random() < failRate;
        resolve({
          ok: !fail,
          status: fail ? 503 : 200,
          // The feed is code-split: its JSON chunk is only downloaded on a successful response.
          json: async () => (fail ? { error: "Service Unavailable" } : (await import(/* webpackChunkName: "alert-feed" */ "../data/alerts.json")).default),
        });
      }, latency);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
}

export function fetchAlerts({ flaky = false, signal, onRetry } = {}) {
  const fetchImpl = createMockFetch({ failFirst: flaky ? 2 : 0 });
  return fetchWithRetry("/api/alerts", { fetchImpl, retries: 3, baseDelay: 400, signal, onRetry });
}
