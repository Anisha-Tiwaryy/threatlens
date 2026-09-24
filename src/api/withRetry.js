// Retry a promise-returning task up to `retries` extra times with exponential backoff + jitter.
// Only errors marked retryable (network failures, 5xx, 429) are retried; 4xx fail fast.
export class HttpError extends Error {
  constructor(status, message) {
    super(message || `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
  }

  get retryable() {
    return this.status >= 500 || this.status === 429;
  }
}

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

export function isRetryable(err) {
  if (err?.name === "AbortError") return false;
  if (err instanceof HttpError) return err.retryable;
  return true; // network-level failure (TypeError from fetch, timeouts)
}

export async function withRetry(task, { retries = 3, baseDelay = 300, maxDelay = 4000, signal, onRetry, random = Math.random } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await task(attempt);
    } catch (err) {
      if (attempt >= retries || !isRetryable(err) || signal?.aborted) throw err;
      const delay = Math.min(maxDelay, baseDelay * 2 ** attempt) * (0.5 + random() / 2);
      attempt += 1;
      onRetry?.({ attempt, delay: Math.round(delay), error: err });
      await sleep(delay, signal);
    }
  }
}

// fetch() wrapper: turns non-2xx responses into HttpError and applies withRetry.
export function fetchWithRetry(url, { fetchImpl = globalThis.fetch, init, ...retryOptions } = {}) {
  return withRetry(async () => {
    const res = await fetchImpl(url, { ...init, signal: retryOptions.signal });
    if (!res.ok) throw new HttpError(res.status);
    return res.json();
  }, retryOptions);
}
