// Alert model: immutable value object with derived getters.
export const SEVERITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });
export const SEVERITY_ORDER = Object.freeze(["critical", "high", "medium", "low"]);
export const STATUSES = Object.freeze(["open", "acknowledged", "resolved", "false_positive"]);

export class Alert {
  constructor(data) {
    Object.assign(this, data);
    Object.freeze(this);
  }

  static fromJSON(json) {
    return new Alert(json);
  }

  // Risk score 0-100: severity weight scaled by detection confidence.
  get riskScore() {
    return Math.round((SEVERITY_WEIGHT[this.severity] / 4) * this.confidence * 100);
  }

  get isOpen() {
    return this.status === "open" || this.status === "acknowledged";
  }

  // Returns a new Alert; the original is never mutated (needed for undo/redo).
  with(patch) {
    return new Alert({ ...this, ...patch });
  }
}
