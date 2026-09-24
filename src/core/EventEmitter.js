// A tiny pub/sub emitter written with a constructor function and prototype methods
// (classic object-oriented JavaScript). ES2015 classes elsewhere in the app extend it,
// which shows that `class extends` works on top of prototype-based constructors.
export function EventEmitter() {
  this._listeners = Object.create(null);
}

EventEmitter.prototype.on = function on(event, handler) {
  (this._listeners[event] || (this._listeners[event] = [])).push(handler);
  return () => this.off(event, handler); // returns an unsubscribe function
};

EventEmitter.prototype.off = function off(event, handler) {
  const list = this._listeners[event];
  if (!list) return;
  this._listeners[event] = list.filter((h) => h !== handler && h._original !== handler);
};

EventEmitter.prototype.once = function once(event, handler) {
  const self = this;
  function wrapper(...args) {
    self.off(event, wrapper);
    handler.apply(self, args);
  }
  wrapper._original = handler;
  return this.on(event, wrapper);
};

EventEmitter.prototype.emit = function emit(event, ...args) {
  // Copy first so handlers that unsubscribe during emit don't skip their neighbours.
  (this._listeners[event] || []).slice().forEach((h) => h.apply(this, args));
};

EventEmitter.prototype.listenerCount = function listenerCount(event) {
  return (this._listeners[event] || []).length;
};
