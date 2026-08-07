# Mediator Pattern

## Intent

Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly.

## The Problem

Many-to-many relationships between components:
- Components directly reference each other
- Adding components requires modifying many others
- Spaghetti of dependencies
- Hard to reuse components independently

```typescript
// Without Mediator - components tightly coupled
class LoginForm {
  private usernameField: TextField;
  private passwordField: TextField;
  private submitButton: Button;
  private forgotPasswordLink: Link;
  private statusLabel: Label;

  constructor() {
    this.usernameField = new TextField();
    this.passwordField = new TextField();
    this.submitButton = new Button();

    // Direct coupling between components
    this.usernameField.onChange = () => {
      this.submitButton.enabled =
        this.usernameField.value.length > 0 &&
        this.passwordField.value.length > 0;
    };

    this.passwordField.onChange = () => {
      this.submitButton.enabled =
        this.usernameField.value.length > 0 &&
        this.passwordField.value.length > 0;
      // Duplicate logic!
    };

    this.submitButton.onClick = () => {
      this.statusLabel.text = 'Logging in...';
      this.usernameField.enabled = false;
      this.passwordField.enabled = false;
      this.submitButton.enabled = false;
      // Every component knows about every other component
    };
  }
}
```

## The Solution

Centralize component interaction in a mediator:

```typescript
// Mediator interface
interface DialogMediator {
  notify(sender: Component, event: string, data?: any): void;
}

// Base component
abstract class Component {
  protected mediator: DialogMediator;

  setMediator(mediator: DialogMediator): void {
    this.mediator = mediator;
  }
}

// Concrete components - only know about mediator
class TextField extends Component {
  private _value: string = '';
  private _enabled: boolean = true;

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.mediator.notify(this, 'valueChanged', val);
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(val: boolean) {
    this._enabled = val;
  }
}

class Button extends Component {
  private _enabled: boolean = true;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(val: boolean) {
    this._enabled = val;
  }

  click(): void {
    if (this._enabled) {
      this.mediator.notify(this, 'click');
    }
  }
}

class Label extends Component {
  text: string = '';
}

// Concrete mediator - contains all interaction logic
class LoginFormMediator implements DialogMediator {
  private usernameField: TextField;
  private passwordField: TextField;
  private submitButton: Button;
  private statusLabel: Label;

  constructor() {
    this.usernameField = new TextField();
    this.passwordField = new TextField();
    this.submitButton = new Button();
    this.statusLabel = new Label();

    // Register this mediator with all components
    this.usernameField.setMediator(this);
    this.passwordField.setMediator(this);
    this.submitButton.setMediator(this);
    this.statusLabel.setMediator(this);

    this.submitButton.enabled = false;
  }

  notify(sender: Component, event: string, data?: any): void {
    if (event === 'valueChanged') {
      this.validateForm();
    }

    if (sender === this.submitButton && event === 'click') {
      this.handleSubmit();
    }
  }

  private validateForm(): void {
    const isValid =
      this.usernameField.value.length > 0 &&
      this.passwordField.value.length > 0;
    this.submitButton.enabled = isValid;
  }

  private handleSubmit(): void {
    this.statusLabel.text = 'Logging in...';
    this.usernameField.enabled = false;
    this.passwordField.enabled = false;
    this.submitButton.enabled = false;

    // Perform login...
  }
}
```

## Event-Based Mediator

