import { useEffect, useMemo, useState } from "react";
import { debounce } from "../utils/debounce";

// Returns `value` only after it has stopped changing for `delay` ms.
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const update = useMemo(() => debounce(setDebounced, delay), [delay]);
  useEffect(() => {
    update(value);
  }, [value, update]);
  useEffect(() => () => update.cancel(), [update]);
  return debounced;
}
