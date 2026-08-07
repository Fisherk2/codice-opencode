# Observer Pattern

## Intent

Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

## The Problem

You need multiple objects to react when something changes, but you don't want:
- The changing object to know about all its dependents
- Tight coupling between the subject and observers
- To poll for changes constantly

### Before: Tight Coupling

```typescript
class StockTicker {
  private price: number = 0;
  private mobileApp: MobileApp;
  private webDashboard: WebDashboard;
  private tradingBot: TradingBot;
  private alertService: AlertService;

  constructor(
    mobileApp: MobileApp,
    webDashboard: WebDashboard,
    tradingBot: TradingBot,
    alertService: AlertService
  ) {
    // StockTicker knows about ALL consumers
    this.mobileApp = mobileApp;
    this.webDashboard = webDashboard;
    this.tradingBot = tradingBot;
    this.alertService = alertService;
  }

  setPrice(newPrice: number) {
    this.price = newPrice;
    // Must update each one manually
    this.mobileApp.updatePrice(this.price);
    this.webDashboard.refresh(this.price);
    this.tradingBot.onPriceChange(this.price);
    this.alertService.checkThresholds(this.price);
    // Adding new consumer = modify this class
  }
}
```

**Problems:**
- StockTicker coupled to every consumer
- Adding analytics service means editing StockTicker
- Can't add/remove listeners at runtime
- Hard to test StockTicker in isolation

## The Solution

Let observers register themselves. Subject notifies all registered observers without knowing their concrete types.

```typescript
// Observer interface
interface Observer<T> {
  update(data: T): void;
}

// Subject interface
interface Subject<T> {
  subscribe(observer: Observer<T>): void;
  unsubscribe(observer: Observer<T>): void;
  notify(data: T): void;
}

// Concrete Subject
class StockTicker implements Subject<StockPrice> {
  private observers: Set<Observer<StockPrice>> = new Set();
  private currentPrice: StockPrice = { symbol: '', price: 0, timestamp: new Date() };

  subscribe(observer: Observer<StockPrice>): void {
    this.observers.add(observer);
  }

  unsubscribe(observer: Observer<StockPrice>): void {
    this.observers.delete(observer);
  }

  notify(data: StockPrice): void {
    this.observers.forEach(observer => observer.update(data));
  }

  setPrice(symbol: string, price: number): void {
    this.currentPrice = { symbol, price, timestamp: new Date() };
    this.notify(this.currentPrice);
  }
}

// Concrete Observers
class MobileAppNotifier implements Observer<StockPrice> {
  update(data: StockPrice): void {
    console.log(`📱 Push notification: ${data.symbol} is now $${data.price}`);
  }
}

class TradingBot implements Observer<StockPrice> {
  private threshold: number;

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  update(data: StockPrice): void {
    if (data.price < this.threshold) {
      console.log(`🤖 Auto-buying ${data.symbol} at $${data.price}`);
    }
  }
}

class PriceLogger implements Observer<StockPrice> {
  private history: StockPrice[] = [];

  update(data: StockPrice): void {
    this.history.push(data);
    console.log(`📊 Logged: ${data.symbol} @ $${data.price}`);
  }

  getHistory(): StockPrice[] {
    return [...this.history];
  }
}

// Usage
const ticker = new StockTicker();

const mobileNotifier = new MobileAppNotifier();
const tradingBot = new TradingBot(150);
const logger = new PriceLogger();

// Subscribe observers
ticker.subscribe(mobileNotifier);
ticker.subscribe(tradingBot);
ticker.subscribe(logger);

// Price change notifies all observers
ticker.setPrice('AAPL', 145);
// 📱 Push notification: AAPL is now $145
// 🤖 Auto-buying AAPL at $145
// 📊 Logged: AAPL @ $145

// Unsubscribe at runtime
ticker.unsubscribe(mobileNotifier);

ticker.setPrice('AAPL', 155);
// 📊 Logged: AAPL @ $155
// (no mobile notification, no auto-buy since above threshold)
```

## Structure

```
┌──────────────────┐         ┌────────────────────┐
│     Subject      │────────▶│     Observer       │
│                  │         │    <<interface>>   │
│ + subscribe()    │         ├────────────────────┤
│ + unsubscribe()  │         │ + update(data)     │
│ + notify()       │         └────────────────────┘
└──────────────────┘                  △
        │                             │
        │              ┌──────────────┼──────────────┐
        ▼              │              │              │
┌──────────────────┐   │              │              │
│ ConcreteSubject  │   ▼              ▼              ▼
│                  │  ┌────────┐  ┌────────┐  ┌────────┐
│ - state          │  │Observer│  │Observer│  │Observer│
│ - observers[]    │  │   A    │  │   B    │  │   C    │
└──────────────────┘  └────────┘  └────────┘  └────────┘
```

