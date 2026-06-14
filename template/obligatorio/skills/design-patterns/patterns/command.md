# Command Pattern

## Intent

Encapsulate a request as an object, thereby allowing you to parameterize clients with different requests, queue or log requests, and support undoable operations.

## The Problem

You need to:
- Decouple the object that invokes an operation from the object that performs it
- Queue, log, or schedule operations
- Support undo/redo functionality
- Build macro commands (composite operations)

### Before: Tight Coupling

```typescript
class TextEditor {
  private text: string = '';

  // Editor knows about ALL operations and their details
  handleMenuClick(action: string) {
    switch (action) {
      case 'bold':
        this.text = `<b>${this.getSelection()}</b>`;
        break;
      case 'italic':
        this.text = `<i>${this.getSelection()}</i>`;
        break;
      case 'copy':
        clipboard.write(this.getSelection());
        break;
      case 'paste':
        this.text += clipboard.read();
        break;
      // Adding new operations means modifying this class
      // No way to undo
      // No way to queue or replay
    }
  }
}
```

## The Solution

Encapsulate each operation as a command object:

```typescript
// Command interface
interface Command {
  execute(): void;
  undo(): void;
}

// Receiver - the object that knows how to perform the operation
class TextEditor {
  private text: string = '';
  private cursorPosition: number = 0;

  getText(): string { return this.text; }
  getSelection(): { start: number; end: number; text: string } {
    // Return selected text range
    return { start: 0, end: 5, text: this.text.substring(0, 5) };
  }
  insertAt(position: number, text: string): void {
    this.text = this.text.slice(0, position) + text + this.text.slice(position);
  }
  deleteRange(start: number, end: number): string {
    const deleted = this.text.substring(start, end);
    this.text = this.text.slice(0, start) + this.text.slice(end);
    return deleted;
  }
  setCursor(position: number): void {
    this.cursorPosition = position;
  }
}

// Concrete Commands
class InsertTextCommand implements Command {
  private previousText: string = '';

  constructor(
    private editor: TextEditor,
    private text: string,
    private position: number
  ) {}

  execute(): void {
    this.previousText = this.editor.getText();
    this.editor.insertAt(this.position, this.text);
  }

  undo(): void {
    // Restore previous state
    const currentText = this.editor.getText();
    this.editor.deleteRange(0, currentText.length);
    this.editor.insertAt(0, this.previousText);
  }
}

class DeleteTextCommand implements Command {
  private deletedText: string = '';
  private deletedFrom: number = 0;

  constructor(
    private editor: TextEditor,
    private start: number,
    private end: number
  ) {}

  execute(): void {
    this.deletedFrom = this.start;
    this.deletedText = this.editor.deleteRange(this.start, this.end);
  }

  undo(): void {
    this.editor.insertAt(this.deletedFrom, this.deletedText);
  }
}

class BoldCommand implements Command {
  private selection: { start: number; end: number; text: string } | null = null;

  constructor(private editor: TextEditor) {}

  execute(): void {
    this.selection = this.editor.getSelection();
    const { start, end, text } = this.selection;
    this.editor.deleteRange(start, end);
    this.editor.insertAt(start, `<b>${text}</b>`);
  }

  undo(): void {
    if (!this.selection) return;
    const { start, text } = this.selection;
    // Remove the bold tags
    this.editor.deleteRange(start, start + text.length + 7); // <b></b> = 7 chars
    this.editor.insertAt(start, text);
  }
}

// Invoker - manages command execution and history
class CommandManager {
  private history: Command[] = [];
  private redoStack: Command[] = [];

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
    this.redoStack = []; // Clear redo stack on new command
  }

  undo(): void {
    const command = this.history.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.history.push(command);
    }
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

// Usage
const editor = new TextEditor();
const commandManager = new CommandManager();

// Execute commands
commandManager.execute(new InsertTextCommand(editor, 'Hello World', 0));
console.log(editor.getText()); // "Hello World"

commandManager.execute(new BoldCommand(editor));
console.log(editor.getText()); // "<b>Hello</b> World" (assuming first 5 chars selected)

// Undo
commandManager.undo();
console.log(editor.getText()); // "Hello World"

commandManager.undo();
console.log(editor.getText()); // ""

// Redo
commandManager.redo();
console.log(editor.getText()); // "Hello World"
```

