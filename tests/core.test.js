import { EventEmitter } from "../src/core/EventEmitter";
import { Alert } from "../src/core/Alert";
import { AlertStore } from "../src/core/AlertStore";
import { computeStats, filterAlerts, paginate, sortAlerts } from "../src/core/query";
import raw from "../src/data/alerts.json";

describe("EventEmitter (prototype-based)", () => {
  test("on / emit / unsubscribe / once", () => {
    const e = new EventEmitter();
    const a = jest.fn();
    const b = jest.fn();
    const off = e.on("x", a);
    e.once("x", b);
    e.emit("x", 1);
    e.emit("x", 2);
    off();
    e.emit("x", 3);
    expect(a.mock.calls).toEqual([[1], [2]]);
    expect(b).toHaveBeenCalledTimes(1);
    expect(e.listenerCount("x")).toBe(0);
  });

  test("ES2015 class can extend the constructor function", () => {
    class Child extends EventEmitter {}
    const c = new Child();
    expect(c).toBeInstanceOf(EventEmitter);
    expect(typeof c.emit).toBe("function");
  });
});

describe("Alert model", () => {
  const base = { id: "A1", severity: "critical", confidence: 0.5, status: "open" };
  test("risk score scales severity by confidence", () => {
    expect(new Alert(base).riskScore).toBe(50);
    expect(new Alert({ ...base, severity: "low", confidence: 1 }).riskScore).toBe(25);
  });
  test("is immutable; with() returns a new instance", () => {
    const a = new Alert(base);
    const b = a.with({ status: "resolved" });
    expect(a.status).toBe("open");
    expect(b.status).toBe("resolved");
    expect(Object.isFrozen(a)).toBe(true);
  });
});

describe("AlertStore undo/redo", () => {
  let store;
  beforeEach(() => {
    store = new AlertStore();
    store.load(raw.slice(0, 5));
  });

  test("bulk status change, undo and redo restore exact state", () => {
    const ids = [raw[0].id, raw[1].id];
    const before = store.getSnapshot();
    store.setStatus(ids, "resolved");
    expect(store.get(ids[0]).status).toBe("resolved");
    expect(store.history.snapshot.undoLabel).toBe("Resolve 2 alerts");
    store.undo();
    expect(store.get(ids[0]).status).toBe("open");
    expect(store.get(ids[1])).toBe(before.find((a) => a.id === ids[1])); // same instance restored
    store.redo();
    expect(store.get(ids[1]).status).toBe("resolved");
  });

  test("a new action clears the redo stack", () => {
    store.setStatus([raw[0].id], "acknowledged");
    store.undo();
    expect(store.history.canRedo).toBe(true);
    store.assign([raw[0].id], "SOC Tier 1");
    expect(store.history.canRedo).toBe(false);
  });

  test("snapshot identity changes only when data changes", () => {
    const s1 = store.getSnapshot();
    expect(store.getSnapshot()).toBe(s1);
    store.setStatus([raw[2].id], "false_positive");
    expect(store.getSnapshot()).not.toBe(s1);
  });

  test("history is capped at its limit", () => {
    store.history.limit = 3;
    for (let i = 0; i < 5; i++) store.setStatus([raw[0].id], i % 2 ? "open" : "resolved");
    expect(store.history.undoStack).toHaveLength(3);
  });
});

describe("query helpers", () => {
  const alerts = raw.map(Alert.fromJSON);
  test("filters by severity, category, status and text", () => {
    const out = filterAlerts(alerts, { severities: ["critical"], category: "Phishing Domain", query: "northwind" });
    expect(out.length).toBeGreaterThan(0);
    out.forEach((a) => {
      expect(a.severity).toBe("critical");
      expect(a.category).toBe("Phishing Domain");
      expect(`${a.title} ${a.asset}`.toLowerCase()).toContain("northwind");
    });
  });
  test("sorts by risk descending without mutating input", () => {
    const copy = [...alerts];
    const sorted = sortAlerts(alerts, "risk");
    for (let i = 1; i < sorted.length; i++) expect(sorted[i - 1].riskScore).toBeGreaterThanOrEqual(sorted[i].riskScore);
    expect(alerts).toEqual(copy);
  });
  test("paginate clamps out-of-range pages", () => {
    expect(paginate(alerts, 999, 15).page).toBe(40);
    expect(paginate([], 3, 15)).toEqual({ rows: [], page: 1, pageCount: 1 });
  });
  test("stats count open and critical-open alerts", () => {
    const s = computeStats(alerts);
    expect(s.total).toBe(600);
    expect(s.open).toBe(600);
    expect(s.criticalOpen).toBe(alerts.filter((a) => a.severity === "critical").length);
  });
});
