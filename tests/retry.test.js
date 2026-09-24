import { HttpError, fetchWithRetry, withRetry } from "../src/api/withRetry";
import { createMockFetch } from "../src/api/alertsApi";

const noJitter = () => 1;

test("retries retryable errors and resolves on a later attempt", async () => {
  let calls = 0;
  const onRetry = jest.fn();
  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls < 3) throw new HttpError(503);
      return "ok";
    },
    { retries: 3, baseDelay: 1, onRetry, random: noJitter }
  );
  expect(result).toBe("ok");
  expect(calls).toBe(3);
  expect(onRetry).toHaveBeenCalledTimes(2);
});

test("gives up after `retries` extra attempts and rethrows the last error", async () => {
  const task = jest.fn(async () => { throw new HttpError(500); });
  await expect(withRetry(task, { retries: 2, baseDelay: 1, random: noJitter })).rejects.toThrow("HTTP 500");
  expect(task).toHaveBeenCalledTimes(3);
});

test("does not retry client errors (4xx)", async () => {
  const task = jest.fn(async () => { throw new HttpError(404); });
  await expect(withRetry(task, { retries: 5, baseDelay: 1 })).rejects.toThrow("HTTP 404");
  expect(task).toHaveBeenCalledTimes(1);
});

test("backoff delay doubles each attempt", async () => {
  const delays = [];
  await expect(
    withRetry(async () => { throw new TypeError("network"); }, {
      retries: 3, baseDelay: 2, random: noJitter, onRetry: ({ delay }) => delays.push(delay),
    })
  ).rejects.toThrow("network");
  expect(delays).toEqual([2, 4, 8]);
});

test("fetchWithRetry recovers from two 503s via the mock transport", async () => {
  const fetchImpl = createMockFetch({ latency: 1, failFirst: 2 });
  const onRetry = jest.fn();
  const data = await fetchWithRetry("/api/alerts", { fetchImpl, retries: 3, baseDelay: 1, onRetry, random: noJitter });
  expect(onRetry).toHaveBeenCalledTimes(2);
  expect(data).toHaveLength(600);
});

test("abort stops further retries", async () => {
  const controller = new AbortController();
  const task = jest.fn(async () => { throw new HttpError(503); });
  const p = withRetry(task, { retries: 5, baseDelay: 50, signal: controller.signal, random: noJitter });
  setTimeout(() => controller.abort(), 10);
  await expect(p).rejects.toThrow("Aborted");
  expect(task).toHaveBeenCalledTimes(1);
});