## Structure

```
┌───────────────┐       ┌─────────────────┐
│    Client     │──────▶│     Invoker     │
└───────────────┘       │                 │
                        │ - commands[]    │
                        │ + execute()     │
                        │ + undo()        │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Command      │
                        │  <<interface>>  │
                        │ + execute()     │
                        │ + undo()        │
                        └────────┬────────┘
                                 △
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────┴────────┐      ┌─────────┴───────┐
           │ ConcreteCommand │      │ ConcreteCommand │
           │                 │      │                 │
           │ - receiver      │      │ - receiver      │
           │ - state         │      │ - state         │
           └────────┬────────┘      └────────┬────────┘
                    │                        │
                    ▼                        ▼
              ┌───────────┐            ┌───────────┐
              │ Receiver  │            │ Receiver  │
              └───────────┘            └───────────┘
```

## JavaScript/TypeScript Implementations

### Functional Commands

```typescript
// Commands as simple objects with functions
interface FunctionalCommand {
  execute: () => void;
  undo: () => void;
  description: string;
}

function createInsertCommand(
  editor: TextEditor,
  text: string,
  position: number
): FunctionalCommand {
  let previousText = '';

  return {
    description: `Insert "${text}" at position ${position}`,
    execute() {
      previousText = editor.getText();
      editor.insertAt(position, text);
    },
    undo() {
      editor.setText(previousText);
    }
  };
}

// Command factory
const CommandFactory = {
  insert: (editor: TextEditor, text: string, pos: number) =>
    createInsertCommand(editor, text, pos),

  delete: (editor: TextEditor, start: number, end: number) => {
    let deleted = '';
    return {
      description: `Delete from ${start} to ${end}`,
      execute() {
        deleted = editor.deleteRange(start, end);
      },
      undo() {
        editor.insertAt(start, deleted);
      }
    };
  },

  replace: (editor: TextEditor, start: number, end: number, newText: string) => {
    let oldText = '';
    return {
      description: `Replace text at ${start}-${end} with "${newText}"`,
      execute() {
        oldText = editor.getText().substring(start, end);
        editor.deleteRange(start, end);
        editor.insertAt(start, newText);
      },
      undo() {
        editor.deleteRange(start, start + newText.length);
        editor.insertAt(start, oldText);
      }
    };
  }
};
```

### Async Commands

```typescript
interface AsyncCommand<T = void> {
  execute(): Promise<T>;
  undo(): Promise<void>;
  canUndo: boolean;
}

class CreateOrderCommand implements AsyncCommand<Order> {
  private createdOrder: Order | null = null;

  constructor(
    private orderService: OrderService,
    private orderData: CreateOrderDTO
  ) {}

  get canUndo() {
    return this.createdOrder !== null && this.createdOrder.status === 'pending';
  }

  async execute(): Promise<Order> {
    this.createdOrder = await this.orderService.create(this.orderData);
    return this.createdOrder;
  }

  async undo(): Promise<void> {
    if (!this.canUndo) {
      throw new Error('Cannot undo: order already processed');
    }
    await this.orderService.cancel(this.createdOrder!.id);
    this.createdOrder = null;
  }
}

class TransferFundsCommand implements AsyncCommand {
  private transferId: string | null = null;

  constructor(
    private bankService: BankService,
    private fromAccount: string,
    private toAccount: string,
    private amount: number
  ) {}

  get canUndo() {
    return this.transferId !== null;
  }

  async execute(): Promise<void> {
    const result = await this.bankService.transfer(
      this.fromAccount,
      this.toAccount,
      this.amount
    );
    this.transferId = result.transferId;
  }

  async undo(): Promise<void> {
    if (!this.transferId) {
      throw new Error('Nothing to undo');
    }
    // Reverse the transfer
    await this.bankService.transfer(
      this.toAccount,
      this.fromAccount,
      this.amount
    );
    this.transferId = null;
  }
}

// Async command manager with transaction support
class AsyncCommandManager {
  private history: AsyncCommand[] = [];

  async execute<T>(command: AsyncCommand<T>): Promise<T> {
    const result = await command.execute();
    this.history.push(command);
    return result;
  }

  async undo(): Promise<void> {
    const command = this.history.pop();
    if (command && command.canUndo) {
      await command.undo();
    }
  }

  // Execute multiple commands as a transaction
  async executeTransaction(commands: AsyncCommand[]): Promise<void> {
    const executed: AsyncCommand[] = [];

    try {
      for (const command of commands) {
        await command.execute();
        executed.push(command);
      }
    } catch (error) {
      // Rollback executed commands in reverse order
      for (const command of executed.reverse()) {
        if (command.canUndo) {
          await command.undo();
        }
      }
      throw error;
    }

    this.history.push(...executed);
  }
}
```

