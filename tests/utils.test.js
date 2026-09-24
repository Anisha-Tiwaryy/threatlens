import { debounce } from "../src/utils/debounce";
import { throttle } from "../src/utils/throttle";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("debounce", () => {
  test("fires once with the latest args after the quiet period", () => {
    const fn = jest.fn();
    const d = debounce(fn, 200);
    d("a"); d("ab"); d("abc");
    jest.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("abc");
  });

  test("cancel drops the pending call and flush runs it now", () => {
    const fn = jest.fn();
    const d = debounce(fn, 200);
    d(1); d.cancel();
    jest.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    d(2); d.flush();
    expect(fn).toHaveBeenCalledWith(2);
  });

  test("preserves `this`", () => {
    const obj = { v: 7, read: null, got: null };
    obj.read = debounce(function () { obj.got = this.v; }, 10);
    obj.read();
    jest.advanceTimersByTime(10);
    expect(obj.got).toBe(7);
  });
});

describe("throttle", () => {
  test("runs immediately, then at most once per window, with a trailing call", () => {
    const fn = jest.fn();
    const t = throttle(fn, 100);
    t(1); t(2); t(3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3); // trailing call keeps the latest value
  });
});