```typescript
type EventHandler = (data: any) => void;

class EventMediator {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  subscribe(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  publish(event: string, data?: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}

// Components use mediator for communication
class ShoppingCart {
  constructor(private mediator: EventMediator) {
    this.mediator.subscribe('product:added', (product) => {
      this.addItem(product);
    });

    this.mediator.subscribe('product:removed', (productId) => {
      this.removeItem(productId);
    });
  }

  private addItem(product: Product): void {
    // Add to cart
    this.mediator.publish('cart:updated', this.items);
  }

  private removeItem(productId: string): void {
    // Remove from cart
    this.mediator.publish('cart:updated', this.items);
  }
}

class CartDisplay {
  constructor(private mediator: EventMediator) {
    this.mediator.subscribe('cart:updated', (items) => {
      this.render(items);
    });
  }

  private render(items: CartItem[]): void {
    // Update display
  }
}

class CartTotal {
  constructor(private mediator: EventMediator) {
    this.mediator.subscribe('cart:updated', (items) => {
      this.updateTotal(items);
    });
  }

  private updateTotal(items: CartItem[]): void {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.mediator.publish('cart:totalChanged', total);
  }
}

// Setup
const mediator = new EventMediator();
const cart = new ShoppingCart(mediator);
const display = new CartDisplay(mediator);
const total = new CartTotal(mediator);

// Adding a product triggers the chain
mediator.publish('product:added', { id: '1', name: 'Widget', price: 9.99 });
```

## Chat Room Mediator

```typescript
interface ChatRoom {
  register(user: ChatUser): void;
  send(message: string, from: ChatUser, to?: ChatUser): void;
}

class ChatUser {
  constructor(
    public name: string,
    private chatRoom: ChatRoom
  ) {
    chatRoom.register(this);
  }

  send(message: string, to?: ChatUser): void {
    this.chatRoom.send(message, this, to);
  }

  receive(message: string, from: ChatUser): void {
    console.log(`${from.name} to ${this.name}: ${message}`);
  }
}

class ChatRoomMediator implements ChatRoom {
  private users: Map<string, ChatUser> = new Map();

  register(user: ChatUser): void {
    this.users.set(user.name, user);
    this.broadcast(`${user.name} joined the chat`, user);
  }

  send(message: string, from: ChatUser, to?: ChatUser): void {
    if (to) {
      // Private message
      to.receive(message, from);
    } else {
      // Broadcast to all
      this.broadcast(message, from);
    }
  }

  private broadcast(message: string, from: ChatUser): void {
    for (const [name, user] of this.users) {
      if (user !== from) {
        user.receive(message, from);
      }
    }
  }
}

// Usage
const chatRoom = new ChatRoomMediator();

const alice = new ChatUser('Alice', chatRoom);
const bob = new ChatUser('Bob', chatRoom);
const charlie = new ChatUser('Charlie', chatRoom);

alice.send('Hello everyone!');        // Broadcast
bob.send('Hi Alice!', alice);         // Private message
charlie.send('Hey!');                 // Broadcast
```

## Air Traffic Control

```typescript
interface AirTrafficControl {
  registerFlight(flight: Flight): void;
  requestLanding(flight: Flight): boolean;
  requestTakeoff(flight: Flight): boolean;
  notifyPosition(flight: Flight, position: Position): void;
}

class Flight {
  constructor(
    public flightNumber: string,
    private atc: AirTrafficControl
  ) {
    atc.registerFlight(this);
  }

  requestLanding(): boolean {
    return this.atc.requestLanding(this);
  }

  requestTakeoff(): boolean {
    return this.atc.requestTakeoff(this);
  }

  reportPosition(position: Position): void {
    this.atc.notifyPosition(this, position);
  }

  receive(message: string): void {
    console.log(`${this.flightNumber} received: ${message}`);
  }
}

class Tower implements AirTrafficControl {
  private flights: Map<string, Flight> = new Map();
  private runwayInUse: boolean = false;
  private landingQueue: Flight[] = [];
  private positions: Map<string, Position> = new Map();

  registerFlight(flight: Flight): void {
    this.flights.set(flight.flightNumber, flight);
    console.log(`Tower: ${flight.flightNumber} registered`);
  }

  requestLanding(flight: Flight): boolean {
    if (this.runwayInUse) {
      this.landingQueue.push(flight);
      flight.receive('Hold position, runway in use');
      return false;
    }

    // Check for conflicts
    if (this.hasConflict(flight)) {
      flight.receive('Unable to clear, traffic conflict');
      return false;
    }

    this.runwayInUse = true;
    flight.receive('Cleared to land runway 27L');

    // Simulate landing completion
    setTimeout(() => {
      this.runwayInUse = false;
      this.processQueue();
    }, 5000);

    return true;
  }

  requestTakeoff(flight: Flight): boolean {
    if (this.runwayInUse) {
      flight.receive('Hold short, runway in use');
      return false;
    }

    this.runwayInUse = true;
    flight.receive('Cleared for takeoff runway 27L');

    setTimeout(() => {
      this.runwayInUse = false;
      this.processQueue();
    }, 3000);

    return true;
  }

  notifyPosition(flight: Flight, position: Position): void {
    this.positions.set(flight.flightNumber, position);

    // Check for potential conflicts
    for (const [otherFlight, otherPos] of this.positions) {
      if (otherFlight !== flight.flightNumber) {
        if (this.tooClose(position, otherPos)) {
          const other = this.flights.get(otherFlight);
          flight.receive('Traffic alert, adjust heading');
          other?.receive('Traffic alert, adjust heading');
        }
      }
    }
  }

  private hasConflict(flight: Flight): boolean {
    // Check if any other flight is too close
    return false;
  }

  private tooClose(a: Position, b: Position): boolean {
    // Calculate distance
    return false;
  }

  private processQueue(): void {
    if (this.landingQueue.length > 0 && !this.runwayInUse) {
      const next = this.landingQueue.shift()!;
      this.requestLanding(next);
    }
  }
}
```

