# State Pattern

## Intent

Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.

## The Problem

Complex conditional logic based on state:
- Methods filled with if/switch on status
- Same checks duplicated everywhere
- Adding new states requires modifying multiple methods
- Invalid state transitions possible

```typescript
// Without State Pattern - conditionals everywhere
class Order {
  private status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

  cancel(): void {
    if (this.status === 'pending') {
      this.status = 'cancelled';
    } else if (this.status === 'paid') {
      this.refund();
      this.status = 'cancelled';
    } else if (this.status === 'shipped') {
      throw new Error('Cannot cancel shipped order');
    } else if (this.status === 'delivered') {
      throw new Error('Cannot cancel delivered order');
    } else if (this.status === 'cancelled') {
      throw new Error('Order already cancelled');
    }
  }

  ship(): void {
    if (this.status === 'pending') {
      throw new Error('Order not paid');
    } else if (this.status === 'paid') {
      this.status = 'shipped';
      this.notifyShipped();
    } else if (this.status === 'shipped') {
      throw new Error('Already shipped');
    }
    // ... more conditions
  }

  // Every method has similar conditionals
}
```

## The Solution

Encapsulate state-specific behavior in separate classes:

```typescript
// State interface
interface OrderState {
  cancel(order: Order): void;
  pay(order: Order): void;
  ship(order: Order): void;
  deliver(order: Order): void;
  getStatus(): string;
}

// Concrete states
class PendingState implements OrderState {
  getStatus(): string {
    return 'pending';
  }

  cancel(order: Order): void {
    order.setState(new CancelledState());
    order.notifyCancellation();
  }

  pay(order: Order): void {
    order.setState(new PaidState());
    order.notifyPaymentReceived();
  }

  ship(order: Order): void {
    throw new InvalidStateError('Cannot ship unpaid order');
  }

  deliver(order: Order): void {
    throw new InvalidStateError('Cannot deliver unpaid order');
  }
}

class PaidState implements OrderState {
  getStatus(): string {
    return 'paid';
  }

  cancel(order: Order): void {
    order.processRefund();
    order.setState(new CancelledState());
    order.notifyCancellation();
  }

  pay(order: Order): void {
    throw new InvalidStateError('Order already paid');
  }

  ship(order: Order): void {
    order.setState(new ShippedState());
    order.notifyShipped();
  }

  deliver(order: Order): void {
    throw new InvalidStateError('Order not shipped yet');
  }
}

class ShippedState implements OrderState {
  getStatus(): string {
    return 'shipped';
  }

  cancel(order: Order): void {
    throw new InvalidStateError('Cannot cancel shipped order');
  }

  pay(order: Order): void {
    throw new InvalidStateError('Order already paid');
  }

  ship(order: Order): void {
    throw new InvalidStateError('Order already shipped');
  }

  deliver(order: Order): void {
    order.setState(new DeliveredState());
    order.notifyDelivered();
  }
}

class DeliveredState implements OrderState {
  getStatus(): string {
    return 'delivered';
  }

  cancel(order: Order): void {
    throw new InvalidStateError('Cannot cancel delivered order');
  }

  pay(order: Order): void {
    throw new InvalidStateError('Order already paid');
  }

  ship(order: Order): void {
    throw new InvalidStateError('Order already delivered');
  }

  deliver(order: Order): void {
    throw new InvalidStateError('Order already delivered');
  }
}

class CancelledState implements OrderState {
  getStatus(): string {
    return 'cancelled';
  }

  cancel(order: Order): void {
    throw new InvalidStateError('Order already cancelled');
  }

  pay(order: Order): void {
    throw new InvalidStateError('Cannot pay cancelled order');
  }

  ship(order: Order): void {
    throw new InvalidStateError('Cannot ship cancelled order');
  }

  deliver(order: Order): void {
    throw new InvalidStateError('Cannot deliver cancelled order');
  }
}

// Context class
class Order {
  private state: OrderState;

  constructor() {
    this.state = new PendingState();
  }

  setState(state: OrderState): void {
    console.log(`Order: Transitioning from ${this.state.getStatus()} to ${state.getStatus()}`);
    this.state = state;
  }

  getStatus(): string {
    return this.state.getStatus();
  }

  // Delegate to current state
  cancel(): void {
    this.state.cancel(this);
  }

  pay(): void {
    this.state.pay(this);
  }

  ship(): void {
    this.state.ship(this);
  }

  deliver(): void {
    this.state.deliver(this);
  }

  // Internal methods called by states
  processRefund(): void { /* ... */ }
  notifyPaymentReceived(): void { /* ... */ }
  notifyShipped(): void { /* ... */ }
  notifyDelivered(): void { /* ... */ }
  notifyCancellation(): void { /* ... */ }
}

// Usage
const order = new Order();
console.log(order.getStatus()); // 'pending'

order.pay();
console.log(order.getStatus()); // 'paid'

order.ship();
console.log(order.getStatus()); // 'shipped'

order.deliver();
console.log(order.getStatus()); // 'delivered'

order.cancel(); // Throws: Cannot cancel delivered order
```