## JavaScript/TypeScript Implementations

### EventEmitter Pattern (Node.js Style)

```typescript
type EventHandler<T = any> = (data: T) => void;

class EventEmitter {
  private events: Map<string, Set<EventHandler>> = new Map();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  once<T>(event: string, handler: EventHandler<T>): () => void {
    const onceHandler: EventHandler<T> = (data) => {
      this.off(event, onceHandler);
      handler(data);
    };
    return this.on(event, onceHandler);
  }

  off(event: string, handler: EventHandler): void {
    this.events.get(event)?.delete(handler);
  }

  emit<T>(event: string, data: T): void {
    this.events.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Usage
class OrderService extends EventEmitter {
  async createOrder(items: OrderItem[]): Promise<Order> {
    const order = new Order(items);
    await order.save();

    // Emit event - observers react
    this.emit('order:created', order);

    return order;
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = await Order.findById(orderId);
    order.status = 'cancelled';
    await order.save();

    this.emit('order:cancelled', order);
  }
}

// Observers subscribe
const orderService = new OrderService();

orderService.on('order:created', (order: Order) => {
  emailService.sendConfirmation(order);
});

orderService.on('order:created', (order: Order) => {
  inventoryService.reserveItems(order.items);
});

orderService.on('order:created', (order: Order) => {
  analyticsService.trackPurchase(order);
});

orderService.on('order:cancelled', (order: Order) => {
  inventoryService.releaseItems(order.items);
  emailService.sendCancellation(order);
});
```

### Pub/Sub with Topics

```typescript
class PubSub<EventMap extends Record<string, any>> {
  private subscribers: Map<keyof EventMap, Set<(data: any) => void>> = new Map();

  subscribe<K extends keyof EventMap>(
    topic: K,
    callback: (data: EventMap[K]) => void
  ): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(callback);

    return () => {
      this.subscribers.get(topic)?.delete(callback);
    };
  }

  publish<K extends keyof EventMap>(topic: K, data: EventMap[K]): void {
    this.subscribers.get(topic)?.forEach(callback => callback(data));
  }
}

// Type-safe event definitions
interface AppEvents {
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string };
  'cart:updated': { items: CartItem[]; total: number };
  'payment:completed': { orderId: string; amount: number };
  'payment:failed': { orderId: string; error: string };
}

const pubsub = new PubSub<AppEvents>();

// Type-safe subscriptions
pubsub.subscribe('user:login', ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

pubsub.subscribe('payment:completed', ({ orderId, amount }) => {
  // TypeScript knows the shape of data
  sendReceipt(orderId, amount);
});

// Type-safe publishing
pubsub.publish('user:login', {
  userId: '123',
  timestamp: new Date()
});

// TypeScript error: Property 'orderId' is missing
// pubsub.publish('payment:completed', { amount: 100 });
```

### Reactive Observables (RxJS Style)

