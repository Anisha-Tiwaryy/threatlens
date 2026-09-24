import { EventEmitter } from "./EventEmitter";

// Command pattern based undo/redo. Each command is { label, execute(), undo() }.
export class CommandHistory extends EventEmitter {
  constructor({ limit = 50 } = {}) {
    super();
    this.limit = limit;
    this.undoStack = [];
    this.redoStack = [];
    this.snapshot = this.state; // stable object for useSyncExternalStore
  }

  _publish() {
    this.snapshot = this.state;
    this.emit("change", this.snapshot);
  }

  execute(command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.limit) this.undoStack.shift();
    this.redoStack = []; // a new action invalidates the redo branch
    this._publish();
  }

  undo() {
    const command = this.undoStack.pop();
    if (!command) return null;
    command.undo();
    this.redoStack.push(command);
    this._publish();
    return command;
  }

  redo() {
    const command = this.redoStack.pop();
    if (!command) return null;
    command.execute();
    this.undoStack.push(command);
    this._publish();
    return command;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  get state() {
    return {
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      undoLabel: this.canUndo ? this.undoStack[this.undoStack.length - 1].label : null,
      redoLabel: this.canRedo ? this.redoStack[this.redoStack.length - 1].label : null,
    };
  }
}