## State Machine with Transitions

```typescript
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
type OrderAction = 'pay' | 'ship' | 'deliver' | 'cancel';

interface Transition {
  from: OrderStatus;
  to: OrderStatus;
  action: OrderAction;
  guard?: (order: Order) => boolean;
  effect?: (order: Order) => void;
}

class OrderStateMachine {
  private transitions: Transition[] = [
    {
      from: 'pending',
      to: 'paid',
      action: 'pay',
      effect: (order) => order.recordPayment()
    },
    {
      from: 'pending',
      to: 'cancelled',
      action: 'cancel'
    },
    {
      from: 'paid',
      to: 'shipped',
      action: 'ship',
      guard: (order) => order.hasShippingAddress(),
      effect: (order) => order.createShipment()
    },
    {
      from: 'paid',
      to: 'cancelled',
      action: 'cancel',
      effect: (order) => order.processRefund()
    },
    {
      from: 'shipped',
      to: 'delivered',
      action: 'deliver',
      effect: (order) => order.confirmDelivery()
    }
  ];

  canTransition(order: Order, action: OrderAction): boolean {
    const transition = this.findTransition(order.status, action);
    if (!transition) return false;
    if (transition.guard && !transition.guard(order)) return false;
    return true;
  }

  transition(order: Order, action: OrderAction): void {
    const transition = this.findTransition(order.status, action);

    if (!transition) {
      throw new InvalidStateError(
        `Cannot ${action} order in ${order.status} state`
      );
    }

    if (transition.guard && !transition.guard(order)) {
      throw new InvalidStateError(`Guard condition not met for ${action}`);
    }

    // Execute side effect
    if (transition.effect) {
      transition.effect(order);
    }

    // Update state
    order.status = transition.to;
  }

  getAvailableActions(order: Order): OrderAction[] {
    return this.transitions
      .filter(t => t.from === order.status)
      .filter(t => !t.guard || t.guard(order))
      .map(t => t.action);
  }

  private findTransition(
    from: OrderStatus,
    action: OrderAction
  ): Transition | undefined {
    return this.transitions.find(
      t => t.from === from && t.action === action
    );
  }
}

// Usage
const stateMachine = new OrderStateMachine();
const order = new Order();

console.log(stateMachine.getAvailableActions(order)); // ['pay', 'cancel']

stateMachine.transition(order, 'pay');
console.log(order.status); // 'paid'
console.log(stateMachine.getAvailableActions(order)); // ['ship', 'cancel']
```

## Connection State Example