### Macro Commands (Composite)

```typescript
class MacroCommand implements Command {
  private commands: Command[] = [];

  add(command: Command): this {
    this.commands.push(command);
    return this;
  }

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  undo(): void {
    // Undo in reverse order
    for (const command of [...this.commands].reverse()) {
      command.undo();
    }
  }
}

// Usage - record a macro
const formatCodeMacro = new MacroCommand()
  .add(new SelectAllCommand(editor))
  .add(new IndentCommand(editor, 2))
  .add(new TrimWhitespaceCommand(editor))
  .add(new AddSemicolonsCommand(editor));

// Execute the macro
commandManager.execute(formatCodeMacro);

// Undo entire macro with single undo
commandManager.undo();
```

## Real-World Applications

### 1. Redux Actions as Commands

```typescript
// Redux actions are essentially the Command pattern

// Action types
const ADD_TODO = 'ADD_TODO';
const TOGGLE_TODO = 'TOGGLE_TODO';
const DELETE_TODO = 'DELETE_TODO';

// Action creators (command factories)
interface TodoAction {
  type: string;
  payload: any;
}

const addTodo = (text: string): TodoAction => ({
  type: ADD_TODO,
  payload: { id: Date.now(), text, completed: false }
});

const toggleTodo = (id: number): TodoAction => ({
  type: TOGGLE_TODO,
  payload: { id }
});

const deleteTodo = (id: number): TodoAction => ({
  type: DELETE_TODO,
  payload: { id }
});

// Reducer (command executor)
interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
}

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case ADD_TODO:
      return {
        ...state,
        todos: [...state.todos, action.payload]
      };
    case TOGGLE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    case DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload.id)
      };
    default:
      return state;
  }
}

// With undo support using redux-undo pattern
interface UndoableState<T> {
  past: T[];
  present: T;
  future: T[];
}

function undoable<T>(reducer: (state: T, action: any) => T) {
  const initialState: UndoableState<T> = {
    past: [],
    present: reducer(undefined as any, {}),
    future: []
  };

  return function(state = initialState, action: any): UndoableState<T> {
    const { past, present, future } = state;

    switch (action.type) {
      case 'UNDO':
        if (past.length === 0) return state;
        return {
          past: past.slice(0, -1),
          present: past[past.length - 1],
          future: [present, ...future]
        };

      case 'REDO':
        if (future.length === 0) return state;
        return {
          past: [...past, present],
          present: future[0],
          future: future.slice(1)
        };

      default:
        const newPresent = reducer(present, action);
        if (present === newPresent) return state;
        return {
          past: [...past, present],
          present: newPresent,
          future: []
        };
    }
  };
}
```

### 2. Task Queue / Job System

