import { useSyncExternalStore } from "react";

// Subscribes a component to the AlertStore (tear-free reads in concurrent React).
export function useAlertStore(store) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useHistoryState(history) {
  return useSyncExternalStore(
    (cb) => history.on("change", cb),
    () => history.snapshot
  );
}