```typescript
interface ConnectionState {
  connect(connection: Connection): void;
  disconnect(connection: Connection): void;
  send(connection: Connection, data: string): void;
  receive(connection: Connection): string | null;
}

class DisconnectedState implements ConnectionState {
  connect(connection: Connection): void {
    console.log('Connecting...');
    connection.socket = new WebSocket(connection.url);

    connection.socket.onopen = () => {
      connection.setState(new ConnectedState());
    };

    connection.socket.onerror = () => {
      connection.setState(new ErrorState());
    };

    connection.setState(new ConnectingState());
  }

  disconnect(connection: Connection): void {
    // Already disconnected
  }

  send(connection: Connection, data: string): void {
    throw new Error('Cannot send: not connected');
  }

  receive(connection: Connection): string | null {
    throw new Error('Cannot receive: not connected');
  }
}

class ConnectingState implements ConnectionState {
  connect(connection: Connection): void {
    console.log('Already connecting...');
  }

  disconnect(connection: Connection): void {
    connection.socket?.close();
    connection.setState(new DisconnectedState());
  }

  send(connection: Connection, data: string): void {
    // Queue the message for when connected
    connection.pendingMessages.push(data);
  }

  receive(connection: Connection): string | null {
    return null;
  }
}

class ConnectedState implements ConnectionState {
  connect(connection: Connection): void {
    console.log('Already connected');
  }

  disconnect(connection: Connection): void {
    connection.socket?.close();
    connection.setState(new DisconnectedState());
  }

  send(connection: Connection, data: string): void {
    connection.socket?.send(data);
  }

  receive(connection: Connection): string | null {
    return connection.messageQueue.shift() ?? null;
  }
}

class ErrorState implements ConnectionState {
  connect(connection: Connection): void {
    // Retry connection
    connection.setState(new DisconnectedState());
    connection.connect();
  }

  disconnect(connection: Connection): void {
    connection.setState(new DisconnectedState());
  }

  send(connection: Connection, data: string): void {
    throw new Error('Connection error: cannot send');
  }

  receive(connection: Connection): string | null {
    throw new Error('Connection error: cannot receive');
  }
}

class Connection {
  socket: WebSocket | null = null;
  url: string;
  pendingMessages: string[] = [];
  messageQueue: string[] = [];
  private state: ConnectionState;

  constructor(url: string) {
    this.url = url;
    this.state = new DisconnectedState();
  }

  setState(state: ConnectionState): void {
    this.state = state;

    // Flush pending messages when connected
    if (state instanceof ConnectedState) {
      while (this.pendingMessages.length > 0) {
        this.send(this.pendingMessages.shift()!);
      }
    }
  }

  connect(): void {
    this.state.connect(this);
  }

  disconnect(): void {
    this.state.disconnect(this);
  }

  send(data: string): void {
    this.state.send(this, data);
  }

  receive(): string | null {
    return this.state.receive(this);
  }
}
```

## Document Workflow Example

```typescript
interface DocumentState {
  edit(doc: Document, content: string): void;
  submit(doc: Document): void;
  approve(doc: Document): void;
  reject(doc: Document, reason: string): void;
  publish(doc: Document): void;
}

class DraftState implements DocumentState {
  edit(doc: Document, content: string): void {
    doc.content = content;
    doc.lastModified = new Date();
  }

  submit(doc: Document): void {
    if (!doc.content.trim()) {
      throw new Error('Cannot submit empty document');
    }
    doc.setState(new PendingReviewState());
  }

  approve(doc: Document): void {
    throw new Error('Draft cannot be approved directly');
  }

  reject(doc: Document, reason: string): void {
    throw new Error('Draft cannot be rejected');
  }

  publish(doc: Document): void {
    throw new Error('Draft cannot be published directly');
  }
}

class PendingReviewState implements DocumentState {
  edit(doc: Document, content: string): void {
    throw new Error('Cannot edit during review');
  }

  submit(doc: Document): void {
    throw new Error('Already submitted');
  }

  approve(doc: Document): void {
    doc.setState(new ApprovedState());
    doc.approvedAt = new Date();
  }

  reject(doc: Document, reason: string): void {
    doc.rejectionReason = reason;
    doc.setState(new DraftState());
  }

  publish(doc: Document): void {
    throw new Error('Must be approved before publishing');
  }
}

class ApprovedState implements DocumentState {
  edit(doc: Document, content: string): void {
    // Editing approved doc sends back to draft
    doc.content = content;
    doc.setState(new DraftState());
  }

  submit(doc: Document): void {
    throw new Error('Already approved');
  }

  approve(doc: Document): void {
    throw new Error('Already approved');
  }

  reject(doc: Document, reason: string): void {
    throw new Error('Cannot reject approved document');
  }

  publish(doc: Document): void {
    doc.publishedAt = new Date();
    doc.setState(new PublishedState());
  }
}

class PublishedState implements DocumentState {
  edit(doc: Document, content: string): void {
    // Create new version
    doc.createRevision();
    doc.content = content;
    doc.setState(new DraftState());
  }

  submit(doc: Document): void {
    throw new Error('Already published');
  }

  approve(doc: Document): void {
    throw new Error('Already published');
  }

  reject(doc: Document, reason: string): void {
    throw new Error('Cannot reject published document');
  }

  publish(doc: Document): void {
    throw new Error('Already published');
  }
}
```

## When to Use

**Use State Pattern when:**
- Object behavior depends on its state
- State-specific behavior is complex
- You have many conditionals based on state
- State transitions have specific rules

**Don't use State Pattern when:**
- Only 2-3 simple states
- State logic is straightforward
- No complex transitions or rules

## Related Patterns

- **Strategy:** State changes behavior based on internal state; Strategy based on external choice
- **State Machine:** Declarative approach to the same problem
- **Command:** Can be combined to queue state-changing operations
