import AlertDetail from "../components/AlertDetail";

// Container: looks the alert up in the store and turns UI events into store commands.
// Loaded with React.lazy, so this code ships in its own chunk only when a row is opened.
export default function AlertDetailContainer({ store, alertId, onClose }) {
  const alert = store.get(alertId);
  if (!alert) return null;
  return (
    <AlertDetail
      alert={alert}
      onStatus={(status) => store.setStatus([alertId], status)}
      onAssign={(assignee) => store.assign([alertId], assignee)}
      onClose={onClose}
    />
  );
}