```typescript
type Observer<T> = {
  next: (value: T) => void;
  error?: (error: Error) => void;
  complete?: () => void;
};

type Subscription = {
  unsubscribe: () => void;
};

class Observable<T> {
  constructor(
    private producer: (observer: Observer<T>) => (() => void) | void
  ) {}

  subscribe(observer: Observer<T> | ((value: T) => void)): Subscription {
    const normalizedObserver: Observer<T> =
      typeof observer === 'function'
        ? { next: observer }
        : observer;

    let isUnsubscribed = false;
    const cleanup = this.producer({
      next: (value) => {
        if (!isUnsubscribed) normalizedObserver.next(value);
      },
      error: (error) => {
        if (!isUnsubscribed) normalizedObserver.error?.(error);
      },
      complete: () => {
        if (!isUnsubscribed) normalizedObserver.complete?.();
      }
    });

    return {
      unsubscribe: () => {
        isUnsubscribed = true;
        cleanup?.();
      }
    };
  }

  // Transform operators
  map<U>(fn: (value: T) => U): Observable<U> {
    return new Observable<U>((observer) => {
      const subscription = this.subscribe({
        next: (value) => observer.next(fn(value)),
        error: (error) => observer.error?.(error),
        complete: () => observer.complete?.()
      });
      return () => subscription.unsubscribe();
    });
  }

  filter(predicate: (value: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      const subscription = this.subscribe({
        next: (value) => {
          if (predicate(value)) observer.next(value);
        },
        error: (error) => observer.error?.(error),
        complete: () => observer.complete?.()
      });
      return () => subscription.unsubscribe();
    });
  }

  debounce(ms: number): Observable<T> {
    return new Observable<T>((observer) => {
      let timeoutId: NodeJS.Timeout;
      const subscription = this.subscribe({
        next: (value) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => observer.next(value), ms);
        },
        error: (error) => observer.error?.(error),
        complete: () => observer.complete?.()
      });
      return () => {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    });
  }
}

// Create observables from various sources
function fromEvent(element: EventTarget, event: string): Observable<Event> {
  return new Observable((observer) => {
    const handler = (e: Event) => observer.next(e);
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
  });
}

function interval(ms: number): Observable<number> {
  return new Observable((observer) => {
    let count = 0;
    const id = setInterval(() => observer.next(count++), ms);
    return () => clearInterval(id);
  });
}

// Usage
const searchInput = document.getElementById('search')!;

const subscription = fromEvent(searchInput, 'input')
  .map((e) => (e.target as HTMLInputElement).value)
  .filter((value) => value.length > 2)
  .debounce(300)
  .subscribe({
    next: (searchTerm) => {
      console.log('Searching for:', searchTerm);
      performSearch(searchTerm);
    }
  });

// Later: cleanup
subscription.unsubscribe();
```

### State Store (Redux-like)

```typescript
type Reducer<S, A> = (state: S, action: A) => S;
type Listener = () => void;

class Store<S, A extends { type: string }> {
  private state: S;
  private listeners: Set<Listener> = new Set();

  constructor(
    private reducer: Reducer<S, A>,
    initialState: S
  ) {
    this.state = initialState;
  }

  getState(): S {
    return this.state;
  }

  dispatch(action: A): void {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

// Example: Todo app
interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
  filter: 'all' | 'active' | 'completed';
}

type TodoAction =
  | { type: 'ADD_TODO'; text: string }
  | { type: 'TOGGLE_TODO'; id: number }
  | { type: 'SET_FILTER'; filter: TodoState['filter'] };

const todoReducer: Reducer<TodoState, TodoAction> = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.text, completed: false }
        ]
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.id
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    case 'SET_FILTER':
      return { ...state, filter: action.filter };
    default:
      return state;
  }
};

// Create store
const store = new Store(todoReducer, { todos: [], filter: 'all' });

// Components subscribe to changes
const unsubscribe = store.subscribe(() => {
  const state = store.getState();
  renderTodoList(state.todos, state.filter);
});

// Dispatch actions
store.dispatch({ type: 'ADD_TODO', text: 'Learn Observer Pattern' });
store.dispatch({ type: 'ADD_TODO', text: 'Build something cool' });
store.dispatch({ type: 'TOGGLE_TODO', id: store.getState().todos[0].id });
```

## Real-World Applications

### 1. WebSocket Message Handling

```typescript
class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected', { url });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Emit specific event types
        this.emit(`message:${message.type}`, message.payload);
        // Also emit generic message event
        this.emit('message', message);
      } catch (error) {
        this.emit('error', new Error('Failed to parse message'));
      }
    };

    this.ws.onclose = () => {
      this.emit('disconnected', {});
      this.attemptReconnect(url);
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(url), delay);
    }
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

// Usage
const wsClient = new WebSocketClient();

wsClient.on('connected', () => console.log('WebSocket connected'));
wsClient.on('disconnected', () => console.log('WebSocket disconnected'));

// Subscribe to specific message types
wsClient.on('message:chat', (payload: ChatMessage) => {
  displayChatMessage(payload);
});

wsClient.on('message:notification', (payload: Notification) => {
  showNotification(payload);
});

wsClient.on('message:price_update', (payload: PriceUpdate) => {
  updatePriceDisplay(payload);
});

wsClient.connect('wss://api.example.com/ws');
```

### 2. Form Validation with Observers