## Redux-Style State Mediator

```typescript
type Action = { type: string; payload?: any };
type Reducer<S> = (state: S, action: Action) => S;
type Subscriber<S> = (state: S) => void;
type Middleware<S> = (
  store: Store<S>
) => (next: (action: Action) => void) => (action: Action) => void;

class Store<S> {
  private state: S;
  private subscribers: Set<Subscriber<S>> = new Set();
  private reducer: Reducer<S>;

  constructor(reducer: Reducer<S>, initialState: S, middlewares: Middleware<S>[] = []) {
    this.reducer = reducer;
    this.state = initialState;

    // Apply middlewares
    let dispatch = (action: Action) => this.baseDispatch(action);
    for (const middleware of middlewares.reverse()) {
      dispatch = middleware(this)(() => dispatch)(action => dispatch(action));
    }
    this.dispatch = dispatch;
  }

  getState(): S {
    return this.state;
  }

  dispatch: (action: Action) => void;

  private baseDispatch(action: Action): void {
    this.state = this.reducer(this.state, action);
    this.subscribers.forEach(sub => sub(this.state));
  }

  subscribe(subscriber: Subscriber<S>): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
}

// Usage
interface AppState {
  user: User | null;
  cart: CartItem[];
  notifications: Notification[];
}

const reducer: Reducer<AppState> = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, cart: [] };
    case 'ADD_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
    case 'NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    default:
      return state;
  }
};

// Logging middleware
const logger: Middleware<AppState> = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  next(action);
  console.log('New state:', store.getState());
};

const store = new Store(reducer, { user: null, cart: [], notifications: [] }, [logger]);

// Components subscribe to state
store.subscribe((state) => {
  renderCart(state.cart);
});

store.subscribe((state) => {
  renderNotifications(state.notifications);
});

// Dispatch actions - all subscribers update
store.dispatch({ type: 'LOGIN', payload: { id: '1', name: 'John' } });
store.dispatch({ type: 'ADD_TO_CART', payload: { productId: '1', quantity: 2 } });
```

## When to Use

**Use Mediator when:**
- Objects communicate in complex ways
- Reusing objects is difficult due to dependencies
- You want to customize behavior without subclassing
- Many-to-many relationships between components

**Don't use Mediator when:**
- Objects have simple one-way relationships
- Direct communication is clearer
- Mediator would become a "god object"

## Related Patterns

- **Observer:** Mediator often uses Observer for component communication
- **Facade:** Mediator coordinates peer objects; Facade provides unified interface to subsystem
- **Command:** Commands can be routed through a mediator
