// Throttle: run fn at most once per `wait` ms, with a trailing call so the last event is never lost.
export function throttle(fn, wait = 100) {
  let last = 0;
  let timer = null;
  let pendingArgs = null;

  function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      last = now;
      fn.apply(this, args);
    } else {
      pendingArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, pendingArgs);
        }, remaining);
      }
    }
  }

  throttled.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  return throttled;
}