```typescript
class FormField extends EventEmitter {
  private _value: string = '';
  private _errors: string[] = [];
  private validators: Array<(value: string) => string | null> = [];

  constructor(
    public readonly name: string,
    validators: Array<(value: string) => string | null> = []
  ) {
    super();
    this.validators = validators;
  }

  get value(): string {
    return this._value;
  }

  set value(newValue: string) {
    const oldValue = this._value;
    this._value = newValue;

    if (oldValue !== newValue) {
      this.emit('change', { field: this.name, value: newValue, oldValue });
      this.validate();
    }
  }

  get errors(): string[] {
    return [...this._errors];
  }

  get isValid(): boolean {
    return this._errors.length === 0;
  }

  validate(): boolean {
    const oldErrors = this._errors;
    this._errors = this.validators
      .map(validator => validator(this._value))
      .filter((error): error is string => error !== null);

    if (JSON.stringify(oldErrors) !== JSON.stringify(this._errors)) {
      this.emit('validation', {
        field: this.name,
        isValid: this.isValid,
        errors: this._errors
      });
    }

    return this.isValid;
  }
}

class Form extends EventEmitter {
  private fields: Map<string, FormField> = new Map();

  addField(field: FormField): void {
    this.fields.set(field.name, field);

    // Forward field events
    field.on('change', (data) => {
      this.emit('fieldChange', data);
      this.emit('change', this.getValues());
    });

    field.on('validation', (data) => {
      this.emit('fieldValidation', data);
      this.emit('validation', {
        isValid: this.isValid,
        errors: this.getAllErrors()
      });
    });
  }

  getField(name: string): FormField | undefined {
    return this.fields.get(name);
  }

  get isValid(): boolean {
    return Array.from(this.fields.values()).every(field => field.isValid);
  }

  getValues(): Record<string, string> {
    const values: Record<string, string> = {};
    this.fields.forEach((field, name) => {
      values[name] = field.value;
    });
    return values;
  }

  getAllErrors(): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    this.fields.forEach((field, name) => {
      if (field.errors.length > 0) {
        errors[name] = field.errors;
      }
    });
    return errors;
  }

  validate(): boolean {
    this.fields.forEach(field => field.validate());
    return this.isValid;
  }
}

// Validators
const required = (value: string) => value.trim() ? null : 'This field is required';
const email = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email address';
const minLength = (min: number) => (value: string) =>
  value.length >= min ? null : `Must be at least ${min} characters`;

// Usage
const signupForm = new Form();

signupForm.addField(new FormField('email', [required, email]));
signupForm.addField(new FormField('password', [required, minLength(8)]));
signupForm.addField(new FormField('name', [required]));

// UI observers
signupForm.on('fieldValidation', ({ field, isValid, errors }) => {
  const errorEl = document.getElementById(`${field}-errors`);
  if (errorEl) {
    errorEl.textContent = errors.join(', ');
    errorEl.classList.toggle('visible', !isValid);
  }
});

signupForm.on('validation', ({ isValid }) => {
  const submitBtn = document.getElementById('submit') as HTMLButtonElement;
  submitBtn.disabled = !isValid;
});

// Autosave observer
signupForm.on('change', (values) => {
  localStorage.setItem('signup-draft', JSON.stringify(values));
});
```

## When to Use

**Use Observer when:**
- Changes to one object require changing others, and you don't know how many
- An object should notify others without making assumptions about who they are
- You need to add/remove listeners at runtime
- You want to decouple the subject from its dependents

**Don't use Observer when:**
- You have a simple one-to-one relationship
- Updates must happen in a specific order (Observer doesn't guarantee order)
- The overhead of the pattern exceeds its benefits

## Common Pitfalls

### Memory Leaks
Always unsubscribe when components are destroyed:

```typescript
class Component {
  private subscriptions: Array<() => void> = [];

  mount() {
    this.subscriptions.push(
      store.subscribe(() => this.render())
    );
    this.subscriptions.push(
      eventBus.on('update', () => this.refresh())
    );
  }

  unmount() {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}
```

### Infinite Loops
Avoid observers that trigger the events they're observing:

```typescript
// BAD: Can cause infinite loop
store.subscribe(() => {
  const state = store.getState();
  if (state.needsSync) {
    store.dispatch({ type: 'SYNC' }); // Triggers another notification!
  }
});

// GOOD: Guard against recursion
let isSyncing = false;
store.subscribe(() => {
  if (isSyncing) return;
  const state = store.getState();
  if (state.needsSync) {
    isSyncing = true;
    store.dispatch({ type: 'SYNC' });
    isSyncing = false;
  }
});
```

## Related Patterns

- **Mediator:** Centralizes communication; Observer decentralizes it
- **Pub/Sub:** Similar but typically has a message broker in between
- **Event Sourcing:** Uses Observer to react to domain events
