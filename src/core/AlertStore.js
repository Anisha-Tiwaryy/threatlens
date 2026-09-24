import { EventEmitter } from "./EventEmitter";
import { Alert } from "./Alert";
import { CommandHistory } from "./CommandHistory";

const ACTION_LABELS = {
  acknowledged: "Acknowledge",
  resolved: "Resolve",
  false_positive: "Mark false positive",
  open: "Reopen",
};

// Base class for triage commands. Subclasses only describe the patch.
class TriageCommand {
  constructor(store, ids, patch, label) {
    this.store = store;
    this.ids = ids;
    this.patch = patch;
    this.label = label;
    this.previous = null;
  }

  execute() {
    // Capture previous values lazily so redo re-applies the exact same change.
    if (!this.previous) this.previous = this.ids.map((id) => this.store.get(id));
    this.store._replace(this.ids.map((id) => this.store.get(id).with(this.patch)));
  }

  undo() {
    this.store._replace(this.previous);
  }
}

class StatusCommand extends TriageCommand {
  constructor(store, ids, status) {
    const n = ids.length;
    super(store, ids, { status }, `${ACTION_LABELS[status]} ${n} alert${n === 1 ? "" : "s"}`);
  }
}

class AssignCommand extends TriageCommand {
  constructor(store, ids, assignee) {
    super(store, ids, { assignee }, `Assign ${ids.length} to ${assignee || "nobody"}`);
  }
}

// Central store. Exposes subscribe/getSnapshot so React can read it with useSyncExternalStore.
export class AlertStore extends EventEmitter {
  constructor() {
    super();
    this._byId = new Map();
    this._snapshot = [];
    this.history = new CommandHistory();
    this.subscribe = this.subscribe.bind(this);
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  load(rawAlerts) {
    this._byId = new Map(rawAlerts.map((a) => [a.id, Alert.fromJSON(a)]));
    this._commit();
  }

  get(id) {
    return this._byId.get(id);
  }

  setStatus(ids, status) {
    if (!ids.length) return;
    this.history.execute(new StatusCommand(this, ids, status));
  }

  assign(ids, assignee) {
    if (!ids.length) return;
    this.history.execute(new AssignCommand(this, ids, assignee));
  }

  undo() {
    return this.history.undo();
  }

  redo() {
    return this.history.redo();
  }

  subscribe(listener) {
    return this.on("change", listener);
  }

  getSnapshot() {
    return this._snapshot;
  }

  // Internal: swap in new Alert instances and publish a fresh snapshot array.
  _replace(alerts) {
    alerts.forEach((a) => this._byId.set(a.id, a));
    this._commit();
  }

  _commit() {
    this._snapshot = Array.from(this._byId.values());
    this.emit("change");
  }
}