```typescript
interface Job {
  id: string;
  execute(): Promise<void>;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
  retries: number;
  maxRetries: number;
}

class JobQueue {
  private queue: Job[] = [];
  private processing = false;
  private concurrency: number;
  private activeJobs = 0;

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
  }

  enqueue(job: Job): void {
    this.queue.push(job);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.activeJobs >= this.concurrency) return;
    if (this.queue.length === 0) return;

    this.processing = true;
    this.activeJobs++;

    const job = this.queue.shift()!;

    try {
      await job.execute();
      job.onSuccess?.();
    } catch (error) {
      if (job.retries < job.maxRetries) {
        job.retries++;
        this.queue.push(job); // Re-queue for retry
      } else {
        job.onFailure?.(error as Error);
      }
    } finally {
      this.activeJobs--;
      this.processing = false;
      this.processNext();
    }
  }
}

// Job factory
function createEmailJob(to: string, subject: string, body: string): Job {
  return {
    id: `email-${Date.now()}`,
    retries: 0,
    maxRetries: 3,
    async execute() {
      await emailService.send({ to, subject, body });
    },
    onSuccess() {
      console.log(`Email sent to ${to}`);
    },
    onFailure(error) {
      console.error(`Failed to send email to ${to}:`, error);
    }
  };
}

function createImageProcessingJob(imageUrl: string, operations: string[]): Job {
  return {
    id: `image-${Date.now()}`,
    retries: 0,
    maxRetries: 2,
    async execute() {
      const image = await downloadImage(imageUrl);
      for (const op of operations) {
        await applyOperation(image, op);
      }
      await uploadProcessedImage(image);
    }
  };
}

// Usage
const jobQueue = new JobQueue(5); // 5 concurrent jobs

jobQueue.enqueue(createEmailJob('user@example.com', 'Welcome!', 'Hello...'));
jobQueue.enqueue(createImageProcessingJob('http://...', ['resize', 'compress']));
```

### 3. Database Migration Commands

```typescript
interface Migration {
  version: number;
  name: string;
  up(): Promise<void>;
  down(): Promise<void>;
}

class MigrationRunner {
  private migrations: Migration[] = [];
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async getCurrentVersion(): Promise<number> {
    const result = await this.db.query(
      'SELECT version FROM migrations ORDER BY version DESC LIMIT 1'
    );
    return result[0]?.version ?? 0;
  }

  async migrate(): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        console.log(`Running migration: ${migration.name}`);
        await this.db.beginTransaction();
        try {
          await migration.up();
          await this.db.query(
            'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)',
            [migration.version, migration.name, new Date()]
          );
          await this.db.commit();
        } catch (error) {
          await this.db.rollback();
          throw error;
        }
      }
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    const currentVersion = await this.getCurrentVersion();
    const toRollback = this.migrations
      .filter(m => m.version <= currentVersion)
      .slice(-steps)
      .reverse();

    for (const migration of toRollback) {
      console.log(`Rolling back: ${migration.name}`);
      await this.db.beginTransaction();
      try {
        await migration.down();
        await this.db.query('DELETE FROM migrations WHERE version = ?', [migration.version]);
        await this.db.commit();
      } catch (error) {
        await this.db.rollback();
        throw error;
      }
    }
  }
}

// Define migrations as commands
const createUsersTable: Migration = {
  version: 1,
  name: 'create_users_table',
  async up() {
    await db.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  },
  async down() {
    await db.query('DROP TABLE users');
  }
};

const addUserNameColumn: Migration = {
  version: 2,
  name: 'add_user_name_column',
  async up() {
    await db.query('ALTER TABLE users ADD COLUMN name VARCHAR(255)');
  },
  async down() {
    await db.query('ALTER TABLE users DROP COLUMN name');
  }
};

// Usage
const runner = new MigrationRunner(db);
runner.register(createUsersTable);
runner.register(addUserNameColumn);

await runner.migrate();  // Run all pending migrations
await runner.rollback(1); // Undo last migration
```

## When to Use

**Use Command when:**
- You need to parameterize objects with operations
- You need to queue, log, or schedule operations
- You need undo/redo functionality
- You want to structure around high-level operations built on primitive operations

**Don't use Command when:**
- Operations are simple and don't need to be undone
- You don't need to queue or log operations
- The overhead isn't justified

## Related Patterns

- **Memento:** Can store state for undo instead of reverse operation
- **Composite:** MacroCommand is a Composite of Commands
- **Strategy:** Both encapsulate behavior, but Command focuses on requests with undo
- **Chain of Responsibility:** Can pass commands through a chain
