import { useEffect, useState } from "react";
import { throttle } from "../utils/throttle";

// Tracks viewport width with a throttled resize listener (at most once per 150 ms).
export function useWindowWidth(wait = 150) {
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = throttle(() => setWidth(window.innerWidth), wait);
    window.addEventListener("resize", onResize);
    return () => {
      onResize.cancel();
      window.removeEventListener("resize", onResize);
    };
  }, [wait]);
  return width;
}
